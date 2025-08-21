// server/api/admin/history/index.js
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
    case 'GET':
      return await getHistory(event, admin)
    case 'DELETE':
      return await deleteHistoryRecord(event, admin, ip)
    default:
      throw createError({
        statusCode: 405,
        statusMessage: 'Method not allowed'
      })
  }
})

async function getHistory(event, admin) {
  // Check permission
  if (!await hasAdminPermission(admin.id, 'orders:read')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  try {
    const config = useRuntimeConfig()
    const query = getQuery(event)
    
    console.log('🔍 Fetching history from DayZ API with params:', query)
    
    // Prepare API query parameters
    const apiQuery = {
      page: query.page || 1,
      limit: query.limit || 100
    }
    
    // Add search parameters
    if (query.steamId) {
      apiQuery.steamId = query.steamId
    }
    
    if (query.playerName) {
      apiQuery.playerName = query.playerName
    }
    
    if (query.status) {
      apiQuery.status = query.status
    }
    
    if (query.source) {
      apiQuery.source = query.source
    }
    
    if (query.startDate) {
      apiQuery.startDate = query.startDate
    }
    
    if (query.endDate) {
      apiQuery.endDate = query.endDate
    }
    
    // Handle player search - could be Steam ID or name
    if (query.player) {
      // Check if it's a Steam ID (17 digits starting with 7656119) or player name
      if (/^7656119[0-9]{10}$/.test(query.player)) {
        apiQuery.steamId = query.player
      } else {
        apiQuery.playerName = query.player
      }
    }
    
    console.log('🔍 Fetching history from DayZ API:', `${config.dzsvApi}/v1/itemgiver/history`)
    
    // Forward request to DayZ API with admin authentication
    const historyResponse = await $fetch(`${config.dzsvApi}/v1/itemgiver/history`, {
      method: 'GET',
      headers: {
        'X-API-Key': config.dzsvApiKey
      },
      query: apiQuery,
      timeout: 15000
    })
    
    console.log('✅ DayZ API History Response:', historyResponse)
    
    // Transform API response to match frontend expectations
    if (historyResponse && historyResponse.history && Array.isArray(historyResponse.history)) {
      const transformedHistory = historyResponse.history.map(record => ({
        id: record.id,
        steamId: record.steam_id || record.steamId,
        playerName: record.player_name || record.playerName || 'Unknown',
        item: {
          classname: record.item_classname || record.classname,
          quantity: record.item_quantity || record.quantity || 1,
          attachments: record.attachments || []
        },
        status: record.status,
        deliveredAt: record.delivered_at || record.deliveredAt,
        queuedAt: record.created_at || record.queuedAt,
        failedAt: record.status === 'failed' ? (record.failed_at || record.updated_at) : null,
        attempts: record.attempts || 1,
        source: record.source || 'api',
        orderId: record.order_id || record.orderId || 'N/A',
        error: record.error_message || record.error
      }))
      
      console.log(`✅ Transformed ${transformedHistory.length} history records`)
      
      return {
        success: true,
        history: transformedHistory,
        pagination: {
          page: parseInt(query.page) || 1,
          limit: parseInt(query.limit) || 100,
          total: historyResponse.total_records || transformedHistory.length,
          totalPages: Math.ceil((historyResponse.total_records || transformedHistory.length) / (parseInt(query.limit) || 100))
        },
        stats: {
          total: historyResponse.total_records || transformedHistory.length,
          delivered: historyResponse.stats?.delivered || transformedHistory.filter(h => h.status === 'delivered').length,
          pending: historyResponse.stats?.pending || transformedHistory.filter(h => h.status === 'pending').length,
          failed: historyResponse.stats?.failed || transformedHistory.filter(h => h.status === 'failed').length
        }
      }
    } else {
      console.warn('⚠️ DayZ API returned unexpected format:', historyResponse)
      throw new Error('API returned unexpected response format')
    }
    
  } catch (error) {
    console.error('❌ History API error:', error)
    
    // Try to get data from our own database as fallback
    try {
      console.log('🔄 Falling back to local database...')
      
      const { executeQuery } = await import('~/utils/database.js')
      const query = getQuery(event)
      
      // Build WHERE conditions for search
      const whereConditions = []
      const queryParams = []
      
      // Search by Steam ID or Player Name
      if (query.steamId) {
        whereConditions.push('u.steamid64 = ?')
        queryParams.push(query.steamId)
      } else if (query.playerName) {
        whereConditions.push('u.name LIKE ?')
        queryParams.push(`%${query.playerName}%`)
      } else if (query.player) {
        // Handle combined player search
        if (/^7656119[0-9]{10}$/.test(query.player)) {
          whereConditions.push('u.steamid64 = ?')
          queryParams.push(query.player)
        } else {
          whereConditions.push('u.name LIKE ?')
          queryParams.push(`%${query.player}%`)
        }
      }
      
      // Filter by status
      if (query.status) {
        whereConditions.push('poi.delivery_status = ?')
        queryParams.push(query.status)
      }
      
      // Filter by date range
      if (query.startDate) {
        whereConditions.push('poi.created_at >= ?')
        queryParams.push(query.startDate)
      }
      
      if (query.endDate) {
        whereConditions.push('poi.created_at <= ?')
        queryParams.push(query.endDate)
      }
      
      // Default to show delivered and failed items if no specific status filter
      if (!query.status) {
        whereConditions.push('poi.delivery_status IN ("delivered", "failed", "pending")')
      }
      
      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''
      
      // Get delivery history from our local tables
      const localHistory = await executeQuery(`
        SELECT 
          poi.id,
          u.steamid64 as steamId,
          u.name as playerName,
          si.classname,
          poi.quantity,
          poi.delivery_status as status,
          poi.delivered_at as deliveredAt,
          poi.delivery_attempts as attempts,
          po.order_number as orderId,
          poi.delivery_data as apiResponse,
          'web_store' as source,
          poi.created_at as queuedAt
        FROM purchase_order_items poi
        JOIN purchase_orders po ON poi.order_id = po.id
        JOIN users u ON po.user_id = u.id
        JOIN store_items si ON poi.item_id = si.id
        ${whereClause}
        ORDER BY COALESCE(poi.delivered_at, poi.created_at) DESC
        LIMIT 100
      `, queryParams)
      
      // Transform to match frontend format
      const transformedHistory = localHistory.map(record => ({
        id: record.id,
        steamId: record.steamId,
        playerName: record.playerName || 'Unknown',
        item: {
          classname: record.classname,
          quantity: record.quantity || 1
        },
        status: record.status,
        deliveredAt: record.deliveredAt,
        queuedAt: record.queuedAt,
        failedAt: record.status === 'failed' ? record.deliveredAt : null,
        attempts: record.attempts || 1,
        source: record.source,
        orderId: record.orderId
      }))
      
      console.log(`✅ Fallback successful: Found ${transformedHistory.length} records`)
      
      return {
        success: true,
        history: transformedHistory,
        pagination: {
          page: 1,
          limit: 100,
          total: transformedHistory.length,
          totalPages: 1
        },
        stats: {
          total: transformedHistory.length,
          delivered: transformedHistory.filter(h => h.status === 'delivered').length,
          pending: transformedHistory.filter(h => h.status === 'pending').length,
          failed: transformedHistory.filter(h => h.status === 'failed').length
        },
        source: 'local_database'
      }
      
    } catch (fallbackError) {
      console.error('❌ Fallback to local database failed:', fallbackError)
      
      // Return empty data if everything fails
      return {
        success: true,
        history: [],
        pagination: {
          page: 1,
          limit: 100,
          total: 0,
          totalPages: 0
        },
        stats: {
          total: 0,
          delivered: 0,
          pending: 0,
          failed: 0
        },
        source: 'empty_fallback',
        error: {
          api: error.message,
          fallback: fallbackError.message
        }
      }
    }
  }
}

async function deleteHistoryRecord(event, admin, ip) {
  // Check permission
  if (!await hasAdminPermission(admin.id, 'orders:write')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  const body = await readBody(event)
  const { recordId } = body
  
  if (!recordId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Record ID is required'
    })
  }
  
  try {
    console.log(`🔄 Deleting history record: ${recordId}`)
    
    // Try to delete from DayZ API first
    const config = useRuntimeConfig()
    
    try {
      const response = await $fetch(`${config.dzsvApi}/v1/itemgiver/history/${recordId}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': config.dzsvApiKey
        },
        timeout: 10000
      })
      
      console.log('✅ DayZ API Delete Response:', response)
    } catch (apiError) {
      console.warn('⚠️ Failed to delete from DayZ API:', apiError.message)
      
      // Try to delete from local database as fallback
      const { executeQuery } = await import('~/utils/database.js')
      
      const deleteResult = await executeQuery(
        'UPDATE purchase_order_items SET delivery_status = "cancelled" WHERE id = ?',
        [recordId]
      )
      
      if (deleteResult.affectedRows === 0) {
        throw new Error('Record not found in local database')
      }
      
      console.log('✅ Deleted from local database as fallback')
    }
    
    // Log admin activity
    await logAdminActivity(
      admin.id,
      'delete_history_record',
      'delivery_history',
      recordId,
      `Deleted delivery history record`,
      null,
      { recordId },
      ip
    )
    
    return {
      success: true,
      message: 'History record deleted successfully'
    }
  } catch (error) {
    console.error('❌ Delete history record error:', error)
    
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || 'Failed to delete history record'
    })
  }
}