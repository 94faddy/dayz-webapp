<template>
  <div class="min-h-screen py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-white mb-4">
          Download DayZ Launcher
        </h1>
        <p class="text-xl text-gray-400 max-w-2xl mx-auto">
          Get the latest version of our advanced DayZ launcher with automatic updates, 
          file verification, and integrated features.
        </p>
      </div>
      
      <!-- Main Download Card -->
      <div class="dayz-card p-8 mb-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <!-- Download Info -->
          <div>
            <div class="flex items-center space-x-4 mb-6">
              <div class="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
              </div>
              <div>
                <h2 class="text-2xl font-bold text-white">DayZ Launcher</h2>
                <p class="text-gray-400">Version {{ launcherInfo.version }}</p>
              </div>
            </div>
            
            <div class="space-y-4 mb-6">
              <div class="flex items-center space-x-3">
                <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span class="text-gray-300">Automatic game updates</span>
              </div>
              <div class="flex items-center space-x-3">
                <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span class="text-gray-300">File integrity verification</span>
              </div>
              <div class="flex items-center space-x-3">
                <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span class="text-gray-300">Smart caching system</span>
              </div>
              <div class="flex items-center space-x-3">
                <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span class="text-gray-300">User authentication system</span>
              </div>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-4">
              <button 
                @click="downloadLauncher"
                :disabled="downloading"
                class="dayz-button-primary flex items-center justify-center space-x-2"
                :class="{ 'opacity-50 cursor-not-allowed': downloading }"
              >
                <svg v-if="!downloading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                <div v-else class="loader"></div>
                <span>{{ downloading ? 'Preparing Download...' : 'Download Launcher' }}</span>
              </button>
              
              <button 
                @click="showSystemRequirements"
                class="dayz-button-secondary flex items-center justify-center space-x-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>System Requirements</span>
              </button>
            </div>
          </div>
          
          <!-- Download Stats -->
          <div class="bg-gray-900 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Download Information</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-400">File Size:</span>
                <span class="text-white font-medium">{{ launcherInfo.fileSize }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Release Date:</span>
                <span class="text-white font-medium">{{ launcherInfo.releaseDate }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Downloads:</span>
                <span class="text-white font-medium">{{ formatNumber(launcherInfo.downloadCount) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Platform:</span>
                <span class="text-white font-medium">Windows 10/11</span>
              </div>
            </div>
            
            <div class="mt-6 pt-4 border-t border-gray-700">
              <div class="flex items-center space-x-2 text-sm text-gray-400">
                <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span>Virus scanned and secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Installation Instructions -->
      <div class="dayz-card p-8 mb-8">
        <h3 class="text-2xl font-bold text-white mb-6">Installation Instructions</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-white font-bold text-xl">1</span>
            </div>
            <h4 class="text-lg font-semibold text-white mb-2">Download</h4>
            <p class="text-gray-400 text-sm">
              Click the download button above to get the latest launcher executable file.
            </p>
          </div>
          
          <div class="text-center">
            <div class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-white font-bold text-xl">2</span>
            </div>
            <h4 class="text-lg font-semibold text-white mb-2">Extract</h4>
            <p class="text-gray-400 text-sm">
              Extract the launcher to your DayZ installation folder (where DayZ_x64.exe is located).
            </p>
          </div>
          
          <div class="text-center">
            <div class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-white font-bold text-xl">3</span>
            </div>
            <h4 class="text-lg font-semibold text-white mb-2">Run & Login</h4>
            <p class="text-gray-400 text-sm">
              Run the launcher, login with your account, and enjoy automatic updates!
            </p>
          </div>
        </div>
      </div>
      
      <!-- FAQ Section -->
      <div class="dayz-card p-8">
        <h3 class="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h3>
        <div class="space-y-6">
          <div v-for="faq in faqs" :key="faq.id" class="border-b border-gray-700 pb-4 last:border-b-0">
            <button 
              @click="toggleFaq(faq.id)"
              class="flex justify-between items-center w-full text-left"
            >
              <h4 class="text-lg font-medium text-white">{{ faq.question }}</h4>
              <svg 
                class="w-5 h-5 text-gray-400 transform transition-transform duration-200"
                :class="{ 'rotate-180': openFaqs.includes(faq.id) }"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <Transition name="fade">
              <div v-if="openFaqs.includes(faq.id)" class="mt-4 text-gray-400">
                <p>{{ faq.answer }}</p>
              </div>
            </Transition>
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
  title: 'Download',
  layout: 'default'
})

// State
const downloading = ref(false)
const openFaqs = ref([])

// Launcher info (mock data - replace with API call)
const launcherInfo = reactive({
  version: '5.7.31',
  fileSize: '2.4 MB',
  releaseDate: 'Jan 15, 2025',
  downloadCount: 15847
})

// FAQs
const faqs = [
  {
    id: 1,
    question: 'Do I need to create an account to use the launcher?',
    answer: 'Yes, you need to create an account and wait for admin approval before you can use the launcher to update and play DayZ.'
  },
  {
    id: 2,
    question: 'Is the launcher safe to use?',
    answer: 'Absolutely! Our launcher is digitally signed, virus-scanned, and uses secure connections. It only modifies DayZ game files and does not access any personal data.'
  },
  {
    id: 3,
    question: 'Can I use this launcher with any DayZ server?',
    answer: 'This launcher is specifically designed for our DayZ server. It includes custom configurations and mod management tailored to our server setup.'
  },
  {
    id: 4,
    question: 'What if I encounter issues with the launcher?',
    answer: 'If you experience any problems, please contact our support team through the Contact button in the launcher or visit our Discord server for community help.'
  },
  {
    id: 5,
    question: 'How do I update the launcher?',
    answer: 'The launcher will automatically check for updates when you start it. If an update is available, it will download and install automatically.'
  }
]

// Methods
const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num)
}

