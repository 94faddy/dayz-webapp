<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Admin Header -->
    <header class="bg-gray-800 border-b border-gray-700">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo & Title -->
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-white">DayZ Admin Panel</h1>
          </div>
          
          <!-- Navigation -->
          <nav class="hidden md:flex space-x-8">
            <NuxtLink 
              to="/admin/dashboard" 
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              :class="{ 'bg-gray-900 text-white': $route.path === '/admin/dashboard' }"
            >
              Dashboard
            </NuxtLink>
            <NuxtLink 
              to="/admin/users" 
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              :class="{ 'bg-gray-900 text-white': $route.path === '/admin/users' }"
            >
              Users
            </NuxtLink>
            <NuxtLink 
              to="/admin/items" 
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              :class="{ 'bg-gray-900 text-white': $route.path === '/admin/items' }"
            >
              Store Items
            </NuxtLink>
            <NuxtLink 
              to="/admin/orders" 
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              :class="{ 'bg-gray-900 text-white': $route.path === '/admin/orders' }"
            >
              Orders
            </NuxtLink>
            <NuxtLink 
              to="/admin/settings" 
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              :class="{ 'bg-gray-900 text-white': $route.path === '/admin/settings' }"
            >
              Settings
            </NuxtLink>
            <NuxtLink 
              to="/admin/logs" 
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              :class="{ 'bg-gray-900 text-white': $route.path === '/admin/logs' }"
            >
              Activity Logs
            </NuxtLink>
          </nav>
          
          <!-- User Menu -->
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-300">
              <span class="font-medium">{{ admin?.username }}</span>
              <span class="text-gray-500 ml-1">({{ admin?.role }})</span>
            </div>
            <button 
              @click="logout"
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Mobile Navigation -->
    <div class="md:hidden bg-gray-800 border-b border-gray-700">
      <div class="px-2 pt-2 pb-3 space-y-1">
        <NuxtLink 
          to="/admin/dashboard" 
          class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          :class="{ 'bg-gray-900 text-white': $route.path === '/admin/dashboard' }"
        >
          Dashboard
        </NuxtLink>
        <NuxtLink 
          to="/admin/users" 
          class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          :class="{ 'bg-gray-900 text-white': $route.path === '/admin/users' }"
        >
          Users
        </NuxtLink>
        <NuxtLink 
          to="/admin/items" 
          class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          :class="{ 'bg-gray-900 text-white': $route.path === '/admin/items' }"
        >
          Store Items
        </NuxtLink>
        <NuxtLink 
          to="/admin/orders" 
          class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          :class="{ 'bg-gray-900 text-white': $route.path === '/admin/orders' }"
        >
          Orders
        </NuxtLink>
        <NuxtLink 
          to="/admin/settings" 
          class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          :class="{ 'bg-gray-900 text-white': $route.path === '/admin/settings' }"
        >
          Settings
        </NuxtLink>
        <NuxtLink 
          to="/admin/logs" 
          class="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          :class="{ 'bg-gray-900 text-white': $route.path === '/admin/logs' }"
        >
          Activity Logs
        </NuxtLink>
      </div>
    </div>
    
    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>

<script setup>
const router = useRouter()
const admin = ref(null)

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
})

// Logout function
const logout = async () => {
  try {
    await $fetch('/api/admin/auth/logout', { method: 'POST' })
    await router.push('/admin/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>