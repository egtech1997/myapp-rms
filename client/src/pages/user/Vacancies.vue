<script setup>
import { ref, computed, onMounted, onActivated, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useJobs } from '@/composables/useJobs'
import apiClient from '@/api/axios'
import ApplicantCoverPagePdf from '@/components/ApplicantCoverPagePdf.vue'
import { AppBadge, AppFileViewer } from '@/components/ui'
import Swal from 'sweetalert2'

const router    = useRouter()
const authStore = useAuthStore()
const toast     = inject('$toast')

const { jobs, loading, error, fetchJobs } = useJobs()
const searchQuery = ref('')
const filterTrack = ref('')

// ── USER PROFILE & QS MATCHING ──────────────────────────────────────────────
const userProfile = ref(null)
const loadingUser = ref(false)

// File Viewer State
const showViewer = ref(false)
const viewerUrl = ref('')
const viewerTitle = ref('')

const openViewer = (url, title = 'Document Preview') => {
  if (!url) return
  viewerUrl.value = url
  viewerTitle.value = title
  showViewer.value = true
}

const fetchUserProfile = async () => {
  if (!authStore.isAuthenticated) return
  loadingUser.value = true
  try {
    const { data } = await apiClient.get('/v1/profile/me')
    userProfile.value = data.data
    
    // Initialize selections when profile is loaded
    if (userProfile.value) {
      selEdu.value  = userProfile.value.education?.map((_, i) => i) || []
      selElig.value = userProfile.value.eligibility?.map((_, i) => i) || []
      selTrn.value  = userProfile.value.training?.map((_, i) => i) || []
      selExp.value  = userProfile.value.experience?.map((_, i) => i) || []
      
      perfRating.value = {
        score:         userProfile.value.performanceRating?.score         ?? '',
        adjective:     userProfile.value.performanceRating?.adjective     ?? '',
        periodCovered: userProfile.value.performanceRating?.periodCovered ?? '',
      }
    }
  } catch {
    // silent — QS matching is non-critical
  } finally {
    loadingUser.value = false
  }
}

const userMetrics = computed(() => {
  if (!userProfile.value) return null
  const p = userProfile.value
  const expMonths = (p.experience || []).reduce((acc, curr) => {
    if (!curr.periodFrom) return acc
    const start = new Date(curr.periodFrom)
    const end   = curr.periodTo ? new Date(curr.periodTo) : new Date()
    return acc + Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()))
  }, 0)
  const trainHours = (p.training || []).reduce((acc, c) => acc + (Number(c.hours) || 0), 0)
  // Collect eligibility types for matching (use type field; fall back to name for legacy records)
  const eligibilityTypes = (p.eligibility || []).map(e => e.type || e.name || '').filter(Boolean)
  const eligibilityNames = (p.eligibility || []).map(e => e.name || '').filter(Boolean)
  return { expMonths, trainHours, eligibilityTypes, eligibilityNames }
})

const getMatchStatus = (job) => {
  if (!userMetrics.value) return null
  const m = userMetrics.value
  const q = job.qualifications || {}

  // eligibility is now an array; empty array or ['None Required'] = no requirement
  const eligReq = Array.isArray(q.eligibility) ? q.eligibility : (q.eligibility ? [q.eligibility] : [])
  const noneRequired = eligReq.length === 0 || eligReq.includes('None Required')
  const eligMet = noneRequired || m.eligibilityTypes.some(t => eligReq.includes(t))
  const eligReqLabel = noneRequired ? 'None Required' : eligReq.join(' / ')
  const eligActLabel = m.eligibilityTypes.length > 0 ? m.eligibilityTypes.join(', ') : 'None on file'

  const criteria = [
    { label: 'Experience',  met: m.expMonths  >= (q.minExperienceMonths || 0), req: `${q.minExperienceMonths || 0} mo`,  act: `${m.expMonths} mo`   },
    { label: 'Training',    met: m.trainHours >= (q.minTrainingHours    || 0), req: `${q.minTrainingHours    || 0} hrs`, act: `${m.trainHours} hrs` },
    { label: 'Eligibility', met: eligMet, req: eligReqLabel, act: eligActLabel },
  ]
  return { isQualified: criteria.every(c => c.met), criteria }
}

// ── MODAL STATE ──────────────────────────────────────────────────────────────
const selectedJob    = ref(null)
const modalStep      = ref('detail') // 'detail' or 'success'
const showModal      = ref(false)
const submittedApp   = ref(null)
const showCoverPdf   = ref(false)

const applying       = ref(false)
const applyError     = ref('')

const selEdu  = ref([])
const selElig = ref([])
const selTrn  = ref([])
const selExp  = ref([])
const perfRating = ref({ score: '', adjective: '', periodCovered: '' })

// Expanded Rows for Record Selection
const expandedRows = ref([])
const toggleRow = (id) => {
  const idx = expandedRows.value.indexOf(id)
  if (idx === -1) expandedRows.value.push(id)
  else expandedRows.value.splice(idx, 1)
}

