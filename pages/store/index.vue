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
          <button 
            @click="showTopUpModal"
            class="ml-4 bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-full text-sm font-medium transition-colors"
          >
            Top Up
          </button>
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
          class="px-6 py-3 rounded-lg font-medium transition-all duration-200"
          :class="selectedCategory === category.value 
            ? 'bg-red-600 text-white' 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'"
        >
          <div class="flex items-center space-x-2">
            <component :is="category.icon" class="w-5 h-5" />
            <span>{{ category.name }}</span>
            <span class="bg-gray-700 text-xs px-2 py-1 rounded-full ml-2">
              {{ getItemCountByCategory(category.value) }}
            </span>
          </div>
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
              :src="item.image || '/placeholder-item.jpg'"
              :alt="item.name"
              class="w-full h-full object-cover"
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
          </div>
          
          <!-- Item Details -->
          <div class="p-6">
            <h3 class="text-lg font-semibold text-white mb-2">{{ item.name }}</h3>
            <p class="text-gray-400 text-sm mb-4 line-clamp-2">{{ item.description }}</p>
            
            <!-- Action Button -->
            <button
              @click="purchaseItem(item)"
              :disabled="!user || (user && user.points < item.price)"
              class="w-full py-3 rounded-lg font-medium transition-all duration-200"
              :class="!user 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : user.points < item.price 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                  : 'dayz-button-primary hover:shadow-lg'"
            >
              <template v-if="!user">
                Login to Purchase
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

// Categories
const categories = [
  { name: 'All Items', value: 'all', icon: 'IconGrid' },
  { name: 'Weapons', value: 'weapon', icon: 'IconSword' },
  { name: 'Items', value: 'item', icon: 'IconPackage' },
  { name: 'Vehicles', value: 'vehicle', icon: 'IconTruck' },
  { name: 'Money', value: 'money', icon: 'IconCoin' }
]

// Mock store items (replace with API call)
const storeItems = ref([
  {
    id: 1,
    name: 'AK-74 Assault Rifle',
    description: 'Powerful assault rifle with high damage and good range. Perfect for mid to long-range combat.',
    price: 15000,
    category: 'weapon',
    image: '/items/ak74.jpg',
    is_active: true
  },
  {
    id: 2,
    name: 'Medical Kit',
    description: 'Complete medical kit with bandages, morphine, and antibiotics. Essential for survival.',
    price: 5000,
    category: 'item',
    image: '/items/medkit.jpg',
    is_active: true
  },
  {
    id: 3,
    name: 'Offroad Hatchback',
    description: 'Reliable 4-wheel drive vehicle. Great for exploring the wasteland and carrying supplies.',
    price: 50000,
    category: 'vehicle',
    image: '/items/hatchback.jpg',
    is_active: true
  },
  {
    id: 4,
    name: '10,000 Rubles',
    description: 'In-game currency that can be used to purchase items from NPCs and traders.',
    price: 2000,
    category: 'money',
    image: '/items/rubles.jpg',
    is_active: true
  },
  {
    id: 5,
    name: 'Night Vision Goggles',
    description: 'See clearly in the dark. Essential equipment for night operations and exploration.',
    price: 12000,
    category: 'item',
    image: '/items/nvg.jpg',
    is_active: true
  },
  {
    id: 6,
    name: 'M4A1 Carbine',
    description: 'American-made assault rifle with excellent accuracy and customization options.',
    price: 18000,
    category: 'weapon',
    image: '/items/m4a1.jpg',
    is_active: true
  }
])

// Computed
const filteredItems = computed(() => {
  if (selectedCategory.value === 'all') {
    return storeItems.value.filter(item => item.is_active)
  }
  return storeItems.value.filter(item => item.category === selectedCategory.value && item.is_active)
})

// Methods
const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num)
}

const getItemCountByCategory = (category) => {
  if (category === 'all') {
    return storeItems.value.filter(item => item.is_active).length
  }
  return storeItems.value.filter(item => item.category === category && item.is_active).length
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

const handleImageError = (event) => {
  event.target.src = '/placeholder-item.jpg'
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
  
  const result = await Swal.fire({
    title: 'Confirm Purchase',
    html: `
      <div class="text-left">
        <p class="mb-2">Item: <strong>${item.name}</strong></p>
        <p class="mb-2">Price: <strong>${formatNumber(item.price)} Points</strong></p>
        <p class="mb-4">Your Balance: <strong>${formatNumber(user.value.points)} Points</strong></p>
        <p class="text-sm text-gray-400">After purchase: <strong>${formatNumber(user.value.points - item.price)} Points</strong></p>
      </div>
    `,
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
        
        await Swal.fire({
          title: 'Purchase Successful!',
          html: `
            <div class="text-left">
              <p class="mb-2">✅ <strong>${item.name}</strong> purchased successfully!</p>
              <p class="mb-2">Remaining Points: <strong>${formatNumber(response.newBalance)}</strong></p>
              <p class="text-sm text-gray-400">Item will be delivered to your character in-game.</p>
            </div>
          `,
          icon: 'success',
          background: '#1f2937',
          color: '#fff',
          confirmButtonColor: '#dc2626'
        })
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
          <button class="topup-option bg-gray-700 hover:bg-gray-600 p-3 rounded text-white" data-amount="1000">1,000 Points<br><small>$5.00</small></button>
          <button class="topup-option bg-gray-700 hover:bg-gray-600 p-3 rounded text-white" data-amount="2500">2,500 Points<br><small>$10.00</small></button>
          <button class="topup-option bg-gray-700 hover:bg-gray-600 p-3 rounded text-white" data-amount="5000">5,000 Points<br><small>$20.00</small></button>
          <button class="topup-option bg-gray-700 hover:bg-gray-600 p-3 rounded text-white" data-amount="10000">10,000 Points<br><small>$35.00</small></button>
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
          document.querySelectorAll('.topup-option').forEach(b => b.classList.remove('selected', 'bg-red-600'))
          e.target.classList.add('selected', 'bg-red-600')
        })
      })
    }
  })
  
  if (amount) {
    await Swal.fire({
      title: 'Payment Integration',
      text: 'Payment gateway integration would be implemented here (PayPal, Stripe, etc.)',
      icon: 'info',
      background: '#1f2937',
      color: '#fff',
      confirmButtonColor: '#dc2626'
    })
  }
}

// Load store items on mount
onMounted(async () => {
  try {
    // Replace with actual API call
    // const response = await $fetch('/api/store/items')
    // storeItems.value = response.items
    loading.value = false
  } catch (error) {
    console.error('Failed to load store items:', error)
    loading.value = false
  }
})

// Dynamic icon components (simplified for this example)
const IconGrid = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>' }
const IconSword = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>' }
const IconPackage = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>' }
const IconTruck = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>' }
const IconCoin = { template: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/></svg>' }
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
</style>