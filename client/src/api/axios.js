import axios from 'axios'
import { useAuthStore } from '@/stores/auth.js'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()

      const isAuthCheck = error.config.url.includes('/auth/me')
      const isLoginAttempt = error.config.url.includes('/auth/login')

      if (!isAuthCheck && !isLoginAttempt) {
        authStore.$patch({ user: null, initialized: true })

        if (
          window.location.pathname.startsWith('/admin') ||
          window.location.pathname.startsWith('/user')
        ) {
          window.location.href = '/auth/login?session=expired=true'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