const loadAll = async () => {
  await Promise.all([fetchJobs({ status: 'published' }), fetchUserProfile()])
}
onMounted(loadAll)
onActivated(loadAll)

const handleSearch = () => fetchJobs({ status: 'published', search: searchQuery.value })

const openJob = (job) => {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/auth/login', query: { redirect: '/user/vacancies' } })
    return
  }
  selectedJob.value = job
  modalStep.value   = 'detail'
  applyError.value  = ''
  showModal.value   = true
  
  // Re-initialize selections from profile if available
  if (userProfile.value) {
    selEdu.value  = userProfile.value.education?.map((_, i) => i) || []
    selElig.value = userProfile.value.eligibility?.map((_, i) => i) || []
    selTrn.value  = userProfile.value.training?.map((_, i) => i) || []
    selExp.value  = userProfile.value.experience?.map((_, i) => i) || []
    
    perfRating.value = {
      score:         userProfile.value.performanceRating?.score         ?? '',
      adjective:     userProfile.value.performanceRating?.adjective     ?? '',
      periodCovered: userProfile.value.performanceRating?.periodCovered ?? '',
    }
  }
}

const closeModal = () => {
  showModal.value  = false
  applyError.value = ''
}

const toggle = (arr, idx) => {
  const i = arr.indexOf(idx)
  if (i === -1) arr.push(idx)
  else arr.splice(i, 1)
}

