import { executeQuery } from '~/utils/database.js'

export default defineEventHandler(async (event) => {
  try {
    const session = await useSession(event, {
      maxAge: 24 * 60 * 60, // 24 hours
      password: process.env.SESSION_SECRET || 'my-super-secret-session-password-32-chars-minimum!',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      name: 'dayz-session'
    })
    
    // ✅ ตรวจสอบว่ามี session data หรือไม่
    if (!session.data || !session.data.user || !session.data.user.id) {
      console.log('❌ No valid session data found')
      throw createError({
        statusCode: 401,
        statusMessage: 'No active session'
      })
    }
    
    const userId = session.data.user.id
    
    // ✅ ตรวจสอบ user ใน database เพื่อให้แน่ใจว่ายังคง active
    const userQuery = `
      SELECT id, email, name, steamid64, points, is_active, is_banned
      FROM users 
      WHERE id = ?
    `
    
    const users = await executeQuery(userQuery, [userId])
    
    if (users.length === 0) {
      console.log(`❌ User not found in database: ${userId}`)
      // User ไม่พบ - ล้าง session
      await session.clear()
      throw createError({
        statusCode: 401,
        statusMessage: 'User not found'
      })
    }
    
    const user = users[0]
    
    // ✅ ตรวจสอบสถานะ banned
    if (user.is_banned) {
      console.log(`🚫 Session check - user is banned: ${user.email}`)
      // ล้าง session สำหรับ user ที่ถูกแบน
      await session.clear()
      throw createError({
        statusCode: 403,
        statusMessage: 'Account has been banned'
      })
    }
    
    // ✅ ตรวจสอบสถานะ active
    if (!user.is_active) {
      console.log(`⏳ Session check - user not active: ${user.email}`)
      // ล้าง session สำหรับ user ที่ไม่ active
      await session.clear()
      throw createError({
        statusCode: 403,
        statusMessage: 'Account is not active'
      })
    }
    
    // ✅ Update session data ด้วยข้อมูลล่าสุด
    try {
      await session.update({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          steamid64: user.steamid64,
          points: user.points || 0
        },
        isAdmin: session.data.isAdmin || false,
        loginTime: session.data.loginTime,
        ip: session.data.ip,
        lastAccess: new Date().toISOString()
      })
    } catch (updateError) {
      console.warn('Failed to update session data:', updateError.message)
    }
    
    console.log(`✅ Session validated for user: ${user.email}`)
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        steamid64: user.steamid64,
        points: user.points || 0
      }
    }
    
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('❌ Session check error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Session check failed'
    })
  }
})