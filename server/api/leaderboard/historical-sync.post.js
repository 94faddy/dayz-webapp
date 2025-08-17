import { executeQuery } from '~/utils/database.js'

export default defineEventHandler(async (event) => {
  try {
    console.log('🔄 Historical sync started')
    
    // ขั้นตอนที่ 1: ตรวจสอบว่าตาราง historical_rankings มีอยู่หรือไม่
    try {
      await executeQuery('SELECT 1 FROM historical_rankings LIMIT 1')
      console.log('✅ Historical rankings table exists')
    } catch (tableError) {
      console.log('❌ Historical rankings table not found, creating...')
      
      // สร้างตารางถ้ายังไม่มี
      await createHistoricalRankingsTable()
      console.log('✅ Historical rankings table created')
    }
    
    // ขั้นตอนที่ 2: ดึงข้อมูลจาก DayZ Server
    const rawData = await fetchPlayerDataFromDayZ()
    
    // ขั้นตอนที่ 3: ประมวลผลและบันทึกลง database
    const result = await processAndSaveHistoricalData(rawData)
    
    return {
      success: true,
      message: 'Historical sync completed successfully',
      ...result
    }
    
  } catch (error) {
    console.error('❌ Historical sync error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Historical sync failed'
    })
  }
})

// สร้างตาราง historical_rankings
async function createHistoricalRankingsTable() {
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
}

// ดึงข้อมูลจาก DayZ Server
async function fetchPlayerDataFromDayZ() {
  try {
    console.log('📡 Fetching data from DayZ Server...')
    
    // ดึง config จาก runtime config
    const config = useRuntimeConfig()
    const dzsvApi = `${config.dzsvApi}/v1/leaderboard/raw`
    const apiKey = config.dzsvApiKey || 'fada233b805f23a37d141b5577241fac2a004f2bfc6607264e38e59a040b718d'
    
    console.log('🔗 API URL:', dzsvApi)
    console.log('🔑 Using API Key:', apiKey.substring(0, 8) + '...')
    
    const response = await $fetch(dzsvApi, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DayZ-Historical-Sync/1.0',
        'X-API-Key': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    })
    
    if (!response || typeof response !== 'object') {
      console.error('❌ Invalid response:', response)
      throw new Error('Invalid response from DayZ Server')
    }
    
    // ตรวจสอบว่า response เป็น error หรือไม่
    if (response.success === false) {
      console.error('❌ API Error Response:', response)
      throw new Error(`API Error: ${response.message || response.error || 'Unknown error'}`)
    }
    
    // ถ้า response มี data property ให้ใช้ data, ถ้าไม่มีให้ใช้ response เลย
    const playerData = response.data || response
    
    console.log(`✅ Received data for ${Object.keys(playerData).length} players`)
    
    return playerData
    
  } catch (error) {
    console.error('❌ DayZ Server fetch error:', error)
    
    // Log เพิ่มเติมสำหรับ debug
    if (error.data) {
      console.error('❌ Error response data:', error.data)
    }
    
    throw new Error(`Failed to fetch from DayZ Server: ${error.message}`)
  }
}

// ประมวลผลและบันทึกข้อมูล
async function processAndSaveHistoricalData(rawData) {
  let playersProcessed = 0
  let newPlayers = 0
  let updatedPlayers = 0
  
  try {
    console.log('💾 Processing and saving historical data...')
    
    // แปลงข้อมูลและคำนวณคะแนน
    const playerStats = []
    
    for (const [steamId, data] of Object.entries(rawData)) {
      const totalKills = data.kills?.length || 0
      const totalDeaths = data.deaths?.length || 0
      const kdr = totalDeaths > 0 ? (totalKills / totalDeaths) : totalKills
      const timeHours = (data.timeSurvived || 0) / 3600
      
      // คำนวณคะแนน
      const score = calculateScore(kdr, totalKills, timeHours, data.longestShot || 0, data.zKilled || 0)
      
      playerStats.push({
        steamId,
        name: data.name || 'Unknown Player',
        kdr: parseFloat(kdr.toFixed(2)),
        kills: totalKills,
        deaths: totalDeaths,
        timeHours: parseFloat(timeHours.toFixed(2)),
        longestShot: data.longestShot || 0,
        zombieKills: data.zKilled || 0,
        score: parseFloat(score.toFixed(2)),
        lastSeen: data.lastTimeSeen
      })
    }
    
    // เรียงลำดับตามคะแนน
    playerStats.sort((a, b) => b.score - a.score)
    
    // บันทึกข้อมูลแต่ละคน
    for (let i = 0; i < playerStats.length; i++) {
      const player = playerStats[i]
      const currentRank = i + 1
      
      const result = await savePlayerHistoricalData(player, currentRank)
      
      if (result.isNew) {
        newPlayers++
      } else {
        updatedPlayers++
      }
      
      playersProcessed++
    }
    
    console.log(`✅ Processed ${playersProcessed} players (${newPlayers} new, ${updatedPlayers} updated)`)
    
    return {
      playersProcessed,
      newPlayers,
      updatedPlayers,
      topPlayer: playerStats[0]?.name || 'N/A',
      topScore: playerStats[0]?.score || 0
    }
    
  } catch (error) {
    console.error('❌ Processing error:', error)
    throw error
  }
}

