<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import apiClient from '@/api/axios'
import { AppBadge, AppButton, AppTableReport, AppPageHeader } from '@/components/ui'
import { statusConfig } from '@/utils/statusColors'

const toast = inject('$toast')
const swal  = inject('$swal')

// ── DATA ─────────────────────────────────────────────────────────────────────
const jobs         = ref([])
const applications = ref([])
const loading      = ref(false)
const selectedJobId = ref('')
const searchQuery  = ref('')
const statusFilter = ref('all')

// ── AUDIT MODAL STATE ─────────────────────────────────────────────────────────
const selected       = ref(null)
const showAuditModal = ref(false)
const activePdsTab   = ref('personal')
const showPreview    = ref(false)
const selectedDocUrl = ref('')
const saving         = ref(false)

const pdsTabs = [
  { id: 'personal',    label: 'Profile',     icon: 'pi-user'           },
  { id: 'education',   label: 'Education',   icon: 'pi-graduation-cap' },
  { id: 'eligibility', label: 'Eligibility', icon: 'pi-verified'       },
  { id: 'experience',  label: 'Experience',  icon: 'pi-briefcase'      },
  { id: 'training',    label: 'Training',    icon: 'pi-star'           },
  { id: 'performance', label: 'Performance', icon: 'pi-chart-bar'      },
]

const checklist = reactive({
  education:   { checked: false, note: '' },
  eligibility: { checked: false, note: '' },
  experience:  { checked: false, note: '' },
  training:    { checked: false, note: '' },
  performance: { checked: false, note: '' },
})
const verifyQualified = ref(true)
const verifyReason    = ref('')

// ── COMPUTED ──────────────────────────────────────────────────────────────────
const stats = computed(() => ({
  total:        applications.value.length,
  forReview:    applications.value.filter(a => ['applied', 'verifying'].includes(a.status)).length,
  qualified:    applications.value.filter(a => a.isVerified && a.isQualified).length,
  disqualified: applications.value.filter(a => a.isVerified && !a.isQualified).length,
}))

const filtered = computed(() => {
  let list = applications.value
  if (statusFilter.value === 'review')        list = list.filter(a => ['applied', 'verifying'].includes(a.status))
  else if (statusFilter.value === 'qualified')    list = list.filter(a => a.isVerified && a.isQualified)
  else if (statusFilter.value === 'disqualified') list = list.filter(a => a.isVerified && !a.isQualified)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a => fullName(a).toLowerCase().includes(q) || (a.applicationCode || '').toLowerCase().includes(q))
  }
  return list
})

const checksCompleted = computed(() => Object.values(checklist).filter(c => c.checked).length)

// ── METHODS ───────────────────────────────────────────────────────────────────
const fetchJobs = async () => {
  const { data } = await apiClient.get('/v1/jobs')
  jobs.value = data.data
}

const loadApplications = async () => {
  if (!selectedJobId.value) return
  loading.value = true
  const { data } = await apiClient.get(`/v1/applications/job/${selectedJobId.value}`)
  applications.value = data.data
  loading.value = false
}

