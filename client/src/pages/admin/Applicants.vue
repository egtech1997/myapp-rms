<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import apiClient from '@/api/axios'
import { AppBadge, AppButton, AppTableReport, AppPageHeader, AppModal } from '@/components/ui'
import { statusConfig } from '@/utils/statusColors'
import { useRecruitmentStore } from '@/stores/recruitment'
import { storeToRefs } from 'pinia'

const toast = inject('$toast')
const swal = inject('$swal')
const recruitmentStore = useRecruitmentStore()
const { selectedJobId } = storeToRefs(recruitmentStore)

// ── DATA ─────────────────────────────────────────────────────────────────────
const jobs = ref([])
const applications = ref([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')

// ── PICKER STATE ─────────────────────────────────────────────────────────────
const showJobPicker = ref(false)
const jobPickerSearch = ref('')

// ── AUDIT MODAL STATE ─────────────────────────────────────────────────────────
const selected = ref(null)
const showAuditModal = ref(false)
const activePdsTab = ref('personal')
const showPreview = ref(false)
const selectedDocUrl = ref('')
const saving = ref(false)

const pdsTabs = [
  { id: 'personal', label: 'Profile', icon: 'pi-user' },
  { id: 'education', label: 'Education', icon: 'pi-graduation-cap' },
  { id: 'eligibility', label: 'Eligibility', icon: 'pi-verified' },
  { id: 'experience', label: 'Experience', icon: 'pi-briefcase' },
  { id: 'training', label: 'Training', icon: 'pi-star' },
  { id: 'performance', label: 'Performance', icon: 'pi-chart-bar' },
]

const checklist = reactive({
  education: { checked: false, note: '' },
  eligibility: { checked: false, note: '' },
  experience: { checked: false, note: '' },
  training: { checked: false, note: '' },
  performance: { checked: false, note: '' },
})
const verifyQualified = ref(true)
const verifyReason = ref('')

// ── COMPUTED ──────────────────────────────────────────────────────────────────
const stats = computed(() => ({
  total: applications.value.length,
  forReview: applications.value.filter(a => ['applied', 'verifying'].includes(a.status)).length,
  qualified: applications.value.filter(a => a.isVerified && a.isQualified).length,
  disqualified: applications.value.filter(a => a.isVerified && !a.isQualified).length,
}))

const filtered = computed(() => {
  let list = applications.value
  if (statusFilter.value === 'review') list = list.filter(a => ['applied', 'verifying'].includes(a.status))
  else if (statusFilter.value === 'qualified') list = list.filter(a => a.isVerified && a.isQualified)
  else if (statusFilter.value === 'disqualified') list = list.filter(a => a.isVerified && !a.isQualified)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a => fullName(a).toLowerCase().includes(q) || (a.applicationCode || '').toLowerCase().includes(q))
  }
  return list
})

const checksCompleted = computed(() => Object.values(checklist).filter(c => c.checked).length)

const selectedJob = computed(() => jobs.value.find(j => j._id === selectedJobId.value) || null)

const filteredJobs = computed(() => {
  if (!jobPickerSearch.value) return jobs.value
  const q = jobPickerSearch.value.toLowerCase()
  return jobs.value.filter(j =>
    j.positionTitle.toLowerCase().includes(q) ||
    (j.positionCode || '').toLowerCase().includes(q) ||
    j.placeOfAssignment.toLowerCase().includes(q)
  )
})

// ── METHODS ───────────────────────────────────────────────────────────────────
const fetchJobs = async () => {
  const { data } = await apiClient.get('/v1/jobs')
  jobs.value = data.data
  if (selectedJobId.value) {
    loadApplications()
  }
}

const selectJob = (jobId) => {
  recruitmentStore.setSelectedJobId(jobId)
  showJobPicker.value = false
  onJobChange()
}

const onJobChange = () => {
  if (selectedJobId.value) {
    statusFilter.value = 'review'
    loadApplications()
  } else {
    applications.value = []
  }
}

const loadApplications = async () => {
  if (!selectedJobId.value) return
  loading.value = true
  try {
    const { data } = await apiClient.get(`/v1/applications/job/${selectedJobId.value}`)
    applications.value = data.data
  } finally {
    loading.value = false
  }
}

const openReview = (app) => {
  selected.value = app
  activePdsTab.value = 'personal'
  showPreview.value = false
  selectedDocUrl.value = ''

  const vc = app.verificationChecklist || {}
  Object.keys(checklist).forEach(key => {
    checklist[key].checked = vc[key]?.checked || false
    checklist[key].note = vc[key]?.note || ''
  })
  verifyQualified.value = app.isQualified ?? true
  verifyReason.value = app.disqualificationReason || ''

  showAuditModal.value = true
  document.body.style.overflow = 'hidden'
}

const closeAudit = () => {
  showAuditModal.value = false
  document.body.style.overflow = ''
}

