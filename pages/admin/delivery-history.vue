<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white mb-4">Delivery History</h1>
      
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
              <p class="text-sm font-medium text-gray-400">Total Deliveries</p>
              <p class="text-2xl font-semibold text-white">{{ stats?.total || 0 }}</p>
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
              <p class="text-sm font-medium text-gray-400">Delivered</p>
              <p class="text-2xl font-semibold text-white">{{ stats?.delivered || 0 }}</p>
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
              <p class="text-sm font-medium text-gray-400">Pending</p>
              <p class="text-2xl font-semibold text-white">{{ stats?.pending || 0 }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-400">Failed</p>
              <p class="text-2xl font-semibold text-white">{{ stats?.failed || 0 }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Search & Filters -->
    <div class="bg-gray-800 rounded-lg p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <!-- Player Search -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Search Player</label>
          <input
            v-model="searchParams.player"
            @input="debounceSearch"
            type="text"
            placeholder="Steam ID or Player Name..."
            class="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
          />
        </div>
        
        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select 
            v-model="searchParams.status" 
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
            v-model="searchParams.dateRange" 
            @change="loadHistory"
            class="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        
        <!-- Source Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Source</label>
          <select 
            v-model="searchParams.source" 
            @change="loadHistory"
            class="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
          >
            <option value="">All Sources</option>
            <option value="web_store">Web Store</option>
            <option value="api">Direct API</option>
            <option value="admin">Admin Panel</option>
          </select>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center justify-between">
        <div class="flex space-x-2">
          <button 
            @click="clearFilters" 
            v-if="hasActiveFilters"
            class="text-gray-400 hover:text-white text-sm"
          >
            Clear Filters
          </button>
          
          <div v-if="searchParams.player || searchParams.status || searchParams.dateRange" class="text-sm text-gray-300">
            <span v-if="!loading">
              Found {{ history.length }} result(s)
              <span v-if="searchParams.player" class="ml-2">
                for "<strong class="text-white">{{ searchParams.player }}</strong>"
              </span>
            </span>
            <span v-else class="flex items-center">
              <div class="loader-small mr-2"></div>
              Searching...
            </span>
          </div>
        </div>
        
        <div class="flex space-x-2">
          <button @click="loadHistory" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
          
          <button @click="showAddItemModal" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Add Item
          </button>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="loader mr-4"></div>
      <span class="text-gray-400">Loading delivery history...</span>
    </div>
    
    <!-- History Table -->
    <div v-else class="bg-gray-800 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-900">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Player</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Item</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Source</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
            <tr v-for="record in history" :key="record.id" class="hover:bg-gray-700">
              <!-- Player Info -->
              <td class="px-4 py-3">
                <div class="text-sm text-white">{{ record.playerName || 'Unknown' }}</div>
                <div class="text-xs text-gray-400 font-mono">{{ record.steamId }}</div>
                <button 
                  @click="viewPlayerQueue(record.steamId)"
                  class="text-xs text-blue-400 hover:text-blue-300 mt-1"
                >
                  View Queue
                </button>
              </td>
              
              <!-- Item Info -->
              <td class="px-4 py-3">
                <div class="text-sm text-white">{{ record.item?.classname || 'Unknown Item' }}</div>
                <div class="text-xs text-gray-400">Qty: {{ record.item?.quantity || 1 }}</div>
                <div v-if="record.item?.attachments && record.item.attachments.length > 0" class="text-xs text-blue-400">
                  +{{ record.item.attachments.length }} attachments
                </div>
                <button 
                  @click="viewItemDetails(record)"
                  class="text-xs text-purple-400 hover:text-purple-300 mt-1"
                >
                  View JSON
                </button>
              </td>
              
              <!-- Status -->
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
              
              <!-- Date -->
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
              
              <!-- Source -->
              <td class="px-4 py-3">
                <span class="text-xs px-2 py-1 rounded" :class="getSourceClass(record.source)">
                  {{ getSourceText(record.source) }}
                </span>
                <div v-if="record.orderId && record.orderId !== 'N/A'" class="text-xs text-gray-400 mt-1">
                  Order: {{ record.orderId }}
                </div>
              </td>
              
              <!-- Actions -->
              <td class="px-4 py-3">
                <div class="flex space-x-2">
                  <button
                    @click="viewDetails(record)"
                    class="text-blue-400 hover:text-blue-300"
                    title="View Details"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </button>
                  
                  <button
                    v-if="record.status === 'failed' || record.status === 'pending'"
                    @click="retryDelivery(record)"
                    class="text-green-400 hover:text-green-300"
                    title="Retry Delivery"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  </button>
                  
                  <button
                    @click="deleteRecord(record)"
                    class="text-red-400 hover:text-red-300"
                    title="Delete Record"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
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
    <div v-if="!loading && history.length === 0" class="text-center py-20">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <h3 class="text-lg font-medium text-white mb-2">No Records Found</h3>
      <p class="text-gray-400">
        <span v-if="hasActiveFilters">
          No delivery history matches your search criteria.
        </span>
        <span v-else>
          No delivery history available.
        </span>
      </p>
    </div>
    
    <!-- Player Queue Modal -->
    <div v-if="showPlayerQueueModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-white">Player Queue: {{ selectedPlayer?.name }}</h3>
            <button @click="showPlayerQueueModal = false" class="text-gray-400 hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <!-- Player Info -->
          <div class="bg-gray-700 rounded-lg p-4 mb-6">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-400">Steam ID:</span>
                <span class="text-white font-mono ml-2">{{ selectedPlayer?.steamId }}</span>
              </div>
              <div>
                <span class="text-gray-400">Queue Items:</span>
                <span class="text-white ml-2">{{ playerQueue?.length || 0 }}</span>
              </div>
            </div>
          </div>
          
          <!-- Queue Items -->
          <div class="space-y-4 mb-6">
            <h4 class="text-lg font-medium text-white">Queue Items</h4>
            
            <div v-if="loadingPlayerQueue" class="flex justify-center py-8">
              <div class="loader mr-4"></div>
              <span class="text-gray-400">Loading player queue...</span>
            </div>
            
            <div v-else-if="playerQueue?.length === 0" class="text-center py-8">
              <p class="text-gray-400">No items in queue</p>
            </div>
            
            <div v-else class="space-y-2">
              <div
                v-for="(item, index) in playerQueue"
                :key="index"
                class="bg-gray-700 rounded-lg p-3 flex items-center justify-between"
              >
                <div class="flex-1">
                  <div class="text-white font-medium">{{ item.classname }}</div>
                  <div class="text-sm text-gray-400">Quantity: {{ item.quantity }}</div>
                  <div v-if="item.attachments && item.attachments.length > 0" class="text-xs text-blue-400">
                    +{{ item.attachments.length }} attachments
                  </div>
                </div>
                
                <div class="flex space-x-2">
                  <button
                    @click="viewQueueItemJson(item, index)"
                    class="text-purple-400 hover:text-purple-300"
                    title="View JSON"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                    </svg>
                  </button>
                  
                  <button
                    @click="editQueueItem(index, item)"
                    class="text-blue-400 hover:text-blue-300"
                    title="Edit Item"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  
                  <button
                    @click="removeQueueItem(index)"
                    class="text-red-400 hover:text-red-300"
                    title="Remove Item"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex justify-between">
            <button
              @click="addItemToQueue"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Add Item to Queue
            </button>
            
            <div class="space-x-3">
              <button
                v-if="playerQueue?.length > 0"
                @click="clearPlayerQueue"
                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Clear Queue
              </button>
              
              <button @click="showPlayerQueueModal = false" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Enhanced Add/Edit Item Modal -->
    <div v-if="showItemModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-800 rounded-lg max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-white">
              {{ editingItemIndex !== null ? 'Edit' : 'Add' }} Item
            </h3>
            <button @click="closeItemModal" class="text-gray-400 hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <!-- Item Form -->
          <form @submit.prevent="saveItem" class="space-y-6">
            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Steam ID (only for new items) -->
              <div v-if="editingItemIndex === null">
                <label class="block text-sm font-medium text-gray-300 mb-2">Steam ID *</label>
                <input
                  v-model="itemForm.steamId"
                  type="text"
                  required
                  placeholder="Steam ID of the player"
                  class="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
                />
              </div>
              
              <!-- Classname with Enhanced Search -->
              <div :class="editingItemIndex !== null ? 'md:col-span-1' : 'md:col-span-1'">
                <label class="block text-sm font-medium text-gray-300 mb-2">Main Classname *</label>
                <div class="relative">
                  <input
                    v-model="itemForm.classname"
                    @input="searchMainClassname"
                    @focus="showMainClassnameDropdown = true"
                    @blur="hideMainClassnameDropdown"
                    type="text"
                    required
                    placeholder="Type to search classname..."
                    class="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
                  />
                  <!-- Main Classname Search Results -->
                  <div v-if="showMainClassnameDropdown && mainClassnameResults.length > 0" 
                       class="absolute z-10 w-full mt-1 bg-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                    <button
                      v-for="result in mainClassnameResults"
                      :key="result"
                      @mousedown="selectMainClassname(result)"
                      type="button"
                      class="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-600"
                    >
                      {{ result }}
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Quantity -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Quantity *</label>
                <input
                  v-model.number="itemForm.quantity"
                  type="number"
                  min="1"
                  required
                  class="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>
            
            <!-- Enhanced Attachments Section -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <label class="text-sm font-medium text-gray-300">
                  Attachments (Nested Supported)
                </label>
                <div class="flex space-x-2">
                  <button
                    @click="addAttachment"
                    type="button"
                    class="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                  >
                    <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Attachment
                  </button>
                  <button
                    @click="toggleJsonView"
                    type="button"
                    class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                  >
                    <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                    </svg>
                    {{ showJsonEditor ? 'Visual Editor' : 'JSON Editor' }}
                  </button>
                </div>
              </div>
              
              <!-- JSON Editor -->
              <div v-if="showJsonEditor" class="mb-4">
                <textarea
                  v-model="itemForm.attachmentsJson"
                  rows="8"
                  placeholder='[{"classname": "ACOGOptic", "quantity": 1, "attachments": [{"classname": "Battery9V", "quantity": 1}]}]'
                  class="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none font-mono text-sm"
                  @input="validateJson"
                ></textarea>
                <div v-if="jsonError" class="text-red-400 text-xs mt-1">
                  {{ jsonError }}
                </div>
                <div class="text-xs text-gray-400 mt-2">
                  <strong>Format:</strong> [{"classname": "ACOGOptic", "quantity": 1, "attachments": [{"classname": "Battery9V", "quantity": 1}]}]
                </div>
              </div>
              
              <!-- Enhanced Visual Attachments Editor -->
              <div v-else>
                <div v-if="itemForm.attachments.length > 0" class="space-y-4">
                  <div v-for="(attachment, index) in itemForm.attachments" 
                       :key="index"
                       class="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div class="flex items-start space-x-3">
                      <div class="flex-1">
                        <!-- Main Attachment -->
                        <div class="flex items-center space-x-2 mb-3">
                          <div class="relative flex-1">
                            <input
                              v-model="attachment.classname"
                              @input="(e) => searchAttachmentClassname(e, index)"
                              @focus="attachmentDropdownIndex = index"
                              @blur="hideAttachmentDropdown"
                              type="text"
                              placeholder="Attachment classname"
                              class="w-full px-3 py-2 bg-gray-600 text-white rounded-lg text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                            />
                            <!-- Attachment Search Results -->
                            <div v-if="attachmentDropdownIndex === index && attachmentResults[index] && attachmentResults[index].length > 0" 
                                 class="absolute z-20 w-full mt-1 bg-gray-600 rounded-md shadow-lg max-h-40 overflow-auto">
                              <button
                                v-for="result in attachmentResults[index]"
                                :key="result"
                                @mousedown="selectAttachmentClassname(index, result)"
                                type="button"
                                class="w-full text-left px-3 py-2 text-xs text-white hover:bg-gray-500"
                              >
                                {{ result }}
                              </button>
                            </div>
                          </div>
                          <input
                            v-model.number="attachment.quantity"
                            type="number"
                            min="1"
                            placeholder="Qty"
                            class="w-20 px-2 py-2 bg-gray-600 text-white rounded-lg text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                          />
                          <button
                            @click="removeAttachment(index)"
                            type="button"
                            class="text-red-400 hover:text-red-300 p-1"
                            title="Remove attachment"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                        
                        <!-- Nested Attachments -->
                        <div v-if="attachment.attachments && attachment.attachments.length > 0" 
                             class="ml-6 pl-4 border-l-2 border-gray-500 space-y-2">
                          <div class="text-xs text-gray-400 mb-2">Nested Attachments:</div>
                          <div v-for="(nested, nIndex) in attachment.attachments" 
                               :key="nIndex"
                               class="flex items-center space-x-2">
                            <div class="relative flex-1">
                              <input
                                v-model="nested.classname"
                                @input="(e) => searchNestedAttachmentClassname(e, index, nIndex)"
                                @focus="nestedDropdownIndex = `${index}-${nIndex}`"
                                @blur="hideNestedDropdown"
                                type="text"
                                placeholder="Nested attachment classname"
                                class="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs border border-gray-500 focus:border-blue-500 focus:outline-none"
                              />
                              <!-- Nested Search Results -->
                              <div v-if="nestedDropdownIndex === `${index}-${nIndex}` && nestedResults[`${index}-${nIndex}`] && nestedResults[`${index}-${nIndex}`].length > 0" 
                                   class="absolute z-30 w-full mt-1 bg-gray-500 rounded-md shadow-lg max-h-32 overflow-auto">
                                <button
                                  v-for="result in nestedResults[`${index}-${nIndex}`]"
                                  :key="result"
                                  @mousedown="selectNestedClassname(index, nIndex, result)"
                                  type="button"
                                  class="w-full text-left px-2 py-1 text-xs text-white hover:bg-gray-400"
                                >
                                  {{ result }}
                                </button>
                              </div>
                            </div>
                            <input
                              v-model.number="nested.quantity"
                              type="number"
                              min="1"
                              placeholder="Qty"
                              class="w-16 px-1 py-1 bg-gray-600 text-white rounded text-xs border border-gray-500 focus:border-blue-500 focus:outline-none"
                            />
                            <button
                              @click="removeNestedAttachment(index, nIndex)"
                              type="button"
                              class="text-red-400 hover:text-red-300 p-1"
                              title="Remove nested attachment"
                            >
                              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <!-- Add Nested Button -->
                        <button
                          @click="addNestedAttachment(index)"
                          type="button"
                          class="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center"
                        >
                          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                          </svg>
                          Add nested attachment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- No Attachments Message -->
                <div v-else class="text-center py-8 text-gray-400 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600">
                  <svg class="w-12 h-12 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                  <p class="text-sm">No attachments added</p>
                  <p class="text-xs mt-1">Click "Add Attachment" to include weapon attachments, ammo, etc.</p>
                </div>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="flex justify-end space-x-3 pt-6 border-t border-gray-600">
              <button
                type="button"
                @click="closeItemModal"
                class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                :disabled="savingItem"
                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 transition-colors"
              >
                <svg v-if="savingItem" class="w-4 h-4 inline mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                <span v-if="savingItem">Saving...</span>
                <span v-else>{{ editingItemIndex !== null ? 'Update' : 'Add' }} Item</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- JSON Viewer Modal -->
    <div v-if="showJsonModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-white">
              {{ jsonModalTitle }}
            </h3>
            <button @click="showJsonModal = false" class="text-gray-400 hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <!-- JSON Content -->
          <div class="bg-gray-900 rounded-lg p-4">
            <pre class="text-green-400 text-sm font-mono whitespace-pre-wrap">{{ jsonContent }}</pre>
          </div>
          
          <!-- Copy Button -->
          <div class="flex justify-end mt-4">
            <button 
              @click="copyJsonToClipboard"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              Copy to Clipboard
            </button>
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
const history = ref([])
const stats = ref(null)

// Search & Filters
const searchParams = ref({
  player: '',
  status: '',
  dateRange: '',
  source: ''
})

// Player Queue Modal
const showPlayerQueueModal = ref(false)
const selectedPlayer = ref(null)
const playerQueue = ref([])
const loadingPlayerQueue = ref(false)

// Item Modal
const showItemModal = ref(false)
const editingItemIndex = ref(null)
const savingItem = ref(false)
const showJsonEditor = ref(false)
const jsonError = ref('')

// JSON Viewer Modal
const showJsonModal = ref(false)
const jsonModalTitle = ref('')
const jsonContent = ref('')

// Enhanced Classname Search States
const mainClassnameResults = ref([])
const showMainClassnameDropdown = ref(false)
const attachmentResults = ref({})
const attachmentDropdownIndex = ref(null)
const nestedResults = ref({})
const nestedDropdownIndex = ref(null)

// Search timeouts
let mainClassnameTimeout = null
let attachmentSearchTimeout = null
let nestedSearchTimeout = null

const itemForm = ref({
  steamId: '',
  classname: '',
  quantity: 1,
  attachments: [],
  attachmentsJson: ''
})

// Search debounce
let searchTimeout = null

const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadHistory()
  }, 500)
}

