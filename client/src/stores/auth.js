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
      if (!state.user) return false
      return state.user.roles?.some((role) => {
        const roleName = (typeof role === 'object' ? role.name : role)?.toLowerCase()
        return roleName !== 'user' && roleName !== 'applicant'
      })
    },

    dashboardRoute: (state) => {
      if (!state.user) return '/auth/login'
      return state.isAdmin ? '/admin/dashboard' : '/user/dashboard'
    },

    can: (state) => (permission) => {
      if (!state.user) return false
      // Super admin bypasses all checks
      const isSuperAdmin = state.user.roles?.some((r) =>
        (typeof r === 'object' ? r.name : r)?.toLowerCase().includes('super')
      )
      if (isSuperAdmin) return true
      // Check flattened permissions from populated roles
      const perms = state.user.roles?.flatMap((r) =>
        typeof r === 'object' ? (r.permissions ?? []) : []
      ) ?? []
      return perms.includes(permission) || perms.includes('all')
    },
  },

  actions: {
    handleSocialLogin(userData) {
      this.user = userData
      this.initialized = true
    },

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

    async login(credentials) {
      this.loading = true
      try {
        const { data } = await apiClient.post('/auth/login', credentials)
        this.user = data.user
        this.initialized = true
        return data
      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed'
        throw err
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        await apiClient.post('/auth/logout')
      } finally {
        this.user = null
        this.initialized = false
        window.location.href = '/auth/login'
      }
    },
  },
})
