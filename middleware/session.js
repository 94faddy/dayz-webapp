// middleware/session.js
export default defineNuxtRouteMiddleware((to, from) => {
  // Client-side session check
  if (process.client) {
    const user = useState('auth.user', () => null)
    
    // Routes that require authentication
    const protectedRoutes = ['/profile', '/store/checkout', '/admin']
    const adminRoutes = ['/admin']
    
    if (protectedRoutes.some(route => to.path.startsWith(route))) {
      if (!user.value) {
        return navigateTo('/login')
      }
      
      // Check admin routes
      if (adminRoutes.some(route => to.path.startsWith(route))) {
        if (!user.value.isAdmin) {
          throw createError({
            statusCode: 403,
            statusMessage: 'Access Denied'
          })
        }
      }
    }
    
    // Redirect logged-in users away from auth pages
    if (['/login', '/register'].includes(to.path) && user.value) {
      return navigateTo('/')
    }
  }
})