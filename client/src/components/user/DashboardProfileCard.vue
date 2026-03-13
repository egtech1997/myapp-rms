<script setup>
import { computed } from 'vue'
import { AppButton } from '@/components/ui'

defineOptions({ name: 'DashboardProfileCard' })

const props = defineProps({
  profile: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})

const profileComplete = computed(() => {
  if (!props.profile) return 0
  const p = props.profile
  const checks = [
    !!(p.name?.firstName && p.name?.lastName),
    !!(p.ethnicGroup && p.religion && p.disability),
    (p.education?.length || 0) > 0,
    (p.eligibility?.length || 0) > 0,
    (p.experience?.length || 0) > 0,
    (p.training?.length || 0) > 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
})

const getBarColor = (val) => {
  if (val >= 80) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
  if (val >= 50) return 'bg-amber-400'
  return 'bg-rose-500'
}
</script>

<template>
  <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-sm">
    <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--surface-2)]">
      <h2 class="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
        <i class="pi pi-id-card text-[var(--text-muted)] text-xs"></i> My Application Profile
      </h2>
      <router-link to="/user/profile" class="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] hover:underline flex items-center gap-1.5 transition-all">
        <i class="pi pi-pencil text-[10px]"></i> Edit Profile
      </router-link>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-8 flex flex-col gap-6">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-[var(--bg-app)] animate-pulse"></div>
        <div class="space-y-2">
          <div class="h-4 w-48 rounded bg-[var(--bg-app)] animate-pulse"></div>
          <div class="h-3 w-32 rounded bg-[var(--bg-app)] animate-pulse"></div>
        </div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="h-20 rounded-xl bg-[var(--bg-app)] animate-pulse"></div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!profile" class="p-12 flex flex-col items-center text-center gap-5 bg-gradient-to-b from-white to-[var(--bg-app)]">
      <div class="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-inner">
        <i class="pi pi-exclamation-triangle text-2xl"></i>
      </div>
      <div class="max-w-xs">
        <p class="text-sm font-bold text-[var(--text-main)]">Profile setup required</p>
        <p class="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
          Your personal data sheet (PDS) is missing. Complete it now to enable application features.
        </p>
      </div>
      <router-link to="/user/profile" custom v-slot="{ navigate }">
        <AppButton @click="navigate" size="md" icon="pi-user-plus" class="!rounded-xl shadow-lg">
           Initialize Profile
        </AppButton>
      </router-link>
    </div>

    <!-- Profile Detail -->
    <div v-else class="p-6 flex flex-col gap-8">
      <!-- Top Section -->
      <div class="flex items-start justify-between gap-6">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-2xl bg-[var(--color-primary-light)] border border-[var(--color-primary-ring)]/20 flex items-center justify-center flex-shrink-0 shadow-sm relative group overflow-hidden">
            <i class="pi pi-user text-[var(--color-primary)] text-xl relative z-10 transition-transform group-hover:scale-110"></i>
            <div class="absolute inset-0 bg-gradient-to-br from-transparent to-[var(--color-primary)]/10"></div>
          </div>
          <div class="min-w-0">
            <p class="text-[11px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-0.5">Full Name</p>
            <p class="text-base font-bold text-[var(--text-main)] capitalize tracking-tight truncate">
              {{ [profile.name?.firstName, profile.name?.middleName, profile.name?.lastName].filter(Boolean).join(' ') || 'Not Set' }}
            </p>
            <p class="text-xs text-[var(--text-muted)] font-medium mt-1 flex items-center gap-1.5">
              <i class="pi pi-map-marker text-[10px]"></i>
              {{ [profile.address?.municipality, profile.address?.province].filter(Boolean).join(', ') || 'No address' }}
            </p>
          </div>
        </div>

        <div class="text-right flex flex-col items-end">
           <p class="text-[11px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-1">Completeness</p>
           <div class="flex items-center gap-2">
              <span :class="['text-xl font-black tracking-tighter', profileComplete >= 80 ? 'text-emerald-600' : profileComplete >= 50 ? 'text-amber-500' : 'text-rose-500']">
                {{ profileComplete }}%
              </span>
           </div>
        </div>
      </div>

      <!-- Progressive Bar -->
      <div class="relative w-full h-2.5 bg-[var(--bg-app)] rounded-full overflow-hidden shadow-inner">
        <div :class="['absolute inset-y-0 left-0 transition-all duration-1000 ease-out rounded-full', getBarColor(profileComplete)]"
             :style="{ width: profileComplete + '%' }">
        </div>
        <!-- Shine effect -->
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style="background-size: 200% 100%;"></div>
      </div>

      <!-- Metrics Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div v-for="item in [
          { label: 'Education',    count: profile.education?.length   || 0, icon: 'pi-graduation-cap', color: 'text-blue-600' },
          { label: 'Eligibility',  count: profile.eligibility?.length || 0, icon: 'pi-verified',       color: 'text-purple-600' },
          { label: 'Trainings',    count: profile.training?.length    || 0, icon: 'pi-book',           color: 'text-amber-600' },
          { label: 'Experience',   count: profile.experience?.length  || 0, icon: 'pi-briefcase',      color: 'text-emerald-600' },
        ]" :key="item.label"
          class="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-[var(--border-main)] bg-white hover:border-[var(--border-strong)] transition-all group">
          <div class="w-8 h-8 rounded-full bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-faint)] group-hover:scale-110 group-hover:text-[var(--text-main)] transition-all">
            <i :class="['pi text-xs', item.icon]"></i>
          </div>
          <div class="text-center">
            <p class="text-xl font-bold text-[var(--text-main)] tracking-tighter">{{ item.count }}</p>
            <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mt-0.5">{{ item.label }}</p>
          </div>
        </div>
      </div>

      <!-- Incomplete Nudge -->
      <div v-if="profileComplete < 100" 
        class="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
        <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0 animate-pulse">
           <i class="pi pi-info-circle"></i>
        </div>
        <div class="flex-1">
           <p class="text-xs font-bold text-amber-900">Your profile is missing data</p>
           <p class="text-[11px] text-amber-700 mt-0.5">Complete your PDS to improve your chances in the selection process.</p>
        </div>
        <router-link to="/user/profile" class="text-xs font-black uppercase tracking-widest text-amber-900 bg-amber-200 px-4 py-2 rounded-lg hover:bg-amber-300 transition-colors">
           Fix Now
        </router-link>
      </div>
    </div>
  </div>
</template>
