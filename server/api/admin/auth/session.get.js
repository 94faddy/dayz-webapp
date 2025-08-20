// server/api/admin/auth/session.get.js
import { executeQuery } from '~/utils/database.js'

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
    
    if (!session.data || !session.data.admin) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No active admin session'
      })
    }
    
    const adminId = session.data.admin.id
    
    // Verify admin still exists and is active
    const query = `
      SELECT id, username, email, role, permissions, is_active
      FROM admin_users 
      WHERE id = ? AND is_active = TRUE
    `
    
    const admins = await executeQuery(query, [adminId])
    
    if (admins.length === 0) {
      await session.clear()
      throw createError({
        statusCode: 401,
        statusMessage: 'Admin not found or inactive'
      })
    }
    
    const admin = admins[0]
    
    // Parse permissions
    let permissions = {}
    if (admin.permissions) {
      try {
        permissions = typeof admin.permissions === 'string' 
          ? JSON.parse(admin.permissions) 
          : admin.permissions
      } catch (e) {
        console.error('Failed to parse permissions:', e)
      }
    }
    
    // Update session with latest data
    await session.update({
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: permissions
      },
      loginTime: session.data.loginTime,
      ip: session.data.ip,
      lastAccess: new Date().toISOString()
    })
    
    return {
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: permissions
      }
    }
    
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Admin session check error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Session check failed'
    })
  }
})