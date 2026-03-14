<script setup>
import { ref, reactive, computed, onMounted, inject, watch } from 'vue'
import apiClient from '@/api/axios'
import { AppBadge, AppButton, AppPageHeader, AppModal, AppSpinner } from '@/components/ui'
import { useRecruitmentStore } from '@/stores/recruitment'
import { storeToRefs } from 'pinia'
import DigitalIES from '@/components/admin/DigitalIES.vue'

const toast  = inject('$toast')
const swal   = inject('$swal')
const recruitmentStore = useRecruitmentStore()
const { selectedJobId } = storeToRefs(recruitmentStore)

// ── DATA ──────────────────────────────────────────────────────────────────────
const jobs         = ref([])
const applications = ref([])
const interviews   = ref([])   // GET /v1/interviews/job/:jobId — all interviews for this job
const rubric       = ref(null) // active rubric for selected job's track
const loading      = ref(false)
const loadingRubric = ref(false)
const searchQuery  = ref('')

// ── PICKER STATE ──────────────────────────────────────────────────────────────
const showJobPicker    = ref(false)
const jobPickerSearch  = ref('')

// ── IES MODAL ─────────────────────────────────────────────────────────────────
const showIESModal = ref(false)
const iesData      = ref(null)

// ── COMPUTED: selected job ─────────────────────────────────────────────────────
const selectedJob = computed(() => jobs.value.find(j => j._id === selectedJobId.value) || null)

const filteredJobs = computed(() => {
  if (!jobPickerSearch.value) return jobs.value
  const q = jobPickerSearch.value.toLowerCase()
  return jobs.value.filter(j =>
    j.positionTitle.toLowerCase().includes(q) ||
    (j.positionCode || '').toLowerCase().includes(q)
  )
})

// ── TRACK META ─────────────────────────────────────────────────────────────────
const TRACK_META = {
  teaching:         { label: 'Teaching Track',             badge: 'bg-blue-100 text-blue-700 border-blue-200',   icon: 'pi-book' },
  teaching_related: { label: 'Teaching-Related Track',     badge: 'bg-purple-100 text-purple-700 border-purple-200', icon: 'pi-desktop' },
  non_teaching:     { label: 'Non-Teaching Track',         badge: 'bg-slate-100 text-slate-700 border-slate-200',  icon: 'pi-briefcase' },
  school_admin:     { label: 'School Administrator Track', badge: 'bg-amber-100 text-amber-700 border-amber-200',  icon: 'pi-building' },
}
const trackMeta = computed(() => {
  const t = selectedJob.value?.hiringTrack
  return TRACK_META[t] || { label: t || 'Unknown', badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'pi-briefcase' }
})

// ── RUBRIC SUMMARY ─────────────────────────────────────────────────────────────
const partAMax = computed(() =>
  (rubric.value?.criteria || []).filter(c => !c.isPotential).reduce((s, c) => s + (c.maxPoints || 0), 0)
)
const partBMax = computed(() =>
  (rubric.value?.criteria || []).filter(c => c.isPotential).reduce((s, c) => s + (c.maxPoints || 0), 0)
)
const totalMax = computed(() => rubric.value?.totalPoints || partAMax.value + partBMax.value)

// ── INTERVIEW MAP: appId → interview record ────────────────────────────────────
// An applicant may have multiple panelists' interviews; we store all grouped by appId
const interviewsByApp = computed(() => {
  const map = {}
  for (const iv of interviews.value) {
    const appId = typeof iv.application === 'string' ? iv.application : iv.application?._id
    if (!appId) continue
    if (!map[appId]) map[appId] = []
    map[appId].push(iv)
  }
  return map
})

// For each applicant: determine evaluation status based on interviews
// 'none' | 'draft' | 'submitted'
const evalStatus = (appId) => {
  const ivs = interviewsByApp.value[appId] || []
  if (!ivs.length) return 'none'
  if (ivs.some(iv => iv.status === 'submitted')) return 'submitted'
  return 'draft'
}

