<template>
  <div>
    <!-- Hero Section -->
    <section class="relative h-screen flex items-center justify-center overflow-hidden">
      <!-- Background Gradient แทนรูปภาพ -->
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-gray-900"></div>
        <div class="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-red-900"></div>
      </div>
      
      <!-- Hero Content -->
      <div class="relative z-10 text-center max-w-4xl mx-auto px-4">
        <h1 class="text-5xl md:text-7xl font-bold text-white mb-6 slide-up">
          SURVIVE THE
          <span class="text-red-500">APOCALYPSE</span>
        </h1>
        <p class="text-xl md:text-2xl text-gray-300 mb-8 slide-up" style="animation-delay: 0.2s">
          Experience the ultimate survival challenge in DayZ
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center slide-up" style="animation-delay: 0.4s">
          <NuxtLink 
            to="/download" 
            class="dayz-button-primary text-lg px-8 py-4 hover:scale-105 transform transition-all duration-200"
          >
            Download Game
          </NuxtLink>
          <NuxtLink 
            to="/store" 
            class="dayz-button-secondary text-lg px-8 py-4 hover:scale-105 transform transition-all duration-200"
          >
            Visit Store
          </NuxtLink>
        </div>
      </div>
      
      <!-- Scroll Indicator -->
      <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
        </svg>
      </div>
    </section>
    
    <!-- Features Section -->
    <section class="py-20 bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-white mb-4">
            Why Choose Our DayZ Launcher?
          </h2>
          <p class="text-xl text-gray-400 max-w-2xl mx-auto">
            Experience the best of DayZ with our advanced launcher featuring automatic updates, 
            integrated store, and seamless gameplay.
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div class="dayz-card p-8 text-center hover:scale-105 transform transition-all duration-300">
            <div class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-4">Auto Updates</h3>
            <p class="text-gray-400">
              Never miss an update! Our launcher automatically downloads and installs 
              the latest game files and mods.
            </p>
          </div>
          
          <!-- Feature 2 -->
          <div class="dayz-card p-8 text-center hover:scale-105 transform transition-all duration-300">
            <div class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-4">Integrated Store</h3>
            <p class="text-gray-400">
              Purchase in-game items, weapons, and currency directly through our 
              secure integrated store system.
            </p>
          </div>
          
          <!-- Feature 3 -->
          <div class="dayz-card p-8 text-center hover:scale-105 transform transition-all duration-300">
            <div class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-4">Fast Performance</h3>
            <p class="text-gray-400">
              Optimized for speed with smart caching, concurrent downloads, 
              and minimal resource usage.
            </p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Server Status Section -->
    <section class="py-20 bg-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-white mb-4">
            Server Status
          </h2>
          <p class="text-gray-400">
            Real-time server information
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <!-- Server Status -->
          <div class="dayz-card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-white">Server Status</h3>
              <div class="flex items-center space-x-2">
                <div 
                  class="w-3 h-3 rounded-full"
                  :class="{
                    'bg-green-500 animate-pulse': serverStatus.isOnline,
                    'bg-red-500': !serverStatus.isOnline && serverStatus.status === 'offline',
                    'bg-yellow-500': serverStatus.status === 'unknown'
                  }"
                ></div>
                <span 
                  class="font-medium capitalize"
                  :class="{
                    'text-green-500': serverStatus.isOnline,
                    'text-red-500': !serverStatus.isOnline && serverStatus.status === 'offline',
                    'text-yellow-500': serverStatus.status === 'unknown'
                  }"
                >
                  {{ serverStatus.status }}
                </span>
              </div>
            </div>
            
            <div class="space-y-3 text-sm">
              <div class="flex justify-between text-gray-400">
                <span>Server:</span>
                <span class="text-white">{{ serverStatus.serverName }}</span>
              </div>
              
              <div class="flex justify-between text-gray-400">
                <span>Uptime:</span>
                <span class="text-white">{{ serverStatus.uptime }}</span>
              </div>
              
              <div class="flex justify-between text-gray-400">
                <span>Last Update:</span>
                <span class="text-white text-xs">
                  {{ serverStatus.lastUpdateFormatted || 'Unknown' }}
                </span>
              </div>
              
              <div v-if="serverStatus.message" class="mt-4">
                <p class="text-sm text-yellow-400">
                  {{ serverStatus.message }}
                </p>
              </div>
            </div>
          </div>
          
          <!-- Player Count -->
          <div class="dayz-card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-white">Players</h3>
              <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
            </div>
            <div class="text-3xl font-bold text-white mb-2">
              {{ serverStatus.players.current }}/{{ serverStatus.players.max }}
            </div>
            <div class="text-sm text-gray-400 mb-4">
              Players online
            </div>
            <div class="bg-gray-700 rounded-full h-2">
              <div 
                class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: (serverStatus.players.current / serverStatus.players.max * 100) + '%' }"
              ></div>
            </div>
          </div>
          
          <!-- Performance -->
          <div class="dayz-card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-white">Performance</h3>
              <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
              </svg>
            </div>
            
            <div class="space-y-3 text-sm">
              <div class="flex justify-between text-gray-400">
                <span>Server FPS:</span>
                <span class="text-white font-bold">{{ serverStatus.fps }}</span>
              </div>
              
              <div class="flex justify-between text-gray-400">
                <span>API Status:</span>
                <span 
                  class="font-medium"
                  :class="{
                    'text-green-500': serverStatus.success,
                    'text-red-500': !serverStatus.success
                  }"
                >
                  {{ serverStatus.success ? 'Connected' : 'Disconnected' }}
                </span>
              </div>
              
              <div class="flex justify-between text-gray-400">
                <span>Next Update:</span>
                <span class="text-white">{{ nextUpdateIn }}s</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Loading Indicator -->
        <div v-if="loading" class="text-center mt-8">
          <div class="inline-flex items-center space-x-2 text-gray-400">
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Updating server status...</span>
          </div>
        </div>
      </div>
    </section>
    
    <!-- CTA Section -->
    <section class="py-20 bg-gradient-to-r from-red-900 to-red-700">
      <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl font-bold text-white mb-6">
          Ready to Start Your Survival Journey?
        </h2>
        <p class="text-xl text-red-100 mb-8">
          Join thousands of survivors in the ultimate post-apocalyptic experience.
          Download the launcher and start playing today!
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <template v-if="!user">
            <NuxtLink 
              to="/register" 
              class="bg-white text-red-700 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105 transform"
            >
              Create Account
            </NuxtLink>
            <NuxtLink 
              to="/download" 
              class="border-2 border-white text-white hover:bg-white hover:text-red-700 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105 transform"
            >
              Download Launcher
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink 
              to="/download" 
              class="bg-white text-red-700 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105 transform"
            >
              Download Launcher
            </NuxtLink>
            <NuxtLink 
              to="/store" 
              class="border-2 border-white text-white hover:bg-white hover:text-red-700 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105 transform"
            >
              Visit Store
            </NuxtLink>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// Meta
