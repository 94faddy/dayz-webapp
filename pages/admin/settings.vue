<template>
  <div>
    <NuxtLayout name="admin">
      <div class="py-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-2xl font-bold text-white mb-6">System Settings</h1>
          
          <!-- Settings Tabs -->
          <div class="mb-6">
            <div class="border-b border-gray-700">
              <nav class="-mb-px flex space-x-8">
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  @click="activeTab = tab.id"
                  :class="[
                    'py-2 px-1 border-b-2 font-medium text-sm',
                    activeTab === tab.id
                      ? 'border-red-500 text-red-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  ]"
                >
                  {{ tab.name }}
                </button>
              </nav>
            </div>
          </div>
          
          <!-- General Settings -->
          <div v-if="activeTab === 'general'" class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-lg font-semibold text-white mb-4">General Settings</h2>
            
            <div class="space-y-6">
              <!-- Auto Approve Users -->
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-white">Auto Approve Users</h3>
                  <p class="text-sm text-gray-400">Automatically approve new user registrations</p>
                  <p v-if="serverConfig.auto_approve_users === 'true'" class="text-xs text-green-400 mt-1">
                    ✅ New users can login immediately after registration
                  </p>
                  <p v-else class="text-xs text-yellow-400 mt-1">
                    ⚠️ New users must wait for admin approval
                  </p>
                </div>
                <button
                  @click="toggleAutoApprove"
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    serverConfig.auto_approve_users === 'true' ? 'bg-green-600' : 'bg-gray-600'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      serverConfig.auto_approve_users === 'true' ? 'translate-x-6' : 'translate-x-1'
                    ]"
                  />
                </button>
              </div>
              
              <!-- Max Name Changes Per Month -->
              <div>
                <label class="block text-sm font-medium text-white mb-2">
                  Max Name Changes Per Month
                </label>
                <div class="flex items-center space-x-3">
                  <input
                    v-model="serverConfig.max_name_changes_per_month"
                    type="number"
                    min="0"
                    max="10"
                    class="w-24 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                  >
                  <button
                    @click="updateSetting('server_config', 'max_name_changes_per_month', serverConfig.max_name_changes_per_month)"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Update
                  </button>
                </div>
                <p class="text-xs text-gray-400 mt-1">
                  Number of times a user can change their name per month (0 = disabled)
                </p>
              </div>
            </div>
          </div>
          
          <!-- Store Settings -->
          <div v-if="activeTab === 'store'" class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-lg font-semibold text-white mb-4">Store Settings</h2>
            
            <div class="space-y-6">
              <!-- Point Exchange Rate -->
              <div>
                <label class="block text-sm font-medium text-white mb-2">
                  Point Exchange Rate
                </label>
                <div class="flex items-center space-x-3">
                  <input
                    v-model="pointExchangeRate"
                    type="number"
                    min="1"
                    class="w-32 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                  >
                  <span class="text-gray-400">Points per 1 THB</span>
                  <button
                    @click="updateSetting('system_settings', 'point_exchange_rate', pointExchangeRate)"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Update
                  </button>
                </div>
                <p class="text-xs text-gray-400 mt-1">
                  How many points a user gets for 1 THB payment
                </p>
              </div>
              
              <!-- Auto Delivery -->
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-white">Auto Delivery</h3>
                  <p class="text-sm text-gray-400">Automatically deliver items after purchase</p>
                </div>
                <button
                  @click="toggleSystemSetting('auto_delivery')"
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    systemSettings.delivery?.auto_delivery?.value === 'true' ? 'bg-green-600' : 'bg-gray-600'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      systemSettings.delivery?.auto_delivery?.value === 'true' ? 'translate-x-6' : 'translate-x-1'
                    ]"
                  />
                </button>
              </div>
              
              <!-- Max Delivery Attempts -->
              <div>
                <label class="block text-sm font-medium text-white mb-2">
                  Max Delivery Attempts
                </label>
                <div class="flex items-center space-x-3">
                  <input
                    v-model="maxDeliveryAttempts"
                    type="number"
                    min="1"
                    max="10"
                    class="w-24 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                  >
                  <button
                    @click="updateSetting('system_settings', 'max_delivery_attempts', maxDeliveryAttempts)"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Update
                  </button>
                </div>
              </div>
              
              <!-- Store Enabled -->
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-white">Store Enabled</h3>
                  <p class="text-sm text-gray-400">Enable or disable the store</p>
                </div>
                <button
                  @click="toggleSystemSetting('store_enabled')"
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    systemSettings.store?.store_enabled?.value === 'true' ? 'bg-green-600' : 'bg-gray-600'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      systemSettings.store?.store_enabled?.value === 'true' ? 'translate-x-6' : 'translate-x-1'
                    ]"
                  />
                </button>
              </div>
            </div>
          </div>
          
          <!-- System Settings -->
          <div v-if="activeTab === 'system'" class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-lg font-semibold text-white mb-4">System Settings</h2>
            
            <div class="space-y-6">
              <!-- Maintenance Mode -->
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-white">Maintenance Mode</h3>
                  <p class="text-sm text-gray-400">Put the site into maintenance mode</p>
                  <p v-if="systemSettings.system?.maintenance_mode?.value === 'true'" class="text-xs text-red-400 mt-1">
                    ⚠️ Site is currently in maintenance mode - users cannot access
                  </p>
                </div>
                <button
                  @click="toggleSystemSetting('maintenance_mode')"
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    systemSettings.system?.maintenance_mode?.value === 'true' ? 'bg-red-600' : 'bg-gray-600'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      systemSettings.system?.maintenance_mode?.value === 'true' ? 'translate-x-6' : 'translate-x-1'
                    ]"
                  />
                </button>
              </div>
              
              <!-- Site Name -->
              <div>
                <label class="block text-sm font-medium text-white mb-2">
                  Site Name
                </label>
                <div class="flex items-center space-x-3">
                  <input
                    v-model="siteName"
                    type="text"
                    class="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                  >
                  <button
                    @click="updateSetting('system_settings', 'site_name', siteName)"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Update
                  </button>
                </div>
              </div>
              
              <!-- API Timeout -->
              <div>
                <label class="block text-sm font-medium text-white mb-2">
                  API Timeout (seconds)
                </label>
                <div class="flex items-center space-x-3">
                  <input
                    v-model="apiTimeout"
                    type="number"
                    min="5"
                    max="300"
                    class="w-24 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                  >
                  <button
                    @click="updateSetting('system_settings', 'api_timeout', apiTimeout)"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Success/Error Messages -->
          <div v-if="message.show" class="mt-6">
            <div :class="[
              'p-4 rounded-lg',
              message.type === 'success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
            ]">
              {{ message.text }}
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