const evalScore = (appId) => {
  const ivs = (interviewsByApp.value[appId] || []).filter(iv => iv.status === 'submitted')
  if (!ivs.length) return null
  const avg = ivs.reduce((s, iv) => s + (iv.totalScore || 0), 0) / ivs.length
  return avg.toFixed(1)
}

const evalPanelistCount = (appId) => {
  return (interviewsByApp.value[appId] || []).length
}

// ── STATS ──────────────────────────────────────────────────────────────────────
const stats = computed(() => {
  const total     = applications.value.length
  const submitted = applications.value.filter(a => evalStatus(a._id) === 'submitted').length
  const draft     = applications.value.filter(a => evalStatus(a._id) === 'draft').length
  const none      = total - submitted - draft
  return { total, submitted, draft, none }
})

// ── SEARCH FILTER ──────────────────────────────────────────────────────────────
const filtered = computed(() => {
  let list = applications.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a =>
      fullName(a).toLowerCase().includes(q) ||
      (a.applicationCode || '').toLowerCase().includes(q)
    )
  }
  return list
})

// ── METHODS ───────────────────────────────────────────────────────────────────
const fetchJobs = async () => {
  const { data } = await apiClient.get('/v1/jobs')
  jobs.value = data.data
  if (selectedJobId.value) loadAll()
}

const selectJob = (jobId) => {
  recruitmentStore.setSelectedJobId(jobId)
  showJobPicker.value = false
  jobPickerSearch.value = ''
}

watch(selectedJobId, () => {
  applications.value = []
  interviews.value   = []
  rubric.value       = null
  loadAll()
})

const loadAll = async () => {
  if (!selectedJobId.value) return
  loading.value = true
  try {
    const [appsRes, ivRes] = await Promise.all([
      apiClient.get(`/v1/applications/job/${selectedJobId.value}`),
      apiClient.get(`/v1/interviews/job/${selectedJobId.value}`).catch(() => ({ data: { data: [] } }))
    ])
    applications.value = appsRes.data.data.filter(a => a.isQualified)
    interviews.value   = ivRes.data.data || []
  } finally {
    loading.value = false
  }
  // Load rubric in background
  loadRubric()
}

const loadRubric = async () => {
  const track = selectedJob.value?.hiringTrack
  if (!track) return
  loadingRubric.value = true
  try {
    const { data } = await apiClient.get(`/v1/rubrics/track/${track}`)
    rubric.value = data.data
  } catch {
    rubric.value = null
  } finally {
    loadingRubric.value = false
  }
}

const openIES = (app) => {
  iesData.value = {
    applicationId: app._id,
    candidateName: fullName(app),
    jobTitle:      selectedJob.value?.positionTitle || 'Position',
    hiringTrack:   selectedJob.value?.hiringTrack   || 'non_teaching',
    avatarUrl:     app.submittedBy?.avatarUrl,
  }
  showIESModal.value = true
}

const onIESSubmitted = async () => {
  // Reload interviews to refresh scores/status in the table
  if (!selectedJobId.value) return
  try {
    const { data } = await apiClient.get(`/v1/interviews/job/${selectedJobId.value}`)
    interviews.value = data.data || []
  } catch {}
}

