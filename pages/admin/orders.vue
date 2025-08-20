<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white mb-4">Orders Management</h1>
      
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-gray-800 rounded-lg p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-400">Total Orders</p>
              <p class="text-2xl font-semibold text-white">{{ stats?.total_orders || 0 }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-400">Total Revenue</p>
              <p class="text-2xl font-semibold text-white">{{ formatNumber(stats?.total_revenue || 0) }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-400">Pending Orders</p>
              <p class="text-2xl font-semibold text-white">{{ stats?.paid_orders || 0 }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-400">Completed</p>
              <p class="text-2xl font-semibold text-white">{{ stats?.completed_orders || 0 }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Filters & Actions -->
    <div class="bg-gray-800 rounded-lg p-6 mb-6">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <!-- Status Filter -->
          <select v-model="selectedStatus" @change="filterOrders" class="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600">
            <option value="">All Statuses</option>
            <option value="pending">Pending Payment</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          
          <!-- User Search -->
          <input
            v-model="searchUser"
            @input="debounceSearch"
            type="text"
            placeholder="Search by user name or email..."
            class="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 w-64"
          />
        </div>
        
        <div class="flex space-x-2">
          <button @click="loadOrders" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
          
          <button @click="showHistoryModal" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Delivery History
          </button>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="loader mr-4"></div>
      <span class="text-gray-400">Loading orders...</span>
    </div>
    
    <!-- Orders Table -->
    <div v-else class="bg-gray-800 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-900">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Order</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Customer</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Items</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Delivery</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-gray-800 divide-y divide-gray-700">
            <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-gray-700">
              <!-- Order Info -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-white">{{ order.order_number }}</div>
                <div class="text-sm text-gray-400">#{{ order.id }}</div>
              </td>
              
              <!-- Customer -->
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-white">{{ order.user_name }}</div>
                <div class="text-sm text-gray-400">{{ order.user_email }}</div>
                <div class="text-xs text-gray-500">{{ order.steamid64 }}</div>
              </td>
              
              <!-- Items -->
              <td class="px-6 py-4">
                <div class="text-sm text-white">{{ order.total_items }} items</div>
                <div class="text-xs text-gray-400">
                  <span v-if="order.delivered_items > 0" class="text-green-400">{{ order.delivered_items }} delivered</span>
                  <span v-if="order.pending_items > 0" class="text-yellow-400 ml-2">{{ order.pending_items }} pending</span>
                  <span v-if="order.failed_items > 0" class="text-red-400 ml-2">{{ order.failed_items }} failed</span>
                </div>
              </td>
              
              <!-- Amount -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-white">{{ formatNumber(order.total_amount) }}</div>
                <div class="text-xs text-gray-400">Points</div>
              </td>
              
              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <select
                  :value="order.status"
                  @change="updateOrderStatus(order, $event.target.value)"
                  class="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
                  :class="getOrderStatusClass(order.status)"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
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
                  <span class="text-xs text-gray-400">{{ Math.round(getDeliveryProgress(order)) }}%</span>
                </div>
              </td>
              
              <!-- Date -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {{ formatDate(order.created_at, 'short') }}
              </td>
              
              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex space-x-2">
                  <button
                    @click="viewOrderDetails(order)"
                    class="text-blue-400 hover:text-blue-300"
                    title="View Details"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </button>
                  
                  <button
                    v-if="order.pending_items > 0 || order.failed_items > 0"
                    @click="retryDelivery(order)"
                    class="text-green-400 hover:text-green-300"
                    title="Retry Delivery"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  </button>
                  
                  <button
                    v-if="order.status !== 'cancelled' && order.status !== 'refunded'"
                    @click="cancelOrder(order)"
                    class="text-red-400 hover:text-red-300"
                    title="Cancel Order"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="!loading && filteredOrders.length === 0" class="text-center py-20">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
      </svg>
      <h3 class="text-lg font-medium text-white mb-2">No Orders Found</h3>
      <p class="text-gray-400">No orders match your current filters.</p>
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
              <h4 class="text-lg font-medium text-white mb-4">Customer Information</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Name:</span>
                  <span class="text-white">{{ selectedOrder.user_name }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Email:</span>
                  <span class="text-white">{{ selectedOrder.user_email }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Steam ID:</span>
                  <span class="text-white font-mono text-xs">{{ selectedOrder.steamid64 }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Order Items -->
          <div>
            <h4 class="text-lg font-medium text-white mb-4">Items ({{ selectedOrder.items?.length || 0 }})</h4>
            <div class="space-y-4">
              <div
                v-for="item in selectedOrder.items"
                :key="item.id"
                class="bg-gray-700 rounded-lg p-4 flex items-start space-x-4"
              >
                <img
                  :src="item.image_url || '/placeholder-item.jpg'"
                  :alt="item.item_name"
                  class="w-16 h-16 object-cover rounded-lg"
                  @error="handleImageError"
                />
                
                <div class="flex-1">
                  <h5 class="text-white font-medium mb-1">{{ item.item_name }}</h5>
                  <p class="text-sm text-gray-400 mb-2">{{ item.classname }}</p>
                  
                  <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-300">
                      Qty: {{ item.quantity }} × {{ formatNumber(item.unit_price) }} = {{ formatNumber(item.total_price) }} Points
                    </div>
                    
                    <div class="flex items-center space-x-2">
                      <span :class="getDeliveryStatusClass(item.delivery_status)" class="px-2 py-1 rounded text-xs">
                        {{ getDeliveryStatusText(item.delivery_status) }}
                      </span>
                      
                      <span v-if="item.delivery_attempts > 0" class="text-xs text-gray-400">
                        ({{ item.delivery_attempts }} attempts)
                      </span>
                    </div>
                  </div>
                  
                  <div v-if="item.delivered_at" class="text-xs text-green-400 mt-1">
                    Delivered: {{ formatDate(item.delivered_at) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="mt-6 flex justify-end space-x-3">
            <button
              v-if="selectedOrder.pending_items > 0 || selectedOrder.failed_items > 0"
              @click="retryDelivery(selectedOrder)"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Retry Delivery
            </button>
            
            <button @click="selectedOrder = null" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- History Modal -->
    <div v-if="showHistory" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-white">Delivery History</h3>
            <button @click="showHistory = false" class="text-gray-400 hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <!-- History Search & Filters -->
          <div class="mb-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Player Search -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Search Player</label>
                <input
                  v-model="historySearch.player"
                  @input="debounceHistorySearch"
                  type="text"
                  placeholder="Steam ID or Player Name..."
                  class="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
                />
              </div>
              
              <!-- Status Filter -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select 
                  v-model="historySearch.status" 
                  @change="loadHistory"
                  class="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="delivered">Delivered</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              <!-- Date Range -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
                <select 
                  v-model="historySearch.dateRange" 
                  @change="loadHistory"
                  class="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
            
            <!-- Search Results Info -->
            <div v-if="historySearch.player || historySearch.status || historySearch.dateRange" class="flex items-center justify-between bg-gray-700 rounded-lg p-3">
              <div class="text-sm text-gray-300">
                <span v-if="!loadingHistory">
                  Found {{ history.length }} result(s)
                  <span v-if="historySearch.player" class="ml-2">
                    for "<strong class="text-white">{{ historySearch.player }}</strong>"
                  </span>
                </span>
                <span v-else class="flex items-center">
                  <div class="loader-small mr-2"></div>
                  Searching...
                </span>
              </div>
              
              <button 
                @click="clearHistorySearch" 
                class="text-gray-400 hover:text-white text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          <!-- History Content -->
          <div v-if="loadingHistory" class="flex justify-center py-8">
            <div class="loader mr-4"></div>
            <span class="text-gray-400">Loading history...</span>
          </div>
          
          <div v-else-if="history.length === 0" class="text-center py-8">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h4 class="text-lg font-medium text-white mb-2">No Records Found</h4>
            <p class="text-gray-400">
              <span v-if="historySearch.player || historySearch.status || historySearch.dateRange">
                No delivery history matches your search criteria.
              </span>
              <span v-else>
                No delivery history available.
              </span>
            </p>
          </div>
          
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-900">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Player</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Item</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Order</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-700">
                <tr v-for="record in history" :key="record.id" class="hover:bg-gray-700">
                  <td class="px-4 py-3">
                    <div class="text-sm text-white">{{ record.playerName || 'Unknown' }}</div>
                    <div class="text-xs text-gray-400 font-mono">{{ record.steamId }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="text-sm text-white">{{ record.item?.classname || 'Unknown Item' }}</div>
                    <div class="text-xs text-gray-400">Qty: {{ record.item?.quantity || 1 }}</div>
                    <div v-if="record.item?.attachments && record.item.attachments.length > 0" class="text-xs text-blue-400">
                      +{{ record.item.attachments.length }} attachments
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span :class="getDeliveryStatusClass(record.status)" class="px-2 py-1 rounded text-xs">
                      {{ getDeliveryStatusText(record.status) }}
                    </span>
                    <div v-if="record.attempts > 1" class="text-xs text-gray-400 mt-1">
                      {{ record.attempts }} attempts
                    </div>
                    <div v-if="record.error" class="text-xs text-red-400 mt-1" :title="record.error">
                      {{ record.error.length > 30 ? record.error.substring(0, 30) + '...' : record.error }}
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-400">
                    <div v-if="record.deliveredAt">
                      {{ formatDate(record.deliveredAt, 'short') }}
                    </div>
                    <div v-else-if="record.failedAt">
                      {{ formatDate(record.failedAt, 'short') }}
                    </div>
                    <div v-else>
                      {{ formatDate(record.queuedAt, 'short') }}
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-400">
                    {{ record.orderId || 'N/A' }}
                  </td>
                </tr>
              </tbody>
            </table>
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
  layout: 'admin'
})

// State
const loading = ref(true)
const loadingHistory = ref(false)
const orders = ref([])
const stats = ref(null)
const selectedOrder = ref(null)
const showHistory = ref(false)
const history = ref([])

// Filters
const selectedStatus = ref('')
const searchUser = ref('')
const filteredOrders = ref([])

// History Search
const historySearch = ref({
  player: '',
  status: '',
  dateRange: ''
})

// Search debounce
let searchTimeout = null
let historySearchTimeout = null

const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filterOrders()
  }, 300)
}

const debounceHistorySearch = () => {
  clearTimeout(historySearchTimeout)
  historySearchTimeout = setTimeout(() => {
    loadHistory()
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
    pending: 'Pending',
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

const getDeliveryProgress = (order) => {
  if (!order.total_items || order.total_items === 0) return 0
  return (order.delivered_items / order.total_items) * 100
}

const handleImageError = (event) => {
  event.target.src = '/placeholder-item.jpg'
}

const filterOrders = () => {
  let filtered = [...orders.value]
  
  // Filter by status
  if (selectedStatus.value) {
    filtered = filtered.filter(order => order.status === selectedStatus.value)
  }
  
  // Filter by user search
  if (searchUser.value.trim()) {
    const search = searchUser.value.toLowerCase()
    filtered = filtered.filter(order => 
      order.user_name.toLowerCase().includes(search) ||
      order.user_email.toLowerCase().includes(search) ||
      order.order_number.toLowerCase().includes(search)
    )
  }
  
  filteredOrders.value = filtered
}

const loadOrders = async () => {
  try {
    loading.value = true
    
    const response = await $fetch('/api/admin/orders')
    
    if (response.success) {
      orders.value = response.orders
      stats.value = response.stats
      filterOrders()
    }
  } catch (error) {
    console.error('Failed to load orders:', error)
    
    await Swal.fire({
      title: 'Error',
      text: 'Failed to load orders. Please try again.',
      icon: 'error',
      background: '#1f2937',
      color: '#fff',
      confirmButtonColor: '#dc2626'
    })
  } finally {
    loading.value = false
  }
}

const updateOrderStatus = async (order, newStatus) => {
  try {
    const response = await $fetch('/api/admin/orders', {
      method: 'PUT',
      body: {
        orderId: order.id,
        field: 'status',
        value: newStatus
      }
    })
    
    if (response.success) {
      order.status = newStatus
      
      await Swal.fire({
        title: 'Status Updated',
        text: `Order status changed to ${getOrderStatusText(newStatus)}`,
        icon: 'success',
        background: '#1f2937',
        color: '#fff',
        confirmButtonColor: '#dc2626',
        timer: 2000,
        showConfirmButton: false
      })
    }
  } catch (error) {
    console.error('Failed to update status:', error)
    
    await Swal.fire({
      title: 'Error',
      text: 'Failed to update order status.',
      icon: 'error',
      background: '#1f2937',
      color: '#fff',
      confirmButtonColor: '#dc2626'
    })
    
    // Reload to reset the status
    await loadOrders()
  }
}

const viewOrderDetails = (order) => {
  selectedOrder.value = order
}

const retryDelivery = async (order) => {
  const result = await Swal.fire({
    title: 'Retry Delivery',
    text: `Retry delivery for order ${order.order_number}?`,
    icon: 'question',
    background: '#1f2937',
    color: '#fff',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Retry',
    cancelButtonText: 'Cancel'
  })
  
  if (result.isConfirmed) {
    try {
      const response = await $fetch('/api/admin/orders', {
        method: 'POST',
        body: {
          action: 'retry_delivery',
          orderId: order.id
        }
      })
      
      if (response.success) {
        await Swal.fire({
          title: 'Delivery Retried',
          text: response.message,
          icon: 'success',
          background: '#1f2937',
          color: '#fff',
          confirmButtonColor: '#dc2626'
        })
        
        await loadOrders()
      }
    } catch (error) {
      console.error('Retry delivery error:', error)
      
      await Swal.fire({
        title: 'Retry Failed',
        text: error.data?.statusMessage || 'Failed to retry delivery.',
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
        confirmButtonColor: '#dc2626'
      })
    }
  }
}

const cancelOrder = async (order) => {
  const { value: formValues } = await Swal.fire({
    title: 'Cancel Order',
    html: `
      <div class="text-left">
        <p class="mb-4">Cancel order ${order.order_number}?</p>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Reason:</label>
          <textarea id="cancel-reason" class="w-full p-2 bg-gray-700 text-white rounded" rows="3" placeholder="Enter cancellation reason..."></textarea>
        </div>
        <div class="flex items-center">
          <input type="checkbox" id="refund-points" class="mr-2">
          <label for="refund-points" class="text-sm">Refund ${formatNumber(order.total_amount)} points to customer</label>
        </div>
      </div>
    `,
    background: '#1f2937',
    color: '#fff',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Cancel Order',
    preConfirm: () => {
      const reason = document.getElementById('cancel-reason').value
      const refundPoints = document.getElementById('refund-points').checked
      
      if (!reason.trim()) {
        Swal.showValidationMessage('Please provide a cancellation reason')
        return false
      }
      
      return { reason, refundPoints }
    }
  })
  
  if (formValues) {
    try {
      const response = await $fetch('/api/admin/orders', {
        method: 'POST',
        body: {
          action: 'cancel',
          orderId: order.id,
          data: formValues
        }
      })
      
      if (response.success) {
        await Swal.fire({
          title: 'Order Cancelled',
          text: response.message,
          icon: 'success',
          background: '#1f2937',
          color: '#fff',
          confirmButtonColor: '#dc2626'
        })
        
        await loadOrders()
      }
    } catch (error) {
      console.error('Cancel order error:', error)
      
      await Swal.fire({
        title: 'Cancellation Failed',
        text: error.data?.statusMessage || 'Failed to cancel order.',
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
        confirmButtonColor: '#dc2626'
      })
    }
  }
}

const showHistoryModal = async () => {
  showHistory.value = true
  await loadHistory()
}

const loadHistory = async () => {
  try {
    loadingHistory.value = true
    
    // Prepare query parameters
    const queryParams = {}
    
    // Add search filters
    if (historySearch.value.player) {
      // Check if it's a Steam ID (17 digits starting with 7656119) or player name
      if (/^7656119[0-9]{10}$/.test(historySearch.value.player)) {
        queryParams.steamId = historySearch.value.player
      } else {
        queryParams.playerName = historySearch.value.player
      }
    }
    
    if (historySearch.value.status) {
      queryParams.status = historySearch.value.status
    }
    
    if (historySearch.value.dateRange) {
      const now = new Date()
      let startDate = null
      
      switch (historySearch.value.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
      }
      
      if (startDate) {
        queryParams.startDate = startDate.toISOString()
      }
    }
    
    console.log('🔍 Loading history with params:', queryParams)
    
    const response = await $fetch('/api/admin/history', {
      query: queryParams
    })
    
    if (response.success) {
      history.value = response.history || []
      console.log(`✅ Loaded ${history.value.length} history records`)
    }
  } catch (error) {
    console.error('Failed to load history:', error)
    history.value = []
  } finally {
    loadingHistory.value = false
  }
}

const clearHistorySearch = () => {
  historySearch.value = {
    player: '',
    status: '',
    dateRange: ''
  }
  loadHistory()
}

// Watchers
watch([selectedStatus, searchUser], () => {
  filterOrders()
})

// Load data on mount
onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
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
</style>