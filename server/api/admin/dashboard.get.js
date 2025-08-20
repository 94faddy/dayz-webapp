// server/api/admin/dashboard.get.js
import { executeQuery } from '~/utils/database.js'
import { requireAdminAuth } from '~/server/utils/admin-middleware.js'

export default defineEventHandler(async (event) => {
  const admin = await requireAdminAuth(event)
  
  try {
    // Get user statistics
    const userStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN is_banned = TRUE THEN 1 ELSE 0 END) as banned_users,
        SUM(CASE WHEN is_active = FALSE AND is_banned = FALSE THEN 1 ELSE 0 END) as pending_users
      FROM users
    `)
    
    // Get store statistics
    const storeStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_items
      FROM store_items
    `)
    
    // Get revenue statistics
    const revenueStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_price) as total_revenue,
        SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END) as completed_revenue
      FROM user_purchases
    `)
    
    // Get recent activities
    const recentActivities = await executeQuery(`
      SELECT 
        aal.*,
        au.username as admin_username
      FROM admin_activity_logs aal
      JOIN admin_users au ON aal.admin_id = au.id
      ORDER BY aal.created_at DESC
      LIMIT 10
    `)
    
    // Get pending users
    const pendingUsers = await executeQuery(`
      SELECT 
        id, email, name, steamid64, created_at, last_ip, mac_address
      FROM users
      WHERE is_active = FALSE AND is_banned = FALSE
      ORDER BY created_at DESC
      LIMIT 10
    `)
    
    // Get recent orders
    const recentOrders = await executeQuery(`
      SELECT 
        up.*,
        u.name as user_name,
        u.email as user_email,
        si.name as item_name
      FROM user_purchases up
      JOIN users u ON up.user_id = u.id
      JOIN store_items si ON up.item_id = si.id
      ORDER BY up.created_at DESC
      LIMIT 10
    `)
    
    return {
      success: true,
      stats: {
        totalUsers: userStats[0].total_users || 0,
        activeUsers: userStats[0].active_users || 0,
        bannedUsers: userStats[0].banned_users || 0,
        pendingUsers: userStats[0].pending_users || 0,
        totalItems: storeStats[0].total_items || 0,
        activeItems: storeStats[0].active_items || 0,
        totalOrders: revenueStats[0].total_orders || 0,
        totalRevenue: revenueStats[0].total_revenue || 0,
        completedRevenue: revenueStats[0].completed_revenue || 0
      },
      recentActivities,
      pendingUsers,
      recentOrders
    }
  } catch (error) {
    console.error('Dashboard API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load dashboard data'
    })
  }
})