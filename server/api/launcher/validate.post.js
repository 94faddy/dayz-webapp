import { getHeader } from 'h3'
import { executeQuery } from '~/utils/database.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { sessionToken, includeUserData = false, checkStatus = false } = body
    
    // Get client IP
    const ip = getHeader(event, 'x-forwarded-for') || 
               getHeader(event, 'x-real-ip') || 
               getHeader(event, 'cf-connecting-ip') || 
               event.node?.req?.connection?.remoteAddress ||
               event.node?.req?.socket?.remoteAddress ||
               '127.0.0.1'
    
    // Get session token from header as fallback
    const token = sessionToken || getHeader(event, 'x-session-token')
    
    if (!token) {
      return {
        success: false,
        message: 'Session token is required',
        code: 'MISSING_TOKEN'
      }
    }
    
    try {
      // Extract user ID from session token
      const tokenParts = token.split('_');
      if (tokenParts.length < 4 || tokenParts[0] !== 'launcher') {
        console.log(`🔍 Invalid session token format: ${token.substring(0, 20)}... from IP: ${ip}`)
        return {
          success: false,
          message: 'Invalid session token format',
          code: 'INVALID_SESSION'
        }
      }
      
      const userId = parseInt(tokenParts[1]);
      if (isNaN(userId)) {
        return {
          success: false,
          message: 'Invalid user ID in session token',
          code: 'INVALID_SESSION'
        }
      }
      
      // ✅ ดึงข้อมูลผู้ใช้โดยไม่กรองสถานะ ban ก่อน (เพื่อตรวจสอบว่าถูกแบนหรือไม่)
      const validationQuery = `
        SELECT 
          id,
          email,
          name,
          steamid64,
          points,
          is_active,
          is_banned,
          created_at,
          last_ip,
          last_launcher_activity
        FROM users 
        WHERE id = ?
      `
      
      const users = await executeQuery(validationQuery, [userId])
      
      if (users.length === 0) {
        console.log(`🔍 User not found for ID: ${userId} from IP: ${ip}`)
        return {
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      }
      
      const user = users[0]
      
      // ✅ ตรวจสอบสถานะ ban หลังจากดึงข้อมูลแล้ว
      if (user.is_banned || !user.is_active) {
        console.log(`🚫 Banned/inactive user validation: ${user.name} (${user.email}) - Banned: ${user.is_banned}, Active: ${user.is_active}`)
        
        // ✅ ส่งข้อมูลผู้ใช้และสถานะ ban กลับไป
        const response = {
          success: false,
          message: user.is_banned ? 'Account has been banned' : 'Account has been suspended',
          code: user.is_banned ? 'ACCOUNT_BANNED' : 'ACCOUNT_SUSPENDED',
          banReason: user.is_banned ? 'Account banned by administrator' : 'Account suspended'
        }
        
        // ✅ ส่งข้อมูลผู้ใช้ด้วยเมื่อขอมา (สำคัญ!)
        if (includeUserData) {
          response.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            steamid64: user.steamid64,
            points: user.points || 0,
            is_active: user.is_active,
            is_banned: user.is_banned,
            created_at: user.created_at,
            last_activity: user.last_launcher_activity
          }
        }
        
        return response
      }
      
      // ✅ ผู้ใช้ปกติ - อัปเดต activity
      try {
        await executeQuery(
          'UPDATE users SET last_launcher_activity = NOW(), last_ip = ? WHERE id = ?',
          [ip, user.id]
        )
      } catch (updateError) {
        console.warn('Failed to update user activity:', updateError.message)
      }
      
      // ✅ ส่งผลลัพธ์สำเร็จ
      const response = {
        success: true,
        message: 'Session is valid',
        code: 'VALID_SESSION'
      }
      
      // ✅ ส่งข้อมูลผู้ใช้หากขอมา
      if (includeUserData) {
        response.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          steamid64: user.steamid64,
          points: user.points || 0,
          is_active: user.is_active,
          is_banned: user.is_banned,
          created_at: user.created_at,
          last_activity: user.last_launcher_activity
        }
      }
      
      console.log(`✅ Session validation successful: ${user.name} (${user.email}) from IP: ${ip}`)
      
      return response
      
    } catch (dbError) {
      console.error('🔍 Database error during session validation:', dbError)
      return {
        success: false,
        message: 'Database validation error',
        code: 'VALIDATION_ERROR'
      }
    }
    
  } catch (error) {
    console.error('❌ Session validation system error:', error)
    return {
      success: false,
      message: 'Validation server error',
      code: 'SERVER_ERROR'
    }
  }
})