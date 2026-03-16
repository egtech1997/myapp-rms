<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue'
import apiClient from '@/api/axios'
import { AppBadge, AppButton, AppPageHeader, AppModal, AppFilterBar } from '@/components/ui'
import { useRecruitmentStore } from '@/stores/recruitment'
import { storeToRefs } from 'pinia'
import DigitalIES from '@/components/admin/DigitalIES.vue'

const toast  = inject('$toast')
const swal   = inject('$swal')
const recruitmentStore = useRecruitmentStore()
const { selectedJobId } = storeToRefs(recruitmentStore)

// ── DATA ──────────────────────────────────────────────────────────────────────
const jobs          = ref([])
const applications  = ref([])   // qualified applicants only
const interviews    = ref([])
const rubric        = ref(null)
const loading       = ref(false)
const loadingRubric = ref(false)
const searchQuery   = ref('')
const filterEval    = ref('')   // '' | 'submitted' | 'draft' | 'none'

// ── PICKER ────────────────────────────────────────────────────────────────────
const showJobPicker   = ref(false)
const jobPickerSearch = ref('')

// ── IES MODAL ─────────────────────────────────────────────────────────────────
const showIESModal = ref(false)
const iesData      = ref(null)

// ── SELECTED JOB ──────────────────────────────────────────────────────────────
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
  teaching:         { label: 'Teaching',         badge: 'bg-blue-100 text-blue-700 border-blue-200',   icon: 'pi-book' },
  teaching_related: { label: 'Teaching-Related', badge: 'bg-purple-100 text-purple-700 border-purple-200', icon: 'pi-desktop' },
  non_teaching:     { label: 'Non-Teaching',     badge: 'bg-slate-100 text-slate-700 border-slate-200',  icon: 'pi-briefcase' },
  school_admin:     { label: 'School Admin',     badge: 'bg-amber-100 text-amber-700 border-amber-200',  icon: 'pi-building' },
}
const trackMeta = computed(() => {
  const t = selectedJob.value?.hiringTrack
  return TRACK_META[t] || { label: t || 'Unknown', badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'pi-briefcase' }
})

// ── RUBRIC SUMMARY ─────────────────────────────────────────────────────────────
const partAMax  = computed(() => (rubric.value?.criteria || []).filter(c => !c.isPotential).reduce((s, c) => s + (c.maxPoints || 0), 0))
const partBMax  = computed(() => (rubric.value?.criteria || []).filter(c =>  c.isPotential).reduce((s, c) => s + (c.maxPoints || 0), 0))
const totalMax  = computed(() => rubric.value?.totalPoints || partAMax.value + partBMax.value)

// ── INTERVIEW MAP ──────────────────────────────────────────────────────────────
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

const evalStatus = (appId) => {
  const ivs = interviewsByApp.value[appId] || []
  if (!ivs.length) return 'none'
  if (ivs.some(iv => iv.status === 'submitted')) return 'submitted'
  return 'draft'
}
const evalScore = (appId) => {
  const ivs = (interviewsByApp.value[appId] || []).filter(iv => iv.status === 'submitted')
  if (!ivs.length) return null
  return (ivs.reduce((s, iv) => s + (iv.totalScore || 0), 0) / ivs.length).toFixed(1)
}
const evalPanelistCount = (appId) => (interviewsByApp.value[appId] || []).length

const scorePercent = (appId) => {
  const s = evalScore(appId)
  if (s === null || !totalMax.value) return 0
  return Math.min(100, Math.round((Number(s) / totalMax.value) * 100))
}
const scoreColor = (appId) => {
  const pct = scorePercent(appId)
  if (pct >= 75) return 'text-emerald-600'
  if (pct >= 50) return 'text-amber-500'
  return 'text-[var(--text-main)]'
}
const scoreBarColor = (appId) => {
  const pct = scorePercent(appId)
  if (pct >= 75) return 'bg-emerald-500'
  if (pct >= 50) return 'bg-amber-400'
  return 'bg-[var(--color-primary)]'
}