const openReview = (app) => {
  selected.value     = app
  activePdsTab.value = 'personal'
  showPreview.value  = false
  selectedDocUrl.value = ''

  const vc = app.verificationChecklist || {}
  Object.keys(checklist).forEach(key => {
    checklist[key].checked = vc[key]?.checked || false
    checklist[key].note    = vc[key]?.note    || ''
  })
  verifyQualified.value = app.isQualified ?? true
  verifyReason.value    = app.disqualificationReason || ''

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
    text: 'This will publish the IER to the public bulletin. All verified statuses will be visible to applicants.',
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
const fullName   = (app) => {
  const p = app.applicantData?.personalInfo
  return p ? `${p.firstName} ${p.lastName}` : 'Unknown Candidate'
}
const selectedJob = computed(() => jobs.value.find(j => j._id === selectedJobId.value) || null)

onMounted(fetchJobs)

// ── Export ────────────────────────────────────────────────────────────────────
const showReport = ref(false)
const reportCols = [
  { label: 'Applicant Name', value: (a) => fullName(a) },
  { label: 'Email',          value: (a) => a.submittedBy?.email ?? '—' },
  { label: 'App Code',       key:   'applicationCode' },
  { label: 'Date Applied',   value: (a) => formatDate(a.createdAt) },
  { label: 'Status',         key:   'status' },
  { label: 'Qualified',      value: (a) => a.isQualified ? 'Yes' : a.isVerified ? 'No' : '—' },
]

const filterTabs = [
  { id: 'all',          label: 'All',          countKey: 'total'        },
  { id: 'review',       label: 'For Review',   countKey: 'forReview'   },
  { id: 'qualified',    label: 'Qualified',    countKey: 'qualified'   },
  { id: 'disqualified', label: 'Disqualified', countKey: 'disqualified' },
]
</script>

<template>
  <div class="flex flex-col gap-5 h-full">

    <!-- Page Header -->
    <AppPageHeader title="Applicant Verification" subtitle="Screen PDS submissions and determine initial eligibility." icon="pi-users">
      <template #actions>
        <AppButton v-if="selectedJobId && applications.length > 0" variant="secondary" size="sm" @click="postIER">
          <i class="pi pi-megaphone mr-2"></i> Post IER
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--surface)] border border-[var(--border-main)] p-4 rounded-2xl">
      <select v-model="selectedJobId" @change="loadApplications; statusFilter = 'all'"
        class="w-full sm:w-96 h-10 px-4 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl text-sm font-medium text-[var(--text-main)] focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] outline-none transition-all">
        <option value="">Select a recruitment vacancy...</option>
        <option v-for="job in jobs" :key="job._id" :value="job._id">
          {{ job.positionTitle }} ({{ job.placeOfAssignment }})
        </option>
      </select>
      <div class="flex items-center gap-3">
        <div class="relative w-60">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[10px] pointer-events-none"></i>
          <input v-model="searchQuery" placeholder="Search name or code..."
            class="w-full h-10 pl-9 pr-4 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl text-xs focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] outline-none transition-all" />
        </div>
      </div>
    </div>

    <!-- Stats Row -->
    <div v-if="selectedJobId && !loading" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4 flex flex-col gap-0.5">
        <span class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Total</span>
        <span class="text-2xl font-black text-[var(--text-main)] tabular-nums">{{ stats.total }}</span>
      </div>
      <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4 flex flex-col gap-0.5">
        <span class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">For Review</span>
        <span class="text-2xl font-black text-amber-500 tabular-nums">{{ stats.forReview }}</span>
      </div>
      <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4 flex flex-col gap-0.5">
        <span class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Qualified</span>
        <span class="text-2xl font-black text-emerald-600 tabular-nums">{{ stats.qualified }}</span>
      </div>
      <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4 flex flex-col gap-0.5">
        <span class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Disqualified</span>
        <span class="text-2xl font-black text-red-500 tabular-nums">{{ stats.disqualified }}</span>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div v-if="selectedJobId" class="flex items-center gap-2 flex-wrap">
      <button v-for="tab in filterTabs" :key="tab.id" @click="statusFilter = tab.id"
        :class="['h-9 px-4 rounded-xl border text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2',
          statusFilter === tab.id
            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
            : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-[var(--color-primary-ring)]']">
        {{ tab.label }}
        <span v-if="stats[tab.countKey] !== undefined"
          :class="['px-1.5 py-0.5 rounded-full text-[9px] font-black tabular-nums',
            statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-[var(--bg-app)] text-[var(--text-muted)]']">
          {{ stats[tab.countKey] }}
        </span>
      </button>
    </div>

    <!-- Applicant Table -->
    <div v-if="selectedJobId" class="flex-1 overflow-hidden flex flex-col min-h-0 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl">

      <!-- Table Header -->
      <div class="grid grid-cols-12 px-6 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)] text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest flex-shrink-0">
        <div class="col-span-4">Candidate</div>
        <div class="col-span-3">Application Code</div>
        <div class="col-span-2">Date Applied</div>
        <div class="col-span-1 text-center">Status</div>
        <div class="col-span-2 text-right">Action</div>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--border-main)]">

        <!-- Loading skeleton -->
        <div v-if="loading" v-for="i in 8" :key="i" class="px-6 py-4 animate-pulse flex items-center gap-4">
          <div class="w-9 h-9 rounded-xl bg-[var(--bg-app)] flex-shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3.5 w-44 bg-[var(--bg-app)] rounded"></div>
            <div class="h-2.5 w-28 bg-[var(--bg-app)] rounded"></div>
          </div>
        </div>

        <!-- Rows -->
        <div v-else v-for="app in filtered" :key="app._id"
          class="grid grid-cols-12 px-6 py-3.5 items-center hover:bg-[var(--bg-app)] transition-colors cursor-default">

          <div class="col-span-4 flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-[var(--color-primary-light)] border border-[var(--border-main)] flex items-center justify-center text-xs font-black text-[var(--color-primary)] overflow-hidden flex-shrink-0">
              <img v-if="app.submittedBy?.avatarUrl" :src="app.submittedBy.avatarUrl" class="w-full h-full object-cover" />
              <span v-else>{{ fullName(app).charAt(0) }}</span>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-[var(--text-main)] truncate">{{ fullName(app) }}</p>
              <p class="text-[10px] text-[var(--text-muted)] truncate">{{ app.submittedBy?.email }}</p>
            </div>
          </div>

          <div class="col-span-3">
            <p class="font-mono text-[11px] text-[var(--text-muted)] tracking-tighter">{{ app.applicationCode }}</p>
          </div>

          <div class="col-span-2">
            <p class="text-xs text-[var(--text-sub)]">{{ formatDate(app.createdAt) }}</p>
          </div>

          <div class="col-span-1 flex justify-center">
            <div v-if="app.isVerified"
              :class="['w-2.5 h-2.5 rounded-full flex-shrink-0', app.isQualified ? 'bg-emerald-500' : 'bg-red-400']"
              :title="app.isQualified ? 'Qualified' : 'Disqualified'">
            </div>
            <div v-else class="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" title="Pending Review"></div>
          </div>

          <div class="col-span-2 flex justify-end">
            <button @click="openReview(app)"
              :class="['h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5',
                app.isVerified
                  ? 'bg-[var(--bg-app)] border border-[var(--border-main)] text-[var(--text-muted)] hover:border-[var(--color-primary-ring)] hover:text-[var(--text-main)]'
                  : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]']">
              <i :class="['pi', app.isVerified ? 'pi-eye' : 'pi-shield']" class="text-[10px]"></i>
              {{ app.isVerified ? 'View Audit' : 'Audit Record' }}
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!loading && filtered.length === 0" class="flex flex-col items-center justify-center py-16 gap-3 text-[var(--text-muted)]">
          <i class="pi pi-inbox text-3xl text-[var(--text-faint)]"></i>
          <p class="text-sm font-bold text-[var(--text-sub)]">No applicants found</p>
          <p class="text-xs">{{ statusFilter !== 'all' ? 'Try a different filter tab.' : 'No applications have been submitted yet.' }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-3 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-between items-center flex-shrink-0">
        <div class="flex items-center gap-3">
          <p class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{{ filtered.length }} record{{ filtered.length !== 1 ? 's' : '' }}</p>
          <button v-if="filtered.length > 0" @click="showReport = true"
            class="h-7 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--surface)] text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors flex items-center gap-1.5">
            <i class="pi pi-download text-[9px]"></i> Export
          </button>
        </div>
        <div v-if="selectedJob" class="flex items-center gap-1.5">
          <span class="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest">Screening:</span>
          <AppBadge :variant="selectedJob.status">{{ statusConfig[selectedJob.status]?.label || selectedJob.status }}</AppBadge>
        </div>
      </div>
    </div>

    <!-- Empty: no job selected -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-center gap-3">
      <div class="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border-main)] flex items-center justify-center">
        <i class="pi pi-inbox text-2xl text-[var(--text-faint)]"></i>
      </div>
      <h3 class="text-base font-black text-[var(--text-main)]">Select a Vacancy</h3>
      <p class="text-sm text-[var(--text-muted)] max-w-xs">Choose a vacancy from the toolbar to start auditing PDS records.</p>
    </div>

    <!-- Export Report -->
    <AppTableReport
      v-model="showReport"
      title="Applicants List"
      :subtitle="selectedJob ? `Vacancy: ${selectedJob.positionTitle}` : ''"
      :columns="reportCols"
      :rows="filtered"
      filename="Applicants" />

    <!-- ── FULL-SCREEN AUDIT MODAL ────────────────────────────────────────────── -->
    <Teleport to="body">
    <div v-if="showAuditModal && selected"
      class="fixed inset-0 z-50 flex flex-col bg-[var(--bg-app)] animate-fade-in">

      <!-- Modal Header -->
      <header class="bg-[var(--surface)] border-b border-[var(--border-main)] px-6 py-3.5 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-4">
          <!-- Avatar -->
          <div class="w-9 h-9 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] font-black text-sm flex-shrink-0 overflow-hidden">
            <img v-if="selected.submittedBy?.avatarUrl" :src="selected.submittedBy.avatarUrl" class="w-full h-full object-cover" />
            <span v-else>{{ fullName(selected).charAt(0) }}</span>
          </div>
          <!-- Name / Code -->
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <h2 class="text-sm font-black text-[var(--text-main)]">{{ fullName(selected) }}</h2>
              <span v-if="selected.isVerified"
                :class="['px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border',
                  selected.isQualified
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-600 border-red-200']">
                {{ selected.isQualified ? 'Qualified' : 'Disqualified' }}
              </span>
              <span v-else class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-amber-50 text-amber-700 border-amber-200">
                Pending Review
              </span>
            </div>
            <p class="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
              {{ selected.applicationCode }} &middot; Applied {{ formatDate(selected.createdAt) }}
            </p>
          </div>
        </div>

        <!-- Pipeline Step Indicator -->
        <div class="hidden lg:flex items-center gap-1.5">
          <div v-for="(step, i) in ['Post', 'Screen', 'Assess', 'Rank', 'Appoint']" :key="step" class="flex items-center gap-1.5">
            <div :class="['h-6 px-3 rounded-full text-[9px] font-black uppercase tracking-widest',
              i === 1 ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--bg-app)] text-[var(--text-faint)]']">
              {{ step }}
            </div>
            <i v-if="i < 4" class="pi pi-chevron-right text-[8px] text-[var(--text-faint)]"></i>
          </div>
        </div>

        <!-- Close -->
        <button @click="closeAudit"
          class="w-9 h-9 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--color-primary-ring)] transition-all"
          aria-label="Close audit">
          <i class="pi pi-times text-sm"></i>
        </button>
      </header>

      <!-- Modal Body: Two-pane -->
      <div class="flex-1 flex overflow-hidden">

        <!-- ── LEFT: PDS Document ─────────────────────────────────────────── -->
        <div class="flex-1 flex flex-col overflow-hidden border-r border-[var(--border-main)]">

          <!-- Tab Bar -->
          <div class="bg-[var(--surface)] border-b border-[var(--border-main)] px-5 py-3 flex items-center justify-between flex-shrink-0 gap-4">
            <div class="flex gap-1 flex-wrap">
              <button v-for="tab in pdsTabs" :key="tab.id" @click="activePdsTab = tab.id"
                :class="['h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5',
                  activePdsTab === tab.id
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-main)]']"
                :aria-pressed="activePdsTab === tab.id">
                <i :class="['pi text-[10px]', tab.icon]"></i>
                <span class="hidden sm:inline">{{ tab.label }}</span>
              </button>
            </div>
            <button v-if="selected?.attachments?.length"
              @click="showPreview = !showPreview; selectedDocUrl = selected.attachments[0]?.fileUrl || ''"
              :class="['h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 flex-shrink-0',
                showPreview ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)]']">
              <i :class="['pi', showPreview ? 'pi-eye-slash' : 'pi-file-pdf']"></i>
              {{ showPreview ? 'Hide Files' : 'View Files' }}
            </button>
          </div>

          <!-- Content Area -->
          <div class="flex-1 flex overflow-hidden">

            <!-- PDS Content Pane -->
            <div :class="['overflow-y-auto custom-scrollbar p-8 transition-all duration-300', showPreview ? 'w-1/2' : 'w-full']">
              <Transition name="tab-slide" mode="out-in">
                <div :key="activePdsTab" class="space-y-8">

                  <!-- Personal -->
                  <section v-if="activePdsTab === 'personal'">
                    <h3 class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em] mb-6">Personal Information</h3>
                    <div class="grid grid-cols-2 gap-x-12 gap-y-6">
                      <div v-for="[l, v] in [
                        ['First Name',    selected.applicantData.personalInfo.firstName],
                        ['Last Name',     selected.applicantData.personalInfo.lastName],
                        ['Middle Name',   selected.applicantData.personalInfo.middleName || '—'],
                        ['Date of Birth', formatDate(selected.applicantData.personalInfo.birthDate)],
                        ['Sex',           selected.applicantData.personalInfo.sex],
                        ['Civil Status',  selected.applicantData.personalInfo.civilStatus],
                      ]" :key="l">
                        <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{{ l }}</p>
                        <p class="text-sm font-bold text-[var(--text-main)] mt-1">{{ v || '—' }}</p>
                      </div>
                    </div>
                    <div class="mt-8 pt-6 border-t border-[var(--border-main)] grid grid-cols-2 gap-x-12 gap-y-6">
                      <div>
                        <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Phone</p>
                        <p class="text-sm font-bold text-[var(--text-main)] mt-1">{{ selected.applicantData.personalInfo.contact?.phone || '—' }}</p>
                      </div>
                      <div>
                        <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Email</p>
                        <p class="text-sm font-bold text-[var(--text-main)] mt-1">{{ selected.applicantData.personalInfo.contact?.email || '—' }}</p>
                      </div>
                      <div class="col-span-2">
                        <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Address</p>
                        <p class="text-sm font-bold text-[var(--text-main)] mt-1">
                          {{ [
                            selected.applicantData.personalInfo.address?.sitio,
                            selected.applicantData.personalInfo.address?.barangay,
                            selected.applicantData.personalInfo.address?.municipality,
                            selected.applicantData.personalInfo.address?.province,
                          ].filter(Boolean).join(', ') || '—' }}
                        </p>
                      </div>
                    </div>
                  </section>

                  <!-- Education -->
                  <section v-else-if="activePdsTab === 'education'" class="space-y-4">
                    <h3 class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em]">Educational Background</h3>
                    <div v-if="!selected.applicantData.education?.length" class="text-center py-10">
                      <i class="pi pi-inbox text-2xl text-[var(--text-faint)] mb-2"></i>
                      <p class="text-xs text-[var(--text-muted)]">No education records submitted.</p>
                    </div>
                    <div v-for="edu in selected.applicantData.education" :key="edu._id || edu.school"
                      class="p-5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)]">
                      <div class="flex justify-between items-start gap-4">
                        <div>
                          <p class="text-[9px] font-black text-[var(--color-primary)] uppercase tracking-widest mb-1">{{ edu.level }}</p>
                          <p class="text-sm font-bold text-[var(--text-main)]">{{ edu.degree }}</p>
                          <p class="text-[10px] font-medium text-[var(--text-muted)] mt-1">{{ edu.school }}</p>
                        </div>
                        <span class="flex-shrink-0 text-[9px] font-black px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--border-main)] text-[var(--text-muted)]">
                          {{ edu.yearGraduated || (edu.unitsEarned ? edu.unitsEarned + ' units' : 'N/A') }}
                        </span>
                      </div>
                      <div class="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--border-main)]">
                        <div>
                          <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Period</p>
                          <p class="text-xs font-bold text-[var(--text-main)]">{{ edu.periodFrom }} &mdash; {{ edu.periodTo || 'Present' }}</p>
                        </div>
                        <div v-if="edu.honorsReceived">
                          <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Honors Received</p>
                          <p class="text-xs font-bold text-[var(--color-primary)]">{{ edu.honorsReceived }}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <!-- Eligibility -->
                  <section v-else-if="activePdsTab === 'eligibility'" class="space-y-4">
                    <h3 class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em]">Civil Service Eligibility</h3>
                    <div v-if="!selected.applicantData.eligibility?.length" class="text-center py-10">
                      <i class="pi pi-inbox text-2xl text-[var(--text-faint)] mb-2"></i>
                      <p class="text-xs text-[var(--text-muted)]">No eligibility records submitted.</p>
                    </div>
                    <div v-for="el in selected.applicantData.eligibility" :key="el._id || el.name"
                      class="p-5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)]">
                      <div class="flex justify-between items-start gap-4">
                        <p class="text-sm font-bold text-[var(--text-main)]">{{ el.name }}</p>
                        <span class="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest">
                          <i class="pi pi-verified text-[10px]"></i> Eligibility
                        </span>
                      </div>
                      <div class="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[var(--border-main)]">
                        <div>
                          <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Rating</p>
                          <p class="text-xs font-bold text-[var(--text-main)]">{{ el.rating ? el.rating + '%' : '—' }}</p>
                        </div>
                        <div>
                          <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Exam Date</p>
                          <p class="text-xs font-bold text-[var(--text-main)]">{{ formatDate(el.dateOfExam) }}</p>
                        </div>
                        <div>
                          <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">License Valid Until</p>
                          <p class="text-xs font-bold text-[var(--text-main)]">{{ formatDate(el.licenseValidity) }}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <!-- Experience -->
                  <section v-else-if="activePdsTab === 'experience'" class="space-y-4">
                    <h3 class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em]">Work Experience</h3>
                    <div v-if="!selected.applicantData.experience?.length" class="text-center py-10">
                      <i class="pi pi-inbox text-2xl text-[var(--text-faint)] mb-2"></i>
                      <p class="text-xs text-[var(--text-muted)]">No work experience records submitted.</p>
                    </div>
                    <div v-for="exp in selected.applicantData.experience" :key="exp._id || exp.position"
                      class="p-5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)]">
                      <div class="flex justify-between items-start gap-4">
                        <div>
                          <p class="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">
                            {{ formatDate(exp.periodFrom) }} &mdash; {{ exp.periodTo ? formatDate(exp.periodTo) : 'Present' }}
                          </p>
                          <p class="text-sm font-bold text-[var(--text-main)]">{{ exp.position }}</p>
                          <p class="text-[10px] font-medium text-[var(--text-muted)] mt-1">{{ exp.company }}</p>
                        </div>
                        <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span class="text-[9px] font-black px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--border-main)] text-[var(--text-muted)]">SG-{{ exp.salaryGrade || '—' }}</span>
                          <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase">{{ exp.statusOfAppointment }}</p>
                        </div>
                      </div>
                      <div v-if="exp.isGovernment" class="mt-3 pt-3 border-t border-[var(--border-main)] flex items-center gap-1.5 text-[9px] font-black text-[var(--color-primary)] uppercase tracking-widest">
                        <i class="pi pi-building text-[10px]"></i> Government Service
                      </div>
                    </div>
                  </section>

                  <!-- Training -->
                  <section v-else-if="activePdsTab === 'training'" class="space-y-4">
                    <h3 class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em]">Training &amp; L&amp;D</h3>
                    <div v-if="!selected.applicantData.training?.length" class="text-center py-10">
                      <i class="pi pi-inbox text-2xl text-[var(--text-faint)] mb-2"></i>
                      <p class="text-xs text-[var(--text-muted)]">No training records submitted.</p>
                    </div>
                    <div v-for="trn in selected.applicantData.training" :key="trn._id || trn.title"
                      class="p-5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)]">
                      <div class="flex justify-between items-start gap-4">
                        <div>
                          <p class="text-[9px] font-black text-[var(--color-primary)] uppercase tracking-widest mb-1">
                            {{ trn.hours }} Hours &bull; {{ trn.typeOfLD || 'General' }}
                          </p>
                          <p class="text-sm font-bold text-[var(--text-main)]">{{ trn.title }}</p>
                          <p class="text-[10px] font-medium text-[var(--text-muted)] mt-1">{{ trn.provider }}</p>
                        </div>
                        <div class="text-right flex-shrink-0">
                          <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Period</p>
                          <p class="text-[10px] font-bold text-[var(--text-main)]">{{ formatDate(trn.periodFrom) }}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <!-- Performance Rating -->
                  <section v-else-if="activePdsTab === 'performance'">
                    <h3 class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em] mb-6">Performance Rating</h3>
                    <div v-if="selected.applicantData.performanceRating?.score" class="grid grid-cols-3 gap-4">
                      <div class="p-6 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)] text-center">
                        <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Score</p>
                        <p class="text-4xl font-black text-[var(--color-primary)] tabular-nums">{{ selected.applicantData.performanceRating.score }}</p>
                      </div>
                      <div class="p-6 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)] text-center">
                        <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Adjectival Rating</p>
                        <p class="text-lg font-black text-[var(--text-main)]">{{ selected.applicantData.performanceRating.adjective || '—' }}</p>
                      </div>
                      <div class="p-6 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)] text-center">
                        <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Period Covered</p>
                        <p class="text-sm font-black text-[var(--text-main)]">{{ selected.applicantData.performanceRating.periodCovered || '—' }}</p>
                      </div>
                    </div>
                    <div v-else class="text-center py-10">
                      <i class="pi pi-chart-bar text-2xl text-[var(--text-faint)] mb-2"></i>
                      <p class="text-xs text-[var(--text-muted)]">No performance rating submitted.</p>
                    </div>
                  </section>

                </div>
              </Transition>
            </div>

            <!-- File Preview Pane -->
            <div v-if="showPreview" class="w-1/2 border-l border-[var(--border-main)] flex flex-col flex-shrink-0">
              <div v-if="selected?.attachments?.length > 0" class="flex flex-col h-full">
                <div class="p-3 bg-[var(--surface)] border-b border-[var(--border-main)] flex gap-2 overflow-x-auto flex-shrink-0">
                  <button v-for="file in selected.attachments" :key="file._id" @click="selectedDocUrl = file.fileUrl"
                    :class="[selectedDocUrl === file.fileUrl
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : 'border-[var(--border-main)] bg-[var(--bg-app)] text-[var(--text-muted)]']"
                    class="px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase whitespace-nowrap transition-all">
                    {{ file.type }}
                  </button>
                </div>
                <div class="flex-1 bg-[var(--text-main)] flex items-center justify-center">
                  <iframe v-if="selectedDocUrl" :src="selectedDocUrl" class="w-full h-full border-none"></iframe>
                  <div v-else class="text-center text-[var(--text-faint)] p-8">
                    <i class="pi pi-file-pdf text-4xl mb-4"></i>
                    <p class="text-xs font-bold uppercase tracking-widest">Select a document above</p>
                  </div>
                </div>
              </div>
              <div v-else class="flex-1 flex flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
                <i class="pi pi-cloud-upload text-3xl text-[var(--text-faint)]"></i>
                <p class="text-xs font-black uppercase tracking-widest">No attachments uploaded</p>
              </div>
            </div>

          </div>
        </div>

        <!-- ── RIGHT: Audit Checklist Panel ──────────────────────────────── -->
        <aside class="w-88 flex flex-col bg-[var(--surface)] border-l border-[var(--border-main)] overflow-y-auto custom-scrollbar flex-shrink-0" style="width: 22rem;">

          <!-- Progress Header -->
          <div class="px-6 pt-6 pb-5 border-b border-[var(--border-main)]">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Verification Checklist</h3>
              <span :class="['text-[10px] font-black tabular-nums', checksCompleted === 5 ? 'text-emerald-600' : 'text-[var(--color-primary)]']">
                {{ checksCompleted }}/5
              </span>
            </div>
            <div class="h-2 bg-[var(--bg-app)] rounded-full overflow-hidden">
              <div :class="['h-full rounded-full transition-all duration-500', checksCompleted === 5 ? 'bg-emerald-500' : 'bg-[var(--color-primary)]']"
                :style="{ width: `${(checksCompleted / 5) * 100}%` }"></div>
            </div>
            <p class="text-[9px] text-[var(--text-muted)] mt-2">Review each criterion against the submitted PDS before finalizing.</p>
          </div>

          <!-- Checklist Items -->
          <div class="flex-1 px-4 py-4 space-y-2">
            <div v-for="key in ['education', 'eligibility', 'experience', 'training', 'performance']" :key="key"
              :class="['rounded-xl border p-4 transition-all',
                checklist[key].checked
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-[var(--bg-app)] border-[var(--border-main)] hover:border-[var(--color-primary-ring)]']">
              <div class="flex items-start gap-3">
                <button @click="checklist[key].checked = !checklist[key].checked"
                  :class="['w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                    checklist[key].checked
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-[var(--surface)] border-[var(--border-main)] text-transparent hover:border-emerald-400']"
                  :aria-label="`Toggle ${key} verification`">
                  <i class="pi pi-check text-[9px]"></i>
                </button>
                <div class="flex-1 min-w-0">
                  <p :class="['text-[11px] font-black uppercase tracking-widest capitalize',
                    checklist[key].checked ? 'text-emerald-700' : 'text-[var(--text-sub)]']">
                    {{ key }} verified
                  </p>
                  <input v-model="checklist[key].note" :placeholder="`Note about ${key}...`"
                    class="mt-1.5 w-full text-[10px] bg-transparent border-none focus:ring-0 text-[var(--text-muted)] placeholder:text-[var(--text-faint)] outline-none" />
                </div>
              </div>
            </div>
          </div>

          <!-- Already Verified Info -->
          <div v-if="selected?.isVerified" class="mx-4 mb-2 p-4 bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 rounded-xl">
            <div class="flex items-center gap-2 mb-1">
              <i class="pi pi-check-circle text-[var(--color-primary)] text-sm"></i>
              <p class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest">Previously Verified</p>
            </div>
            <p class="text-[10px] text-[var(--text-muted)]">
              {{ formatDate(selected.verifiedAt) }}
              {{ selected.verifiedBy?.username ? ' by ' + selected.verifiedBy.username : '' }}
            </p>
          </div>

          <!-- Final Determination -->
          <div class="px-4 pb-6 pt-4 space-y-4 border-t border-[var(--border-main)]">
            <div>
              <h3 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest mb-1">Final Determination</h3>
              <p class="text-[9px] text-[var(--text-muted)]">This action advances the applicant to the next pipeline stage or disqualifies them.</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <button @click="verifyQualified = true"
                :class="['h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all',
                  verifyQualified
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-[var(--bg-app)] border-[var(--border-main)] text-[var(--text-muted)] hover:border-emerald-300 hover:text-emerald-600']"
                aria-pressed="verifyQualified">
                <i class="pi pi-check-circle text-xl"></i>
                <span class="text-[9px] font-black uppercase tracking-widest">Qualified</span>
              </button>
              <button @click="verifyQualified = false"
                :class="['h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all',
                  !verifyQualified
                    ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'bg-[var(--bg-app)] border-[var(--border-main)] text-[var(--text-muted)] hover:border-red-300 hover:text-red-500']"
                :aria-pressed="!verifyQualified">
                <i class="pi pi-times-circle text-xl"></i>
                <span class="text-[9px] font-black uppercase tracking-widest">Disqualify</span>
              </button>
            </div>

            <textarea v-if="!verifyQualified" v-model="verifyReason"
              placeholder="Required: State the specific ground for disqualification per CSC rules..."
              class="w-full p-4 bg-[var(--bg-app)] border border-red-200 rounded-xl text-[11px] font-medium min-h-[90px] focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all resize-none outline-none text-[var(--text-main)] placeholder:text-red-300"></textarea>

            <!-- Finalize Button -->
            <button @click="submitVerification"
              :disabled="saving || (!verifyQualified && !verifyReason.trim())"
              :class="['w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                verifyQualified
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white']">
              <i v-if="saving" class="pi pi-spin pi-spinner text-xs"></i>
              <i v-else :class="['pi', verifyQualified ? 'pi-check' : 'pi-times']" class="text-xs"></i>
              {{ saving ? 'Saving...' : verifyQualified ? 'Finalize as Qualified' : 'Finalize Disqualification' }}
            </button>

            <button @click="closeAudit"
              class="w-full h-9 rounded-xl border border-[var(--border-main)] text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest hover:border-[var(--color-primary-ring)] hover:text-[var(--text-main)] transition-all">
              Close Without Saving
            </button>
          </div>

        </aside>
      </div>
    </div>
    </Teleport>

  </div>
</template>

<style scoped>
.tab-slide-enter-active,
.tab-slide-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.tab-slide-enter-from   { opacity: 0; transform: translateX(6px); }
.tab-slide-leave-to     { opacity: 0; transform: translateX(-6px); }
</style>
