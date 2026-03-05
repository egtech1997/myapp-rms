import { defineStore } from 'pinia'
import axios from 'axios'

export const useRoleStore = defineStore('roleStore', {
  state: () => ({
    roles: [],
    loading: false,
  }),
  actions: {
    async fetchRoles() {
      this.loading = true
      try {
        const response = await axios.get('/api/v1/roles')
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
        return await axios.patch(`/api/v1/roles/${roleData._id}`, roleData)
      }
      return await axios.post('/api/v1/roles', roleData)
    },
    async deleteRole(id) {
      return await axios.delete(`/api/v1/roles/${id}`)
    },
  },
})
