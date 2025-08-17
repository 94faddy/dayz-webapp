// server/api/leaderboard.get.js
export default defineEventHandler(async (event) => {
  try {
    console.log('🏆 Leaderboard API called')
    
    // ดึง config จาก runtime config
    const config = useRuntimeConfig()
    const dzsvApi = `${config.dzsvApi}/v1/leaderboard/raw`
    
    console.log('📡 Fetching data from:', dzsvApi)
    
    const response = await $fetch(dzsvApi, {
      timeout: 10000, // 10 seconds timeout
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DayZ-Nightro-WebApp/1.0'
      }
    })
    
    console.log('✅ Raw data received, processing...')
    
    // ตรวจสอบว่าข้อมูลมีรูปแบบถูกต้อง
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format from external API')
    }
    
    // นับจำนวน players
    const playerCount = Object.keys(response).length
    console.log(`📊 Processing ${playerCount} players`)
    
    // ส่งข้อมูลกลับ
    return {
      success: true,
      data: response,
      metadata: {
        totalPlayers: playerCount,
        lastUpdated: new Date().toISOString(),
        source: 'DayZ Server API'
      }
    }
    
  } catch (error) {
    console.error('❌ Leaderboard API error:', error)
    
    // ส่ง error response ที่เหมาะสม
    if (error.cause?.code === 'ECONNREFUSED') {
      throw createError({
        statusCode: 503,
        statusMessage: 'DayZ server is currently unavailable'
      })
    }
    
    if (error.name === 'TimeoutError') {
      throw createError({
        statusCode: 504,
        statusMessage: 'Request to DayZ server timed out'
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch leaderboard data'
    })
  }
})