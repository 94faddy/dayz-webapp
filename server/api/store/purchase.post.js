// server/api/store/purchase.post.js - UPDATED WITH CONFIGURABLE AUTO DELIVERY
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
    const { itemId, quantity = 1 } = body
    const userId = session.data.user.id
    
    // Validation
    if (!itemId || quantity < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid item ID or quantity'
      })
    }
    
    // Get item details
    const [item] = await executeQuery(
      'SELECT * FROM store_items WHERE id = ? AND is_active = TRUE',
      [itemId]
    )
    
    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Item not found or not available'
      })
    }
    
    // Check stock
    if (!item.stock_unlimited && item.stock_quantity < quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Insufficient stock'
      })
    }
    
    // Get user current data (including steamid64)
    const [user] = await executeQuery(
      'SELECT points, steamid64, is_active, is_banned FROM users WHERE id = ?',
      [userId]
    )
    
    if (!user || !user.is_active || user.is_banned) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Account not active or banned'
      })
    }
    
    // Validate Steam ID
    if (!user.steamid64 || !/^7656119[0-9]{10}$/.test(user.steamid64)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid Steam ID. Please update your profile.'
      })
    }
    
    const totalPrice = item.price * quantity
    
    if (user.points < totalPrice) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Insufficient points'
      })
    }
    
    try {
      // Start transaction-like operations
      
      // Deduct points from user
      await executeQuery(
        'UPDATE users SET points = points - ? WHERE id = ?',
        [totalPrice, userId]
      )
      
      // Generate order number
      const orderNumber = 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase()
      
      // Create purchase order
      const orderResult = await executeQuery(
        `INSERT INTO purchase_orders (order_number, user_id, total_amount, status, payment_method)
         VALUES (?, ?, ?, 'paid', 'points')`,
        [orderNumber, userId, totalPrice]
      )
      
      const orderId = orderResult.insertId
      
      // Create order items
      await executeQuery(
        `INSERT INTO purchase_order_items (order_id, item_id, quantity, unit_price, total_price, delivery_status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [orderId, itemId, quantity, item.price, totalPrice]
      )
      
      // Create legacy user_purchases record for compatibility
      await executeQuery(
        `INSERT INTO user_purchases (user_id, item_id, quantity, total_price, status, delivery_status)
         VALUES (?, ?, ?, ?, 'completed', 'pending')`,
        [userId, itemId, quantity, totalPrice]
      )
      
      // Update stock if not unlimited
      if (!item.stock_unlimited) {
        await executeQuery(
          'UPDATE store_items SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [quantity, itemId]
        )
      }
      
      // Log transaction
      await executeQuery(
        `INSERT INTO point_transactions (user_id, amount, type, description)
         VALUES (?, ?, 'purchase', ?)`,
        [userId, -totalPrice, `Order ${orderNumber}: ${quantity}x ${item.name}`]
      )
      
      // Get updated user points
      const [updatedUser] = await executeQuery(
        'SELECT points FROM users WHERE id = ?',
        [userId]
      )
      
      // Update session
      session.data.user.points = updatedUser.points
      await session.update(session.data)
      
      // Check if auto delivery is enabled from database
      let autoDeliveryEnabled = false
      let deliveryAttempted = false
      let deliverySuccess = false
      let deliveryMessage = 'Item purchased successfully. You can deliver it manually from your orders page.'
      
      try {
        // Check auto delivery setting from database
        const [autoDeliverySetting] = await executeQuery(
          "SELECT setting_value FROM system_settings WHERE setting_key = 'auto_delivery'"
        )
        
        autoDeliveryEnabled = autoDeliverySetting?.setting_value === 'true'
        
        console.log('🔍 Auto delivery setting:', {
          enabled: autoDeliveryEnabled,
          settingValue: autoDeliverySetting?.setting_value
        })
        
        if (autoDeliveryEnabled) {
          deliveryAttempted = true
          console.log('🚀 Attempting auto delivery for order:', orderNumber)
          
          const config = useRuntimeConfig()
          
          // Validate API configuration
          if (!config.dzsvApi || !config.dzsvApiKey) {
            throw new Error('DayZ API configuration missing')
          }
          
          // Prepare item data according to DayZ API documentation
          const itemData = {
            classname: item.classname.trim(),
            quantity: parseInt(quantity)
          }
          
          // Add attachments if present
          if (item.attachments) {
            try {
              let attachments
              if (typeof item.attachments === 'string') {
                attachments = JSON.parse(item.attachments)
              } else {
                attachments = item.attachments
              }
              
              // Validate and format attachments
              if (Array.isArray(attachments) && attachments.length > 0) {
                const validAttachments = attachments.filter(att => 
                  att.classname && typeof att.classname === 'string'
                ).map(att => ({
                  classname: att.classname.trim(),
                  quantity: parseInt(att.quantity) || 1,
                  // Add nested attachments if present
                  ...(att.attachments && Array.isArray(att.attachments) && att.attachments.length > 0 
                    ? { attachments: att.attachments.map(nested => ({
                        classname: nested.classname.trim(),
                        quantity: parseInt(nested.quantity) || 1
                      })) }
                    : {}
                  )
                }))
                
                if (validAttachments.length > 0) {
                  itemData.attachments = validAttachments
                }
              }
            } catch (e) {
              console.error('Failed to parse attachments:', e)
            }
          }
          
          // Prepare API request body
          const apiRequestBody = {
            steamId: user.steamid64,
            item: itemData
          }
          
          console.log('🚀 Sending auto delivery request:', {
            url: `${config.dzsvApi}/v1/itemgiver/add-item`,
            steamId: user.steamid64,
            item: itemData
          })
          
          // Call DayZ API to deliver item
          const deliveryResponse = await $fetch(`${config.dzsvApi}/v1/itemgiver/add-item`, {
            method: 'POST',
            headers: {
              'X-API-Key': config.dzsvApiKey,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: apiRequestBody,
            timeout: 30000
          })
          
          console.log('✅ Auto delivery API response:', deliveryResponse)
          
          if (deliveryResponse && deliveryResponse.success === true) {
            deliverySuccess = true
            deliveryMessage = 'Item delivered automatically to your character! Check your inventory in-game.'
            
            // Update delivery status
            await executeQuery(
              `UPDATE purchase_order_items 
               SET delivery_status = 'delivered', delivered_at = NOW(), delivery_data = ?
               WHERE order_id = ?`,
              [JSON.stringify(deliveryResponse), orderId]
            )
            
            await executeQuery(
              `UPDATE user_purchases 
               SET delivery_status = 'delivered', delivered_at = NOW(), delivery_data = ?
               WHERE user_id = ? AND item_id = ? AND created_at >= NOW() - INTERVAL 1 MINUTE`,
              [JSON.stringify(deliveryResponse), userId, itemId]
            )
            
            // Mark order as completed
            await executeQuery(
              'UPDATE purchase_orders SET status = "completed", completed_at = NOW() WHERE id = ?',
              [orderId]
            )
          } else {
            // API returned failure
            const apiErrorMessage = deliveryResponse?.message || 
                                  deliveryResponse?.error || 
                                  'Auto delivery failed'
            deliveryMessage = `Auto delivery failed: ${apiErrorMessage}. You can try manual delivery from your orders page.`
            
            console.error('❌ Auto delivery API failure:', deliveryResponse)
            
            await executeQuery(
              `UPDATE purchase_order_items 
               SET delivery_status = 'failed', delivery_data = ?
               WHERE order_id = ?`,
              [JSON.stringify(deliveryResponse), orderId]
            )
          }
        } else {
          console.log('ℹ️ Auto delivery is disabled, manual delivery required')
        }
      } catch (deliveryError) {
        console.error('❌ Auto delivery error:', deliveryError)
        
        if (autoDeliveryEnabled) {
          deliveryMessage = `Auto delivery failed: ${deliveryError.message}. You can try manual delivery from your orders page.`
          
          // Log the delivery failure
          await executeQuery(
            `UPDATE purchase_order_items 
             SET delivery_status = 'failed', delivery_data = ?
             WHERE order_id = ?`,
            [JSON.stringify({ 
              error: deliveryError.message,
              status: deliveryError.status || 500,
              timestamp: new Date().toISOString()
            }), orderId]
          )
        }
      }
      
      return {
        success: true,
        message: 'Purchase completed successfully',
        purchaseId: orderId,
        orderNumber: orderNumber,
        orderId: orderId,
        newBalance: updatedUser.points,
        item: {
          name: item.name,
          classname: item.classname,
          quantity,
          totalPrice
        },
        delivery: {
          autoDeliveryEnabled,
          attempted: deliveryAttempted,
          success: deliverySuccess,
          status: deliverySuccess ? 'delivered' : (deliveryAttempted ? 'failed' : 'pending'),
          message: deliveryMessage
        }
      }
      
    } catch (error) {
      console.error('❌ Purchase transaction error:', error)
      throw error
    }
    
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('❌ Purchase error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Purchase failed'
    })
  }
})