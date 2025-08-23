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
      // Login user
      loginResult = await loginUser(email, password, ip, macAddress)
    } catch (loginError) {
      console.error('🔐 Login error for:', email, '-', loginError.message)
      
      if (loginError.message.includes('Invalid email or password')) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Invalid email or password'
        })
      }
      
      throw createError({
        statusCode: 401,
        statusMessage: loginError.message || 'Login failed'
      })
    }
    
    if (!loginResult || !loginResult.status) {
      console.error('❌ Invalid login result structure')
      throw createError({
        statusCode: 500,
        statusMessage: 'Login processing error'
      })
    }
    
    // Handle banned user
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
    
    // Handle pending approval
    if (loginResult.status === 'pending_approval') {
      console.log('⏳ User pending approval:', email)
      return {
        success: false,
        status: 'pending_approval',
        message: loginResult.message,
        user: loginResult.user
      }
    }
    
    // Login successful
    const user = loginResult.user
    
    if (!user || !user.id) {
      console.error('❌ Missing user data in login result')
      throw createError({
        statusCode: 500,
        statusMessage: 'User data processing error'
      })
    }
    
    // Create session
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
      
      // Create session data with avatar_data
      const sessionData = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          steamid64: user.steamid64,
          points: user.points || 0,
          avatar_data: user.avatar_data || null // Include avatar data in session
        },
        isAdmin: false,
        loginTime: new Date().toISOString(),
        ip: ip,
        userAgent: getHeader(event, 'user-agent') || 'Unknown',
        createdAt: new Date().toISOString(),
        lastAccess: new Date().toISOString()
      }
      
      // Save session data
      await session.update(sessionData)
      
      // Save session to database
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
        points: user.points || 0,
        avatar_data: user.avatar_data || null // Include avatar data in response
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