// ── STATS ──────────────────────────────────────────────────────────────────────
const stats = computed(() => {
  const total     = applications.value.length
  const submitted = applications.value.filter(a => evalStatus(a._id) === 'submitted').length
  const draft     = applications.value.filter(a => evalStatus(a._id) === 'draft').length
  const none      = total - submitted - draft
  return { total, submitted, draft, none }
})

// ── FILTER ────────────────────────────────────────────────────────────────────
const evalFilterCount = computed(() => Number(!!filterEval.value))

const filtered = computed(() => {
  let list = applications.value
  if (filterEval.value) list = list.filter(a => evalStatus(a._id) === filterEval.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a =>
      fullName(a).toLowerCase().includes(q) ||
      (a.applicationCode || '').toLowerCase().includes(q)
    )
  }
  return list
})

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—'

// ── DISPLAY SNIPPETS ──────────────────────────────────────────────────────────
const extractStrSimple = (val) => {
  if (!val) return '—'
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return val.map(v => extractStrSimple(v)).filter(v => v && v !== '—').join(', ')
  if (typeof val === 'object') return val.label || val.name || val.type || val.title || '—'
  return String(val)
}

const getEdSnippet = (app) => {
  const edu = (app.applicantData?.education || []).filter(e => e.isRelevant !== false)
  if (!edu.length) return '—'
  return extractStrSimple(edu[0].degree).toUpperCase()
}

const getEligSnippet = (app) => {
  const elig = (app.applicantData?.eligibility || []).filter(e => e.isRelevant !== false)
  if (!elig.length) return 'None Required'
  const raw = extractStrSimple(elig[0].name || elig[0].type || elig[0])
  const n = raw.toUpperCase()
  if (n.includes('TEACHER') || n.includes('LET') || n.includes('LPT')) return 'LPT'
  if (n.includes('RA 1080') || n.includes('PRC') || n.includes('LICENSURE')) return 'RA1080'
  if (n.includes('2ND LEVEL') || (n.includes('PROFESSIONAL') && !n.includes('SUB'))) return '2ND LEVEL'
  if (n.includes('1ST LEVEL') || n.includes('SUBPROFESSIONAL')) return '1ST LEVEL'
  if (n.includes('CSC') || n.includes('CIVIL SERVICE')) return 'CSC'
  return n.length > 14 ? n.substring(0, 12) + '..' : n
}

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
    applicationId:  app._id,
    candidateName:  fullName(app),
    jobTitle:       selectedJob.value?.positionTitle || 'Position',
    hiringTrack:    selectedJob.value?.hiringTrack   || 'non_teaching',
    avatarUrl:      app.submittedBy?.avatarUrl,
    initialAppData: app,
  }
  showIESModal.value = true
}

const onIESSubmitted = async () => {
  if (!selectedJobId.value) return
  try {
    const { data } = await apiClient.get(`/v1/interviews/job/${selectedJobId.value}`)
    interviews.value = data.data || []
  } catch {}
}