const tabs = [
  { id: 'general', name: 'General' },
  { id: 'store', name: 'Store' },
  { id: 'system', name: 'System' }
]

const activeTab = ref('general')
const serverConfig = ref({})
const systemSettings = ref({})
const message = ref({ show: false, type: '', text: '' })

// Separate refs for form inputs to avoid optional chaining in v-model
const pointExchangeRate = ref('100')
const maxDeliveryAttempts = ref('3')
const siteName = ref('DayZ Nightro Store')
const apiTimeout = ref('30')

onMounted(async () => {
  await loadSettings()
})

const loadSettings = async () => {
  try {
    const response = await $fetch('/api/admin/settings')
    serverConfig.value = response.serverConfig
    systemSettings.value = response.systemSettings
    
    // Update individual refs
    pointExchangeRate.value = systemSettings.value.payment?.point_exchange_rate?.value || '100'
    maxDeliveryAttempts.value = systemSettings.value.delivery?.max_delivery_attempts?.value || '3'
    siteName.value = systemSettings.value.general?.site_name?.value || 'DayZ Nightro Store'
    apiTimeout.value = systemSettings.value.api?.api_timeout?.value || '30'
  } catch (error) {
    console.error('Failed to load settings:', error)
    showMessage('error', 'Failed to load settings')
  }
}

const toggleAutoApprove = async () => {
  const newValue = serverConfig.value.auto_approve_users === 'true' ? 'false' : 'true'
  
  if (newValue === 'true') {
    if (!confirm('This will automatically approve all pending users. Continue?')) {
      return
    }
  }
  
  await updateSetting('server_config', 'auto_approve_users', newValue)
}

const toggleSystemSetting = async (key) => {
  const category = Object.keys(systemSettings.value).find(cat => 
    systemSettings.value[cat] && systemSettings.value[cat][key]
  )
  
  if (!category) return
  
  const currentValue = systemSettings.value[category][key].value
  const newValue = currentValue === 'true' ? 'false' : 'true'
  
  await updateSetting('system_settings', key, newValue)
}

const updateSetting = async (type, key, value) => {
  try {
    const response = await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: { type, key, value: String(value) }
    })
    
    if (response.success) {
      await loadSettings()
      showMessage('success', `Setting "${key}" updated successfully`)
    }
  } catch (error) {
    console.error('Failed to update setting:', error)
    showMessage('error', `Failed to update setting: ${error.message}`)
  }
}

const showMessage = (type, text) => {
  message.value = { show: true, type, text }
  setTimeout(() => {
    message.value.show = false
  }, 3000)
}
</script>