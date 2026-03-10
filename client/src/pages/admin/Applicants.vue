<script setup>
import { ref, reactive, computed, onMounted, inject, watch } from 'vue'
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
const isIerPosted = ref(false)

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
    (j.placeOfAssignment || []).toString().toLowerCase().includes(q)
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
    checkIerStatus()
  } else {
    applications.value = []
    isIerPosted.value = false
  }
}

const checkIerStatus = async () => {
  if (!selectedJobId.value) return
  try {
    const { data } = await apiClient.get('/v1/announcements/admin')
    const ier = data.data.find(a => a.job === selectedJobId.value && a.type === 'ier_release')
    isIerPosted.value = !!ier
  } catch (err) {
    console.error('Failed to check IER status', err)
  }
}

const loadApplications = async () => {
  if (!selectedJobId.value) {
    applications.value = []
    return
  }
  loading.value = true
  try {
    const { data } = await apiClient.get(`/v1/applications/job/${selectedJobId.value}`)
    applications.value = data.data
  } finally {
    loading.value = false
  }
}

watch(selectedJobId, () => {
  statusFilter.value = 'review'
  loadApplications()
})

// ── Preview Logic ────────────────────────────────────────────────────────────
const resolveUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000'
  return `${base}${path}`
}

const isImage = computed(() => {
  if (!selectedDocUrl.value) return false
  const url = selectedDocUrl.value.split('?')[0]
  const ext = url.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')
})

const isPdf = computed(() => {
  if (!selectedDocUrl.value) return false
  const url = selectedDocUrl.value.split('?')[0]
  return url.toLowerCase().endsWith('.pdf')
})

const setPreview = (tab) => {
  if (!selected.value) return

  const mapping = {
    personal:    ['id_proof', 'pds_signed'],
    education:   ['transcript', 'diploma'],
    eligibility: ['eligibility'],
    experience:  ['experience', 'service_record'],
    training:    ['training', 'training_cert'],
  }

  const targets = mapping[tab] || []
  const found = selected.value.attachments?.find(a => targets.includes(a.type))
  
  if (found) {
    selectedDocUrl.value = resolveUrl(found.fileUrl)
  } else if (tab === 'personal' && selected.value.submittedBy?.avatarUrl) {
    selectedDocUrl.value = resolveUrl(selected.value.submittedBy.avatarUrl)
  } else {
    selectedDocUrl.value = ''
  }
}

const jumpToProof = (file) => {
  if (!file) return
  
  // 1. Update Preview URL first
  selectedDocUrl.value = resolveUrl(file.fileUrl)
  
  // 2. Identify corresponding tab
  const typeMap = {
    id_proof: 'personal', pds_signed: 'personal',
    transcript: 'education', diploma: 'education',
    eligibility: 'eligibility',
    experience: 'experience', service_record: 'experience',
    training: 'training', training_cert: 'training'
  }
  
  const target = typeMap[file.type]
  if (target && activePdsTab.value !== target) {
    // 3. Temporarily disable watcher or just set tab 
    // (We set selectedDocUrl AFTER tab if we want to ensure it sticks, 
    // but the watcher usually runs after this tick)
    activePdsTab.value = target
    // Re-assert URL after tab change to ensure watcher doesn't pick first-match instead of this specific file
    nextTick(() => { selectedDocUrl.value = resolveUrl(file.fileUrl) })
  }
}

// ── Watchers ─────────────────────────────────────────────────────────────────
watch(activePdsTab, (newTab) => {
  if (showPreview.value) setPreview(newTab)
})

watch(showPreview, (val) => {
  if (val) setPreview(activePdsTab.value)
})

