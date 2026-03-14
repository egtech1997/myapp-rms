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
  if (days === null) return '#9DAABB'
  if (days < 0)   return '#EF4444'
  if (days <= 3)  return '#DC2626'
  if (days <= 7)  return '#D97706'
  return '#10B981'
})

const TRACKS = {
  teaching:         { label: 'Teaching',     grad: 'from-sky-500 to-blue-600',    pill: 'bg-sky-50 text-sky-700 border-sky-200',       dot: '#38BDF8' },
  teaching_related: { label: 'T-Related',    grad: 'from-violet-500 to-purple-600', pill: 'bg-violet-50 text-violet-700 border-violet-200', dot: '#A78BFA' },
  non_teaching:     { label: 'Non-Teaching', grad: 'from-rose-500 to-pink-600',   pill: 'bg-rose-50 text-rose-700 border-rose-200',     dot: '#FB7185' },
}
const track = computed(() => TRACKS[props.job?.hiringTrack] || TRACKS.non_teaching)

const locationText = computed(() => {
  if (!props.job) return 'Schools Division Office'
  const loc = props.job.placeOfAssignment
  if (Array.isArray(loc)) return loc.join(', ')
  return loc || 'Schools Division Office'
})

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
  <Teleport to="body">
    <Transition name="jm-fade">
      <div
        v-if="visible && job"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style="background: rgba(10, 5, 30, 0.72); backdrop-filter: blur(6px);"
        @click.self="close"
      >
        <!-- Panel -->
        <div
          class="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden jm-panel"
          style="max-height: 90vh;"
          @click.stop
        >
          <!-- Gradient header band -->
          <div :class="['h-1.5 w-full shrink-0 bg-gradient-to-r', track.grad]"
               style="filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2));"></div>

          <!-- Header -->
          <div class="px-7 pt-6 pb-5 flex items-start justify-between gap-4"
               style="background: linear-gradient(to bottom, #FAFAFA, #fff); border-bottom: 1px solid #EEF1F7;">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2.5">
                <span :class="['text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest', track.pill]">
                  {{ track.label }}
                </span>
                <span v-if="job.positionCode" class="text-[9px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{{ job.positionCode }}</span>
              </div>
              <h2 class="text-xl font-black leading-snug uppercase tracking-tight" style="color:#2D3748;">
                {{ job.positionTitle }}
              </h2>
              <p class="text-xs mt-1.5 flex items-center gap-1.5" style="color:#9DAABB;">
                <i class="pi pi-map-marker text-[10px]" style="color:#F472B6;"></i>
                {{ locationText }}
              </p>
            </div>
            <button
              @click="close"
              class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 outline-none jm-close-btn"
              style="color:#9DAABB; background:#F8F9FC;"
            >
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>

          <!-- Body (scrollable) -->
          <div class="overflow-y-auto custom-scrollbar flex-1 px-7 py-6 space-y-5" style="background:#FAFAFA;">

            <!-- Key stats grid -->
            <div class="grid grid-cols-3 gap-3">
              <div class="rounded-2xl p-4 text-center border jm-stat-card"
                   style="background: linear-gradient(135deg, #F0F8FF, #DCEEFF); border-color:#C5DEFF;">
                <p class="text-[9px] font-black uppercase tracking-widest mb-1.5" style="color:#7EA9D7;">Salary Grade</p>
                <p class="text-2xl font-black" style="color:#2D3748;">SG-{{ job.salaryGrade || '-' }}</p>
              </div>
              <div class="rounded-2xl p-4 text-center border jm-stat-card"
                   style="background: linear-gradient(135deg, #FDF0F6, #FDEAED); border-color:#F9C8D8;">
                <p class="text-[9px] font-black uppercase tracking-widest mb-1.5" style="color:#D4739A;">Monthly Pay</p>
                <p class="text-base font-black" style="color:#2D3748;">
                  <span class="text-[10px] font-bold" style="color:#9DAABB;">₱</span>{{ Number(job.salary || 0).toLocaleString() }}
                </p>
              </div>
              <div class="rounded-2xl p-4 text-center border jm-stat-card"
                   style="background:#F8F9FC; border-color:#EEF1F7;">
                <p class="text-[9px] font-black uppercase tracking-widest mb-1.5" style="color:#9DAABB;">Vacancies</p>
                <p v-if="!job.hideVacancyCount" class="text-2xl font-black" style="color:#2D3748;">
                  {{ job.noOfVacancy || 1 }}<span class="text-xs font-semibold" style="color:#9DAABB;"> slot{{ (job.noOfVacancy || 1) > 1 ? 's' : '' }}</span>
                </p>
                <p v-else class="text-2xl font-black" style="color:#DDE1EC;">—</p>
              </div>
            </div>

            <!-- Deadline -->
            <div class="flex items-center gap-3 px-4 py-3.5 rounded-2xl border" style="background:#fff; border-color:#EEF1F7;">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                   style="background: linear-gradient(135deg, #F0F8FF, #DCEEFF);">
                <i class="pi pi-calendar" style="font-size:12px; color:#7EA9D7;"></i>
              </div>
              <div>
                <p class="text-[9px] font-black uppercase tracking-widest" style="color:#9DAABB;">Application Deadline</p>
                <p class="text-sm font-bold mt-0.5" :style="{ color: deadlineColor }">{{ deadlineLabel }}</p>
              </div>
            </div>

            <!-- Qualification Standards -->
            <div v-if="job.qualificationStandards" class="space-y-2.5">
              <p class="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5" style="color:#9DAABB;">
                <i class="pi pi-list-check" style="font-size:10px; color:#D4739A;"></i>
                Qualification Standards
              </p>
              <div
                v-for="item in [
                  { key: 'education',   icon: 'pi-graduation-cap', label: 'Education' },
                  { key: 'experience',  icon: 'pi-briefcase',      label: 'Experience' },
                  { key: 'training',    icon: 'pi-book',           label: 'Training' },
                  { key: 'eligibility', icon: 'pi-verified',       label: 'Eligibility' },
                ]"
                :key="item.key"
                class="flex items-start gap-3 px-4 py-3.5 rounded-xl border bg-white jm-qs-row"
                style="border-color:#EEF1F7;"
              >
                <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                     style="background: linear-gradient(135deg, #FDF0F6, #FDEAED);">
                  <i :class="['pi text-[11px]', item.icon]" style="color:#D4739A;"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[9px] font-black uppercase tracking-widest" style="color:#9DAABB;">{{ item.label }}</p>
                  <p class="text-xs font-medium mt-0.5 leading-snug" style="color:#607080;">
                    {{ job.qualificationStandards?.[item.key] || 'None required' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div v-if="job.description" class="space-y-1.5">
              <p class="text-[10px] font-black uppercase tracking-[0.2em]" style="color:#9DAABB;">Position Overview</p>
              <p class="text-sm leading-relaxed" style="color:#607080;">{{ job.description }}</p>
            </div>

            <!-- Plantilla item numbers -->
            <div v-if="job.plantillaItemNumbers?.length" class="space-y-1.5">
              <p class="text-[10px] font-black uppercase tracking-[0.2em]" style="color:#9DAABB;">Plantilla Item Numbers</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="pin in job.plantillaItemNumbers"
                  :key="pin"
                  class="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border"
                  style="background:#F8F9FC; color:#607080; border-color:#EEF1F7;"
                >{{ pin }}</span>
              </div>
            </div>

            <!-- Login notice -->
            <div
              v-if="!authStore.isAuthenticated"
              class="flex items-start gap-3 p-4 rounded-2xl border"
              style="background: linear-gradient(135deg, #F0F8FF, #DCEEFF); border-color:#C5DEFF;"
            >
              <i class="pi pi-info-circle shrink-0 mt-0.5" style="font-size:14px; color:#7EA9D7;"></i>
              <p class="text-xs leading-snug" style="color:#607080;">
                You need to <strong style="color:#7EA9D7;">sign in</strong> before submitting your application. You will be redirected back to this position after login.
              </p>
            </div>

          </div>

          <!-- Footer actions -->
          <div class="px-7 py-5 flex items-center justify-between gap-3 shrink-0"
               style="background:#fff; border-top: 1px solid #EEF1F7;">
            <button
              @click="close"
              class="text-sm font-bold transition-colors duration-200 outline-none px-4 py-2 rounded-xl jm-cancel-btn"
              style="color:#9DAABB;"
            >
              Close
            </button>
            <button
              @click="handleApply"
              class="flex items-center gap-2 px-7 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all duration-300 hover:scale-105 active:scale-95 outline-none jm-apply-btn"
            >
              <i class="pi pi-send" style="font-size:11px"></i>
              {{ authStore.isAuthenticated ? 'Apply for this Position' : 'Sign In to Apply' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.jm-fade-enter-active,
.jm-fade-leave-active {
  transition: opacity 0.3s ease;
}
.jm-fade-enter-from,
.jm-fade-leave-to {
  opacity: 0;
}

.jm-panel {
  animation: jmZoomIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes jmZoomIn {
  from { opacity: 0; transform: scale(0.92) translateY(16px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.jm-close-btn:hover {
  background: #FDEAED !important;
  color: #D4739A !important;
}

.jm-stat-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.jm-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(180, 100, 150, 0.1);
}

.jm-qs-row {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.jm-qs-row:hover {
  border-color: #F9C8D8 !important;
  box-shadow: 0 2px 12px rgba(212, 115, 154, 0.07);
}

.jm-cancel-btn:hover {
  color: #2D3748 !important;
  background: #F8F9FC;
}

.jm-apply-btn {
  background: linear-gradient(135deg, #D4739A, #B05090, #6B3AA0);
  box-shadow: 0 8px 24px rgba(176, 80, 144, 0.35);
}
.jm-apply-btn:hover {
  box-shadow: 0 12px 32px rgba(176, 80, 144, 0.45);
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #EEF1F7; border-radius: 10px; }
</style>