// Computed
const hasActiveFilters = computed(() => {
  return searchParams.value.player || 
         searchParams.value.status || 
         searchParams.value.dateRange || 
         searchParams.value.source
})

// Methods
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

const getSourceClass = (source) => {
  const classes = {
    web_store: 'bg-blue-900 text-blue-300',
    api: 'bg-purple-900 text-purple-300',
    admin: 'bg-green-900 text-green-300'
  }
  return classes[source] || 'bg-gray-900 text-gray-300'
}

const getSourceText = (source) => {
  const texts = {
    web_store: 'Web Store',
    api: 'API',
    admin: 'Admin'
  }
  return texts[source] || source || 'Unknown'
}

const clearFilters = () => {
  searchParams.value = {
    player: '',
    status: '',
    dateRange: '',
    source: ''
  }
  loadHistory()
}

const loadHistory = async () => {
  try {
    loading.value = true
    
    console.log('🔍 Loading history with params:', searchParams.value)
    
    const response = await $fetch('/api/admin/history', {
      query: searchParams.value
    })
    
    if (response.success) {
      history.value = response.history || []
      stats.value = response.stats || {}
      console.log(`✅ Loaded ${history.value.length} history records`)
    }
  } catch (error) {
    console.error('Failed to load history:', error)
    
    await Swal.fire({
      title: 'Error',
      text: 'Failed to load delivery history. Please try again.',
      icon: 'error',
      background: '#1f2937',
      color: '#fff',
      confirmButtonColor: '#dc2626'
    })
  } finally {
    loading.value = false
  }
}

