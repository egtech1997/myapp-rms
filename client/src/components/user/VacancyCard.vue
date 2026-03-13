<script setup>
import { computed } from 'vue'

defineOptions({ name: 'VacancyCard' })

const props = defineProps({
  job: { type: Object, required: true },
  matchStatus: { type: Object, default: null },
})

const emit = defineEmits(['click'])

// Helpers for Deadline
const daysLeft = (d) => {
  if (!d) return 0
  const diff = new Date(d) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const deadlineLabel = (d) => {
  if (!d) return '—'
  const days = daysLeft(d)
  if (days < 0)  return 'Expired'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days <= 7)  return `${days} days left`
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

const deadlineClass = (d) => {
  if (!d) return 'text-[var(--text-muted)]'
  const days = daysLeft(d)
  if (days < 0)  return 'text-red-400'
  if (days <= 7) return 'text-amber-500 font-black'
  return 'text-[var(--text-sub)]'
}

// Track Classes
const trackStyles = {
  teaching:         { label: 'Teaching',    pill: 'bg-blue-50 text-blue-700 border-blue-100',      border: 'border-l-blue-600' },
  teaching_related: { label: 'T-Related',   pill: 'bg-purple-50 text-purple-700 border-purple-100', border: 'border-l-purple-600' },
  non_teaching:     { label: 'Non-Teaching', pill: 'bg-amber-50 text-amber-700 border-amber-100',    border: 'border-l-amber-600' },
}

const style = computed(() => trackStyles[props.job.hiringTrack] || trackStyles.non_teaching)
</script>

<template>
  <div @click="$emit('click', job)"
    :class="['relative bg-white border border-l-4 border-[var(--border-main)] rounded-2xl p-6 hover:shadow-xl hover:border-[var(--color-primary-ring)] transition-all group cursor-pointer flex flex-col gap-5', style.border]">
    
    <!-- Top Row: Track & QS -->
    <div class="flex items-center justify-between">
      <span :class="['text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider', style.pill]">
        {{ style.label }}
      </span>
      
      <!-- QS Badge -->
      <div v-if="matchStatus" class="relative group/qs">
        <div v-if="matchStatus.isQualified" 
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-widest shadow-sm">
          <i class="pi pi-check-circle text-[10px]"></i> Qualified
        </div>
        <div v-else
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-app)] text-[var(--text-faint)] border border-[var(--border-main)] text-[9px] font-black uppercase tracking-widest cursor-help">
          <i class="pi pi-info-circle text-[10px]"></i> Check QS
        </div>

        <!-- Tooltip Breakdown -->
        <div class="invisible group-hover/qs:visible absolute right-0 top-full mt-3 w-64 bg-[var(--color-navy)] text-white rounded-2xl p-5 shadow-2xl z-50 text-[10px] animate-fade-in ring-1 ring-white/10">
          <p class="font-black mb-4 uppercase tracking-[0.2em] text-white/40 border-b border-white/10 pb-2">Qualification Status</p>
          <div class="space-y-3">
            <div v-for="c in matchStatus.criteria" :key="c.label" class="flex justify-between items-start gap-4">
              <span class="text-white/60 font-medium">{{ c.label }}</span>
              <div class="text-right">
                <p :class="c.met ? 'text-emerald-400 font-bold' : 'text-rose-400 font-black'">{{ c.act }}</p>
                <p class="text-[9px] text-white/30 uppercase mt-0.5">Req: {{ c.req }}</p>
              </div>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-white/5 text-white/30 italic text-[9px] leading-relaxed">
             This match is based on your current profile data.
          </div>
        </div>
      </div>
    </div>

    <!-- Title & Assignment -->
    <div class="flex-1">
      <h2 class="text-base font-bold text-[var(--text-main)] leading-snug mb-1.5 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2 uppercase tracking-tight">
        {{ job.positionTitle }}
      </h2>
      <p class="text-xs text-[var(--text-muted)] font-semibold flex items-center gap-2">
        <i class="pi pi-map-marker text-[10px] text-[var(--color-primary)]"></i>
        {{ (Array.isArray(job.placeOfAssignment) ? job.placeOfAssignment.join(', ') : job.placeOfAssignment) || 'Schools Division' }}
      </p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-3 gap-4 py-3 border-y border-[var(--bg-app)]">
      <div class="flex flex-col gap-1">
        <span class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest">Grade</span>
        <span class="text-xs font-black text-[var(--text-sub)] tabular-nums">SG-{{ job.salaryGrade || '—' }}</span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest">Slots</span>
        <span class="text-xs font-black text-[var(--text-sub)] tabular-nums">{{ job.noOfVacancy || 1 }} Available</span>
      </div>
      <div class="flex flex-col gap-1 text-right">
        <span class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest">Ends</span>
        <span :class="['text-xs font-bold', deadlineClass(job.deadline)]">{{ deadlineLabel(job.deadline) }}</span>
      </div>
    </div>

    <!-- Monthly Pay & Action -->
    <div class="flex items-center justify-between">
      <div>
        <span class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest">Monthly Salary</span>
        <p class="text-base font-black text-[var(--text-main)] tabular-nums">&#8369;{{ Number(job.salary || 0).toLocaleString() }}</p>
      </div>
      <div class="flex items-center gap-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] px-4 py-2 rounded-xl group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all shadow-sm">
         <span class="text-[10px] font-black uppercase tracking-widest">Apply Now</span>
         <i class="pi pi-arrow-up-right text-[10px]"></i>
      </div>
    </div>

  </div>
</template>
