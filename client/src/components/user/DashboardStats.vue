<script setup>
import { AppCard } from '@/components/ui'

defineOptions({ name: 'DashboardStats' })

defineProps({
  total:   { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  active:  { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:border-[var(--border-strong)] transition-colors">
      <div class="w-10 h-10 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center">
        <i class="pi pi-file-edit text-[var(--text-muted)]"></i>
      </div>
      <div>
        <p v-if="loading" class="h-8 w-12 bg-[var(--bg-app)] animate-pulse rounded"></p>
        <p v-else class="text-2xl font-bold text-[var(--text-main)] tracking-tight">{{ total }}</p>
        <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mt-1">Total Apps</p>
      </div>
    </div>

    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:border-[var(--border-strong)] transition-colors">
      <div class="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
        <i class="pi pi-clock text-amber-600"></i>
      </div>
      <div>
        <p v-if="loading" class="h-8 w-12 bg-[var(--bg-app)] animate-pulse rounded"></p>
        <p v-else class="text-2xl font-bold text-[var(--text-main)] tracking-tight">{{ pending }}</p>
        <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mt-1">Awaiting Review</p>
      </div>
    </div>

    <div class="col-span-2 sm:col-span-1 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:border-[var(--border-strong)] transition-colors">
      <div class="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary-ring)]/20 flex items-center justify-center">
        <i class="pi pi-sync text-[var(--color-primary)]"></i>
      </div>
      <div>
        <p v-if="loading" class="h-8 w-12 bg-[var(--bg-app)] animate-pulse rounded"></p>
        <p v-else class="text-2xl font-bold text-[var(--text-main)] tracking-tight">{{ active }}</p>
        <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mt-1">In Process</p>
      </div>
    </div>
  </div>
</template>
