// server/middleware/host-security.js
export default defineEventHandler(async (event) => {
  // ข้าม middleware สำหรับ development
  if (process.env.NODE_ENV !== 'production') {
    return
  }
  
  // รับ Host header
  const host = getHeader(event, 'host')
  
  // รายการ hosts ที่อนุญาต
  const allowedHosts = process.env.ALLOWED_HOSTS 
    ? process.env.ALLOWED_HOSTS.split(',').map(h => h.trim())
    : ['dayz.nightro.cc']
  
  console.log('🔒 Production Host Security Check:', {
    host,
    allowedHosts
  })
  
  // ตรวจสอบ host
  if (host && !allowedHosts.some(allowedHost => 
    host === allowedHost || host.includes(allowedHost)
  )) {
    console.warn('⚠️ Unauthorized host access attempt:', host)
    
    throw createError({
      statusCode: 403,
      statusMessage: 'Access Denied: Unauthorized Host'
    })
  }
})