const exportConsolidatedIES = async (app) => {
  try {
    const response = await apiClient.get(`/v1/interviews/application/${app._id}/export-consolidated`, {
      responseType: 'blob'
    })
    const url  = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href  = url
    link.setAttribute('download', `IES-CONSOLIDATED-${fullName(app)}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch {
    toast.fire({ icon: 'error', title: 'Export Failed', text: 'Ensure evaluations are submitted before exporting.' })
  }
}

const fullName = (app) => {
  const p = app.applicantData?.personalInfo
  if (!p) return 'Unknown Candidate'
  return [p.firstName, p.middleName, p.lastName, p.suffix].filter(Boolean).join(' ')
}

onMounted(fetchJobs)
</script>

<template>
  <div class="flex flex-col gap-5 h-full">
    <AppPageHeader title="Interview Evaluations" subtitle="Conduct and manage Digital IES for qualified candidates." icon="pi-pencil" />

    <!-- ── Toolbar ── -->
    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-3.5 flex flex-col sm:flex-row gap-3 items-center">
      <!-- Job picker button -->
      <button @click="showJobPicker = true"
        class="flex items-center gap-3 px-4 h-10 bg-[var(--bg-app)] border border-[var(--border-main)] hover:border-[var(--color-primary)] rounded-lg transition-all text-left w-full sm:min-w-[380px] group">
        <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shrink-0">
          <i class="pi pi-briefcase text-xs"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p v-if="selectedJob" class="text-xs font-bold text-[var(--text-main)] truncate uppercase tracking-tight">
            {{ selectedJob.positionTitle }}
          </p>
          <p v-else class="text-xs font-semibold text-[var(--text-faint)]">Select a vacancy to evaluate...</p>
        </div>
        <i class="pi pi-chevron-down text-[10px] text-[var(--text-faint)] group-hover:text-[var(--color-primary)] transition-colors shrink-0"></i>
      </button>

      <!-- Track badge -->
      <span v-if="selectedJob"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shrink-0"
        :class="trackMeta.badge">
        <i :class="['pi', trackMeta.icon, 'text-[9px]']"></i>
        {{ trackMeta.label }}
      </span>

      <!-- Search -->
      <div v-if="selectedJobId" class="relative flex-1 max-w-xs ml-auto">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none"></i>
        <input v-model="searchQuery" type="search" placeholder="Search candidate..."
          class="w-full h-10 pl-9 pr-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm
                 text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-shadow" />
      </div>
    </div>

    <!-- ── Rubric Summary Banner ── -->
    <div v-if="selectedJob && (rubric || loadingRubric)"
      class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl px-5 py-3 flex items-center gap-6 flex-wrap">
      <div class="flex items-center gap-2">
        <i class="pi pi-list-check text-[var(--color-primary)] text-sm"></i>
        <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Active Rubric</span>
        <span class="text-xs font-bold text-[var(--text-main)]">{{ rubric?.title || '—' }}</span>
      </div>
      <div v-if="loadingRubric" class="flex items-center gap-2 text-[var(--text-faint)]">
        <i class="pi pi-spin pi-spinner text-xs"></i>
        <span class="text-[10px]">Loading rubric...</span>
      </div>
      <template v-else-if="rubric">
        <div class="h-4 w-px bg-[var(--border-main)]"></div>
        <div class="flex items-center gap-4 text-[10px] font-bold">
          <span class="flex items-center gap-1.5">
            <span class="w-5 h-5 rounded bg-[var(--color-primary)] text-white text-[8px] font-black flex items-center justify-center">A</span>
            <span class="text-[var(--text-muted)] uppercase tracking-wider">Background Factors</span>
            <span class="text-[var(--text-main)] font-black">{{ partAMax }} pts</span>
          </span>
          <span class="text-[var(--text-faint)]">+</span>
          <span class="flex items-center gap-1.5">
            <span class="w-5 h-5 rounded bg-[var(--color-navy)] text-white text-[8px] font-black flex items-center justify-center">B</span>
            <span class="text-[var(--text-muted)] uppercase tracking-wider">Potential / BEI</span>
            <span class="text-[var(--text-main)] font-black">{{ partBMax }} pts</span>
          </span>
          <span class="text-[var(--text-faint)]">=</span>
          <span class="text-[var(--color-primary)] font-black text-xs">{{ totalMax }} pts total</span>
        </div>
      </template>
      <div v-else class="flex items-center gap-1.5 text-amber-600 text-[10px] font-bold">
        <i class="pi pi-exclamation-triangle text-xs"></i>
        No rubric configured for this track — go to Settings → Rubrics to set one up.
      </div>
    </div>

    <!-- ── Stats ── -->
    <div v-if="selectedJobId && !loading" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div v-for="stat in [
        { label: 'Qualified Applicants', value: stats.total,     color: 'text-[var(--text-main)]',  icon: 'pi-users',         bg: '' },
        { label: 'Submitted',            value: stats.submitted, color: 'text-emerald-600',          icon: 'pi-check-circle',  bg: 'bg-emerald-50 border-emerald-100' },
        { label: 'Draft / In Progress',  value: stats.draft,     color: 'text-[var(--color-primary)]', icon: 'pi-pencil',      bg: 'bg-[var(--color-primary-light)] border-[var(--color-primary)]/20' },
        { label: 'Not Yet Evaluated',    value: stats.none,      color: 'text-amber-500',            icon: 'pi-clock',         bg: 'bg-amber-50 border-amber-100' },
      ]" :key="stat.label"
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-4 shadow-sm flex items-center gap-4"
        :class="stat.bg ? `bg-[var(--surface)]` : ''">
        <div class="w-10 h-10 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)]">
          <i :class="['pi', stat.icon]"></i>
        </div>
        <div>
          <p class="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest leading-tight">{{ stat.label }}</p>
          <p class="text-2xl font-extrabold tabular-nums leading-none mt-0.5" :class="stat.color">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- ── Empty / No Job Selected ── -->
    <div v-if="!selectedJobId" class="flex-1 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl flex flex-col items-center justify-center gap-4 text-[var(--text-muted)] py-20">
      <div class="w-16 h-16 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center">
        <i class="pi pi-pencil text-2xl text-[var(--color-primary)]"></i>
      </div>
      <div class="text-center">
        <p class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Select a Vacancy</p>
        <p class="text-xs text-[var(--text-muted)] mt-1">Choose a job posting above to see qualified candidates for evaluation.</p>
      </div>
      <AppButton variant="primary" icon="pi-briefcase" @click="showJobPicker = true">Browse Vacancies</AppButton>
    </div>

    <!-- ── Applicants Table ── -->
    <div v-else class="flex-1 overflow-hidden flex flex-col bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-sm">
      <!-- Header row -->
      <div class="grid grid-cols-12 px-6 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)] text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest flex-shrink-0">
        <div class="col-span-4">Candidate</div>
        <div class="col-span-2">Code</div>
        <div class="col-span-2 text-center">Eval Status</div>
        <div class="col-span-2 text-center">Score</div>
        <div class="col-span-2 text-right">Actions</div>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--border-main)]">
        <!-- Loading skeleton -->
        <div v-if="loading" class="p-4 flex flex-col gap-3">
          <div v-for="i in 5" :key="i" class="h-14 rounded-xl bg-[var(--bg-app)] animate-pulse"></div>
        </div>

        <template v-else>
          <div v-for="app in filtered" :key="app._id"
            class="grid grid-cols-12 px-6 py-3.5 items-center hover:bg-[var(--bg-app)] transition-colors group">

            <!-- Candidate info -->
            <div class="col-span-4 flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center text-xs font-bold text-[var(--color-primary)] overflow-hidden shrink-0">
                <img v-if="app.submittedBy?.avatarUrl" :src="app.submittedBy.avatarUrl" class="w-full h-full object-cover" />
                <span v-else>{{ fullName(app).charAt(0) }}</span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-[var(--text-main)] truncate uppercase leading-tight">{{ fullName(app) }}</p>
                <p class="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{{ app.submittedBy?.email }}</p>
              </div>
            </div>

            <!-- App code -->
            <div class="col-span-2">
              <span class="font-mono text-[11px] text-[var(--text-muted)] bg-[var(--bg-app)] px-2 py-0.5 rounded border border-[var(--border-main)]">{{ app.applicationCode }}</span>
            </div>

            <!-- Eval Status badge -->
            <div class="col-span-2 flex flex-col items-center gap-1">
              <span v-if="evalStatus(app._id) === 'submitted'"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200">
                <i class="pi pi-check-circle text-[9px]"></i> Submitted
              </span>
              <span v-else-if="evalStatus(app._id) === 'draft'"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                <i class="pi pi-pencil text-[9px]"></i> Draft
              </span>
              <span v-else
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200">
                <i class="pi pi-clock text-[9px]"></i> Pending
              </span>
              <!-- panelist count -->
              <span v-if="evalPanelistCount(app._id) > 0"
                class="text-[9px] text-[var(--text-faint)]">{{ evalPanelistCount(app._id) }} panelist{{ evalPanelistCount(app._id) > 1 ? 's' : '' }}</span>
            </div>

            <!-- Score -->
            <div class="col-span-2 text-center">
              <template v-if="evalScore(app._id) !== null">
                <p class="text-base font-black tabular-nums leading-tight"
                  :class="Number(evalScore(app._id)) >= totalMax * 0.75 ? 'text-emerald-600' : Number(evalScore(app._id)) >= totalMax * 0.5 ? 'text-amber-500' : 'text-[var(--text-main)]'">
                  {{ evalScore(app._id) }}
                </p>
                <p class="text-[9px] text-[var(--text-faint)] font-bold">/ {{ totalMax }} pts</p>
              </template>
              <span v-else class="text-[10px] text-[var(--text-faint)] font-bold">—</span>
            </div>

            <!-- Actions -->
            <div class="col-span-2 text-right flex justify-end gap-2">
              <AppButton size="sm" :variant="evalStatus(app._id) === 'submitted' ? 'secondary' : 'primary'"
                :icon="evalStatus(app._id) === 'submitted' ? 'pi-eye' : 'pi-pencil'"
                @click="openIES(app)">
                {{ evalStatus(app._id) === 'submitted' ? 'View' : 'Evaluate' }}
              </AppButton>
              <button @click="exportConsolidatedIES(app)"
                title="Export Consolidated IES PDF"
                class="h-8 w-8 rounded-lg border border-[var(--border-main)] bg-[var(--surface)] hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-[var(--text-muted)] flex items-center justify-center transition-colors">
                <i class="pi pi-file-pdf text-xs"></i>
              </button>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="filtered.length === 0" class="flex flex-col items-center justify-center py-16 gap-3 text-[var(--text-muted)]">
            <i class="pi pi-inbox text-3xl opacity-20"></i>
            <p class="text-sm font-bold uppercase tracking-widest">
              {{ searchQuery ? 'No candidates match your search' : 'No qualified applicants for this vacancy' }}
            </p>
          </div>
        </template>
      </div>
    </div>

    <!-- ── Job Picker Modal ── -->
    <AppModal v-model="showJobPicker" title="Select Vacancy" icon="pi-briefcase" width="max-w-2xl">
      <div class="p-4 space-y-3">
        <div class="relative">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none"></i>
          <input v-model="jobPickerSearch" placeholder="Search positions or codes..."
            class="w-full h-10 pl-9 pr-4 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm
                   focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-shadow" />
        </div>
        <div class="max-h-96 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
          <button v-for="job in filteredJobs" :key="job._id" @click="selectJob(job._id)"
            class="w-full p-4 rounded-xl border text-left transition-all group"
            :class="job._id === selectedJobId
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
              : 'border-[var(--border-main)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--bg-app)]'">
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-black text-[var(--text-main)] uppercase tracking-tight truncate">{{ job.positionTitle }}</p>
                <p class="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">{{ job.positionCode || '—' }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span v-if="job.hiringTrack" class="text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest"
                  :class="(TRACK_META[job.hiringTrack] || {}).badge || 'bg-slate-100 text-slate-600 border-slate-200'">
                  {{ (TRACK_META[job.hiringTrack] || {}).label || job.hiringTrack }}
                </span>
                <i v-if="job._id === selectedJobId" class="pi pi-check-circle text-[var(--color-primary)] text-sm"></i>
              </div>
            </div>
          </button>
          <div v-if="filteredJobs.length === 0" class="py-10 text-center text-[var(--text-faint)]">
            <i class="pi pi-search text-2xl opacity-30 mb-2"></i>
            <p class="text-xs font-bold uppercase tracking-widest">No positions found</p>
          </div>
        </div>
      </div>
    </AppModal>

    <!-- ── Digital IES Modal ── -->
    <AppModal v-model="showIESModal" title="Digital Interview Evaluation" icon="pi-pencil" width="max-w-7xl" body-class="p-0">
      <DigitalIES
        v-if="iesData"
        v-bind="iesData"
        @close="showIESModal = false"
        @submitted="onIESSubmitted"
      />
    </AppModal>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-main); border-radius: 10px; }
</style>
