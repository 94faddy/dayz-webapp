// utils/auth.js - Updated createUser function
import bcrypt from 'bcryptjs'
import { executeQuery } from './database.js'

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10)
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword)
}

export async function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function validateSteamID64(steamid64) {
  // SteamID64 should be 17 digits and start with 7656119
  const steamRegex = /^7656119[0-9]{10}$/
  return steamRegex.test(steamid64)
}

export async function checkBanStatus(ip, macAddress = null, steamid64 = null) {
  try {
    let query = `
      SELECT br.*, u.email, u.name, u.steamid64
      FROM ban_records br
      LEFT JOIN users u ON br.user_id = u.id
      WHERE br.is_active = TRUE 
      AND (br.banned_until IS NULL OR br.banned_until > NOW())
      AND (
        br.ip_address = ?
        ${macAddress ? ' OR br.mac_address = ?' : ''}
        ${steamid64 ? ' OR u.steamid64 = ?' : ''}
      )
      ORDER BY br.created_at DESC
      LIMIT 1
    `
    
    const params = [ip]
    if (macAddress) params.push(macAddress)
    if (steamid64) params.push(steamid64)
    
    console.log('🔍 Checking ban status for:', { ip, macAddress, steamid64 })
    
    const result = await executeQuery(query, params)
    
    if (result.length > 0) {
      const banRecord = result[0]
      console.log('🚫 Ban record found:', {
        id: banRecord.id,
        reason: banRecord.reason,
        user: banRecord.email,
        ip: banRecord.ip_address,
        mac: banRecord.mac_address
      })
      return banRecord
    }
    
    console.log('✅ No ban record found')
    return null
    
  } catch (error) {
    console.error('Error checking ban status:', error)
    return null
  }
}

export async function checkUserExists(email, steamid64) {
  const query = `
    SELECT id, email, steamid64, is_banned 
    FROM users 
    WHERE email = ? OR steamid64 = ?
  `
  const result = await executeQuery(query, [email, steamid64])
  return result.length > 0 ? result[0] : null
}

