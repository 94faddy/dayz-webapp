<template>
  <div>
    <NuxtLayout name="admin">
      <div class="py-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-white">Users Management</h1>
            <div class="flex space-x-2">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search users..."
                class="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-red-500"
              >
              <select
                v-model="filterStatus"
                class="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-red-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="banned">Banned</option>
              </select>
            </div>
          </div>
          
          <!-- Users Table -->
          <div class="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-700">
                <thead class="bg-gray-900">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Steam ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Points</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IP / MAC</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Login Info</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-gray-800 divide-y divide-gray-700">
                  <tr v-for="user in filteredUsers" :key="user.id">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div class="text-sm font-medium text-white">{{ user.name }}</div>
                        <div class="text-sm text-gray-400">{{ user.email }}</div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {{ user.steamid64 }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center space-x-2">
                        <span class="text-sm text-white">{{ user.points }}</span>
                        <button
                          @click="openPointsModal(user)"
                          class="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span v-if="user.is_banned" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900 text-red-200">
                        Banned
                      </span>
                      <span v-else-if="user.is_active" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-200">
                        Active
                      </span>
                      <span v-else class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-900 text-yellow-200">
                        Pending
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                      <div>IP: {{ user.last_ip || 'N/A' }}</div>
                      <div>MAC: {{ user.mac_address || 'N/A' }}</div>
                      <div v-if="user.registration_ip" class="text-gray-500">Reg IP: {{ user.registration_ip }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                      <div>Web: {{ user.last_login ? formatDate(user.last_login) : 'Never' }}</div>
                      <div>Launcher: {{ user.launcher_login_count || 0 }} times</div>
                      <div v-if="user.last_launcher_activity">Last: {{ formatDate(user.last_launcher_activity) }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div class="flex space-x-2">
                        <button
                          @click="editUser(user)"
                          class="text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          v-if="!user.is_banned"
                          @click="openBanModal(user)"
                          class="text-red-400 hover:text-red-300"
                        >
                          Ban
                        </button>
                        <button
                          v-else
                          @click="unbanUser(user.id)"
                          class="text-green-400 hover:text-green-300"
                        >
                          Unban
                        </button>
                        <button
                          v-if="!user.is_active && !user.is_banned"
                          @click="approveUser(user.id)"
                          class="text-green-400 hover:text-green-300"
                        >
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Edit User Modal -->
      <div v-if="editModal.show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <h2 class="text-xl font-bold text-white mb-4">Edit User</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Name</label>
              <input
                v-model="editModal.user.name"
                type="text"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input
                v-model="editModal.user.email"
                type="email"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Steam ID64</label>
              <input
                v-model="editModal.user.steamid64"
                type="text"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">New Password (leave blank to keep current)</label>
              <input
                v-model="editModal.newPassword"
                type="password"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
              >
            </div>
            <div class="flex items-center space-x-4">
              <label class="flex items-center">
                <input
                  v-model="editModal.user.is_active"
                  type="checkbox"
                  class="mr-2"
                >
                <span class="text-sm text-gray-400">Active</span>
              </label>
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button
              @click="editModal.show = false"
              class="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              @click="saveUserEdit"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
      
      <!-- Ban User Modal -->
      <div v-if="banModal.show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <h2 class="text-xl font-bold text-white mb-4">Ban User: {{ banModal.user.name }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Ban Reason</label>
              <textarea
                v-model="banModal.reason"
                rows="3"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                required
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Ban Duration</label>
              <select
                v-model="banModal.duration"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
              >
                <option value="24">24 Hours</option>
                <option value="72">3 Days</option>
                <option value="168">1 Week</option>
                <option value="720">1 Month</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  v-model="banModal.banIp"
                  type="checkbox"
                  class="mr-2"
                >
                <span class="text-sm text-gray-400">Ban IP Address ({{ banModal.user.last_ip }})</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="banModal.banMac"
                  type="checkbox"
                  class="mr-2"
                >
                <span class="text-sm text-gray-400">Ban MAC Address ({{ banModal.user.mac_address }})</span>
              </label>
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button
              @click="banModal.show = false"
              class="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              @click="banUser"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Ban User
            </button>
          </div>
        </div>
      </div>
      
      <!-- Points Modal -->
      <div v-if="pointsModal.show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <h2 class="text-xl font-bold text-white mb-4">Adjust Points: {{ pointsModal.user.name }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Current Points</label>
              <div class="text-lg text-white">{{ pointsModal.user.points }}</div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Action</label>
              <select
                v-model="pointsModal.action"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
              >
                <option value="add">Add Points</option>
                <option value="subtract">Subtract Points</option>
                <option value="set">Set Points</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Amount</label>
              <input
                v-model.number="pointsModal.amount"
                type="number"
                min="0"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Reason</label>
              <input
                v-model="pointsModal.reason"
                type="text"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
              >
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button
              @click="pointsModal.show = false"
              class="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              @click="adjustPoints"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Apply
            </button>
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

const users = ref([])
const searchQuery = ref('')
const filterStatus = ref('all')

const editModal = ref({
  show: false,
  user: {},
  newPassword: ''
})

const banModal = ref({
  show: false,
  user: {},
  reason: '',
  duration: '24',
  banIp: false,
  banMac: false
})

const pointsModal = ref({
  show: false,
  user: {},
  action: 'add',
  amount: 0,
  reason: ''
})

const filteredUsers = computed(() => {
  let filtered = users.value
  
  // Filter by status
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(user => {
      if (filterStatus.value === 'active') return user.is_active && !user.is_banned
      if (filterStatus.value === 'pending') return !user.is_active && !user.is_banned
      if (filterStatus.value === 'banned') return user.is_banned
    })
  }
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.steamid64.includes(query)
    )
  }
  
  return filtered
})

