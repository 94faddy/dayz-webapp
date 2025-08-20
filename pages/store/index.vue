<template>
  <div class="min-h-screen py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-white mb-4">
          DayZ Store
        </h1>
        <p class="text-xl text-gray-400 max-w-2xl mx-auto">
          Purchase weapons, items, vehicles, and in-game currency to enhance your survival experience
        </p>
        
        <!-- Points Display -->
        <div v-if="user" class="mt-6 inline-flex items-center space-x-3 bg-gray-800 px-6 py-3 rounded-full">
          <svg class="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
          </svg>
          <span class="text-2xl font-bold text-yellow-500">{{ formatNumber(user.points) }}</span>
          <span class="text-gray-400">Points</span>
          <div class="flex items-center space-x-2 ml-4">
            <button 
              @click="showTopUpModal"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-full text-sm font-medium transition-colors"
            >
              Top Up
            </button>
            <NuxtLink 
              to="/orders"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full text-sm font-medium transition-colors"
            >
              My Orders
            </NuxtLink>            
          </div>
        </div>
        
        <!-- Login Required Message -->
        <div v-else class="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg max-w-md mx-auto">
          <div class="flex items-center space-x-3">
            <svg class="w-5 h-5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            <div class="text-sm text-yellow-300">
              <p class="font-medium">Login Required</p>
              <p>Please login to make purchases and manage your items</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Category Filter -->
      <div class="flex flex-wrap justify-center gap-4 mb-8">
        <button
          v-for="category in categories"
          :key="category.value"
          @click="selectedCategory = category.value"
          class="px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
          :class="selectedCategory === category.value 
            ? 'bg-red-600 text-white shadow-lg' 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  :d="getCategoryIconPath(category.value)"></path>
          </svg>
          <span>{{ category.name }}</span>
          <span class="bg-black bg-opacity-30 text-xs px-2 py-0.5 rounded-full">
            {{ category.count }}
          </span>
        </button>
      </div>
      
      <!-- Items Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="dayz-card overflow-hidden hover:scale-105 transform transition-all duration-300 hover:shadow-2xl"
        >
          <!-- Item Image -->
          <div class="relative h-48 bg-gray-700 overflow-hidden">
            <img
              :src="item.image_url || '/placeholder-item.jpg'"
              :alt="item.name"
              class="w-full h-full object-contain p-2"
              @error="handleImageError"
            />
            <!-- Category Badge -->
            <div class="absolute top-3 left-3">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    :class="getCategoryBadgeClass(item.category)">
                {{ getCategoryName(item.category) }}
              </span>
            </div>
            <!-- Price Badge -->
            <div class="absolute top-3 right-3 bg-black/75 backdrop-blur-sm rounded-full px-3 py-1">
              <div class="flex items-center space-x-1">
                <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                </svg>
                <span class="text-yellow-400 font-bold">{{ formatNumber(item.price) }}</span>
              </div>
            </div>
            <!-- Stock Badge -->
            <div v-if="!item.stock_unlimited && item.stock_quantity < 10" 
                 class="absolute bottom-3 left-3 bg-red-600/90 text-white text-xs px-2 py-1 rounded">
              Only {{ item.stock_quantity }} left!
            </div>
          </div>
          
          <!-- Item Details -->
          <div class="p-6">
            <h3 class="text-lg font-semibold text-white mb-2">{{ item.name }}</h3>
            <p class="text-gray-400 text-sm mb-4 line-clamp-2">
              {{ item.description || 'High-quality item for your survival needs.' }}
            </p>
            
            <!-- Item Info -->
            <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
              <span>{{ item.classname }}</span>
              <div class="flex items-center space-x-2">
                <span v-if="item.attachments && item.attachments.length > 0" class="text-green-400">
                  +{{ item.attachments.length }} attachments
                </span>
                <!-- Detail Button -->
                <button
                  @click="showItemDetails(item)"
                  class="text-blue-400 hover:text-blue-300 text-xs underline"
                  title="View item details and attachments"
                >
                  Details
                </button>
              </div>
            </div>
            
            <!-- Action Button -->
            <button
              @click="purchaseItem(item)"
              :disabled="!user || (user && user.points < item.price) || (!item.stock_unlimited && item.stock_quantity === 0)"
              class="w-full py-3 rounded-lg font-medium transition-all duration-200"
              :class="!user 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : (!item.stock_unlimited && item.stock_quantity === 0)
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : user.points < item.price 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'dayz-button-primary hover:shadow-lg'"
            >
              <template v-if="!user">
                Login to Purchase
              </template>
              <template v-else-if="!item.stock_unlimited && item.stock_quantity === 0">
                Out of Stock
              </template>
              <template v-else-if="user.points < item.price">
                Insufficient Points
              </template>
              <template v-else>
                Purchase Now
              </template>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="loader mr-4"></div>
        <span class="text-gray-400">Loading store items...</span>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="filteredItems.length === 0" class="text-center py-20">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5"/>
        </svg>
        <h3 class="text-xl font-semibold text-white mb-2">No Items Found</h3>
        <p class="text-gray-400">No items available in the selected category.</p>
      </div>
      
      <!-- Item Details Modal -->
      <div v-if="selectedItem" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <!-- Modal Header -->
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-semibold text-white">Item Details</h3>
              <button @click="selectedItem = null" class="text-gray-400 hover:text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <!-- Item Header -->
            <div class="flex items-start space-x-6 mb-6">
              <div class="flex-shrink-0">
                <img
                  :src="selectedItem.image_url || '/placeholder-item.jpg'"
                  :alt="selectedItem.name"
                  class="w-32 h-32 object-contain rounded-lg bg-gray-700 p-2"
                  @error="handleImageError"
                />
              </div>
              
              <div class="flex-1">
                <h4 class="text-2xl font-bold text-white mb-2">{{ selectedItem.name }}</h4>
                <p class="text-gray-400 mb-3">{{ selectedItem.description || 'High-quality item for your survival needs.' }}</p>
                
                <div class="flex items-center space-x-4 mb-3">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                        :class="getCategoryBadgeClass(selectedItem.category)">
                    {{ getCategoryName(selectedItem.category) }}
                  </span>
                  
                  <div class="flex items-center space-x-2">
                    <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                    </svg>
                    <span class="text-2xl font-bold text-yellow-400">{{ formatNumber(selectedItem.price) }}</span>
                  </div>
                </div>
                
                <div class="text-sm text-gray-400">
                  <p><strong>Classname:</strong> {{ selectedItem.classname }}</p>
                  <p v-if="!selectedItem.stock_unlimited">
                    <strong>Stock:</strong> 
                    <span :class="selectedItem.stock_quantity < 10 ? 'text-red-400' : 'text-green-400'">
                      {{ selectedItem.stock_quantity }} available
                    </span>
                  </p>
                  <p v-else><strong>Stock:</strong> <span class="text-green-400">Unlimited</span></p>
                </div>
              </div>
            </div>
            
            <!-- What You Get Section -->
            <div class="bg-gray-700 rounded-lg p-4 mb-6">
              <h5 class="text-lg font-semibold text-white mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                What You Get
              </h5>
              
              <!-- Main Item -->
              <div class="mb-4">
                <div class="flex items-center space-x-3 p-3 bg-gray-600 rounded-lg">
                  <div class="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div class="flex-1">
                    <span class="text-white font-medium">{{ selectedItem.name }}</span>
                  </div>
                  <span class="text-sm text-gray-400">× 1</span>
                </div>
              </div>
              
              <!-- Attachments -->
              <div v-if="selectedItem.attachments && selectedItem.attachments.length > 0">
                <h6 class="text-white font-medium mb-3 flex items-center">
                  <svg class="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                  Included Attachments ({{ selectedItem.attachments.length }})
                </h6>
                
                <div class="space-y-2">
                  <div
                    v-for="(attachment, index) in selectedItem.attachments"
                    :key="index"
                    class="flex items-center space-x-3 p-3 bg-gray-600 rounded-lg"
                  >
                    <div class="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <div class="flex-1">
                      <span class="text-white">{{ attachment.name || attachment.classname }}</span>
                    </div>
                    <span class="text-sm text-gray-400">× {{ attachment.quantity || 1 }}</span>
                  </div>
                  
                  <!-- Nested Attachments -->
                  <template v-for="(attachment, index) in selectedItem.attachments" :key="`nested-${index}`">
                    <div v-if="attachment.attachments && attachment.attachments.length > 0" class="ml-6 space-y-2">
                      <div
                        v-for="(nested, nestedIndex) in attachment.attachments"
                        :key="nestedIndex"
                        class="flex items-center space-x-3 p-2 bg-gray-500 rounded-lg"
                      >
                        <div class="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <div class="flex-1">
                          <span class="text-white text-sm">{{ nested.name || nested.classname }}</span>
                        </div>
                        <span class="text-xs text-gray-400">× {{ nested.quantity || 1 }}</span>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
              
              <!-- No Attachments -->
              <div v-else class="text-center py-4">
                <svg class="w-12 h-12 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5"/>
                </svg>
                <p class="text-gray-400 text-sm">This item comes as a single piece with no additional attachments.</p>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex space-x-3">
              <button
                @click="purchaseItem(selectedItem)"
                :disabled="!user || (user && user.points < selectedItem.price) || (!selectedItem.stock_unlimited && selectedItem.stock_quantity === 0)"
                class="flex-1 py-3 rounded-lg font-medium transition-all duration-200"
                :class="!user 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                  : (!selectedItem.stock_unlimited && selectedItem.stock_quantity === 0)
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : user.points < selectedItem.price 
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : 'dayz-button-primary hover:shadow-lg'"
              >
                <template v-if="!user">
                  Login to Purchase
                </template>
                <template v-else-if="!selectedItem.stock_unlimited && selectedItem.stock_quantity === 0">
                  Out of Stock
                </template>
                <template v-else-if="user.points < selectedItem.price">
                  Insufficient Points
                </template>
                <template v-else>
                  Purchase for {{ formatNumber(selectedItem.price) }} Points
                </template>
              </button>
              
              <button 
                @click="selectedItem = null" 
                class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Swal from 'sweetalert2'