const handleApplyClick = async () => {
  const result = await Swal.fire({
    title: 'Confirm Application',
    text: `Are you sure you want to apply for ${selectedJob.value.positionTitle}? Please ensure your selected PDS records and performance rating are accurate.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Submit Application',
    cancelButtonText: 'Review Again',
    confirmButtonColor: 'var(--color-primary)',
    background: 'var(--surface)',
    color: 'var(--text-main)',
    customClass: {
      popup: 'rounded-3xl border border-[var(--border-main)] shadow-2xl',
      confirmButton: 'rounded-xl px-6 py-3 font-bold uppercase tracking-widest text-xs',
      cancelButton: 'rounded-xl px-6 py-3 font-bold uppercase tracking-widest text-xs'
    }
  });

  if (result.isConfirmed) {
    submitApplication();
  }
}

const submitApplication = async () => {
  applying.value   = true
  applyError.value = ''
  const p = userProfile.value
  const applicantData = {
    personalInfo: {
      firstName:   p.name?.firstName,
      middleName:  p.name?.middleName,
      lastName:    p.name?.lastName,
      suffix:      p.name?.suffix,
      sex:         p.sex,
      birthDate:   p.birthDate,
      ethnicGroup: p.ethnicGroup,
      religion:    p.religion,
      disability:  p.disability,
      civilStatus: p.civilStatus,
      phones:      p.contact?.phones || [],
      emails:      p.contact?.emails || [],
      address:     p.address,
    },
    education:   p?.education  ?.filter((_, i) => selEdu.value .includes(i)) || [],
    eligibility: p?.eligibility?.filter((_, i) => selElig.value.includes(i)) || [],
    training:    p?.training   ?.filter((_, i) => selTrn.value .includes(i)) || [],
    experience:  p?.experience ?.filter((_, i) => selExp.value .includes(i)) || [],
    performanceRating: {
      score:         perfRating.value.score ? Number(perfRating.value.score) : null,
      adjective:     perfRating.value.adjective     || '',
      periodCovered: perfRating.value.periodCovered || '',
    },
  }
  try {
    const { data } = await apiClient.post('/v1/applications/apply', {
      jobId:    selectedJob.value._id,
      category: selectedJob.value.hiringTrack,
      applicantData,
    })
    submittedApp.value = { ...data.data, job: selectedJob.value }
    modalStep.value = 'success'
  } catch (err) {
    applyError.value = err.response?.data?.message || 'Application failed. Please try again.'
    Swal.fire({
      icon: 'error',
      title: 'Application Failed',
      text: applyError.value,
      confirmButtonColor: 'var(--color-primary)'
    });
  } finally {
    applying.value = false
  }
}

// ── COMPUTED ─────────────────────────────────────────────────────────────────
const filteredJobs = computed(() => {
  let list = [...jobs.value]
  if (filterTrack.value) list = list.filter(j => j.hiringTrack === filterTrack.value)
  const q = searchQuery.value.trim().toLowerCase()
  if (q) list = list.filter(j =>
    j.positionTitle?.toLowerCase().includes(q) ||
    (Array.isArray(j.placeOfAssignment) ? j.placeOfAssignment.join(' ') : j.placeOfAssignment ?? '').toLowerCase().includes(q)
  )
  return list
})

const trackCounts = computed(() => ({
  teaching:         jobs.value.filter(j => j.hiringTrack === 'teaching').length,
  teaching_related: jobs.value.filter(j => j.hiringTrack === 'teaching_related').length,
  non_teaching:     jobs.value.filter(j => j.hiringTrack === 'non_teaching').length,
}))

// ── HELPERS ──────────────────────────────────────────────────────────────────
const trackLabel     = { teaching: 'Teaching', teaching_related: 'Teaching-Related', non_teaching: 'Non-Teaching' }
const trackPillClass = {
  teaching:         'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/20',
  teaching_related: 'bg-purple-50 text-purple-700 border-purple-200',
  non_teaching:     'bg-amber-50 text-amber-700 border-amber-200',
}
const trackBorderClass = {
  teaching:         'border-l-[var(--color-primary)]',
  teaching_related: 'border-l-purple-500',
  non_teaching:     'border-l-amber-500',
}

// Build clean QS display rows — skip zeroes and empty arrays
const qualificationRows = (job) => {
  const q = job?.qualifications || {}
  const rows = []
  if (q.education)   rows.push({ id: 'education',   label: 'Education',   value: q.education })
  if (q.experience)  rows.push({
    id: 'experience',
    label: 'Experience',
    value: q.experience + (q.minExperienceMonths > 0 ? ` — minimum ${q.minExperienceMonths} month${q.minExperienceMonths > 1 ? 's' : ''}` : ''),
  })
  if (q.trainings)   rows.push({
    id: 'training',
    label: 'Training',
    value: q.trainings + (q.minTrainingHours > 0 ? ` — minimum ${q.minTrainingHours} hour${q.minTrainingHours > 1 ? 's' : ''}` : ''),
  })
  const eligArr = Array.isArray(q.eligibility) ? q.eligibility : (q.eligibility ? [q.eligibility] : [])
  if (eligArr.length) rows.push({ id: 'eligibility', label: 'Eligibility', value: eligArr.join(' / ') })
  return rows
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : null
const isExpired  = (d) => d && new Date(d) < new Date()
const daysLeft   = (d) => {
  if (!d) return null
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24))
}
const deadlineLabel = (d) => {
  if (!d) return 'Open'
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
</script>

<template>
  <div class="w-full bg-[var(--bg-app)] text-[var(--text-main)]">
    <div class="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">

      <!-- ── PAGE HEADER ──────────────────────────────────────────────────── -->
      <div>
        <h1 class="text-2xl font-black text-[var(--text-main)] tracking-tight">Career Opportunities</h1>
        <p class="text-sm text-[var(--text-muted)] mt-1">Schools Division of Guihulngan City &mdash; Open positions for qualified applicants</p>
      </div>

      <!-- ── STATS ROW ────────────────────────────────────────────────────── -->
      <div v-if="!loading" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-[var(--radius-2xl)] p-4 flex flex-col gap-0.5">
          <span class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Total Open</span>
          <span class="text-2xl font-black text-[var(--text-main)] tabular-nums">{{ jobs.length }}</span>
        </div>
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-[var(--radius-2xl)] p-4 flex flex-col gap-0.5">
          <span class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Teaching</span>
          <span class="text-2xl font-black text-[var(--color-primary)] tabular-nums">{{ trackCounts.teaching }}</span>
        </div>
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-[var(--radius-2xl)] p-4 flex flex-col gap-0.5">
          <span class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">T-Related</span>
          <span class="text-2xl font-black text-purple-600 tabular-nums">{{ trackCounts.teaching_related }}</span>
        </div>
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-[var(--radius-2xl)] p-4 flex flex-col gap-0.5">
          <span class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Non-Teaching</span>
          <span class="text-2xl font-black text-amber-600 tabular-nums">{{ trackCounts.non_teaching }}</span>
        </div>
      </div>

      <!-- Stats skeleton -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div v-for="i in 4" :key="i" class="h-[72px] bg-[var(--surface)] border border-[var(--border-main)] rounded-[var(--radius-2xl)] animate-pulse"></div>
      </div>

      <!-- ── SEARCH & FILTER PILLS ────────────────────────────────────────── -->
      <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-[var(--radius-2xl)] p-4 flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none"></i>
          <input v-model="searchQuery" @input="handleSearch" type="text" placeholder="Search positions or assignment..."
            class="w-full h-11 pl-10 pr-4 rounded-[var(--radius-xl)] bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all" />
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button @click="filterTrack = ''"
            :class="['h-11 px-4 rounded-[var(--radius-xl)] border text-xs font-black uppercase tracking-widest transition-all', filterTrack === '' ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-[var(--bg-app)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-[var(--color-primary-ring)]']">
            All
          </button>
          <button @click="filterTrack = 'teaching'"
            :class="['h-11 px-4 rounded-[var(--radius-xl)] border text-xs font-black uppercase tracking-widest transition-all', filterTrack === 'teaching' ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-[var(--bg-app)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-[var(--color-primary-ring)]']">
            Teaching
          </button>
          <button @click="filterTrack = 'teaching_related'"
            :class="['h-11 px-4 rounded-[var(--radius-xl)] border text-xs font-black uppercase tracking-widest transition-all', filterTrack === 'teaching_related' ? 'bg-purple-600 text-white border-purple-600' : 'bg-[var(--bg-app)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-purple-300']">
            T-Related
          </button>
          <button @click="filterTrack = 'non_teaching'"
            :class="['h-11 px-4 rounded-[var(--radius-xl)] border text-xs font-black uppercase tracking-widest transition-all', filterTrack === 'non_teaching' ? 'bg-amber-500 text-white border-amber-500' : 'bg-[var(--bg-app)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-amber-300']">
            Non-Teaching
          </button>
        </div>
      </div>

      <!-- ── AUTH NUDGE ────────────────────────────────────────────────────── -->
      <div v-if="!authStore.isAuthenticated"
        class="flex items-center gap-3 bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 rounded-[var(--radius-2xl)] px-5 py-4">
        <i class="pi pi-info-circle text-[var(--color-primary)] text-lg flex-shrink-0"></i>
        <p class="text-sm text-[var(--color-primary)] font-medium">
          <router-link to="/auth/login" class="font-black underline underline-offset-2">Sign in</router-link>
          to see your Qualification Standards match score for each position.
        </p>
      </div>

      <!-- ── JOB CARDS SKELETON ────────────────────────────────────────────── -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div v-for="i in 6" :key="i" class="h-56 rounded-[var(--radius-2xl)] bg-[var(--surface)] border border-[var(--border-main)] animate-pulse"></div>
      </div>

      <!-- ── JOB CARDS ─────────────────────────────────────────────────────── -->
      <div v-else-if="filteredJobs.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div v-for="job in filteredJobs" :key="job._id"
          :class="['relative bg-[var(--surface)] border border-l-4 border-[var(--border-main)] rounded-[var(--radius-2xl)] p-5 hover:shadow-lg hover:border-[var(--color-primary-ring)] transition-all group cursor-pointer flex flex-col gap-4', trackBorderClass[job.hiringTrack]]"
          @click="openJob(job)">

          <!-- Row 1: Track pill + QS badge -->
          <div class="flex items-center justify-between gap-2">
            <span :class="['text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider', trackPillClass[job.hiringTrack]]">
              {{ trackLabel[job.hiringTrack] }}
            </span>
            <!-- QS Match -->
            <div v-if="authStore.isAuthenticated && getMatchStatus(job)" class="relative group/qs">
              <div v-if="getMatchStatus(job).isQualified"
                class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-widest">
                <i class="pi pi-check-circle text-[10px]"></i> Qualified
              </div>
              <div v-else
                class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--bg-app)] text-[var(--text-muted)] border border-[var(--border-main)] text-[9px] font-bold uppercase tracking-widest cursor-help">
                <i class="pi pi-info-circle text-[10px]"></i> QS Check
              </div>
              <!-- Tooltip -->
              <div class="invisible group-hover/qs:visible absolute right-0 top-full mt-2 w-60 bg-[var(--color-navy)] text-white rounded-[var(--radius-xl)] p-4 shadow-2xl z-50 text-[10px]">
                <p class="font-black mb-3 uppercase tracking-widest text-white/50">Match Breakdown</p>
                <div class="space-y-2">
                  <div v-for="c in getMatchStatus(job).criteria" :key="c.label" class="flex justify-between items-center gap-4">
                    <span class="text-white/70">{{ c.label }}</span>
                    <span :class="c.met ? 'text-emerald-400' : 'text-red-400 font-black'">{{ c.act }} / {{ c.req }}</span>
                  </div>
                </div>
                <p class="mt-3 pt-3 border-t border-white/10 text-white/40 italic leading-relaxed">Update your profile to meet all requirements.</p>
              </div>
            </div>
          </div>

          <!-- Row 2: Title + assignment -->
          <div class="flex-1">
            <h2 class="text-sm font-black text-[var(--text-main)] leading-tight mb-1 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">{{ job.positionTitle }}</h2>
            <p class="text-xs text-[var(--text-faint)] font-medium flex items-center gap-1">
              <i class="pi pi-map-marker text-[10px]"></i>
              {{ (Array.isArray(job.placeOfAssignment) ? job.placeOfAssignment.join(', ') : job.placeOfAssignment) || 'TBA' }}
            </p>
          </div>

          <!-- Row 3: Meta grid -->
          <div class="grid grid-cols-3 gap-2">
            <div class="flex flex-col">
              <span class="text-[9px] font-bold text-[var(--text-faint)] uppercase tracking-widest">Salary Grade</span>
              <span class="text-xs font-black text-[var(--text-sub)] tabular-nums">SG {{ job.salaryGrade || '—' }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[9px] font-bold text-[var(--text-faint)] uppercase tracking-widest">Slots</span>
              <span v-if="!job.hideVacancyCount" class="text-xs font-black text-[var(--text-sub)] tabular-nums">{{ job.noOfVacancy || 0 }}</span>
              <span v-else class="text-xs font-black text-[var(--text-faint)]">—</span>
            </div>
            <div class="flex flex-col text-right">
              <span class="text-[9px] font-bold text-[var(--text-faint)] uppercase tracking-widest">Deadline</span>
              <span :class="['text-xs font-bold', deadlineClass(job.deadline)]">{{ deadlineLabel(job.deadline) }}</span>
            </div>
          </div>

          <!-- Row 4: Salary + CTA arrow -->
          <div class="flex items-center justify-between pt-3 border-t border-[var(--border-main)]">
            <div>
              <span class="text-[9px] font-bold text-[var(--text-faint)] uppercase tracking-widest">Monthly Salary</span>
              <p class="text-sm font-black text-[var(--text-main)] tabular-nums">&#8369;{{ Number(job.salary || 0).toLocaleString() }}</p>
            </div>
            <div class="flex items-center gap-1.5 text-[var(--color-primary)] group-hover:gap-3 transition-all">
              <span class="text-xs font-black">View Details</span>
              <i class="pi pi-arrow-right text-[10px]"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- ── EMPTY STATE ───────────────────────────────────────────────────── -->
      <div v-else class="flex flex-col items-center justify-center gap-4 py-20 bg-[var(--surface)] border border-[var(--border-main)] rounded-[var(--radius-2xl)]">
        <div class="w-16 h-16 rounded-full bg-[var(--bg-app)] flex items-center justify-center">
          <i class="pi pi-inbox text-2xl text-[var(--text-faint)]"></i>
        </div>
        <div class="text-center">
          <p class="text-sm font-black text-[var(--text-sub)]">No vacancies found</p>
          <p class="text-xs text-[var(--text-muted)] mt-1">Try adjusting your search or filters.</p>
        </div>
        <button @click="filterTrack = ''; searchQuery = ''; handleSearch()" class="text-xs font-black text-[var(--color-primary)] hover:underline underline-offset-2">
          Clear filters
        </button>
      </div>

    </div>

    <!-- ── MODAL ─────────────────────────────────────────────────────────────── -->
    <Teleport to="body">
    <div v-if="showModal && selectedJob"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-navy)]/50 backdrop-blur-sm p-4 animate-fade-in"
      @click.self="closeModal">
      <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-[var(--radius-3xl)] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-zoom-in max-h-[92vh]">

        <!-- ── STEP: detail ────────────────────────────────────────────────── -->
        <template v-if="modalStep === 'detail'">
          <div class="px-8 py-6 border-b border-[var(--border-main)] flex justify-between items-start flex-shrink-0">
            <div class="flex-1 min-w-0 mr-4">
              <span :class="['text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest mb-2 inline-block', trackPillClass[selectedJob.hiringTrack]]">
                {{ trackLabel[selectedJob.hiringTrack] }}
              </span>
              <h2 class="text-xl font-black text-[var(--text-main)] tracking-tight leading-tight mt-1">{{ selectedJob.positionTitle }}</h2>
              <p class="text-xs text-[var(--text-faint)] font-medium mt-1">
                {{ selectedJob.positionCode ? selectedJob.positionCode + ' · ' : '' }}{{ Array.isArray(selectedJob.placeOfAssignment) ? selectedJob.placeOfAssignment.join(', ') : selectedJob.placeOfAssignment }}
              </p>
            </div>
            <button @click="closeModal" class="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>

          <div class="overflow-y-auto custom-scrollbar flex-1 p-8 space-y-8">
            <!-- Key info grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="bg-[var(--bg-app)] border border-[var(--border-main)] rounded-[var(--radius-xl)] p-3 text-center">
                <p class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-1">Salary Grade</p>
                <p class="text-sm font-black text-[var(--text-sub)]">SG-{{ selectedJob.salaryGrade || '—' }}</p>
              </div>
              <div class="bg-[var(--bg-app)] border border-[var(--border-main)] rounded-[var(--radius-xl)] p-3 text-center">
                <p class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-1">Monthly Pay</p>
                <p class="text-sm font-black text-[var(--text-sub)]">&#8369;{{ Number(selectedJob.salary || 0).toLocaleString() }}</p>
              </div>
              <div class="bg-[var(--bg-app)] border border-[var(--border-main)] rounded-[var(--radius-xl)] p-3 text-center">
                <p class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-1">Vacancies</p>
                <p v-if="!selectedJob.hideVacancyCount" class="text-sm font-black text-emerald-600">{{ selectedJob.noOfVacancy || selectedJob.itemNumbers?.length || 1 }} slot{{ (selectedJob.noOfVacancy || 1) !== 1 ? 's' : '' }}</p>
                <p v-else class="text-sm font-black text-[var(--text-faint)]">—</p>
              </div>
              <div class="bg-[var(--bg-app)] border border-[var(--border-main)] rounded-[var(--radius-xl)] p-3 text-center">
                <p class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-1">Employment</p>
                <p class="text-sm font-black text-[var(--text-sub)] capitalize">{{ selectedJob.employmentType || '—' }}</p>
              </div>
            </div>

            <!-- Description -->
            <div v-if="selectedJob.description">
              <h3 class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em] mb-3">Duties &amp; Description</h3>
              <p class="text-sm text-[var(--text-sub)] leading-relaxed">{{ selectedJob.description }}</p>
            </div>

            <!-- Qualification Standards with Clickable Selection -->
            <div>
              <h3 class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em] mb-4">Qualification Standards &amp; Record Selection</h3>
              <div class="space-y-3">
                <div v-for="row in qualificationRows(selectedJob)" :key="row.label"
                  class="bg-[var(--bg-app)] border border-[var(--border-main)] rounded-[var(--radius-2xl)] overflow-hidden transition-all">
                  
                  <!-- Main Header Row (Clickable) -->
                  <div @click="toggleRow(row.id)"
                    class="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[var(--surface)] transition-colors group">
                    <div class="w-20 flex-shrink-0 text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest">{{ row.label }}</div>
                    <div class="flex-1 text-sm text-[var(--text-sub)] font-bold leading-tight">
                      {{ row.value }}
                      <div class="mt-1 flex items-center gap-2">
                        <span v-if="row.id === 'education' && selEdu.length > 0" class="text-[9px] font-black text-[var(--color-primary)] bg-[var(--color-primary-light)] px-2 py-0.5 rounded-full uppercase tracking-widest">{{ selEdu.length }} Selected</span>
                        <span v-else-if="row.id === 'experience' && selExp.length > 0" class="text-[9px] font-black text-[var(--color-primary)] bg-[var(--color-primary-light)] px-2 py-0.5 rounded-full uppercase tracking-widest">{{ selExp.length }} Selected</span>
                        <span v-else-if="row.id === 'training' && selTrn.length > 0" class="text-[9px] font-black text-[var(--color-primary)] bg-[var(--color-primary-light)] px-2 py-0.5 rounded-full uppercase tracking-widest">{{ selTrn.length }} Selected</span>
                        <span v-else-if="row.id === 'eligibility' && selElig.length > 0" class="text-[9px] font-black text-[var(--color-primary)] bg-[var(--color-primary-light)] px-2 py-0.5 rounded-full uppercase tracking-widest">{{ selElig.length }} Selected</span>
                        <span v-else class="text-[9px] font-bold text-[var(--text-faint)] uppercase tracking-widest italic">Click to select records</span>
                      </div>
                    </div>
                    <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-faint)] group-hover:bg-[var(--bg-app)] group-hover:text-[var(--color-primary)] transition-all">
                      <i :class="['pi text-[10px] transition-transform duration-300', expandedRows.includes(row.id) ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
                    </div>
                  </div>

                  <!-- Expanded List (Clickable) -->
                  <div v-if="expandedRows.includes(row.id)" class="border-t border-[var(--border-main)] bg-[var(--surface)] animate-fade-in">
                    <div class="p-2 space-y-1">
                      
                      <!-- Education Records -->
                      <template v-if="row.id === 'education'">
                        <div v-for="(edu, i) in userProfile?.education" :key="i"
                          class="flex items-center gap-4 p-3 rounded-[var(--radius-xl)] hover:bg-[var(--bg-app)] group/item transition-colors">
                          <input type="checkbox" :id="'edu-'+i" :checked="selEdu.includes(i)" @change="toggle(selEdu, i)" class="accent-[var(--color-primary)] w-4 h-4 flex-shrink-0 cursor-pointer" />
                          <label :for="'edu-'+i" class="flex-1 min-w-0 cursor-pointer">
                            <p class="text-xs font-black text-[var(--text-main)] truncate">{{ edu.school }}</p>
                            <p class="text-[10px] text-[var(--text-muted)] font-medium truncate">{{ edu.level }} &mdash; {{ edu.degree }}</p>
                          </label>
                          <div class="flex items-center gap-2">
                            <button v-if="edu.diploma" @click.stop="openViewer(edu.diploma, edu.degree + ' - Diploma')"
                              class="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:ring-1 hover:ring-[var(--color-primary)] transition-all"
                              title="View Diploma">
                              <i class="pi pi-file text-xs"></i>
                            </button>
                            <button v-if="edu.tor" @click.stop="openViewer(edu.tor, edu.degree + ' - TOR')"
                              class="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:ring-1 hover:ring-[var(--color-primary)] transition-all"
                              title="View TOR">
                              <i class="pi pi-file-pdf text-xs"></i>
                            </button>
                            <span v-if="!edu.diploma && !edu.tor" class="text-[9px] font-bold text-[var(--text-faint)] italic px-2">No Doc</span>
                          </div>
                        </div>
                        <div v-if="!userProfile?.education?.length" class="p-4 text-center text-[10px] text-[var(--text-faint)] italic">No education records on file.</div>
                      </template>

                      <!-- Experience Records -->
                      <template v-if="row.id === 'experience'">
                        <div v-for="(ex, i) in userProfile?.experience" :key="i"
                          class="flex items-center gap-4 p-3 rounded-[var(--radius-xl)] hover:bg-[var(--bg-app)] group/item transition-colors">
                          <input type="checkbox" :id="'exp-'+i" :checked="selExp.includes(i)" @change="toggle(selExp, i)" class="accent-[var(--color-primary)] w-4 h-4 flex-shrink-0 cursor-pointer" />
                          <label :for="'exp-'+i" class="flex-1 min-w-0 cursor-pointer">
                            <p class="text-xs font-black text-[var(--text-main)] truncate">{{ ex.position }}</p>
                            <p class="text-[10px] text-[var(--text-muted)] font-medium truncate">{{ ex.company }}</p>
                            <p class="text-[9px] text-[var(--text-faint)] font-bold mt-0.5">{{ formatDate(ex.periodFrom) }} &mdash; {{ ex.periodTo ? formatDate(ex.periodTo) : 'Present' }}</p>
                          </label>
                          <div class="flex items-center gap-2">
                            <button v-if="ex.document" @click.stop="openViewer(ex.document, ex.position)"
                              class="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:ring-1 hover:ring-[var(--color-primary)] transition-all"
                              title="View Document">
                              <i class="pi pi-file text-xs"></i>
                            </button>
                            <span v-else class="text-[9px] font-bold text-[var(--text-faint)] italic px-2">No Doc</span>
                          </div>
                        </div>
                        <div v-if="!userProfile?.experience?.length" class="p-4 text-center text-[10px] text-[var(--text-faint)] italic">No experience records on file.</div>
                      </template>

                      <!-- Training Records -->
                      <template v-if="row.id === 'training'">
                        <div v-for="(tr, i) in userProfile?.training" :key="i"
                          class="flex items-center gap-4 p-3 rounded-[var(--radius-xl)] hover:bg-[var(--bg-app)] group/item transition-colors">
                          <input type="checkbox" :id="'trn-'+i" :checked="selTrn.includes(i)" @change="toggle(selTrn, i)" class="accent-[var(--color-primary)] w-4 h-4 flex-shrink-0 cursor-pointer" />
                          <label :for="'trn-'+i" class="flex-1 min-w-0 cursor-pointer">
                            <p class="text-xs font-black text-[var(--text-main)] truncate">{{ tr.title }}</p>
                            <p class="text-[10px] text-[var(--text-muted)] font-medium truncate">{{ tr.hours }} Hours &mdash; {{ tr.typeOfLD }}</p>
                            <p class="text-[9px] text-[var(--text-faint)] font-bold mt-0.5">{{ formatDate(tr.periodFrom) }}</p>
                          </label>
                          <div class="flex items-center gap-2">
                            <button v-if="tr.document" @click.stop="openViewer(tr.document, tr.title)"
                              class="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:ring-1 hover:ring-[var(--color-primary)] transition-all"
                              title="View Document">
                              <i class="pi pi-file text-xs"></i>
                            </button>
                            <span v-else class="text-[9px] font-bold text-[var(--text-faint)] italic px-2">No Doc</span>
                          </div>
                        </div>
                        <div v-if="!userProfile?.training?.length" class="p-4 text-center text-[10px] text-[var(--text-faint)] italic">No training records on file.</div>
                      </template>

                      <!-- Eligibility Records -->
                      <template v-if="row.id === 'eligibility'">
                        <div v-for="(el, i) in userProfile?.eligibility" :key="i"
                          class="flex items-center gap-4 p-3 rounded-[var(--radius-xl)] hover:bg-[var(--bg-app)] group/item transition-colors">
                          <input type="checkbox" :id="'el-'+i" :checked="selElig.includes(i)" @change="toggle(selElig, i)" class="accent-[var(--color-primary)] w-4 h-4 flex-shrink-0 cursor-pointer" />
                          <label :for="'el-'+i" class="flex-1 min-w-0 cursor-pointer">
                            <p class="text-xs font-black text-[var(--text-main)] truncate">{{ el.name }}</p>
                            <p class="text-[10px] text-[var(--text-muted)] font-medium truncate">{{ el.rating ? 'Rating: ' + el.rating + '%' : 'No Rating' }}</p>
                            <p class="text-[9px] text-[var(--text-faint)] font-bold mt-0.5">{{ el.dateOfExam ? formatDate(el.dateOfExam) : 'No Date' }}</p>
                          </label>
                          <div class="flex items-center gap-2">
                            <button v-if="el.document" @click.stop="openViewer(el.document, el.name)"
                              class="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:ring-1 hover:ring-[var(--color-primary)] transition-all"
                              title="View Document">
                              <i class="pi pi-file text-xs"></i>
                            </button>
                            <span v-else class="text-[9px] font-bold text-[var(--text-faint)] italic px-2">No Doc</span>
                          </div>
                        </div>
                        <div v-if="!userProfile?.eligibility?.length" class="p-4 text-center text-[10px] text-[var(--text-faint)] italic">No eligibility records on file.</div>
                      </template>

                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Performance Rating -->
            <div>
              <h3 class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em] mb-4">Performance Rating (Required)</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-[var(--radius-2xl)] p-5">
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest">Score</label>
                  <input v-model="perfRating.score" type="number" step="0.001" placeholder="e.g. 4.850"
                    class="h-10 px-3 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:outline-none transition-all" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest">Adjectival</label>
                  <input v-model="perfRating.adjective" type="text" placeholder="Outstanding"
                    class="h-10 px-3 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:outline-none transition-all" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest">Period Covered</label>
                  <input v-model="perfRating.periodCovered" type="text" placeholder="Jan - Dec 2024"
                    class="h-10 px-3 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:outline-none transition-all" />
                </div>
              </div>
              <p class="text-[10px] text-[var(--text-muted)] mt-2 italic px-1">Please provide your most recent verified performance rating.</p>
            </div>

            <!-- Competency Requirements -->
            <div v-if="selectedJob.qualifications?.competencyRequirements?.length">
              <h3 class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em] mb-3">Competency Requirements</h3>
              <ul class="space-y-2">
                <li v-for="comp in selectedJob.qualifications.competencyRequirements" :key="comp"
                  class="flex items-start gap-2.5 text-sm text-[var(--text-sub)]">
                  <i class="pi pi-check-circle text-[var(--color-primary)] text-xs mt-0.5 flex-shrink-0"></i>
                  {{ comp }}
                </li>
              </ul>
            </div>
          </div>

          <div class="px-8 py-5 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-between items-center gap-3 flex-shrink-0">
            <div class="flex items-center gap-2 text-[var(--text-muted)] text-[10px] font-bold">
              <i class="pi pi-info-circle"></i>
              Click on QS rows to expand and select specific PDS records.
            </div>
            <div class="flex gap-3">
              <button @click="closeModal" class="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors px-4">Cancel</button>
              <button @click="handleApplyClick" :disabled="applying || isExpired(selectedJob.deadline)"
                class="btn-primary h-11 px-8 rounded-[var(--radius-xl)] shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <i v-if="applying" class="pi pi-spin pi-spinner text-xs"></i>
                {{ isExpired(selectedJob.deadline) ? 'Deadline Passed' : (applying ? 'Submit Application' : 'Submit Application') }}
                <i v-if="!applying && !isExpired(selectedJob.deadline)" class="pi pi-send text-xs"></i>
              </button>
            </div>
          </div>
        </template>

        <!-- ── STEP: update_prompt (REMOVED) ───────────────────────────────── -->

        <!-- ── STEP: review (REMOVED) ──────────────────────────────────────── -->

        <!-- ── STEP: success ───────────────────────────────────────────────── -->
        <template v-else-if="modalStep === 'success'">
          <div class="p-12 flex flex-col items-center text-center gap-5">
            <div class="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 animate-bounce-subtle">
              <i class="pi pi-check-circle text-5xl"></i>
            </div>
            <div>
              <h2 class="text-2xl font-black text-[var(--text-main)]">Application Submitted!</h2>
              <p class="text-sm text-[var(--text-muted)] mt-2 leading-relaxed max-w-sm mx-auto">
                You have applied for <span class="font-bold text-[var(--text-sub)]">{{ selectedJob.positionTitle }}</span>. Track your status in My Applications.
              </p>
            </div>
            <div class="bg-[var(--bg-app)] border border-[var(--border-main)] rounded-[var(--radius-2xl)] px-6 py-4 text-center w-full max-w-xs">
              <p class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-1">Application Code</p>
              <p class="font-mono font-black text-[var(--color-primary)] text-lg tracking-widest">{{ submittedApp?.applicationCode }}</p>
            </div>
            <div class="flex flex-col gap-3 w-full max-w-xs mt-2">
              <button @click="showCoverPdf = true"
                class="h-12 w-full rounded-[var(--radius-xl)] bg-[var(--color-navy)] text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--color-primary)] transition-colors">
                <i class="pi pi-file-pdf"></i> Download Application Cover
              </button>
              <router-link to="/user/applications" @click="closeModal"
                class="h-12 w-full rounded-[var(--radius-xl)] border border-[var(--border-main)] text-[var(--text-sub)] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-[var(--color-primary-ring)] transition-colors">
                <i class="pi pi-list"></i> View My Applications
              </router-link>
              <button @click="closeModal" class="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                Return to Vacancies
              </button>
            </div>
          </div>
        </template>

      </div>
    </div>
    </Teleport>

    <!-- PDF Component -->
    <ApplicantCoverPagePdf v-if="showCoverPdf && submittedApp" :app="submittedApp" @close="showCoverPdf = false" />
    
    <!-- File Viewer -->
    <AppFileViewer
      v-model="showViewer"
      :url="viewerUrl"
      :title="viewerTitle"
    />
  </div>
</template>

<style scoped>
.animate-bounce-subtle { animation: bounce-subtle 3s infinite; }
@keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
</style>
