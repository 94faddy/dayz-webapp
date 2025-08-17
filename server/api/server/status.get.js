export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const dzlauncherApi = `${config.dzlauncherApi}/vpp/status-info`
    
    console.log('🔄 Fetching server status from:', dzlauncherApi)
    
    const response = await fetch(dzlauncherApi, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DayZ-Nightro-Web/1.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('✅ Server status data received:', data)
    
    // ดึงข้อมูลจาก embeds format ใหม่
    const embedContent = extractEmbedContent(data.latestLog?.data)
    const stats = extractServerStats(embedContent)
    
    const serverStatus = {
      status: data.status || 'unknown',
      isOnline: data.status === 'online',
      success: data.success || false,
      message: data.message || null,
      lastUpdate: data.latestLog?.timestamp || null,
      lastUpdateFormatted: data.latestLog?.timestamp 
        ? new Date(data.latestLog.timestamp).toLocaleString('th-TH', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        : null,
      serverName: extractServerName(embedContent),
      logContent: embedContent || null,
      // เพิ่มข้อมูลที่ดึงจาก content
      uptime: stats?.uptime || 'Unknown',
      fps: stats?.fps || 0,
      players: stats?.players || { current: 0, max: 100 }
    }
    
    return {
      success: true,
      data: serverStatus
    }
    
  } catch (error) {
    console.error('❌ Failed to fetch server status:', error.message)
    
    return {
      success: false,
      error: error.message,
      data: {
        status: 'unknown',
        isOnline: false,
        success: false,
        message: 'Unable to fetch server status',
        lastUpdate: null,
        lastUpdateFormatted: null,
        serverName: 'DayZ Nightro Server',
        logContent: null,
        uptime: 'Unknown',
        fps: 0,
        players: { current: 0, max: 100 }
      }
    }
  }
})

// ฟังก์ชันใหม่: ดึงข้อมูลจาก embeds format
function extractEmbedContent(data) {
  if (!data) return null
  
  try {
    // ตรวจสอบว่ามี embeds array หรือไม่
    if (data.embeds && Array.isArray(data.embeds) && data.embeds.length > 0) {
      const embed = data.embeds[0]
      
      // ดึงข้อมูลจาก fields array
      if (embed.fields && Array.isArray(embed.fields) && embed.fields.length > 0) {
        // รวมข้อมูลจาก title และ fields
        const title = embed.title || ''
        const fieldValues = embed.fields.map(field => field.value || '').join('\n')
        return `${title}\n${fieldValues}`
      }
      
      // fallback: ใช้ title หรือ description
      return embed.title || embed.description || null
    }
    
    // fallback: ใช้ content โดยตรง (สำหรับ format เก่า)
    return data.content || null
  } catch (error) {
    console.warn('⚠️ Error extracting embed content:', error)
    return null
  }
}

// Helper function: ดึงชื่อ server แบบ dynamic
function extractServerName(content) {
  if (!content) return 'DayZ Nightro Server'
  
  try {
    // Pattern 1: ดึงจาก markdown link [ชื่อเซิร์ฟเวอร์](url)
    const linkMatch = content.match(/\[([^\]]+)\]\([^)]*\)/)
    if (linkMatch && linkMatch[1]) {
      // ลบ ** markdown formatting ออก
      const serverName = linkMatch[1].replace(/\*\*/g, '').trim()
      if (serverName && !serverName.includes('SERVER STATUS')) {
        return serverName
      }
    }
    
    // Pattern 2: ดึงจาก title ที่มี ** หรือ markdown formatting
    const titleMatch = content.match(/\*\*([^*]+)\*\*/)
    if (titleMatch && titleMatch[1]) {
      const serverName = titleMatch[1].trim()
      if (serverName && !serverName.includes('SERVER STATUS')) {
        return serverName
      }
    }
    
    // Pattern 3: หาชื่อเซิร์ฟเวอร์ที่มี pattern CH หรือ DayZ
    const serverPatterns = [
      /CH\d+\|[^|\n]+/i,  // CH1|DayZ-Nightro|...
      /DayZ[^|\n\s]*/i,   // DayZ-xxx
      /#\d+[^|\n\s]*/i    // #1NightroHardcore
    ]
    
    for (const pattern of serverPatterns) {
      const match = content.match(pattern)
      if (match && match[0]) {
        return match[0].replace(/\*\*/g, '').trim()
      }
    }
    
    return 'DayZ Nightro Server'
  } catch (error) {
    console.warn('⚠️ Error extracting server name:', error)
    return 'DayZ Nightro Server'
  }
}

// Helper function: ดึงสถิติเซิร์ฟเวอร์แบบ dynamic
function extractServerStats(content) {
  if (!content) return null
  
  try {
    const stats = {
      uptime: null,
      fps: null,
      players: {
        current: 0,
        max: 100
      }
    }
    
    // Dynamic pattern สำหรับ uptime - รองรับหลายรูปแบบ
    const uptimePatterns = [
      /Up-Time:\s*\*?\*?([^*\n]+)\*?\*?/i,
      /Uptime:\s*\*?\*?([^*\n]+)\*?\*?/i,
      /Runtime:\s*\*?\*?([^*\n]+)\*?\*?/i,
      /(?:Up|Online).*?(\d+d?\s*\d+h?\s*\d+m?\s*\d+s?)/i
    ]
    
    for (const pattern of uptimePatterns) {
      const match = content.match(pattern)
      if (match && match[1]) {
        stats.uptime = match[1].trim()
        break
      }
    }
    
    // Dynamic pattern สำหรับ FPS - รองรับหลายรูปแบบ
    const fpsPatterns = [
      /Server FPS:\s*\*?\*?(\d+)\*?\*?/i,
      /FPS:\s*\*?\*?(\d+)\*?\*?/i,
      /Frame.*?Rate.*?(\d+)/i,
      /Performance.*?(\d+)/i
    ]
    
    for (const pattern of fpsPatterns) {
      const match = content.match(pattern)
      if (match && match[1]) {
        stats.fps = parseInt(match[1])
        break
      }
    }
    
    // Dynamic pattern สำหรับ Players - รองรับหลายรูปแบบ
    const playerPatterns = [
      /Players:\s*\*?\*?(\d+)\/(\d+)\*?\*?/i,
      /Online:\s*\*?\*?(\d+)\/(\d+)\*?\*?/i,
      /Connected:\s*\*?\*?(\d+)\/(\d+)\*?\*?/i,
      /(\d+)\/(\d+)\s*players?/i,
      /(\d+)\s*\/\s*(\d+)\s*(?:online|connected|active)/i
    ]
    
    for (const pattern of playerPatterns) {
      const match = content.match(pattern)
      if (match && match[1] && match[2]) {
        stats.players.current = parseInt(match[1])
        stats.players.max = parseInt(match[2])
        break
      }
    }
    
    // Additional validation - ถ้าไม่เจอข้อมูล players ให้ลองหาแบบอื่น
    if (stats.players.current === 0 && stats.players.max === 100) {
      // หาตัวเลขคู่ที่อาจเป็น player count
      const numberPairs = content.match(/(\d+)\/(\d+)/g)
      if (numberPairs && numberPairs.length > 0) {
        const lastPair = numberPairs[numberPairs.length - 1]
        const [current, max] = lastPair.split('/').map(n => parseInt(n))
        if (current >= 0 && max > 0 && max <= 200) { // reasonable server limits
          stats.players.current = current
          stats.players.max = max
        }
      }
    }
    
    return stats
  } catch (error) {
    console.warn('⚠️ Error extracting server stats:', error)
    return null
  }
}