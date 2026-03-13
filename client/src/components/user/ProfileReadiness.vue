<script setup>
import { AppButton } from '@/components/ui'

defineOptions({ name: 'ProfileReadiness' })

defineProps({
  profile: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-6 flex flex-col gap-6 shadow-sm">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
        <i class="pi pi-list-check text-green-600 text-xs"></i> Profile Readiness
      </h2>
      <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Checklist</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
       <div v-for="i in 5" :key="i" class="h-11 rounded-xl bg-[var(--bg-app)] animate-pulse"></div>
    </div>

    <div v-else class="space-y-3">
      <div v-for="step in [
        { label: 'Basic Information', done: profile?.name?.firstName },
        { label: 'Educational History', done: profile?.education?.length },
        { label: 'Eligibility / Licenses', done: profile?.eligibility?.length },
        { label: 'Service Records (Experience)', done: profile?.experience?.length },
        { label: 'Training Certificates', done: profile?.training?.length },
      ]" :key="step.label" 
        class="flex items-center justify-between p-3 rounded-xl border transition-all"
        :class="step.done ? 'bg-white border-green-100 shadow-sm' : 'bg-[var(--bg-app)] border-[var(--border-main)] opacity-75'">
        <div class="flex items-center gap-3">
           <div :class="['w-6 h-6 rounded-full flex items-center justify-center text-[10px]', step.done ? 'bg-green-100 text-green-600' : 'bg-[var(--border-main)] text-[var(--text-muted)]']">
             <i :class="['pi', step.done ? 'pi-check' : 'pi-minus']"></i>
           </div>
           <span class="text-xs font-semibold" :class="step.done ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'">{{ step.label }}</span>
        </div>
        <i :class="['pi text-sm', step.done ? 'pi-check-circle text-green-500' : 'pi-circle text-[var(--text-faint)]']"></i>
      </div>
    </div>

    <router-link to="/user/profile" custom v-slot="{ navigate }">
      <AppButton @click="navigate" size="md" variant="secondary" block class="!rounded-xl !text-[11px] !font-black !uppercase !tracking-widest shadow-sm">
        <i class="pi pi-user-edit mr-2"></i> Update Profile
      </AppButton>
    </router-link>
  </div>
</template>
