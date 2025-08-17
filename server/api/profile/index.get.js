import { executeQuery } from '~/utils/database.js'

export default defineEventHandler(async (event) => {
  try {
    console.log('🔍 Profile API called')
    
    const session = await useSession(event, {
      maxAge: 24 * 60 * 60,
      password: process.env.SESSION_SECRET || 'my-super-secret-session-password-32-chars-minimum!',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      name: 'dayz-session'
    })
    
    console.log('📊 Session check:', {
      hasData: !!session.data,
      hasUser: !!session.data?.user,
      userId: session.data?.user?.id
    })
    
    if (!session.data || !session.data.user) {
      console.log('❌ No session found')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }
    
    const userId = session.data.user.id
    console.log('🔍 Loading profile for user ID:', userId)
    
    // Get user profile with additional info และ avatar_data
    const query = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.steamid64,
        u.points,
        u.name_change_count,
        u.last_name_change,
        u.last_login,
        u.created_at,
        u.avatar_data,
        (SELECT COUNT(*) FROM user_purchases WHERE user_id = u.id) as total_purchases,
        (SELECT SUM(total_price) FROM user_purchases WHERE user_id = u.id AND status = 'completed') as total_spent
      FROM users u
      WHERE u.id = ?
    `
    
    const result = await executeQuery(query, [userId])
    
    if (result.length === 0) {
      console.log('❌ User not found in database')
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }
    
    const user = result[0]
    console.log('✅ User found:', user.email)
    
    // Parse avatar_data JSON
    let avatarData = null
    if (user.avatar_data) {
      try {
        // ตรวจสอบว่าเป็น string หรือ object แล้ว
        if (typeof user.avatar_data === 'string') {
          // ถ้าเป็น string ให้ parse
          if (user.avatar_data === '[object Object]' || user.avatar_data === 'null') {
            console.warn('⚠️ Invalid avatar_data detected, setting to null')
            avatarData = null
          } else {
            avatarData = JSON.parse(user.avatar_data)
          }
        } else if (typeof user.avatar_data === 'object') {
          // ถ้าเป็น object แล้ว ใช้เลย
          avatarData = user.avatar_data
        }
        
        if (avatarData) {
          console.log('🎨 Avatar data found:', avatarData.type)
        }
      } catch (error) {
        console.error('❌ Failed to parse avatar_data:', error.message)
        console.error('Raw avatar_data:', user.avatar_data)
        avatarData = null
      }
    }
    
    // Get recent transactions
    const transactionQuery = `
      SELECT id, type, amount, description, created_at
      FROM point_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `
    
    const transactions = await executeQuery(transactionQuery, [userId])
    console.log('📊 Transactions found:', transactions.length)
    
    // Get recent purchases
    const purchaseQuery = `
      SELECT 
        up.id,
        up.quantity,
        up.total_price,
        up.status,
        up.created_at,
        si.name as item_name,
        si.category
      FROM user_purchases up
      JOIN store_items si ON up.item_id = si.id
      WHERE up.user_id = ?
      ORDER BY up.created_at DESC
      LIMIT 10
    `
    
    const purchases = await executeQuery(purchaseQuery, [userId])
    console.log('🛒 Purchases found:', purchases.length)
    
    const response = {
      success: true,
      user: {
        ...user,
        avatar_data: avatarData, // เพิ่ม avatar data
        total_purchases: user.total_purchases || 0,
        total_spent: user.total_spent || 0
      },
      transactions,
      purchases
    }
    
    console.log('✅ Profile API response prepared')
    return response
    
  } catch (error) {
    console.error('❌ Profile API error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch profile'
    })
  }
})