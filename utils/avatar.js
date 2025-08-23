// utils/avatar.js - Updated with consistent hash function
// Avatar utility functions for generating consistent colors and initials

// Predefined color palette for avatars (DayZ themed colors)
const AVATAR_COLORS = [
  '#dc2626', // Red
  '#ea580c', // Orange  
  '#d97706', // Amber
  '#ca8a04', // Yellow
  '#65a30d', // Lime
  '#16a34a', // Green
  '#059669', // Emerald
  '#0891b2', // Cyan
  '#0284c7', // Blue
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#9333ea', // Violet
  '#c026d3', // Fuchsia
  '#e11d48', // Rose
  '#374151', // Gray
  '#1f2937', // Dark Gray
  '#8b5cf6', // Purple variant
  '#06b6d4', // Cyan variant
  '#10b981', // Green variant
  '#f59e0b'  // Yellow variant
]

/**
 * Generate a consistent hash for a string
 * This is THE SINGLE SOURCE OF TRUTH for color generation
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
export function generateConsistentHash(str) {
  if (!str || typeof str !== 'string') return 0
  
  let hash = 0
  const cleanStr = str.trim().toLowerCase()
  
  for (let i = 0; i < cleanStr.length; i++) {
    const char = cleanStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return Math.abs(hash)
}

/**
 * Get consistent color for a name
 * @param {string} name - User's name
 * @returns {string} Hex color code
 */
export function getConsistentColorForName(name) {
  const hash = generateConsistentHash(name)
  const colorIndex = hash % AVATAR_COLORS.length
  return AVATAR_COLORS[colorIndex]
}

/**
 * Generate a random avatar color
 * @returns {string} Hex color code
 */
export function generateRandomAvatarColor() {
  const randomIndex = Math.floor(Math.random() * AVATAR_COLORS.length)
  return AVATAR_COLORS[randomIndex]
}

/**
 * Generate avatar data based on name
 * @param {string} name - User's name
 * @returns {object} Avatar data with type, color, and initial
 */
export function generateAvatarFromName(name) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return {
      type: 'initial',
      color: generateRandomAvatarColor(),
      initial: 'U' // Default for Unknown
    }
  }
  
  const cleanName = name.trim()
  const initial = cleanName.charAt(0).toUpperCase()
  const color = getConsistentColorForName(cleanName)
  
  return {
    type: 'initial',
    color: color,
    initial: initial
  }
}

/**
 * Get avatar initial from name
 * @param {string} name - User's name
 * @returns {string} First letter of name or 'U' for unknown
 */
export function getAvatarInitial(name) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return 'U'
  }
  return name.trim().charAt(0).toUpperCase()
}

/**
 * Update user's avatar data in database
 * @param {number} userId - User ID
 * @param {string} name - User's name
 * @returns {object} Avatar data
 */
export async function updateUserAvatar(userId, name) {
  const { executeQuery } = await import('./database.js')
  
  try {
    const avatarData = generateAvatarFromName(name)
    const avatarJsonString = JSON.stringify(avatarData)
    
    await executeQuery(`
      UPDATE users 
      SET avatar_data = ?,
          updated_at = NOW()
      WHERE id = ?
    `, [avatarJsonString, userId])
    
    console.log('✅ Avatar updated for user:', userId, avatarData)
    
    return avatarData
  } catch (error) {
    console.error('❌ Failed to update user avatar:', error)
    return generateAvatarFromName(name) // Return generated data even if DB update fails
  }
}

// Export the colors array for use in other components
export { AVATAR_COLORS }