const viewPlayerQueue = async (steamId) => {
  try {
    loadingPlayerQueue.value = true
    showPlayerQueueModal.value = true
    
    // Set selected player info
    const historyRecord = history.value.find(h => h.steamId === steamId)
    selectedPlayer.value = {
      steamId: steamId,
      name: historyRecord?.playerName || 'Unknown'
    }
    
    // Load player queue from API
    const response = await $fetch(`/api/admin/player-queue/${steamId}`)
    
    if (response.success) {
      playerQueue.value = response.queue || []
    }
  } catch (error) {
    console.error('Failed to load player queue:', error)
    playerQueue.value = []
  } finally {
    loadingPlayerQueue.value = false
  }
}

// Enhanced JSON Viewer Functions
const viewItemDetails = (record) => {
  jsonModalTitle.value = `Item Details: ${record.item?.classname || 'Unknown'}`
  jsonContent.value = JSON.stringify(record.item, null, 2)
  showJsonModal.value = true
}

const viewQueueItemJson = (item, index) => {
  jsonModalTitle.value = `Queue Item ${index + 1}: ${item.classname}`
  jsonContent.value = JSON.stringify(item, null, 2)
  showJsonModal.value = true
}

const copyJsonToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(jsonContent.value)
    await Swal.fire({
      title: 'Copied!',
      text: 'JSON content copied to clipboard',
      icon: 'success',
      background: '#1f2937',
      color: '#fff',
      confirmButtonColor: '#dc2626',
      timer: 2000,
      showConfirmButton: false
    })
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

