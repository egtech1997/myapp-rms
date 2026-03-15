import axios from 'axios'
import { useAuthStore } from '@/stores/auth.js'
import Swal from 'sweetalert2'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // 👈 Required for cookies
  headers: { Accept: 'application/json' },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const authStore = useAuthStore()

    // Handle Network Errors (Connection Refused)
    if (!error.response) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        icon: 'error',
        title: 'Server Unreachable',
        text: 'The API server is not running or connection was refused.',
        background: 'var(--surface)',
        color: 'var(--text-main)',
      })
      return Promise.reject(new Error('Network Error: Server is unreachable'))
    }

    const isAuthCheck = error.config.url.includes('/auth/me')
    const isLoginAttempt = error.config.url.includes('/auth/login')

    if (error.response?.status === 401) {
      // Case 1: Wrong credentials on login page — let Login.vue handle it
      if (isLoginAttempt) {
        return Promise.reject(error)
      }

      // Case 2: Session expired or token invalid
      const wasLoggedIn = !!authStore.user
      authStore.$patch({ user: null, initialized: true })

      // Redirect if the user was actively logged in (not just an unauthenticated page load)
      if (wasLoggedIn && window.location.pathname.match(/^\/(admin|user)/)) {
        window.location.href = '/auth/login?session=expired'
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
