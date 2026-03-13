<script setup>
import { onMounted, ref } from 'vue'
import { useNotificationStore } from '@/stores/notifications'
import { AppBadge, AppButton } from '@/components/ui'

const store = useNotificationStore()
const isOpen = ref(false)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    store.fetchNotifications()
  }
}

const formatDate = (date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = (now - d) / 1000 // seconds

  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleDateString()
}

const handleMarkAsRead = (id) => {
  store.markAsRead(id)
}

onMounted(() => {
  store.fetchNotifications()
})
</script>

<template>
  <div class="relative">
    <!-- Bell Button -->
    <button @click="toggleDropdown" 
      class="relative p-2 rounded-xl border border-[var(--border-main)] bg-white hover:bg-[var(--bg-app)] transition-all group">
      <i class="pi pi-bell text-sm text-[var(--text-muted)] group-hover:text-[var(--color-primary)]"></i>
      <span v-if="store.unreadCount > 0" 
        class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
        {{ store.unreadCount > 9 ? '9+' : store.unreadCount }}
      </span>
    </button>

    <!-- Dropdown Panel -->
    <div v-if="isOpen" 
      class="absolute right-0 mt-3 w-80 bg-white border border-[var(--border-main)] rounded-2xl shadow-xl z-50 overflow-hidden animate-zoom-in">
      
      <!-- Header -->
      <div class="p-4 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--surface-2)]">
        <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Notifications</h3>
        <button v-if="store.unreadCount > 0" 
          @click="store.markAllRead"
          class="text-[10px] font-bold text-[var(--color-primary)] hover:underline">
          Mark all as read
        </button>
      </div>

      <!-- List -->
      <div class="max-h-96 overflow-y-auto custom-scrollbar">
        <div v-if="store.loading && store.notifications.length === 0" class="p-8 text-center">
          <i class="pi pi-spin pi-spinner text-[var(--text-faint)]"></i>
        </div>
        
        <div v-else-if="store.notifications.length === 0" class="p-12 text-center opacity-40">
          <i class="pi pi-inbox text-3xl mb-2"></i>
          <p class="text-xs font-bold uppercase tracking-widest">No notifications</p>
        </div>

        <div v-else v-for="n in store.notifications" :key="n._id"
          @click="handleMarkAsRead(n._id)"
          :class="['p-4 border-b border-[var(--border-main)] cursor-pointer hover:bg-[var(--bg-app)] transition-colors relative', 
            n.status === 'unread' ? 'bg-[var(--color-primary-light)]/30' : 'opacity-80']">
          
          <div v-if="n.status === 'unread'" class="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full"></div>
          
          <div class="flex items-start gap-3 pl-2">
            <div :class="['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border', 
              n.type === 'status_update' ? 'bg-[var(--color-primary-light)] border-[var(--border-main)] text-[var(--color-primary)]' : 'bg-[var(--surface-2)] border-[var(--border-main)] text-[var(--text-muted)]']">
              <i :class="['pi text-xs', n.type === 'status_update' ? 'pi-info-circle' : 'pi-bell']"></i>
            </div>
            
            <div class="flex-1 min-w-0">
              <p class="text-xs font-black text-[var(--text-main)] leading-tight mb-1">{{ n.title }}</p>
              <p class="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-2">{{ n.message }}</p>
              <div class="flex items-center justify-between">
                <span class="text-[9px] font-bold text-[var(--text-faint)] uppercase tracking-tighter">{{ formatDate(n.createdAt) }}</span>
                <i v-if="n.emailSent" class="pi pi-envelope text-[9px] text-green-500" title="Email delivered"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-3 border-t border-[var(--border-main)] bg-[var(--surface-2)] text-center">
        <router-link to="/user/notifications" @click="isOpen = false"
          class="text-[10px] font-bold text-[var(--text-faint)] uppercase hover:text-[var(--text-main)] transition-colors">
          View All Notifications
        </router-link>
      </div>
    </div>

    <!-- Backdrop to close -->
    <div v-if="isOpen" @click="isOpen = false" class="fixed inset-0 z-40 bg-transparent"></div>
  </div>
</template>