const downloadLauncher = async () => {
  downloading.value = true
  
  try {
    // Simulate download preparation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Create download link
    const downloadUrl = '/downloads/DayZ-Launcher-Setup.exe'
    
    // Create temporary link and trigger download
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `DayZ-Launcher-v${launcherInfo.version}.exe`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Update download count (mock)
    launcherInfo.downloadCount++
    
    await Swal.fire({
      title: 'Download Started!',
      html: `
        <div class="text-left">
          <p class="mb-4">Your download has started successfully.</p>
          <p class="text-sm text-gray-300 mb-2"><strong>Next steps:</strong></p>
          <ol class="text-sm text-gray-300 space-y-1 list-decimal list-inside">
            <li>Extract the launcher to your DayZ folder</li>
            <li>Run DZL-Update.exe as administrator</li>
            <li>Login with your account credentials</li>
            <li>Wait for the initial update to complete</li>
          </ol>
        </div>
      `,
      icon: 'success',
      background: '#1f2937',
      color: '#fff',
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Got it!'
    })
    
  } catch (error) {
    console.error('Download error:', error)
    
    await Swal.fire({
      title: 'Download Failed',
      text: 'Sorry, there was an issue starting the download. Please try again or contact support.',
      icon: 'error',
      background: '#1f2937',
      color: '#fff',
      confirmButtonColor: '#dc2626'
    })
  } finally {
    downloading.value = false
  }
}

const showSystemRequirements = async () => {
  await Swal.fire({
    title: 'System Requirements',
    html: `
      <div class="text-left space-y-4">
        <div>
          <h4 class="font-semibold text-white mb-2">Minimum Requirements:</h4>
          <ul class="text-sm text-gray-300 space-y-1">
            <li>• Windows 10 64-bit (version 1903 or later)</li>
            <li>• .NET Framework 4.8 or later</li>
            <li>• 50 MB free disk space</li>
            <li>• Internet connection for updates</li>
            <li>• Administrator privileges (for installation)</li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-semibold text-white mb-2">For DayZ Game:</h4>
          <ul class="text-sm text-gray-300 space-y-1">
            <li>• Windows 10 64-bit</li>
            <li>• Intel Core i5-4430 / AMD FX-6300</li>
            <li>• 8 GB RAM</li>
            <li>• NVIDIA GTX 760 / AMD R9 270X</li>
            <li>• 16 GB available space</li>
          </ul>
        </div>
      </div>
    `,
    background: '#1f2937',
    color: '#fff',
    confirmButtonColor: '#dc2626',
    confirmButtonText: 'Close',
    width: '500px'
  })
}

const toggleFaq = (faqId) => {
  const index = openFaqs.value.indexOf(faqId)
  if (index === -1) {
    openFaqs.value.push(faqId)
  } else {
    openFaqs.value.splice(index, 1)
  }
}

// Load launcher info on mount
onMounted(async () => {
  try {
    // Replace with actual API call to get launcher info
    // const info = await $fetch('/api/launcher/info')
    // Object.assign(launcherInfo, info)
  } catch (error) {
    console.log('Could not fetch launcher info:', error)
  }
})
</script>