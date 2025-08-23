<template>
  <div class="min-h-screen py-8">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Profile Header -->
      <div class="dayz-card p-8 mb-8">
        <div class="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          <!-- Avatar - Simple Display Only -->
          <div class="w-24 h-24 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-4xl border-4 border-gray-600"
               :style="getConsistentAvatarStyle()">
            {{ getAvatarInitial() }}
          </div>
          
          <!-- User Info -->
          <div class="flex-1">
            <h1 class="text-3xl font-bold text-white mb-2">{{ profile?.name }}</h1>
            <p class="text-gray-400 mb-4">{{ profile?.email }}</p>
            
            <div class="flex flex-wrap gap-4 text-sm">
              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
                </svg>
                <span class="text-yellow-500 font-semibold">{{ formatNumber(profile?.points || 0) }} Points</span>
              </div>
              
              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span class="text-gray-300">Steam ID: {{ profile?.steamid64 }}</span>
              </div>
              
              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span class="text-gray-300">Joined {{ formatDate(profile?.created_at) }}</span>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex space-x-3">
            <button 
              @click="showChangePassword"
              class="dayz-button-primary"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
      
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="dayz-card p-6 text-center">
          <div class="text-3xl font-bold text-white mb-2">{{ profile?.total_purchases || 0 }}</div>
          <div class="text-gray-400">Total Purchases</div>
        </div>
        
        <div class="dayz-card p-6 text-center">
          <div class="text-3xl font-bold text-yellow-500 mb-2">{{ formatNumber(profile?.total_spent || 0) }}</div>
          <div class="text-gray-400">Points Spent</div>
        </div>
        
        <div class="dayz-card p-6 text-center">
          <div class="text-3xl font-bold text-green-400 mb-2">{{ getNameChangesThisMonth() }}</div>
          <div class="text-gray-400">Name Changes This Month</div>
        </div>
        
        <div class="dayz-card p-6 text-center">
          <div class="text-3xl font-bold text-blue-400 mb-2">{{ formatDate(profile?.last_login, 'short') }}</div>
          <div class="text-gray-400">Last Login</div>
        </div>
      </div>
      
      <!-- Content Tabs -->
      <div class="mb-6">
        <div class="flex space-x-1 bg-gray-800 p-1 rounded-lg">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200"
            :class="activeTab === tab.id 
              ? 'bg-red-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'"
          >
            {{ tab.name }}
          </button>
        </div>
      </div>
      
      <!-- Tab Content -->
      <div class="dayz-card p-8">
        <!-- Transactions Tab -->
        <div v-if="activeTab === 'transactions'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-white">Recent Transactions</h2>
            <div v-if="transactions.length > itemsPerPage" class="text-sm text-gray-400">
              Showing {{ (currentTransactionPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentTransactionPage * itemsPerPage, transactions.length) }} of {{ transactions.length }}
            </div>
          </div>
          
          <div v-if="loading" class="flex justify-center py-8">
            <div class="loader mr-4"></div>
            <span class="text-gray-400">Loading transactions...</span>
          </div>
          
          <div v-else-if="transactions.length === 0" class="text-center py-8">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <h3 class="text-lg font-medium text-white mb-2">No Transactions</h3>
            <p class="text-gray-400">You haven't made any transactions yet.</p>
          </div>
          
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-700">
                  <th class="text-left py-3 px-4 text-gray-300 font-medium">Type</th>
                  <th class="text-left py-3 px-4 text-gray-300 font-medium">Amount</th>
                  <th class="text-left py-3 px-4 text-gray-300 font-medium">Description</th>
                  <th class="text-left py-3 px-4 text-gray-300 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="transaction in paginatedTransactions" :key="transaction.id" class="border-b border-gray-800">
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          :class="getTransactionTypeClass(transaction.type)">
                      {{ transaction.type }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <span :class="transaction.amount > 0 ? 'text-green-400' : 'text-red-400'" class="font-medium">
                      {{ transaction.amount > 0 ? '+' : '' }}{{ formatNumber(transaction.amount) }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-gray-300">{{ transaction.description }}</td>
                  <td class="py-3 px-4 text-gray-400">{{ formatDate(transaction.created_at) }}</td>
                </tr>
              </tbody>
            </table>
            
            <!-- Transaction Pagination -->
            <div v-if="totalTransactionPages > 1" class="flex items-center justify-between mt-6">
              <div class="text-sm text-gray-400">
                Page {{ currentTransactionPage }} of {{ totalTransactionPages }}
              </div>
              <div class="flex space-x-2">
                <button 
                  @click="currentTransactionPage = 1" 
                  :disabled="currentTransactionPage === 1"
                  class="px-3 py-2 text-sm rounded-md transition-colors"
                  :class="currentTransactionPage === 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'"
                >
                  First
                </button>
                <button 
                  @click="currentTransactionPage--" 
                  :disabled="currentTransactionPage === 1"
                  class="px-3 py-2 text-sm rounded-md transition-colors"
                  :class="currentTransactionPage === 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'"
                >
                  Previous
                </button>
                
                <!-- Page Numbers -->
                <template v-for="page in visibleTransactionPages" :key="page">
                  <button 
                    v-if="page !== '...'"
                    @click="currentTransactionPage = page"
                    class="px-3 py-2 text-sm rounded-md transition-colors"
                    :class="currentTransactionPage === page ? 'bg-red-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'"
                  >
                    {{ page }}
                  </button>
                  <span v-else class="px-3 py-2 text-sm text-gray-400">...</span>
                </template>
                
                <button 
                  @click="currentTransactionPage++" 
                  :disabled="currentTransactionPage === totalTransactionPages"
                  class="px-3 py-2 text-sm rounded-md transition-colors"
                  :class="currentTransactionPage === totalTransactionPages ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'"
                >
                  Next
                </button>
                <button 
                  @click="currentTransactionPage = totalTransactionPages" 
                  :disabled="currentTransactionPage === totalTransactionPages"
                  class="px-3 py-2 text-sm rounded-md transition-colors"
                  :class="currentTransactionPage === totalTransactionPages ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'"
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Purchases Tab -->
        <div v-if="activeTab === 'purchases'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-white">Purchase History</h2>
            <div v-if="purchases.length > itemsPerPage" class="text-sm text-gray-400">
              Showing {{ (currentPurchasePage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPurchasePage * itemsPerPage, purchases.length) }} of {{ purchases.length }}
            </div>
          </div>
          
          <div v-if="loading" class="flex justify-center py-8">
            <div class="loader mr-4"></div>
            <span class="text-gray-400">Loading purchases...</span>
          </div>
          
          <div v-else-if="purchases.length === 0" class="text-center py-8">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            <h3 class="text-lg font-medium text-white mb-2">No Purchases</h3>
            <p class="text-gray-400">You haven't made any purchases yet.</p>
            <NuxtLink to="/store" class="dayz-button-primary mt-4 inline-block">
              Visit Store
            </NuxtLink>
          </div>
          
          <div v-else class="space-y-4">
            <!-- Purchases Table -->
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-700">
                    <th class="text-left py-3 px-4 text-gray-300 font-medium">Item</th>
                    <th class="text-left py-3 px-4 text-gray-300 font-medium">Category</th>
                    <th class="text-center py-3 px-4 text-gray-300 font-medium">Qty</th>
                    <th class="text-right py-3 px-4 text-gray-300 font-medium">Price</th>
                    <th class="text-center py-3 px-4 text-gray-300 font-medium">Status</th>
                    <th class="text-right py-3 px-4 text-gray-300 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="purchase in paginatedPurchases" :key="purchase.id" class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td class="py-4 px-4">
                      <div class="font-medium text-white">{{ purchase.item_name }}</div>
                      <div v-if="purchase.description" class="text-sm text-gray-400 mt-1">
                        {{ purchase.description }}
                      </div>
                    </td>
                    <td class="py-4 px-4">
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300 capitalize">
                        {{ purchase.category }}
                      </span>
                    </td>
                    <td class="py-4 px-4 text-center">
                      <span class="text-white font-medium">{{ purchase.quantity }}</span>
                    </td>
                    <td class="py-4 px-4 text-right">
                      <div class="text-yellow-500 font-semibold">
                        {{ formatNumber(purchase.total_price) }}
                      </div>
                      <div class="text-xs text-gray-400">
                        Points
                      </div>
                    </td>
                    <td class="py-4 px-4 text-center">
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            :class="getPurchaseStatusClass(purchase.status)">
                        {{ getStatusText(purchase.status) }}
                      </span>
                    </td>
                    <td class="py-4 px-4 text-right">
                      <div class="text-white text-sm">
                        {{ formatDate(purchase.created_at, 'table') }}
                      </div>
                      <div class="text-xs text-gray-400">
                        {{ formatTime(purchase.created_at) }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Purchase Pagination -->
            <div v-if="totalPurchasePages > 1" class="flex items-center justify-between mt-6">
              <div class="text-sm text-gray-400">
                Page {{ currentPurchasePage }} of {{ totalPurchasePages }}
              </div>
              <div class="flex space-x-2">
                <button 
                  @click="currentPurchasePage = 1" 
                  :disabled="currentPurchasePage === 1"
                  class="px-3 py-2 text-sm rounded-md transition-colors"
                  :class="currentPurchasePage === 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'"
                >
                  First
                </button>
                <button 
                  @click="currentPurchasePage--" 
                  :disabled="currentPurchasePage === 1"
                  class="px-3 py-2 text-sm rounded-md transition-colors"
                  :class="currentPurchasePage === 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'"
                >
                  Previous
                </button>
                
                <!-- Page Numbers -->
                <template v-for="page in visiblePurchasePages" :key="page">
                  <button 
                    v-if="page !== '...'"
                    @click="currentPurchasePage = page"
                    class="px-3 py-2 text-sm rounded-md transition-colors"
                    :class="currentPurchasePage === page ? 'bg-red-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'"
                  >
                    {{ page }}
                  </button>
                  <span v-else class="px-3 py-2 text-sm text-gray-400">...</span>
                </template>
                
                <button 
                  @click="currentPurchasePage++" 
                  :disabled="currentPurchasePage === totalPurchasePages"
                  class="px-3 py-2 text-sm rounded-md transition-colors"
                  :class="currentPurchasePage === totalPurchasePages ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'"
                >
                  Next
                </button>
                <button 
                  @click="currentPurchasePage = totalPurchasePages" 
                  :disabled="currentPurchasePage === totalPurchasePages"
                  class="px-3 py-2 text-sm rounded-md transition-colors"
                  :class="currentPurchasePage === totalPurchasePages ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'"
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Settings Tab -->
        <div v-if="activeTab === 'settings'" class="space-y-6">
          <h2 class="text-2xl font-bold text-white mb-6">Account Settings</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Name Change -->
            <div class="bg-gray-800 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-white mb-4">Change In-Game Name</h3>
              <p class="text-gray-400 text-sm mb-4">
                You can change your in-game name {{ maxNameChanges }} time(s) per month. 
                Changes used this month: {{ getNameChangesThisMonth() }} / {{ maxNameChanges }}
              </p>
              
              <!-- Next allowed change info -->
              <div v-if="!canChangeName && getNameChangesThisMonth() >= maxNameChanges" class="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 mb-4">
                <div class="flex items-start space-x-2">
                  <svg class="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                  <div class="text-xs text-yellow-300">
                    <p class="font-medium">Monthly limit reached</p>
                    <p class="mb-2">You can change your name again on {{ getNextAllowedChangeDate() }}</p>
                    <div v-if="countdownText" class="bg-yellow-800/30 rounded px-2 py-1">
                      <span class="font-mono text-yellow-200">{{ countdownText }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="space-y-4">
                <div>
                  <label class="dayz-label">Current Name</label>
                  <div class="relative">
                    <input 
                      type="text" 
                      v-model="editableName"
                      :disabled="!canChangeName || saving"
                      class="dayz-input pr-10"
                      :class="{ 
                        'opacity-50 cursor-not-allowed': !canChangeName,
                        'bg-gray-700': saving
                      }"
                      :title="canChangeName ? 'Type to change your name' : 'Name change limit reached'"
                      placeholder="Enter new name..."
                      @keyup.enter="handleNameChange"
                      @keyup.escape="cancelNameEdit"
                    />
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                      <div v-if="saving" class="loader-small"></div>
                      <svg v-else-if="nameChanged" class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                      <svg v-else class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                      </svg>
                    </div>
                  </div>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ canChangeName ? 'Press Enter to save, Escape to cancel' : `Limit reached. Next change: ${getNextAllowedChangeDate()}` }}
                  </p>
                </div>
                
                <button 
                  @click="handleNameChange"
                  :disabled="!canChangeName || saving || !hasNameChanged"
                  class="dayz-button-primary w-full"
                  :class="{ 
                    'opacity-50 cursor-not-allowed': !canChangeName || saving || !hasNameChanged,
                    'bg-green-600 hover:bg-green-700': hasNameChanged && canChangeName && !saving
                  }"
                >
                  <span v-if="saving" class="flex items-center justify-center">
                    <div class="loader-small mr-2"></div>
                    Saving...
                  </span>
                  <span v-else-if="nameChanged" class="flex items-center justify-center">
                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    Saved Successfully!
                  </span>
                  <span v-else-if="!canChangeName">Change Limit Reached</span>
                  <span v-else-if="!hasNameChanged">{{ editableName ? 'No Changes Made' : 'Enter New Name' }}</span>
                  <span v-else>Save Name Change</span>
                </button>
              </div>
            </div>
            
            <!-- Account Info -->
            <div class="bg-gray-800 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-white mb-4">Account Information</h3>
              
              <div class="space-y-4">
                <div>
                  <label class="dayz-label">Email Address</label>
                  <input 
                    type="email" 
                    :value="profile?.email" 
                    readonly 
                    class="dayz-input bg-gray-700 cursor-not-allowed"
                    title="Email address cannot be changed"
                  />
                </div>
                
                <div>
                  <label class="dayz-label">Steam ID64</label>
                  <input 
                    type="text" 
                    :value="profile?.steamid64" 
                    readonly 
                    class="dayz-input bg-gray-700 cursor-not-allowed font-mono"
                    title="Steam ID64 cannot be changed"
                  />
                </div>
                
                <div>
                  <label class="dayz-label">Avatar</label>
                  <div class="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-gray-600"
                         :style="getConsistentAvatarStyle()">
                      {{ getAvatarInitial() }}
                    </div>
                    <div>
                      <p class="text-white font-medium">{{ getAvatarInitial() }} - {{ profile?.name }}</p>
                      <p class="text-xs text-gray-400">Avatar is automatically generated from your name</p>
                    </div>
                  </div>
                </div>
                
                <p class="text-xs text-gray-400">
                  Email, Steam ID, and Avatar cannot be changed. Contact support if you need assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Swal from 'sweetalert2'