const addItemToQueue = () => {
  if (!selectedPlayer.value) return
  
  itemForm.value = {
    steamId: selectedPlayer.value.steamId,
    classname: '',
    quantity: 1,
    attachments: [],
    attachmentsJson: ''
  }
  editingItemIndex.value = null
  showItemModal.value = true
  showJsonEditor.value = false
}

const editQueueItem = (index, item) => {
  itemForm.value = {
    steamId: selectedPlayer.value.steamId,
    classname: item.classname,
    quantity: item.quantity,
    attachments: item.attachments ? [...item.attachments] : [],
    attachmentsJson: item.attachments ? JSON.stringify(item.attachments, null, 2) : ''
  }
  editingItemIndex.value = index
  showItemModal.value = true
  showJsonEditor.value = false
}

const closeItemModal = () => {
  showItemModal.value = false
  editingItemIndex.value = null
  showJsonEditor.value = false
  jsonError.value = ''
  
  // Clear search results
  mainClassnameResults.value = []
  attachmentResults.value = {}
  nestedResults.value = {}
  
  // Reset form
  itemForm.value = {
    steamId: '',
    classname: '',
    quantity: 1,
    attachments: [],
    attachmentsJson: ''
  }
}

// Enhanced Classname Search Functions
const searchMainClassname = async () => {
  clearTimeout(mainClassnameTimeout)
  
  mainClassnameTimeout = setTimeout(async () => {
    if (itemForm.value.classname.length < 2) {
      mainClassnameResults.value = []
      return
    }
    
    try {
      const response = await $fetch('/api/admin/classname/search', {
        params: { q: itemForm.value.classname }
      })
      
      if (response.success && response.results) {
        mainClassnameResults.value = response.results
      }
    } catch (error) {
      console.error('Main classname search failed:', error)
      mainClassnameResults.value = []
    }
  }, 300)
}

