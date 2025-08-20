<template>
  <div>
    <NuxtLayout name="admin">
      <div class="py-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-white">Store Items Management</h1>
            <button
              @click="openCreateModal"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              <span>Add New Item</span>
            </button>
          </div>
          
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gray-800 rounded-lg p-4">
              <div class="text-2xl font-bold text-white">{{ items.length }}</div>
              <div class="text-sm text-gray-400">Total Items</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4">
              <div class="text-2xl font-bold text-green-400">{{ items.filter(i => i.is_active).length }}</div>
              <div class="text-sm text-gray-400">Active Items</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4">
              <div class="text-2xl font-bold text-yellow-400">{{ totalSold }}</div>
              <div class="text-sm text-gray-400">Items Sold</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4">
              <div class="text-2xl font-bold text-blue-400">{{ totalRevenue.toLocaleString() }}</div>
              <div class="text-sm text-gray-400">Total Revenue (Points)</div>
            </div>
          </div>
          
          <!-- Category Filter -->
          <div class="mb-4 flex space-x-2 overflow-x-auto">
            <button
              v-for="category in categories"
              :key="category"
              @click="selectedCategory = category"
              :class="[
                'px-4 py-2 rounded-lg transition whitespace-nowrap',
                selectedCategory === category 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              ]"
            >
              {{ category }}
            </button>
          </div>
          
          <!-- Items Table -->
          <div class="bg-gray-800 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-700">
                <thead class="bg-gray-900">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Item</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stock</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sold</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-gray-800 divide-y divide-gray-700">
                  <tr v-for="item in filteredItems" :key="item.id">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <img 
                            v-if="item.image_url"
                            :src="item.image_url" 
                            :alt="item.name"
                            class="h-10 w-10 rounded object-cover"
                          >
                          <div v-else class="h-10 w-10 rounded bg-gray-700 flex items-center justify-center">
                            <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-white">{{ item.name }}</div>
                          <div class="text-sm text-gray-400">{{ item.classname }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                            :class="getCategoryBadgeClass(item.category)">
                        {{ item.category }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {{ item.price.toLocaleString() }} Points
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {{ item.stock_unlimited ? 'Unlimited' : item.stock_quantity }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {{ item.quantity_sold || 0 }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span :class="[
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                        item.is_active 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      ]">
                        {{ item.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div class="flex space-x-2">
                        <button
                          @click="editItem(item)"
                          class="text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          @click="toggleItemStatus(item)"
                          :class="[
                            item.is_active 
                              ? 'text-yellow-400 hover:text-yellow-300' 
                              : 'text-green-400 hover:text-green-300'
                          ]"
                        >
                          {{ item.is_active ? 'Deactivate' : 'Activate' }}
                        </button>
                        <button
                          @click="deleteItem(item)"
                          class="text-red-400 hover:text-red-300"
                        >
                          Delete
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
      
      <!-- Create/Edit Item Modal -->
      <div v-if="itemModal.show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-bold text-white mb-4">
            {{ itemModal.isEdit ? 'Edit Item' : 'Create New Item' }}
          </h2>
          
          <form @submit.prevent="saveItem" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Basic Info -->
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Item Name *</label>
                <input
                  v-model="itemModal.item.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                  placeholder="e.g., AK-74 Assault Rifle"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Category *</label>
                <select
                  v-model="itemModal.item.category"
                  required
                  class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                >
                  <option value="weapon">Weapon</option>
                  <option value="item">Item</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="money">Money</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Price (Points) *</label>
                <input
                  v-model.number="itemModal.item.price"
                  type="number"
                  min="0"
                  required
                  class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                  placeholder="1000"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Main Classname *</label>
                <div class="relative">
                  <input
                    v-model="itemModal.item.classname"
                    @input="searchClassname"
                    @focus="showClassnameDropdown = true"
                    @blur="hideClassnameDropdown"
                    type="text"
                    required
                    class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                    placeholder="Type to search or enter manually"
                  >
                  <!-- Classname Search Results -->
                  <div v-if="showClassnameDropdown && classnameResults.length > 0" 
                       class="absolute z-10 w-full mt-1 bg-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                    <button
                      v-for="result in classnameResults"
                      :key="result"
                      @mousedown="selectClassname(result)"
                      type="button"
                      class="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-600"
                    >
                      {{ result }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Description</label>
              <textarea
                v-model="itemModal.item.description"
                rows="3"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                placeholder="Enter item description..."
              ></textarea>
            </div>
            
            <!-- Attachments -->
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">
                Attachments (Nested Supported)
                <button
                  @click="addAttachment"
                  type="button"
                  class="ml-2 text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                >
                  + Add Attachment
                </button>
              </label>
              
              <div v-if="itemModal.attachments.length > 0" class="space-y-2 mt-2">
                <div v-for="(attachment, index) in itemModal.attachments" 
                     :key="index"
                     class="bg-gray-700 p-3 rounded">
                  <div class="flex items-start space-x-2">
                    <div class="flex-1">
                      <div class="relative">
                        <input
                          v-model="attachment.classname"
                          @input="(e) => searchAttachmentClassname(e, index)"
                          @focus="attachmentDropdownIndex = index"
                          @blur="hideAttachmentDropdown"
                          type="text"
                          class="w-full px-2 py-1 bg-gray-600 text-white rounded text-sm"
                          placeholder="Attachment classname"
                        >
                        <!-- Attachment Search Results -->
                        <div v-if="attachmentDropdownIndex === index && attachmentResults[index] && attachmentResults[index].length > 0" 
                             class="absolute z-10 w-full mt-1 bg-gray-600 rounded-md shadow-lg max-h-40 overflow-auto">
                          <button
                            v-for="result in attachmentResults[index]"
                            :key="result"
                            @mousedown="selectAttachmentClassname(index, result)"
                            type="button"
                            class="w-full text-left px-2 py-1 text-xs text-white hover:bg-gray-500"
                          >
                            {{ result }}
                          </button>
                        </div>
                      </div>
                      
                      <!-- Nested Attachments -->
                      <div v-if="attachment.attachments && attachment.attachments.length > 0" 
                           class="ml-4 mt-2 space-y-1">
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
                              class="w-full px-2 py-1 bg-gray-600 text-white rounded text-xs"
                              placeholder="Nested attachment"
                            >
                            <!-- Nested Search Results -->
                            <div v-if="nestedDropdownIndex === `${index}-${nIndex}` && nestedResults[`${index}-${nIndex}`] && nestedResults[`${index}-${nIndex}`].length > 0" 
                                 class="absolute z-10 w-full mt-1 bg-gray-500 rounded-md shadow-lg max-h-32 overflow-auto">
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
                          <button
                            @click="removeNestedAttachment(index, nIndex)"
                            type="button"
                            class="text-red-400 hover:text-red-300"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <button
                        @click="addNestedAttachment(index)"
                        type="button"
                        class="mt-1 text-xs text-blue-400 hover:text-blue-300"
                      >
                        + Add nested attachment
                      </button>
                    </div>
                    <input
                      v-model.number="attachment.quantity"
                      type="number"
                      min="1"
                      class="w-20 px-2 py-1 bg-gray-600 text-white rounded text-sm"
                      placeholder="Qty"
                    >
                    <button
                      @click="removeAttachment(index)"
                      type="button"
                      class="text-red-400 hover:text-red-300"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="text-sm text-gray-500 mt-2">
                No attachments added. Click "Add Attachment" to include weapon attachments, ammo, etc.
              </div>
            </div>
            
            <!-- Image Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Item Image</label>
              <input
                type="file"
                @change="handleImageUpload"
                accept="image/*"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
              >
              <div v-if="itemModal.item.image_url && itemModal.isEdit" class="mt-2">
                <img :src="itemModal.item.image_url" alt="Current image" class="h-20 rounded">
                <p class="text-xs text-gray-500 mt-1">Current image (will be replaced if new image selected)</p>
              </div>
            </div>
            
            <!-- Stock Settings -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="flex items-center">
                  <input
                    v-model="itemModal.item.stock_unlimited"
                    type="checkbox"
                    class="mr-2"
                  >
                  <span class="text-sm text-gray-400">Unlimited Stock</span>
                </label>
              </div>
              
              <div v-if="!itemModal.item.stock_unlimited">
                <label class="block text-sm font-medium text-gray-400 mb-1">Stock Quantity</label>
                <input
                  v-model.number="itemModal.item.stock_quantity"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Sort Order</label>
                <input
                  v-model.number="itemModal.item.sort_order"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                  placeholder="0"
                >
              </div>
            </div>
            
            <!-- Admin Notes -->
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Admin Notes (Internal)</label>
              <textarea
                v-model="itemModal.item.admin_notes"
                rows="2"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-red-500"
                placeholder="Internal notes (not visible to users)"
              ></textarea>
            </div>
            
            <!-- Status -->
            <div>
              <label class="flex items-center">
                <input
                  v-model="itemModal.item.is_active"
                  type="checkbox"
                  class="mr-2"
                >
                <span class="text-sm text-gray-400">Active (Visible in store)</span>
              </label>
            </div>
            
            <!-- Actions -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <button
                @click="itemModal.show = false"
                type="button"
                class="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {{ itemModal.isEdit ? 'Update Item' : 'Create Item' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})

const items = ref([])
const categories = ref(['All', 'Weapon', 'Item', 'Vehicle', 'Money'])
const selectedCategory = ref('All')
const classnameResults = ref([])
const showClassnameDropdown = ref(false)
const searchTimeout = ref(null)

// For attachments search
const attachmentResults = ref({})
const attachmentDropdownIndex = ref(null)
const attachmentSearchTimeout = ref(null)

// For nested attachments search
const nestedResults = ref({})
const nestedDropdownIndex = ref(null)
const nestedSearchTimeout = ref(null)

const itemModal = ref({
  show: false,
  isEdit: false,
  item: {
    name: '',
    description: '',
    price: 0,
    category: 'item',
    classname: '',
    image_url: null,
    stock_unlimited: true,
    stock_quantity: 0,
    admin_notes: '',
    is_active: true,
    sort_order: 0
  },
  attachments: [],
  imageFile: null
})

// Computed
const filteredItems = computed(() => {
  if (selectedCategory.value === 'All') {
    return items.value
  }
  return items.value.filter(item => 
    item.category.toLowerCase() === selectedCategory.value.toLowerCase()
  )
})

const totalSold = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.quantity_sold || 0), 0)
})

const totalRevenue = computed(() => {
  return items.value.reduce((sum, item) => sum + ((item.quantity_sold || 0) * item.price), 0)
})

// Methods
onMounted(async () => {
  await loadItems()
  await loadCategories()
})

const loadItems = async () => {
  try {
    const response = await $fetch('/api/admin/items')
    items.value = response.items
  } catch (error) {
    console.error('Failed to load items:', error)
  }
}

const loadCategories = async () => {
  try {
    const response = await $fetch('/api/admin/classname/categories')
    if (response.success && response.categories) {
      // You can use these categories if needed
      console.log('Available DayZ categories:', response.categories)
    }
  } catch (error) {
    console.error('Failed to load categories:', error)
  }
}

const getCategoryBadgeClass = (category) => {
  const classMap = {
    weapon: 'bg-red-900 text-red-300',
    item: 'bg-blue-900 text-blue-300',
    vehicle: 'bg-purple-900 text-purple-300',
    money: 'bg-green-900 text-green-300'
  }
  return classMap[category] || 'bg-gray-900 text-gray-300'
}

const openCreateModal = () => {
  itemModal.value = {
    show: true,
    isEdit: false,
    item: {
      name: '',
      description: '',
      price: 0,
      category: 'item',
      classname: '',
      image_url: null,
      stock_unlimited: true,
      stock_quantity: 0,
      admin_notes: '',
      is_active: true,
      sort_order: 0
    },
    attachments: [],
    imageFile: null
  }
  // Clear search results
  classnameResults.value = []
  attachmentResults.value = {}
  nestedResults.value = {}
}

const editItem = (item) => {
  itemModal.value = {
    show: true,
    isEdit: true,
    item: { ...item },
    attachments: item.attachments ? [...item.attachments] : [],
    imageFile: null
  }
  // Clear search results
  classnameResults.value = []
  attachmentResults.value = {}
  nestedResults.value = {}
}

// Main classname search
const searchClassname = async () => {
  clearTimeout(searchTimeout.value)
  
  searchTimeout.value = setTimeout(async () => {
    if (itemModal.value.item.classname.length < 2) {
      classnameResults.value = []
      return
    }
    
    try {
      const response = await $fetch('/api/admin/classname/search', {
        params: { q: itemModal.value.item.classname }
      })
      
      if (response.success && response.results) {
        // Now we expect results to be array of strings
        classnameResults.value = response.results
      }
    } catch (error) {
      console.error('Classname search failed:', error)
      classnameResults.value = []
    }
  }, 300)
}

const selectClassname = (classname) => {
  itemModal.value.item.classname = classname
  classnameResults.value = []
  showClassnameDropdown.value = false
}

const hideClassnameDropdown = () => {
  setTimeout(() => {
    showClassnameDropdown.value = false
  }, 200)
}

// Attachment classname search
const searchAttachmentClassname = async (event, index) => {
  clearTimeout(attachmentSearchTimeout.value)
  
  attachmentSearchTimeout.value = setTimeout(async () => {
    const query = itemModal.value.attachments[index].classname
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
  itemModal.value.attachments[index].classname = classname
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
  clearTimeout(nestedSearchTimeout.value)
  
  nestedSearchTimeout.value = setTimeout(async () => {
    const query = itemModal.value.attachments[parentIndex].attachments[nestedIndex].classname
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
  itemModal.value.attachments[parentIndex].attachments[nestedIndex].classname = classname
  const key = `${parentIndex}-${nestedIndex}`
  nestedResults.value[key] = []
  nestedDropdownIndex.value = null
}

const hideNestedDropdown = () => {
  setTimeout(() => {
    nestedDropdownIndex.value = null
  }, 200)
}

const addAttachment = () => {
  itemModal.value.attachments.push({
    classname: '',
    quantity: 1,
    attachments: []
  })
}

const removeAttachment = (index) => {
  itemModal.value.attachments.splice(index, 1)
  // Clean up search results
  delete attachmentResults.value[index]
}

const addNestedAttachment = (parentIndex) => {
  if (!itemModal.value.attachments[parentIndex].attachments) {
    itemModal.value.attachments[parentIndex].attachments = []
  }
  itemModal.value.attachments[parentIndex].attachments.push({
    classname: '',
    quantity: 1
  })
}

const removeNestedAttachment = (parentIndex, nestedIndex) => {
  itemModal.value.attachments[parentIndex].attachments.splice(nestedIndex, 1)
  // Clean up search results
  const key = `${parentIndex}-${nestedIndex}`
  delete nestedResults.value[key]
}

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    itemModal.value.imageFile = file
  }
}

const saveItem = async () => {
  try {
    const formData = new FormData()
    
    // Add all item fields
    Object.keys(itemModal.value.item).forEach(key => {
      if (key !== 'attachments' && key !== 'item_data') {
        formData.append(key, itemModal.value.item[key])
      }
    })
    
    // Add attachments
    if (itemModal.value.attachments.length > 0) {
      // Clean up empty attachments
      const validAttachments = itemModal.value.attachments.filter(a => a.classname)
      formData.append('attachments', JSON.stringify(validAttachments))
    }
    
    // Add image if selected
    if (itemModal.value.imageFile) {
      formData.append('image', itemModal.value.imageFile)
    }
    
    const url = '/api/admin/items'
    const method = itemModal.value.isEdit ? 'PUT' : 'POST'
    
    await $fetch(url, {
      method,
      body: formData
    })
    
    itemModal.value.show = false
    await loadItems()
    
    // Show success message
    alert(itemModal.value.isEdit ? 'Item updated successfully!' : 'Item created successfully!')
    
  } catch (error) {
    console.error('Failed to save item:', error)
    alert('Failed to save item: ' + error.message)
  }
}

const toggleItemStatus = async (item) => {
  try {
    const formData = new FormData()
    formData.append('id', item.id)
    formData.append('is_active', !item.is_active)
    
    await $fetch('/api/admin/items', {
      method: 'PUT',
      body: formData
    })
    
    await loadItems()
  } catch (error) {
    console.error('Failed to toggle item status:', error)
  }
}

const deleteItem = async (item) => {
  if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
    return
  }
  
  try {
    await $fetch('/api/admin/items', {
      method: 'DELETE',
      body: { itemId: item.id }
    })
    
    await loadItems()
  } catch (error) {
    console.error('Failed to delete item:', error)
  }
}
</script>

<style scoped>
/* Custom scrollbar for modal */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #1f2937;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>