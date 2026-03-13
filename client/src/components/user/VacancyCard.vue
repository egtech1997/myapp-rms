<script setup>
import { computed } from 'vue'

defineOptions({ name: 'VacancyCard' })

const props = defineProps({
  job:         { type: Object, required: true },
  matchStatus: { type: Object, default: null },
})

const emit = defineEmits(['click'])

const daysLeft = (d) => {
  if (!d) return null
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24))
}

const deadlineLabel = (d) => {
  const days = daysLeft(d)
  if (days === null) return 'Open'
  if (days < 0)   return 'Closed'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days <= 7)  return `${days}d left`
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

const deadlineStyle = (d) => {
  const days = daysLeft(d)
  if (days === null) return { pill: 'bg-[var(--bg-app)] text-[var(--text-faint)] border-[var(--border-main)]', dot: '' }
  if (days < 0)   return { pill: 'bg-red-50 text-red-500 border-red-100',       dot: 'bg-red-400' }
  if (days <= 3)  return { pill: 'bg-red-50 text-red-600 border-red-100',        dot: 'bg-red-500 animate-pulse' }
  if (days <= 7)  return { pill: 'bg-amber-50 text-amber-600 border-amber-200',  dot: 'bg-amber-400 animate-pulse' }
  return { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' }
}

const TRACKS = {
  teaching:         { label: 'Teaching',     short: 'Teaching',    accent: '#2563EB', pill: 'bg-blue-50 text-blue-700 border-blue-200',     bar: 'bg-blue-600' },
  teaching_related: { label: 'T-Related',    short: 'T-Related',   accent: '#7C3AED', pill: 'bg-violet-50 text-violet-700 border-violet-200', bar: 'bg-violet-600' },
  non_teaching:     { label: 'Non-Teaching', short: 'Non-Teaching',accent: '#D97706', pill: 'bg-amber-50 text-amber-700 border-amber-200',   bar: 'bg-amber-500' },
}

const track = computed(() => TRACKS[props.job.hiringTrack] || TRACKS.non_teaching)
const dl    = computed(() => deadlineStyle(props.job.deadline))
</script>

<template>
  <article @click="$emit('click', job)"
    class="relative bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 hover:border-[var(--color-primary-ring)] flex flex-col">

    <!-- Track accent bar -->
    <div :class="['h-1 w-full shrink-0', track.bar]"></div>

    <div class="flex flex-col gap-0 flex-1 p-5">

      <!-- Row 1: Track pill + QS badge -->
      <div class="flex items-center justify-between mb-4">
        <span :class="['text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest', track.pill]">
          {{ track.short }}
        </span>

        <!-- QS Match -->
        <div v-if="matchStatus" class="relative group/qs shrink-0">
          <div v-if="matchStatus.isQualified"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest shadow-sm shadow-emerald-200">
            <i class="pi pi-check-circle" style="font-size:9px"></i> Qualified
          </div>
          <div v-else
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-app)] text-[var(--text-faint)] border border-[var(--border-main)] text-[9px] font-black uppercase tracking-widest cursor-help">
            <i class="pi pi-info-circle" style="font-size:9px"></i> Check QS
          </div>

          <!-- QS Tooltip -->
          <div class="invisible group-hover/qs:visible absolute right-0 top-full mt-2 w-64 bg-[var(--color-navy)] text-white rounded-2xl p-4 shadow-2xl z-50 text-[10px] animate-fade-in ring-1 ring-white/10">
            <p class="font-black mb-3 uppercase tracking-[0.2em] text-white/40 border-b border-white/10 pb-2">Qualification Status</p>
            <div class="space-y-2.5">
              <div v-for="c in matchStatus.criteria" :key="c.label" class="flex justify-between items-start gap-3">
                <span class="text-white/60 font-medium leading-snug">{{ c.label }}</span>
                <div class="text-right shrink-0">
                  <p :class="c.met ? 'text-emerald-400 font-bold' : 'text-rose-400 font-black'">{{ c.act }}</p>
                  <p class="text-[9px] text-white/30 uppercase mt-0.5">Req: {{ c.req }}</p>
                </div>
              </div>
            </div>
            <p class="mt-3 pt-3 border-t border-white/10 text-white/30 italic text-[9px]">Based on your current profile.</p>
          </div>
        </div>
      </div>

      <!-- Row 2: Title + location -->
      <div class="flex-1 mb-4">
        <h2 class="text-sm font-black text-[var(--text-main)] leading-snug uppercase tracking-tight group-hover:text-[var(--color-primary)] transition-colors line-clamp-2 mb-1">
          {{ job.positionTitle }}
        </h2>
        <p v-if="job.positionCode" class="text-[10px] text-[var(--text-faint)] font-mono mb-2">{{ job.positionCode }}</p>
        <p class="text-[11px] text-[var(--text-muted)] font-semibold flex items-center gap-1.5">
          <i class="pi pi-map-marker text-[var(--color-primary)]" style="font-size:10px"></i>
          {{ (Array.isArray(job.placeOfAssignment) ? job.placeOfAssignment.join(', ') : job.placeOfAssignment) || 'Schools Division Office' }}
        </p>
      </div>

      <!-- Row 3: Stats row -->
      <div class="grid grid-cols-3 gap-3 py-3.5 border-y border-[var(--bg-app)] mb-4">
        <div>
          <p class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-0.5">Salary Grade</p>
          <p class="text-xs font-black text-[var(--text-sub)]">SG–{{ job.salaryGrade || '—' }}</p>
        </div>
        <div class="text-center">
          <p class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-0.5">Vacancies</p>
          <p v-if="!job.hideVacancyCount" class="text-xs font-black text-[var(--text-sub)]">
            {{ job.noOfVacancy || 1 }} slot{{ (job.noOfVacancy || 1) > 1 ? 's' : '' }}
          </p>
          <p v-else class="text-xs font-black text-[var(--text-faint)]">—</p>
        </div>
        <div class="text-right">
          <p class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-0.5">Deadline</p>
          <span :class="['inline-flex items-center gap-1 text-[10px] font-black', dl.pill.split(' ').filter(c => c.startsWith('text-')).join(' ')]">
            <span v-if="dl.dot" :class="['w-1.5 h-1.5 rounded-full shrink-0', dl.dot]"></span>
            {{ deadlineLabel(job.deadline) }}
          </span>
        </div>
      </div>

      <!-- Row 4: Salary + CTA -->
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest">Monthly Salary</p>
          <p class="text-lg font-black text-[var(--text-main)] leading-none tabular-nums">
            <span class="text-xs font-bold text-[var(--text-muted)]">₱</span>{{ Number(job.salary || 0).toLocaleString() }}
          </p>
        </div>

        <div class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0
          bg-[var(--color-primary-light)] text-[var(--color-primary)]
          group-hover:bg-[var(--color-primary)] group-hover:text-white group-hover:shadow-lg group-hover:shadow-[var(--color-primary)]/20">
          View & Apply
          <i class="pi pi-arrow-right" style="font-size:9px"></i>
        </div>
      </div>

    </div>
  </article>
</template>