const selectMainClassname = (classname) => {
  itemForm.value.classname = classname
  mainClassnameResults.value = []
  showMainClassnameDropdown.value = false
}

const hideMainClassnameDropdown = () => {
  setTimeout(() => {
    showMainClassnameDropdown.value = false
  }, 200)
}

// Attachment classname search
const searchAttachmentClassname = async (event, index) => {
  clearTimeout(attachmentSearchTimeout)
  
  attachmentSearchTimeout = setTimeout(async () => {
    const query = itemForm.value.attachments[index].classname
    if (query.length < 2) {
      attachmentResults.value[index] = []
      return
    }
    
    try {
      const response = await $fetch('/api/admin/classname/search', {
        params: { q: query }
      })
      
      if (response.success && response.results) {
        attachmentResults.value[index] = response.results
      }
    } catch (error) {
      console.error('Attachment classname search failed:', error)
      attachmentResults.value[index] = []
    }
  }, 300)
}

const selectAttachmentClassname = (index, classname) => {
  itemForm.value.attachments[index].classname = classname
  attachmentResults.value[index] = []
  attachmentDropdownIndex.value = null
}

const hideAttachmentDropdown = () => {
  setTimeout(() => {
    attachmentDropdownIndex.value = null
  }, 200)
}

// Nested attachment classname search
const searchNestedAttachmentClassname = async (event, parentIndex, nestedIndex) => {
  clearTimeout(nestedSearchTimeout)
  
  nestedSearchTimeout = setTimeout(async () => {
    const query = itemForm.value.attachments[parentIndex].attachments[nestedIndex].classname
    const key = `${parentIndex}-${nestedIndex}`
    
    if (query.length < 2) {
      nestedResults.value[key] = []
      return
    }
    
    try {
      const response = await $fetch('/api/admin/classname/search', {
        params: { q: query }
      })
      
      if (response.success && response.results) {
        nestedResults.value[key] = response.results
      }
    } catch (error) {
      console.error('Nested classname search failed:', error)
      nestedResults.value[key] = []
    }
  }, 300)
}

