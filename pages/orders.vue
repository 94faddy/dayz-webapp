<template>
  <div class="min-h-screen py-8">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-4">My Orders</h1>
        <p class="text-gray-400">Track your purchases and delivery status</p>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="loader mr-4"></div>
        <span class="text-gray-400">Loading orders...</span>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="orders.length === 0" class="text-center py-20">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
        </svg>
        <h3 class="text-xl font-semibold text-white mb-2">No Orders Found</h3>
        <p class="text-gray-400 mb-6">You haven't made any purchases yet.</p>
        <NuxtLink to="/store" class="dayz-button-primary">
          Visit Store
        </NuxtLink>
      </div>
      
      <!-- Orders List -->
      <div v-else class="space-y-6">
        <div
          v-for="order in orders"
          :key="order.id"
          class="dayz-card p-6"
        >
          <!-- Order Header -->
          <div class="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
            <div class="mb-4 lg:mb-0">
              <h3 class="text-xl font-semibold text-white mb-2">
                Order {{ order.order_number }}
              </h3>
              <div class="flex flex-wrap gap-4 text-sm text-gray-400">
                <span>{{ formatDate(order.created_at) }}</span>
                <span>{{ formatNumber(order.total_amount) }} Points</span>
                <span>{{ order.items?.length || 0 }} Items</span>
              </div>
            </div>
            
            <div class="flex items-center space-x-4">
              <!-- Order Status -->
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    :class="getOrderStatusClass(order.status)">
                {{ getOrderStatusText(order.status) }}
              </span>
              
              <!-- Delivery Button -->
              <button
                v-if="order.status === 'paid' && hasPendingItems(order)"
                @click="deliverOrder(order)"
                :disabled="deliveringOrders.has(order.id)"
                class="dayz-button-primary text-sm px-4 py-2"
                :class="{ 'opacity-50 cursor-not-allowed': deliveringOrders.has(order.id) }"
              >
                <span v-if="deliveringOrders.has(order.id)" class="flex items-center">
                  <div class="loader-small mr-2"></div>
                  Delivering...
                </span>
                <span v-else>Deliver Items</span>
              </button>
            </div>
          </div>
          
          <!-- Order Items -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="item in order.items"
              :key="item.item_id"
              class="bg-gray-800 rounded-lg p-4 flex items-start space-x-4"
            >
              <!-- Item Image -->
              <div class="flex-shrink-0">
                <img
                  :src="item.image_url || '/placeholder-item.jpg'"
                  :alt="item.item_name"
                  class="w-16 h-16 object-cover rounded-lg"
                  @error="handleImageError"
                />
              </div>
              
              <!-- Item Details -->
              <div class="flex-1 min-w-0">
                <h4 class="text-white font-medium mb-1">{{ item.item_name }}</h4>
                <p class="text-xs text-gray-400 mb-2">{{ item.classname }}</p>
                
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-300">
                    Qty: {{ item.quantity }} × {{ formatNumber(item.unit_price) }}
                  </span>
                  
                  <!-- Delivery Status -->
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        :class="getDeliveryStatusClass(item.delivery_status)">
                    {{ getDeliveryStatusText(item.delivery_status) }}
                  </span>
                </div>
                
                <!-- Delivered Date -->
                <div v-if="item.delivered_at" class="text-xs text-green-400 mt-1">
                  Delivered: {{ formatDate(item.delivered_at, 'short') }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Order Summary -->
          <div class="mt-6 pt-4 border-t border-gray-700">
            <div class="flex justify-between items-center">
              <div class="text-sm text-gray-400">
                <span class="mr-6">
                  Status: {{ getDeliveryProgress(order) }}
                </span>
                <span v-if="order.completed_at">
                  Completed: {{ formatDate(order.completed_at, 'short') }}
                </span>
              </div>
              
              <div class="text-lg font-semibold text-white">
                Total: {{ formatNumber(order.total_amount) }} Points
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Pagination -->
      <div v-if="pagination && pagination.totalPages > 1" class="mt-8 flex justify-center">
        <nav class="flex items-center space-x-2">
          <button
            @click="changePage(pagination.page - 1)"
            :disabled="!pagination.hasPrev"
            class="px-3 py-2 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span class="px-4 py-2 text-gray-400">
            Page {{ pagination.page }} of {{ pagination.totalPages }}
          </span>
          
          <button
            @click="changePage(pagination.page + 1)"
            :disabled="!pagination.hasNext"
            class="px-3 py-2 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import Swal from 'sweetalert2'

// Meta
definePageMeta({
  title: 'Orders',
  layout: 'default'
})

// State
const user = useState('auth.user')
const loading = ref(true)
const orders = ref([])
const pagination = ref(null)
const currentPage = ref(1)
const deliveringOrders = ref(new Set())

// Methods
const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num)
}

const formatDate = (dateString, format = 'long') => {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getOrderStatusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-900 text-yellow-300',
    paid: 'bg-blue-900 text-blue-300',
    processing: 'bg-purple-900 text-purple-300',
    completed: 'bg-green-900 text-green-300',
    cancelled: 'bg-red-900 text-red-300',
    refunded: 'bg-gray-900 text-gray-300'
  }
  return classes[status] || 'bg-gray-900 text-gray-300'
}