// ── Refresh Snapshot ─────────────────────────────────────────────────────────
const sanitizeApplicantData = (app) => {
  if (!app?.applicantData) return
  
  // Helper to extract a string from a potentially nested object or array
  const extractString = (val) => {
    if (!val) return '—'
    
    if (typeof val === 'string') {
      const trimmed = val.trim()
      
      // Handle JSON strings
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed)
          return extractString(parsed)
        } catch (e) {
          // If not valid JSON, try to extract 'name', 'label', or 'type' using regex (handles Mongoose/inspect format)
          const nameMatch = trimmed.match(/name:\s*['"]([^'"]+)['"]/) || trimmed.match(/label:\s*['"]([^'"]+)['"]/)
          if (nameMatch) return nameMatch[1]
          
          const typeMatch = trimmed.match(/type:\s*['"]([^'"]+)['"]/)
          if (typeMatch) return typeMatch[1]
          
          const valueMatch = trimmed.match(/value:\s*['"]([^'"]+)['"]/)
          if (valueMatch) return valueMatch[1]
        }
      }
      return val
    }
    
    if (Array.isArray(val)) {
      if (val.length === 0) return '—'
      return val.map(v => extractString(v)).filter(v => v && v !== '—').join(', ')
    }
    
    if (typeof val === 'object') {
      // Prioritize most descriptive fields
      return val.label || val.name || val.type || val.title || val.value || JSON.stringify(val)
    }
    
    return String(val)
  }

  const sections = ['education', 'eligibility', 'experience', 'training']
  sections.forEach(key => {
    if (Array.isArray(app.applicantData[key])) {
      app.applicantData[key] = app.applicantData[key].map(item => {
        let normalized = item
        if (typeof item === 'string') {
          try {
            const parsed = JSON.parse(item)
            normalized = (parsed && typeof parsed === 'object') ? parsed : { name: item, isRelevant: true }
          } catch (e) {
            normalized = { 
              name: item, 
              isRelevant: true, 
              _isCorrupt: true,
              auditRemarks: 'Stored as plain string'
            }
          }
        }
        
        // Handle all properties in the record that might be objects
        if (normalized && typeof normalized === 'object') {
          // 1. Primary identification field
          const nameKey = key === 'training' ? 'title' : (key === 'experience' ? 'position' : 'name')
          
          // Special for eligibility: if 'name' is missing but 'type' exists, use 'type' as name
          if (key === 'eligibility' && !normalized.name && normalized.type) {
            normalized.name = extractString(normalized.type)
          }

          // 2. Normalize all fields to strings for simple template display
          Object.keys(normalized).forEach(field => {
            if (field !== 'isRelevant' && field !== 'auditRemarks' && field !== '_isCorrupt') {
              normalized[field] = extractString(normalized[field])
            }
          })
        }
        
        return normalized
      })
    }
  })
}

const syncLoading = ref(false)
const syncFromProfile = async () => {
  const result = await swal.fire({
    title: 'Sync Latest Profile?',
    text: 'This will overwrite the current application snapshot with the candidate\'s latest profile data.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Sync Now',
  })
  if (!result.isConfirmed) return

  syncLoading.value = true
  try {
    const { data } = await apiClient.post(`/v1/applications/${selected.value._id}/sync-profile`)
    const sanitized = data.data
    sanitizeApplicantData(sanitized)
    selected.value = sanitized
    const idx = applications.value.findIndex(a => a._id === selected.value._id)
    if (idx !== -1) applications.value[idx] = sanitized
    toast.fire({ icon: 'success', title: 'Snapshot Synchronized' })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Sync Failed', text: err.response?.data?.message })
  } finally {
    syncLoading.value = false
  }
}



const openReview = (app) => {
  sanitizeApplicantData(app)
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
    title: isIerPosted.value ? 'Re-post Initial Evaluation Results?' : 'Post Initial Evaluation Results?',
    text: isIerPosted.value 
      ? 'This will update the existing IER announcement on the public bulletin.' 
      : 'This will publish the IER to the public bulletin.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Publish Now',
  })
  if (!result.isConfirmed) return
  try {
    await apiClient.post('/v1/announcements/ier', { jobId: selectedJobId.value })
    toast.fire({ icon: 'success', title: 'IER Posted Successfully' })
    isIerPosted.value = true
  } catch {
    toast.fire({ icon: 'error', title: 'Failed to post IER' })
  }
}

