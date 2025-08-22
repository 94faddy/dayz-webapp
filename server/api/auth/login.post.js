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
    
    let loginResult
    
    try {
      // Login user - ใช้ try-catch เพื่อจัดการ error จาก loginUser
      loginResult = await loginUser(email, password, ip, macAddress)
    } catch (loginError) {
      console.error('🔐 Login error for:', email, '-', loginError.message)
      
      // ✅ ตรวจสอบ error messages เพื่อส่ง response ที่เหมาะสม
      if (loginError.message.includes('Invalid email or password')) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Invalid email or password'
        })
      }
      
      // อื่นๆ
      throw createError({
        statusCode: 401,
        statusMessage: loginError.message || 'Login failed'
      })
    }
    
    // ✅ ตรวจสอบผลลัพธ์จาก loginUser
    if (!loginResult || !loginResult.status) {
      console.error('❌ Invalid login result structure')
      throw createError({
        statusCode: 500,
        statusMessage: 'Login processing error'
      })
    }
    
    // ✅ จัดการกรณี banned user - กลับไปใช้ createError เพื่อให้ Frontend catch ได้
    if (loginResult.status === 'banned') {
      console.log('🚫 User access restricted:', email, '-', loginResult.banReason)
      throw createError({
        statusCode: 403,
        statusMessage: loginResult.message,
        data: {
          status: 'banned',
          banReason: loginResult.banReason,
          user: loginResult.user
        }
      })
    }
    
    // จัดการกรณีรออนุมัติ
    if (loginResult.status === 'pending_approval') {
      console.log('⏳ User pending approval:', email)
      return {
        success: false,
        status: 'pending_approval',
        message: loginResult.message,
        user: loginResult.user
      }
    }
    
    // ✅ Login สำเร็จ - ตรวจสอบว่ามี user object ครบถ้วน
    const user = loginResult.user
    
    if (!user || !user.id) {
      console.error('❌ Missing user data in login result')
      throw createError({
        statusCode: 500,
        statusMessage: 'User data processing error'
      })
    }
    
    // สร้าง session - เฉพาะเมื่อ login สำเร็จและมี user data ครบถ้วน
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
          points: user.points || 0
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
        points: user.points || 0
      }
    }
    
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('❌ Login system error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Login system error'
    })
  }
})