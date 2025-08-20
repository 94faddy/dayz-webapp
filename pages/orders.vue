<template>
  <div class="min-h-screen py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-4">My Orders</h1>
        <p class="text-gray-400">Track your purchases and delivery status</p>
      </div>
      
      <!-- Search & Filters -->
      <div class="bg-gray-800 rounded-lg p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Order Number Search -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Search Order</label>
            <input
              v-model="searchOrderNumber"
              @input="debounceSearch"
              type="text"
              placeholder="Order number (e.g., ORD-123...)"
              class="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>
          
          <!-- Date From -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">From Date</label>
            <input
              v-model="dateFrom"
              @change="loadOrders"
              type="date"
              class="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>
          
          <!-- Date To -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">To Date</label>
            <input
              v-model="dateTo"
              @change="loadOrders"
              type="date"
              class="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>
        
        <!-- Status Filter -->
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="status in statusFilters"
            :key="status.value"
            @click="selectedStatus = status.value; loadOrders()"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              selectedStatus === status.value 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            ]"
          >
            {{ status.label }}
          </button>
        </div>
        
        <!-- Clear Filters -->
        <div v-if="hasActiveFilters" class="mt-4 flex items-center justify-between">
          <span class="text-sm text-gray-400">
            {{ filteredOrdersCount }} of {{ totalOrders }} orders shown
          </span>
          <button
            @click="clearFilters"
            class="text-sm text-red-400 hover:text-red-300"
          >
            Clear all filters
          </button>
        </div>
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
        <p class="text-gray-400 mb-6">
          <span v-if="hasActiveFilters">No orders match your current filters.</span>
          <span v-else>You haven't made any purchases yet.</span>
        </p>
        <NuxtLink v-if="!hasActiveFilters" to="/store" class="dayz-button-primary">
          Visit Store
        </NuxtLink>
      </div>
      
      <!-- Orders Table -->
      <div v-else class="bg-gray-800 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-900">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Order</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Items</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Delivery</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-700">
                <!-- Order Info -->
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-white">{{ order.order_number }}</div>
                  <div class="text-xs text-gray-400">#{{ order.id }}</div>
                </td>
                
                <!-- Items Summary -->
                <td class="px-6 py-4">
                  <div class="text-sm text-white">{{ order.items?.length || 0 }} items</div>
                  <div class="text-xs text-gray-400">
                    <span v-if="getDeliveredCount(order) > 0" class="text-green-400">
                      {{ getDeliveredCount(order) }} delivered
                    </span>
                    <span v-if="getPendingCount(order) > 0" class="text-yellow-400 ml-2">
                      {{ getPendingCount(order) }} pending
                    </span>
                    <span v-if="getFailedCount(order) > 0" class="text-red-400 ml-2">
                      {{ getFailedCount(order) }} failed
                    </span>
                  </div>
                  <!-- Item Names Preview -->
                  <div class="text-xs text-gray-500 mt-1">
                    <span v-if="order.items && order.items.length > 0">
                      {{ order.items.slice(0, 2).map(item => item.item_name).join(', ') }}
                      <span v-if="order.items.length > 2">...</span>
                    </span>
                  </div>
                </td>
                
                <!-- Amount -->
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-white">{{ formatNumber(order.total_amount) }}</div>
                  <div class="text-xs text-gray-400">Points</div>
                </td>
                
                <!-- Status -->
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="getOrderStatusClass(order.status)">
                    {{ getOrderStatusText(order.status) }}
                  </span>
                </td>
                
                <!-- Delivery Progress -->
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="flex-1 bg-gray-700 rounded-full h-2 mr-2">
                      <div 
                        class="bg-green-500 h-2 rounded-full transition-all duration-300"
                        :style="{ width: getDeliveryProgress(order) + '%' }"
                      ></div>
                    </div>
                    <span class="text-xs text-gray-400 w-10">{{ Math.round(getDeliveryProgress(order)) }}%</span>
                  </div>
                  <div class="text-xs text-gray-400 mt-1">
                    {{ getOrderDeliveryStatusText(order) }}
                  </div>
                </td>
                
                <!-- Date -->
                <td class="px-6 py-4">
                  <div class="text-sm text-white">{{ formatDate(order.created_at, 'short') }}</div>
                  <div v-if="order.completed_at" class="text-xs text-green-400">
                    Completed: {{ formatDate(order.completed_at, 'short') }}
                  </div>
                </td>
                
                <!-- Actions -->
                <td class="px-6 py-4">
                  <div class="flex items-center space-x-2">
                    <!-- View Details -->
                    <button
                      @click="viewOrderDetails(order)"
                      class="text-blue-400 hover:text-blue-300 p-1"
                      title="View Details"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    </button>
                    
                    <!-- Deliver Button -->
                    <button
                      v-if="order.status === 'paid' && hasPendingItems(order)"
                      @click="deliverOrder(order)"
                      :disabled="deliveringOrders.has(order.id)"
                      class="text-green-400 hover:text-green-300 p-1"
                      :class="{ 'opacity-50 cursor-not-allowed': deliveringOrders.has(order.id) }"
                      :title="deliveringOrders.has(order.id) ? 'Delivering...' : 'Deliver Items'"
                    >
                      <svg v-if="deliveringOrders.has(order.id)" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Pagination -->
      <div v-if="pagination && pagination.totalPages > 1" class="mt-6 flex items-center justify-between">
        <div class="text-sm text-gray-400">
          Showing {{ ((pagination.page - 1) * pagination.limit) + 1 }} to {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of {{ pagination.total }} orders
        </div>
        
        <nav class="flex items-center space-x-2">
          <button
            @click="changePage(1)"
            :disabled="!pagination.hasPrev"
            class="px-3 py-2 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            First
          </button>
          
          <button
            @click="changePage(pagination.page - 1)"
            :disabled="!pagination.hasPrev"
            class="px-3 py-2 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <!-- Page Numbers -->
          <template v-for="page in getPageNumbers()" :key="page">
            <button
              v-if="page !== '...'"
              @click="changePage(page)"
              :class="[
                'px-3 py-2 rounded-md',
                page === pagination.page
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              ]"
            >
              {{ page }}
            </button>
            <span v-else class="px-3 py-2 text-gray-400">...</span>
          </template>
          
          <button
            @click="changePage(pagination.page + 1)"
            :disabled="!pagination.hasNext"
            class="px-3 py-2 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          
          <button
            @click="changePage(pagination.totalPages)"
            :disabled="!pagination.hasNext"
            class="px-3 py-2 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </nav>
      </div>
      
      <!-- Order Details Modal -->
      <div v-if="selectedOrder" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <!-- Modal Header -->
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-semibold text-white">Order Details</h3>
              <button @click="selectedOrder = null" class="text-gray-400 hover:text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <!-- Order Info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 class="text-lg font-medium text-white mb-4">Order Information</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-400">Order Number:</span>
                    <span class="text-white">{{ selectedOrder.order_number }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Status:</span>
                    <span :class="getOrderStatusClass(selectedOrder.status)" class="px-2 py-1 rounded text-xs">
                      {{ getOrderStatusText(selectedOrder.status) }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Total Amount:</span>
                    <span class="text-white">{{ formatNumber(selectedOrder.total_amount) }} Points</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Created:</span>
                    <span class="text-white">{{ formatDate(selectedOrder.created_at) }}</span>
                  </div>
                  <div v-if="selectedOrder.completed_at" class="flex justify-between">
                    <span class="text-gray-400">Completed:</span>
                    <span class="text-white">{{ formatDate(selectedOrder.completed_at) }}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 class="text-lg font-medium text-white mb-4">Delivery Status</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-400">Total Items:</span>
                    <span class="text-white">{{ selectedOrder.items?.length || 0 }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Delivered:</span>
                    <span class="text-green-400">{{ getDeliveredCount(selectedOrder) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Pending:</span>
                    <span class="text-yellow-400">{{ getPendingCount(selectedOrder) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Failed:</span>
                    <span class="text-red-400">{{ getFailedCount(selectedOrder) }}</span>
                  </div>
                  <div class="mt-4">
                    <div class="flex items-center mb-2">
                      <span class="text-gray-400 text-sm mr-3">Progress:</span>
                      <div class="flex-1 bg-gray-700 rounded-full h-2">
                        <div 
                          class="bg-green-500 h-2 rounded-full transition-all duration-300"
                          :style="{ width: getDeliveryProgress(selectedOrder) + '%' }"
                        ></div>
                      </div>
                      <span class="text-white text-sm ml-3">{{ Math.round(getDeliveryProgress(selectedOrder)) }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Order Items -->
            <div>
              <h4 class="text-lg font-medium text-white mb-4">Items ({{ selectedOrder.items?.length || 0 }})</h4>
              <div class="space-y-3">
                <div
                  v-for="item in selectedOrder.items"
                  :key="item.id"
                  class="flex items-center space-x-4 p-3 bg-gray-700 rounded-lg"
                >
                  <img
                    :src="item.image_url || '/placeholder-item.jpg'"
                    :alt="item.item_name"
                    class="w-12 h-12 object-cover rounded-lg"
                    @error="handleImageError"
                  />
                  
                  <div class="flex-1">
                    <h5 class="text-white font-medium">{{ item.item_name }}</h5>
                    <p class="text-xs text-gray-400">{{ item.classname }}</p>
                  </div>
                  
                  <div class="text-center">
                    <div class="text-sm text-gray-300">
                      Qty: {{ item.quantity }}
                    </div>
                    <div class="text-xs text-gray-400">
                      {{ formatNumber(item.unit_price) }} pts
                    </div>
                  </div>
                  
                  <div class="text-center">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          :class="getDeliveryStatusClass(item.delivery_status)">
                      {{ getItemDeliveryStatusText(item.delivery_status) }}
                    </span>
                    <div v-if="item.delivered_at" class="text-xs text-green-400 mt-1">
                      {{ formatDate(item.delivered_at, 'short') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="mt-6 flex justify-end space-x-3">
              <button
                v-if="selectedOrder.status === 'paid' && hasPendingItems(selectedOrder)"
                @click="deliverOrder(selectedOrder)"
                :disabled="deliveringOrders.has(selectedOrder.id)"
                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                <span v-if="deliveringOrders.has(selectedOrder.id)" class="flex items-center">
                  <div class="loader-small mr-2"></div>
                  Delivering...
                </span>
                <span v-else>Deliver Items</span>
              </button>
              
              <button @click="selectedOrder = null" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg">
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
const selectedOrder = ref(null)

// Search & Filter state
const searchOrderNumber = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const selectedStatus = ref('')

// Computed
const statusFilters = computed(() => [
  { label: 'All Orders', value: '' },
  { label: 'Pending Payment', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
])

const hasActiveFilters = computed(() => {
  return searchOrderNumber.value || dateFrom.value || dateTo.value || selectedStatus.value
})

const filteredOrdersCount = computed(() => orders.value.length)
const totalOrders = computed(() => pagination.value?.total || 0)

// Search debounce
let searchTimeout = null

const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadOrders(1)
  }, 500)
}

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

const getItemDeliveryStatusText = (status) => {
  const texts = {
    pending: 'Pending',
    processing: 'Processing',
    delivered: 'Delivered',
    failed: 'Failed'
  }
  return texts[status] || status
}

const getDeliveredCount = (order) => {
  return order.items?.filter(item => item.delivery_status === 'delivered').length || 0
}

const getPendingCount = (order) => {
  return order.items?.filter(item => item.delivery_status === 'pending').length || 0
}

const getFailedCount = (order) => {
  return order.items?.filter(item => item.delivery_status === 'failed').length || 0
}

const hasPendingItems = (order) => {
  return order.items?.some(item => item.delivery_status === 'pending' || item.delivery_status === 'failed')
}

const getDeliveryProgress = (order) => {
  if (!order.items || order.items.length === 0) return 0
  const delivered = getDeliveredCount(order)
  return (delivered / order.items.length) * 100
}

const getOrderDeliveryStatusText = (order) => {
  if (!order.items || order.items.length === 0) return 'No items'
  
  const delivered = getDeliveredCount(order)
  const pending = getPendingCount(order)
  const failed = getFailedCount(order)
  const total = order.items.length
  
  if (delivered === total) return 'All delivered'
  if (delivered === 0 && pending === total) return 'Pending delivery'
  if (failed > 0) return `${delivered}/${total} delivered, ${failed} failed`
  
  return `${delivered}/${total} delivered`
}

const handleImageError = (event) => {
  event.target.src = '/placeholder-item.jpg'
}

const clearFilters = () => {
  searchOrderNumber.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  selectedStatus.value = ''
  loadOrders(1)
}

const getPageNumbers = () => {
  if (!pagination.value) return []
  
  const current = pagination.value.page
  const total = pagination.value.totalPages
  const pages = []
  
  if (total <= 7) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Show first page
    pages.push(1)
    
    if (current <= 4) {
      // Near beginning
      for (let i = 2; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      // Near end
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // Middle
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
}

const loadOrders = async (page = 1) => {
  try {
    loading.value = true
    
    const query = {
      page,
      limit: 10
    }
    
    // Add filters
    if (searchOrderNumber.value) {
      query.orderNumber = searchOrderNumber.value
    }
    
    if (dateFrom.value) {
      query.dateFrom = dateFrom.value
    }
    
    if (dateTo.value) {
      query.dateTo = dateTo.value
    }
    
    if (selectedStatus.value) {
      query.status = selectedStatus.value
    }
    
    const response = await $fetch('/api/orders', { query })
    
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

const viewOrderDetails = (order) => {
  selectedOrder.value = order
}

const deliverOrder = async (order) => {
  const result = await Swal.fire({
    title: 'Deliver Items',
    html: `
      <div class="text-left">
        <p class="mb-4">Do you want to deliver the pending items in this order?</p>
        <div class="bg-gray-700 p-3 rounded">
          <p class="text-sm mb-2"><strong>Order:</strong> ${order.order_number}</p>
          <p class="text-sm mb-2"><strong>Pending items:</strong> ${getPendingCount(order) + getFailedCount(order)}</p>
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
        
        // Update selectedOrder if it's open
        if (selectedOrder.value && selectedOrder.value.id === order.id) {
          const updatedOrder = orders.value.find(o => o.id === order.id)
          if (updatedOrder) {
            selectedOrder.value = updatedOrder
          }
        }
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
  padding: 0.75rem 1.5rem;
  display: inline-block;
  text-decoration: none;
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

/* Table responsive improvements */
@media (max-width: 768px) {
  .overflow-x-auto {
    font-size: 0.875rem;
  }
  
  .px-6 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .py-4 {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }
}
</style>