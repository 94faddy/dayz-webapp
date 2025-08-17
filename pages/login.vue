<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="mx-auto h-16 w-16 bg-red-600 rounded-lg flex items-center justify-center mb-4">
          <span class="text-2xl font-bold text-white">Z</span>
        </div>
        <h2 class="mt-6 text-3xl font-extrabold text-white">
          Sign in to DayZ Launcher
        </h2>
        <p class="mt-2 text-sm text-gray-400">
          Or
          <NuxtLink to="/register" class="font-medium text-red-500 hover:text-red-400">
            create a new account
          </NuxtLink>
        </p>
      </div>
      
      <!-- Login Form -->
      <div class="dayz-card p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email Field -->
          <div class="dayz-form-group">
            <label for="email" class="dayz-label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              v-model="form.email"
              :disabled="loading"
              class="dayz-input"
              :class="{ 'border-red-500': errors.email }"
              placeholder="Enter your email"
            />
            <p v-if="errors.email" class="dayz-error">{{ errors.email }}</p>
          </div>
          
          <!-- Password Field -->
          <div class="dayz-form-group">
            <label for="password" class="dayz-label">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                v-model="form.password"
                :disabled="loading"
                class="dayz-input pr-10"
                :class="{ 'border-red-500': errors.password }"
                placeholder="Enter your password"
              />
              <button
                type="button"
                @click="togglePassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                tabindex="-1"
              >
                <svg
                  class="h-5 w-5 text-gray-400 hover:text-gray-300"
                  :class="showPassword ? 'hidden' : 'block'"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <svg
                  class="h-5 w-5 text-gray-400 hover:text-gray-300"
                  :class="showPassword ? 'block' : 'hidden'"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
                </svg>
              </button>
            </div>
            <p v-if="errors.password" class="dayz-error">{{ errors.password }}</p>
          </div>
          
          <!-- Remember Me -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                v-model="form.rememberMe"
                class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-800 rounded"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-400">
                Remember me
              </label>
            </div>
            
            <div class="text-sm">
              <a href="#" class="font-medium text-red-500 hover:text-red-400">
                Forgot your password?
              </a>
            </div>
          </div>
          
          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              :disabled="loading"
              class="group relative w-full flex justify-center dayz-button-primary"
              :class="{ 'opacity-50 cursor-not-allowed': loading }"
            >
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg
                  v-if="!loading"
                  class="h-5 w-5 text-red-300 group-hover:text-red-200"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                </svg>
                <div v-else class="loader"></div>
              </span>
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>
        </form>
        
        <!-- Divider -->
        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-600" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-800 text-gray-400">
                New to DayZ Launcher?
              </span>
            </div>
          </div>
          
          <div class="mt-6">
            <NuxtLink
              to="/register"
              class="w-full flex justify-center dayz-button-secondary"
            >
              Create Account
            </NuxtLink>
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
  title: 'Login',
  layout: 'default'
})

// State
const user = useState('auth.user')
const loading = ref(false)
const showPassword = ref(false)

const form = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const errors = reactive({
  email: '',
  password: ''
})

// Redirect if already logged in
if (user.value) {
  await navigateTo('/')
}

// Methods
const validateForm = () => {
  errors.email = ''
  errors.password = ''
  
  if (!form.email) {
    errors.email = 'Email is required'
    return false
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email'
    return false
  }
  
  if (!form.password) {
    errors.password = 'Password is required'
    return false
  }
  
  if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    return false
  }
  
  return true
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const handleLogin = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: form.email,
        password: form.password
      }
    })
    
    // จัดการกรณีรออนุมัติ
    if (response.status === 'pending_approval') {
      await Swal.fire({
        title: 'Account Pending Approval',
        html: `
          <div class="text-center">
            <div class="mb-4">
              <svg class="w-16 h-16 mx-auto text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
            </div>
            <p class="text-lg font-medium mb-2">Hello <strong>${response.user.name}</strong>!</p>
            <p class="text-gray-300 mb-4">${response.message}</p>
            <div class="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
              <p class="text-sm text-blue-300">
                <strong>What's next?</strong><br>
                • You'll receive an email notification once approved<br>
                • Contact admin if you've been waiting more than 24 hours<br>
                • Your account details are saved and ready to use
              </p>
            </div>
          </div>
        `,
        icon: 'warning',
        background: '#1f2937',
        color: '#fff',
        iconColor: '#f59e0b',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'I Understand',
        allowOutsideClick: false
      })
      return
    }
    
    // Login สำเร็จ
    if (response.success) {
      user.value = response.user
      
      await Swal.fire({
        title: 'Welcome Back!',
        text: `Hello ${response.user.name}, you have been successfully logged in.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: '#1f2937',
        color: '#fff',
        iconColor: '#10b981'
      })
      
      // Redirect to intended page or home
      const redirect = useRoute().query.redirect || '/'
      await navigateTo(redirect)
    }
  } catch (error) {
    console.error('Login error:', error)
    
    let errorMessage = 'Login failed. Please try again.'
    
    if (error.data?.statusMessage) {
      errorMessage = error.data.statusMessage
    } else if (error.statusMessage) {
      errorMessage = error.statusMessage
    }
    
    await Swal.fire({
      title: 'Login Failed',
      text: errorMessage,
      icon: 'error',
      background: '#1f2937',
      color: '#fff',
      iconColor: '#ef4444', 
      confirmButtonColor: '#dc2626'
    })
  } finally {
    loading.value = false
  }
}

// Auto-focus email field
onMounted(() => {
  const emailInput = document.getElementById('email')
  if (emailInput) {
    emailInput.focus()
  }
})
</script>