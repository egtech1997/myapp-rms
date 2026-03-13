<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineOptions({ name: 'HomeJobModal' })

const props = defineProps({
  visible: { type: Boolean, default: false },
  job:     { type: Object,  default: null },
})

const emit = defineEmits(['update:visible'])

const router    = useRouter()
const authStore = useAuthStore()

const close = () => emit('update:visible', false)

const daysLeft = (d) => {
  if (!d) return null
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24))
}

const deadlineLabel = computed(() => {
  const days = daysLeft(props.job?.deadline)
  if (days === null) return 'Open — no deadline set'
  if (days < 0)   return 'Application period closed'
  if (days === 0) return 'Last day today'
  if (days === 1) return '1 day remaining'
  if (days <= 7)  return `${days} days remaining`
  return new Date(props.job.deadline).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
})

const deadlineColor = computed(() => {
  const days = daysLeft(props.job?.deadline)
  if (days === null) return 'text-[var(--text-faint)]'
  if (days < 0)   return 'text-red-500'
  if (days <= 3)  return 'text-red-600 font-black'
  if (days <= 7)  return 'text-amber-600 font-bold'
  return 'text-emerald-600'
})

const TRACKS = {
  teaching:         { label: 'Teaching',     bar: 'bg-blue-600',    pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  teaching_related: { label: 'T-Related',    bar: 'bg-violet-600',  pill: 'bg-violet-50 text-violet-700 border-violet-200' },
  non_teaching:     { label: 'Non-Teaching', bar: 'bg-amber-500',   pill: 'bg-amber-50 text-amber-700 border-amber-200' },
}
const track = computed(() => TRACKS[props.job?.hiringTrack] || TRACKS.non_teaching)

const handleApply = () => {
  close()
  if (!authStore.isAuthenticated) {
    router.push({ path: '/auth/login', query: { redirect: '/user/vacancies', job: props.job?._id } })
  } else {
    router.push({ path: '/user/vacancies', query: { job: props.job?._id } })
  }
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="visible && job"
      class="fixed inset-0 z-[200] flex items-center justify-center p-4"
      @click.self="close">

      <!-- Backdrop -->
      <div class="absolute inset-0 bg-[var(--color-navy)]/60 backdrop-blur-sm" @click="close"></div>

      <!-- Panel -->
      <div class="relative bg-[var(--surface)] rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-zoom-in">

        <!-- Track accent bar -->
        <div :class="['h-1.5 w-full shrink-0', track.bar]"></div>

        <!-- Header -->
        <div class="px-6 pt-5 pb-4 border-b border-[var(--border-main)] flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span :class="['text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest', track.pill]">
                {{ track.label }}
              </span>
              <span v-if="job.positionCode" class="text-[9px] font-mono text-[var(--text-faint)]">{{ job.positionCode }}</span>
            </div>
            <h2 class="text-lg font-black text-[var(--text-main)] leading-snug uppercase tracking-tight">
              {{ job.positionTitle }}
            </h2>
            <p class="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
              <i class="pi pi-map-marker text-[var(--color-primary)]" style="font-size:10px"></i>
              {{ Array.isArray(job.placeOfAssignment) ? job.placeOfAssignment.join(', ') : (job.placeOfAssignment || 'Schools Division Office') }}
            </p>
          </div>
          <button @click="close"
            class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-faint)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)] transition-colors">
            <i class="pi pi-times text-xs"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="overflow-y-auto custom-scrollbar flex-1 px-6 py-5 space-y-5">

          <!-- Key details grid -->
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-[var(--bg-app)] rounded-2xl p-3.5">
              <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-1">Salary Grade</p>
              <p class="text-sm font-black text-[var(--text-main)]">SG–{{ job.salaryGrade || '—' }}</p>
            </div>
            <div class="bg-[var(--bg-app)] rounded-2xl p-3.5">
              <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-1">Monthly Pay</p>
              <p class="text-sm font-black text-[var(--text-main)]">
                <span class="text-[10px] font-bold text-[var(--text-muted)]">₱</span>{{ Number(job.salary || 0).toLocaleString() }}
              </p>
            </div>
            <div class="bg-[var(--bg-app)] rounded-2xl p-3.5">
              <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-1">Vacancies</p>
              <p v-if="!job.hideVacancyCount" class="text-sm font-black text-[var(--text-main)]">
                {{ job.noOfVacancy || 1 }} slot{{ (job.noOfVacancy || 1) > 1 ? 's' : '' }}
              </p>
              <p v-else class="text-sm font-black text-[var(--text-faint)]">—</p>
            </div>
          </div>

          <!-- Deadline -->
          <div class="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[var(--bg-app)]">
            <i class="pi pi-calendar text-[var(--color-primary)]" style="font-size:13px"></i>
            <div>
              <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)]">Application Deadline</p>
              <p :class="['text-xs font-bold mt-0.5', deadlineColor]">{{ deadlineLabel }}</p>
            </div>
          </div>

          <!-- Qualification Standards -->
          <div v-if="job.qualificationStandards" class="space-y-3">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)] flex items-center gap-1.5">
              <i class="pi pi-list-check" style="font-size:9px"></i> Qualification Standards
            </p>

            <div v-for="item in [
              { key: 'education',   icon: 'pi-graduation-cap', label: 'Education' },
              { key: 'experience',  icon: 'pi-briefcase',       label: 'Experience' },
              { key: 'training',    icon: 'pi-book',            label: 'Training' },
              { key: 'eligibility', icon: 'pi-verified',        label: 'Eligibility' },
            ]" :key="item.key"
              class="flex items-start gap-3 px-4 py-3 rounded-xl border border-[var(--border-main)] bg-[var(--surface)]">
              <div class="w-6 h-6 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0 mt-0.5">
                <i :class="['pi text-[10px] text-[var(--color-primary)]', item.icon]"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)]">{{ item.label }}</p>
                <p class="text-xs text-[var(--text-sub)] font-medium mt-0.5 leading-snug">
                  {{ job.qualificationStandards?.[item.key] || 'None required' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div v-if="job.description" class="space-y-1.5">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)]">Position Overview</p>
            <p class="text-xs text-[var(--text-sub)] leading-relaxed">{{ job.description }}</p>
          </div>

          <!-- Not logged in notice -->
          <div v-if="!authStore.isAuthenticated"
            class="flex items-start gap-3 p-3.5 rounded-2xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20">
            <i class="pi pi-info-circle text-[var(--color-primary)] shrink-0 mt-0.5" style="font-size:13px"></i>
            <p class="text-xs text-[var(--text-sub)] leading-snug">
              You need to <strong class="text-[var(--color-primary)]">sign in</strong> before submitting your application. You will be redirected back to this position after login.
            </p>
          </div>

        </div>

        <!-- Footer actions -->
        <div class="px-6 py-4 border-t border-[var(--border-main)] flex items-center justify-between gap-3 bg-[var(--surface)] shrink-0">
          <button @click="close"
            class="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
            Close
          </button>
          <button @click="handleApply"
            class="btn-primary flex items-center gap-2 px-6 py-2.5 text-xs">
            <i class="pi pi-send" style="font-size:10px"></i>
            {{ authStore.isAuthenticated ? 'Apply for this Position' : 'Sign In to Apply' }}
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to    { opacity: 0; }
</style>
