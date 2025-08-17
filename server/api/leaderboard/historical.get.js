import { executeQuery } from '~/utils/database.js'

export default defineEventHandler(async (event) => {
  try {
    console.log('🏆 Historical leaderboard API called')
    
    const query = getQuery(event)
    const view = query.view || 'current' // 'current' or 'all_time'
    const limit = parseInt(query.limit) || 100
    
    console.log('📊 Request params:', { view, limit })
    
    // ตรวจสอบและสร้างตารางก่อน
    await ensureHistoricalTableExists()
    
    let leaderboardData
    
    if (view === 'all_time') {
      // ดึงข้อมูล All-time Best
      leaderboardData = await fetchAllTimeBestData(limit)
    } else {
      // ดึงข้อมูล Current Rankings
      leaderboardData = await fetchCurrentRankingsData(limit)
    }
    
    return {
      success: true,
      data: leaderboardData.players,
      metadata: {
        totalPlayers: leaderboardData.totalPlayers,
        view: view,
        lastUpdated: leaderboardData.lastUpdated || new Date().toISOString(),
        source: 'historical_database'
      }
    }
    
  } catch (error) {
    console.error('❌ Historical leaderboard API error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch historical leaderboard'
    })
  }
})

// ตรวจสอบและสร้างตาราง historical_rankings
async function ensureHistoricalTableExists() {
  try {
    // ลองดึงข้อมูลจากตาราง
    await executeQuery('SELECT 1 FROM historical_rankings LIMIT 1')
    console.log('✅ Historical rankings table exists')
  } catch (error) {
    console.log('❌ Historical rankings table not found, creating...')
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS historical_rankings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        steam_id VARCHAR(20) NOT NULL,
        player_name VARCHAR(255) NOT NULL,
        
        current_kdr DECIMAL(5,2) DEFAULT 0,
        current_kills INT DEFAULT 0,
        current_deaths INT DEFAULT 0,
        current_time_hours DECIMAL(8,2) DEFAULT 0,
        current_longest_shot DECIMAL(10,2) DEFAULT 0,
        current_zombie_kills INT DEFAULT 0,
        current_score DECIMAL(10,2) DEFAULT 0,
        
        best_kdr DECIMAL(5,2) DEFAULT 0,
        best_kills INT DEFAULT 0,
        best_time_hours DECIMAL(8,2) DEFAULT 0,
        best_longest_shot DECIMAL(10,2) DEFAULT 0,
        best_zombie_kills INT DEFAULT 0,
        best_score DECIMAL(10,2) DEFAULT 0,
        best_rank INT DEFAULT 999999,
        
        peak_score DECIMAL(10,2) DEFAULT 0,
        peak_rank INT DEFAULT 999999,
        peak_achieved_at DATETIME NULL,
        last_seen DATETIME NULL,
        
        total_updates INT DEFAULT 0,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_steam_id (steam_id),
        INDEX idx_current_score (current_score DESC),
        INDEX idx_peak_score (peak_score DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
    
    await executeQuery(createTableSQL)
    console.log('✅ Historical rankings table created')
  }
}

// ดึงข้อมูล Current Rankings
async function fetchCurrentRankingsData(limit) {
  try {
    console.log('📊 Fetching current rankings from database...')
    
    // ตรวจสอบว่ามีข้อมูลในตารางหรือไม่
    const countResult = await executeQuery('SELECT COUNT(*) as count FROM historical_rankings')
    const totalCount = countResult[0].count
    
    if (totalCount === 0) {
      console.log('ℹ️ No data in historical_rankings table')
      return {
        players: [],
        totalPlayers: 0,
        lastUpdated: new Date().toISOString()
      }
    }
    
    // ใช้ query แบบง่าย ไม่ใช้ parameterized query สำหรับ LIMIT
    const playersQuery = `
      SELECT 
        hr.*,
        CASE 
          WHEN hr.current_score >= hr.peak_score THEN 1
          ELSE 0
        END as is_peak_performance,
        CASE 
          WHEN hr.current_kdr >= hr.best_kdr THEN 1
          ELSE 0
        END as is_best_kdr_ever
      FROM historical_rankings hr
      WHERE hr.player_name IS NOT NULL 
      AND hr.player_name != 'Unknown Player'
      AND hr.current_score > 0
      ORDER BY hr.current_score DESC, hr.current_kdr DESC, hr.current_kills DESC
      LIMIT ${limit}
    `
    
    const players = await executeQuery(playersQuery)
    
    // ดึงข้อมูลสถิติรวม
    const statsQuery = `
      SELECT 
        COUNT(*) as total_players,
        MAX(updated_at) as last_updated
      FROM historical_rankings
      WHERE player_name IS NOT NULL 
      AND player_name != 'Unknown Player'
      AND current_score > 0
    `
    
    const statsResult = await executeQuery(statsQuery)
    const stats = statsResult[0] || { total_players: 0, last_updated: null }
    
    console.log(`✅ Current rankings loaded: ${players.length} players`)
    
    return {
      players,
      totalPlayers: stats.total_players,
      lastUpdated: stats.last_updated
    }
    
  } catch (error) {
    console.error('❌ Current rankings fetch error:', error)
    throw error
  }
}

// ดึงข้อมูล All-time Best
async function fetchAllTimeBestData(limit) {
  try {
    console.log('👑 Fetching all-time best from database...')
    
    // ตรวจสอบว่ามีข้อมูลในตารางหรือไม่
    const countResult = await executeQuery('SELECT COUNT(*) as count FROM historical_rankings WHERE peak_score > 0')
    const totalCount = countResult[0].count
    
    if (totalCount === 0) {
      console.log('ℹ️ No peak data in historical_rankings table')
      return {
        players: [],
        totalPlayers: 0,
        lastUpdated: new Date().toISOString()
      }
    }
    
    // ใช้ query แบบง่าย ไม่ใช้ parameterized query สำหรับ LIMIT
    const playersQuery = `
      SELECT 
        hr.*,
        1 as is_peak_performance,
        1 as is_best_kdr_ever
      FROM historical_rankings hr
      WHERE hr.player_name IS NOT NULL 
      AND hr.player_name != 'Unknown Player'
      AND hr.peak_score > 0
      ORDER BY hr.peak_score DESC, hr.best_kdr DESC, hr.best_kills DESC
      LIMIT ${limit}
    `
    
    const players = await executeQuery(playersQuery)
    
    // ดึงข้อมูลสถิติรวม
    const statsQuery = `
      SELECT 
        COUNT(*) as total_players,
        MAX(peak_achieved_at) as last_updated
      FROM historical_rankings
      WHERE player_name IS NOT NULL 
      AND player_name != 'Unknown Player'
      AND peak_score > 0
    `
    
    const statsResult = await executeQuery(statsQuery)
    const stats = statsResult[0] || { total_players: 0, last_updated: null }
    
    console.log(`✅ All-time best loaded: ${players.length} players`)
    
    return {
      players,
      totalPlayers: stats.total_players,
      lastUpdated: stats.last_updated
    }
    
  } catch (error) {
    console.error('❌ All-time best fetch error:', error)
    throw error
  }
}