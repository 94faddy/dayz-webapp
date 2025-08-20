<template>
  <div class="min-h-screen bg-gray-900 flex">
    <!-- Sidebar -->
    <div class="fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out"
         :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">
      <!-- Sidebar Header -->
      <div class="flex items-center justify-between h-16 px-4 bg-gray-900">
        <h1 class="text-xl font-bold text-white">DayZ Admin</h1>
        <button @click="sidebarOpen = false" class="lg:hidden text-gray-400 hover:text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- User Info -->
      <div class="px-4 py-4 border-b border-gray-700">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
              <span class="text-white font-medium text-lg">{{ admin?.username?.charAt(0)?.toUpperCase() }}</span>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-white">{{ admin?.username }}</p>
            <p class="text-xs text-gray-400">{{ admin?.role?.replace('_', ' ').toUpperCase() }}</p>
          </div>
        </div>
      </div>
      
      <!-- Navigation Menu -->
      <nav class="px-2 py-4 space-y-1">
        <NuxtLink 
          to="/admin/dashboard" 
          class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
          :class="$route.path === '/admin/dashboard' 
            ? 'bg-gray-900 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'"
        >
          <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          Dashboard
        </NuxtLink>
        
        <NuxtLink 
          to="/admin/users" 
          class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
          :class="$route.path === '/admin/users' 
            ? 'bg-gray-900 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'"
        >
          <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
          Users Management
        </NuxtLink>
        
        <NuxtLink 
          to="/admin/items" 
          class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
          :class="$route.path === '/admin/items' 
            ? 'bg-gray-900 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'"
        >
          <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>
          Store Items
        </NuxtLink>
        
        <NuxtLink 
          to="/admin/orders" 
          class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
          :class="$route.path === '/admin/orders' 
            ? 'bg-gray-900 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'"
        >
          <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
          </svg>
          Orders
        </NuxtLink>
        
        <!-- Separator -->
        <div class="my-3 border-t border-gray-700"></div>
        
        <!-- System Section -->
        <div class="px-3 py-2">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">System</p>
        </div>
        
        <NuxtLink 
          to="/admin/settings" 
          class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
          :class="$route.path === '/admin/settings' 
            ? 'bg-gray-900 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'"
        >
          <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          Settings
        </NuxtLink>
        
        <NuxtLink 
          to="/admin/logs" 
          class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
          :class="$route.path === '/admin/logs' 
            ? 'bg-gray-900 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'"
        >
          <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Activity Logs
        </NuxtLink>
        
        <!-- Additional Menu Items -->
        <NuxtLink 
          to="/admin/api-monitor" 
          class="group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
          :class="$route.path === '/admin/api-monitor' 
            ? 'bg-gray-900 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'"
        >
          <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          API Monitor
        </NuxtLink>
      </nav>
      
      <!-- Logout Button -->
      <div class="absolute bottom-0 w-full p-4 border-t border-gray-700">
        <button 
          @click="logout"
          class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
        >
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          Logout
        </button>
        
        <!-- Version Info -->
        <div class="mt-3 text-center">
          <p class="text-xs text-gray-500">DayZ Admin Panel v2.0</p>
        </div>
      </div>
    </div>
    
    <!-- Main Content Area -->
    <div class="flex-1 lg:ml-64">
      <!-- Top Header Bar -->
      <header class="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div class="px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <!-- Mobile menu button -->
            <button 
              @click="sidebarOpen = true"
              class="lg:hidden text-gray-400 hover:text-white focus:outline-none"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            
            <!-- Page Title -->
            <div class="flex-1 flex items-center">
              <h2 class="text-lg font-semibold text-white">{{ getPageTitle() }}</h2>
            </div>
            
            <!-- Quick Actions -->
            <div class="flex items-center space-x-4">
              <!-- Notifications -->
              <button class="relative text-gray-400 hover:text-white">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                <span class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-600 ring-2 ring-gray-800"></span>
              </button>
              
              <!-- Server Status -->
              <div class="flex items-center text-sm">
                <div class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span class="text-gray-400">Server Online</span>
              </div>
              
              <!-- Current Time -->
              <div class="text-sm text-gray-400">
                {{ currentTime }}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <!-- Page Content -->
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
    
    <!-- Mobile Sidebar Overlay -->
    <div 
      v-if="sidebarOpen" 
      @click="sidebarOpen = false"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
    ></div>
  </div>
</template>

<script setup>
const router = useRouter()
const route = useRoute()
const admin = ref(null)
const sidebarOpen = ref(false)
const currentTime = ref('')

// Update current time
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
}

// Get page title based on route
const getPageTitle = () => {
  const titles = {
    '/admin/dashboard': 'Dashboard Overview',
    '/admin/users': 'Users Management',
    '/admin/items': 'Store Items Management',
    '/admin/orders': 'Orders Management',
    '/admin/settings': 'System Settings',
    '/admin/logs': 'Activity Logs',
    '/admin/api-monitor': 'API Monitor'
  }
  return titles[route.path] || 'Admin Panel'
}

// Check admin session
onMounted(async () => {
  try {
    const response = await $fetch('/api/admin/auth/session')
    if (response.success) {
      admin.value = response.admin
    } else {
      await router.push('/admin/login')
    }
  } catch (error) {
    console.error('Session check failed:', error)
    await router.push('/admin/login')
  }
  
  // Update time every second
  updateTime()
  setInterval(updateTime, 1000)
})

// Close sidebar on route change (mobile)
watch(() => route.path, () => {
  sidebarOpen.value = false
})

// Logout function
const logout = async () => {
  try {
    await $fetch('/api/admin/auth/logout', { method: 'POST' })
    await router.push('/admin/login')
  } catch (error) {
    console.error('Logout failed:', error)
    // Force redirect even if logout fails
    await router.push('/admin/login')
  }
}
</script>

<style scoped>
/* Custom scrollbar for sidebar */
nav::-webkit-scrollbar {
  width: 6px;
}

nav::-webkit-scrollbar-track {
  background: #1f2937;
}

nav::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Smooth transitions */
.group:hover svg {
  transform: translateX(2px);
  transition: transform 0.2s ease;
}

/* Active link indicator */
.bg-gray-900::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 70%;
  background: #dc2626;
  border-radius: 0 2px 2px 0;
}

/* Position relative for active indicator */
nav a {
  position: relative;
}
</style>