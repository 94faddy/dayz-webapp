// server/api/admin/player-queue/index.js
import { requireAdminAuth } from '~/server/utils/admin-middleware.js'
import { hasAdminPermission, logAdminActivity } from '~/utils/admin-auth.js'
import { getHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const admin = await requireAdminAuth(event)
  const method = event.node.req.method
  
  // Get IP for logging
  const ip = getHeader(event, 'x-forwarded-for') || 
             getHeader(event, 'x-real-ip') || 
             event.node?.req?.connection?.remoteAddress ||
             '127.0.0.1'
  
  switch (method) {
    case 'POST':
      return await addItemToQueue(event, admin, ip)
    case 'PUT':
      return await updateQueueItem(event, admin, ip)
    case 'DELETE':
      return await removeQueueItem(event, admin, ip)
    default:
      throw createError({
        statusCode: 405,
        statusMessage: 'Method not allowed'
      })
  }
})

async function addItemToQueue(event, admin, ip) {
  // Check permission
  if (!await hasAdminPermission(admin.id, 'orders:write')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  const body = await readBody(event)
  const { steamId, item } = body
  
  if (!steamId || !item || !item.classname) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Steam ID and item with classname are required'
    })
  }
  
  const config = useRuntimeConfig()
  
  try {
    console.log(`🔄 Adding item to queue for Steam ID: ${steamId}`, item)
    
    // Add item using DayZ API
    const response = await $fetch(`${config.dzsvApi}/v1/itemgiver/add-item`, {
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
    
    console.log('✅ DayZ API Add Item Response:', response)
    
    // Log admin activity
    await logAdminActivity(
      admin.id,
      'add_item_to_queue',
      'player_queue',
      steamId,
      `Added item ${item.classname} to player queue`,
      null,
      { steamId, item },
      ip
    )
    
    return {
      success: true,
      message: response.message || 'Item added to queue successfully',
      response: response
    }
  } catch (error) {
    console.error('❌ Add item to queue error:', error)
    
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.data?.message || error.message || 'Failed to add item to queue'
    })
  }
}

async function updateQueueItem(event, admin, ip) {
  // Check permission
  if (!await hasAdminPermission(admin.id, 'orders:write')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  const body = await readBody(event)
  const { steamId, itemIndex, item } = body
  
  if (!steamId || itemIndex === undefined || !item) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Steam ID, item index, and item data are required'
    })
  }
  
  const config = useRuntimeConfig()
  
  try {
    console.log(`🔄 Updating queue item ${itemIndex} for Steam ID: ${steamId}`, item)
    
    // First get current queue
    const currentQueueResponse = await $fetch(`${config.dzsvApi}/v1/itemgiver/player/${steamId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': config.dzsvApiKey
      }
    })
    
    const currentQueue = currentQueueResponse.items || []
    
    if (itemIndex >= currentQueue.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid item index'
      })
    }
    
    // Update the item by replacing the entire queue
    const updatedQueue = [...currentQueue]
    updatedQueue[itemIndex] = {
      classname: item.classname,
      quantity: item.quantity || 1,
      attachments: item.attachments || []
    }
    
    // Replace queue using DayZ API
    const response = await $fetch(`${config.dzsvApi}/v1/itemgiver/player/${steamId}`, {
      method: 'PUT',
      headers: {
        'X-API-Key': config.dzsvApiKey,
        'Content-Type': 'application/json'
      },
      body: {
        items: updatedQueue
      }
    })
    
    console.log('✅ DayZ API Update Queue Response:', response)
    
    // Log admin activity
    await logAdminActivity(
      admin.id,
      'update_queue_item',
      'player_queue',
      steamId,
      `Updated queue item ${itemIndex} for player`,
      currentQueue[itemIndex],
      item,
      ip
    )
    
    return {
      success: true,
      message: 'Queue item updated successfully',
      response: response
    }
  } catch (error) {
    console.error('❌ Update queue item error:', error)
    
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.data?.message || error.message || 'Failed to update queue item'
    })
  }
}

async function removeQueueItem(event, admin, ip) {
  // Check permission
  if (!await hasAdminPermission(admin.id, 'orders:write')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  const body = await readBody(event)
  const { steamId, itemIndex } = body
  
  if (!steamId || itemIndex === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Steam ID and item index are required'
    })
  }
  
  const config = useRuntimeConfig()
  
  try {
    console.log(`🔄 Removing queue item ${itemIndex} for Steam ID: ${steamId}`)
    
    // Remove item using DayZ API
    const response = await $fetch(`${config.dzsvApi}/v1/itemgiver/player/${steamId}/item/${itemIndex}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': config.dzsvApiKey
      }
    })
    
    console.log('✅ DayZ API Remove Item Response:', response)
    
    // Log admin activity
    await logAdminActivity(
      admin.id,
      'remove_queue_item',
      'player_queue',
      steamId,
      `Removed queue item ${itemIndex} for player`,
      null,
      { steamId, itemIndex },
      ip
    )
    
    return {
      success: true,
      message: response.message || 'Item removed from queue successfully',
      response: response
    }
  } catch (error) {
    console.error('❌ Remove queue item error:', error)
    
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.data?.message || error.message || 'Failed to remove item from queue'
    })
  }
}