import { getConsistentColorForName } from '~/utils/avatar.js'

// Meta
definePageMeta({
  title: 'Profile',
  layout: 'default'
})

// State
const user = useState('auth.user')
const loading = ref(true)
const activeTab = ref('transactions')
const profile = ref(null)
const transactions = ref([])
const purchases = ref([])
const maxNameChanges = ref(1)

// Pagination state
const itemsPerPage = ref(10)
const currentTransactionPage = ref(1)
const currentPurchasePage = ref(1)

// Name editing state
const editableName = ref('')
const originalName = ref('')
const saving = ref(false)
const nameChanged = ref(false)
const countdownText = ref('')
const countdownInterval = ref(null)

// Tabs
const tabs = [
  { id: 'transactions', name: 'Transactions' },
  { id: 'purchases', name: 'Purchases' },
  { id: 'settings', name: 'Settings' }
]

// Computed Properties for Pagination
const totalTransactionPages = computed(() => {
  return Math.ceil(transactions.value.length / itemsPerPage.value)
})

const totalPurchasePages = computed(() => {
  return Math.ceil(purchases.value.length / itemsPerPage.value)
})

const paginatedTransactions = computed(() => {
  const start = (currentTransactionPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return transactions.value.slice(start, end)
})

const paginatedPurchases = computed(() => {
  const start = (currentPurchasePage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return purchases.value.slice(start, end)
})

const visibleTransactionPages = computed(() => {
  return getVisiblePages(currentTransactionPage.value, totalTransactionPages.value)
})

const visiblePurchasePages = computed(() => {
  return getVisiblePages(currentPurchasePage.value, totalPurchasePages.value)
})

// Helper function for pagination
const getVisiblePages = (currentPage, totalPages) => {
  const pages = []
  const showPages = 5
  
  if (totalPages <= showPages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, currentPage + 2)
    
    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push('...')
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }
  }
  
  return pages
}

