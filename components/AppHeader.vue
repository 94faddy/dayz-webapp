<template>
  <header class="bg-gray-800 border-b border-gray-700 fixed top-0 left-0 right-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center">
            <h1 class="text-xl font-bold text-white">DayZ Nightro</h1>
          </NuxtLink>
        </div>
        
        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-8">
          <NuxtLink to="/" class="nav-link">Home</NuxtLink>
          <NuxtLink to="/leaderboard" class="nav-link">Leaderboard</NuxtLink>
          <NuxtLink to="/store" class="nav-link">Store</NuxtLink>
          <!--<NuxtLink v-if="user" to="/orders" class="nav-link">Orders</NuxtLink>-->
        </nav>
        
        <!-- User Section -->
        <div class="flex items-center space-x-4">
          <!-- Points Display (if logged in) -->
          <div v-if="user" class="hidden sm:flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded-full">
            <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
            </svg>
            <span class="text-yellow-500 font-semibold">{{ formatNumber(user.points) }}</span>
            <span class="text-gray-400 text-sm">Points</span>
          </div>
          
          <!-- User Menu (if logged in) -->
          <div v-if="user" class="relative" ref="userMenuRef">
            <button @click="toggleUserMenu" class="flex items-center space-x-2 text-gray-300 hover:text-white focus:outline-none">
              <!-- User Avatar -->
              <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-gray-600"
                   :style="getAvatarStyle()">
                <div v-if="userAvatar.type === 'preset'" 
                     class="w-full h-full flex items-center justify-center text-lg">
                  {{ userAvatar.emoji }}
                </div>
                <span v-else class="text-sm font-bold text-white">{{ getUserInitial() }}</span>
              </div>
              
              <span class="hidden sm:block">{{ user.name }}</span>
              <svg class="w-4 h-4" :class="{ 'rotate-180': userMenuOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            
            <!-- User Dropdown Menu -->
            <div v-if="userMenuOpen" class="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
              <NuxtLink to="/profile" @click="closeUserMenu" 
                        class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Profile
              </NuxtLink>
              
              <NuxtLink to="/orders" @click="closeUserMenu" 
                        class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                My Orders
              </NuxtLink>
              
              <hr class="my-1 border-gray-700" />
              
              <button @click="logout" 
                      class="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Logout
              </button>
            </div>
          </div>
          
          <!-- Login/Register Buttons (if not logged in) -->
          <div v-else class="flex items-center space-x-3">
            <NuxtLink to="/login" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
              Login
            </NuxtLink>
            <NuxtLink to="/register" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Register
            </NuxtLink>
          </div>
          
          <!-- Mobile Menu Button -->
          <button @click="toggleMobileMenu" class="md:hidden text-gray-300 hover:text-white focus:outline-none">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Mobile Navigation Menu -->
    <div v-if="mobileMenuOpen" class="md:hidden bg-gray-800 border-t border-gray-700">
      <div class="px-2 pt-2 pb-3 space-y-1">
        <NuxtLink to="/" @click="closeMobileMenu" class="mobile-nav-link">Home</NuxtLink>
        <NuxtLink to="/leaderboard" @click="closeMobileMenu" class="mobile-nav-link">Leaderboard</NuxtLink>
        <NuxtLink to="/store" @click="closeMobileMenu" class="mobile-nav-link">Store</NuxtLink>
        <NuxtLink v-if="user" to="/orders" @click="closeMobileMenu" class="mobile-nav-link">Orders</NuxtLink>
        
        <div v-if="user" class="border-t border-gray-700 pt-4 mt-4">
          <!-- Mobile Points Display -->
          <div class="flex items-center space-x-2 px-3 py-2 mb-2">
            <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
            </svg>
            <span class="text-yellow-500 font-semibold">{{ formatNumber(user.points) }}</span>
            <span class="text-gray-400 text-sm">Points</span>
          </div>
          
          <NuxtLink to="/profile" @click="closeMobileMenu" class="mobile-nav-link">Profile</NuxtLink>
          <button @click="logout" class="mobile-nav-link w-full text-left">Logout</button>
        </div>
        
        <div v-else class="border-t border-gray-700 pt-4 mt-4 space-y-1">
          <NuxtLink to="/login" @click="closeMobileMenu" class="mobile-nav-link">Login</NuxtLink>
          <NuxtLink to="/register" @click="closeMobileMenu" class="mobile-nav-link">Register</NuxtLink>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
// State
const user = useState('auth.user')
const userMenuOpen = ref(false)
const mobileMenuOpen = ref(false)
const userMenuRef = ref(null)

// User avatar state
const userAvatar = ref({
  type: 'initial',
  color: '#dc2626',
  emoji: '🧔'
})

// Methods
const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num)
}

const getUserInitial = () => {
  if (user.value && user.value.name) {
    return user.value.name.charAt(0).toUpperCase()
  }
  return 'U'
}

const getAvatarStyle = () => {
  return { backgroundColor: userAvatar.value.color }
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
  mobileMenuOpen.value = false
}

const closeUserMenu = () => {
  userMenuOpen.value = false
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  userMenuOpen.value = false
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const logout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    
    // Clear user state
    user.value = null
    const sessionLoaded = useState('auth.sessionLoaded')
    sessionLoaded.value = false
    
    // Close menus
    userMenuOpen.value = false
    mobileMenuOpen.value = false
    
    // Redirect to home
    await navigateTo('/')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Load user avatar when user changes
watch(() => user.value?.avatar_data, (newAvatarData) => {
  if (newAvatarData) {
    userAvatar.value = {
      type: newAvatarData.type || 'initial',
      color: newAvatarData.color || '#dc2626',
      emoji: newAvatarData.emoji || '🧔'
    }
  } else {
    userAvatar.value = {
      type: 'initial',
      color: '#dc2626',
      emoji: '🧔'
    }
  }
}, { immediate: true })

// Close user menu when clicking outside
onMounted(() => {
  const handleClickOutside = (event) => {
    if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
      userMenuOpen.value = false
    }
  }
  
  document.addEventListener('click', handleClickOutside)
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

<style scoped>
.nav-link {
  @apply text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors;
}

.nav-link.router-link-active {
  @apply text-white bg-gray-700;
}

.mobile-nav-link {
  @apply text-gray-300 hover:text-white hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium transition-colors;
}

.mobile-nav-link.router-link-active {
  @apply text-white bg-gray-700;
}
</style>