const selectNestedClassname = (parentIndex, nestedIndex, classname) => {
  itemForm.value.attachments[parentIndex].attachments[nestedIndex].classname = classname
  const key = `${parentIndex}-${nestedIndex}`
  nestedResults.value[key] = []
  nestedDropdownIndex.value = null
}

const hideNestedDropdown = () => {
  setTimeout(() => {
    nestedDropdownIndex.value = null
  }, 200)
}

// Enhanced Attachment management
const addAttachment = () => {
  itemForm.value.attachments.push({
    classname: '',
    quantity: 1,
    attachments: []
  })
  syncAttachmentsToJson()
}

const removeAttachment = (index) => {
  itemForm.value.attachments.splice(index, 1)
  // Clean up search results
  delete attachmentResults.value[index]
  syncAttachmentsToJson()
}

const addNestedAttachment = (parentIndex) => {
  if (!itemForm.value.attachments[parentIndex].attachments) {
    itemForm.value.attachments[parentIndex].attachments = []
  }
  itemForm.value.attachments[parentIndex].attachments.push({
    classname: '',
    quantity: 1
  })
  syncAttachmentsToJson()
}

const removeNestedAttachment = (parentIndex, nestedIndex) => {
  itemForm.value.attachments[parentIndex].attachments.splice(nestedIndex, 1)
  // Clean up search results
  const key = `${parentIndex}-${nestedIndex}`
  delete nestedResults.value[key]
  syncAttachmentsToJson()
}

// Enhanced JSON Editor functions
const toggleJsonView = () => {
  if (showJsonEditor.value) {
    // Switching from JSON to visual editor
    try {
      if (itemForm.value.attachmentsJson.trim()) {
        const parsed = JSON.parse(itemForm.value.attachmentsJson)
        if (Array.isArray(parsed)) {
          itemForm.value.attachments = parsed
        }
      } else {
        itemForm.value.attachments = []
      }
      jsonError.value = ''
    } catch (e) {
      jsonError.value = 'Invalid JSON format'
      return
    }
  } else {
    // Switching from visual to JSON editor
    syncAttachmentsToJson()
  }
  showJsonEditor.value = !showJsonEditor.value
}

const syncAttachmentsToJson = () => {
  if (itemForm.value.attachments.length > 0) {
    // Clean up empty attachments
    const validAttachments = itemForm.value.attachments
      .filter(a => a.classname)
      .map(a => ({
        classname: a.classname,
        quantity: a.quantity || 1,
        attachments: a.attachments ? a.attachments.filter(n => n.classname).map(n => ({
          classname: n.classname,
          quantity: n.quantity || 1
        })) : []
      }))
    
    itemForm.value.attachmentsJson = JSON.stringify(validAttachments, null, 2)
  } else {
    itemForm.value.attachmentsJson = ''
  }
}

