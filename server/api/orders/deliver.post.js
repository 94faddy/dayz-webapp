// server/api/orders/deliver.post.js
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
    
    const body = await readBody(event)
    const { orderId } = body
    const userId = session.data.user.id
    
    if (!orderId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Order ID is required'
      })
    }
    
    // Get order details and verify ownership
    const [order] = await executeQuery(`
      SELECT po.*, u.steamid64, u.name as user_name
      FROM purchase_orders po
      JOIN users u ON po.user_id = u.id
      WHERE po.id = ? AND po.user_id = ?
    `, [orderId, userId])
    
    if (!order) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Order not found'
      })
    }
    
    if (order.status !== 'paid') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Order is not in valid status for delivery'
      })
    }
    
    // Get order items that are pending delivery
    const orderItems = await executeQuery(`
      SELECT poi.*, si.name, si.classname, si.attachments, si.category
      FROM purchase_order_items poi
      JOIN store_items si ON poi.item_id = si.id
      WHERE poi.order_id = ? AND poi.delivery_status = 'pending'
    `, [orderId])
    
    if (orderItems.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No pending items to deliver'
      })
    }
    
    const config = useRuntimeConfig()
    let allDelivered = true
    const deliveryResults = []
    
    try {
      // Process each item
      for (const item of orderItems) {
        try {
          // Prepare item data for API
          const itemData = {
            classname: item.classname,
            quantity: item.quantity
          }
          
          // Add attachments if present
          if (item.attachments) {
            try {
              const attachments = typeof item.attachments === 'string' 
                ? JSON.parse(item.attachments) 
                : item.attachments
              if (attachments && attachments.length > 0) {
                itemData.attachments = attachments
              }
            } catch (e) {
              console.error('Failed to parse attachments:', e)
            }
          }
          
          console.log('🚀 Delivering item to DayZ API:', {
            steamId: order.steamid64,
            item: itemData
          })
          
          // Call DayZ API to deliver item
          const deliveryResponse = await $fetch(`${config.dzsvApi}/v1/itemgiver/add-item`, {
            method: 'POST',
            headers: {
              'X-API-Key': config.dzsvApiKey,
              'Content-Type': 'application/json'
            },
            body: {
              steamId: order.steamid64,
              item: itemData
            }
          })
          
          console.log('✅ DayZ API Response:', deliveryResponse)
          
          if (deliveryResponse.success) {
            // Update delivery status
            await executeQuery(
              `UPDATE purchase_order_items 
               SET delivery_status = 'delivered', delivered_at = NOW(), 
                   delivery_data = ?, delivery_attempts = delivery_attempts + 1
               WHERE id = ?`,
              [JSON.stringify(deliveryResponse), item.id]
            )
            
            // Also update legacy user_purchases table
            await executeQuery(
              `UPDATE user_purchases 
               SET delivery_status = 'delivered', delivered_at = NOW(), 
                   delivery_data = ?, delivery_attempts = delivery_attempts + 1
               WHERE user_id = ? AND item_id = ? AND delivery_status = 'pending'
               ORDER BY created_at DESC LIMIT 1`,
              [JSON.stringify(deliveryResponse), userId, item.item_id]
            )
            
            deliveryResults.push({
              itemId: item.item_id,
              itemName: item.name,
              status: 'delivered',
              message: 'Item delivered successfully'
            })
          } else {
            allDelivered = false
            
            // Update as failed
            await executeQuery(
              `UPDATE purchase_order_items 
               SET delivery_status = 'failed', 
                   delivery_data = ?, delivery_attempts = delivery_attempts + 1
               WHERE id = ?`,
              [JSON.stringify(deliveryResponse), item.id]
            )
            
            deliveryResults.push({
              itemId: item.item_id,
              itemName: item.name,
              status: 'failed',
              message: deliveryResponse.message || 'Delivery failed'
            })
          }
          
        } catch (itemError) {
          console.error('❌ Item delivery error:', itemError)
          allDelivered = false
          
          await executeQuery(
            `UPDATE purchase_order_items 
             SET delivery_status = 'failed', 
                 delivery_data = ?, delivery_attempts = delivery_attempts + 1
             WHERE id = ?`,
            [JSON.stringify({ error: itemError.message }), item.id]
          )
          
          deliveryResults.push({
            itemId: item.item_id,
            itemName: item.name,
            status: 'failed',
            message: itemError.message || 'Delivery failed'
          })
        }
      }
      
      // Update order status if all items delivered
      if (allDelivered) {
        await executeQuery(
          'UPDATE purchase_orders SET status = "completed", completed_at = NOW() WHERE id = ?',
          [orderId]
        )
      }
      
      const successCount = deliveryResults.filter(r => r.status === 'delivered').length
      const failedCount = deliveryResults.filter(r => r.status === 'failed').length
      
      return {
        success: true,
        message: allDelivered 
          ? 'All items delivered successfully!' 
          : `${successCount} items delivered, ${failedCount} items failed`,
        orderStatus: allDelivered ? 'completed' : 'processing',
        deliveryResults,
        stats: {
          total: orderItems.length,
          delivered: successCount,
          failed: failedCount
        }
      }
      
    } catch (error) {
      console.error('❌ Manual delivery error:', error)
      
      // Update order as processing failed
      await executeQuery(
        'UPDATE purchase_orders SET notes = ? WHERE id = ?',
        [`Manual delivery failed: ${error.message}`, orderId]
      )
      
      throw createError({
        statusCode: 500,
        statusMessage: `Delivery failed: ${error.message}`
      })
    }
    
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Manual delivery API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Manual delivery failed'
    })
  }
})