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
          
          <!-- Store Settings -->
          <div v-if="activeTab === 'store'" class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-lg font-semibold text-white mb-4">Store Settings</h2>
            
            <div class="space-y-6">
              <!-- Auto Delivery -->
              <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <h3 class="text-sm font-medium text-white">Auto Delivery</h3>
                  <p class="text-sm text-gray-400">Automatically deliver items after purchase</p>
                  <p v-if="autoDeliveryEnabled" class="text-xs text-green-400 mt-1">
                    ✅ Items will be delivered automatically to players
                  </p>
                  <p v-else class="text-xs text-yellow-400 mt-1">
                    ⚠️ Items require manual delivery
                  </p>
                </div>
                <button
                  @click="toggleAutoDelivery"
                  :disabled="loading"
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    autoDeliveryEnabled ? 'bg-green-600' : 'bg-gray-600',
                    loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      autoDeliveryEnabled ? 'translate-x-6' : 'translate-x-1'
                    ]"
                  />
                </button>
              </div>
              
              <!-- Max Delivery Attempts -->
              <div class="p-4 bg-gray-700 rounded-lg">
                <label class="block text-sm font-medium text-white mb-2">
                  Max Delivery Attempts
                </label>
                <div class="flex items-center space-x-3">
                  <input
                    v-model="maxDeliveryAttempts"
                    type="number"
                    min="1"
                    max="10"
                    class="w-24 px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                  >
                  <button
                    @click="updateMaxDeliveryAttempts"
                    :disabled="loading"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Update
                  </button>
                </div>
                <p class="text-xs text-gray-400 mt-1">
                  Number of times system will try to deliver failed items
                </p>
              </div>
              
              <!-- Store Enabled -->
              <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <h3 class="text-sm font-medium text-white">Store Enabled</h3>
                  <p class="text-sm text-gray-400">Enable or disable the entire store</p>
                  <p v-if="storeEnabled" class="text-xs text-green-400 mt-1">
                    ✅ Store is accessible to users
                  </p>
                  <p v-else class="text-xs text-red-400 mt-1">
                    ❌ Store is disabled for maintenance
                  </p>
                </div>
                <button
                  @click="toggleStoreEnabled"
                  :disabled="loading"
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    storeEnabled ? 'bg-green-600' : 'bg-red-600',
                    loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      storeEnabled ? 'translate-x-6' : 'translate-x-1'
                    ]"
                  />
                </button>
              </div>
              
              <!-- Point Exchange Rate -->
              <div class="p-4 bg-gray-700 rounded-lg">
                <label class="block text-sm font-medium text-white mb-2">
                  Point Exchange Rate
                </label>
                <div class="flex items-center space-x-3">
                  <input
                    v-model="pointExchangeRate"
                    type="number"
                    min="1"
                    class="w-32 px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                  >
                  <span class="text-gray-400">Points per 1 THB</span>
                  <button
                    @click="updatePointExchangeRate"
                    :disabled="loading"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Update
                  </button>
                </div>
                <p class="text-xs text-gray-400 mt-1">
                  How many points a user gets for 1 THB payment
                </p>
              </div>
            </div>
          </div>
          
          <!-- General Settings -->
          <div v-if="activeTab === 'general'" class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-lg font-semibold text-white mb-4">General Settings</h2>
            
            <div class="space-y-6">
              <!-- Auto Approve Users -->
              <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <h3 class="text-sm font-medium text-white">Auto Approve Users</h3>
                  <p class="text-sm text-gray-400">Automatically approve new user registrations</p>
                </div>
                <button
                  @click="toggleAutoApprove"
                  :disabled="loading"
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    autoApproveEnabled ? 'bg-green-600' : 'bg-gray-600',
                    loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      autoApproveEnabled ? 'translate-x-6' : 'translate-x-1'
                    ]"
                  />
                </button>
              </div>
              
              <!-- Max Name Changes Per Month -->
              <div class="p-4 bg-gray-700 rounded-lg">
                <label class="block text-sm font-medium text-white mb-2">
                  Max Name Changes Per Month
                </label>
                <div class="flex items-center space-x-3">
                  <input
                    v-model="maxNameChanges"
                    type="number"
                    min="0"
                    max="10"
                    class="w-24 px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                  >
                  <button
                    @click="updateMaxNameChanges"
                    :disabled="loading"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- System Settings -->
          <div v-if="activeTab === 'system'" class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-lg font-semibold text-white mb-4">System Settings</h2>
            
            <div class="space-y-6">
              <!-- Maintenance Mode -->
              <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <h3 class="text-sm font-medium text-white">Maintenance Mode</h3>
                  <p class="text-sm text-gray-400">Put the site into maintenance mode</p>
                  <p v-if="maintenanceMode" class="text-xs text-red-400 mt-1">
                    ⚠️ Site is currently in maintenance mode
                  </p>
                </div>
                <button
                  @click="toggleMaintenanceMode"
                  :disabled="loading"
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    maintenanceMode ? 'bg-red-600' : 'bg-gray-600',
                    loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                    ]"
                  />
                </button>
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

const activeTab = ref('store') // เริ่มต้นที่ Store tab
const loading = ref(false)
const message = ref({ show: false, type: '', text: '' })

// Separate refs สำหรับแต่ละ setting
const autoDeliveryEnabled = ref(false)
const maxDeliveryAttempts = ref('3')
const storeEnabled = ref(true)
const pointExchangeRate = ref('100')
const autoApproveEnabled = ref(false)
const maxNameChanges = ref('1')
const maintenanceMode = ref(false)

