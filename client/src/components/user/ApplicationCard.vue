<script setup>
import { statusConfig } from '@/utils/statusColors'

defineOptions({ name: 'ApplicationCard' })

const props = defineProps({
  app: { type: Object, required: true },
})

const emit = defineEmits(['click'])

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
</script>

<template>
  <div @click="$emit('click', app)"
    class="bg-white border border-[var(--border-main)] rounded-3xl p-6 flex items-center gap-6 cursor-pointer hover:border-[var(--color-primary)] hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all group relative overflow-hidden">
    
    <!-- Status Bar Accent -->
    <div :class="['absolute left-0 inset-y-0 w-1.5 transition-all group-hover:w-2', statusConfig[app.status]?.class.split(' ')[1].replace('text-', 'bg-') || 'bg-slate-400']"></div>

    <!-- Status Icon Container -->
    <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-all group-hover:rotate-6 group-hover:scale-110', 
        statusConfig[app.status]?.class || 'bg-[var(--bg-app)] text-[var(--text-sub)] border-[var(--border-main)]']">
        <i :class="['pi text-xl', statusConfig[app.status]?.icon || 'pi-file']"></i>
    </div>

    <!-- Main Info -->
    <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1.5">
            <span class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest bg-[var(--color-primary-light)]/40 px-2 py-0.5 rounded-md">
                {{ app.applicationCode || 'REF-PENDING' }}
            </span>
            <span class="w-1 h-1 rounded-full bg-[var(--border-main)]"></span>
            <span class="text-[10px] font-bold text-[var(--text-faint)] tabular-nums">{{ formatDate(app.createdAt) }}</span>
        </div>
        <h3 class="text-base font-black text-[var(--text-main)] truncate tracking-tight group-hover:text-[var(--color-primary)] transition-colors leading-tight uppercase">
            {{ app.job?.positionTitle || 'Untitled Position' }}
        </h3>
        <div class="flex items-center gap-3 mt-3">
            <div class="flex items-center gap-1.5">
                <i class="pi pi-map-marker text-[10px] text-[var(--color-primary)]"></i>
                <span class="text-[10px] font-bold text-[var(--text-muted)] truncate max-w-[120px] uppercase tracking-tighter">
                    {{ Array.isArray(app.job?.placeOfAssignment) ? app.job.placeOfAssignment[0] : app.job?.placeOfAssignment || 'Not Set' }}
                </span>
            </div>
            <div class="flex items-center gap-1.5">
                <i class="pi pi-shield text-[10px] text-amber-500"></i>
                <span class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">SG-{{ app.job?.salaryGrade || '?' }}</span>
            </div>
        </div>
    </div>

    <!-- Status Badge -->
    <div class="flex flex-col items-end gap-3 shrink-0">
        <div :class="['text-[9px] font-black px-3 py-1.5 rounded-xl border-2 uppercase tracking-widest shadow-sm', 
            statusConfig[app.status]?.class || 'bg-[var(--bg-app)] text-[var(--text-sub)] border-[var(--border-main)]']">
            {{ statusConfig[app.status]?.label || app.status }}
        </div>
        <div class="flex items-center -space-x-1.5">
            <div v-for="i in 3" :key="i" class="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden ring-1 ring-slate-100 shadow-sm">
               <i class="pi pi-user text-[10px] text-slate-400"></i>
            </div>
        </div>
    </div>
  </div>
</template>