// Watch for tab changes to reset pagination
watch(activeTab, (newTab) => {
  if (newTab === 'transactions') {
    currentTransactionPage.value = 1
  } else if (newTab === 'purchases') {
    currentPurchasePage.value = 1
  }
})

// Computed
const canChangeName = computed(() => {
  if (!profile.value) return false
  return getNameChangesThisMonth() < maxNameChanges.value
})

const hasNameChanged = computed(() => {
  return editableName.value && editableName.value.trim() !== originalName.value && editableName.value.trim().length >= 3
})

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
      day: 'numeric' 
    })
  }
  
  if (format === 'table') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

const formatTime = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTransactionTypeClass = (type) => {
  const classes = {
    deposit: 'bg-green-900 text-green-300',
    purchase: 'bg-red-900 text-red-300',
    refund: 'bg-blue-900 text-blue-300',
    admin_adjust: 'bg-purple-900 text-purple-300'
  }
  return classes[type] || 'bg-gray-900 text-gray-300'
}

const getPurchaseStatusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-900 text-yellow-300',
    completed: 'bg-green-900 text-green-300',
    delivered: 'bg-blue-900 text-blue-300',
    processing: 'bg-orange-900 text-orange-300',
    cancelled: 'bg-red-900 text-red-300'
  }
  return classes[status] || 'bg-gray-900 text-gray-300'
}