onMounted(async () => {
  await loadSettings()
})

const loadSettings = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/admin/settings')
    
    console.log('📊 Loaded settings:', response)
    
    // Server config
    const serverConfig = response.serverConfig || {}
    autoApproveEnabled.value = serverConfig.auto_approve_users === 'true'
    maxNameChanges.value = serverConfig.max_name_changes_per_month || '1'
    
    // System settings
    const systemSettings = response.systemSettings || {}
    
    // Store/Delivery settings
    autoDeliveryEnabled.value = systemSettings.delivery?.auto_delivery?.value === 'true'
    maxDeliveryAttempts.value = systemSettings.delivery?.max_delivery_attempts?.value || '3'
    storeEnabled.value = systemSettings.store?.store_enabled?.value !== 'false' // default true
    pointExchangeRate.value = systemSettings.payment?.point_exchange_rate?.value || '100'
    
    // System settings
    maintenanceMode.value = systemSettings.system?.maintenance_mode?.value === 'true'
    
    console.log('✅ Settings loaded:', {
      autoDelivery: autoDeliveryEnabled.value,
      storeEnabled: storeEnabled.value,
      maintenanceMode: maintenanceMode.value
    })
    
  } catch (error) {
    console.error('❌ Failed to load settings:', error)
    showMessage('error', 'Failed to load settings')
  } finally {
    loading.value = false
  }
}

// Auto Delivery Toggle
const toggleAutoDelivery = async () => {
  if (loading.value) return
  
  try {
    loading.value = true
    const newValue = !autoDeliveryEnabled.value
    
    console.log('🔄 Toggling auto delivery:', newValue)
    
    const response = await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: { 
        type: 'system_settings', 
        key: 'auto_delivery', 
        value: newValue.toString() 
      }
    })
    
    if (response.success) {
      autoDeliveryEnabled.value = newValue
      showMessage('success', `Auto delivery ${newValue ? 'enabled' : 'disabled'}`)
      console.log('✅ Auto delivery toggled:', newValue)
    }
  } catch (error) {
    console.error('❌ Failed to toggle auto delivery:', error)
    showMessage('error', 'Failed to update auto delivery setting')
  } finally {
    loading.value = false
  }
}

// Store Enabled Toggle
const toggleStoreEnabled = async () => {
  if (loading.value) return
  
  try {
    loading.value = true
    const newValue = !storeEnabled.value
    
    if (!newValue) {
      if (!confirm('This will disable the store for all users. Continue?')) {
        loading.value = false
        return
      }
    }
    
    const response = await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: { 
        type: 'system_settings', 
        key: 'store_enabled', 
        value: newValue.toString() 
      }
    })
    
    if (response.success) {
      storeEnabled.value = newValue
      showMessage('success', `Store ${newValue ? 'enabled' : 'disabled'}`)
    }
  } catch (error) {
    console.error('❌ Failed to toggle store:', error)
    showMessage('error', 'Failed to update store setting')
  } finally {
    loading.value = false
  }
}

// Auto Approve Toggle
const toggleAutoApprove = async () => {
  if (loading.value) return
  
  try {
    loading.value = true
    const newValue = !autoApproveEnabled.value
    
    if (newValue && !confirm('This will automatically approve all pending users. Continue?')) {
      loading.value = false
      return
    }
    
    const response = await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: { 
        type: 'server_config', 
        key: 'auto_approve_users', 
        value: newValue.toString() 
      }
    })
    
    if (response.success) {
      autoApproveEnabled.value = newValue
      showMessage('success', `Auto approve ${newValue ? 'enabled' : 'disabled'}`)
    }
  } catch (error) {
    console.error('❌ Failed to toggle auto approve:', error)
    showMessage('error', 'Failed to update auto approve setting')
  } finally {
    loading.value = false
  }
}

// Maintenance Mode Toggle
const toggleMaintenanceMode = async () => {
  if (loading.value) return
  
  try {
    loading.value = true
    const newValue = !maintenanceMode.value
    
    if (newValue && !confirm('This will put the site in maintenance mode. Only admins can access. Continue?')) {
      loading.value = false
      return
    }
    
    const response = await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: { 
        type: 'system_settings', 
        key: 'maintenance_mode', 
        value: newValue.toString() 
      }
    })
    
    if (response.success) {
      maintenanceMode.value = newValue
      showMessage('success', `Maintenance mode ${newValue ? 'enabled' : 'disabled'}`)
    }
  } catch (error) {
    console.error('❌ Failed to toggle maintenance mode:', error)
    showMessage('error', 'Failed to update maintenance mode')
  } finally {
    loading.value = false
  }
}

// Update functions for numeric settings
const updateMaxDeliveryAttempts = async () => {
  await updateSetting('system_settings', 'max_delivery_attempts', maxDeliveryAttempts.value)
}

const updatePointExchangeRate = async () => {
  await updateSetting('system_settings', 'point_exchange_rate', pointExchangeRate.value)
}

const updateMaxNameChanges = async () => {
  await updateSetting('server_config', 'max_name_changes_per_month', maxNameChanges.value)
}

const updateSetting = async (type, key, value) => {
  if (loading.value) return
  
  try {
    loading.value = true
    
    const response = await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: { type, key, value: String(value) }
    })
    
    if (response.success) {
      showMessage('success', `Setting "${key}" updated successfully`)
    }
  } catch (error) {
    console.error('❌ Failed to update setting:', error)
    showMessage('error', `Failed to update setting: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const showMessage = (type, text) => {
  message.value = { show: true, type, text }
  setTimeout(() => {
    message.value.show = false
  }, 3000)
}
</script>