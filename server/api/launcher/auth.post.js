import { getHeader } from 'h3'
import { loginUser, getServerConfig } from '~/utils/auth.js'
import fs from 'fs'
import path from 'path'
import { executeQuery } from '~/utils/database.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { action, email, password, name, steamid64, confirmPassword, macAddress, launcherVersion } = body
    
    // Get client IP
    const ip = getHeader(event, 'x-forwarded-for') || 
               getHeader(event, 'x-real-ip') || 
               getHeader(event, 'cf-connecting-ip') || 
               event.node?.req?.connection?.remoteAddress ||
               event.node?.req?.socket?.remoteAddress ||
               '127.0.0.1'
    
    // Validation
    if (!action || !email || !password) {
      return {
        success: false,
        message: 'Action, email and password are required',
        code: 'INVALID_INPUT'
      }
    }
    
    if (!macAddress) {
      return {
        success: false,
        message: 'MAC Address is required for launcher authentication',
        code: 'MAC_REQUIRED'
      }
    }
    
    try {
      if (action === 'login') {
        // Login user
        const result = await loginUser(email, password, ip, macAddress)
        
        // ✅ เพิ่ม debug log
        console.log('🔍 Result from loginUser:', result)
        console.log('🔍 Result user steamid64:', result.user?.steamid64)
        
        // Handle pending approval
        if (result.status === 'pending_approval') {
          return {
            success: false,
            status: 'pending_approval',
            message: result.message,
            code: 'PENDING_APPROVAL',
            user: result.user
          }
        }
        
        // Update launcher login count
        await executeQuery(
          'UPDATE users SET launcher_login_count = launcher_login_count + 1, last_launcher_activity = NOW() WHERE id = ?',
          [result.user.id]
        )
        
        // Get server configuration
        const config = await getServerConfig()
        
        // Read server connection info from file
        let serverInfo = {
          ip: config.dayz_server_ip || '127.0.0.1',
          port: config.dayz_server_port || '2302'
        }
        
        // Try to read from server info file if exists
        try {
          const serverInfoPath = path.join(process.cwd(), 'server_info.txt')
          if (fs.existsSync(serverInfoPath)) {
            const serverData = fs.readFileSync(serverInfoPath, 'utf8').trim().split(':')
            if (serverData.length === 2) {
              serverInfo.ip = serverData[0]
              serverInfo.port = serverData[1]
            }
          }
        } catch (fileError) {
          console.log('Server info file not found, using config values')
        }
        
        console.log(`🎮 Launcher login successful: ${result.user.name} (${result.user.email})`)
        console.log(`   IP: ${ip}, MAC: ${macAddress}, Version: ${launcherVersion}`)
        
        // ✅ สร้าง response object และ debug ก่อน return
        const response = {
          success: true,
          message: 'Login successful',
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            steamid64: result.user.steamid64,
            points: result.user.points
          },
          server: serverInfo,
          sessionToken: generateSessionToken(result.user.id)
        }
        
        return response
      } 
      else if (action === 'register') {
        // Import register functions
        const { 
          validateEmail, 
          validateSteamID64, 
          checkUserExists, 
          createUser, 
          checkBanStatus 
        } = await import('~/utils/auth.js')
        
        // Validation for registration
        if (!name || !steamid64 || !confirmPassword) {
          return {
            success: false,
            message: 'All fields are required for registration',
            code: 'INVALID_INPUT'
          }
        }
        
        if (password !== confirmPassword) {
          return {
            success: false,
            message: 'Passwords do not match',
            code: 'PASSWORD_MISMATCH'
          }
        }
        
        if (password.length < 6) {
          return {
            success: false,
            message: 'Password must be at least 6 characters',
            code: 'PASSWORD_TOO_SHORT'
          }
        }
        
        if (!await validateEmail(email)) {
          return {
            success: false,
            message: 'Invalid email format',
            code: 'INVALID_EMAIL'
          }
        }
        
        if (!await validateSteamID64(steamid64)) {
          return {
            success: false,
            message: 'Invalid Steam ID64 format',
            code: 'INVALID_STEAMID'
          }
        }
        
        if (name.length < 3 || name.length > 50) {
          return {
            success: false,
            message: 'Name must be between 3-50 characters',
            code: 'INVALID_NAME_LENGTH'
          }
        }
        
        // Check if banned
        const banStatus = await checkBanStatus(ip, macAddress, steamid64)
        if (banStatus) {
          return {
            success: false,
            message: `Registration blocked: ${banStatus.reason}`,
            code: 'ACCOUNT_BANNED'
          }
        }
        
        // Check if user already exists
        const existingUser = await checkUserExists(email, steamid64)
        if (existingUser) {
          if (existingUser.email === email) {
            return {
              success: false,
              message: 'Email already registered',
              code: 'EMAIL_EXISTS'
            }
          } else {
            return {
              success: false,
              message: 'Steam ID64 already registered',
              code: 'STEAMID_EXISTS'
            }
          }
        }
        
        // Create user
        const userId = await createUser({
          email,
          name,
          steamid64,
          password,
          ip,
          macAddress
        })
        
        console.log(`📝 Launcher registration: ${name} (${email}) - ID: ${userId}`)
        console.log(`   Steam ID: ${steamid64}, IP: ${ip}, MAC: ${macAddress}`)
        
        return {
          success: true,
          message: 'Registration successful! Please wait for admin approval.',
          userId,
          code: 'REGISTRATION_SUCCESS'
        }
      }
      else {
        return {
          success: false,
          message: 'Invalid action',
          code: 'INVALID_ACTION'
        }
      }
      
    } catch (authError) {
      console.error('🔐 Launcher auth error:', authError)
      return {
        success: false,
        message: authError.message,
        code: getErrorCode(authError.message)
      }
    }
    
  } catch (error) {
    console.error('❌ Launcher auth system error:', error)
    return {
      success: false,
      message: 'Authentication server error',
      code: 'SERVER_ERROR'
    }
  }
})

function generateSessionToken(userId) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2)
  return `launcher_${userId}_${timestamp}_${random}`
}

function getErrorCode(message) {
  if (message.includes('banned')) return 'ACCOUNT_BANNED'
  if (message.includes('pending approval')) return 'PENDING_APPROVAL'
  if (message.includes('Invalid email')) return 'INVALID_CREDENTIALS'
  if (message.includes('Invalid password')) return 'INVALID_CREDENTIALS'
  return 'AUTH_FAILED'
}