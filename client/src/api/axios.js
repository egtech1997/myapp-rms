import axios from 'axios'
import { useAuthStore } from '@/stores/auth' // 👈 Import store

const apiClient = axios.create({
  // Ensure this matches your backend's actual running port
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 means "Unauthorized" (Token expired or not found)
    if (error.response?.status === 401) {
      const authStore = useAuthStore()

      // Clear local user state so they aren't stuck in a "half-logged-in" UI
      authStore.$patch({ user: null, isAuthenticated: false })

      // Only redirect if they aren't already on the login/home page
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login?expired=true'
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
