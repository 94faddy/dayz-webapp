<template>
  <header class="fixed top-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center space-x-3">
            <div class="h-8 w-8 bg-red-600 rounded flex items-center justify-center">
              <span class="text-sm font-bold text-white">Z</span>
            </div>
            <span class="text-xl font-bold text-red-500">DayZ Nightro</span>
          </NuxtLink>
        </div>
        
        <!-- Navigation Links -->
        <div class="hidden md:flex items-center space-x-8">
          <NuxtLink 
            to="/" 
            class="text-gray-300 hover:text-white transition-colors"
          >
            Home
          </NuxtLink>
          
          <NuxtLink 
            to="/download" 
            class="text-gray-300 hover:text-white transition-colors"
          >
            Download
          </NuxtLink>

          <NuxtLink 
            to="/leaderboard" 
            class="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
          >
            Leaderboard
          </NuxtLink>          
          
          <NuxtLink 
            to="/store" 
            class="text-gray-300 hover:text-white transition-colors"
          >
            Store
          </NuxtLink>       
          
          <!-- Profile link - แสดงเฉพาะเมื่อ session โหลดแล้วและมี user -->
          <NuxtLink 
            v-if="sessionLoaded && user" 
            to="/profile" 
            class="text-gray-300 hover:text-white transition-colors"
          >
            Profile
          </NuxtLink>
        </div>
        
        <!-- Mobile Menu Button -->
        <div class="md:hidden">
          <button 
            @click="toggleMobileMenu"
            class="text-gray-300 hover:text-white focus:outline-none"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
        
        <!-- User Menu -->
        <div class="hidden md:flex items-center space-x-4">
          <!-- แสดง loading skeleton ขณะรอ session - ขนาดเท่ากับ content จริง -->
          <Transition 
            name="header-menu"
            mode="out-in"
          >
            <div v-if="!sessionLoaded" key="loading" class="flex items-center space-x-4">
              <!-- Skeleton สำหรับ Login button -->
              <div class="h-6 w-12 bg-gray-700 rounded animate-pulse"></div>
              <!-- Skeleton สำหรับ Register button -->
              <div class="h-8 w-16 bg-gray-700 rounded animate-pulse"></div>
            </div>
            
            <!-- แสดงเมนู user เมื่อ session โหลดแล้ว -->
            <div v-else-if="user" key="user-menu" class="flex items-center space-x-4">
              <!-- Points Display -->
              <div class="hidden sm:flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-full">
                <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
                </svg>
                <span class="text-yellow-500 font-semibold">{{ formatNumber(user.points || 0) }}</span>
              </div>
              
              <!-- User Avatar Button -->
              <button 
                @click="toggleUserMenu"
                class="flex items-center space-x-2 text-gray-300 hover:text-white focus:outline-none"
              >
                <!-- User Avatar -->
                <div class="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-600 hover:border-red-500 transition-colors"
                     :style="getUserAvatarStyle()">
                  <div v-if="getUserAvatar().type === 'preset'" 
                       class="w-full h-full flex items-center justify-center text-lg">
                    {{ getUserAvatar().emoji }}
                  </div>
                  <span v-else class="text-sm font-semibold text-white">{{ getUserInitial() }}</span>
                </div>
                <span class="hidden sm:block">{{ user.name || 'User' }}</span>
              </button>
              
              <!-- Logout Button -->
              <button 
                @click="logout"
                class="text-gray-300 hover:text-red-400 transition-colors text-sm"
              >
                Logout
              </button>
            </div>
            
            <!-- แสดง Login/Register เมื่อไม่มี user -->
            <div v-else key="auth-menu" class="flex items-center space-x-4">
              <NuxtLink 
                to="/login" 
                class="text-gray-300 hover:text-white transition-colors"
              >
                Login
              </NuxtLink>
              <NuxtLink 
                to="/register" 
                class="dayz-button-primary"
              >
                Register
              </NuxtLink>
            </div>
          </Transition>
        </div>
      </div>
      
      <!-- Mobile Menu -->
      <Transition name="mobile-menu">
        <div v-if="mobileMenuOpen" class="md:hidden mt-4 pb-4 border-t border-gray-700">
          <div class="space-y-2 pt-4">
            <NuxtLink 
              to="/" 
              @click="closeMobileMenu"
              class="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
            >
              Home
            </NuxtLink>
            
            <NuxtLink 
              to="/download" 
              @click="closeMobileMenu"
              class="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
            >
              Download
            </NuxtLink>
            
            <NuxtLink 
              to="/store" 
              @click="closeMobileMenu"
              class="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
            >
              Store
            </NuxtLink>
            
            <!-- ✨ Mobile Leaderboard Link -->
            <NuxtLink 
              to="/leaderboard" 
              @click="closeMobileMenu"
              class="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
            >
              🏆 Leaderboard
            </NuxtLink>
            
            <NuxtLink 
              v-if="sessionLoaded && user" 
              to="/profile" 
              @click="closeMobileMenu"
              class="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
            >
              Profile
            </NuxtLink>
            
            <!-- Mobile Auth Buttons -->
            <div v-if="!user" class="pt-2 border-t border-gray-700 mt-2">
              <NuxtLink 
                to="/login" 
                @click="closeMobileMenu"
                class="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
              >
                Login
              </NuxtLink>
              <NuxtLink 
                to="/register" 
                @click="closeMobileMenu"
                class="block px-3 py-2 bg-red-600 text-white hover:bg-red-700 rounded transition-colors mt-2"
              >
                Register
              </NuxtLink>
            </div>
            
            <!-- Mobile User Info -->
            <div v-else class="pt-2 border-t border-gray-700 mt-2">
              <div class="px-3 py-2 text-gray-400 text-sm">
                Logged in as {{ user.name }}
              </div>
              <button 
                @click="logout"
                class="block w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </nav>
  </header>
