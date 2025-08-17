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
    
    // ตรวจสอบว่ามี session data หรือไม่
    if (!session.data || !session.data.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No active session'
      })
    }
    
    const userId = session.data.user.id
    
    // ตรวจสอบ user ใน database เพื่อให้แน่ใจว่ายังคง active
    const userQuery = `
      SELECT id, email, name, steamid64, points, is_active, is_banned
      FROM users 
      WHERE id = ? AND is_active = TRUE AND is_banned = FALSE
    `
    
    const users = await executeQuery(userQuery, [userId])
    
    if (users.length === 0) {
      // User ไม่พบหรือไม่ active แล้ว - ล้าง session
      await session.clear()
      throw createError({
        statusCode: 401,
        statusMessage: 'User not found or inactive'
      })
    }
    
    const user = users[0]
    
    // Update session data ด้วยข้อมูลล่าสุด
    await session.update({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        steamid64: user.steamid64,
        points: user.points
      },
      isAdmin: session.data.isAdmin || false,
      loginTime: session.data.loginTime,
      ip: session.data.ip,
      lastAccess: new Date().toISOString()
    })
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        steamid64: user.steamid64,
        points: user.points
      }
    }
    
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Session check error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Session check failed'
    })
  }
})