const validateJson = () => {
  if (!itemForm.value.attachmentsJson.trim()) {
    jsonError.value = ''
    return
  }
  
  try {
    const parsed = JSON.parse(itemForm.value.attachmentsJson)
    if (!Array.isArray(parsed)) {
      jsonError.value = 'JSON must be an array'
      return
    }
    
    // Validate structure
    for (const item of parsed) {
      if (!item.classname || typeof item.classname !== 'string') {
        jsonError.value = 'Each item must have a classname string'
        return
      }
      if (item.quantity && typeof item.quantity !== 'number') {
        jsonError.value = 'Quantity must be a number'
        return
      }
      if (item.attachments && !Array.isArray(item.attachments)) {
        jsonError.value = 'Attachments must be an array'
        return
      }
    }
    
    jsonError.value = ''
  } catch (e) {
    jsonError.value = 'Invalid JSON format'
  }
}

const saveItem = async () => {
  try {
    savingItem.value = true
    
    // Prepare item data
    const itemData = {
      classname: itemForm.value.classname,
      quantity: itemForm.value.quantity
    }
    
    // Parse attachments if provided
    if (showJsonEditor.value && itemForm.value.attachmentsJson.trim()) {
      try {
        itemData.attachments = JSON.parse(itemForm.value.attachmentsJson)
      } catch (e) {
        throw new Error('Invalid JSON format for attachments')
      }
    } else if (!showJsonEditor.value && itemForm.value.attachments.length > 0) {
      // Use visual editor data
      const validAttachments = itemForm.value.attachments
        .filter(a => a.classname)
        .map(a => ({
          classname: a.classname,
          quantity: a.quantity || 1,
          attachments: a.attachments ? a.attachments.filter(n => n.classname).map(n => ({
            classname: n.classname,
            quantity: n.quantity || 1
          })) : []
        }))
      
      if (validAttachments.length > 0) {
        itemData.attachments = validAttachments
      }
    }
    
    if (editingItemIndex.value !== null) {
      // Update existing item
      const response = await $fetch('/api/admin/player-queue', {
        method: 'PUT',
        body: {
          steamId: itemForm.value.steamId,
          itemIndex: editingItemIndex.value,
          item: itemData
        }
      })
      
      if (response.success) {
        playerQueue.value[editingItemIndex.value] = itemData
        await Swal.fire({
          title: 'Success',
          text: 'Item updated successfully',
          icon: 'success',
          background: '#1f2937',
          color: '#fff',
          confirmButtonColor: '#dc2626',
          timer: 2000,
          showConfirmButton: false
        })
      }
    } else {
      // Add new item
      const response = await $fetch('/api/admin/player-queue', {
        method: 'POST',
        body: {
          steamId: itemForm.value.steamId,
          item: itemData
        }
      })
      
      if (response.success) {
        if (selectedPlayer.value && selectedPlayer.value.steamId === itemForm.value.steamId) {
          playerQueue.value.push(itemData)
        }
        
        await Swal.fire({
          title: 'Success',
          text: 'Item added successfully',
          icon: 'success',
          background: '#1f2937',
          color: '#fff',
          confirmButtonColor: '#dc2626',
          timer: 2000,
          showConfirmButton: false
        })
      }
    }
    
    closeItemModal()
  } catch (error) {
    console.error('Failed to save item:', error)
    
    await Swal.fire({
      title: 'Error',
      text: error.message || 'Failed to save item',
      icon: 'error',
      background: '#1f2937',
      color: '#fff',
      confirmButtonColor: '#dc2626'
    })
  } finally {
    savingItem.value = false
  }
}

