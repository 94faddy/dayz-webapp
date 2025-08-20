// server/api/orders/index.js (Fixed)
import { executeQuery } from '~/utils/database.js'

export default defineEventHandler(async (event) => {
  try {
    const session = await useSession(event, {
      maxAge: 24 * 60 * 60,
      password: process.env.SESSION_SECRET || 'my-super-secret-session-password-32-chars-minimum!',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      name: 'dayz-session'
    })
    
    if (!session.data?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }
    
    const userId = session.data.user.id
    const query = getQuery(event)
    const page = parseInt(query.page) || 1
    const limit = Math.min(parseInt(query.limit) || 10, 50) // Max 50
    const offset = (page - 1) * limit
    
    console.log('🔍 Loading orders for user:', userId, 'page:', page, 'limit:', limit, 'offset:', offset)
    
    try {
      // Simple query without LIMIT/OFFSET first to test
      const simpleOrdersQuery = `
        SELECT 
          po.id,
          po.order_number,
          po.total_amount,
          po.status,
          po.payment_method,
          po.created_at,
          po.completed_at
        FROM purchase_orders po
        WHERE po.user_id = ?
        ORDER BY po.created_at DESC
      `
      
      const allOrders = await executeQuery(simpleOrdersQuery, [userId])
      console.log(`✅ Found ${allOrders.length} total orders`)
      
      // Manual pagination to avoid MySQL parameter issues
      const orders = allOrders.slice(offset, offset + limit)
      console.log(`📄 Showing ${orders.length} orders for page ${page}`)
      
      // Get items for each order
      for (const order of orders) {
        try {
          const itemsQuery = `
            SELECT 
              poi.id,
              poi.item_id,
              poi.quantity,
              poi.unit_price,
              poi.total_price,
              poi.delivery_status,
              poi.delivered_at,
              COALESCE(poi.delivery_attempts, 0) as delivery_attempts,
              si.name as item_name,
              si.classname,
              si.image_url,
              si.category
            FROM purchase_order_items poi
            JOIN store_items si ON poi.item_id = si.id
            WHERE poi.order_id = ?
            ORDER BY poi.id
          `
          
          const items = await executeQuery(itemsQuery, [order.id])
          order.items = items || []
          
          console.log(`📦 Order ${order.order_number} has ${items.length} items`)
        } catch (itemError) {
          console.error(`❌ Error loading items for order ${order.id}:`, itemError)
          order.items = []
        }
      }
      
      // Get total count
      const total = allOrders.length
      const totalPages = Math.ceil(total / limit)
      
      console.log(`📊 Total orders: ${total}, Pages: ${totalPages}`)
      
      return {
        success: true,
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
      
    } catch (dbError) {
      console.error('❌ Database error in orders:', dbError)
      
      // Return empty result if database fails
      return {
        success: true,
        orders: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
        error: 'Database connection failed'
      }
    }
    
  } catch (error) {
    console.error('❌ Orders API error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    // Return empty result instead of throwing error
    return {
      success: false,
      orders: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      },
      error: error.message
    }
  }
})