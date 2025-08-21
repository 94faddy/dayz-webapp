// server/api/admin/player-queue/clear.post.js
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
  const { steamId } = body
  
  if (!steamId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Steam ID is required'
    })
  }
  
  const config = useRuntimeConfig()
  
  try {
    console.log(`🔄 Clearing queue for Steam ID: ${steamId}`)
    
    // Clear queue using DayZ API
    const response = await $fetch(`${config.dzsvApi}/v1/itemgiver/player/${steamId}/clear`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': config.dzsvApiKey
      },
      timeout: 10000
    })
    
    console.log('✅ DayZ API Clear Queue Response:', response)
    
    // Log admin activity
    await logAdminActivity(
      admin.id,
      'clear_player_queue',
      'player_queue',
      steamId,
      `Cleared all items from player queue`,
      null,
      { steamId },
      ip
    )
    
    return {
      success: true,
      message: response.message || 'Player queue cleared successfully',
      response: response
    }
  } catch (error) {
    console.error('❌ Clear player queue error:', error)
    
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.data?.message || error.message || 'Failed to clear player queue'
    })
  }
})