// Meta
definePageMeta({
  title: 'Store',
  layout: 'default'
})

// State
const user = useState('auth.user')
const loading = ref(true)
const selectedCategory = ref('all')
const storeItems = ref([])
const categories = ref([])
const autoDeliveryStatus = ref(null)
const selectedItem = ref(null)

// Computed
const filteredItems = computed(() => {
  if (selectedCategory.value === 'all') {
    return storeItems.value
  }
  return storeItems.value.filter(item => item.category === selectedCategory.value)
})

// Methods
const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num)
}

const getCategoryName = (category) => {
  const categoryMap = {
    weapon: 'Weapon',
    item: 'Item',
    vehicle: 'Vehicle',
    money: 'Money'
  }
  return categoryMap[category] || 'Item'
}

const getCategoryBadgeClass = (category) => {
  const classMap = {
    weapon: 'bg-red-600 text-white',
    item: 'bg-blue-600 text-white',
    vehicle: 'bg-purple-600 text-white',
    money: 'bg-green-600 text-white'
  }
  return classMap[category] || 'bg-gray-600 text-white'
}

const getCategoryIconPath = (category) => {
  const paths = {
    all: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    weapon: 'M13 10V3L4 14h7v7l9-11h-7z',
    item: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    vehicle: 'M5 13l4 4L19 7',
    money: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }
  return paths[category] || paths.all
}