onMounted(async () => {
  await loadUsers()
})

const loadUsers = async () => {
  try {
    const response = await $fetch('/api/admin/users')
    users.value = response.users
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

const editUser = (user) => {
  editModal.value.user = { ...user }
  editModal.value.newPassword = ''
  editModal.value.show = true
}

const saveUserEdit = async () => {
  try {
    const updates = []
    const original = users.value.find(u => u.id === editModal.value.user.id)
    
    // Check what changed
    if (original.name !== editModal.value.user.name) {
      updates.push({ field: 'name', value: editModal.value.user.name })
    }
    if (original.email !== editModal.value.user.email) {
      updates.push({ field: 'email', value: editModal.value.user.email })
    }
    if (original.steamid64 !== editModal.value.user.steamid64) {
      updates.push({ field: 'steamid64', value: editModal.value.user.steamid64 })
    }
    if (original.is_active !== editModal.value.user.is_active) {
      updates.push({ field: 'is_active', value: editModal.value.user.is_active })
    }
    if (editModal.value.newPassword) {
      updates.push({ field: 'password', value: editModal.value.newPassword })
    }
    
    // Apply updates
    for (const update of updates) {
      await $fetch('/api/admin/users', {
        method: 'PUT',
        body: {
          userId: editModal.value.user.id,
          field: update.field,
          value: update.value
        }
      })
    }
    
    editModal.value.show = false
    await loadUsers()
  } catch (error) {
    console.error('Failed to save user:', error)
  }
}

const openBanModal = (user) => {
  banModal.value.user = user
  banModal.value.reason = ''
  banModal.value.duration = '24'
  banModal.value.banIp = false
  banModal.value.banMac = false
  banModal.value.show = true
}

const banUser = async () => {
  try {
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: {
        action: 'ban',
        userId: banModal.value.user.id,
        data: {
          reason: banModal.value.reason,
          duration: banModal.value.duration,
          banIp: banModal.value.banIp,
          banMac: banModal.value.banMac
        }
      }
    })
    
    banModal.value.show = false
    await loadUsers()
  } catch (error) {
    console.error('Failed to ban user:', error)
  }
}

const unbanUser = async (userId) => {
  try {
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: {
        action: 'unban',
        userId
      }
    })
    await loadUsers()
  } catch (error) {
    console.error('Failed to unban user:', error)
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
    await loadUsers()
  } catch (error) {
    console.error('Failed to approve user:', error)
  }
}

const openPointsModal = (user) => {
  pointsModal.value.user = user
  pointsModal.value.action = 'add'
  pointsModal.value.amount = 0
  pointsModal.value.reason = ''
  pointsModal.value.show = true
}

const adjustPoints = async () => {
  try {
    let finalAmount = pointsModal.value.amount
    
    if (pointsModal.value.action === 'subtract') {
      finalAmount = -finalAmount
    } else if (pointsModal.value.action === 'set') {
      finalAmount = pointsModal.value.amount - pointsModal.value.user.points
    }
    
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: {
        action: 'add_points',
        userId: pointsModal.value.user.id,
        data: {
          amount: finalAmount,
          reason: pointsModal.value.reason || `Admin adjustment (${pointsModal.value.action})`
        }
      }
    })
    
    pointsModal.value.show = false
    await loadUsers()
  } catch (error) {
    console.error('Failed to adjust points:', error)
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}
</script>