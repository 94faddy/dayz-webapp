// server/api/admin/retry-delivery.post.js
import { requireAdminAuth } from '~/server/utils/admin-middleware.js'
import { hasAdminPermission, logAdminActivity } from '~/utils/admin-auth.js'
import { getHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const admin = await requireAdminAuth(event)
  
  // Check permission
  if (!await hasAdminPermission(admin.id, 'orders:write')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  // Get IP for logging
  const ip = getHeader(event, 'x-forwarded-for') || 
             getHeader(event, 'x-real-ip') || 
             event.node?.req?.connection?.remoteAddress ||
             '127.0.0.1'
  
  const body = await readBody(event)
  const { recordId, steamId, item } = body
  
  if (!steamId || !item) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Steam ID and item data are required'
    })
  }
  
  const config = useRuntimeConfig()
  
  try {
    console.log(`🔄 Retrying delivery for Steam ID: ${steamId}`, item)
    
    // Use force retry API endpoint if available
    let response
    
    if (recordId) {
      // Try to use force retry endpoint first
      try {
        response = await $fetch(`${config.dzsvApi}/v1/itemgiver/player/${steamId}/force-retry`, {
          method: 'POST',
          headers: {
            'X-API-Key': config.dzsvApiKey,
            'Content-Type': 'application/json'
          },
          body: {
            recordId: recordId
          },
          timeout: 15000
        })
        
        console.log('✅ DayZ API Force Retry Response:', response)
      } catch (forceRetryError) {
        console.log('⚠️ Force retry failed, falling back to add item:', forceRetryError.message)
        response = null
      }
    }
    
    // If force retry failed or not available, add item again
    if (!response || !response.success) {
      response = await $fetch(`${config.dzsvApi}/v1/itemgiver/add-item`, {
        method: 'POST',
        headers: {
          'X-API-Key': config.dzsvApiKey,
          'Content-Type': 'application/json'
        },
        body: {
          steamId: steamId,
          item: {
            classname: item.classname,
            quantity: item.quantity || 1,
            attachments: item.attachments || []
          }
        },
        timeout: 15000
      })
      
      console.log('✅ DayZ API Add Item (Retry) Response:', response)
    }
    
    // Log admin activity
    await logAdminActivity(
      admin.id,
      'retry_delivery',
      'delivery',
      recordId || steamId,
      `Retried delivery for ${item.classname}`,
      null,
      { steamId, item, recordId },
      ip
    )
    
    return {
      success: true,
      message: response.message || 'Delivery retry initiated successfully',
      response: response
    }
  } catch (error) {
    console.error('❌ Retry delivery error:', error)
    
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.data?.message || error.message || 'Failed to retry delivery'
    })
  }
})