</template>

<script setup>
const user = useState('auth.user', () => null)
const sessionLoaded = useState('auth.sessionLoaded', () => false)
const userMenuOpen = ref(false)
const mobileMenuOpen = ref(false)

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const getUserInitial = () => {
  if (user.value && user.value.name) {
    return user.value.name.charAt(0).toUpperCase()
  }
  return 'U'
}

const getUserAvatar = () => {
  if (user.value?.avatar_data) {
    return {
      type: user.value.avatar_data.type || 'initial',
      color: user.value.avatar_data.color || '#dc2626',
      emoji: user.value.avatar_data.emoji || '🧔'
    }
  }
  
  return {
    type: 'initial',
    color: '#dc2626',
    emoji: '🧔'
  }
}

const getUserAvatarStyle = () => {
  const avatar = getUserAvatar()
  return { backgroundColor: avatar.color }
}

const logout = async () => {
  try {
    // เรียก logout API เพื่อล้าง session
    await $fetch('/api/auth/logout', {
      method: 'POST'
    })
    
    // Reset user state
    user.value = null
    
    // Close mobile menu if open
    closeMobileMenu()
    
    // Show simple alert
    if (process.client) {
      alert('Logged out successfully!')
    }
    
    // Navigate to home
    await navigateTo('/')
  } catch (error) {
    console.error('Logout error:', error)
    
    // Reset user state แม้ logout API ล้มเหลว
    user.value = null
    closeMobileMenu()
    
    if (process.client) {
      alert('Logout completed, but there may have been an issue clearing the session.')
    }
    
    await navigateTo('/')
  }
}

const formatNumber = (num) => {
  if (!num) return '0'
  return new Intl.NumberFormat().format(num)
}

// Close mobile menu when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('header') && mobileMenuOpen.value) {
      closeMobileMenu()
    }
  })
})
</script>

<style scoped>
.header-menu-enter-active,
.header-menu-leave-active {
  transition: all 0.2s ease;
}

.header-menu-enter-from,
.header-menu-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>