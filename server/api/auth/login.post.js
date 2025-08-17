import { getHeader } from 'h3'
import { loginUser } from '~/utils/auth.js'
import { sessionStore } from '~/utils/session-store.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password } = body
    
    // Get client IP and MAC address
    const ip = getHeader(event, 'x-forwarded-for') || 
               getHeader(event, 'x-real-ip') || 
               getHeader(event, 'cf-connecting-ip') || 
               event.node?.req?.connection?.remoteAddress ||
               event.node?.req?.socket?.remoteAddress ||
               '127.0.0.1'
    const macAddress = getHeader(event, 'x-mac-address') || null
    
    // Validation
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }
    
    // Login user
    const result = await loginUser(email, password, ip, macAddress)
    
    // จัดการกรณีรออนุมัติ
    if (result.status === 'pending_approval') {
      return {
        success: false,
        status: 'pending_approval',
        message: result.message,
        user: result.user
      }
    }
    
    // Login สำเร็จ
    const user = result.user
    
    // สร้าง session - ห้ามข้าม error
    try {
      const sessionConfig = {
        maxAge: 24 * 60 * 60, // 24 hours
        password: process.env.SESSION_SECRET || 'my-super-secret-session-password-32-chars-minimum!',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        name: 'dayz-session'
      }
      
      const session = await useSession(event, sessionConfig)
      
      // สร้าง session data
      const sessionData = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          steamid64: user.steamid64,
          points: user.points
        },
        isAdmin: false,
        loginTime: new Date().toISOString(),
        ip: ip,
        userAgent: getHeader(event, 'user-agent') || 'Unknown',
        createdAt: new Date().toISOString(),
        lastAccess: new Date().toISOString()
      }
      
      // บันทึก session data
      await session.update(sessionData)
      
      // บันทึก session ลง database
      const sessionId = session.id || sessionStore.generateSessionId()
      const sessionSaved = await sessionStore.saveSession(
        sessionId, 
        sessionData, 
        sessionConfig.maxAge
      )
      
      if (!sessionSaved) {
        console.warn('⚠️ Session saved to memory but failed to save to database')
      }
      
      console.log('✅ Session created successfully for user:', user.email)
      
    } catch (sessionError) {
      console.error('❌ Session creation failed:', sessionError)
      // ถ้า session ไม่สำเร็จ ให้ throw error เพื่อไม่ให้ login ผ่าน
      throw createError({
        statusCode: 500,
        statusMessage: 'Session creation failed. Please try again.'
      })
    }
    
    return {
      success: true,
      message: 'Login successful',
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
    
    console.error('Login error:', error)
    throw createError({
      statusCode: 401,
      statusMessage: error.message || 'Login failed'
    })
  }
})