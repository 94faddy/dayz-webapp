// server/api/store/purchase.post.js
import { executeQuery } from '~/utils/database.js'

export default defineEventHandler(async (event) => {
  try {
    const session = await useSession(event, { maxAge: 24 * 60 * 60 })
    
    if (!session.data.user) {
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
    
    // Start transaction
    const connection = await createConnection()
    await connection.beginTransaction()
    
    try {
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
      
      // Get user current points
      const [user] = await executeQuery(
        'SELECT points, is_active, is_banned FROM users WHERE id = ?',
        [userId]
      )
      
      if (!user || !user.is_active || user.is_banned) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Account not active or banned'
        })
      }
      
      const totalPrice = item.price * quantity
      
      if (user.points < totalPrice) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Insufficient points'
        })
      }
      
      // Deduct points from user
      await executeQuery(
        'UPDATE users SET points = points - ? WHERE id = ?',
        [totalPrice, userId]
      )
      
      // Create purchase record
      const purchaseResult = await executeQuery(
        `INSERT INTO user_purchases (user_id, item_id, quantity, total_price, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [userId, itemId, quantity, totalPrice]
      )
      
      // Log transaction
      await executeQuery(
        `INSERT INTO point_transactions (user_id, amount, type, description)
         VALUES (?, ?, 'purchase', ?)`,
        [userId, -totalPrice, `Purchased ${quantity}x ${item.name}`]
      )
      
      // Commit transaction
      await connection.commit()
      
      // Get updated user points
      const [updatedUser] = await executeQuery(
        'SELECT points FROM users WHERE id = ?',
        [userId]
      )
      
      // Update session
      session.data.user.points = updatedUser.points
      await session.save()
      
      return {
        success: true,
        message: 'Purchase completed successfully',
        purchaseId: purchaseResult.insertId,
        newBalance: updatedUser.points,
        item: {
          name: item.name,
          quantity,
          totalPrice
        }
      }
      
    } catch (error) {
      await connection.rollback()
      throw error
    }
    
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Purchase error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Purchase failed'
    })
  }
})