const handleImageError = (event) => {
  event.target.src = '/placeholder-item.jpg'
}

const showItemDetails = (item) => {
  selectedItem.value = item
}

// Load auto delivery status
const loadAutoDeliveryStatus = async () => {
  if (!user.value) return
  
  try {
    const response = await $fetch('/api/store/settings')
    autoDeliveryStatus.value = response.autoDeliveryEnabled || false
    console.log('🔍 Auto delivery status:', autoDeliveryStatus.value)
  } catch (error) {
    console.error('Failed to load auto delivery status:', error)
    autoDeliveryStatus.value = false
  }
}

// Load store items from database
const loadStoreItems = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/store/items')
    
    if (response.success) {
      storeItems.value = response.items
      
      // Transform categories for display
      categories.value = response.categories.map(cat => ({
        name: cat.name,
        value: cat.value,
        count: cat.count
      }))
    }
  } catch (error) {
    console.error('Failed to load store items:', error)
  } finally {
    loading.value = false
  }
}

const purchaseItem = async (item) => {
  if (!user.value) {
    await Swal.fire({
      title: 'Login Required',
      text: 'Please login to make purchases',
      icon: 'warning',
      background: '#1f2937',
      color: '#fff',
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Go to Login'
    }).then((result) => {
      if (result.isConfirmed) {
        navigateTo('/login')
      }
    })
    return
  }
  
  if (user.value.points < item.price) {
    await Swal.fire({
      title: 'Insufficient Points',
      text: `You need ${formatNumber(item.price - user.value.points)} more points to purchase this item.`,
      icon: 'error',
      background: '#1f2937',
      color: '#fff',
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Top Up Points'
    }).then((result) => {
      if (result.isConfirmed) {
        showTopUpModal()
      }
    })
    return
  }
  
  // Show item details with attachments and delivery info
  let itemDetailsHtml = `
    <div class="text-left">
      <p class="mb-2">Item: <strong>${item.name}</strong></p>
      <p class="mb-2">Classname: <code class="bg-gray-700 px-1 rounded">${item.classname}</code></p>
      <p class="mb-2">Price: <strong>${formatNumber(item.price)} Points</strong></p>
  `
  
  // Show attachments if any
  if (item.attachments && item.attachments.length > 0) {
    itemDetailsHtml += '<p class="mb-2 mt-3">Includes:</p><ul class="ml-4 text-sm text-gray-400">'
    item.attachments.forEach(att => {
      itemDetailsHtml += `<li>• ${att.classname} x${att.quantity || 1}</li>`
      if (att.attachments && att.attachments.length > 0) {
        att.attachments.forEach(nested => {
          itemDetailsHtml += `<li class="ml-4">• ${nested.classname} x${nested.quantity || 1}</li>`
        })
      }
    })
    itemDetailsHtml += '</ul>'
  }
  
  // Show delivery information
  itemDetailsHtml += `
      <hr class="my-3 border-gray-600">
      <div class="bg-gray-700 p-3 rounded mb-3">
        <div class="flex items-center mb-2">
          ${autoDeliveryStatus.value 
            ? '<svg class="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>'
            : '<svg class="w-4 h-4 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>'
          }
          <span class="text-sm font-medium ${autoDeliveryStatus.value ? 'text-green-400' : 'text-yellow-400'}">
            ${autoDeliveryStatus.value ? 'Auto Delivery: Enabled' : 'Auto Delivery: Disabled'}
          </span>
        </div>
        <p class="text-xs text-gray-400">
          ${autoDeliveryStatus.value 
            ? 'Item will be automatically delivered to your character after purchase.'
            : 'You will need to manually deliver the item from your orders page after purchase.'
          }
        </p>
      </div>
      <p class="mb-2">Your Balance: <strong>${formatNumber(user.value.points)} Points</strong></p>
      <p class="text-sm text-gray-400">After purchase: <strong>${formatNumber(user.value.points - item.price)} Points</strong></p>
    </div>
  `
  
  const result = await Swal.fire({
    title: 'Confirm Purchase',
    html: itemDetailsHtml,
    icon: 'question',
    background: '#1f2937',
    color: '#fff',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Purchase',
    cancelButtonText: 'Cancel'
  })
  
  if (result.isConfirmed) {
    try {
      const response = await $fetch('/api/store/purchase', {
        method: 'POST',
        body: {
          itemId: item.id,
          quantity: 1
        }
      })
      
      if (response.success) {
        user.value.points = response.newBalance
        
        // Close item details modal if open
        selectedItem.value = null
        
        let successMessage = `✅ <strong>${item.name}</strong> has been purchased successfully!<br>`
        successMessage += `Purchase ID: <strong>#${response.purchaseId}</strong><br>`
        successMessage += `Remaining Points: <strong>${formatNumber(response.newBalance)}</strong><br><br>`
        
        if (response.delivery.autoDeliveryEnabled) {
          if (response.delivery.success) {
            successMessage += `<div class="bg-green-800 p-3 rounded mb-3">
              <strong>🚀 Auto Delivery Successful!</strong><br>
              ${response.delivery.message}<br>
              Check your inventory in the game!
            </div>`
          } else {
            successMessage += `<div class="bg-red-800 p-3 rounded mb-3">
              <strong>⚠️ Auto Delivery Failed</strong><br>
              ${response.delivery.message}<br>
              You can manually deliver from your <a href="/orders" class="text-blue-400 underline">orders page</a>.
            </div>`
          }
        } else {
          successMessage += `<div class="bg-yellow-800 p-3 rounded mb-3">
            <strong>📦 Manual Delivery Required</strong><br>
            ${response.delivery.message}<br>
            Visit your <a href="/orders" class="text-blue-400 underline">orders page</a> to deliver this item.
          </div>`
        }
        
        await Swal.fire({
          title: 'Purchase Successful!',
          html: successMessage,
          icon: 'success',
          background: '#1f2937',
          color: '#fff',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'Great!'
        })
        
        // Reload items to update stock
        await loadStoreItems()
      }
    } catch (error) {
      console.error('Purchase error:', error)
      
      let errorMessage = 'Purchase failed. Please try again.'
      if (error.data?.statusMessage) {
        errorMessage = error.data.statusMessage
      }
      
      await Swal.fire({
        title: 'Purchase Failed',
        text: errorMessage,
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
        confirmButtonColor: '#dc2626'
      })
    }
  }
}

