import { defineStore } from 'pinia'
import apiClient from '@/api/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,

    isAdmin: (state) => {
      if (!state.user?.role) return false
      const role = state.user.role
      return typeof role === 'object' ? role.name === 'admin' : role === 'admin'
    },
  },

  actions: {
    async fetchCurrentUser() {
      try {
        const { data } = await apiClient.get('/auth/me')
        this.user = data.user
      } catch (err) {
        this.user = null
      } finally {
        this.initialized = true
      }
    },

    async register(userData) {
      this.loading = true
      this.error = null
      try {
        await apiClient.post('/auth/register', userData)
      } catch (err) {
        this.error = err.response?.data?.message || 'Registration failed'
        throw err
      } finally {
        this.loading = false
      }
    },

    async verifyOtp(email, otp) {
      this.loading = true
      this.error = null
      try {
        const { data } = await apiClient.post('/auth/verify-otp', { email, otp })
        this.user = data.user
        this.initialized = true
        return data
      } catch (err) {
        this.error = err.response?.data?.message || 'Invalid OTP'
        throw err
      } finally {
        this.loading = false
      }
    },

    async login(credentials) {
      this.loading = true
      this.error = null
      try {
        const { data } = await apiClient.post('/auth/login', credentials)
        this.user = data.user
        this.initialized = true
      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed'
        throw err
      } finally {
        this.loading = false
      }
    },

    loginWithGoogle() {
      window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`
    },

    async logout() {
      try {
        await apiClient.post('/auth/logout')
      } finally {
        this.user = null
        this.initialized = true
        window.location.href = '/auth/login'
      }
    },
  },
})