const getStatusText = (status) => {
  const statusMap = {
    pending: 'Pending',
    completed: 'Completed',
    delivered: 'Delivered',
    processing: 'Processing',
    cancelled: 'Cancelled'
  }
  return statusMap[status] || status
}

const getAvatarInitial = () => {
  if (user.value && user.value.name) {
    return user.value.name.charAt(0).toUpperCase()
  }
  return profile.value?.name?.charAt(0)?.toUpperCase() || 'U'
}

// Use the SAME consistent function as Header and Leaderboard
const getConsistentAvatarStyle = () => {
  // First try to get color from user's avatar_data
  if (user.value && user.value.avatar_data && user.value.avatar_data.color) {
    return { backgroundColor: user.value.avatar_data.color }
  }
  
  // Fallback: use the SAME consistent function as everywhere else
  if (profile.value && profile.value.name) {
    const color = getConsistentColorForName(profile.value.name)
    return { backgroundColor: color }
  }
  
  // Default color
  return { backgroundColor: '#dc2626' }
}

const getNameChangesThisMonth = () => {
  if (!profile.value) return 0
  
  if (!profile.value.last_name_change || profile.value.name_change_count === 0) return 0
  
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const lastChangeDate = new Date(profile.value.last_name_change)
  const isSameMonth = lastChangeDate.getMonth() === currentMonth && 
                     lastChangeDate.getFullYear() === currentYear
  
  return isSameMonth ? (profile.value.name_change_count || 0) : 0
}

