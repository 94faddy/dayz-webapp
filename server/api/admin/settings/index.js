// server/api/admin/settings/index.js
import { executeQuery } from '~/utils/database.js'
import { requireAdminAuth } from '~/server/utils/admin-middleware.js'
import { logAdminActivity, hasAdminPermission } from '~/utils/admin-auth.js'
import { getHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const admin = await requireAdminAuth(event)
  const method = event.node.req.method
  
  // Get IP for logging
  const ip = getHeader(event, 'x-forwarded-for') || 
             getHeader(event, 'x-real-ip') || 
             event.node?.req?.connection?.remoteAddress ||
             '127.0.0.1'
  
  switch (method) {
    case 'GET':
      return await getSettings(admin)
    case 'PUT':
      return await updateSettings(event, admin, ip)
    default:
      throw createError({
        statusCode: 405,
        statusMessage: 'Method not allowed'
      })
  }
})

async function getSettings(admin) {
  // Check permission
  if (!await hasAdminPermission(admin.id, 'settings:read')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  try {
    // Get server config
    const serverConfig = await executeQuery('SELECT * FROM server_config')
    const config = {}
    serverConfig.forEach(row => {
      config[row.config_key] = row.config_value
    })
    
    // Get system settings
    const systemSettings = await executeQuery('SELECT * FROM system_settings WHERE category != "internal"')
    const settings = {}
    systemSettings.forEach(row => {
      if (!settings[row.category]) {
        settings[row.category] = {}
      }
      settings[row.category][row.setting_key] = {
        value: row.setting_value,
        type: row.setting_type,
        description: row.description,
        is_public: row.is_public
      }
    })
    
    return {
      success: true,
      serverConfig: config,
      systemSettings: settings
    }
  } catch (error) {
    console.error('Failed to get settings:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load settings'
    })
  }
}

async function updateSettings(event, admin, ip) {
  // Check permission
  if (!await hasAdminPermission(admin.id, 'settings:write')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permission denied'
    })
  }
  
  const body = await readBody(event)
  const { type, key, value } = body
  
  try {
    let oldValue = null
    
    if (type === 'server_config') {
      // Get current value
      const [current] = await executeQuery(
        'SELECT config_value FROM server_config WHERE config_key = ?',
        [key]
      )
      oldValue = current ? current.config_value : null
      
      // Update server config
      await executeQuery(
        `INSERT INTO server_config (config_key, config_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
        [key, value]
      )
      
      // Special handling for auto_approve_users
      if (key === 'auto_approve_users') {
        if (value === 'true') {
          // Auto approve all pending users
          const pendingUsers = await executeQuery(
            'SELECT id, email FROM users WHERE is_active = FALSE AND is_banned = FALSE'
          )
          
          if (pendingUsers.length > 0) {
            await executeQuery(
              'UPDATE users SET is_active = TRUE WHERE is_active = FALSE AND is_banned = FALSE'
            )
            
            console.log(`✅ Auto-approved ${pendingUsers.length} pending users`)
            
            // Log activity
            await logAdminActivity(
              admin.id,
              'auto_approve_enabled',
              'setting',
              null,
              `Enabled auto-approval and approved ${pendingUsers.length} pending users`,
              { auto_approve: false, pending_count: pendingUsers.length },
              { auto_approve: true, approved_count: pendingUsers.length },
              ip
            )
          }
        }
      }
      
    } else if (type === 'system_settings') {
      // Get current value
      const [current] = await executeQuery(
        'SELECT setting_value FROM system_settings WHERE setting_key = ?',
        [key]
      )
      oldValue = current ? current.setting_value : null
      
      // Update system settings
      await executeQuery(
        `INSERT INTO system_settings (setting_key, setting_value, updated_by) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         setting_value = VALUES(setting_value),
         updated_by = VALUES(updated_by)`,
        [key, value, admin.id]
      )
    }
    
    // Log activity
    await logAdminActivity(
      admin.id,
      'update_setting',
      'setting',
      null,
      `Updated ${type}: ${key}`,
      { [key]: oldValue },
      { [key]: value },
      ip
    )
    
    return {
      success: true,
      message: 'Setting updated successfully',
      key: key,
      value: value
    }
    
  } catch (error) {
    console.error('Failed to update setting:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update setting'
    })
  }
}