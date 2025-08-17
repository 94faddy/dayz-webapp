// server/api/leaderboard/index.get.js
import { executeQuery } from '~/utils/database.js'

export default defineEventHandler(async (event) => {
  try {
    console.log('🏆 Leaderboard API called')
    
    // รับ query parameters
    const query = getQuery(event)
    const sortBy = query.sort || 'kdr'
    const limit = parseInt(query.limit) || 100
    const source = query.source || 'database' // 'database' หรือ 'live'
    
    console.log('📊 Request params:', { sortBy, limit, source })
    
    let leaderboardData
    
    if (source === 'live') {
      // ดึงข้อมูลแบบ real-time จาก external API
      leaderboardData = await fetchLiveLeaderboardData()
    } else {
      // ดึงข้อมูลจาก database (เร็วกว่า)
      leaderboardData = await fetchDatabaseLeaderboardData(sortBy, limit)
    }
    
    return {
      success: true,
      data: leaderboardData.players,
      metadata: {
        totalPlayers: leaderboardData.totalPlayers,
        lastUpdated: leaderboardData.lastUpdated,
        source: source,
        sortBy: sortBy,
        processingTime: leaderboardData.processingTime
      }
    }
    
  } catch (error) {
    console.error('❌ Leaderboard API error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch leaderboard data'
    })
  }
})

// ดึงข้อมูลจาก database
async function fetchDatabaseLeaderboardData(sortBy, limit) {
  const startTime = Date.now()
  
  try {
    console.log('🗃️ Fetching from database...')
    
    // สร้าง ORDER BY clause ตาม sortBy
    let orderClause = 'kdr DESC, player_kills DESC, time_survived DESC'
    
    switch (sortBy) {
      case 'kills':
        orderClause = 'player_kills DESC, kdr DESC, time_survived DESC'
        break
      case 'time':
        orderClause = 'time_survived DESC, player_kills DESC, kdr DESC'
        break
      case 'shot':
        orderClause = 'longest_shot DESC, player_kills DESC, kdr DESC'
        break
      case 'zombies':
        orderClause = 'zombie_kills DESC, player_kills DESC, kdr DESC'
        break
      default:
        orderClause = 'kdr DESC, player_kills DESC, time_survived DESC'
    }
    
    // ดึงข้อมูลผู้เล่น
    const playersQuery = `
      SELECT 
        steam_id,
        player_name,
        time_survived,
        distance_traveled,
        player_kills,
        total_deaths,
        kdr,
        longest_shot,
        zombie_kills,
        deaths_to_players,
        deaths_to_zombies,
        deaths_to_nature,
        deaths_to_animals,
        suicide_count,
        animals_killed,
        last_seen,
        updated_at
      FROM player_leaderboard
      WHERE player_name IS NOT NULL 
      AND player_name != 'Unknown Player'
      ORDER BY ${orderClause}
      LIMIT ?
    `
    
    const players = await executeQuery(playersQuery, [limit])
    
    // ดึงข้อมูลสถิติรวม
    const statsQuery = `
      SELECT 
        COUNT(*) as total_players,
        MAX(updated_at) as last_updated,
        SUM(time_survived) as total_time_played,
        SUM(player_kills) as total_kills,
        MAX(longest_shot) as longest_shot_global
      FROM player_leaderboard
      WHERE player_name IS NOT NULL 
      AND player_name != 'Unknown Player'
    `
    
    const [stats] = await executeQuery(statsQuery)
    
    // แปลงข้อมูลให้เป็นรูปแบบที่ frontend ต้องการ
    const processedPlayers = {}
    
    players.forEach(player => {
      processedPlayers[player.steam_id] = {
        name: player.player_name,
        timeSurvived: player.time_survived,
        distTrav: player.distance_traveled,
        kills: Array(player.player_kills).fill({}), // สร้าง array ว่างตามจำนวน kills
        deaths: Array(player.total_deaths).fill({}), // สร้าง array ว่างตามจำนวน deaths
        animalsKilled: Array(player.animals_killed).fill({}),
        lastTimeSeen: player.last_seen ? formatDateForFrontend(player.last_seen) : null,
        deathsToZCount: player.deaths_to_zombies,
        deathsToNaturalCauseCount: player.deaths_to_nature,
        deathsToPlayerCount: player.deaths_to_players,
        deathsToAnimalCount: player.deaths_to_animals,
        suicideCount: player.suicide_count,
        longestShot: player.longest_shot,
        zKilled: player.zombie_kills,
        kdr: player.kdr
      }
    })
    
    const processingTime = Date.now() - startTime
    
    console.log(`✅ Database fetch completed in ${processingTime}ms`)
    
    return {
      players: processedPlayers,
      totalPlayers: stats.total_players,
      lastUpdated: stats.last_updated,
      processingTime
    }
    
  } catch (error) {
    console.error('❌ Database fetch error:', error)
    throw error
  }
}

// ดึงข้อมูลแบบ real-time จาก external API
async function fetchLiveLeaderboardData() {
  const startTime = Date.now()
  
  try {
    console.log('📡 Fetching live data from external API...')
    
    // ดึง config จาก runtime config
    const config = useRuntimeConfig()
    const dzsvApi = `${config.dzsvApi}/v1/leaderboard/raw`
    const apiKey = config.dzsvApiKey || 'fada233b805f23a37d141b5577241fac2a004f2bfc6607264e38e59a040b718d'
    
    console.log('🔗 API URL:', dzsvApi)
    console.log('🔑 Using API Key:', apiKey.substring(0, 8) + '...')
    
    const response = await $fetch(dzsvApi, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DayZ-Nightro-WebApp/1.0',
        'X-API-Key': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    })
    
    if (!response || typeof response !== 'object') {
      console.error('❌ Invalid response:', response)
      throw new Error('Invalid response format from external API')
    }
    
    // ตรวจสอบว่า response เป็น error หรือไม่
    if (response.success === false) {
      console.error('❌ API Error Response:', response)
      throw new Error(`API Error: ${response.message || response.error || 'Unknown error'}`)
    }
    
    // ถ้า response มี data property ให้ใช้ data, ถ้าไม่มีให้ใช้ response เลย
    const playerData = response.data || response
    
    const processingTime = Date.now() - startTime
    const totalPlayers = Object.keys(playerData).length
    
    console.log(`✅ Live fetch completed in ${processingTime}ms`)
    
    return {
      players: playerData,
      totalPlayers,
      lastUpdated: new Date().toISOString(),
      processingTime
    }
    
  } catch (error) {
    console.error('❌ Live fetch error:', error)
    
    // Log เพิ่มเติมสำหรับ debug
    if (error.data) {
      console.error('❌ Error response data:', error.data)
    }
    
    if (error.cause?.code === 'ECONNREFUSED') {
      throw new Error('DayZ server is currently unavailable')
    }
    
    if (error.name === 'TimeoutError') {
      throw new Error('Request to DayZ server timed out')
    }
    
    throw error
  }
}

// Helper function สำหรับแปลงวันที่
function formatDateForFrontend(date) {
  if (!date) return null
  
  const d = new Date(date)
  return d.getFullYear() + '-' + 
         String(d.getMonth() + 1).padStart(2, '0') + '-' + 
         String(d.getDate()).padStart(2, '0') + ' ' +
         String(d.getHours()).padStart(2, '0') + ':' + 
         String(d.getMinutes()).padStart(2, '0') + ':' + 
         String(d.getSeconds()).padStart(2, '0')
}