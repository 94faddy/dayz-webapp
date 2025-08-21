// server/api/admin/player-queue/[steamId].js
import { requireAdminAuth } from '~/server/utils/admin-middleware.js'
import { hasAdminPermission, logAdminActivity } from '~/utils/admin-auth.js'
import { getHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const admin = await requireAdminAuth(event)
  const method = event.node.req.method
  const steamId = getRouterParam(event, 'steamId')
  
  // Get IP for logging
  const ip = getHeader(event, 'x-forwarded-for') || 
             getHeader(event, 'x-real-ip') || 
             event.node?.req?.connection?.remoteAddress ||
             '127.0.0.1'
  
  // Check permission
  if (!await hasAdminPermission(admin.id, 'orders:read')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  const config = useRuntimeConfig()
  
  try {
    if (method === 'GET') {
      // Get player queue from DayZ API
      console.log(`🔍 Fetching player queue for Steam ID: ${steamId}`)
      
      const response = await $fetch(`${config.dzsvApi}/v1/itemgiver/player/${steamId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': config.dzsvApiKey
        },
        timeout: 10000
      })
      
      console.log('✅ DayZ API Queue Response:', response)
      
      return {
        success: true,
        steamId: steamId,
        queue: response.items || response.queue || [],
        playerName: response.playerName || response.player_name || 'Unknown'
      }
    } else {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method not allowed'
      })
    }
  } catch (error) {
    console.error('❌ Player queue API error:', error)
    
    // Return empty queue on error
    return {
      success: true,
      steamId: steamId,
      queue: [],
      playerName: 'Unknown',
      error: error.message
    }
  }
})