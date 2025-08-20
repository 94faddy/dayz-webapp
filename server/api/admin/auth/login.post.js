// server/api/admin/auth/login.post.js
import { getHeader } from 'h3'
import { loginAdmin } from '~/utils/admin-auth.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { username, password } = body
    
    // Get client IP
    const ip = getHeader(event, 'x-forwarded-for') || 
               getHeader(event, 'x-real-ip') || 
               getHeader(event, 'cf-connecting-ip') || 
               event.node?.req?.connection?.remoteAddress ||
               event.node?.req?.socket?.remoteAddress ||
               '127.0.0.1'
    
    // Validation
    if (!username || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username and password are required'
      })
    }
    
    // Login admin
    const admin = await loginAdmin(username, password, ip)
    
    // Create admin session
    const sessionConfig = {
      maxAge: 24 * 60 * 60, // 24 hours
      password: process.env.SESSION_SECRET || 'my-super-secret-session-password-32-chars-minimum!',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      name: 'dayz-admin-session'
    }
    
    const session = await useSession(event, sessionConfig)
    
    // Save admin data to session
    await session.update({
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      },
      loginTime: new Date().toISOString(),
      ip: ip,
      userAgent: getHeader(event, 'user-agent') || 'Unknown'
    })
    
    console.log('✅ Admin logged in successfully:', admin.username)
    
    return {
      success: true,
      message: 'Login successful',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    }
    
  } catch (error) {
    console.error('Admin login error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 401,
      statusMessage: error.message || 'Login failed'
    })
  }
})