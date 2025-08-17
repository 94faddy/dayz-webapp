<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Header -->
    <AppHeader />
    
    <!-- Main Content -->
    <main class="min-h-screen pt-16">
      <slot />
    </main>
    
    <!-- Footer -->
    <AppFooter />
    
    <!-- Global Notifications -->
    <div id="notifications" class="fixed top-4 right-4 z-50">
      <!-- SweetAlert2 will render here -->
    </div>
  </div>
</template>

<script setup>
// Global state management
const user = useState('auth.user', () => null)
const sessionLoaded = useState('auth.sessionLoaded', () => false)

// Restore session หลังจาก component mounted (client-side only)
onMounted(async () => {
  console.log('🔄 Layout mounted, checking session...')
  console.log('Current sessionLoaded state:', sessionLoaded.value)
  
  // ถ้า session โหลดแล้วและมี user อยู่ ไม่ต้องโหลดใหม่
  if (sessionLoaded.value && user.value) {
    console.log('✅ Session already loaded, skipping restore')
    return
  }
  
  // รีเซ็ต sessionLoaded เป็น false เพื่อให้ระบบรู้ว่าต้อง restore ใหม่
  sessionLoaded.value = false
  
  try {
    console.log('🔍 Restoring session...')
    
    const response = await $fetch('/api/auth/session', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    
    if (response.success && response.user) {
      user.value = response.user
      console.log('✅ Session restored for user:', response.user.email)
    } else {
      console.log('ℹ️ No valid session found')
      user.value = null
    }
  } catch (error) {
    // Session not found - that's ok
    console.log('ℹ️ Session restore failed:', error.statusMessage || error.message)
    user.value = null
  } finally {
    // อัปเดต session loaded state
    sessionLoaded.value = true
    console.log('✅ Session restore completed. User:', !!user.value)
  }
})

// Meta tags
useHead({
  titleTemplate: '%s - DayZ Nightro',
  meta: [
    { name: 'description', content: 'DayZ Nightro Login and Management System' },
    { name: 'keywords', content: 'dayz, Nightro, login, game, server' }
  ]
})
</script>