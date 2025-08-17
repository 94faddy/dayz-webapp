// server/api/auth/logout.post.js
import { sessionStore } from '~/utils/session-store.js'

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
    
    // ดึง session ID และ user ID ก่อนล้าง
    const sessionId = session.id
    const userId = session.data?.user?.id
    
    // ล้าง session จาก memory
    await session.clear()
    
    // ลบ session จาก database
    if (sessionId) {
      await sessionStore.deleteSession(sessionId)
    }
    
    // Log successful logout
    if (userId) {
      console.log('✅ User logged out successfully:', userId)
    }
    
    return {
      success: true,
      message: 'Logged out successfully'
    }
    
  } catch (error) {
    console.error('Logout error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Logout failed'
    })
  }
})