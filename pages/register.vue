<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="mx-auto h-16 w-16 bg-red-600 rounded-lg flex items-center justify-center mb-4">
          <span class="text-2xl font-bold text-white">Z</span>
        </div>
        <h2 class="mt-6 text-3xl font-extrabold text-white">
          Create DayZ Account
        </h2>
        <p class="mt-2 text-sm text-gray-400">
          Already have an account?
          <NuxtLink to="/login" class="font-medium text-red-500 hover:text-red-400">
            Sign in here
          </NuxtLink>
        </p>
      </div>
      
      <!-- Registration Form -->
      <div class="dayz-card p-8">
        <form @submit.prevent="handleRegister" class="space-y-6">
          <!-- Email Field -->
          <div class="dayz-form-group">
            <label for="email" class="dayz-label">
              Email Address *
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
          
          <!-- Name Field -->
          <div class="dayz-form-group">
            <label for="name" class="dayz-label">
              In-Game Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              v-model="form.name"
              :disabled="loading"
              class="dayz-input"
              :class="{ 'border-red-500': errors.name }"
              placeholder="Your DayZ character name"
              maxlength="50"
            />
            <p class="text-xs text-gray-400 mt-1">
              This will be your character name in DayZ (3-50 characters)
            </p>
            <p v-if="errors.name" class="dayz-error">{{ errors.name }}</p>
          </div>
          
          <!-- Steam ID64 Field -->
          <div class="dayz-form-group">
            <label for="steamid64" class="dayz-label">
              Steam ID64 *
            </label>
            <input
              id="steamid64"
              name="steamid64"
              type="text"
              required
              v-model="form.steamid64"
              :disabled="loading"
              class="dayz-input font-mono"
              :class="{ 'border-red-500': errors.steamid64 }"
              placeholder="7656119xxxxxxxxxx"
              maxlength="17"
            />
            <p class="text-xs text-gray-400 mt-1">
              Find your Steam ID64 at 
              <a href="https://steamid.io" target="_blank" class="text-red-400 hover:text-red-300">steamid.io</a>
            </p>
            <p v-if="errors.steamid64" class="dayz-error">{{ errors.steamid64 }}</p>
          </div>
          
          <!-- Password Field -->
          <div class="dayz-form-group">
            <label for="password" class="dayz-label">
              Password *
            </label>
            <div class="relative">
              <input
                id="password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                v-model="form.password"
                :disabled="loading"
                class="dayz-input pr-10"
                :class="{ 'border-red-500': errors.password }"
                placeholder="Create a strong password"
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
            <div class="mt-2">
              <div class="flex items-center space-x-2 text-xs">
                <div class="flex-1 bg-gray-700 rounded-full h-1">
                  <div 
                    class="h-1 rounded-full transition-all duration-300"
                    :class="passwordStrengthColor"
                    :style="{ width: passwordStrength + '%' }"
                  ></div>
                </div>
                <span class="text-gray-400">{{ passwordStrengthText }}</span>
              </div>
            </div>
            <p v-if="errors.password" class="dayz-error">{{ errors.password }}</p>
          </div>
          
          <!-- Confirm Password Field -->
          <div class="dayz-form-group">
            <label for="confirmPassword" class="dayz-label">
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              v-model="form.confirmPassword"
              :disabled="loading"
              class="dayz-input"
              :class="{ 'border-red-500': errors.confirmPassword }"
              placeholder="Confirm your password"
            />
            <p v-if="errors.confirmPassword" class="dayz-error">{{ errors.confirmPassword }}</p>
          </div>
          
          <!-- Terms and Conditions -->
          <div class="flex items-start">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              v-model="form.acceptTerms"
              :disabled="loading"
              class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-800 rounded mt-1"
            />
            <label for="terms" class="ml-2 block text-sm text-gray-400">
              I agree to the 
              <a href="#" class="text-red-500 hover:text-red-400">Terms of Service</a>
               and 
              <a href="#" class="text-red-500 hover:text-red-400">Privacy Policy</a>
            </label>
          </div>
          
          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              :disabled="loading || !form.acceptTerms"
              class="group relative w-full flex justify-center dayz-button-primary"
              :class="{ 'opacity-50 cursor-not-allowed': loading || !form.acceptTerms }"
            >
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg
                  v-if="!loading"
                  class="h-5 w-5 text-red-300 group-hover:text-red-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <div v-else class="loader"></div>
              </span>
              {{ loading ? 'Creating Account...' : 'Create Account' }}
            </button>
          </div>
        </form>
        
        <!-- Info Box -->
        <div class="mt-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
          <div class="flex items-start space-x-3">
            <svg class="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <div class="text-sm text-blue-300">
              <p class="font-medium mb-1">Account Approval Required</p>
              <p class="text-blue-200">
                Your account will need admin approval before you can access the launcher and game.
                You'll receive an email notification once approved.
              </p>
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
  title: 'Register',
  layout: 'default'
})