const exportIER = async () => {
  if (!selectedJobId.value) return
  try {
    const response = await apiClient.get(`/v1/rqa/${selectedJobId.value}/export-ier`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `IER-${selectedJob.value.positionCode}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Export Failed' })
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
      applicantData: selected.value.applicantData
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
  if (!p) return 'Unknown Candidate'
  return [p.firstName, p.middleName, p.lastName, p.suffix].filter(Boolean).join(' ')
}

const calculateDuration = (from, to, isPresent) => {
  if (!from) return '—'
  const start = new Date(from)
  const end = isPresent ? new Date() : (to ? new Date(to) : new Date())
  
  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()
  
  if (months < 0) {
    years--
    months += 12
  }
  
  const yStr = years > 0 ? `${years} yr${years > 1 ? 's' : ''}` : ''
  const mStr = months > 0 ? `${months} mo${months > 1 ? 's' : ''}` : ''
  
  return [yStr, mStr].filter(Boolean).join(' ') || '0 mos'
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
          <AppButton variant="secondary" icon="pi-download" @click="exportIER" :disabled="loading">Export IER</AppButton>
          <AppButton 
            :variant="isIerPosted ? 'success' : 'secondary'" 
            :icon="isIerPosted ? 'pi-check-circle' : 'pi-megaphone'" 
            @click="postIER">
            {{ isIerPosted ? 'IER Posted' : 'Post IER' }}
          </AppButton>
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

    <!-- ── JOB PICKER MODAL (Refined) ────────────────────────────────────────── -->
    <AppModal v-model="showJobPicker" title="Select Recruitment Vacancy" icon="pi-briefcase" width="max-w-2xl">
      <div class="flex flex-col gap-4">
        <!-- Search bar -->
        <div class="relative group">
          <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none group-focus-within:text-[var(--color-primary)] transition-colors"></i>
          <input 
            v-model="jobPickerSearch" 
            placeholder="Search by position, code, or station..." 
            class="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-bold uppercase tracking-tight
                   text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 
                   focus:border-[var(--color-primary)] transition-all"
            autofocus
          />
        </div>

        <!-- Vacancy List -->
        <div class="max-h-[440px] overflow-y-auto pr-1 custom-scrollbar min-h-[320px] relative">
          <div v-if="filteredJobs.length > 0" class="space-y-2 pb-4">
            <button v-for="job in filteredJobs" :key="job._id" @click="selectJob(job._id)"
              class="w-full p-4 rounded-2xl border transition-all text-left flex items-start justify-between gap-4 group relative overflow-hidden"
              :class="selectedJobId === job._id
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/20 shadow-sm ring-1 ring-[var(--color-primary-ring)]/20'
                : 'border-[var(--border-main)] bg-[var(--surface)] hover:border-[var(--color-primary)] hover:bg-[var(--bg-app)]/40 hover:shadow-md'">
              
              <!-- Selection Indicator -->
              <div v-if="selectedJobId === job._id" 
                class="absolute top-0 right-0 w-8 h-8 bg-[var(--color-primary)] flex items-center justify-center rounded-bl-xl shadow-sm animate-fade-in">
                <i class="pi pi-check text-white text-[10px] font-black"></i>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <span :class="['text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest',
                    job.hiringTrack === 'teaching' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                    job.hiringTrack === 'teaching_related' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                    'bg-slate-50 text-slate-600 border-slate-200']">
                    {{ job.hiringTrack.replace('_', ' ') }}
                  </span>
                  <span class="text-[9px] text-[var(--text-faint)] font-bold uppercase tracking-tighter flex items-center gap-1">
                    <i class="pi pi-calendar text-[8px]"></i> {{ formatDate(job.createdAt) }}
                  </span>
                </div>

                <h4 class="text-sm font-black text-[var(--text-main)] truncate uppercase group-hover:text-[var(--color-primary)] transition-colors leading-tight tracking-tight">
                  {{ job.positionTitle }}
                </h4>
                
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                  <div class="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                    <i class="pi pi-tag text-[9px]"></i>
                    <span class="font-mono text-[var(--text-main)]">{{ job.positionCode }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                    <i class="pi pi-map-marker text-[9px]"></i>
                    <span class="truncate max-w-[220px]">{{ getPlaceName(job.placeOfAssignment) }}</span>
                  </div>
                </div>
              </div>

              <div class="flex flex-col items-end justify-between self-stretch flex-shrink-0 py-0.5">
                <AppBadge :variant="job.status" size="sm" class="font-black uppercase tracking-widest text-[8px]">
                  {{ job.status }}
                </AppBadge>
                
                <div class="flex items-center gap-3">
                  <div class="text-right">
                    <p class="text-[8px] font-black text-[var(--text-faint)] uppercase leading-none mb-1">Applications</p>
                    <p class="text-xs font-black text-[var(--color-primary)] tabular-nums leading-none">{{ job.applications?.length || 0 }}</p>
                  </div>
                  <div class="w-px h-5 bg-[var(--border-main)]"></div>
                  <div class="text-right">
                    <p class="text-[8px] font-black text-[var(--text-faint)] uppercase leading-none mb-1">Slots</p>
                    <p class="text-xs font-black text-[var(--text-main)] tabular-nums leading-none">{{ job.noOfVacancy || (job.itemNumbers?.length || 0) }}</p>
                  </div>
                </div>
              </div>
            </button>
          </div>

          <!-- No results state -->
          <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center mb-4">
              <i class="pi pi-search-minus text-2xl text-[var(--text-faint)]"></i>
            </div>
            <h5 class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">No Vacancies Found</h5>
            <p class="text-[11px] text-[var(--text-muted)] mt-1.5 max-w-[240px] font-medium leading-relaxed">
              We couldn't find any positions matching your search. Try different keywords or browse all.
            </p>
            <AppButton variant="secondary" size="sm" class="mt-5" @click="jobPickerSearch = ''">Clear Search</AppButton>
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
             <AppButton v-if="!selected.isVerified" variant="secondary" size="sm" icon="pi-sync" :loading="syncLoading" @click="syncFromProfile">
               Sync Latest Profile
             </AppButton>
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
                        ['Suffix',       selected.applicantData?.personalInfo?.suffix],
                        ['Birth Date',   formatDate(selected.applicantData?.personalInfo?.birthDate)],
                        ['Sex',          selected.applicantData?.personalInfo?.sex],
                        ['Civil Status', selected.applicantData?.personalInfo?.civilStatus],
                        ['Ethnic Group', selected.applicantData?.personalInfo?.ethnicGroup],
                        ['Religion',     selected.applicantData?.personalInfo?.religion],
                        ['Disability',   selected.applicantData?.personalInfo?.disability],
                        ['GSIS NO.',     selected.applicantData?.personalInfo?.gsisNo],
                        ['PAG-IBIG NO.', selected.applicantData?.personalInfo?.pagibigNo],
                        ['PHILHEALTH',   selected.applicantData?.personalInfo?.philhealthNo],
                        ['SSS NO.',      selected.applicantData?.personalInfo?.sssNo],
                        ['TIN NO.',      selected.applicantData?.personalInfo?.tinNo],
                        ['Agency No.',   selected.applicantData?.personalInfo?.agencyEmployeeNo],
                        ['Contact',      selected.applicantData?.personalInfo?.phones?.[0] || selected.applicantData?.personalInfo?.contact?.phone],
                        ['Email',        selected.applicantData?.personalInfo?.emails?.[0] || selected.applicantData?.personalInfo?.contact?.email],
                        ['Address',      selected.applicantData?.personalInfo?.address ? 
                          [selected.applicantData.personalInfo.address.sitio, selected.applicantData.personalInfo.address.barangay, selected.applicantData.personalInfo.address.municipality, selected.applicantData.personalInfo.address.province].filter(Boolean).join(', ') : '—'],
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
                        class="p-5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)] group hover:border-[var(--color-primary)] transition-all duration-300"
                        :class="{ 'opacity-60 grayscale-[0.5] border-red-100': edu.isRelevant === false }">
                        <div class="flex justify-between items-start gap-4">
                          <div class="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 flex-1">
                            <div v-for="[l, v] in [
                              ['Level', edu.level],
                              ['Degree / Diploma', edu.degree],
                              ['School', edu.school],
                              ['Period', `${edu.periodFrom || '—'} to ${edu.periodTo || '—'}`],
                              ['Status', edu.status],
                              ['Units Earned', edu.unitsEarned],
                              ['Year Graduated', edu.yearGraduated],
                              ['Honors Received', edu.honorsReceived],
                            ]" :key="l">
                              <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{{ l }}</p>
                              <p class="text-xs font-bold text-[var(--text-main)] mt-1 uppercase leading-tight">{{ v || '—' }}</p>
                            </div>
                          </div>

                          <!-- Relevance Toggle -->
                          <div class="flex flex-col items-end gap-2 shrink-0">
                            <div class="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border-main)] shadow-sm">
                              <button 
                                @click="edu.isRelevant = true"
                                :class="[edu.isRelevant !== false ? 'bg-emerald-500 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)]']"
                                class="p-1.5 rounded-md transition-all group/btn relative">
                                <i class="pi pi-check-circle text-[10px]"></i>
                              </button>
                              <button 
                                @click="edu.isRelevant = false"
                                :class="[edu.isRelevant === false ? 'bg-red-500 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)]']"
                                class="p-1.5 rounded-md transition-all group/btn relative">
                                <i class="pi pi-times-circle text-[10px]"></i>
                              </button>
                            </div>
                            <span v-if="edu.isRelevant === false" class="text-[8px] font-black text-red-500 uppercase tracking-widest px-1.5 py-0.5 bg-red-50 rounded border border-red-100">Irrelevant</span>
                          </div>
                        </div>

                        <!-- Remarks if Irrelevant -->
                        <div v-if="edu.isRelevant === false" class="mt-4 pt-4 border-t border-dashed border-red-200 animate-fade-in">
                          <p class="text-[9px] font-bold text-red-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <i class="pi pi-info-circle text-[10px]"></i> Audit Remarks
                          </p>
                          <input 
                            v-model="edu.auditRemarks" 
                            type="text" 
                            placeholder="Reason for irrelevance (e.g. 'Not related to field of position')"
                            class="w-full bg-[var(--surface)] border border-red-200 rounded-lg px-3 py-2 text-[10px] font-medium focus:ring-1 focus:ring-red-300 outline-none transition-all placeholder:italic"
                          />
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
                        class="p-5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)] hover:border-[var(--color-primary)] transition-all duration-300"
                        :class="{ 'opacity-60 grayscale-[0.5] border-red-100': elig.isRelevant === false }">
                        <div class="flex justify-between items-start gap-4">
                          <div class="grid grid-cols-2 gap-x-8 gap-y-4 flex-1">
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

                          <!-- Relevance Toggle -->
                          <div class="flex flex-col items-end gap-2 shrink-0">
                            <div class="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border-main)] shadow-sm">
                              <button 
                                @click="elig.isRelevant = true"
                                :class="[elig.isRelevant !== false ? 'bg-emerald-500 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)]']"
                                class="p-1.5 rounded-md transition-all group/btn relative">
                                <i class="pi pi-check-circle text-[10px]"></i>
                              </button>
                              <button 
                                @click="elig.isRelevant = false"
                                :class="[elig.isRelevant === false ? 'bg-red-500 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)]']"
                                class="p-1.5 rounded-md transition-all group/btn relative">
                                <i class="pi pi-times-circle text-[10px]"></i>
                              </button>
                            </div>
                            <span v-if="elig.isRelevant === false" class="text-[8px] font-black text-red-500 uppercase tracking-widest px-1.5 py-0.5 bg-red-50 rounded border border-red-100">Irrelevant</span>
                          </div>
                        </div>

                        <!-- Remarks if Irrelevant -->
                        <div v-if="elig.isRelevant === false" class="mt-4 pt-4 border-t border-dashed border-red-200 animate-fade-in">
                          <p class="text-[9px] font-bold text-red-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <i class="pi pi-info-circle text-[10px]"></i> Audit Remarks
                          </p>
                          <input 
                            v-model="elig.auditRemarks" 
                            type="text" 
                            placeholder="Reason for irrelevance (e.g. 'Not required for this level')"
                            class="w-full bg-[var(--surface)] border border-red-200 rounded-lg px-3 py-2 text-[10px] font-medium focus:ring-1 focus:ring-red-300 outline-none transition-all placeholder:italic"
                          />
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
                        class="p-5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)] hover:border-[var(--color-primary)] transition-all duration-300"
                        :class="{ 'opacity-60 grayscale-[0.5] border-red-100': exp.isRelevant === false }">
                        <div class="flex justify-between items-start gap-4">
                          <div class="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 flex-1">
                            <div class="col-span-2">
                               <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Position</p>
                               <p class="text-xs font-bold text-[var(--text-main)] mt-1 uppercase">{{ exp.position }}</p>
                            </div>
                            <div>
                               <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Duration</p>
                               <p class="text-xs font-bold text-[var(--color-primary)] mt-1 uppercase">{{ calculateDuration(exp.periodFrom, exp.periodTo, exp.isPresent) }}</p>
                            </div>
                            <div class="col-span-2">
                               <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Agency / Company</p>
                               <p class="text-xs font-bold text-[var(--text-main)] mt-1 uppercase">{{ exp.company }}</p>
                            </div>
                            <div>
                               <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">SG / Gov't</p>
                               <p class="text-[10px] font-bold text-[var(--text-main)] mt-1 uppercase">SG-{{ exp.salaryGrade || '—' }} &bull; {{ exp.isGov ? 'Yes' : 'No' }}</p>
                            </div>
                            <div>
                               <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Period</p>
                               <p class="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase whitespace-nowrap">{{ formatDate(exp.periodFrom) }} - {{ exp.isPresent ? 'Present' : formatDate(exp.periodTo) }}</p>
                            </div>
                          </div>

                          <!-- Relevance Toggle -->
                          <div class="flex flex-col items-end gap-2 shrink-0">
                            <div class="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border-main)] shadow-sm">
                              <button 
                                @click="exp.isRelevant = true"
                                :class="[exp.isRelevant !== false ? 'bg-emerald-500 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)]']"
                                class="p-1.5 rounded-md transition-all group/btn relative">
                                <i class="pi pi-check-circle text-[10px]"></i>
                              </button>
                              <button 
                                @click="exp.isRelevant = false"
                                :class="[exp.isRelevant === false ? 'bg-red-500 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)]']"
                                class="p-1.5 rounded-md transition-all group/btn relative">
                                <i class="pi pi-times-circle text-[10px]"></i>
                              </button>
                            </div>
                            <span v-if="exp.isRelevant === false" class="text-[8px] font-black text-red-500 uppercase tracking-widest px-1.5 py-0.5 bg-red-50 rounded border border-red-100">Irrelevant</span>
                          </div>
                        </div>

                        <!-- Remarks if Irrelevant -->
                        <div v-if="exp.isRelevant === false" class="mt-4 pt-4 border-t border-dashed border-red-200 animate-fade-in">
                          <p class="text-[9px] font-bold text-red-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <i class="pi pi-info-circle text-[10px]"></i> Audit Remarks
                          </p>
                          <input 
                            v-model="exp.auditRemarks" 
                            type="text" 
                            placeholder="Reason for irrelevance (e.g. 'Not related to teaching duties')"
                            class="w-full bg-[var(--surface)] border border-red-200 rounded-lg px-3 py-2 text-[10px] font-medium focus:ring-1 focus:ring-red-300 outline-none transition-all placeholder:italic"
                          />
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
                        class="p-5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)] hover:border-[var(--color-primary)] transition-all duration-300"
                        :class="{ 'opacity-60 grayscale-[0.5] border-red-100': trn.isRelevant === false }">
                        <div class="flex justify-between items-start gap-4">
                          <div class="grid grid-cols-2 gap-x-8 gap-y-4 flex-1">
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

                          <!-- Relevance Toggle -->
                          <div class="flex flex-col items-end gap-2 shrink-0">
                            <div class="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border-main)] shadow-sm">
                              <button 
                                @click="trn.isRelevant = true"
                                :class="[trn.isRelevant !== false ? 'bg-emerald-500 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)]']"
                                class="p-1.5 rounded-md transition-all group/btn relative">
                                <i class="pi pi-check-circle text-[10px]"></i>
                              </button>
                              <button 
                                @click="trn.isRelevant = false"
                                :class="[trn.isRelevant === false ? 'bg-red-500 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)]']"
                                class="p-1.5 rounded-md transition-all group/btn relative">
                                <i class="pi pi-times-circle text-[10px]"></i>
                              </button>
                            </div>
                            <span v-if="trn.isRelevant === false" class="text-[8px] font-black text-red-500 uppercase tracking-widest px-1.5 py-0.5 bg-red-50 rounded border border-red-100">Irrelevant</span>
                          </div>
                        </div>

                        <!-- Remarks if Irrelevant -->
                        <div v-if="trn.isRelevant === false" class="mt-4 pt-4 border-t border-dashed border-red-200 animate-fade-in">
                          <p class="text-[9px] font-bold text-red-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <i class="pi pi-info-circle text-[10px]"></i> Audit Remarks
                          </p>
                          <input 
                            v-model="trn.auditRemarks" 
                            type="text" 
                            placeholder="Reason for irrelevance (e.g. 'Below required hours')"
                            class="w-full bg-[var(--surface)] border border-red-200 rounded-lg px-3 py-2 text-[10px] font-medium focus:ring-1 focus:ring-red-300 outline-none transition-all placeholder:italic"
                          />
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
                  <button v-for="file in selected.attachments" :key="file._id" @click="jumpToProof(file)"
                    :class="[selectedDocUrl === resolveUrl(file.fileUrl) ? 'bg-[var(--color-primary)] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60']"
                    class="px-3 py-1.5 rounded text-[9px] font-bold uppercase transition-all whitespace-nowrap">{{ file.type }}</button>
                </div>
                
                <div v-if="!selectedDocUrl" class="flex-1 flex flex-col items-center justify-center text-white/20 gap-3">
                   <i class="pi pi-file-pdf text-4xl"></i>
                   <p class="text-xs font-bold uppercase tracking-widest">Select a document to preview</p>
                </div>

                <div v-else class="flex-1 overflow-hidden flex flex-col bg-slate-900">
                   <img v-if="isImage" :src="selectedDocUrl" class="w-full h-full object-contain" />
                   <iframe v-else-if="isPdf" :src="selectedDocUrl" class="w-full h-full border-none bg-white"></iframe>
                   <div v-else class="flex-1 flex flex-col items-center justify-center text-white/40 p-10 text-center gap-4">
                      <i class="pi pi-info-circle text-3xl"></i>
                      <p class="text-xs font-bold uppercase leading-relaxed">Preview not supported for this file type.<br/>You can download it to view.</p>
                      <a :href="selectedDocUrl" target="_blank" class="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Download File</a>
                   </div>
                </div>
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
            <div v-if="!selected.isVerified" class="p-6 bg-[var(--surface)] border-t border-[var(--border-main)] space-y-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
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
            
            <!-- Read-only footer if verified -->
            <div v-else class="p-6 bg-[var(--bg-app)] border-t border-[var(--border-main)] text-center">
               <p class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Snapshot Locked</p>
               <p class="text-[9px] text-[var(--text-faint)] mt-1 italic">This record is a permanent historical archive.</p>
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