const showTopUpModal = async () => {
  const { value: amount } = await Swal.fire({
    title: 'Top Up Points',
    html: `
      <div class="text-left space-y-4">
        <p class="text-gray-300">Select the amount you want to top up:</p>
        <div class="grid grid-cols-2 gap-2">
          <button class="topup-option bg-gray-700 hover:bg-gray-600 p-3 rounded text-white transition-all" data-amount="1000">
            <div class="text-lg font-bold">1,000</div>
            <div class="text-xs text-gray-400">Points</div>
            <div class="text-sm mt-1">฿50</div>
          </button>
          <button class="topup-option bg-gray-700 hover:bg-gray-600 p-3 rounded text-white transition-all" data-amount="2500">
            <div class="text-lg font-bold">2,500</div>
            <div class="text-xs text-gray-400">Points</div>
            <div class="text-sm mt-1">฿100</div>
          </button>
          <button class="topup-option bg-gray-700 hover:bg-gray-600 p-3 rounded text-white transition-all" data-amount="5000">
            <div class="text-lg font-bold">5,000</div>
            <div class="text-xs text-gray-400">Points</div>
            <div class="text-sm mt-1">฿200</div>
          </button>
          <button class="topup-option bg-gray-700 hover:bg-gray-600 p-3 rounded text-white transition-all" data-amount="10000">
            <div class="text-lg font-bold">10,000</div>
            <div class="text-xs text-gray-400">Points</div>
            <div class="text-sm mt-1 text-green-400">฿350</div>
            <div class="text-xs text-green-400">Save ฿50!</div>
          </button>
        </div>
        <div class="mt-4 p-3 bg-gray-700 rounded">
          <p class="text-sm text-gray-300">Selected: <span id="selected-amount" class="font-bold text-yellow-400">None</span></p>
          <p class="text-xs text-gray-400 mt-1">Payment methods: TrueMoney Wallet, PromptPay, Bank Transfer</p>
        </div>
      </div>
    `,
    background: '#1f2937',
    color: '#fff',
    showCancelButton: true,
    confirmButtonText: 'Continue to Payment',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    preConfirm: () => {
      const selected = document.querySelector('.topup-option.selected')
      return selected ? selected.dataset.amount : null
    },
    didOpen: () => {
      document.querySelectorAll('.topup-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.topup-option').forEach(b => {
            b.classList.remove('selected', 'bg-red-600', 'ring-2', 'ring-red-400')
          })
          btn.classList.add('selected', 'bg-red-600', 'ring-2', 'ring-red-400')
          document.getElementById('selected-amount').textContent = btn.dataset.amount + ' Points'
        })
      })
    }
  })
  
  if (amount) {
    await Swal.fire({
      title: 'Payment Integration',
      html: `
        <div class="text-left">
          <p class="mb-4">Amount: <strong>${formatNumber(amount)} Points</strong></p>
          <p class="text-sm text-gray-400">Payment gateway integration will be implemented here.</p>
          <p class="text-sm text-gray-400 mt-2">Available payment methods:</p>
          <ul class="text-sm text-gray-400 mt-1 ml-4">
            <li>• TrueMoney Wallet</li>
            <li>• PromptPay QR Code</li>
            <li>• Bank Transfer</li>
            <li>• Credit/Debit Card</li>
          </ul>
        </div>
      `,
      icon: 'info',
      background: '#1f2937',
      color: '#fff',
      confirmButtonColor: '#dc2626'
    })
  }
}

// Load store items and auto delivery status on mount
onMounted(async () => {
  await loadStoreItems()
  await loadAutoDeliveryStatus()
})

// Watch user changes to reload auto delivery status
watch(user, async (newUser) => {
  if (newUser) {
    await loadAutoDeliveryStatus()
  } else {
    autoDeliveryStatus.value = null
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.topup-option {
  transition: all 0.2s ease;
  cursor: pointer;
}

.topup-option:hover {
  transform: scale(1.02);
}

.topup-option.selected {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.loader {
  border: 3px solid #f3f3f3;
  border-radius: 50%;
  border-top: 3px solid #dc2626;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dayz-card {
  background: linear-gradient(to bottom, #1f2937, #111827);
  border: 1px solid #374151;
  border-radius: 0.5rem;
}

.dayz-button-primary {
  background: linear-gradient(to right, #dc2626, #b91c1c);
  color: white;
  font-weight: 500;
}

.dayz-button-primary:hover {
  background: linear-gradient(to right, #ef4444, #dc2626);
}
</style>