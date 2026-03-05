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

    // ✅ Staff logic: Checks if user has any administrative-level role
    isStaff: (state) => {
      if (!state.user?.roles) return false
      const staffRoles = ['admin', 'super_admin', 'hr_manager', 'registrar']
      return state.user.roles.some((role) => staffRoles.includes(role))
    },

    // ✅ Permission Check: Does the user have a specific permission?
    // Usage: authStore.can('edit_user')
    can: (state) => (permission) => {
      if (!state.user) return false
      if (state.user.roles?.includes('super_admin')) return true // God mode
      return state.user.permissions?.includes(permission) || false
    },

    dashboardRoute: (state) => {
      if (!state.user) return '/auth/login'
      return state.isStaff ? '/admin/dashboard' : '/user/dashboard'
    },

    hasRole: (state) => (roleName) => {
      return state.user?.roles?.includes(roleName) || false
    },
  },

  actions: {
    // 1. Initial Load: Check if we are already logged in via cookie
    async fetchCurrentUser() {
      if (this.initialized) return
      try {
        const { data } = await apiClient.get('/auth/me')
        this.user = data.user
      } catch (err) {
        this.user = null
      } finally {
        this.initialized = true
      }
    },

    // 2. Standard Registration
    async register(userData) {
      this.loading = true
      this.error = null
      try {
        const { data } = await apiClient.post('/auth/register', userData)
        return data // Will likely tell user to check email for OTP
      } catch (err) {
        this.error = err.response?.data?.message || 'Registration failed'
        throw err
      } finally {
        this.loading = false
      }
    },

    // 3. OTP Verification
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

    // 4. Standard Login
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

    handleSocialLogin(userData) {
      this.user = userData
      this.initialized = true
    },

    async logout() {
      try {
        await apiClient.post('/auth/logout')
      } finally {
        this.user = null
        this.initialized = true

        window.location.href = '/'
      }
    },
  },
})