// คำนวณคะแนน
function calculateScore(kdr, kills, timeHours, longestShot, zombieKills) {
  const score = 
    (kdr * 100) +              // KDR weight: 100
    (kills * 10) +             // Kills weight: 10
    (timeHours * 2) +          // Time weight: 2
    (longestShot / 100) +      // Shot bonus
    (zombieKills / 10)         // Zombie bonus
  
  return Math.max(0, score)
}

// บันทึกข้อมูลผู้เล่นคนหนึ่ง
async function savePlayerHistoricalData(player, currentRank) {
  try {
    // ดึงข้อมูลเก่า
    const existingData = await executeQuery(
      'SELECT * FROM historical_rankings WHERE steam_id = ?',
      [player.steamId]
    )
    
    const isNew = existingData.length === 0
    const existing = existingData[0] || {}
    
    // ตรวจสอบสถิติใหม่
    const newBestScore = player.score > (existing.best_score || 0)
    const newBestRank = currentRank < (existing.best_rank || 999999)
    const newPeakScore = player.score > (existing.peak_score || 0)
    
    // จัดการวันที่ให้ถูกต้อง
    let lastSeenDate = null
    if (player.lastSeen) {
      try {
        // แปลง "2025-8-3 7:56:12" เป็น Date object
        const normalizedDate = player.lastSeen.replace(' ', 'T')
        const dateObj = new Date(normalizedDate)
        
        // ตรวจสอบว่าวันที่ถูกต้อง
        if (!isNaN(dateObj.getTime())) {
          lastSeenDate = dateObj
        }
      } catch (dateError) {
        console.warn('Invalid date format:', player.lastSeen)
      }
    }
    
    if (isNew) {
      // สร้างผู้เล่นใหม่
      await executeQuery(`
        INSERT INTO historical_rankings (
          steam_id, player_name, 
          current_kdr, current_kills, current_deaths, current_time_hours, 
          current_longest_shot, current_zombie_kills, current_score,
          best_kdr, best_kills, best_time_hours, best_longest_shot, 
          best_zombie_kills, best_score, best_rank,
          peak_score, peak_rank, peak_achieved_at, last_seen, total_updates
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        player.steamId, player.name,
        player.kdr, player.kills, player.deaths, player.timeHours,
        player.longestShot, player.zombieKills, player.score,
        player.kdr, player.kills, player.timeHours, player.longestShot,
        player.zombieKills, player.score, currentRank,
        player.score, currentRank, new Date(),
        lastSeenDate, // ใช้ null ถ้าไม่มีข้อมูล
        1
      ])
    } else {
      // อัพเดทผู้เล่นเก่า
      const updateParams = [
        player.name,
        player.kdr, player.kills, player.deaths, player.timeHours,
        player.longestShot, player.zombieKills, player.score,
        player.kdr, player.kills, player.timeHours, player.longestShot,
        player.zombieKills, player.score, currentRank, player.score
      ]
      
      let updateQuery = `
        UPDATE historical_rankings SET
          player_name = ?,
          current_kdr = ?, current_kills = ?, current_deaths = ?, 
          current_time_hours = ?, current_longest_shot = ?, 
          current_zombie_kills = ?, current_score = ?,
          best_kdr = GREATEST(best_kdr, ?),
          best_kills = GREATEST(best_kills, ?),
          best_time_hours = GREATEST(best_time_hours, ?),
          best_longest_shot = GREATEST(best_longest_shot, ?),
          best_zombie_kills = GREATEST(best_zombie_kills, ?),
          best_score = GREATEST(best_score, ?),
          best_rank = LEAST(best_rank, ?),
          peak_score = GREATEST(peak_score, ?)
      `
      
      // เพิ่ม peak_rank และ peak_achieved_at ถ้าเป็นสถิติใหม่
      if (newPeakScore) {
        updateQuery += `, peak_rank = ?, peak_achieved_at = ?`
        updateParams.push(currentRank, new Date())
      }
      
      // เพิ่ม last_seen
      if (lastSeenDate) {
        updateQuery += `, last_seen = ?`
        updateParams.push(lastSeenDate)
      }
      
      updateQuery += `, total_updates = total_updates + 1, updated_at = NOW() WHERE steam_id = ?`
      updateParams.push(player.steamId)
      
      await executeQuery(updateQuery, updateParams)
    }
    
    return { isNew }
    
  } catch (error) {
    console.error(`❌ Save error for player ${player.steamId}:`, error)
    throw error
  }
}