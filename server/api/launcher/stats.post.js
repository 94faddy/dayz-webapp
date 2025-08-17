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
    
    // Verify user exists and is active
    const userQuery = `
      SELECT id, email, name, is_active, is_banned
      FROM users 
      WHERE id = ? AND is_active = TRUE AND is_banned = FALSE
    `
    
    const users = await executeQuery(userQuery, [userId])
    
    if (users.length === 0) {
      return {
        success: false,
        message: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      }
    }
    
    const user = users[0]
    
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
      WHERE id = ?
    `
    
    await executeQuery(updateUserQuery, [ip, userId])
    
    console.log(`📊 Launcher stats saved for user: ${user.name} (${user.email})`)
    console.log(`   Files updated: ${filesUpdated}, Bytes: ${bytesDownloaded}, Duration: ${updateDuration}s`)
    
    return {
      success: true,
      message: 'Statistics saved successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
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