const getNextAllowedChangeDate = () => {
  if (!profile.value?.last_name_change) return 'Next month'
  
  const lastChange = new Date(profile.value.last_name_change)
  const nextAllowed = new Date(lastChange)
  nextAllowed.setMonth(nextAllowed.getMonth() + 1)
  nextAllowed.setDate(1)
  
  return nextAllowed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Real-time countdown functions
const calculateCountdown = () => {
  if (!profile.value?.last_name_change || canChangeName.value) {
    countdownText.value = ''
    return
  }
  
  const lastChange = new Date(profile.value.last_name_change)
  const nextAllowed = new Date(lastChange)
  nextAllowed.setMonth(nextAllowed.getMonth() + 1)
  nextAllowed.setDate(1)
  nextAllowed.setHours(0, 0, 0, 0)
  
  const now = new Date()
  const timeDiff = nextAllowed.getTime() - now.getTime()
  
  if (timeDiff <= 0) {
    countdownText.value = 'Available now!'
    if (profile.value) {
      profile.value = { ...profile.value }
    }
    return
  }
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
  
  if (days > 0) {
    countdownText.value = `${days}d ${hours}h ${minutes}m ${seconds}s`
  } else if (hours > 0) {
    countdownText.value = `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    countdownText.value = `${minutes}m ${seconds}s`
  } else {
    countdownText.value = `${seconds}s`
  }
}

const startCountdown = () => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
  }
  
  calculateCountdown()
  
  countdownInterval.value = setInterval(() => {
    calculateCountdown()
  }, 1000)
}

const stopCountdown = () => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
    countdownInterval.value = null
  }
  countdownText.value = ''
}

// Name editing functions
const initializeNameEdit = () => {
  if (profile.value?.name) {
    editableName.value = profile.value.name
    originalName.value = profile.value.name
    nameChanged.value = false
  }
}

const cancelNameEdit = () => {
  editableName.value = originalName.value
  nameChanged.value = false
}

const validateName = (name) => {
  if (!name || name.trim().length === 0) {
    return 'Name is required'
  }
  if (name.trim().length < 3) {
    return 'Name must be at least 3 characters'
  }
  if (name.trim().length > 50) {
    return 'Name must be less than 50 characters'
  }
  if (name.trim() === originalName.value) {
    return 'New name must be different from current name'
  }
  return null
}

const handleNameChange = async () => {
  const newName = editableName.value.trim()
  
  if (newName === originalName.value) {
    nameChanged.value = false
    return
  }
  
  const error = validateName(newName)
  if (error) {
    alert(error)
    editableName.value = originalName.value
    return
  }
  
  if (!canChangeName.value) {
    alert('You have reached the monthly name change limit')
    editableName.value = originalName.value
    return
  }
  
  try {
    saving.value = true
    
    const response = await $fetch('/api/profile/update-profile', {
      method: 'POST',
      body: {
        action: 'change_name',
        data: {
          newName: newName
        }
      }
    })
    
    if (response.success) {
      // Update local data
      profile.value.name = newName
      profile.value.name_change_count = response.nameChangeCount
      profile.value.last_name_change = response.lastNameChange
      
      // Update user state สำหรับ header (รวม avatar ใหม่)
      user.value.name = newName
      if (response.avatarData) {
        user.value.avatar_data = response.avatarData
      }
      
      // Update refs
      originalName.value = newName
      nameChanged.value = true
      
      console.log('✅ Name changed successfully:', newName)
      
      if (!canChangeName.value) {
        startCountdown()
      }
      
      setTimeout(() => {
        nameChanged.value = false
      }, 3000)
    }
    
  } catch (error) {
    console.error('Name change error:', error)
    alert(error.data?.message || 'Failed to change name. Please try again.')
    editableName.value = originalName.value
  } finally {
    saving.value = false
  }
}

// Watch for profile changes to update editable name
watch(() => profile.value?.name, (newName) => {
  if (newName && !saving.value) {
    initializeNameEdit()
  }
})

// Watch canChangeName to start/stop countdown
watch(() => canChangeName.value, (canChange) => {
  if (!canChange && getNameChangesThisMonth() >= maxNameChanges.value) {
    startCountdown()
  } else {
    stopCountdown()
  }
}, { immediate: true })

// Cleanup interval on unmount
onUnmounted(() => {
  stopCountdown()
})

const showChangePassword = async () => {
  const { value: formValues } = await Swal.fire({
    title: 'Change Password',
    html: `
      <div class="space-y-4">
        <input id="currentPassword" type="password" placeholder="Current Password" class="swal2-input">
        <input id="newPassword" type="password" placeholder="New Password" class="swal2-input">
        <input id="confirmPassword" type="password" placeholder="Confirm New Password" class="swal2-input">
      </div>
    `,
    background: '#1f2937',
    color: '#fff',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Change Password',
    preConfirm: () => {
      const currentPassword = document.getElementById('currentPassword').value
      const newPassword = document.getElementById('newPassword').value
      const confirmPassword = document.getElementById('confirmPassword').value
      
      if (!currentPassword || !newPassword || !confirmPassword) {
        Swal.showValidationMessage('All fields are required')
        return false
      }
      
      if (newPassword !== confirmPassword) {
        Swal.showValidationMessage('New passwords do not match')
        return false
      }
      
      if (newPassword.length < 6) {
        Swal.showValidationMessage('Password must be at least 6 characters')
        return false
      }
      
      return { currentPassword, newPassword, confirmPassword }
    }
  })
  
  if (formValues) {
    await Swal.fire({
      title: 'Password Changed!',
      text: 'Your password has been updated successfully.',
      icon: 'success',
      background: '#1f2937',
      color: '#fff',
      confirmButtonColor: '#dc2626'
    })
  }
}

// Load profile data
const loadProfile = async () => {
  try {
    loading.value = true
    console.log('🔍 Loading profile data...')
    
    const response = await $fetch('/api/profile')
    
    if (response.success) {
      profile.value = response.user
      transactions.value = response.transactions || []
      purchases.value = response.purchases || []
      
      // Initialize name editing
      initializeNameEdit()
      
      // Start countdown if needed
      if (!canChangeName.value && getNameChangesThisMonth() >= maxNameChanges.value) {
        startCountdown()
      }
      
      // Update user state รวม avatar_data
      user.value = {
        ...response.user,
        avatar_data: response.user.avatar_data
      }
      
      console.log('✅ Profile loaded successfully:', response.user.email)
      console.log('🎨 Avatar loaded from profile')
      console.log('📊 Name change data:', {
        name_change_count: response.user.name_change_count,
        last_name_change: response.user.last_name_change,
        thisMonth: getNameChangesThisMonth(),
        canChange: canChangeName.value
      })
    } else {
      throw new Error('Failed to load profile')
    }
    
  } catch (error) {
    console.error('❌ Profile loading error:', error)
    
    loading.value = false
    
    if (process.client) {
      if (error.statusCode === 401) {
        console.log('🔑 Session expired, clearing user state')
        
        user.value = null
        const sessionLoaded = useState('auth.sessionLoaded')
        sessionLoaded.value = false
        
        alert('Session expired. Please login again.')
        await navigateTo('/login')
      } else {
        alert('Failed to load profile data. Please try again.')
      }
    }
    return
  } finally {
    loading.value = false
  }
}

// Check authentication on mount
onMounted(async () => {
  console.log('🔍 Profile page mounted, checking authentication...')
  
  const sessionLoaded = useState('auth.sessionLoaded')
  
  let attempts = 0
  while (!sessionLoaded.value && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  
  console.log('📊 Auth check result:', {
    user: !!user.value,
    sessionLoaded: sessionLoaded.value,
    attempts
  })
  
  if (!user.value) {
    console.log('❌ No user found, redirecting to login')
    await navigateTo('/login?redirect=/profile')
    return
  }
  
  await loadProfile()
})
</script>

<style scoped>
.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #dc2626;
  border-radius: 50%;
  width: 20px;
  height: 20px;
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