const removeQueueItem = async (index) => {
  const result = await Swal.fire({
    title: 'Remove Item',
    text: 'Are you sure you want to remove this item from the queue?',
    icon: 'warning',
    background: '#1f2937',
    color: '#fff',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Remove',
    cancelButtonText: 'Cancel'
  })
  
  if (result.isConfirmed) {
    try {
      const response = await $fetch('/api/admin/player-queue', {
        method: 'DELETE',
        body: {
          steamId: selectedPlayer.value.steamId,
          itemIndex: index
        }
      })
      
      if (response.success) {
        playerQueue.value.splice(index, 1)
        
        await Swal.fire({
          title: 'Removed',
          text: 'Item removed successfully',
          icon: 'success',
          background: '#1f2937',
          color: '#fff',
          confirmButtonColor: '#dc2626',
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (error) {
      console.error('Failed to remove item:', error)
      
      await Swal.fire({
        title: 'Error',
        text: 'Failed to remove item',
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
        confirmButtonColor: '#dc2626'
      })
    }
  }
}

const clearPlayerQueue = async () => {
  const result = await Swal.fire({
    title: 'Clear Queue',
    text: 'Are you sure you want to clear all items from this player\'s queue?',
    icon: 'warning',
    background: '#1f2937',
    color: '#fff',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Clear All',
    cancelButtonText: 'Cancel'
  })
  
  if (result.isConfirmed) {
    try {
      const response = await $fetch('/api/admin/player-queue/clear', {
        method: 'POST',
        body: {
          steamId: selectedPlayer.value.steamId
        }
      })
      
      if (response.success) {
        playerQueue.value = []
        
        await Swal.fire({
          title: 'Cleared',
          text: 'Player queue cleared successfully',
          icon: 'success',
          background: '#1f2937',
          color: '#fff',
          confirmButtonColor: '#dc2626',
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (error) {
      console.error('Failed to clear queue:', error)
      
      await Swal.fire({
        title: 'Error',
        text: 'Failed to clear queue',
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
        confirmButtonColor: '#dc2626'
      })
    }
  }
}

const showAddItemModal = () => {
  itemForm.value = {
    steamId: '',
    classname: '',
    quantity: 1,
    attachments: [],
    attachmentsJson: ''
  }
  editingItemIndex.value = null
  showItemModal.value = true
  showJsonEditor.value = false
}

const viewDetails = (record) => {
  // Show detailed view of the record
  const attachmentsInfo = record.item?.attachments && record.item.attachments.length > 0 
    ? `<div><strong>Attachments:</strong> ${record.item.attachments.length} items</div>`
    : ''
  
  Swal.fire({
    title: 'Delivery Details',
    html: `
      <div class="text-left space-y-2">
        <div><strong>Player:</strong> ${record.playerName} (${record.steamId})</div>
        <div><strong>Item:</strong> ${record.item?.classname} x${record.item?.quantity}</div>
        <div><strong>Status:</strong> ${getDeliveryStatusText(record.status)}</div>
        <div><strong>Source:</strong> ${getSourceText(record.source)}</div>
        <div><strong>Attempts:</strong> ${record.attempts}</div>
        ${attachmentsInfo}
        ${record.error ? `<div><strong>Error:</strong> ${record.error}</div>` : ''}
        ${record.orderId && record.orderId !== 'N/A' ? `<div><strong>Order ID:</strong> ${record.orderId}</div>` : ''}
      </div>
    `,
    background: '#1f2937',
    color: '#fff',
    confirmButtonColor: '#dc2626'
  })
}

const retryDelivery = async (record) => {
  const result = await Swal.fire({
    title: 'Retry Delivery',
    text: `Retry delivery for ${record.item?.classname}?`,
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
      const response = await $fetch('/api/admin/retry-delivery', {
        method: 'POST',
        body: {
          recordId: record.id,
          steamId: record.steamId,
          item: record.item
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
        
        await loadHistory()
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

const deleteRecord = async (record) => {
  const result = await Swal.fire({
    title: 'Delete Record',
    text: 'Are you sure you want to delete this delivery record?',
    icon: 'warning',
    background: '#1f2937',
    color: '#fff',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel'
  })
  
  if (result.isConfirmed) {
    try {
      const response = await $fetch('/api/admin/history', {
        method: 'DELETE',
        body: {
          recordId: record.id
        }
      })
      
      if (response.success) {
        await Swal.fire({
          title: 'Deleted',
          text: 'Record deleted successfully',
          icon: 'success',
          background: '#1f2937',
          color: '#fff',
          confirmButtonColor: '#dc2626',
          timer: 2000,
          showConfirmButton: false
        })
        
        await loadHistory()
      }
    } catch (error) {
      console.error('Delete record error:', error)
      
      await Swal.fire({
        title: 'Delete Failed',
        text: error.data?.statusMessage || 'Failed to delete record.',
        icon: 'error',
        background: '#1f2937',
        color: '#fff',
        confirmButtonColor: '#dc2626'
      })
    }
  }
}

// Load data on mount
onMounted(() => {
  loadHistory()
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

.loader-small {
  border: 2px solid #f3f3f3;
  border-radius: 50%;
  border-top: 2px solid #dc2626;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>