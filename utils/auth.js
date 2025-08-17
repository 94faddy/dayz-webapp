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
  let query = `
    SELECT br.*, u.email, u.name 
    FROM ban_records br
    LEFT JOIN users u ON br.user_id = u.id
    WHERE br.is_active = TRUE 
    AND (br.banned_until IS NULL OR br.banned_until > NOW())
    AND (
      br.ip_address = ? 
      ${macAddress ? 'OR br.mac_address = ?' : ''}
      ${steamid64 ? 'OR u.steamid64 = ?' : ''}
    )
    LIMIT 1
  `
  
  const params = [ip]
  if (macAddress) params.push(macAddress)
  if (steamid64) params.push(steamid64)
  
  const result = await executeQuery(query, params)
  return result.length > 0 ? result[0] : null
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

export async function createUser(userData) {
  const { email, name, steamid64, password, ip, macAddress } = userData
  
  const hashedPassword = await hashPassword(password)
  const config = await getServerConfig()
  const isActive = config.auto_approve_users === 'true'
  
  const query = `
    INSERT INTO users (email, name, steamid64, password, is_active, last_ip, mac_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `
  
  const result = await executeQuery(query, [
    email, name, steamid64, hashedPassword, isActive, ip, macAddress
  ])
  
  return result.insertId
}

export async function loginUser(email, password, ip, macAddress) {
  // Check ban status first
  const banStatus = await checkBanStatus(ip, macAddress)
  if (banStatus) {
    throw new Error(`Account is banned: ${banStatus.reason}`)
  }
  
  // Get user - ✅ เพิ่ม steamid64 ในการ SELECT
  const query = `
    SELECT id, email, name, steamid64, password, is_active, is_banned, points
    FROM users 
    WHERE email = ?
  `
  const users = await executeQuery(query, [email])
  
  if (users.length === 0) {
    throw new Error('Invalid email or password')
  }
  
  const user = users[0]
  
  if (user.is_banned) {
    throw new Error('Your account has been banned')
  }
  
  const isValidPassword = await verifyPassword(password, user.password)
  if (!isValidPassword) {
    // Log failed attempt
    await logLoginAttempt(email, ip, false)
    throw new Error('Invalid email or password')
  }
  
  // แทนที่จะโยน Error ให้ return status แทน
  if (!user.is_active) {
    // Log successful password but pending approval
    await logLoginAttempt(email, ip, true)
    
    return {
      status: 'pending_approval',
      message: 'Your account is pending admin approval. Please wait for approval notification.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        steamid64: user.steamid64 // ✅ เพิ่ม steamid64
      }
    }
  }
  
  // Update last login
  await executeQuery(
    'UPDATE users SET last_login = NOW(), last_ip = ?, mac_address = ? WHERE id = ?',
    [ip, macAddress, user.id]
  )
  
  // Log successful attempt
  await logLoginAttempt(email, ip, true)
  
  return {
    status: 'success',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      steamid64: user.steamid64, // ✅ เพิ่ม steamid64
      points: user.points || 0
    }
  }
}

export async function logLoginAttempt(email, ip, success) {
  const query = `
    INSERT INTO login_attempts (email, ip_address, success)
    VALUES (?, ?, ?)
  `
  await executeQuery(query, [email, ip, success])
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

// 🔧 แก้ไข canChangeUserName function ให้ทำงานถูกต้อง
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
  
  // ดึง config สำหรับ max changes
  const config = await getServerConfig()
  const maxChanges = parseInt(config.max_name_changes_per_month || '1')
  
  // ถ้าไม่เคยเปลี่ยนชื่อเลย ให้เปลี่ยนได้
  if (!user.last_name_change || user.name_change_count === 0) {
    console.log('✅ Never changed name before - allowed')
    return true
  }
  
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() // 0-11
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
  
  // ตรวจสอบว่าอยู่ในเดือนเดียวกันหรือไม่
  const isSameMonth = lastChangeMonth === currentMonth && lastChangeYear === currentYear
  
  if (!isSameMonth) {
    console.log('✅ Different month - allowed (will reset count)')
    return true
  }
  
  // ถ้าอยู่ในเดือนเดียวกัน ตรวจสอบจำนวนครั้ง
  const allowed = user.name_change_count < maxChanges
  
  console.log('📊 Same month check:', {
    nameChangeCount: user.name_change_count,
    maxChanges: maxChanges,
    allowed: allowed
  })
  
  return allowed
}