import { getHeader } from 'h3'
import { executeQuery } from '~/utils/database.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { 
      userId, 
      sessionToken, 
      updateDuration, 
      filesUpdated, 
      bytesDownloaded, 
      cacheHits, 
      cacheMisses, 
      launcherVersion, 
      timestamp 
    } = body
    
    // Get client IP
    const ip = getHeader(event, 'x-forwarded-for') || 
               getHeader(event, 'x-real-ip') || 
               getHeader(event, 'cf-connecting-ip') || 
               event.node?.req?.connection?.remoteAddress ||
               event.node?.req?.socket?.remoteAddress ||
               '127.0.0.1'
    
    // Basic validation
    if (!userId || !sessionToken) {
      return {
        success: false,
        message: 'User ID and session token are required',
        code: 'INVALID_INPUT'
      }
    }
    
    // ✅ เข้มงวดขึ้น - ต้องเป็น active = true AND banned = false เท่านั้น
    const userQuery = `
      SELECT id, email, name, is_active, is_banned, banned_reason
      FROM users 
      WHERE id = ? AND is_active = TRUE AND is_banned = FALSE
    `
    
    const users = await executeQuery(userQuery, [userId])
    
    if (users.length === 0) {
      // Check if user exists but is inactive/banned
      const checkUserQuery = `SELECT id, email, name, is_active, is_banned, banned_reason FROM users WHERE id = ?`
      const checkUsers = await executeQuery(checkUserQuery, [userId])
      
      if (checkUsers.length > 0) {
        const user = checkUsers[0]
        console.log(`🚫 Stats blocked - user status: ${user.name} (${user.email}) - Active: ${user.is_active}, Banned: ${user.is_banned}`)
        
        return {
          success: false,
          message: user.is_banned ? 'Account has been banned' : 'Account has been deactivated',
          code: user.is_banned ? 'ACCOUNT_BANNED' : 'ACCOUNT_DEACTIVATED',
          banReason: user.banned_reason || 'Account restricted by administrator'
        }
      }
      
      console.log(`🚫 Stats blocked - user not found: ${userId}`)
      return {
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      }
    }
    
    const user = users[0]
    
    // Validate session token format and user ID match
    try {
      const tokenParts = sessionToken.split('_')
      if (tokenParts.length < 4 || tokenParts[0] !== 'launcher') {
        console.log(`🔍 Invalid session token format from user: ${user.name}`)
        return {
          success: false,
          message: 'Invalid session token format',
          code: 'INVALID_SESSION'
        }
      }
      
      const tokenUserId = parseInt(tokenParts[1])
      if (tokenUserId !== userId) {
        console.log(`🔍 Session token user ID mismatch: ${tokenUserId} !== ${userId}`)
        return {
          success: false,
          message: 'Session token does not match user ID',
          code: 'INVALID_SESSION'
        }
      }
    } catch (tokenError) {
      console.log(`🔍 Session token validation error: ${tokenError.message}`)
      return {
        success: false,
        message: 'Invalid session token',
        code: 'INVALID_SESSION'
      }
    }
    
    // Save launcher statistics
    const statsQuery = `
      INSERT INTO launcher_statistics (
        user_id, 
        session_token, 
        update_duration, 
        files_updated, 
        bytes_downloaded, 
        cache_hits, 
        cache_misses, 
        launcher_version, 
        ip_address,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `
    
    await executeQuery(statsQuery, [
      userId,
      sessionToken,
      updateDuration || 0,
      filesUpdated || 0,
      bytesDownloaded || 0,
      cacheHits || 0,
      cacheMisses || 0,
      launcherVersion || 'Unknown',
      ip
    ])
    
    // Update user activity
    const updateUserQuery = `
      UPDATE users 
      SET last_launcher_activity = NOW(), last_ip = ?
      WHERE id = ? AND is_active = TRUE AND is_banned = FALSE
    `
    
    await executeQuery(updateUserQuery, [ip, userId])
    
    console.log(`📊 Launcher stats saved for user: ${user.name} (${user.email})`)
    console.log(`   Files updated: ${filesUpdated}, Bytes: ${bytesDownloaded}, Duration: ${updateDuration}s`)
    console.log(`   User Status - Active: ${user.is_active}, Banned: ${user.is_banned}`)
    
    return {
      success: true,
      message: 'Statistics saved successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_active: user.is_active,
        is_banned: user.is_banned
      }
    }
    
  } catch (error) {
    console.error('❌ Launcher stats error:', error)
    return {
      success: false,
      message: 'Failed to save statistics',
      code: 'SERVER_ERROR'
    }
  }
})