import { executeQuery } from '~/utils/database.js'
import { canChangeUserName } from '~/utils/auth.js'
import { updateUserAvatar } from '~/utils/avatar.js'

export default defineEventHandler(async (event) => {
  try {
    const session = await useSession(event, {
      maxAge: 24 * 60 * 60,
      password: process.env.SESSION_SECRET || 'my-super-secret-session-password-32-chars-minimum!',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      name: 'dayz-session'
    })
    
    if (!session.data || !session.data.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }
    
    const userId = session.data.user.id
    const body = await readBody(event)
    const { action, data } = body
    
    console.log('🔧 Profile update request:', { action, userId })
    
    switch (action) {
      case 'change_name':
        return await handleNameChange(userId, data.newName, session)
      
      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid action'
        })
    }
    
  } catch (error) {
    console.error('❌ Profile update error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Profile update failed'
    })
  }
})

async function handleNameChange(userId, newName, session) {
  console.log('🔧 Processing name change for userId:', userId, 'to:', newName)
  
  // Validation
  if (!newName || typeof newName !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name is required'
    })
  }
  
  if (newName.length < 3 || newName.length > 50) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name must be between 3-50 characters'
    })
  }
  
  // ตรวจสอบว่าเปลี่ยนชื่อได้หรือไม่
  const canChange = await canChangeUserName(userId)
  console.log('🔍 Can change name result:', canChange)
  
  if (!canChange) {
    throw createError({
      statusCode: 400,
      statusMessage: 'You have reached the monthly name change limit'
    })
  }
  
  // ตรวจสอบว่าชื่อซ้ำกับคนอื่นหรือไม่
  const existingUser = await executeQuery(
    'SELECT id FROM users WHERE name = ? AND id != ?',
    [newName, userId]
  )
  
  if (existingUser.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'This name is already taken'
    })
  }
  
  // ดึงข้อมูลปัจจุบันของ user
  const currentUserData = await executeQuery(
    'SELECT name, name_change_count, last_name_change FROM users WHERE id = ?',
    [userId]
  )
  
  if (currentUserData.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    })
  }
  
  const user = currentUserData[0]
  const currentDate = new Date()
  const currentDateString = currentDate.toISOString().split('T')[0]
  
  // คำนวณ name_change_count ใหม่
  let newNameChangeCount = 1
  
  if (user.last_name_change) {
    const lastChangeDate = new Date(user.last_name_change)
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    const lastChangeMonth = lastChangeDate.getMonth()
    const lastChangeYear = lastChangeDate.getFullYear()
    
    console.log('📅 Date calculation:', {
      currentMonth: currentMonth + 1,
      currentYear: currentYear,
      lastChangeMonth: lastChangeMonth + 1,
      lastChangeYear: lastChangeYear
    })
    
    if (lastChangeMonth === currentMonth && lastChangeYear === currentYear) {
      newNameChangeCount = (user.name_change_count || 0) + 1
      console.log('📊 Same month - incrementing count')
    } else {
      newNameChangeCount = 1
      console.log('📊 Different month - resetting count to 1')
    }
  }
  
  console.log('📊 Name change calculation:', {
    oldName: user.name,
    newName: newName,
    oldCount: user.name_change_count,
    newCount: newNameChangeCount,
    lastChange: user.last_name_change,
    currentDate: currentDateString
  })
  
  // อัปเดตชื่อและสร้าง avatar ใหม่
  try {
    // สร้าง avatar ใหม่จากชื่อใหม่
    const newAvatarData = await updateUserAvatar(userId, newName)
    
    // อัปเดตชื่อในฐานข้อมูล
    await executeQuery(`
      UPDATE users 
      SET name = ?, 
          name_change_count = ?,
          last_name_change = ?,
          updated_at = NOW()
      WHERE id = ?
    `, [newName, newNameChangeCount, currentDateString, userId])
    
    // อัปเดต session
    await session.update({
      ...session.data,
      user: {
        ...session.data.user,
        name: newName,
        avatar_data: newAvatarData
      }
    })
    
    console.log('✅ Name and avatar updated successfully for user:', userId)
    
    return {
      success: true,
      message: 'Name changed successfully',
      newName: newName,
      nameChangeCount: newNameChangeCount,
      lastNameChange: currentDateString,
      avatarData: newAvatarData
    }
    
  } catch (error) {
    console.error('❌ Name change database error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update name in database'
    })
  }
}