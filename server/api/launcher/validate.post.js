// server/api/launcher/validate.post.js - แก้ไขการตรวจสอบสถานะ
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
      
      // Get user data with ban reason
      const validationQuery = `
        SELECT 
          id,
          email,
          name,
          steamid64,
          points,
          is_active,
          is_banned,
          banned_reason,
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
      
      // ✅ **เข้มงวดขึ้น** - ต้องเป็น active = true AND banned = false เท่านั้น
      if (user.is_banned) {
        console.log(`🚫 Banned user validation blocked: ${user.name} (${user.email}) - Reason: ${user.banned_reason}`)
        
        const response = {
          success: false,
          message: 'Account has been banned',
          code: 'ACCOUNT_BANNED',
          banReason: user.banned_reason || 'Account banned by administrator'
        }
        
        if (includeUserData) {
          response.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            steamid64: user.steamid64,
            points: user.points || 0,
            is_active: user.is_active,
            is_banned: user.is_banned,
            banned_reason: user.banned_reason,
            created_at: user.created_at,
            last_activity: user.last_launcher_activity
          }
        }
        
        return response
      }
      
      if (!user.is_active) {
        console.log(`🚫 Inactive user validation blocked: ${user.name} (${user.email}) - Account deactivated`)
        
        const response = {
          success: false,
          message: 'Account has been deactivated by administrator',
          code: 'ACCOUNT_DEACTIVATED'
        }
        
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
      
      // Valid user - update activity (only for active users)
      try {
        await executeQuery(
          'UPDATE users SET last_launcher_activity = NOW(), last_ip = ? WHERE id = ?',
          [ip, user.id]
        )
      } catch (updateError) {
        console.warn('Failed to update user activity:', updateError.message)
      }
      
      // Success response
      const response = {
        success: true,
        message: 'Session is valid',
        code: 'VALID_SESSION'
      }
      
      // Include user data if requested
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
      console.log(`   Status - Active: ${user.is_active}, Banned: ${user.is_banned}`)
      
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