// State
const user = useState('auth.user')
const loading = ref(false)
const showPassword = ref(false)

const form = reactive({
  email: '',
  name: '',
  steamid64: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const errors = reactive({
  email: '',
  name: '',
  steamid64: '',
  password: '',
  confirmPassword: ''
})

// Redirect if already logged in
if (user.value) {
  await navigateTo('/')
}

// Computed
const passwordStrength = computed(() => {
  const password = form.password
  if (!password) return 0
  
  let strength = 0
  if (password.length >= 6) strength += 20
  if (password.length >= 8) strength += 20
  if (/[a-z]/.test(password)) strength += 20
  if (/[A-Z]/.test(password)) strength += 20
  if (/[0-9]/.test(password)) strength += 10
  if (/[^A-Za-z0-9]/.test(password)) strength += 10
  
  return Math.min(strength, 100)
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength < 40) return 'Weak'
  if (strength < 70) return 'Fair'
  if (strength < 90) return 'Good'
  return 'Strong'
})

const passwordStrengthColor = computed(() => {
  const strength = passwordStrength.value
  if (strength < 40) return 'bg-red-500'
  if (strength < 70) return 'bg-yellow-500'
  if (strength < 90) return 'bg-blue-500'
  return 'bg-green-500'
})

// Methods
const validateForm = () => {
  errors.email = ''
  errors.name = ''
  errors.steamid64 = ''
  errors.password = ''
  errors.confirmPassword = ''
  
  let isValid = true
  
  if (!form.email) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email'
    isValid = false
  }
  
  if (!form.name) {
    errors.name = 'In-game name is required'
    isValid = false
  } else if (form.name.length < 3) {
    errors.name = 'Name must be at least 3 characters'
    isValid = false
  } else if (form.name.length > 50) {
    errors.name = 'Name must be less than 50 characters'
    isValid = false
  }
  
  if (!form.steamid64) {
    errors.steamid64 = 'Steam ID64 is required'
    isValid = false
  } else if (!/^7656119[0-9]{10}$/.test(form.steamid64)) {
    errors.steamid64 = 'Invalid Steam ID64 format'
    isValid = false
  }
  
  if (!form.password) {
    errors.password = 'Password is required'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    isValid = false
  }
  
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    isValid = false
  }
  
  return isValid
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const handleRegister = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        email: form.email,
        name: form.name,
        steamid64: form.steamid64,
        password: form.password,
        confirmPassword: form.confirmPassword
      }
    })
    
    if (response.success) {
      await Swal.fire({
        title: 'Registration Successful!',
        html: `
          <p>Welcome <strong>${form.name}</strong>!</p>
          <p>Your account has been created successfully.</p>
          <br>
          <p class="text-sm text-gray-300">
            Please wait for admin approval before you can access the launcher.
            You'll receive an email notification once approved.
          </p>
        `,
        icon: 'success',
        background: '#1f2937',
        color: '#fff',
        iconColor: '#10b981',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Go to Login'
      })
      
      await navigateTo('/login')
    }
  } catch (error) {
    console.error('Registration error:', error)
    
    let errorMessage = 'Registration failed. Please try again.'
    
    if (error.data?.statusMessage) {
      errorMessage = error.data.statusMessage
    } else if (error.statusMessage) {
      errorMessage = error.statusMessage
    }
    
    await Swal.fire({
      title: 'Registration Failed',
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