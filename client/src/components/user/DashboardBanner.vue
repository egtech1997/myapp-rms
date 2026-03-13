<script setup>
import { useAuthStore } from '@/stores/auth'
import { AppButton } from '@/components/ui'

defineOptions({ name: 'DashboardBanner' })

const authStore = useAuthStore()
</script>

<template>
  <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
    <!-- Background Decor -->
    <div class="absolute -top-12 -right-12 w-48 h-48 bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-12 -left-12 w-48 h-48 bg-[var(--text-muted)]/5 rounded-full blur-3xl pointer-events-none"></div>

    <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div class="flex items-center gap-5">
        <div class="relative flex-shrink-0 group">
          <div class="absolute inset-0 bg-[var(--color-primary)] rounded-full blur-md opacity-0 group-hover:opacity-20 transition-opacity"></div>
          <img :src="authStore.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'U')}&background=E2E8F0&color=334155&bold=true`"
            class="w-16 h-16 rounded-full object-cover border-2 border-[var(--border-main)] shadow-sm relative z-10" />
          <span class="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 border-2 border-[var(--surface)] rounded-full z-20"></span>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)] mb-1.5">User Dashboard</p>
          <h1 class="text-xl font-bold text-[var(--text-main)] tracking-tight capitalize flex items-center gap-2">
            Welcome, {{ authStore.user?.username || 'Applicant' }}
            <i class="pi pi-verified text-blue-500 text-sm" v-if="authStore.user?.isVerified"></i>
          </h1>
          <div class="flex flex-wrap items-center gap-2 mt-2.5">
            <span class="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border bg-green-50 text-green-700 border-green-200 uppercase tracking-wider">
              <i class="pi pi-shield text-[10px]"></i> Verified Account
            </span>
            <span class="text-[11px] font-medium text-[var(--text-muted)] border border-[var(--border-main)] px-2.5 py-1 rounded-full bg-[var(--bg-app)]">
              {{ authStore.user?.email }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <router-link to="/user/vacancies" custom v-slot="{ navigate }">
          <AppButton @click="navigate" size="md" icon="pi-briefcase" class="!rounded-xl shadow-md">
            Browse Jobs
          </AppButton>
        </router-link>
        <router-link to="/user/applications" custom v-slot="{ navigate }">
          <AppButton @click="navigate" variant="secondary" size="md" icon="pi-folder-open" class="!rounded-xl border-[var(--border-strong)]">
            My Applications
          </AppButton>
        </router-link>
      </div>
    </div>
  </div>
</template>
