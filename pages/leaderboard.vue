<template>
  <div class="min-h-screen py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-white mb-4">
          🏆 Historical Leaderboard
        </h1>
        <p class="text-xl text-gray-400 max-w-2xl mx-auto">
          All-time best performances and current rankings with score-based system
        </p>
      </div>

      <!-- Mode Toggle -->
      <div class="flex justify-center mb-8">
        <div class="bg-gray-800 p-1 rounded-lg">
          <button
            @click="viewMode = 'current'"
            class="px-6 py-3 rounded-md font-medium transition-all duration-200"
            :class="viewMode === 'current' 
              ? 'bg-red-600 text-white' 
              : 'text-gray-400 hover:text-white'"
          >
            🔥 Current Rankings
          </button>
          <button
            @click="viewMode = 'historical'"
            class="px-6 py-3 rounded-md font-medium transition-all duration-200"
            :class="viewMode === 'historical' 
              ? 'bg-red-600 text-white' 
              : 'text-gray-400 hover:text-white'"
          >
            👑 All-Time Best
          </button>
        </div>
      </div>

      <!-- Filter and Sort Options -->
      <div class="dayz-card p-6 mb-8">
        <div class="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div class="flex items-center space-x-4">
            <label class="text-gray-300 font-medium">Sort by:</label>
            <select 
              v-model="sortBy" 
              @change="sortPlayers"
              class="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-red-500"
            >
              <option value="score">Total Score</option>
              <option value="kdr">K/D Ratio</option>
              <option value="kills">Total Kills</option>
              <option value="time">Time Played</option>
              <option value="longestShot">Longest Shot</option>
            </select>
          </div>
          
          <div class="flex items-center space-x-4">
            <button 
              @click="refreshData"
              :disabled="loading"
              class="dayz-button-secondary flex items-center space-x-2"
            >
              <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>{{ loading ? 'Refreshing...' : 'Update Rankings' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Leaderboard Table -->
      <div class="dayz-card overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading && players.length === 0" class="flex justify-center items-center py-20">
          <div class="loader mr-4"></div>
          <span class="text-gray-400">Loading historical rankings...</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="players.length === 0" class="text-center py-20">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <h3 class="text-xl font-semibold text-white mb-2">No Player Data</h3>
          <p class="text-gray-400 mb-4">No historical rankings available yet.</p>
          <button 
            @click="refreshData"
            class="dayz-button-primary"
          >
            Sync Data from DayZ Server
          </button>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-800">
              <tr>
                <th class="text-left py-4 px-6 text-gray-300 font-semibold">Rank</th>
                <th class="text-left py-4 px-6 text-gray-300 font-semibold">Player</th>
                <th class="text-left py-4 px-6 text-gray-300 font-semibold">Score</th>
                <th class="text-left py-4 px-6 text-gray-300 font-semibold">K/D Ratio</th>
                <th class="text-left py-4 px-6 text-gray-300 font-semibold">Kills</th>
                <th class="text-left py-4 px-6 text-gray-300 font-semibold">Time Played</th>
                <th class="text-left py-4 px-6 text-gray-300 font-semibold">Longest Shot</th>
                <th class="text-left py-4 px-6 text-gray-300 font-semibold">Best Rank</th>
                <th class="text-left py-4 px-6 text-gray-300 font-semibold">Peak Score</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(player, index) in players" 
                :key="player.steam_id"
                class="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                :class="getRankRowClass(index)"
              >
                <!-- Rank -->
                <td class="py-4 px-6">
                  <div class="flex items-center space-x-2">
                    <div class="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm"
                         :class="getRankBadgeClass(index)">
                      {{ getRankDisplay(index) }}
                    </div>
                    <!-- Peak Performance Indicator -->
                    <div v-if="player.is_peak_performance" 
                         class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                         title="Peak Performance!">
                    </div>
                  </div>
                </td>

                <!-- Player Name -->
                <td class="py-4 px-6">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                      <span class="text-white font-semibold text-sm">{{ getPlayerInitial(player.player_name) }}</span>
                    </div>
                    <div>
                      <div class="flex items-center space-x-2">
                        <span class="text-white font-medium">{{ player.player_name }}</span>
                        <!-- Achievement Badges -->
                        <div v-if="player.is_best_kdr_ever" 
                             class="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-bold"
                             title="Personal Best K/D!">
                          🏆
                        </div>
                      </div>
                      <div class="text-gray-400 text-xs">
                        {{ viewMode === 'current' ? 'Current Stats' : 'All-Time Best' }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Score -->
                <td class="py-4 px-6">
                  <div class="text-yellow-400 font-bold text-lg">
                    {{ formatScore(getCurrentScore(player)) }}
                  </div>
                  <div v-if="viewMode === 'current' && player.peak_score > getCurrentScore(player)" 
                       class="text-gray-500 text-xs">
                    Peak: {{ formatScore(player.peak_score) }}
                  </div>
                </td>

                <!-- K/D Ratio -->
                <td class="py-4 px-6">
                  <div class="font-bold text-lg" :class="getKdrColor(getCurrentKdr(player))">
                    {{ getCurrentKdr(player) }}
                  </div>
                  <div v-if="viewMode === 'current' && player.best_kdr > getCurrentKdr(player)" 
                       class="text-gray-500 text-xs">
                    Best: {{ player.best_kdr }}
                  </div>
                </td>

                <!-- Kills -->
                <td class="py-4 px-6">
                  <div class="text-green-400 font-bold text-lg">{{ getCurrentKills(player) }}</div>
                  <div v-if="viewMode === 'current' && player.best_kills > getCurrentKills(player)" 
                       class="text-gray-500 text-xs">
                    Best: {{ player.best_kills }}
                  </div>
                </td>

                <!-- Time Played -->
                <td class="py-4 px-6">
                  <div class="text-blue-400 font-medium">{{ formatTimeHours(getCurrentTime(player)) }}</div>
                  <div v-if="viewMode === 'current' && player.best_time_hours > getCurrentTime(player)" 
                       class="text-gray-500 text-xs">
                    Best: {{ formatTimeHours(player.best_time_hours) }}
                  </div>
                </td>

                <!-- Longest Shot -->
                <td class="py-4 px-6">
                  <div class="text-purple-400 font-medium">{{ formatDistance(getCurrentShot(player)) }}</div>
                  <div v-if="viewMode === 'current' && player.best_longest_shot > getCurrentShot(player)" 
                       class="text-gray-500 text-xs">
                    Best: {{ formatDistance(player.best_longest_shot) }}
                  </div>
                </td>

                <!-- Best Rank Ever -->
                <td class="py-4 px-6">
                  <div class="text-orange-400 font-bold">#{{ player.best_rank }}</div>
                  <div v-if="player.peak_achieved_at" class="text-gray-500 text-xs">
                    {{ formatDate(player.peak_achieved_at) }}
                  </div>
                </td>

                <!-- Peak Score -->
                <td class="py-4 px-6">
                  <div class="text-pink-400 font-bold">{{ formatScore(player.peak_score) }}</div>
                  <div class="text-gray-500 text-xs">All-time high</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Meta
definePageMeta({
  title: 'Historical Leaderboard',
  layout: 'default'
})

// State
const loading = ref(true)
const players = ref([])
const viewMode = ref('current') // 'current' or 'historical'
const sortBy = ref('score')
const lastUpdated = ref('')

// Computed
const totalPlayers = computed(() => players.value.length)
const topScore = computed(() => {
  if (players.value.length === 0) return '0'
  const scores = players.value.map(p => getCurrentScore(p))
  return formatScore(Math.max(...scores))
})
const topPlayer = computed(() => {
  if (players.value.length === 0) return 'N/A'
  return players.value[0]?.player_name || 'N/A'
})

// Methods
const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num || 0)
}

const formatScore = (score) => {
  return parseFloat(score || 0).toFixed(1)
}

const formatTimeHours = (hours) => {
  if (!hours) return '0h'
  
  const h = Math.floor(hours)
  const m = Math.floor((hours % 1) * 60)
  
  if (h >= 24) {
    const days = Math.floor(h / 24)
    const remainingHours = h % 24
    return `${days}d ${remainingHours}h`
  }
  
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const formatDistance = (meters) => {
  if (!meters) return '0m'
  
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`
  }
  return `${Math.round(meters)}m`
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const getPlayerInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : 'U'
}

const getRankDisplay = (index) => {
  const rank = index + 1
  if (rank <= 3) {
    return ['🥇', '🥈', '🥉'][index]
  }
  return rank
}

const getRankBadgeClass = (index) => {
  const rank = index + 1
  if (rank === 1) return 'bg-yellow-500 text-black'
  if (rank === 2) return 'bg-gray-400 text-black'
  if (rank === 3) return 'bg-orange-600 text-white'
  return 'bg-gray-700 text-white'
}

const getRankRowClass = (index) => {
  const rank = index + 1
  if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/20'
  if (rank === 2) return 'bg-gray-400/10 border-gray-400/20'
  if (rank === 3) return 'bg-orange-600/10 border-orange-600/20'
  return ''
}

const getKdrColor = (kdr) => {
  const ratio = parseFloat(kdr)
  if (ratio >= 3) return 'text-purple-400'
  if (ratio >= 2) return 'text-green-400'
  if (ratio >= 1) return 'text-yellow-400'
  return 'text-red-400'
}

// Get current or historical values based on view mode
const getCurrentScore = (player) => {
  return viewMode.value === 'current' ? player.current_score : player.best_score
}

const getCurrentKdr = (player) => {
  return viewMode.value === 'current' ? player.current_kdr : player.best_kdr
}

const getCurrentKills = (player) => {
  return viewMode.value === 'current' ? player.current_kills : player.best_kills
}

const getCurrentTime = (player) => {
  return viewMode.value === 'current' ? player.current_time_hours : player.best_time_hours
}

const getCurrentShot = (player) => {
  return viewMode.value === 'current' ? player.current_longest_shot : player.best_longest_shot
}

const sortPlayers = () => {
  players.value.sort((a, b) => {
    switch (sortBy.value) {
      case 'score':
        return getCurrentScore(b) - getCurrentScore(a)
      case 'kdr':
        return getCurrentKdr(b) - getCurrentKdr(a)
      case 'kills':
        return getCurrentKills(b) - getCurrentKills(a)
      case 'time':
        return getCurrentTime(b) - getCurrentTime(a)
      case 'longestShot':
        return getCurrentShot(b) - getCurrentShot(a)
      default:
        return getCurrentScore(b) - getCurrentScore(a)
    }
  })
}

const loadHistoricalLeaderboard = async () => {
  try {
    loading.value = true
    console.log('🔍 Loading historical leaderboard...')
    
    const endpoint = viewMode.value === 'current' 
      ? '/api/leaderboard/historical'
      : '/api/leaderboard/historical?view=all_time'
    
    const response = await $fetch(endpoint)
    
    if (response.success) {
      players.value = response.data
      sortPlayers()
      lastUpdated.value = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
      console.log('✅ Historical leaderboard loaded:', players.value.length, 'players')
    }
  } catch (error) {
    console.error('❌ Failed to load historical leaderboard:', error)
    
    if (process.client) {
      alert('Failed to load leaderboard data. Please try again.')
    }
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  try {
    // Trigger historical sync
    await $fetch('/api/leaderboard/historical-sync', {
      method: 'POST'
    })
    
    // Reload data
    await loadHistoricalLeaderboard()
  } catch (error) {
    console.error('❌ Refresh failed:', error)
    alert('Failed to refresh data. Please try again.')
  }
}

// Watch for view mode changes
watch(viewMode, () => {
  sortPlayers()
})

// Load data on mount
onMounted(async () => {
  await loadHistoricalLeaderboard()
})
</script>