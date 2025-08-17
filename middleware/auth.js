export default defineNuxtRouteMiddleware(async (to, from) => {
  // ทำงานเฉพาะฝั่ง client
  if (process.server) return
  
  const user = useState('auth.user')
  const sessionLoaded = useState('auth.sessionLoaded')
  
  console.log('🔍 Auth middleware: Current state:', {
    user: !!user.value,
    sessionLoaded: sessionLoaded.value,
    path: to.path
  })
  
  // ถ้า session ยังไม่โหลด ให้รอให้เสร็จก่อน
  if (!sessionLoaded.value) {
    console.log('⏳ Auth middleware: Waiting for session restore...')
    
    // รอ session restore เสร็จสิ้น หรือ timeout
    let attempts = 0
    const maxAttempts = 50 // รอสูงสุด 5 วินาที
    
    while (!sessionLoaded.value && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
      
      // Log progress ทุก 10 attempts
      if (attempts % 10 === 0) {
        console.log(`⏳ Still waiting... (${attempts}/${maxAttempts})`)
      }
    }
    
    console.log(`✅ Session wait completed after ${attempts * 100}ms. Loaded: ${sessionLoaded.value}, User: ${!!user.value}`)
  }
  
  // ถ้าไม่มี user หลังจากรอแล้ว ให้ไปหน้า login
  if (!user.value) {
    console.log('❌ No user found, redirecting to login')
    return navigateTo('/login?redirect=' + encodeURIComponent(to.path))
  }
  
  console.log('✅ Auth middleware passed for user:', user.value.email)
})