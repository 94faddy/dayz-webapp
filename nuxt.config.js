// nuxt.config.js
export default defineNuxtConfig({
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0'
  },
  nitro: {
    port: process.env.NITRO_PORT || 2146,
    host: process.env.HOST || '0.0.0.0',
    experimental: {
      wasm: true
    },
    // Security headers เฉพาะ production
    ...(process.env.NODE_ENV === 'production' && {
      security: {
        headers: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      }
    })
  },

  // ✅ DevTools: เปิดใน development, ปิดใน production
  devtools: { 
    enabled: process.env.NODE_ENV === 'development' 
  },
  
  // CSS Framework
  css: ['~/assets/css/main.css'],
  modules: ['@nuxtjs/tailwindcss'],
  
  // Tailwind CSS configuration
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.js',
    exposeConfig: false,
    viewer: process.env.NODE_ENV !== 'production',
  },
  
  // Host allowlist
  vite: {
    server: {
      allowedHosts: process.env.ALLOWED_HOSTS 
        ? process.env.ALLOWED_HOSTS.split(',').map(h => h.trim())
        : process.env.NODE_ENV === 'production' 
          ? []
          : ['localhost', '127.0.0.1']
    }
  },
  
  // Runtime Config
  runtimeConfig: {
    // Private keys (only available on server-side)
    dbHost: process.env.DB_HOST || 'localhost',
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || 'dayz_webapp',
    dbPort: process.env.DB_PORT || '3306',
    sessionSecret: process.env.SESSION_SECRET || 'my-super-secret-session-password-32-chars-minimum!',
    dzlauncherApi: process.env.DZLAUNCHER_API || 'https://dzlupdate-api.nightro.cc/api',
    dzsvApi: process.env.DZSV_API || 'https://dayzserver-api.nightro.cc/api',
    dzsvApiKey: process.env.DZSV_API_KEY || 'fada233b805f23a37d141b5577241fac2a004f2bfc6607264e38e59a040b718d',
    webhookSecret: process.env.WEBHOOK_SECRET || 'dayz-webhook-secret',
    
    // Public keys (exposed to client-side)
    public: {
      apiBase: '/api',
      dzlauncherApi: process.env.DZLAUNCHER_API || 'https://dzlupdate-api.nightro.cc/api'
    }
  },

  // ✅ SSR: เปิดเฉพาะ production
  ssr: false,
  
  // Development-specific optimizations
  ...(process.env.NODE_ENV === 'development' && {
    experimental: {
      payloadExtraction: false,
      renderJsonPayloads: false
    }
  }),

  // PostCSS configuration
  postcss: {
    plugins: {
      autoprefixer: {},
      ...(process.env.NODE_ENV === 'production' && {
        cssnano: { preset: 'default' }
      })
    }
  },

  // App config
  app: {
    head: {
      title: 'DayZ Nightro',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'DayZ Nightro อันดับหนึ่งในไทย' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  }
})