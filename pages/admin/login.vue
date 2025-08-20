<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
    <!-- Background Pattern -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -inset-10 opacity-10">
        <div class="absolute top-0 -left-4 w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div class="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div class="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>
    </div>
    
    <!-- Login Card -->
    <div class="relative z-10 max-w-md w-full mx-4">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-xl shadow-2xl mb-4">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <h2 class="text-3xl font-bold text-white">Admin Panel Login</h2>
        <p class="mt-2 text-gray-400">DayZ Nightro Administration</p>
      </div>
      
      <!-- Login Form -->
      <div class="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-700">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Username Field -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-300 mb-2">
              Username or Email
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <input
                id="username"
                v-model="form.username"
                type="text"
                required
                class="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200"
                placeholder="Enter your username"
              >
            </div>
          </div>
          
          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <input
                id="password"
                v-model="form.password"
                type="password"
                required
                class="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200"
                placeholder="Enter your password"
              >
            </div>
          </div>
          
          <!-- Remember Me -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember"
                type="checkbox"
                class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 rounded bg-gray-700"
              >
              <label for="remember" class="ml-2 block text-sm text-gray-300">
                Remember me
              </label>
            </div>
            <div class="text-sm">
              <a href="#" class="font-medium text-red-400 hover:text-red-300">
                Forgot password?
              </a>
            </div>
          </div>
          
          <!-- Error Message -->
          <div v-if="error" class="rounded-lg bg-red-900/50 border border-red-700 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-300">{{ error }}</p>
              </div>
            </div>
          </div>
          
          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>
        
        <!-- Footer Links -->
        <div class="mt-6 flex items-center justify-center space-x-4 text-sm">
          <NuxtLink to="/" class="text-gray-400 hover:text-white transition">
            ← Back to Site
          </NuxtLink>
          <span class="text-gray-600">•</span>
          <a href="#" class="text-gray-400 hover:text-white transition">
            Need Help?
          </a>
        </div>
      </div>
      
      <!-- Copyright -->
      <p class="mt-8 text-center text-xs text-gray-500">
        © 2025 DayZ Nightro. All rights reserved.
      </p>
    </div>
  </div>
</template>

<script setup>
// Disable default layout
definePageMeta({
  layout: false
})

const router = useRouter()
const form = ref({
  username: '',
  password: ''
})
const error = ref('')
const loading = ref(false)

// Check if already logged in
onMounted(async () => {
  try {
    const response = await $fetch('/api/admin/auth/session')
    if (response.success) {
      await router.push('/admin/dashboard')
    }
  } catch (e) {
    // Not logged in, stay on login page - this is normal behavior
    // 401 error is expected when not logged in
    console.log('No active session - showing login form')
  }
})

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  
  try {
    const response = await $fetch('/api/admin/auth/login', {
      method: 'POST',
      body: form.value
    })
    
    if (response.success) {
      console.log('✅ Login successful, redirecting to dashboard...')
      // Add small delay for smooth transition
      setTimeout(async () => {
        await router.push('/admin/dashboard')
      }, 500)
    } else {
      error.value = response.message || 'Login failed'
      loading.value = false
    }
  } catch (e) {
    console.error('❌ Login error:', e)
    error.value = e.data?.statusMessage || 'Invalid credentials. Please check your username and password.'
    loading.value = false
  }
}

// Handle enter key press
onMounted(() => {
  document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !loading.value) {
      handleLogin()
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('keypress', () => {})
})
</script>

<style scoped>
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>