const getOrderStatusText = (status) => {
  const texts = {
    pending: 'Pending Payment',
    paid: 'Paid',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
    refunded: 'Refunded'
  }
  return texts[status] || status
}

const getDeliveryStatusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-900 text-yellow-300',
    processing: 'bg-blue-900 text-blue-300',
    delivered: 'bg-green-900 text-green-300',
    failed: 'bg-red-900 text-red-300'
  }
  return classes[status] || 'bg-gray-900 text-gray-300'
}

const getDeliveryStatusText = (status) => {
  const texts = {
    pending: 'Pending',
    processing: 'Processing',
    delivered: 'Delivered',
    failed: 'Failed'
  }
  return texts[status] || status
}

const hasPendingItems = (order) => {
  return order.items?.some(item => item.delivery_status === 'pending' || item.delivery_status === 'failed')
}

const getDeliveryProgress = (order) => {
  if (!order.items || order.items.length === 0) return 'No items'
  
  const delivered = order.items.filter(item => item.delivery_status === 'delivered').length
  const total = order.items.length
  
  if (delivered === total) return 'All delivered'
  if (delivered === 0) return 'Pending delivery'
  
  return `${delivered}/${total} delivered`
}

const handleImageError = (event) => {
  event.target.src = '/placeholder-item.jpg'
}

const loadOrders = async (page = 1) => {
  try {
    loading.value = true
    
    const response = await $fetch('/api/orders', {
      query: {
        page,
        limit: 10
      }
    })
    
    if (response.success) {
      orders.value = response.orders
      pagination.value = response.pagination
      currentPage.value = page
    }
  } catch (error) {
    console.error('Failed to load orders:', error)
    
    if (error.statusCode === 401) {
      await navigateTo('/login?redirect=/orders')
    } else {
      await Swal.fire({
        title: 'Error',
        text: 'Failed to load orders. Please try again.',
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
        confirmButtonColor: '#dc2626'
      })
    }
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    loadOrders(page)
  }
}

const deliverOrder = async (order) => {
  const result = await Swal.fire({
    title: 'Deliver Items',
    html: `
      <div class="text-left">
        <p class="mb-4">Do you want to deliver the pending items in this order?</p>
        <div class="bg-gray-700 p-3 rounded">
          <p class="text-sm mb-2"><strong>Order:</strong> ${order.order_number}</p>
          <p class="text-sm mb-2"><strong>Pending items:</strong> ${order.items.filter(i => i.delivery_status === 'pending' || i.delivery_status === 'failed').length}</p>
          <p class="text-xs text-gray-400">Items will be delivered to your character in the game.</p>
        </div>
      </div>
    `,
    icon: 'question',
    background: '#1f2937',
    color: '#fff',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Deliver Now',
    cancelButtonText: 'Cancel'
  })
  
  if (result.isConfirmed) {
    try {
      deliveringOrders.value.add(order.id)
      
      const response = await $fetch('/api/orders/deliver', {
        method: 'POST',
        body: {
          orderId: order.id
        }
      })
      
      if (response.success) {
        await Swal.fire({
          title: 'Delivery Successful!',
          html: `
            <div class="text-left">
              <p class="mb-4">${response.message}</p>
              ${response.stats ? `
                <div class="bg-gray-700 p-3 rounded">
                  <p class="text-sm"><strong>Results:</strong></p>
                  <p class="text-sm">✅ Delivered: ${response.stats.delivered}</p>
                  ${response.stats.failed > 0 ? `<p class="text-sm">❌ Failed: ${response.stats.failed}</p>` : ''}
                </div>
              ` : ''}
              <p class="text-xs text-gray-400 mt-3">Check your inventory in the game!</p>
            </div>
          `,
          icon: 'success',
          background: '#1f2937',
          color: '#fff',
          confirmButtonColor: '#dc2626'
        })
        
        // Reload orders to show updated status
        await loadOrders(currentPage.value)
      }
    } catch (error) {
      console.error('Delivery error:', error)
      
      await Swal.fire({
        title: 'Delivery Failed',
        text: error.data?.statusMessage || 'Failed to deliver items. Please try again later.',
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
        confirmButtonColor: '#dc2626'
      })
    } finally {
      deliveringOrders.value.delete(order.id)
    }
  }
}

// Load orders on mount
onMounted(async () => {
  console.log('🔍 Orders page mounted, checking authentication...')
  
  const sessionLoaded = useState('auth.sessionLoaded')
  
  let attempts = 0
  while (!sessionLoaded.value && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  
  if (!user.value) {
    console.log('❌ No user found, redirecting to login')
    await navigateTo('/login?redirect=/orders')
    return
  }
  
  await loadOrders()
})
</script>

<style scoped>
.dayz-card {
  background: linear-gradient(to bottom, #1f2937, #111827);
  border: 1px solid #374151;
  border-radius: 0.5rem;
}

.dayz-button-primary {
  background: linear-gradient(to right, #dc2626, #b91c1c);
  color: white;
  font-weight: 500;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.dayz-button-primary:hover:not(:disabled) {
  background: linear-gradient(to right, #ef4444, #dc2626);
  transform: translateY(-1px);
}

.loader {
  border: 3px solid #f3f3f3;
  border-radius: 50%;
  border-top: 3px solid #dc2626;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

.loader-small {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #dc2626;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>