definePageMeta({
  title: 'Home',
  layout: 'default'
})

// State
const user = useState('auth.user')
const loading = ref(false)
const nextUpdateIn = ref(60)

// Server status reactive data
const serverStatus = reactive({
  status: 'unknown',
  isOnline: false,
  success: false,
  message: null,
  lastUpdate: null,
  lastUpdateFormatted: null,
  serverName: 'DayZ Nightro Server',
  logContent: null,
  uptime: 'Unknown',
  fps: 0,
  players: { current: 0, max: 60 }
})

// Function to fetch server status
const fetchServerStatus = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/server/status')
    
    if (response.success && response.data) {
      Object.assign(serverStatus, response.data)
    } else {
      console.error('Failed to fetch server status:', response.error)
    }
  } catch (error) {
    console.error('Error fetching server status:', error)
    // Set error state
    Object.assign(serverStatus, {
      status: 'unknown',
      isOnline: false,
      success: false,
      message: 'Unable to connect to server',
      lastUpdate: null,
      lastUpdateFormatted: null,
      serverName: 'DayZ Nightro Server',
      logContent: null
    })
  } finally {
    loading.value = false
  }
}

// Countdown timer for next update
const startCountdown = () => {
  nextUpdateIn.value = 60
  const interval = setInterval(() => {
    nextUpdateIn.value--
    if (nextUpdateIn.value <= 0) {
      clearInterval(interval)
      fetchServerStatus().then(() => {
        if (process.client) {
          startCountdown()
        }
      })
    }
  }, 1000)
  
  // Cleanup interval when component unmounts
  onUnmounted(() => {
    clearInterval(interval)
  })
}

// Fetch server status on mount
onMounted(async () => {
  await fetchServerStatus()
  startCountdown()
})
</script>

<style scoped>
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up {
  animation: slideUp 0.8s ease-out forwards;
  opacity: 0;
}
</style>