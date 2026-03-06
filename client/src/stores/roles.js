import { defineStore } from 'pinia'
import apiClient from '@/api/axios'

export const useRoleStore = defineStore('roleStore', {
  state: () => ({
    roles: [],
    loading: false,
  }),
  actions: {
    async fetchRoles() {
      this.loading = true
      try {
        const response = await apiClient.get('/v1/roles')
        this.roles = response.data.data
        return this.roles
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    async upsertRole(roleData) {
      if (roleData._id) {
        // 👇 Same here
        return await apiClient.patch(`/v1/roles/${roleData._id}`, roleData)
      }
      return await apiClient.post('/v1/roles', roleData)
    },
    async deleteRole(id) {
      // 👇 And here
      return await apiClient.delete(`/v1/roles/${id}`)
    },
  },
})
