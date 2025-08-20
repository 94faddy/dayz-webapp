// server/api/admin/orders/index.js
import { executeQuery } from '~/utils/database.js'
import { requireAdminAuth } from '~/server/utils/admin-middleware.js'
import { logAdminActivity, hasAdminPermission } from '~/utils/admin-auth.js'
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
      return await getOrders(admin)
    case 'PUT':
      return await updateOrder(event, admin, ip)
    case 'POST':
      return await performOrderAction(event, admin, ip)
    default:
      throw createError({
        statusCode: 405,
        statusMessage: 'Method not allowed'
      })
  }
})

async function getOrders(admin) {
  // Check permission
  if (!await hasAdminPermission(admin.id, 'orders:read')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  try {
    const query = `
      SELECT 
        po.id,
        po.order_number,
        po.user_id,
        po.total_amount,
        po.status,
        po.payment_method,
        po.payment_reference,
        po.notes,
        po.created_at,
        po.updated_at,
        po.completed_at,
        u.name as user_name,
        u.email as user_email,
        u.steamid64,
        COUNT(poi.id) as total_items,
        SUM(CASE WHEN poi.delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered_items,
        SUM(CASE WHEN poi.delivery_status = 'pending' THEN 1 ELSE 0 END) as pending_items,
        SUM(CASE WHEN poi.delivery_status = 'failed' THEN 1 ELSE 0 END) as failed_items,
        GROUP_CONCAT(
          CONCAT(
            '{"id":', poi.id,
            ',"item_id":', poi.item_id, 
            ',"item_name":"', REPLACE(si.name, '"', '\\\\"'), 
            '","classname":"', si.classname,
            '","quantity":', poi.quantity,
            ',"unit_price":', poi.unit_price,
            ',"total_price":', poi.total_price,
            ',"delivery_status":"', poi.delivery_status,
            '","delivery_attempts":', COALESCE(poi.delivery_attempts, 0),
            ',"delivered_at":', IFNULL(CONCAT('"', poi.delivered_at, '"'), 'null'),
            ',"image_url":', IFNULL(CONCAT('"', REPLACE(si.image_url, '"', '\\\\"'), '"'), 'null'),
            ',"category":"', si.category, '"}'
          ) SEPARATOR ','
        ) as items_json
      FROM purchase_orders po
      JOIN users u ON po.user_id = u.id
      LEFT JOIN purchase_order_items poi ON po.id = poi.order_id
      LEFT JOIN store_items si ON poi.item_id = si.id
      GROUP BY po.id
      ORDER BY po.created_at DESC
    `
    
    const orders = await executeQuery(query)
    
    // Parse items JSON safely
    orders.forEach(order => {
      if (order.items_json) {
        try {
          order.items = JSON.parse(`[${order.items_json}]`)
        } catch (e) {
          console.error('Failed to parse items JSON:', e)
          console.error('JSON content:', order.items_json)
          order.items = []
        }
      } else {
        order.items = []
      }
      delete order.items_json
    })
    
    // Get summary statistics
    const [stats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) as refunded_orders
      FROM purchase_orders
    `)
    
    return {
      success: true,
      orders,
      stats: stats[0]
    }
  } catch (error) {
    console.error('Failed to get orders:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load orders'
    })
  }
}

async function updateOrder(event, admin, ip) {
  // Check permission
  if (!await hasAdminPermission(admin.id, 'orders:write')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  const body = await readBody(event)
  const { orderId, field, value } = body
  
  // Get current order
  const [currentOrder] = await executeQuery(
    'SELECT * FROM purchase_orders WHERE id = ?',
    [orderId]
  )
  
  if (!currentOrder) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found'
    })
  }
  
  let updateQuery = ''
  let params = []
  const oldValue = currentOrder[field]
  
  switch (field) {
    case 'status':
      updateQuery = 'UPDATE purchase_orders SET status = ?, updated_at = NOW() WHERE id = ?'
      params = [value, orderId]
      
      // If marking as completed, set completed_at
      if (value === 'completed') {
        updateQuery = 'UPDATE purchase_orders SET status = ?, completed_at = NOW(), updated_at = NOW() WHERE id = ?'
      }
      break
      
    case 'notes':
      updateQuery = 'UPDATE purchase_orders SET notes = ?, updated_at = NOW() WHERE id = ?'
      params = [value, orderId]
      break
      
    case 'payment_reference':
      updateQuery = 'UPDATE purchase_orders SET payment_reference = ?, updated_at = NOW() WHERE id = ?'
      params = [value, orderId]
      break
      
    default:
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid field'
      })
  }
  
  await executeQuery(updateQuery, params)
  
  // Log activity
  await logAdminActivity(
    admin.id,
    'update_order',
    'order',
    orderId,
    `Updated order ${field}: ${currentOrder.order_number}`,
    { [field]: oldValue },
    { [field]: value },
    ip
  )
  
  return {
    success: true,
    message: 'Order updated successfully'
  }
}

async function performOrderAction(event, admin, ip) {
  const body = await readBody(event)
  const { action, orderId, data } = body
  
  switch (action) {
    case 'cancel':
      return await cancelOrder(orderId, data, admin, ip)
    case 'refund':
      return await refundOrder(orderId, data, admin, ip)
    case 'retry_delivery':
      return await retryDelivery(orderId, admin, ip)
    case 'manual_delivery':
      return await manualDelivery(orderId, data, admin, ip)
    default:
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid action'
      })
  }
}

async function cancelOrder(orderId, data, admin, ip) {
  // Check permission
  if (!await hasAdminPermission(admin.id, 'orders:write')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  const { reason, refundPoints = false } = data || {}
  
  // Get order details
  const [order] = await executeQuery(`
    SELECT po.*, u.name as user_name
    FROM purchase_orders po
    JOIN users u ON po.user_id = u.id
    WHERE po.id = ?
  `, [orderId])
  
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found'
    })
  }
  
  if (order.status === 'cancelled') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Order is already cancelled'
    })
  }
  
  // Update order status
  await executeQuery(
    'UPDATE purchase_orders SET status = "cancelled", notes = ?, updated_at = NOW() WHERE id = ?',
    [reason || 'Cancelled by admin', orderId]
  )
  
  // Refund points if requested
  if (refundPoints && order.total_amount > 0) {
    await executeQuery(
      'UPDATE users SET points = points + ? WHERE id = ?',
      [order.total_amount, order.user_id]
    )
    
    // Log refund transaction
    await executeQuery(
      `INSERT INTO point_transactions (user_id, amount, type, description)
       VALUES (?, ?, 'refund', ?)`,
      [order.user_id, order.total_amount, `Refund for cancelled order ${order.order_number}`]
    )
  }
  
  // Log activity
  await logAdminActivity(
    admin.id,
    'cancel_order',
    'order',
    orderId,
    `Cancelled order: ${order.order_number}`,
    { status: order.status },
    { status: 'cancelled', reason, refunded: refundPoints },
    ip
  )
  
  return {
    success: true,
    message: refundPoints 
      ? `Order cancelled and ${order.total_amount} points refunded` 
      : 'Order cancelled successfully'
  }
}

async function retryDelivery(orderId, admin, ip) {
  // Check permission
  if (!await hasAdminPermission(admin.id, 'orders:write')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  // Get order details
  const [order] = await executeQuery(`
    SELECT po.*, u.steamid64, u.name as user_name
    FROM purchase_orders po
    JOIN users u ON po.user_id = u.id
    WHERE po.id = ?
  `, [orderId])
  
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found'
    })
  }
  
  // Get failed items
  const failedItems = await executeQuery(`
    SELECT poi.*, si.name, si.classname, si.attachments
    FROM purchase_order_items poi
    JOIN store_items si ON poi.item_id = si.id
    WHERE poi.order_id = ? AND poi.delivery_status IN ('failed', 'pending')
  `, [orderId])
  
  if (failedItems.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No failed items to retry'
    })
  }
  
  const config = useRuntimeConfig()
  let successCount = 0
  let failedCount = 0
  
  for (const item of failedItems) {
    try {
      // Prepare item data
      const itemData = {
        classname: item.classname,
        quantity: item.quantity
      }
      
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
      
      // Call DayZ API
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
      
      if (deliveryResponse.success) {
        await executeQuery(
          `UPDATE purchase_order_items 
           SET delivery_status = 'delivered', delivered_at = NOW(), 
               delivery_data = ?, delivery_attempts = delivery_attempts + 1
           WHERE id = ?`,
          [JSON.stringify(deliveryResponse), item.id]
        )
        successCount++
      } else {
        await executeQuery(
          `UPDATE purchase_order_items 
           SET delivery_status = 'failed', 
               delivery_data = ?, delivery_attempts = delivery_attempts + 1
           WHERE id = ?`,
          [JSON.stringify(deliveryResponse), item.id]
        )
        failedCount++
      }
    } catch (error) {
      console.error('Retry delivery error:', error)
      failedCount++
    }
  }
  
  // Update order status if all delivered
  if (successCount > 0 && failedCount === 0) {
    await executeQuery(
      'UPDATE purchase_orders SET status = "completed", completed_at = NOW() WHERE id = ?',
      [orderId]
    )
  }
  
  // Log activity
  await logAdminActivity(
    admin.id,
    'retry_delivery',
    'order',
    orderId,
    `Retried delivery for order: ${order.order_number}`,
    null,
    { success: successCount, failed: failedCount },
    ip
  )
  
  return {
    success: true,
    message: `Retry completed: ${successCount} delivered, ${failedCount} failed`,
    stats: { delivered: successCount, failed: failedCount }
  }
}