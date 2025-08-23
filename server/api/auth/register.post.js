// server/api/auth/register.post.js
import { getHeader } from 'h3'
import { 
  validateEmail, 
  validateSteamID64, 
  checkUserExists, 
  createUser, 
  checkBanStatus 
} from '~/utils/auth.js'
import { generateAvatarFromName } from '~/utils/avatar.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, name, steamid64, password, confirmPassword } = body
    
    // Get client IP and MAC address
    const ip = getHeader(event, 'x-forwarded-for') || 
               getHeader(event, 'x-real-ip') || 
               getHeader(event, 'cf-connecting-ip') || 
               event.node?.req?.connection?.remoteAddress ||
               event.node?.req?.socket?.remoteAddress ||
               '127.0.0.1'
    const macAddress = getHeader(event, 'x-mac-address') || null
    
    // Validation
    if (!email || !name || !steamid64 || !password || !confirmPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'All fields are required'
      })
    }
    
    if (password !== confirmPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Passwords do not match'
      })
    }
    
    if (password.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 6 characters'
      })
    }
    
    if (!await validateEmail(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }
    
    if (!await validateSteamID64(steamid64)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid Steam ID64 format'
      })
    }
    
    if (name.length < 3 || name.length > 50) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name must be between 3-50 characters'
      })
    }
    
    // Check if banned
    const banStatus = await checkBanStatus(ip, macAddress, steamid64)
    if (banStatus) {
      throw createError({
        statusCode: 403,
        statusMessage: `Registration blocked: ${banStatus.reason}`
      })
    }
    
    // Check if user already exists
    const existingUser = await checkUserExists(email, steamid64)
    if (existingUser) {
      if (existingUser.email === email) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Email already registered'
        })
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: 'Steam ID64 already registered'
        })
      }
    }
    
    // Generate avatar data based on name
    const avatarData = generateAvatarFromName(name)
    console.log('🎨 Generated avatar for new user:', name, avatarData)
    
    // Create user with avatar data
    const userId = await createUser({
      email,
      name,
      steamid64,
      password,
      ip,
      macAddress,
      avatarData // Pass avatar data to createUser
    })
    
    return {
      success: true,
      message: 'Registration successful! Please wait for admin approval.',
      userId,
      avatar: avatarData
    }
    
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Registration error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Registration failed'
    })
  }
})