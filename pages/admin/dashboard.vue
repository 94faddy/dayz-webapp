<template>
  <div>
    <NuxtLayout name="admin">
      <div class="py-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-2xl font-bold text-white mb-6">Dashboard</h1>
          
          <!-- Stats Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Total Users -->
            <div class="bg-gray-800 rounded-lg p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-blue-600 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-400 truncate">Total Users</dt>
                    <dd class="text-lg font-semibold text-white">{{ stats.totalUsers }}</dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <!-- Active Users -->
            <div class="bg-gray-800 rounded-lg p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-green-600 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-400 truncate">Active Users</dt>
                    <dd class="text-lg font-semibold text-white">{{ stats.activeUsers }}</dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <!-- Total Items -->
            <div class="bg-gray-800 rounded-lg p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-purple-600 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-400 truncate">Store Items</dt>
                    <dd class="text-lg font-semibold text-white">{{ stats.totalItems }}</dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <!-- Total Revenue -->
            <div class="bg-gray-800 rounded-lg p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-yellow-600 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-400 truncate">Total Revenue</dt>
                    <dd class="text-lg font-semibold text-white">{{ stats.totalRevenue.toLocaleString() }} Points</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Recent Activities -->
          <div class="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 class="text-lg font-bold text-white mb-4">Recent Activities</h2>
            <div class="space-y-4">
              <div v-for="activity in recentActivities" :key="activity.id" class="flex items-center space-x-4 text-sm">
                <div class="flex-shrink-0">
                  <span :class="getActivityIcon(activity.action)" class="h-8 w-8 rounded-full flex items-center justify-center">
                    <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getActivityIconPath(activity.action)"></path>
                    </svg>
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-gray-300">
                    <span class="font-medium text-white">{{ activity.admin_username }}</span>
                    {{ activity.description }}
                  </p>
                  <p class="text-gray-500 text-xs">{{ formatDate(activity.created_at) }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Pending Approvals -->
          <div class="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 class="text-lg font-bold text-white mb-4">Pending Approvals</h2>
            <div v-if="pendingUsers.length > 0" class="space-y-4">
              <div v-for="user in pendingUsers" :key="user.id" class="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                <div>
                  <p class="text-white font-medium">{{ user.name }}</p>
                  <p class="text-gray-400 text-sm">{{ user.email }}</p>
                  <p class="text-gray-500 text-xs">Registered: {{ formatDate(user.created_at) }}</p>
                </div>
                <div class="flex space-x-2">
                  <button 
                    @click="approveUser(user.id)"
                    class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                  >
                    Approve
                  </button>
                  <button 
                    @click="rejectUser(user.id)"
                    class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="text-gray-500 text-center py-4">
              No pending approvals
            </div>
          </div>
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})

const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  totalItems: 0,
  totalRevenue: 0
})

const recentActivities = ref([])
const pendingUsers = ref([])

onMounted(async () => {
  await loadDashboardData()
})

const loadDashboardData = async () => {
  try {
    const response = await $fetch('/api/admin/dashboard')
    stats.value = response.stats
    recentActivities.value = response.recentActivities
    pendingUsers.value = response.pendingUsers
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

const approveUser = async (userId) => {
  try {
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: {
        action: 'approve',
        userId
      }
    })
    await loadDashboardData()
  } catch (error) {
    console.error('Failed to approve user:', error)
  }
}

const rejectUser = async (userId) => {
  try {
    await $fetch('/api/admin/users', {
      method: 'DELETE',
      body: { userId }
    })
    await loadDashboardData()
  } catch (error) {
    console.error('Failed to reject user:', error)
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

const getActivityIcon = (action) => {
  const iconMap = {
    'login': 'bg-blue-600',
    'create': 'bg-green-600',
    'update': 'bg-yellow-600',
    'delete': 'bg-red-600',
    'ban': 'bg-red-700',
    'approve': 'bg-green-700'
  }
  return iconMap[action.split('_')[0]] || 'bg-gray-600'
}

const getActivityIconPath = (action) => {
  const pathMap = {
    'login': 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
    'create': 'M12 4v16m8-8H4',
    'update': 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    'delete': 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
  }
  return pathMap[action.split('_')[0]] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
}
</script>