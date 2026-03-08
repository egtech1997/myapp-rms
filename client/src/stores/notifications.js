import { defineStore } from 'pinia'
import apiClient from '@/api/axios'

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [],
    loading: false,
    unreadCount: 0
  }),

  actions: {
    async fetchNotifications() {
      this.loading = true
      try {
        const { data } = await apiClient.get('/v1/notifications/me')
        this.notifications = data.data
        this.updateUnreadCount()
      } catch (err) {
        console.error('Failed to fetch notifications', err)
      } finally {
        this.loading = false
      }
    },

    updateUnreadCount() {
      this.unreadCount = this.notifications.filter(n => n.status === 'unread').length
    },

    async markAsRead(id) {
      try {
        await apiClient.patch(`/v1/notifications/${id}/read`)
        const n = this.notifications.find(n => n._id === id)
        if (n) {
          n.status = 'read'
          this.updateUnreadCount()
        }
      } catch (err) {
        console.error('Failed to mark notification as read', err)
      }
    },

    async markAllRead() {
      try {
        await apiClient.patch('/v1/notifications/mark-all-read')
        this.notifications.forEach(n => n.status = 'read')
        this.unreadCount = 0
      } catch (err) {
        console.error('Failed to mark all as read', err)
      }
    }
  }
})
