<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import apiClient from '@/api/axios'

// Components
import DashboardBanner from '@/components/user/DashboardBanner.vue'
import DashboardStats from '@/components/user/DashboardStats.vue'
import DashboardRecentApps from '@/components/user/DashboardRecentApps.vue'
import ProfileReadiness from '@/components/user/ProfileReadiness.vue'
import DashboardProfileCard from '@/components/user/DashboardProfileCard.vue'

defineOptions({ name: 'UserDashboard' })

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

// State
const applications = ref([])
const loadingApps  = ref(false)
const profile      = ref(null)
const loadingProfile = ref(false)

// Stats
const stats = computed(() => ({
  total:   applications.value.length,
  pending: applications.value.filter(a => a.status === 'applied').length,
  active:  applications.value.filter(a => ['verifying', 'comparative_assessment'].includes(a.status)).length,
}))

const recentApps = computed(() => 
  [...applications.value]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
)

// Data Fetching
const fetchData = async () => {
  loadingApps.value = true
  loadingProfile.value = true
  
  try {
    const [appsRes, profileRes] = await Promise.all([
      apiClient.get('/v1/applications/my-applications'),
      apiClient.get('/v1/profile/me'),
      notificationStore.fetchNotifications()
    ])
    
    applications.value = appsRes.data.data || []
    profile.value      = profileRes.data.data || null
  } catch (err) {
    console.error('Dashboard data load failed:', err)
  } finally {
    loadingApps.value = false
    loadingProfile.value = false
  }
}

onMounted(fetchData)
onActivated(fetchData)
</script>

<template>
  <div class="flex flex-col gap-8 pb-12 animate-fade-in">
    
    <!-- 1. Welcome Banner -->
    <DashboardBanner />

    <!-- 2. High-level Stats -->
    <DashboardStats 
      :total="stats.total" 
      :pending="stats.pending" 
      :active="stats.active" 
      :loading="loadingApps" 
    />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 3. Left Column: Recent Apps -->
      <div class="lg:col-span-2 flex flex-col gap-8">
        <DashboardRecentApps 
          :applications="recentApps" 
          :loading="loadingApps" 
        />
        
        <!-- Quick Action Links -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <router-link to="/user/vacancies"
            class="bg-white border border-[var(--border-main)] rounded-2xl p-5 flex items-center gap-4 hover:border-[var(--color-primary-ring)] hover:shadow-md transition-all group">
            <div class="w-12 h-12 rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary-ring)]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <i class="pi pi-briefcase text-[var(--color-primary)] text-lg"></i>
            </div>
            <div>
              <p class="text-sm font-bold text-[var(--text-main)]">Find Vacancies</p>
              <p class="text-[11px] text-[var(--text-muted)] mt-0.5 font-medium uppercase tracking-wider">Explore open roles</p>
            </div>
            <i class="pi pi-arrow-right text-[var(--text-faint)] ml-auto text-sm group-hover:translate-x-1 transition-transform"></i>
          </router-link>

          <router-link to="/user/applications"
            class="bg-white border border-[var(--border-main)] rounded-2xl p-5 flex items-center gap-4 hover:border-emerald-300 hover:shadow-md transition-all group">
            <div class="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <i class="pi pi-folder-open text-emerald-600 text-lg"></i>
            </div>
            <div>
              <p class="text-sm font-bold text-[var(--text-main)]">My Submissions</p>
              <p class="text-[11px] text-[var(--text-muted)] mt-0.5 font-medium uppercase tracking-wider">Track progress</p>
            </div>
            <i class="pi pi-arrow-right text-[var(--text-faint)] ml-auto text-sm group-hover:translate-x-1 transition-transform"></i>
          </router-link>
        </div>
      </div>

      <!-- 4. Right Column: Readiness & Notifications -->
      <div class="flex flex-col gap-8">
        <!-- Profile Readiness -->
        <ProfileReadiness 
          :profile="profile" 
          :loading="loadingProfile" 
        />

        <!-- Recent Notifications -->
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--surface-2)]">
            <h2 class="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <i class="pi pi-bell text-[var(--color-primary)] text-xs"></i> Alerts
            </h2>
            <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">{{ notificationStore.unreadCount }} Unread</span>
          </div>
          <div class="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
            <div v-if="notificationStore.loading && !notificationStore.notifications.length" class="p-8 text-center">
              <i class="pi pi-spin pi-spinner text-[var(--text-faint)]"></i>
            </div>
            <div v-else-if="!notificationStore.notifications.length" class="py-16 flex flex-col items-center gap-3 text-[var(--text-faint)]">
              <i class="pi pi-inbox text-3xl opacity-20"></i>
              <p class="text-[10px] font-black uppercase tracking-widest">Inbox is empty</p>
            </div>
            <div v-else class="divide-y divide-[var(--border-main)]">
              <div v-for="n in notificationStore.notifications.slice(0, 5)" :key="n._id"
                class="px-6 py-4 flex items-start gap-4 hover:bg-[var(--bg-app)] transition-colors group cursor-pointer"
                @click="notificationStore.markAsRead(n._id)">
                <div :class="['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border transition-colors', 
                  n.status === 'unread' ? 'bg-[var(--color-primary-light)] border-[var(--color-primary-ring)]/20 text-[var(--color-primary)]' : 'bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-faint)]']">
                  <i :class="['pi text-[10px]', n.type === 'status_update' ? 'pi-info-circle' : 'pi-bell']"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start mb-0.5">
                    <p :class="['text-[11px] truncate transition-all', n.status === 'unread' ? 'font-bold text-[var(--text-main)]' : 'font-medium text-[var(--text-muted)]']">{{ n.title }}</p>
                    <span class="text-[9px] font-bold text-[var(--text-faint)] uppercase whitespace-nowrap ml-2">{{ n.createdAt.split('T')[0] }}</span>
                  </div>
                  <p class="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">{{ n.message }}</p>
                </div>
              </div>
            </div>
          </div>
          <div v-if="notificationStore.notifications.length > 5" class="p-3 border-t border-[var(--border-main)] text-center bg-[var(--surface-2)]">
             <router-link to="/user/notifications" class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors">
               View All Notifications
             </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. Profile Detailed Summary -->
    <DashboardProfileCard 
      :profile="profile" 
      :loading="loadingProfile" 
    />

  </div>
</template>
