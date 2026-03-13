<script setup>
import { statusConfig } from '@/utils/statusColors'
import { AppBadge } from '@/components/ui'

defineOptions({ name: 'DashboardRecentApps' })

defineProps({
  applications: { type: Array, default: () => [] },
  loading:      { type: Boolean, default: false },
})

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
</script>

<template>
  <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-sm">
    <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--surface-2)]">
      <h2 class="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
        <i class="pi pi-history text-[var(--text-muted)] text-xs"></i> Recent Submissions
      </h2>
      <router-link to="/user/applications" class="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] hover:underline flex items-center gap-1.5 transition-all">
        View all <i class="pi pi-arrow-right text-[10px]"></i>
      </router-link>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-6 flex flex-col gap-3">
      <div v-for="i in 3" :key="i" class="h-16 rounded-xl bg-[var(--bg-app)] animate-pulse"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="applications.length === 0" class="py-16 flex flex-col items-center gap-4 text-[var(--text-muted)]">
      <div class="w-16 h-16 rounded-full bg-[var(--bg-app)] flex items-center justify-center">
        <i class="pi pi-folder-open text-3xl text-[var(--text-faint)]"></i>
      </div>
      <div class="text-center">
        <p class="text-sm font-bold text-[var(--text-main)]">No applications found</p>
        <p class="text-xs mt-1">Ready to start your journey? Explore open positions.</p>
      </div>
      <router-link to="/user/vacancies"
        class="text-xs font-black uppercase tracking-widest text-[var(--color-primary)] bg-[var(--color-primary-light)] px-5 py-2.5 rounded-xl hover:shadow-md transition-all">
        Browse Vacancies
      </router-link>
    </div>

    <!-- List -->
    <div v-else class="divide-y divide-[var(--border-main)]">
      <div v-for="app in applications" :key="app._id" 
        class="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[var(--bg-app)] transition-colors group">
        <div class="min-w-0 flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-white border border-[var(--border-main)] flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
             <i class="pi pi-briefcase text-[var(--text-muted)] text-sm"></i>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-bold text-[var(--text-main)] truncate group-hover:text-[var(--color-primary)] transition-colors">
              {{ app.job?.positionTitle || 'Position' }}
            </p>
            <div class="flex items-center gap-2 mt-1">
              <p class="text-[11px] font-medium text-[var(--text-faint)]">Applied {{ formatDate(app.createdAt) }}</p>
              <span class="w-1 h-1 rounded-full bg-[var(--border-strong)]"></span>
              <p class="text-[11px] font-medium text-[var(--text-faint)] uppercase">{{ app.job?.itemNumber || '—' }}</p>
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <AppBadge :variant="app.status" size="sm" class="!px-3 !py-1.5 shadow-sm">
            {{ statusConfig[app.status]?.label || app.status }}
          </AppBadge>
          <router-link :to="`/user/applications`" class="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-white border border-transparent hover:border-[var(--border-main)] transition-all">
            <i class="pi pi-chevron-right text-xs"></i>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