// ✅ Updated createUser function with avatar support
export async function createUser(userData) {
  const { email, name, steamid64, password, ip, macAddress, avatarData } = userData
  
  const hashedPassword = await hashPassword(password)
  const config = await getServerConfig()
  const isActive = config.auto_approve_users === 'true'
  
  // Prepare avatar data for database
  const avatarJsonString = avatarData ? JSON.stringify(avatarData) : null
  
  const query = `
    INSERT INTO users (
      email, name, steamid64, password, is_active, 
      last_ip, mac_address, registration_ip, registration_mac, avatar_data
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  
  const result = await executeQuery(query, [
    email, name, steamid64, hashedPassword, isActive, 
    ip, macAddress, ip, macAddress, avatarJsonString
  ])
  
  console.log('✅ User created with avatar:', email, avatarData)
  
  return result.insertId
}

export async function loginUser(email, password, ip, macAddress = null) {
  console.log(`🔐 Login attempt: ${email} from IP: ${ip}`)
  
  try {
    const userQuery = `
      SELECT id, email, name, steamid64, password, is_active, is_banned, points, banned_reason, avatar_data
      FROM users 
      WHERE email = ?
    `
    const users = await executeQuery(userQuery, [email])
    
    if (users.length === 0) {
      console.log(`❌ User not found: ${email}`)
      await logLoginAttempt(email, ip, false, 'USER_NOT_FOUND')
      throw new Error('Invalid email or password')
    }
    
    const user = users[0]
    console.log(`🔍 User found: ${user.name} - Active: ${user.is_active}, Banned: ${user.is_banned}`)
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      console.log(`❌ Invalid password for: ${email}`)
      await logLoginAttempt(email, ip, false, 'INVALID_PASSWORD')
      throw new Error('Invalid email or password')
    }
    
    // Check ban status
    const banStatus = await checkBanStatus(ip, macAddress, user.steamid64)
    if (banStatus) {
      console.log(`🚫 Login blocked - banned IP/MAC/User: ${ip}/${macAddress}/${user.steamid64}`)
      const banReason = banStatus.reason || 'Access denied by administrator'
      await logLoginAttempt(email, ip, false, 'BANNED_IP_MAC_USER')
      
      return {
        status: 'banned',
        code: 'ACCOUNT_BANNED',
        message: `Your account is restricted: ${banReason}`,
        banReason: banReason,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          steamid64: user.steamid64,
          is_active: user.is_active,
          is_banned: user.is_banned
        }
      }
    }
    
    if (user.is_banned) {
      console.log(`🚫 Login blocked - banned user: ${email}`)
      await logLoginAttempt(email, ip, false, 'BANNED_USER')
      
      return {
        status: 'banned',
        code: 'ACCOUNT_BANNED',
        message: 'Your account has been suspended by administrator',
        banReason: user.banned_reason || 'Account suspended',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          steamid64: user.steamid64,
          is_active: user.is_active,
          is_banned: user.is_banned
        }
      }
    }
    
    if (!user.is_active) {
      console.log(`⏳ User pending approval or deactivated: ${email} - Active: ${user.is_active}`)
      await logLoginAttempt(email, ip, true, 'PENDING_APPROVAL')
      
      return {
        status: 'pending_approval',
        code: 'ACCOUNT_INACTIVE',
        message: 'Your account is currently inactive. Please contact administrator for activation.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          steamid64: user.steamid64,
          points: user.points || 0,
          is_active: user.is_active,
          is_banned: user.is_banned
        }
      }
    }
    
    // Parse avatar data
    let avatarData = null
    if (user.avatar_data) {
      try {
        avatarData = typeof user.avatar_data === 'string' 
          ? JSON.parse(user.avatar_data) 
          : user.avatar_data
      } catch (error) {
        console.error('❌ Failed to parse avatar_data:', error)
        avatarData = null
      }
    }
    
    // Update login info
    try {
      await executeQuery(
        'UPDATE users SET last_login = NOW(), last_ip = ?, mac_address = ? WHERE id = ?',
        [ip, macAddress, user.id]
      )
    } catch (updateError) {
      console.warn('Failed to update user login info:', updateError.message)
    }
    
    await logLoginAttempt(email, ip, true, 'SUCCESS')
    
    console.log(`✅ Login successful: ${user.name} (${email}) - Active: ${user.is_active}`)
    
    return {
      status: 'success',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        steamid64: user.steamid64,
        points: user.points || 0,
        is_active: user.is_active,
        is_banned: user.is_banned,
        avatar_data: avatarData // Include avatar data in login response
      }
    }
    
  } catch (error) {
    console.error(`❌ Login error for ${email}:`, error.message)
    throw error
  }
}

export async function logLoginAttempt(email, ip, success, reason = null) {
  try {
    const query = `
      INSERT INTO login_attempts (email, ip_address, success)
      VALUES (?, ?, ?)
    `
    await executeQuery(query, [email, ip, success])
    
    if (reason) {
      console.log(`📝 Login attempt logged: ${email} - ${success ? 'SUCCESS' : 'FAILED'} - Reason: ${reason}`)
    }
  } catch (error) {
    console.warn('Failed to log login attempt:', error.message)
  }
}

export async function getServerConfig() {
  const query = 'SELECT config_key, config_value FROM server_config'
  const results = await executeQuery(query)
  
  const config = {}
  results.forEach(row => {
    config[row.config_key] = row.config_value
  })
  
  return config
}

export async function canChangeUserName(userId) {
  console.log('🔍 Checking name change eligibility for userId:', userId)
  
  const query = `
    SELECT name_change_count, last_name_change 
    FROM users 
    WHERE id = ?
  `
  const result = await executeQuery(query, [userId])
  
  if (result.length === 0) {
    console.log('❌ User not found')
    return false
  }
  
  const user = result[0]
  console.log('📊 User data:', user)
  
  const config = await getServerConfig()
  const maxChanges = parseInt(config.max_name_changes_per_month || '1')
  
  if (!user.last_name_change || user.name_change_count === 0) {
    console.log('✅ Never changed name before - allowed')
    return true
  }
  
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  const lastChangeDate = new Date(user.last_name_change)
  const lastChangeMonth = lastChangeDate.getMonth()
  const lastChangeYear = lastChangeDate.getFullYear()
  
  console.log('📅 Date comparison:', {
    current: `${currentYear}-${currentMonth + 1}`,
    lastChange: `${lastChangeYear}-${lastChangeMonth + 1}`,
    nameChangeCount: user.name_change_count,
    maxChanges: maxChanges
  })
  
  const isSameMonth = lastChangeMonth === currentMonth && lastChangeYear === currentYear
  
  if (!isSameMonth) {
    console.log('✅ Different month - allowed (will reset count)')
    return true
  }
  
  const allowed = user.name_change_count < maxChanges
  
  console.log('📊 Same month check:', {
    nameChangeCount: user.name_change_count,
    maxChanges: maxChanges,
    allowed: allowed
  })
  
  return allowed
}