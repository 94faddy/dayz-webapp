// utils/admin-auth.js
import bcrypt from 'bcryptjs'
import { executeQuery } from './database.js'

export async function loginAdmin(username, password, ip) {
  try {
    // Get admin user
    const query = `
      SELECT id, username, email, password, role, permissions, is_active
      FROM admin_users 
      WHERE (username = ? OR email = ?) AND is_active = TRUE
    `
    
    const admins = await executeQuery(query, [username, username])
    
    if (admins.length === 0) {
      throw new Error('Invalid credentials')
    }
    
    const admin = admins[0]
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password)
    if (!isValidPassword) {
      // Log failed attempt
      await logAdminActivity(null, 'failed_login', null, null, `Failed login attempt for: ${username}`, null, null, ip)
      throw new Error('Invalid credentials')
    }
    
    // Update last login
    await executeQuery(
      'UPDATE admin_users SET last_login = NOW(), last_ip = ? WHERE id = ?',
      [ip, admin.id]
    )
    
    // Log successful login
    await logAdminActivity(admin.id, 'login', null, null, 'Admin logged in', null, null, ip)
    
    // Parse permissions
    let permissions = {}
    if (admin.permissions) {
      try {
        permissions = typeof admin.permissions === 'string' 
          ? JSON.parse(admin.permissions) 
          : admin.permissions
      } catch (e) {
        console.error('Failed to parse permissions:', e)
      }
    }
    
    return {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      permissions: permissions
    }
  } catch (error) {
    console.error('Admin login error:', error)
    throw error
  }
}

export async function logAdminActivity(adminId, action, targetType, targetId, description, oldData, newData, ipAddress, userAgent = null) {
  try {
    // Skip logging if no adminId for failed login attempts
    if (!adminId && action === 'failed_login') {
      console.log('⚠️ Failed login attempt:', description)
      return
    }
    
    const query = `
      INSERT INTO admin_activity_logs 
      (admin_id, action, target_type, target_id, description, old_data, new_data, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const oldDataJson = oldData ? JSON.stringify(oldData) : null
    const newDataJson = newData ? JSON.stringify(newData) : null
    
    await executeQuery(query, [
      adminId || null,
      action,
      targetType,
      targetId,
      description,
      oldDataJson,
      newDataJson,
      ipAddress,
      userAgent
    ])
  } catch (error) {
    console.error('Failed to log admin activity:', error.message)
  }
}

export async function hasAdminPermission(adminId, permission) {
  const query = `
    SELECT role, permissions 
    FROM admin_users 
    WHERE id = ? AND is_active = TRUE
  `
  
  const result = await executeQuery(query, [adminId])
  
  if (result.length === 0) return false
  
  const admin = result[0]
  
  // Super admin has all permissions
  if (admin.role === 'super_admin') return true
  
  // Check specific permissions
  if (admin.permissions) {
    const permissions = typeof admin.permissions === 'string' 
      ? JSON.parse(admin.permissions) 
      : admin.permissions
    
    const [resource, action] = permission.split(':')
    
    return permissions[resource] === 'all' || 
           permissions[resource] === action ||
           (Array.isArray(permissions[resource]) && permissions[resource].includes(action))
  }
  
  return false
}

export async function createDefaultAdmin() {
  try {
    // Check if any admin exists
    const existingAdmins = await executeQuery('SELECT COUNT(*) as count FROM admin_users')
    
    if (existingAdmins[0].count > 0) {
      console.log('✅ Admin users already exist')
      return
    }
    
    // Create default super admin
    const defaultPassword = await bcrypt.hash('admin123', 12)
    
    const query = `
      INSERT INTO admin_users (username, email, password, role, permissions, is_active)
      VALUES (?, ?, ?, 'super_admin', ?, TRUE)
    `
    
    const permissions = JSON.stringify({
      users: 'all',
      items: 'all',
      orders: 'all',
      settings: 'all',
      logs: 'all'
    })
    
    await executeQuery(query, [
      'admin',
      'admin@dayz.nightro.cc',
      defaultPassword,
      permissions
    ])
    
    console.log('✅ Default admin created - Username: admin, Password: admin123')
  } catch (error) {
    console.error('Failed to create default admin:', error)
  }
}

// Initialize default admin on startup
if (process.server) {
  createDefaultAdmin()
}