const exportConsolidatedIES = async (app) => {
  try {
    const response = await apiClient.get(`/v1/interviews/application/${app._id}/export-consolidated`, { responseType: 'blob' })
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
  return [p.lastName, p.firstName, p.middleName, p.suffix].filter(Boolean).join(', ').toUpperCase()
}

const initials = (app) => fullName(app).charAt(0) || '?'

const clearFilters = () => {
  searchQuery.value = ''
  filterEval.value = ''
}

onMounted(fetchJobs)
</script>

<template>
  <div class="flex flex-col gap-5 h-full">
    <AppPageHeader title="Interview Evaluations" subtitle="Conduct and manage Digital IES for qualified candidates." icon="pi-pencil" />

    <!-- ── Toolbar ── -->
    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-3 flex flex-col sm:flex-row gap-2.5 items-center">
      <!-- Job picker -->
      <button @click="showJobPicker = true"
        class="flex items-center gap-3 px-4 h-10 bg-[var(--bg-app)] border border-[var(--border-main)] hover:border-[var(--color-primary)] rounded-xl transition-all text-left sm:min-w-[340px] w-full group">
        <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shrink-0">
          <i class="pi pi-briefcase text-xs"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p v-if="selectedJob" class="text-xs font-bold text-[var(--text-main)] truncate uppercase tracking-tight">{{ selectedJob.positionTitle }}</p>
          <p v-else class="text-xs font-semibold text-[var(--text-faint)]">Select a vacancy to evaluate...</p>
        </div>
        <i class="pi pi-chevron-down text-[10px] text-[var(--text-faint)] group-hover:text-[var(--color-primary)] transition-colors shrink-0"></i>
      </button>

      <!-- Track badge -->
      <span v-if="selectedJob"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shrink-0"
        :class="trackMeta.badge">
        <i :class="['pi text-[9px]', trackMeta.icon]"></i>
        {{ trackMeta.label }}
      </span>

      <!-- Search + Filter (when job selected) -->
      <div v-if="selectedJobId" class="flex-1 min-w-0">
        <AppFilterBar
          v-model:search="searchQuery"
          :filter-count="evalFilterCount"
          placeholder="Search candidate..."
          @clear="clearFilters"
        >
          <template #filter-extra>
            <p class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wide px-1">Evaluation Status</p>
            <div class="space-y-0.5">
              <button v-for="opt in [
                { key: '', label: 'All Candidates' },
                { key: 'submitted', label: 'Submitted', color: 'text-emerald-600' },
                { key: 'draft', label: 'In Progress', color: 'text-[var(--color-primary)]' },
                { key: 'none', label: 'Not Yet Evaluated', color: 'text-amber-600' },
              ]" :key="opt.key"
                type="button"
                @click="filterEval = opt.key"
                class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left"
                :class="filterEval === opt.key
                  ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold'
                  : 'text-[var(--text-sub)] hover:bg-[var(--bg-app)]'"
              >
                <i v-if="filterEval === opt.key" class="pi pi-check text-xs opacity-60"></i>
                <span v-else class="w-3.5 shrink-0"></span>
                <span class="flex-1 text-[13px]" :class="filterEval !== opt.key ? opt.color : ''">{{ opt.label }}</span>
              </button>
            </div>
          </template>
        </AppFilterBar>
      </div>
    </div>

    <!-- ── Rubric Banner ── -->
    <div v-if="selectedJob && (rubric || loadingRubric)"
      class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl px-5 py-3 flex items-center gap-6 flex-wrap">
      <div class="flex items-center gap-2">
        <i class="pi pi-list-check text-[var(--color-primary)] text-sm"></i>
        <span class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wider">Active Rubric</span>
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
        { label: 'Qualified Applicants', value: stats.total,     color: 'text-[var(--color-primary)]', icon: 'pi-users',        bg: 'bg-[var(--color-primary-light)] border-[var(--color-primary)]/20' },
        { label: 'Submitted',            value: stats.submitted, color: 'text-emerald-600',             icon: 'pi-check-circle', bg: 'bg-emerald-50 border-emerald-100' },
        { label: 'In Progress',          value: stats.draft,     color: 'text-sky-600',                 icon: 'pi-pencil',       bg: 'bg-sky-50 border-sky-100' },
        { label: 'Not Yet Evaluated',    value: stats.none,      color: 'text-amber-500',               icon: 'pi-clock',        bg: 'bg-amber-50 border-amber-100' },
      ]" :key="stat.label"
        class="bg-[var(--surface)] border rounded-xl p-4 flex items-center gap-3"
        :class="stat.bg">
        <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/60">
          <i :class="['pi text-base', stat.icon, stat.color]"></i>
        </div>
        <div>
          <p class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wider leading-tight">{{ stat.label }}</p>
          <p class="text-2xl font-extrabold tabular-nums leading-none mt-0.5" :class="stat.color">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- ── Empty / No Job ── -->
    <div v-if="!selectedJobId" class="flex-1 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl flex flex-col items-center justify-center gap-4 text-[var(--text-muted)] py-20">
      <div class="w-16 h-16 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center">
        <i class="pi pi-pencil text-2xl text-[var(--color-primary)]"></i>
      </div>
      <div class="text-center">
        <p class="text-sm font-bold text-[var(--text-main)] uppercase tracking-widest">Select a Vacancy</p>
        <p class="text-xs text-[var(--text-muted)] mt-1">Choose a job posting to see candidates for evaluation.</p>
      </div>
      <AppButton variant="primary" icon="pi-briefcase" @click="showJobPicker = true">Browse Vacancies</AppButton>
    </div>

    <!-- ── Qualified Candidates Table ── -->
    <div v-else class="flex-1 overflow-hidden flex flex-col bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-sm">

      <!-- Table Header -->
      <div class="grid grid-cols-12 px-5 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)] text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest flex-shrink-0">
        <div class="col-span-4">Candidate</div>
        <div class="col-span-2">Qualification</div>
        <div class="col-span-2 text-center">Eval Status</div>
        <div class="col-span-2 text-center">Score</div>
        <div class="col-span-2 text-right">Actions</div>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--border-main)]">

        <!-- Loading -->
        <div v-if="loading" class="p-5 flex flex-col gap-3">
          <div v-for="i in 5" :key="i" class="h-16 rounded-xl bg-[var(--bg-app)] animate-pulse"
            :style="{ animationDelay: `${i * 60}ms` }"></div>
        </div>

        <template v-else>
          <div v-for="app in filtered" :key="app._id"
            class="grid grid-cols-12 px-5 py-4 items-center hover:bg-[var(--bg-app)] transition-colors group">

            <!-- Candidate -->
            <div class="col-span-4 flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] overflow-hidden shrink-0 border border-[var(--color-primary)]/20">
                <img v-if="app.submittedBy?.avatarUrl" :src="app.submittedBy.avatarUrl" class="w-full h-full object-cover" />
                <span v-else>{{ initials(app) }}</span>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-[var(--text-main)] truncate uppercase leading-tight tracking-tight">{{ fullName(app) }}</p>
                <p class="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{{ app.submittedBy?.email || '—' }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="font-mono text-[9px] text-[var(--text-faint)] bg-[var(--bg-app)] px-1.5 py-0.5 rounded border border-[var(--border-main)]">{{ app.applicationCode }}</span>
                  <span class="text-[9px] text-[var(--text-faint)]">{{ formatDate(app.createdAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Qualification snippet -->
            <div class="col-span-2 min-w-0 pr-3">
              <div class="flex items-start gap-1.5 mb-1">
                <i class="pi pi-graduation-cap text-[9px] text-[var(--color-primary)] mt-0.5 shrink-0"></i>
                <span class="text-[10px] text-[var(--text-sub)] line-clamp-1 leading-snug">{{ getEdSnippet(app) }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <i class="pi pi-verified text-[9px] text-amber-500 shrink-0"></i>
                <span class="text-[10px] font-semibold text-[var(--text-muted)]">{{ getEligSnippet(app) }}</span>
              </div>
            </div>

            <!-- Eval Status -->
            <div class="col-span-2 flex flex-col items-center gap-1">
              <span v-if="evalStatus(app._id) === 'submitted'"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200">
                <i class="pi pi-check-circle text-[9px]"></i> Submitted
              </span>
              <span v-else-if="evalStatus(app._id) === 'draft'"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-sky-100 text-sky-700 border border-sky-200">
                <i class="pi pi-pencil text-[9px]"></i> In Progress
              </span>
              <span v-else
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200">
                <i class="pi pi-clock text-[9px]"></i> Pending
              </span>
              <span v-if="evalPanelistCount(app._id) > 0"
                class="text-[9px] text-[var(--text-faint)]">
                <i class="pi pi-users text-[8px]"></i>
                {{ evalPanelistCount(app._id) }} panelist{{ evalPanelistCount(app._id) > 1 ? 's' : '' }}
              </span>
            </div>

            <!-- Score -->
            <div class="col-span-2 flex flex-col items-center gap-1.5">
              <template v-if="evalScore(app._id) !== null">
                <p class="text-base font-black tabular-nums leading-tight" :class="scoreColor(app._id)">
                  {{ evalScore(app._id) }}
                  <span class="text-[10px] font-semibold text-[var(--text-faint)]"> / {{ totalMax }}</span>
                </p>
                <!-- Progress bar -->
                <div class="w-full max-w-[80px] h-1.5 bg-[var(--bg-app)] rounded-full overflow-hidden border border-[var(--border-main)]">
                  <div class="h-full rounded-full transition-all duration-500"
                    :class="scoreBarColor(app._id)"
                    :style="{ width: scorePercent(app._id) + '%' }"></div>
                </div>
                <span class="text-[9px] text-[var(--text-faint)] font-semibold">{{ scorePercent(app._id) }}%</span>
              </template>
              <span v-else class="text-[11px] text-[var(--text-faint)] font-bold">—</span>
            </div>

            <!-- Actions -->
            <div class="col-span-2 flex items-center justify-end gap-1.5">
              <button
                @click="openIES(app)"
                class="h-8 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--surface)] hover:bg-[var(--bg-app)] text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all flex items-center gap-1.5 group/btn"
              >
                <i :class="['pi text-[10px] transition-transform group-hover/btn:scale-110', evalStatus(app._id) === 'submitted' ? 'pi-eye' : 'pi-pencil']"></i>
                {{ evalStatus(app._id) === 'submitted' ? 'View IES' : evalStatus(app._id) === 'draft' ? 'Continue' : 'Evaluate' }}
              </button>
              <button @click="exportConsolidatedIES(app)"
                title="Export Consolidated IES PDF"
                class="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--border-main)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
                <i class="pi pi-file-pdf text-xs"></i>
              </button>
            </div>
          </div>

          <!-- Empty -->
          <div v-if="filtered.length === 0" class="flex flex-col items-center justify-center py-16 gap-3 text-[var(--text-muted)]">
            <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] flex items-center justify-center">
              <i class="pi pi-inbox text-2xl opacity-30"></i>
            </div>
            <p class="text-sm font-semibold text-[var(--text-main)]">
              {{ searchQuery || filterEval ? 'No candidates match your filters' : 'No qualified applicants for this vacancy' }}
            </p>
            <button v-if="searchQuery || filterEval" @click="clearFilters"
              class="text-xs font-semibold text-[var(--color-primary)] hover:underline">Clear filters</button>
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
            class="w-full p-4 rounded-xl border text-left transition-all"
            :class="job._id === selectedJobId
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
              : 'border-[var(--border-main)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--bg-app)]'">
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-bold text-[var(--text-main)] uppercase tracking-tight truncate">{{ job.positionTitle }}</p>
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
            <i class="pi pi-search text-2xl opacity-30 mb-2 block"></i>
            <p class="text-xs font-bold uppercase tracking-widest">No positions found</p>
          </div>
        </div>
      </div>
    </AppModal>

    <!-- ── Digital IES Modal ── -->
    <Teleport to="body">
      <div v-if="showIESModal && iesData"
        class="fixed inset-0 z-50 flex flex-col animate-fade-in-up">
        <DigitalIES
          v-bind="iesData"
          @close="showIESModal = false"
          @submitted="onIESSubmitted"
        />
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-main); border-radius: 10px; }
</style>