const postIER = async () => {
  const result = await swal.fire({
    title: 'Post Initial Evaluation Results?',
    text: 'This will publish the IER to the public bulletin.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Publish Now',
  })
  if (!result.isConfirmed) return
  try {
    await apiClient.post('/v1/announcements/ier', { jobId: selectedJobId.value })
    toast.fire({ icon: 'success', title: 'IER Posted Successfully' })
  } catch {
    toast.fire({ icon: 'error', title: 'Failed to post IER' })
  }
}

const submitVerification = async () => {
  saving.value = true
  try {
    const payload = {
      verificationChecklist: checklist,
      isQualified: verifyQualified.value,
      disqualificationReason: verifyQualified.value ? '' : verifyReason.value,
      isVerified: true,
      status: verifyQualified.value ? 'comparative_assessment' : 'disqualified',
    }
    const { data } = await apiClient.patch(`/v1/applications/${selected.value._id}/status`, payload)
    const idx = applications.value.findIndex(a => a._id === selected.value._id)
    if (idx !== -1) applications.value[idx] = data.data
    toast.fire({ icon: 'success', title: verifyQualified.value ? 'Applicant Qualified' : 'Applicant Disqualified' })
    closeAudit()
  } finally {
    saving.value = false
  }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const getPlaceName = (place) => {
  if (!place) return 'No Station'
  if (Array.isArray(place)) {
    return place.map(p => typeof p === 'object' ? p.name : p).filter(Boolean).join(', ')
  }
  if (typeof place === 'object') return place.name || 'No Station'
  return place
}

const fullName = (app) => {
  const p = app.applicantData?.personalInfo
  return p ? `${p.firstName} ${p.lastName}` : 'Unknown Candidate'
}

onMounted(fetchJobs)

// ── Export ────────────────────────────────────────────────────────────────────
const showReport = ref(false)
const reportCols = [
  { label: 'Applicant Name', value: (a) => fullName(a) },
  { label: 'Email', value: (a) => a.submittedBy?.email ?? '—' },
  { label: 'App Code', key: 'applicationCode' },
  { label: 'Date Applied', value: (a) => formatDate(a.createdAt) },
  { label: 'Status', key: 'status' },
  { label: 'Qualified', value: (a) => a.isQualified ? 'Yes' : a.isVerified ? 'No' : '—' },
]

const filterTabs = [
  { id: 'all', label: 'All', countKey: 'total' },
  { id: 'review', label: 'For Review', countKey: 'forReview' },
  { id: 'qualified', label: 'Qualified', countKey: 'qualified' },
  { id: 'disqualified', label: 'Disqualified', countKey: 'disqualified' },
]
</script>

<template>
  <div class="flex flex-col gap-5 h-full">

    <!-- Page Header -->
    <AppPageHeader title="Applicant Verification" subtitle="Screen PDS submissions and determine initial eligibility."
      icon="pi-users">
      <template #actions>
        <div v-if="selectedJobId && applications.length > 0" class="flex items-center gap-2">
           <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-xs font-medium text-[var(--text-muted)]">
            <i class="pi pi-users text-[11px]"></i>
            <span>{{ applications.length }} applicant{{ applications.length !== 1 ? 's' : '' }}</span>
          </div>
          <AppButton variant="secondary" icon="pi-megaphone" @click="postIER">Post IER</AppButton>
        </div>
      </template>
    </AppPageHeader>

    <!-- Toolbar -->
    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-3.5 flex flex-col lg:flex-row gap-3">
      <!-- Searchable Picker Trigger -->
      <div class="flex flex-col sm:flex-row items-center gap-3 flex-1">
        <button @click="showJobPicker = true"
          class="flex items-center gap-3 px-4 h-10 bg-[var(--bg-app)] border border-[var(--border-main)] hover:border-[var(--color-primary)] rounded-lg transition-all text-left w-full sm:min-w-[400px] group">
          <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
            <i class="pi pi-briefcase text-xs"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p v-if="selectedJob" class="text-xs font-bold text-[var(--text-main)] truncate uppercase tracking-tight">
              {{ selectedJob.positionTitle }}
            </p>
            <p v-if="selectedJob" class="text-[10px] text-[var(--text-muted)] font-mono truncate">
              {{ selectedJob.positionCode }} &bull; {{ getPlaceName(selectedJob.placeOfAssignment) }}
            </p>
            <p v-else class="text-xs font-semibold text-[var(--text-faint)]">Select a vacancy to audit...</p>
          </div>
          <i class="pi pi-chevron-down text-[10px] text-[var(--text-faint)] group-hover:text-[var(--color-primary)] transition-colors"></i>
        </button>

        <div v-if="selectedJobId" class="relative flex-1 max-w-sm">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none"></i>
          <input v-model="searchQuery" type="search" placeholder="Search by name or code..."
            class="w-full h-10 pl-9 pr-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm
                   text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60 focus:outline-none
                   focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-shadow" />
        </div>
      </div>

      <!-- Context Info -->
      <div v-if="selectedJob"
        class="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)]">
        <div class="flex flex-col items-end leading-tight border-r border-[var(--border-main)] pr-3">
          <span class="text-[9px] font-bold uppercase tracking-widest text-[var(--text-faint)]">Track</span>
          <span class="text-[10px] font-black text-[var(--text-main)] capitalize">{{ selectedJob.hiringTrack.replace('_', ' ') }}</span>
        </div>
        <div class="flex flex-col items-end leading-tight">
          <span class="text-[9px] font-bold uppercase tracking-widest text-[var(--text-faint)]">Items</span>
          <span class="text-[10px] font-black text-[var(--text-main)]">{{ selectedJob.noOfVacancy || (selectedJob.itemNumbers?.length || 0) }} Slot{{ (selectedJob.noOfVacancy || (selectedJob.itemNumbers?.length || 0)) !== 1 ? 's' : '' }}</span>
        </div>
      </div>
    </div>

    <!-- Stats Row -->
    <div v-if="selectedJobId && !loading" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div v-for="stat in [
        { label: 'Total Applied', value: stats.total, color: 'text-[var(--text-main)]', icon: 'pi-users' },
        { label: 'For Review',   value: stats.forReview, color: 'text-amber-500', icon: 'pi-clock' },
        { label: 'Qualified',    value: stats.qualified, color: 'text-emerald-600', icon: 'pi-check-circle' },
        { label: 'Disqualified', value: stats.disqualified, color: 'text-red-500', icon: 'pi-times-circle' }
      ]" :key="stat.label" class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-4 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)]">
          <i :class="['pi', stat.icon]"></i>
        </div>
        <div>
          <p class="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest">{{ stat.label }}</p>
          <p class="text-2xl font-extrabold tabular-nums leading-none mt-0.5" :class="stat.color">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div v-if="selectedJobId" class="flex items-center gap-2 flex-wrap">
      <button v-for="tab in filterTabs" :key="tab.id" @click="statusFilter = tab.id"
        :class="['h-8 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 border',
          statusFilter === tab.id
            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
            : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-[var(--color-primary)] hover:text-[var(--text-main)]']">
        {{ tab.label }}
        <span v-if="stats[tab.countKey] !== undefined" :class="['px-1.5 py-0.5 rounded-full text-[9px] font-bold tabular-nums',
          statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-[var(--bg-app)] text-[var(--text-muted)]']">
          {{ stats[tab.countKey] }}
        </span>
      </button>
    </div>

    <!-- Applicant Table -->
    <div v-if="selectedJobId"
      class="flex-1 overflow-hidden flex flex-col min-h-0 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-sm">

      <!-- Table Header -->
      <div
        class="grid grid-cols-12 px-6 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)] text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest flex-shrink-0">
        <div class="col-span-4">Candidate</div>
        <div class="col-span-3">Application Code</div>
        <div class="col-span-2 text-center">Determination</div>
        <div class="col-span-3 text-right">Actions</div>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--border-main)]">

        <!-- Skeleton loader -->
        <div v-if="loading" class="p-4 flex flex-col gap-3">
          <div v-for="i in 5" :key="i" class="h-14 rounded-xl bg-[var(--bg-app)] animate-pulse"
            :style="{ animationDelay: `${i * 60}ms` }"></div>
        </div>

        <!-- Rows -->
        <template v-else>
        <div v-for="app in filtered" :key="app._id"
          class="grid grid-cols-12 px-6 py-3 items-center hover:bg-[var(--bg-app)] transition-colors group">

          <div class="col-span-4 flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-xl bg-[var(--color-primary-light)] border border-[var(--border-main)] flex items-center justify-center text-xs font-bold text-[var(--color-primary)] overflow-hidden flex-shrink-0">
              <img v-if="app.submittedBy?.avatarUrl" :src="app.submittedBy.avatarUrl"
                class="w-full h-full object-cover" />
              <span v-else>{{ fullName(app).charAt(0) }}</span>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-[var(--text-main)] truncate uppercase leading-tight">{{ fullName(app) }}</p>
              <p class="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{{ app.submittedBy?.email }}</p>
            </div>
          </div>

          <div class="col-span-3">
            <span class="font-mono text-[11px] text-[var(--text-muted)] bg-[var(--bg-app)] px-2 py-0.5 rounded border border-[var(--border-main)]">{{ app.applicationCode }}</span>
          </div>

          <div class="col-span-2 flex justify-center">
            <AppBadge :variant="app.isVerified ? (app.isQualified ? 'ranked' : 'disqualified') : 'verifying'" size="sm">
               {{ app.isVerified ? (app.isQualified ? 'Qualified' : 'Disqualified') : 'Pending' }}
            </AppBadge>
          </div>

          <div class="col-span-3 text-right">
            <div class="flex items-center justify-end gap-1">
               <button @click="openReview(app)"
                class="h-8 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--surface)] hover:bg-[var(--bg-app)] text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all flex items-center gap-1.5 group/btn">
                <i :class="['pi text-[10px] transition-transform group-hover/btn:scale-110', app.isVerified ? 'pi-eye' : 'pi-shield']"></i>
                {{ app.isVerified ? 'View Audit' : 'Audit Record' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="filtered.length === 0"
          class="flex flex-col items-center justify-center py-16 gap-3 text-[var(--text-muted)]">
          <i class="pi pi-inbox text-3xl text-[var(--text-faint)]"></i>
          <p class="text-sm font-bold text-[var(--text-sub)] uppercase tracking-widest">No applicants found</p>
        </div>
        </template>
      </div>

      <!-- Table footer: export -->
      <div class="px-6 py-3 border-t border-[var(--border-main)] bg-[var(--surface)] flex items-center justify-between flex-shrink-0">
        <span class="text-xs text-[var(--text-muted)]">{{ filtered.length }} applicant{{ filtered.length !== 1 ? 's' : '' }}</span>
        <button @click="showReport = true"
          class="h-8 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] hover:bg-[var(--surface)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors flex items-center gap-1.5">
          <i class="pi pi-download text-[10px]"></i> Export
        </button>
      </div>
    </div>

    <!-- Empty: no job selected -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-center gap-3">
      <div
        class="w-16 h-16 rounded-3xl bg-[var(--surface)] border border-[var(--border-main)] flex items-center justify-center shadow-sm animate-bounce-subtle">
        <i class="pi pi-briefcase text-2xl text-[var(--color-primary)]/40"></i>
      </div>
      <h3 class="text-base font-black text-[var(--text-main)] uppercase tracking-tight">Select a Vacancy to Begin</h3>
      <p class="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed font-medium">Use the "Vacancy Picker" to
        select a
        recruitment post.</p>
      <AppButton variant="primary" size="sm" class="mt-4" @click="showJobPicker = true">
        <i class="pi pi-search mr-2"></i> Find Vacancy
      </AppButton>
    </div>

    <!-- ── Export Report ────────────────────────────────────────────────────── -->
    <AppTableReport
      v-model="showReport"
      title="Applicant Verification Report"
      :subtitle="selectedJob ? selectedJob.positionTitle : 'All Applicants'"
      :columns="reportCols"
      :rows="filtered"
      filename="Applicants" />

    <!-- ── JOB PICKER MODAL ─────────────────────────────────────────────────── -->
    <AppModal v-model="showJobPicker" title="Select Vacancy" icon="pi-briefcase" width="max-w-2xl">
      <div class="flex flex-col gap-3">
        <!-- Search bar -->
        <div class="px-0.5">
          <AppInput 
            v-model="jobPickerSearch" 
            placeholder="Search position, code, or station..." 
            prefixIcon="pi-search"
            clearable
            size="md"
            class="font-bold uppercase tracking-tight"
          />
        </div>

        <!-- Vacancy List -->
        <div class="max-h-[420px] overflow-y-auto pr-1 custom-scrollbar min-h-[300px] relative">
          <TransitionGroup 
            name="list" 
            tag="div" 
            class="space-y-2 px-0.5 pb-4"
          >
            <button v-for="job in filteredJobs" :key="job._id" @click="selectJob(job._id)"
              class="w-full p-3 rounded-xl border transition-all text-left flex items-start justify-between gap-3 group relative overflow-hidden"
              :class="selectedJobId === job._id
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/20 shadow-sm ring-1 ring-[var(--color-primary-ring)]/20'
                : 'border-[var(--border-main)] bg-[var(--surface)] hover:border-[var(--color-primary)] hover:bg-[var(--bg-app)]/30'">
              
              <!-- Selection Indicator -->
              <div v-if="selectedJobId === job._id" 
                class="absolute top-0 right-0 w-7 h-7 bg-[var(--color-primary)] flex items-center justify-center rounded-bl-lg shadow-sm animate-fade-in">
                <i class="pi pi-check text-white text-[9px] font-black"></i>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 mb-1.5">
                  <AppBadge :variant="job.hiringTrack" size="sm" class="uppercase font-bold tracking-widest">{{ job.hiringTrack.replace('_', ' ') }}</AppBadge>
                  <span class="text-[9px] text-[var(--text-faint)] font-bold uppercase flex items-center gap-1">
                    <i class="pi pi-clock text-[8px]"></i> {{ formatDate(job.createdAt) }}
                  </span>
                </div>

                <h4 class="text-sm font-bold text-[var(--text-main)] truncate uppercase group-hover:text-[var(--color-primary)] transition-colors leading-tight tracking-tight">
                  {{ job.positionTitle }}
                </h4>
                
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                  <div class="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase">
                    <i class="pi pi-tag text-[9px]"></i>
                    <span class="font-mono text-[var(--text-main)]">{{ job.positionCode }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase">
                    <i class="pi pi-map-marker text-[9px]"></i>
                    <span class="truncate max-w-[200px]">{{ getPlaceName(job.placeOfAssignment) }}</span>
                  </div>
                </div>
              </div>

              <div class="flex flex-col items-end justify-between self-stretch flex-shrink-0">
                <AppBadge 
                  :variant="job.status" 
                  size="sm" 
                  :pulseDot="job.status === 'published'"
                >
                  <span class="capitalize">{{ job.status }}</span>
                </AppBadge>
                
                <div class="flex items-center gap-2 pr-1">
                  <div class="flex flex-col items-center gap-0">
                    <span class="text-[8px] font-bold text-[var(--text-faint)] uppercase leading-none">Slots</span>
                    <span class="text-[11px] font-black text-[var(--text-main)] tabular-nums leading-tight">{{ job.noOfVacancy || (job.itemNumbers?.length || 0) }}</span>
                  </div>
                  <div class="w-px h-3.5 bg-[var(--border-main)] mx-0.5"></div>
                  <div class="flex flex-col items-center gap-0">
                    <span class="text-[8px] font-bold text-[var(--text-faint)] uppercase leading-none">Apps</span>
                    <span class="text-[11px] font-black text-[var(--color-primary)] tabular-nums leading-tight">{{ job.applications?.length || 0 }}</span>
                  </div>
                </div>
              </div>
            </button>
          </TransitionGroup>

          <!-- No results state -->
          <div v-if="filteredJobs.length === 0" 
            class="absolute inset-0 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <div class="w-12 h-12 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center mb-3">
              <i class="pi pi-search-minus text-2xl text-[var(--text-faint)]"></i>
            </div>
            <h5 class="text-xs font-bold text-[var(--text-main)] uppercase tracking-tight">No Vacancies Found</h5>
            <p class="text-[10px] text-[var(--text-muted)] mt-1 max-w-[200px] font-medium leading-relaxed">
              Adjust your search keywords or check if the recruitment post exists.
            </p>
            <AppButton variant="secondary" size="sm" class="mt-4" @click="jobPickerSearch = ''">Clear Search</AppButton>
          </div>
        </div>
      </div>
    </AppModal>

    <!-- ── FULL-SCREEN AUDIT MODAL ───────────────────── -->
    <Teleport to="body">
      <div v-if="showAuditModal && selected"
        class="fixed inset-0 z-50 flex flex-col bg-[var(--bg-app)] animate-fade-in-up">

        <header class="bg-[var(--surface)] border-b border-[var(--border-main)] px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] font-bold border border-[var(--color-primary)]/10 shadow-sm">
              {{ fullName(selected).charAt(0) }}
            </div>
            <div>
              <h2 class="text-sm font-bold text-[var(--text-main)] uppercase tracking-tight">{{ fullName(selected) }}</h2>
              <div class="flex items-center gap-2 mt-0.5">
                 <span class="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">{{ selected.applicationCode }}</span>
                 <span class="w-1 h-1 rounded-full bg-[var(--border-main)]"></span>
                 <span class="text-[10px] font-bold text-[var(--color-primary)] uppercase">{{ selectedJob?.positionTitle }}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
             <AppButton variant="ghost" icon="pi-times" @click="closeAudit" />
          </div>
        </header>

        <div class="flex-1 flex overflow-hidden">
          <!-- PDS Pane -->
          <div class="flex-1 flex flex-col overflow-hidden border-r border-[var(--border-main)] bg-[var(--bg-app)]">
            <div class="bg-[var(--surface)] border-b border-[var(--border-main)] px-4 py-2 flex items-center justify-between">
              <div class="flex gap-1">
                <button v-for="tab in pdsTabs" :key="tab.id" @click="activePdsTab = tab.id"
                  :class="['h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border',
                    activePdsTab === tab.id ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm' : 'bg-[var(--bg-app)] text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]']">
                  <i :class="['pi text-[10px]', tab.icon]"></i>{{ tab.label }}
                </button>
              </div>
              <AppButton variant="secondary" size="sm" :icon="showPreview ? 'pi-eye-slash' : 'pi-file-pdf'" @click="showPreview = !showPreview">
                {{ showPreview ? 'Hide Files' : 'View Proofs' }}
              </AppButton>
            </div>

            <div class="flex-1 flex overflow-hidden">
              <div :class="['overflow-y-auto custom-scrollbar p-8 transition-all duration-500', showPreview ? 'w-1/2' : 'w-full']">
                <div class="max-w-4xl mx-auto space-y-8 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-10 shadow-sm">

                  <!-- ── Personal ── -->
                  <section v-if="activePdsTab === 'personal'" class="animate-fade-in">
                    <div class="flex items-center gap-3 mb-8 border-b border-[var(--border-main)] pb-4">
                      <div class="w-1 h-5 bg-[var(--color-primary)] rounded-full"></div>
                      <h3 class="text-[11px] font-bold text-[var(--text-main)] uppercase tracking-[0.1em]">Personal Profile</h3>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-8">
                      <div v-for="[l, v] in [
                        ['First Name',   selected.applicantData?.personalInfo?.firstName],
                        ['Middle Name',  selected.applicantData?.personalInfo?.middleName],
                        ['Last Name',    selected.applicantData?.personalInfo?.lastName],
                        ['Birth Date',   formatDate(selected.applicantData?.personalInfo?.birthDate)],
                        ['Sex',          selected.applicantData?.personalInfo?.sex],
                        ['Civil Status', selected.applicantData?.personalInfo?.civilStatus],
                        ['Ethnic Group', selected.applicantData?.personalInfo?.ethnicGroup],
                        ['Religion',     selected.applicantData?.personalInfo?.religion],
                        ['Disability',   selected.applicantData?.personalInfo?.disability],
                        ['Contact',      selected.applicantData?.personalInfo?.contact?.phone || selected.applicantData?.personalInfo?.contact?.phones?.[0]],
                        ['Email',        selected.applicantData?.personalInfo?.contact?.email || selected.applicantData?.personalInfo?.contact?.emails?.[0]],
                        ['Address',      [selected.applicantData?.personalInfo?.address?.barangay, selected.applicantData?.personalInfo?.address?.municipality, selected.applicantData?.personalInfo?.address?.province].filter(Boolean).join(', ')],
                      ]" :key="l">
                        <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{{ l }}</p>
                        <p class="text-sm font-bold text-[var(--text-main)] mt-1.5 uppercase leading-tight">{{ v || '—' }}</p>
                      </div>
                    </div>
                  </section>

                  <!-- ── Education ── -->
                  <section v-else-if="activePdsTab === 'education'" class="animate-fade-in">
                    <div class="flex items-center gap-3 mb-8 border-b border-[var(--border-main)] pb-4">
                      <div class="w-1 h-5 bg-[var(--color-primary)] rounded-full"></div>
                      <h3 class="text-[11px] font-bold text-[var(--text-main)] uppercase tracking-[0.1em]">Educational Background</h3>
                    </div>
                    <div v-if="!selected.applicantData?.education?.length" class="py-12 text-center text-[var(--text-muted)] text-sm">No education records found.</div>
                    <div v-else class="space-y-4">
                      <div v-for="(edu, i) in selected.applicantData.education" :key="i"
                        class="p-5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)] group hover:border-[var(--color-primary)] transition-colors">
                        <div class="grid grid-cols-2 gap-x-8 gap-y-4">
                          <div v-for="[l, v] in [
                            ['Degree / Level', edu.degree || edu.level],
                            ['School', edu.school],
                            ['Period', `${edu.periodFrom || '—'} to ${edu.periodTo || '—'}`],
                            ['Course', edu.course],
                          ]" :key="l">
                            <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{{ l }}</p>
                            <p class="text-xs font-bold text-[var(--text-main)] mt-1 uppercase leading-tight">{{ v || '—' }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <!-- ── Eligibility ── -->
                  <section v-else-if="activePdsTab === 'eligibility'" class="animate-fade-in">
                    <div class="flex items-center gap-3 mb-8 border-b border-[var(--border-main)] pb-4">
                      <div class="w-1 h-5 bg-[var(--color-primary)] rounded-full"></div>
                      <h3 class="text-[11px] font-bold text-[var(--text-main)] uppercase tracking-[0.1em]">Civil Service Eligibility</h3>
                    </div>
                    <div v-if="!selected.applicantData?.eligibility?.length" class="py-12 text-center text-[var(--text-muted)] text-sm">No eligibility records found.</div>
                    <div v-else class="space-y-4">
                      <div v-for="(elig, i) in selected.applicantData.eligibility" :key="i"
                        class="p-5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)] hover:border-[var(--color-primary)] transition-colors">
                        <div class="grid grid-cols-2 gap-x-8 gap-y-4">
                          <div v-for="[l, v] in [
                            ['Eligibility', elig.name],
                            ['Rating', elig.rating],
                            ['Date of Exam', formatDate(elig.dateOfExam)],
                            ['License No.', elig.licenseNumber],
                          ]" :key="l">
                            <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{{ l }}</p>
                            <p class="text-xs font-bold text-[var(--text-main)] mt-1 uppercase leading-tight">{{ v || '—' }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <!-- ── Experience ── -->
                  <section v-else-if="activePdsTab === 'experience'" class="animate-fade-in">
                    <div class="flex items-center gap-3 mb-8 border-b border-[var(--border-main)] pb-4">
                      <div class="w-1 h-5 bg-[var(--color-primary)] rounded-full"></div>
                      <h3 class="text-[11px] font-bold text-[var(--text-main)] uppercase tracking-[0.1em]">Work Experience</h3>
                    </div>
                    <div v-if="!selected.applicantData?.experience?.length" class="py-12 text-center text-[var(--text-muted)] text-sm">No experience records found.</div>
                    <div v-else class="space-y-4">
                      <div v-for="(exp, i) in selected.applicantData.experience" :key="i"
                        class="p-5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)] hover:border-[var(--color-primary)] transition-colors">
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
                          <div class="col-span-2">
                             <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Position</p>
                             <p class="text-xs font-bold text-[var(--text-main)] mt-1 uppercase">{{ exp.position }}</p>
                          </div>
                          <div>
                             <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Period</p>
                             <p class="text-xs font-bold text-[var(--text-main)] mt-1 uppercase whitespace-nowrap">{{ formatDate(exp.periodFrom) }} - {{ exp.isPresent ? 'Present' : formatDate(exp.periodTo) }}</p>
                          </div>
                          <div class="col-span-3 pt-2 border-t border-[var(--border-main)]/50 mt-2">
                             <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Agency / Company</p>
                             <p class="text-xs font-bold text-[var(--text-main)] mt-1 uppercase">{{ exp.company }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <!-- ── Training ── -->
                  <section v-else-if="activePdsTab === 'training'" class="animate-fade-in">
                    <div class="flex items-center gap-3 mb-8 border-b border-[var(--border-main)] pb-4">
                      <div class="w-1 h-5 bg-[var(--color-primary)] rounded-full"></div>
                      <h3 class="text-[11px] font-bold text-[var(--text-main)] uppercase tracking-[0.1em]">Learning & Development</h3>
                    </div>
                    <div v-if="!selected.applicantData?.training?.length" class="py-12 text-center text-[var(--text-muted)] text-sm">No training records found.</div>
                    <div v-else class="space-y-4">
                      <div v-for="(trn, i) in selected.applicantData.training" :key="i"
                        class="p-5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)] hover:border-[var(--color-primary)] transition-colors">
                        <div class="grid grid-cols-2 gap-x-8 gap-y-4">
                           <div class="col-span-2">
                             <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Title of Training</p>
                             <p class="text-xs font-bold text-[var(--text-main)] mt-1 uppercase">{{ trn.title }}</p>
                          </div>
                          <div>
                             <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Hours</p>
                             <p class="text-xs font-bold text-[var(--text-main)] mt-1 uppercase">{{ trn.hours }}</p>
                          </div>
                          <div>
                             <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Type of LD</p>
                             <p class="text-xs font-bold text-[var(--text-main)] mt-1 uppercase">{{ trn.typeOfLD }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <!-- ── Performance ── -->
                  <section v-else-if="activePdsTab === 'performance'" class="animate-fade-in">
                    <div class="flex items-center gap-3 mb-8 border-b border-[var(--border-main)] pb-4">
                      <div class="w-1 h-5 bg-[var(--color-primary)] rounded-full"></div>
                      <h3 class="text-[11px] font-bold text-[var(--text-main)] uppercase tracking-[0.1em]">Performance Metrics</h3>
                    </div>
                    <div v-if="!selected.applicantData?.performanceRating?.score" class="py-12 text-center text-[var(--text-muted)] text-sm">No performance rating found.</div>
                    <div v-else class="grid grid-cols-2 gap-x-8 gap-y-8">
                      <div v-for="[l, v] in [
                        ['Numerical Score', selected.applicantData.performanceRating.score],
                        ['Adjectival Rating', selected.applicantData.performanceRating.adjective],
                        ['Period Covered', selected.applicantData.performanceRating.periodCovered],
                      ]" :key="l">
                        <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{{ l }}</p>
                        <p class="text-sm font-bold text-[var(--text-main)] mt-1.5 uppercase leading-tight">{{ v || '—' }}</p>
                      </div>
                    </div>
                  </section>

                </div>
              </div>

              <!-- Preview Frame -->
              <div v-if="showPreview" class="w-1/2 border-l border-[var(--border-main)] bg-[#1a1a1a] flex flex-col relative">
                <div v-if="selected?.attachments?.length" class="p-2 bg-black/40 flex gap-2 overflow-x-auto border-b border-white/10 no-scrollbar">
                  <button v-for="file in selected.attachments" :key="file._id" @click="selectedDocUrl = file.fileUrl"
                    :class="[selectedDocUrl === file.fileUrl ? 'bg-[var(--color-primary)] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60']"
                    class="px-3 py-1.5 rounded text-[9px] font-bold uppercase transition-all whitespace-nowrap">{{ file.type }}</button>
                </div>
                <div v-if="!selectedDocUrl" class="flex-1 flex flex-col items-center justify-center text-white/20 gap-3">
                   <i class="pi pi-file-pdf text-4xl"></i>
                   <p class="text-xs font-bold uppercase tracking-widest">Select a document to preview</p>
                </div>
                <iframe v-else :src="selectedDocUrl" class="w-full h-full border-none"></iframe>
              </div>
            </div>
          </div>

          <!-- Sidebar Audit -->
          <aside class="w-96 flex flex-col bg-[var(--surface)] border-l border-[var(--border-main)] overflow-hidden shadow-2xl">

            <!-- Determined Status Banner -->
            <div v-if="selected.isVerified" class="p-4 bg-[var(--bg-app)] border-b border-[var(--border-main)]">
               <div :class="['px-4 py-3 rounded-xl border flex items-center gap-3',
                             selected.isQualified ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700']">
                  <i :class="['pi', selected.isQualified ? 'pi-check-circle' : 'pi-times-circle']"></i>
                  <div>
                    <p class="text-xs font-bold uppercase">{{ selected.isQualified ? 'Qualified' : 'Disqualified' }}</p>
                    <p class="text-[10px] opacity-80 mt-0.5">Record audited by HR Secretariat.</p>
                  </div>
               </div>
            </div>

            <!-- Audit Progress -->
            <div class="p-6 border-b border-[var(--border-main)]">
              <div class="flex justify-between items-center mb-3">
                <h3 class="text-[10px] font-bold text-[var(--text-main)] uppercase tracking-widest">Verification Audit</h3>
                <span class="text-xs font-bold tabular-nums text-[var(--color-primary)]">{{ checksCompleted }} / 5</span>
              </div>
              <div class="h-2 bg-[var(--bg-app)] rounded-full overflow-hidden border border-[var(--border-main)]/50">
                <div class="h-full rounded-full transition-all duration-500"
                  :class="checksCompleted === 5 ? 'bg-emerald-500' : 'bg-[var(--color-primary)]'"
                  :style="{ width: `${(checksCompleted / 5) * 100}%` }"></div>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-2.5 bg-[var(--bg-app)]/30">
              <div v-for="key in ['education', 'eligibility', 'experience', 'training', 'performance']" :key="key"
                class="p-3.5 rounded-xl border transition-all bg-[var(--surface)] shadow-sm group"
                :class="checklist[key].checked ? 'border-emerald-200 shadow-emerald-500/5' : 'border-[var(--border-main)]'">
                <div class="flex items-start gap-3">
                  <button @click="checklist[key].checked = !checklist[key].checked"
                    :class="['w-5 h-5 rounded flex items-center justify-center transition-all border',
                             checklist[key].checked ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-[var(--bg-app)] border-[var(--border-main)] text-transparent group-hover:border-emerald-400']">
                    <i class="pi pi-check text-[10px] font-bold"></i>
                  </button>
                  <div class="flex-1">
                    <p class="text-[10px] font-bold uppercase tracking-wide leading-none"
                      :class="checklist[key].checked ? 'text-emerald-700' : 'text-[var(--text-main)]'">{{ key }} Verified</p>
                    <input v-model="checklist[key].note" placeholder="Add audit note..."
                      class="w-full mt-2 text-[10px] bg-[var(--bg-app)] border border-[var(--border-main)]/50 rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-400 italic placeholder:text-[var(--text-faint)]" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Final Determination -->
            <div class="p-6 bg-[var(--surface)] border-t border-[var(--border-main)] space-y-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
              <div class="flex p-1 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl gap-1">
                <button v-for="opt in [{ v: true, l: 'Qualified', c: 'text-emerald-600', bg: 'bg-emerald-500 shadow-emerald-500/20' },
                                       { v: false, l: 'Disqualify', c: 'text-red-600', bg: 'bg-red-500 shadow-red-500/20' }]" :key="opt.l"
                  @click="verifyQualified = opt.v"
                  :class="['flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all',
                           verifyQualified === opt.v ? `${opt.bg} text-white shadow-lg` : `text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white`]">
                  {{ opt.l }}
                </button>
              </div>

              <textarea v-if="!verifyQualified" v-model="verifyReason" placeholder="State reason for disqualification..."
                class="w-full h-20 p-3 bg-[var(--bg-app)] border border-red-200 rounded-xl text-[10px] font-medium outline-none resize-none focus:ring-2 focus:ring-red-100 transition-all"></textarea>

              <AppButton variant="primary" block size="lg" :loading="saving"
                :disabled="verifyQualified && checksCompleted < 5" @click="submitVerification"
                class="h-12 font-bold uppercase tracking-widest text-[10px]">
                {{ verifyQualified ? 'Confirm Qualification' : 'Submit Rejection' }}
              </AppButton>
            </div>
          </aside>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border-main);
  border-radius: 10px;
}

.animate-bounce-subtle {
  animation: bounce-subtle 3s infinite;
}

@keyframes bounce-subtle {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}
</style>
