import axios from 'axios'
import { useAuthStore } from '@/stores/auth' // 👈 Import store

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

      authStore.$patch({ user: null, isAuthenticated: false })

      if (!window.location.pathname.startsWith('/')) {
        window.location.href = '/?session=expired=true'
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
