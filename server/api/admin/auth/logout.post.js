// server/api/admin/auth/logout.post.js
import { logAdminActivity } from '~/utils/admin-auth.js'
import { getHeader } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const session = await useSession(event, {
      maxAge: 24 * 60 * 60,
      password: process.env.SESSION_SECRET || 'my-super-secret-session-password-32-chars-minimum!',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      name: 'dayz-admin-session'
    })
    
    const adminId = session.data?.admin?.id
    const ip = getHeader(event, 'x-forwarded-for') || 
               getHeader(event, 'x-real-ip') || 
               event.node?.req?.connection?.remoteAddress ||
               '127.0.0.1'
    
    // Log logout activity
    if (adminId) {
      await logAdminActivity(adminId, 'logout', null, null, 'Admin logged out', null, null, ip)
    }
    
    // Clear session
    await session.clear()
    
    return {
      success: true,
      message: 'Logged out successfully'
    }
    
  } catch (error) {
    console.error('Admin logout error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Logout failed'
    })
  }
})