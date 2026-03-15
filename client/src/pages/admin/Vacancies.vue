<script setup>
import { ref, computed, watch, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'
import { AppButton, AppBadge, AppModal, AppInput, AppSelect, AppTextarea, AppTableReport, AppPageHeader, AppFilterBar } from '@/components/ui'
import { statusConfig } from '@/utils/statusColors'
import { ELIGIBILITY_GROUPS } from '@/utils/eligibilityOptions'
import { useRecruitmentStore } from '@/stores/recruitment'

const toast = inject('$toast')
const swal  = inject('$swal')
const router = useRouter()
const authStore = useAuthStore()
const recruitmentStore = useRecruitmentStore()

// ... rest of state ...

const manageRecruitment = (jobId) => {
  recruitmentStore.setSelectedJobId(jobId)
  router.push('/admin/applicants')
}

// ─── Data ──────────────────────────────────────────────────────────────────
const jobs      = ref([])
const templates = ref([])
const loading   = ref(true)

// ─── Filters / Sort ────────────────────────────────────────────────────────
const searchQuery  = ref('')
const filterStatus = ref('')
const filterTrack  = ref('')
const sortBy       = ref('createdAt')
const sortDir      = ref('desc')

// ─── Job Form Drawer ───────────────────────────────────────────────────────
const showDrawer    = ref(false)
const isEditing     = ref(false)
const drawerLoading = ref(false)
const editingId     = ref(null)
const activeSection = ref(0)

// ─── Template Manager Modal ────────────────────────────────────────────────
const showTemplateModal  = ref(false)
const templateSearch     = ref('')
const templateView       = ref('list')   // 'list' | 'form'
const templateFormMode   = ref('create') // 'create' | 'edit'
const templateSaving     = ref(false)
const editingTemplateId  = ref(null)
const templateFormTab    = ref('position')  // 'position' | 'qs'

const emptyTemplateForm = () => ({
  positionTitle: '', positionCode: '', description: '',
  education: '', experience: '', minExperienceMonths: 0,
  trainings: '', minTrainingHours: 0, eligibility: [],
  competencyRequirements: [],
  salary: '', salaryGrade: '',
  employmentType: 'permanent', hiringTrack: 'non_teaching',
})
const templateForm = ref(emptyTemplateForm())

// ─── None Required ─────────────────────────────────────────────────────────
const NONE_REQ = 'None Required'

// ─── Eligibility pending-add selectors ─────────────────────────────────────
const pendingEligibility         = ref('')
const pendingTemplateEligibility = ref('')

const emptyForm = () => ({
  positionTitle: '', positionCode: '', description: '',
  education: '', experience: '', minExperienceMonths: 0,
  trainings: '', minTrainingHours: 0, eligibility: [],
  competencyRequirements: [], itemNumbers: [''],
  salary: '', salaryGrade: '', placeOfAssignment: [''],
  employmentType: 'permanent', hiringTrack: 'non_teaching',
  hideVacancyCount: false,
  status: 'draft', deadline: '',
})
const form = ref(emptyForm())

// ─── Export ────────────────────────────────────────────────────────────────
const showReport = ref(false)
const reportCols = [
  { label: 'Position Title', key: 'positionTitle' },
  { label: 'Item Code',      key: 'positionCode'  },
  { label: 'SG',             key: 'salaryGrade'   },
  { label: 'Track',          value: (r) => ({ teaching: 'Teaching', teaching_related: 'Teach.-Related', non_teaching: 'Non-Teaching' })[r.hiringTrack] ?? r.hiringTrack },
  { label: 'Status',         value: (r) => statusConfig[r.status]?.label ?? r.status },
  { label: 'Place',          value: (r) => Array.isArray(r.placeOfAssignment) ? r.placeOfAssignment.join(', ') : (r.placeOfAssignment ?? '') },
  { label: 'Deadline',       value: (r) => formatDate(r.deadline) },
  { label: 'Applicants',     value: (r) => r.applications?.length ?? 0 },
]

// ─── Fetch ─────────────────────────────────────────────────────────────────
const fetchJobs = async () => {
  loading.value = true
  try {
    const { data } = await apiClient.get('/v1/jobs')
    jobs.value = data.data
  } catch {
    toast.fire({ icon: 'error', title: 'Error', text: 'Failed to load vacancies.' })
  } finally {
    loading.value = false
  }
}

const fetchTemplates = async () => {
  try {
    const { data } = await apiClient.get('/v1/job-templates')
    templates.value = data.data
  } catch {
    // silent — templates are non-critical
  }
}

onMounted(() => { fetchJobs(); fetchTemplates() })

// ─── Computed ──────────────────────────────────────────────────────────────
const filteredJobs = computed(() => {
  let list = [...jobs.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(j =>
      j.positionTitle?.toLowerCase().includes(q) ||
      j.positionCode?.toLowerCase().includes(q) ||
      (Array.isArray(j.placeOfAssignment) ? j.placeOfAssignment.join(' ') : j.placeOfAssignment ?? '').toLowerCase().includes(q)
    )
  }
  if (filterStatus.value) list = list.filter(j => j.status === filterStatus.value)
  if (filterTrack.value)  list = list.filter(j => j.hiringTrack === filterTrack.value)
  list.sort((a, b) => {
    let vA, vB
    if (sortBy.value === 'positionTitle') {
      vA = a.positionTitle?.toLowerCase() ?? ''; vB = b.positionTitle?.toLowerCase() ?? ''
    } else if (sortBy.value === 'salaryGrade') {
      vA = Number(a.salaryGrade) || 0; vB = Number(b.salaryGrade) || 0
    } else if (sortBy.value === 'deadline') {
      vA = a.deadline ? new Date(a.deadline).getTime() : 0
      vB = b.deadline ? new Date(b.deadline).getTime() : 0
    } else if (sortBy.value === 'applicants') {
      vA = a.applications?.length ?? 0; vB = b.applications?.length ?? 0
    } else {
      vA = new Date(a.createdAt).getTime(); vB = new Date(b.createdAt).getTime()
    }
    if (vA < vB) return sortDir.value === 'asc' ? -1 : 1
    if (vA > vB) return sortDir.value === 'asc' ?  1 : -1
    return 0
  })
  return list
})

const canManage = computed(() => authStore.can('vac_create'))
const hasFilters = computed(() => searchQuery.value || filterStatus.value || filterTrack.value)

const filteredTemplates = computed(() => {
  const q = templateSearch.value.toLowerCase().trim()
  if (!q) return templates.value
  return templates.value.filter(t =>
    t.positionTitle?.toLowerCase().includes(q) ||
    (t.positionCode || '').toLowerCase().includes(q)
  )
})

// ─── Pagination ─────────────────────────────────────────────────────────────
const currentPage = ref(1)
const pageSize    = ref(15)
watch([searchQuery, filterStatus, filterTrack], () => { currentPage.value = 1 })

const pagedJobs  = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredJobs.value.slice(start, start + pageSize.value)
})
const totalPages  = computed(() => Math.max(1, Math.ceil(filteredJobs.value.length / pageSize.value)))
const pageNumbers = computed(() => {
  const p = totalPages.value
  if (p <= 7) return Array.from({ length: p }, (_, i) => i + 1)
  if (currentPage.value <= 4) return [1, 2, 3, 4, 5, '...', p]
  if (currentPage.value >= p - 3) return [1, '...', p - 4, p - 3, p - 2, p - 1, p]
  return [1, '...', currentPage.value - 1, currentPage.value, currentPage.value + 1, '...', p]
})

const toggleSort = (field) => {
  if (sortBy.value === field) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortBy.value = field; sortDir.value = 'asc' }
}
const sortIcon = (field) => {
  if (sortBy.value !== field) return 'pi-sort text-[var(--text-faint)]'
  return sortDir.value === 'asc' ? 'pi-sort-amount-up text-[var(--color-primary)]' : 'pi-sort-amount-down text-[var(--color-primary)]'
}
const clearFilters = () => { searchQuery.value = ''; filterStatus.value = ''; filterTrack.value = '' }

// ─── Job CRUD ─────────────────────────────────────────────────────────────
const openCreate = () => {
  form.value = emptyForm()
  editingId.value = null; isEditing.value = false; activeSection.value = 0; showDrawer.value = true
}
const openEdit = (job) => {
  form.value = {
    positionTitle: job.positionTitle, positionCode: job.positionCode,
    description: job.description || '',
    education: job.qualifications?.education ?? '',
    experience: job.qualifications?.experience ?? '',
    minExperienceMonths: job.qualifications?.minExperienceMonths ?? 0,
    trainings: job.qualifications?.trainings ?? '',
    minTrainingHours: job.qualifications?.minTrainingHours ?? 0,
    eligibility: Array.isArray(job.qualifications?.eligibility) ? [...job.qualifications.eligibility] : (job.qualifications?.eligibility ? [job.qualifications.eligibility] : []),
    competencyRequirements: job.qualifications?.competencyRequirements ? [...job.qualifications.competencyRequirements] : [],
    itemNumbers: job.itemNumbers?.length ? [...job.itemNumbers] : [''],
    salary: job.salary, salaryGrade: job.salaryGrade,
    placeOfAssignment: Array.isArray(job.placeOfAssignment) ? [...job.placeOfAssignment] : (job.placeOfAssignment ? [job.placeOfAssignment] : ['']),
    employmentType: job.employmentType ?? 'permanent',
    hiringTrack: job.hiringTrack ?? 'non_teaching',
    hideVacancyCount: job.hideVacancyCount ?? false,
    status: job.status ?? 'draft',
    deadline: job.deadline ? job.deadline.slice(0, 10) : '',
  }
  editingId.value = job._id; isEditing.value = true; activeSection.value = 0; showDrawer.value = true
}

const prefillFromTemplate = (tpl) => {
  form.value.positionTitle       = tpl.positionTitle
  form.value.positionCode        = tpl.positionCode
  form.value.description         = tpl.description || ''
  form.value.education           = tpl.qualifications?.education ?? ''
  form.value.experience          = tpl.qualifications?.experience ?? ''
  form.value.minExperienceMonths = tpl.qualifications?.minExperienceMonths ?? 0
  form.value.trainings           = tpl.qualifications?.trainings ?? ''
  form.value.minTrainingHours    = tpl.qualifications?.minTrainingHours ?? 0
  form.value.eligibility         = Array.isArray(tpl.qualifications?.eligibility) ? [...tpl.qualifications.eligibility] : (tpl.qualifications?.eligibility ? [tpl.qualifications.eligibility] : [])
  form.value.competencyRequirements = tpl.qualifications?.competencyRequirements ? [...tpl.qualifications.competencyRequirements] : []
  form.value.salary              = tpl.salary
  form.value.salaryGrade         = tpl.salaryGrade
  form.value.employmentType      = tpl.employmentType ?? 'permanent'
  form.value.hiringTrack         = tpl.hiringTrack ?? 'non_teaching'
  showTemplateModal.value        = false
  templateSearch.value           = ''
  templateView.value             = 'list'
}

const toggleNone = (field) => {
  form.value[field] = form.value[field] === NONE_REQ ? '' : NONE_REQ
}

const toggleNoneTemplate = (field) => {
  templateForm.value[field] = templateForm.value[field] === NONE_REQ ? '' : NONE_REQ
}

// ─── Eligibility multi-tag helpers ─────────────────────────────────────────
const addEligibility = (arr, value) => {
  if (!value || arr.includes(value)) return
  if (value === NONE_REQ) { arr.splice(0, arr.length, NONE_REQ); return }
  const idx = arr.indexOf(NONE_REQ)
  if (idx !== -1) arr.splice(idx, 1)
  arr.push(value)
}
const removeEligibility = (arr, value) => {
  const i = arr.indexOf(value)
  if (i !== -1) arr.splice(i, 1)
}
const toggleNoneEligibility = (arr) => {
  const idx = arr.indexOf(NONE_REQ)
  if (idx !== -1) arr.splice(idx, 1)
  else arr.splice(0, arr.length, NONE_REQ)
}

const handleDelete = async (job) => {
  const result = await swal.fire({
    title: 'Delete Vacancy?',
    html: `Permanently remove <strong>${job.positionTitle}</strong>? This cannot be undone.`,
    icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#dc2626', confirmButtonText: 'Delete', reverseButtons: true,
  })
  if (!result.isConfirmed) return
  try {
    await apiClient.delete(`/v1/jobs/${job._id}`)
    jobs.value = jobs.value.filter(j => j._id !== job._id)
    toast.fire({ icon: 'success', title: 'Vacancy Deleted' })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message ?? 'Delete failed.' })
  }
}

const handleSubmit = async () => {
  drawerLoading.value = true
  const payload = { ...form.value }
  payload.itemNumbers = payload.itemNumbers.filter(n => n.trim())
  payload.competencyRequirements = payload.competencyRequirements.filter(c => c.trim())
  payload.placeOfAssignment = payload.placeOfAssignment.filter(p => p.trim())
  try {
    if (isEditing.value) {
      const { data } = await apiClient.patch(`/v1/jobs/${editingId.value}`, payload)
      const idx = jobs.value.findIndex(j => j._id === editingId.value)
      if (idx !== -1) jobs.value[idx] = data.data
      toast.fire({ icon: 'success', title: 'Vacancy Updated' })
    } else {
      const { data } = await apiClient.post('/v1/jobs', payload)
      jobs.value.unshift(data.data)
      toast.fire({ icon: 'success', title: 'Vacancy Created' })
    }
    showDrawer.value = false
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message ?? 'Save failed.' })
  } finally {
    drawerLoading.value = false
  }
}

// ─── Template CRUD ────────────────────────────────────────────────────────
const openTemplateCreate = () => {
  templateForm.value = emptyTemplateForm()
  editingTemplateId.value = null
  templateFormMode.value = 'create'
  templateFormTab.value = 'position'
  templateView.value = 'form'
}

const openTemplateEdit = (tpl) => {
  templateForm.value = {
    positionTitle: tpl.positionTitle, positionCode: tpl.positionCode,
    description: tpl.description || '',
    education: tpl.qualifications?.education ?? '',
    experience: tpl.qualifications?.experience ?? '',
    minExperienceMonths: tpl.qualifications?.minExperienceMonths ?? 0,
    trainings: tpl.qualifications?.trainings ?? '',
    minTrainingHours: tpl.qualifications?.minTrainingHours ?? 0,
    eligibility: Array.isArray(tpl.qualifications?.eligibility) ? [...tpl.qualifications.eligibility] : (tpl.qualifications?.eligibility ? [tpl.qualifications.eligibility] : []),
    competencyRequirements: tpl.qualifications?.competencyRequirements ? [...tpl.qualifications.competencyRequirements] : [],
    salary: tpl.salary, salaryGrade: tpl.salaryGrade,
    employmentType: tpl.employmentType ?? 'permanent',
    hiringTrack: tpl.hiringTrack ?? 'non_teaching',
  }
  editingTemplateId.value = tpl._id
  templateFormMode.value = 'edit'
  templateFormTab.value = 'position'
  templateView.value = 'form'
}

const deleteTemplate = async (tpl) => {
  const result = await swal.fire({
    title: 'Delete Template?',
    html: `Remove <strong>${tpl.positionTitle}</strong> from your template library?`,
    icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#dc2626', confirmButtonText: 'Delete', reverseButtons: true,
  })
  if (!result.isConfirmed) return
  try {
    await apiClient.delete(`/v1/job-templates/${tpl._id}`)
    templates.value = templates.value.filter(t => t._id !== tpl._id)
    toast.fire({ icon: 'success', title: 'Template Deleted' })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message ?? 'Delete failed.' })
  }
}

const saveTemplate = async () => {
  templateSaving.value = true
  const tf = templateForm.value
  const payload = {
    positionTitle: tf.positionTitle, positionCode: tf.positionCode,
    description: tf.description,
    education: tf.education, experience: tf.experience,
    minExperienceMonths: tf.minExperienceMonths,
    trainings: tf.trainings, minTrainingHours: tf.minTrainingHours,
    eligibility: tf.eligibility,
    competencyRequirements: (tf.competencyRequirements || []).filter(c => c.trim()),
    salary: tf.salary, salaryGrade: tf.salaryGrade,
    employmentType: tf.employmentType, hiringTrack: tf.hiringTrack,
  }
  try {
    if (templateFormMode.value === 'edit') {
      const { data } = await apiClient.patch(`/v1/job-templates/${editingTemplateId.value}`, payload)
      const idx = templates.value.findIndex(t => t._id === editingTemplateId.value)
      if (idx !== -1) templates.value[idx] = data.data
      toast.fire({ icon: 'success', title: 'Template Updated' })
    } else {
      const { data } = await apiClient.post('/v1/job-templates', payload)
      templates.value.unshift(data.data)
      toast.fire({ icon: 'success', title: 'Template Saved' })
    }
    templateView.value = 'list'
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message ?? 'Save failed.' })
  } finally {
    templateSaving.value = false
  }
}

// ─── Section nav ──────────────────────────────────────────────────────────
const formSections = [
  { label: 'Position',   icon: 'pi-id-card' },
  { label: 'Plantilla',  icon: 'pi-list-check' },
  { label: 'Assignment', icon: 'pi-map-marker' },
  { label: 'QS',         icon: 'pi-graduation-cap' },
  { label: 'Competency', icon: 'pi-star' },
]
const goToSection = (idx) => { activeSection.value = idx }

// ─── Helpers ───────────────────────────────────────────────────────────────
const addItem    = (arr) => arr.push('')
const removeItem = (arr, i) => arr.splice(i, 1)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const isExpired  = (d) => d && new Date(d) < new Date()
const trackLabel = { teaching: 'Teaching', teaching_related: 'Teach.-Related', non_teaching: 'Non-Teaching' }

const SELECT_CLS = 'w-full h-10 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all appearance-none'

// ─── Bulk Selection ────────────────────────────────────────────────────────
const selectedIds    = ref(new Set())
const bulkLoading    = ref(false)
const showBulkPublish = ref(false)
const bulkDeadline   = ref('')

const allOnPageSelected = computed(() =>
  pagedJobs.value.length > 0 && pagedJobs.value.every(j => selectedIds.value.has(j._id))
)
const someOnPageSelected = computed(() =>
  pagedJobs.value.some(j => selectedIds.value.has(j._id)) && !allOnPageSelected.value
)

const toggleSelectAll = () => {
  if (allOnPageSelected.value) pagedJobs.value.forEach(j => selectedIds.value.delete(j._id))
  else pagedJobs.value.forEach(j => selectedIds.value.add(j._id))
}
const toggleSelect = (id) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  else selectedIds.value.add(id)
}
const clearSelection = () => { selectedIds.value = new Set() }

// Clear selection when page/filter changes
watch([currentPage, searchQuery, filterStatus, filterTrack], clearSelection)

const bulkUpdateStatus = async (status, deadline = null) => {
  bulkLoading.value = true
  const ids = [...selectedIds.value]
  try {
    const payload = { ids, status }
    if (deadline) payload.deadline = deadline
    await apiClient.patch('/v1/jobs/bulk-status', payload)
    ids.forEach(id => {
      const job = jobs.value.find(j => j._id === id)
      if (job) {
        job.status = status
        if (deadline !== null) job.deadline = deadline || null
      }
    })
    clearSelection()
    toast.fire({ icon: 'success', title: `${ids.length} posting${ids.length !== 1 ? 's' : ''} marked as ${status}` })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Bulk update failed', text: err.response?.data?.message ?? 'Unknown error' })
  } finally {
    bulkLoading.value = false
    showBulkPublish.value = false
    bulkDeadline.value = ''
  }
}

const confirmBulkClose = async () => {
  const result = await swal.fire({
    title: `Close ${selectedIds.value.size} Posting${selectedIds.value.size !== 1 ? 's' : ''}?`,
    text: 'Selected postings will be marked as Closed and removed from the public board.',
    icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#dc2626', confirmButtonText: 'Close Postings', reverseButtons: true,
  })
  if (result.isConfirmed) bulkUpdateStatus('closed')
}

const confirmBulkArchive = async () => {
  const result = await swal.fire({
    title: `Archive ${selectedIds.value.size} Posting${selectedIds.value.size !== 1 ? 's' : ''}?`,
    text: 'Archived postings are hidden from all views. This can be reversed individually.',
    icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#6b7280', confirmButtonText: 'Archive', reverseButtons: true,
  })
  if (result.isConfirmed) bulkUpdateStatus('archived')
}
</script>

<template>
  <div class="flex flex-col gap-5 animate-fade-in-up">

    <AppPageHeader title="Active Postings" subtitle="Manage recruitment vacancies and qualification standards." icon="pi-briefcase">
      <template #actions>
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-xs font-medium text-[var(--text-muted)]">
          <i class="pi pi-briefcase text-[11px]"></i>
          <span>{{ filteredJobs.length }} posting{{ filteredJobs.length !== 1 ? 's' : '' }}</span>
        </div>
        <button @click="fetchJobs" title="Refresh"
          class="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--border-main)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors">
          <i :class="['pi pi-refresh text-sm', { 'animate-spin': loading }]"></i>
        </button>
        <AppButton v-if="canManage" variant="primary" icon="pi-plus" @click="openCreate">New Posting</AppButton>
      </template>
    </AppPageHeader>

    <!-- ── Toolbar ───────────────────────────────────────────────────── -->
    <AppFilterBar
      v-model:search="searchQuery"
      placeholder="Search by title, code, or location..."
      :filter-count="Number(!!filterStatus) + Number(!!filterTrack)"
      @clear="clearFilters"
    >
      <template #filter-extra>
        <p class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wide px-1">Status</p>
        <AppSelect
          v-model="filterStatus"
          :options="[
            { label: 'All Status',  value: '' },
            { label: 'Draft',       value: 'draft' },
            { label: 'Published',   value: 'published' },
            { label: 'Closed',      value: 'closed' },
            { label: 'Archived',    value: 'archived' },
          ]"
          size="sm" label="" placeholder="All Status"
        />
        <p class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wide px-1">Hiring Track</p>
        <AppSelect
          v-model="filterTrack"
          :options="[
            { label: 'All Tracks',       value: '' },
            { label: 'Teaching',         value: 'teaching' },
            { label: 'Teaching-Related', value: 'teaching_related' },
            { label: 'Non-Teaching',     value: 'non_teaching' },
          ]"
          size="sm" label="" placeholder="All Tracks"
        />
      </template>
      <template #actions>
        <button @click="showReport = true"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--text-sub)] hover:bg-[var(--bg-app)] transition-colors text-left">
          <i class="pi pi-download text-xs text-[var(--text-muted)]"></i>
          Export / Print
        </button>
      </template>
    </AppFilterBar>

    <!-- ── Bulk Action Bar ───────────────────────────────────────────── -->
    <Transition name="bulk-bar">
      <div v-if="selectedIds.size > 0"
        class="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--color-navy)] text-white border border-[var(--color-navy)] shadow-lg">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <div class="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-check text-[9px] text-white"></i>
          </div>
          <span class="text-xs font-bold">{{ selectedIds.size }} selected</span>
          <button @click="clearSelection" class="text-white/60 hover:text-white text-[10px] underline transition-colors ml-1">Clear</button>
        </div>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <button @click="showBulkPublish = true" :disabled="bulkLoading"
            class="h-7 px-3 rounded-lg bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50">
            <i class="pi pi-send text-[9px]"></i> Publish
          </button>
          <button @click="confirmBulkClose" :disabled="bulkLoading"
            class="h-7 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 border border-white/20">
            <i class="pi pi-lock text-[9px]"></i> Close
          </button>
          <button @click="confirmBulkArchive" :disabled="bulkLoading"
            class="h-7 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 border border-white/20">
            <i class="pi pi-inbox text-[9px]"></i> Archive
          </button>
          <i v-if="bulkLoading" class="pi pi-spin pi-spinner text-xs text-white/60"></i>
        </div>
      </div>
    </Transition>

    <!-- ── Table ─────────────────────────────────────────────────────── -->
    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden">
      <div v-if="loading" class="p-6 flex flex-col gap-3">
        <div v-for="i in 5" :key="i" class="h-14 rounded-xl bg-[var(--bg-app)] animate-pulse" :style="{ animationDelay: `${i * 60}ms` }"></div>
      </div>

      <div v-else-if="filteredJobs.length === 0" class="py-20 flex flex-col items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center">
          <i class="pi pi-briefcase text-2xl text-[var(--text-muted)]"></i>
        </div>
        <div class="text-center">
          <p class="text-sm font-semibold text-[var(--text-main)]">No vacancies found</p>
          <p class="text-xs text-[var(--text-muted)] mt-0.5">Try adjusting your search or filters</p>
        </div>
        <button v-if="hasFilters" @click="clearFilters" class="text-xs font-semibold text-[var(--color-primary)] hover:underline">Clear filters</button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[var(--border-main)] bg-[var(--bg-app)]">
              <th class="pl-5 pr-2 py-3 w-8">
                <button type="button" @click="toggleSelectAll"
                  :class="['w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                    allOnPageSelected ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' :
                    someOnPageSelected ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)]' :
                    'border-[var(--border-main)] hover:border-[var(--color-primary)]']">
                  <i v-if="allOnPageSelected" class="pi pi-check text-white" style="font-size:8px"></i>
                  <i v-else-if="someOnPageSelected" class="pi pi-minus text-[var(--color-primary)]" style="font-size:8px"></i>
                </button>
              </th>
              <th class="px-2 py-3 text-left w-8"><span class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">#</span></th>
              <th class="px-5 py-3 text-left">
                <button @click="toggleSort('positionTitle')" class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                  Position <i :class="['pi text-[9px]', sortIcon('positionTitle')]"></i>
                </button>
              </th>
              <th class="px-5 py-3 text-left">
                <button @click="toggleSort('salaryGrade')" class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                  SG <i :class="['pi text-[9px]', sortIcon('salaryGrade')]"></i>
                </button>
              </th>
              <th class="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Track</th>
              <th class="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
              <th class="px-5 py-3 text-left">
                <button @click="toggleSort('deadline')" class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                  Deadline <i :class="['pi text-[9px]', sortIcon('deadline')]"></i>
                </button>
              </th>
              <th class="px-5 py-3 text-center">
                <button @click="toggleSort('applicants')" class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors mx-auto">
                  Apps <i :class="['pi text-[9px]', sortIcon('applicants')]"></i>
                </button>
              </th>
              <th class="px-5 py-3 w-24 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--border-main)]">
            <tr v-for="(job, i) in pagedJobs" :key="job._id"
              :class="['hover:bg-[var(--bg-app)] transition-colors group', selectedIds.has(job._id) ? 'bg-[var(--color-primary-light)]' : '']">
              <td class="pl-5 pr-2 py-3.5">
                <button type="button" @click="toggleSelect(job._id)"
                  :class="['w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                    selectedIds.has(job._id) ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--border-main)] hover:border-[var(--color-primary)]']">
                  <i v-if="selectedIds.has(job._id)" class="pi pi-check text-white" style="font-size:8px"></i>
                </button>
              </td>
              <td class="px-2 py-3.5 text-xs text-[var(--text-faint)] tabular-nums">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2">
                  <div>
                    <p class="font-semibold text-[var(--text-main)] text-sm leading-tight">{{ job.positionTitle }}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="font-mono bg-[var(--bg-app)] text-[var(--text-muted)] border border-[var(--border-main)] px-1.5 py-px rounded text-[10px]">{{ job.positionCode }}</span>
                      <span v-if="job.placeOfAssignment?.length" class="text-[10px] text-[var(--text-muted)] truncate max-w-[160px]">{{ Array.isArray(job.placeOfAssignment) ? job.placeOfAssignment.join(', ') : job.placeOfAssignment }}</span>
                    </div>
                  </div>
                  <span v-if="job.hideVacancyCount" title="Vacancy count hidden from applicants"
                    class="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center text-[var(--text-faint)]">
                    <i class="pi pi-eye-slash text-[9px]"></i>
                  </span>
                </div>
              </td>
              <td class="px-5 py-3.5 text-sm font-bold text-[var(--text-main)] tabular-nums">{{ job.salaryGrade ? `SG-${job.salaryGrade}` : '—' }}</td>
              <td class="px-5 py-3.5">
                <span :class="['text-[10px] font-semibold px-2 py-[3px] rounded-full border',
                  job.hiringTrack === 'teaching' ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary-ring)]' :
                  job.hiringTrack === 'teaching_related' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  'bg-[var(--bg-app)] text-[var(--text-muted)] border-[var(--border-main)]']">
                  {{ trackLabel[job.hiringTrack] ?? job.hiringTrack }}
                </span>
              </td>
              <td class="px-5 py-3.5"><AppBadge :variant="job.status" size="sm">{{ statusConfig[job.status]?.label ?? job.status }}</AppBadge></td>
              <td class="px-5 py-3.5">
                <span :class="['text-xs font-medium', isExpired(job.deadline) ? 'text-red-500' : 'text-[var(--text-main)]']">{{ formatDate(job.deadline) }}</span>
                <span v-if="isExpired(job.deadline)" class="block text-[9px] text-red-400 font-semibold">Expired</span>
              </td>
              <td class="px-5 py-3.5 text-center">
                <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-[var(--bg-app)] border border-[var(--border-main)] text-[var(--text-main)]">
                  {{ job.applications?.length ?? 0 }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <button @click="manageRecruitment(job._id)" title="Manage recruitment"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors border border-transparent hover:border-[var(--color-primary-ring)]">
                    <i class="pi pi-users text-xs"></i>
                  </button>
                  <button v-if="canManage" @click="openEdit(job)" title="Edit vacancy"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)] transition-colors border border-transparent hover:border-[var(--border-main)] ml-1">
                    <i class="pi pi-pencil text-xs"></i>
                  </button>
                  <button v-if="canManage" @click="handleDelete(job)" title="Delete vacancy"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 transition-colors border border-transparent hover:border-red-200">
                    <i class="pi pi-trash text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="px-5 py-3 border-t border-[var(--border-main)] bg-[var(--surface)] flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <span v-if="filteredJobs.length > 0" class="font-medium">
              Showing <span class="font-bold text-[var(--text-main)]">{{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredJobs.length) }}</span>
              of <span class="font-bold text-[var(--text-main)]">{{ filteredJobs.length }}</span>
            </span>
            <span class="hidden sm:flex items-center gap-3">
              <span class="flex items-center gap-1"><i class="pi pi-circle-fill text-[6px] text-green-500"></i> {{ jobs.filter(j=>j.status==='published').length }} Published</span>
              <span class="flex items-center gap-1"><i class="pi pi-circle-fill text-[6px] text-[var(--text-faint)]"></i> {{ jobs.filter(j=>j.status==='draft').length }} Draft</span>
              <span class="flex items-center gap-1"><i class="pi pi-circle-fill text-[6px] text-red-400"></i> {{ jobs.filter(j=>j.status==='closed').length }} Closed</span>
            </span>
          </div>
          <nav v-if="totalPages > 1" class="flex items-center gap-1">
            <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
              class="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <i class="pi pi-chevron-left text-[10px]"></i>
            </button>
            <template v-for="(p, idx) in pageNumbers" :key="idx">
              <span v-if="p === '...'" class="w-7 h-7 flex items-center justify-center text-xs text-[var(--text-faint)]">…</span>
              <button v-else @click="currentPage = p"
                :class="['w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all',
                  currentPage === p ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'border border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]']">
                {{ p }}
              </button>
            </template>
            <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages"
              class="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <i class="pi pi-chevron-right text-[10px]"></i>
            </button>
          </nav>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════
         Create / Edit Modal
    ══════════════════════════════════════════════════════════════════ -->
    <AppModal v-model="showDrawer"
      :title="isEditing ? 'Edit Posting' : 'New Posting'"
      :subtitle="isEditing ? `Editing: ${form.positionCode}` : 'Fill in position details and qualification standards.'"
      icon="pi-briefcase" size="xl">

      <!-- Section nav strip -->
      <div class="sticky top-0 z-10 -mx-6 -mt-5 px-6 pt-3 pb-2.5 mb-5 bg-[var(--surface)] border-b border-[var(--border-main)]">
        <!-- Template banner (create mode only) -->
        <div v-if="!isEditing" class="mb-3 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20">
          <div class="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
            <i class="pi pi-bookmark text-white text-xs"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-[var(--color-primary)] leading-tight">Use a position template</p>
            <p class="text-[10px] text-[var(--color-primary)]/70 leading-tight mt-px">
              Browse your template library to prefill position details and QS instantly.
              <span class="font-semibold">{{ templates.length }} template{{ templates.length !== 1 ? 's' : '' }}</span> available.
            </p>
          </div>
          <button type="button" @click="showTemplateModal = true; templateView = 'list'"
            class="flex-shrink-0 h-7 px-3 rounded-lg bg-[var(--color-primary)] text-white text-[10px] font-bold hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-1.5">
            <i class="pi pi-folder-open text-[9px]"></i> Browse Templates
          </button>
        </div>

        <!-- Section tabs -->
        <div class="flex gap-1 overflow-x-auto">
          <button v-for="(sec, idx) in formSections" :key="idx" type="button" @click="goToSection(idx)"
            :class="['flex items-center gap-1.5 h-7 px-3 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all',
              activeSection === idx ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]']">
            <i :class="['pi text-[9px]', sec.icon]"></i>{{ sec.label }}
          </button>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="min-h-[480px] overflow-y-auto custom-scrollbar pr-1">

        <!-- ── 1. Position Identity ──────────────────────────────────── -->
        <section v-show="activeSection === 0" class="space-y-4">
          <div class="flex items-center gap-2 border-b border-[var(--border-main)] pb-2.5">
            <span class="w-5 h-5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-[9px] font-black">1</span>
            <h4 class="text-xs font-semibold text-[var(--text-main)]">Position Identity</h4>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <AppInput
                v-model="form.positionTitle"
                label="Position Title"
                placeholder="e.g. Master Teacher I"
                hint="Official position title as listed in the Plantilla"
                required
              />
            </div>
            <AppInput
              v-model="form.positionCode"
              label="Position Code"
              placeholder="OSEC-DECSB-TCHR1"
              hint="Base identifier without item number suffix"
              required
            />
            <AppInput
              v-model.number="form.salaryGrade"
              label="Salary Grade"
              type="number" min="1" max="33"
              placeholder="e.g. 13"
              required
            />
            <AppInput
              v-model.number="form.salary"
              label="Monthly Salary (PHP)"
              type="number" min="0"
              placeholder="e.g. 29165"
              hint="Gross monthly salary per DBM-prescribed rate"
              required
            />
            <AppSelect
              v-model="form.employmentType"
              label="Employment Type"
              :options="[
                { label: 'Permanent',   value: 'permanent' },
                { label: 'Contractual', value: 'contractual' },
                { label: 'Casual',      value: 'casual' },
                { label: 'Job Order',   value: 'job order' },
              ]"
            />
            <AppSelect
              v-model="form.hiringTrack"
              label="Hiring Track"
              :options="[
                { label: 'Teaching',         value: 'teaching' },
                { label: 'Teaching-Related', value: 'teaching_related' },
                { label: 'Non-Teaching',     value: 'non_teaching' },
              ]"
            />
          </div>
          <AppTextarea
            v-model="form.description"
            label="Duties & Description"
            :rows="3"
            placeholder="Describe the duties, responsibilities, and scope of the position..."
            hint="Shown to applicants on the job vacancy listing"
          />
        </section>

        <!-- ── 2. Plantilla Item Numbers ─────────────────────────────── -->
        <section v-show="activeSection === 1" class="space-y-4">
          <div class="flex items-center justify-between border-b border-[var(--border-main)] pb-2.5">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-[9px] font-black">2</span>
              <h4 class="text-xs font-semibold text-[var(--text-main)]">Plantilla Item Numbers</h4>
            </div>
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20">
              <i class="pi pi-briefcase text-[var(--color-primary)] text-[9px]"></i>
              <span class="text-[10px] font-black text-[var(--color-primary)]">
                {{ form.itemNumbers.filter(n => n.trim()).length }} vacanc{{ form.itemNumbers.filter(n => n.trim()).length === 1 ? 'y' : 'ies' }}
              </span>
            </div>
          </div>
          <p class="text-[10px] text-[var(--text-muted)]">Each plantilla item number = 1 vacancy slot. Leave blank if not yet assigned.</p>
          <div class="space-y-2">
            <div v-for="(item, i) in form.itemNumbers" :key="i" class="flex items-center gap-2">
              <div class="w-6 h-9 flex items-center justify-center text-[10px] font-black text-[var(--text-faint)] flex-shrink-0 tabular-nums">{{ i + 1 }}</div>
              <input v-model="form.itemNumbers[i]"
                :placeholder="`OSEC-DECSB-TCHR1-${String(i + 1).padStart(6, '0')}`"
                class="flex-1 h-9 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm font-mono text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all" />
              <button type="button" @click="removeItem(form.itemNumbers, i)"
                class="w-9 h-9 rounded-xl border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>
          </div>
          <!-- Full-width add button matching input area -->
          <div class="flex items-center gap-2">
            <div class="w-6 flex-shrink-0"></div>
            <button type="button" @click="addItem(form.itemNumbers)"
              class="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl border border-dashed border-[var(--color-primary)]/40 text-[var(--color-primary)] text-xs font-bold hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all">
              <i class="pi pi-plus text-[10px]"></i> Add Item Number
            </button>
            <div class="w-9 flex-shrink-0"></div>
          </div>
          <!-- Hide vacancy count toggle -->
          <label class="flex items-center gap-3 cursor-pointer group pt-1">
            <button type="button" @click="form.hideVacancyCount = !form.hideVacancyCount"
              :class="['relative w-9 h-5 rounded-full transition-colors flex-shrink-0',
                form.hideVacancyCount ? 'bg-[var(--color-primary)]' : 'bg-[var(--border-main)]']">
              <span :class="['absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                form.hideVacancyCount ? 'translate-x-4' : 'translate-x-0']"></span>
            </button>
            <div>
              <p class="text-xs font-semibold text-[var(--text-main)] group-hover:text-[var(--color-primary)] transition-colors">Hide vacancy count from applicants</p>
              <p class="text-[10px] text-[var(--text-faint)]">Slot count will be hidden on the public job board.</p>
            </div>
          </label>
        </section>

        <!-- ── 3. Assignment ──────────────────────────────────────────── -->
        <section v-show="activeSection === 2" class="space-y-4">
          <div class="flex items-center justify-between border-b border-[var(--border-main)] pb-2.5">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-[9px] font-black">3</span>
              <h4 class="text-xs font-semibold text-[var(--text-main)]">Place of Assignment</h4>
            </div>
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20">
              <i class="pi pi-map-marker text-[var(--color-primary)] text-[9px]"></i>
              <span class="text-[10px] font-black text-[var(--color-primary)]">
                {{ form.placeOfAssignment.filter(p => p.trim()).length }} location{{ form.placeOfAssignment.filter(p => p.trim()).length === 1 ? '' : 's' }}
              </span>
            </div>
          </div>
          <p class="text-[10px] text-[var(--text-muted)]">Add all schools or offices where this position may be assigned.</p>
          <div class="space-y-2">
            <div v-for="(place, i) in form.placeOfAssignment" :key="i" class="flex items-center gap-2">
              <div class="w-6 h-9 flex items-center justify-center text-[10px] font-black text-[var(--text-faint)] flex-shrink-0 tabular-nums">{{ i + 1 }}</div>
              <input v-model="form.placeOfAssignment[i]"
                placeholder="e.g. Guihulngan City National High School"
                class="flex-1 h-9 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all" />
              <button type="button" @click="removeItem(form.placeOfAssignment, i)"
                class="w-9 h-9 rounded-xl border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 flex-shrink-0"></div>
            <button type="button" @click="addItem(form.placeOfAssignment)"
              class="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl border border-dashed border-[var(--color-primary)]/40 text-[var(--color-primary)] text-xs font-bold hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all">
              <i class="pi pi-plus text-[10px]"></i> Add Location
            </button>
            <div class="w-9 flex-shrink-0"></div>
          </div>
          <p class="text-[9px] text-[var(--text-faint)]">Posting saves as <span class="font-bold">Draft</span>. Use the Publish button on the table to set deadline and go live.</p>
        </section>

        <!-- ── 4. Qualification Standards (QS) ──────────────────────── -->
        <section v-show="activeSection === 3" class="space-y-4">
          <div class="flex items-center gap-2 border-b border-[var(--border-main)] pb-2.5">
            <span class="w-5 h-5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-[9px] font-black">4</span>
            <h4 class="text-xs font-semibold text-[var(--text-main)]">Qualification Standards (QS)</h4>
          </div>
          <p class="text-[10px] text-[var(--text-muted)]">Per CSC MC 03 s. 2001 / DO 007 s. 2023. Toggle <span class="font-bold text-[var(--text-main)]">None Required</span> if a field does not apply.</p>

          <!-- Education -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-[11px] font-medium text-[var(--text-muted)]">Education</label>
              <button type="button" @click="toggleNone('education')"
                :class="['flex items-center gap-1 h-5 px-2 rounded-full text-[9px] font-bold border transition-all',
                  form.education === NONE_REQ ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/30' : 'bg-[var(--bg-app)] text-[var(--text-faint)] border-[var(--border-main)] hover:text-[var(--text-muted)]']">
                <i :class="['pi text-[8px]', form.education === NONE_REQ ? 'pi-check-circle' : 'pi-minus-circle']"></i> None Required
              </button>
            </div>
            <AppInput v-model="form.education" :disabled="form.education === NONE_REQ"
              placeholder="e.g. Bachelor of Secondary Education or any Bachelor's Degree"
              hint="Per CSC-prescribed QS for this position" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Experience -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-[11px] font-medium text-[var(--text-muted)]">Experience</label>
                <button type="button" @click="toggleNone('experience')"
                  :class="['flex items-center gap-1 h-5 px-2 rounded-full text-[9px] font-bold border transition-all',
                    form.experience === NONE_REQ ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/30' : 'bg-[var(--bg-app)] text-[var(--text-faint)] border-[var(--border-main)] hover:text-[var(--text-muted)]']">
                  <i :class="['pi text-[8px]', form.experience === NONE_REQ ? 'pi-check-circle' : 'pi-minus-circle']"></i> None Required
                </button>
              </div>
              <AppInput v-model="form.experience" :disabled="form.experience === NONE_REQ"
                placeholder="e.g. 2 years of relevant teaching experience"
                hint="Describe the required work experience" />
            </div>
            <!-- Min Experience -->
            <div>
              <label class="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Min Experience <span class="text-[var(--text-faint)] normal-case font-medium">(months)</span></label>
              <div class="flex items-center gap-2">
                <AppInput v-model.number="form.minExperienceMonths" type="number" min="0" placeholder="0"
                  :disabled="form.experience === NONE_REQ" hint="0 = no minimum" class="flex-1" />
                <span class="text-xs text-[var(--text-muted)] font-medium whitespace-nowrap">months</span>
              </div>
            </div>
            <!-- Training -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-[11px] font-medium text-[var(--text-muted)]">Training</label>
                <button type="button" @click="toggleNone('trainings')"
                  :class="['flex items-center gap-1 h-5 px-2 rounded-full text-[9px] font-bold border transition-all',
                    form.trainings === NONE_REQ ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/30' : 'bg-[var(--bg-app)] text-[var(--text-faint)] border-[var(--border-main)] hover:text-[var(--text-muted)]']">
                  <i :class="['pi text-[8px]', form.trainings === NONE_REQ ? 'pi-check-circle' : 'pi-minus-circle']"></i> None Required
                </button>
              </div>
              <AppInput v-model="form.trainings" :disabled="form.trainings === NONE_REQ"
                placeholder="e.g. 8 hours of relevant training"
                hint="Required training hours per QS" />
            </div>
            <!-- Min Training -->
            <div>
              <label class="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Min Training <span class="text-[var(--text-faint)] normal-case font-medium">(hours)</span></label>
              <div class="flex items-center gap-2">
                <AppInput v-model.number="form.minTrainingHours" type="number" min="0" placeholder="0"
                  :disabled="form.trainings === NONE_REQ" hint="0 = no minimum" class="flex-1" />
                <span class="text-xs text-[var(--text-muted)] font-medium whitespace-nowrap">hours</span>
              </div>
            </div>
          </div>

          <!-- Eligibility — multi-tag -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-[11px] font-medium text-[var(--text-muted)]">Eligibility</label>
              <button type="button" @click="toggleNoneEligibility(form.eligibility)"
                :class="['flex items-center gap-1 h-5 px-2 rounded-full text-[9px] font-bold border transition-all',
                  form.eligibility.includes(NONE_REQ) ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/30' : 'bg-[var(--bg-app)] text-[var(--text-faint)] border-[var(--border-main)] hover:text-[var(--text-muted)]']">
                <i :class="['pi text-[8px]', form.eligibility.includes(NONE_REQ) ? 'pi-check-circle' : 'pi-minus-circle']"></i> None Required
              </button>
            </div>
            <!-- Tags -->
            <div v-if="form.eligibility.length" class="flex flex-wrap gap-1.5 mb-2">
              <span v-for="elig in form.eligibility" :key="elig"
                class="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[10px] font-semibold bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                {{ elig }}
                <button type="button" @click="removeEligibility(form.eligibility, elig)" class="hover:text-red-500 transition-colors ml-0.5">
                  <i class="pi pi-times text-[8px]"></i>
                </button>
              </span>
            </div>
            <!-- Add row (hidden when None Required active) -->
            <div v-if="!form.eligibility.includes(NONE_REQ)" class="flex gap-2">
              <select v-model="pendingEligibility" :class="[SELECT_CLS, 'flex-1']">
                <option value="">Add accepted eligibility...</option>
                <template v-for="group in ELIGIBILITY_GROUPS" :key="group.label">
                  <optgroup v-if="group.options.length" :label="group.label">
                    <option v-for="opt in group.options" :key="opt.value" :value="opt.value"
                      :disabled="form.eligibility.includes(opt.value)">{{ opt.label }}</option>
                  </optgroup>
                </template>
              </select>
              <button type="button" @click="addEligibility(form.eligibility, pendingEligibility); pendingEligibility = ''"
                :disabled="!pendingEligibility"
                class="h-10 w-10 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold disabled:opacity-40 hover:bg-[var(--color-primary-dark)] transition-colors flex-shrink-0 flex items-center justify-center">
                <i class="pi pi-plus"></i>
              </button>
            </div>
            <p class="text-[9px] text-[var(--text-faint)] mt-1">Add all accepted eligibility types. Applicants matching any listed type pass QS auto-match.</p>
          </div>
        </section>

        <!-- ── 5. Competency Requirements ────────────────────────────── -->
        <section v-show="activeSection === 4" class="space-y-4">
          <div class="flex items-center gap-2 border-b border-[var(--border-main)] pb-2.5">
            <span class="w-5 h-5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-[9px] font-black">5</span>
            <h4 class="text-xs font-semibold text-[var(--text-main)]">Competency Requirements</h4>
            <span class="text-[9px] text-[var(--text-faint)] font-medium">(Optional)</span>
          </div>
          <div v-if="form.competencyRequirements.length === 0" class="text-center py-6 border border-dashed border-[var(--border-main)] rounded-xl">
            <i class="pi pi-list text-lg text-[var(--text-faint)] mb-1"></i>
            <p class="text-[10px] text-[var(--text-faint)]">No competencies added yet.</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="(comp, i) in form.competencyRequirements" :key="i" class="flex items-center gap-2">
              <div class="w-6 h-9 flex items-center justify-center text-[10px] font-black text-[var(--text-faint)] flex-shrink-0 tabular-nums">{{ i + 1 }}</div>
              <input v-model="form.competencyRequirements[i]" placeholder="e.g. Classroom management, Curriculum planning..."
                class="flex-1 h-9 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all" />
              <button type="button" @click="removeItem(form.competencyRequirements, i)"
                class="w-9 h-9 rounded-xl border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 flex-shrink-0"></div>
            <button type="button" @click="addItem(form.competencyRequirements)"
              class="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl border border-dashed border-[var(--color-primary)]/40 text-[var(--color-primary)] text-xs font-bold hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all">
              <i class="pi pi-plus text-[10px]"></i> Add Competency
            </button>
            <div class="w-9 flex-shrink-0"></div>
          </div>
        </section>

      </form>

      <template #footer>
        <div class="flex items-center justify-between w-full gap-2">
          <div class="flex gap-2">
            <AppButton v-if="activeSection > 0" variant="ghost" icon="pi-arrow-left" @click="goToSection(activeSection - 1)">
              {{ formSections[activeSection - 1].label }}
            </AppButton>
          </div>
          <div class="flex gap-2">
            <AppButton variant="ghost" @click="showDrawer = false">Cancel</AppButton>
            <AppButton v-if="activeSection < formSections.length - 1" variant="secondary" @click="goToSection(activeSection + 1)">
              {{ formSections[activeSection + 1].label }} <i class="pi pi-arrow-right text-[10px] ml-1"></i>
            </AppButton>
            <AppButton v-else variant="primary" :loading="drawerLoading" @click="handleSubmit">
              {{ isEditing ? 'Update Posting' : 'Save as Draft' }}
            </AppButton>
          </div>
        </div>
      </template>
    </AppModal>

    <!-- ══════════════════════════════════════════════════════════════════
         Template Manager Modal
    ══════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="tpl-modal">
        <div v-if="showTemplateModal" class="fixed inset-0 z-[500] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div class="absolute inset-0" style="background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);"
            @click="showTemplateModal = false; templateView = 'list'; templateSearch = ''"></div>

          <div class="relative w-full max-w-2xl bg-[var(--surface)] rounded-2xl border border-[var(--border-main)] flex flex-col overflow-hidden"
            style="max-height:88vh;box-shadow:0 24px 64px rgba(0,0,0,0.22);">

            <div style="height:3px;background:var(--color-primary);border-radius:1rem 1rem 0 0;flex-shrink:0;"></div>

            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--border-main)] shrink-0">
              <div class="flex items-center gap-3">
                <!-- Back button (in form view) -->
                <button v-if="templateView === 'form'" type="button" @click="templateView = 'list'"
                  class="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)] transition-colors">
                  <i class="pi pi-arrow-left text-xs"></i>
                </button>
                <div class="w-8 h-8 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
                  <i :class="['pi text-sm', templateView === 'form' ? 'pi-file-edit' : 'pi-bookmark']"></i>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-[var(--text-main)] leading-tight">
                    {{ templateView === 'form' ? (templateFormMode === 'create' ? 'New Template' : 'Edit Template') : 'Position Templates' }}
                  </h3>
                  <p class="text-[10px] text-[var(--text-muted)] mt-px">
                    {{ templateView === 'form' ? 'Define a reusable position definition.' : 'Reusable position definitions with QS preloaded.' }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button v-if="templateView === 'list'" type="button" @click="openTemplateCreate"
                  class="h-7 px-3 rounded-lg bg-[var(--color-primary)] text-white text-[10px] font-bold hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-1.5">
                  <i class="pi pi-plus text-[9px]"></i> New Template
                </button>
                <button type="button" @click="showTemplateModal = false; templateView = 'list'; templateSearch = ''"
                  class="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)] transition-colors">
                  <i class="pi pi-times text-sm"></i>
                </button>
              </div>
            </div>

            <!-- ── LIST VIEW (Refined) ──────────────────────────────────────────── -->
            <template v-if="templateView === 'list'">
              <div class="px-5 py-4 border-b border-[var(--border-main)] shrink-0">
                <div class="relative group">
                  <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none group-focus-within:text-[var(--color-primary)] transition-colors"></i>
                  <input v-model="templateSearch" type="search" placeholder="Search templates by title or code..."
                    class="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-bold uppercase tracking-tight
                           text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 
                           focus:border-[var(--color-primary)] transition-all" autofocus />
                </div>
                <div class="flex items-center justify-between mt-3 px-1">
                  <p class="text-[9px] text-[var(--text-faint)] font-bold uppercase tracking-widest">
                    {{ filteredTemplates.length }} template{{ filteredTemplates.length !== 1 ? 's' : '' }} found
                  </p>
                  <p v-if="!isEditing" class="text-[9px] text-[var(--color-primary)] font-black uppercase tracking-widest">
                    Select a template to prefill form
                  </p>
                </div>
              </div>

              <div class="flex-1 overflow-y-auto custom-scrollbar min-h-[360px]">
                <div v-if="filteredTemplates.length === 0" class="py-24 flex flex-col items-center gap-4 text-center px-6">
                  <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center">
                    <i class="pi pi-bookmark text-2xl text-[var(--text-faint)]"></i>
                  </div>
                  <div>
                    <h5 class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">No templates yet</h5>
                    <p class="text-[11px] text-[var(--text-muted)] mt-1.5 max-w-[240px] font-medium leading-relaxed">Create your first template to speed up recruitment posting.</p>
                  </div>
                  <AppButton variant="primary" size="sm" class="mt-4" @click="openTemplateCreate">
                    Create Template
                  </AppButton>
                </div>

                <div v-else class="p-4 space-y-2.5">
                  <div v-for="tpl in filteredTemplates" :key="tpl._id" 
                    class="flex items-center gap-4 p-4 rounded-2xl border transition-all text-left bg-[var(--surface)] border-[var(--border-main)] hover:border-[var(--color-primary)] hover:shadow-md group">
                    
                    <!-- Track Icon -->
                    <div :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                      tpl.hiringTrack === 'teaching' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      tpl.hiringTrack === 'teaching_related' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                      'bg-slate-50 text-slate-600 border border-slate-100']">
                      <i :class="['pi text-sm', tpl.hiringTrack === 'teaching' ? 'pi-book' : 'pi-id-card']"></i>
                    </div>

                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-[var(--bg-app)] border border-[var(--border-main)] text-[var(--text-muted)] uppercase tracking-widest">
                          SG-{{ tpl.salaryGrade || '?' }}
                        </span>
                        <span class="text-[8px] font-black text-[var(--text-faint)] uppercase tracking-widest">{{ tpl.employmentType }}</span>
                      </div>
                      <p class="text-sm font-black text-[var(--text-main)] leading-none truncate uppercase tracking-tight group-hover:text-[var(--color-primary)] transition-colors">{{ tpl.positionTitle }}</p>
                      <p class="text-[10px] font-mono font-bold text-[var(--text-faint)] mt-1.5 uppercase tracking-tighter">{{ tpl.positionCode || 'NO-CODE' }}</p>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                      <!-- Use button (only when opening from create form) -->
                      <button v-if="!isEditing" type="button" @click="prefillFromTemplate(tpl)"
                        class="h-8 px-4 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-primary-dark)] transition-all shadow-sm hover:shadow-primary/30 flex items-center gap-2">
                        Use Template
                      </button>
                      <div class="flex items-center gap-1 border-l border-[var(--border-main)] pl-1.5 ml-1">
                        <button type="button" @click="openTemplateEdit(tpl)" title="Edit template"
                          class="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--color-primary)] transition-colors">
                          <i class="pi pi-pencil text-xs"></i>
                        </button>
                        <button type="button" @click="deleteTemplate(tpl)" title="Delete template"
                          class="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500 transition-colors">
                          <i class="pi pi-trash text-xs"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="px-5 py-3 border-t border-[var(--border-main)] bg-[var(--bg-app)] shrink-0">
                <p class="text-[9px] text-[var(--text-muted)]">
                  <i class="pi pi-info-circle mr-1"></i>
                  Templates store QS and position identity only. Item numbers and place of assignment are set per-posting.
                </p>
              </div>
            </template>

            <!-- ── FORM VIEW (create / edit template) ─────────────────── -->
            <template v-else>

              <!-- Tab strip -->
              <div class="flex gap-1 px-5 py-2.5 border-b border-[var(--border-main)] shrink-0 bg-[var(--bg-app)]">
                <button v-for="tab in [{ id: 'position', label: 'Position', icon: 'pi-id-card' }, { id: 'qs', label: 'Qual. Standards', icon: 'pi-graduation-cap' }]"
                  :key="tab.id" type="button" @click="templateFormTab = tab.id"
                  :class="['flex items-center gap-1.5 h-7 px-3 rounded-lg text-[10px] font-bold transition-all',
                    templateFormTab === tab.id ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-main)]']">
                  <i :class="['pi text-[9px]', tab.icon]"></i>{{ tab.label }}
                </button>
              </div>

              <div class="flex-1 min-h-[420px] overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">

                <!-- ── TAB: Position ── -->
                <template v-if="templateFormTab === 'position'">
                  <div class="grid grid-cols-2 gap-3">
                    <div class="col-span-2">
                      <label class="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Position Title <span class="text-red-400">*</span></label>
                      <input v-model="templateForm.positionTitle" placeholder="e.g. Teacher I" required
                        class="w-full h-10 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Position Code <span class="text-red-400">*</span></label>
                      <input v-model="templateForm.positionCode" placeholder="OSEC-DECSB-TCHR1" required
                        class="w-full h-10 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm font-mono text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Salary Grade</label>
                      <input v-model.number="templateForm.salaryGrade" type="number" min="1" max="33" placeholder="e.g. 13"
                        class="w-full h-10 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Monthly Salary (PHP)</label>
                      <input v-model.number="templateForm.salary" type="number" min="0" placeholder="e.g. 29165"
                        class="w-full h-10 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Employment Type</label>
                      <select v-model="templateForm.employmentType" :class="SELECT_CLS">
                        <option value="permanent">Permanent</option>
                        <option value="contractual">Contractual</option>
                        <option value="casual">Casual</option>
                        <option value="job order">Job Order</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Hiring Track <span class="text-red-400">*</span></label>
                      <select v-model="templateForm.hiringTrack" :class="SELECT_CLS">
                        <option value="teaching">Teaching</option>
                        <option value="teaching_related">Teaching-Related</option>
                        <option value="non_teaching">Non-Teaching</option>
                      </select>
                    </div>
                    <div class="col-span-2">
                      <label class="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Description</label>
                      <textarea v-model="templateForm.description" rows="3" placeholder="Duties and responsibilities..."
                        class="w-full px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all resize-none"></textarea>
                    </div>
                  </div>
                </template>

                <!-- ── TAB: Qualification Standards ── -->
                <template v-else>
                  <p class="text-[10px] text-[var(--text-muted)]">Per CSC MC 03 s. 2001 / DO 007 s. 2023.</p>

                  <!-- Education -->
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <label class="text-[11px] font-medium text-[var(--text-muted)]">Education</label>
                      <button type="button" @click="toggleNoneTemplate('education')"
                        :class="['flex items-center gap-1 h-5 px-2 rounded-full text-[9px] font-bold border transition-all',
                          templateForm.education === NONE_REQ ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/30' : 'bg-[var(--bg-app)] text-[var(--text-faint)] border-[var(--border-main)] hover:text-[var(--text-muted)]']">
                        <i :class="['pi text-[8px]', templateForm.education === NONE_REQ ? 'pi-check-circle' : 'pi-minus-circle']"></i> None Required
                      </button>
                    </div>
                    <input v-model="templateForm.education" placeholder="e.g. Bachelor of Secondary Education"
                      :disabled="templateForm.education === NONE_REQ"
                      class="w-full h-10 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all disabled:opacity-50" />
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="col-span-2 sm:col-span-1">
                      <div class="flex items-center justify-between mb-1.5">
                        <label class="text-[11px] font-medium text-[var(--text-muted)]">Experience</label>
                        <button type="button" @click="toggleNoneTemplate('experience')"
                          :class="['flex items-center gap-1 h-5 px-2 rounded-full text-[9px] font-bold border transition-all',
                            templateForm.experience === NONE_REQ ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/30' : 'bg-[var(--bg-app)] text-[var(--text-faint)] border-[var(--border-main)] hover:text-[var(--text-muted)]']">
                          <i :class="['pi text-[8px]', templateForm.experience === NONE_REQ ? 'pi-check-circle' : 'pi-minus-circle']"></i> None
                        </button>
                      </div>
                      <input v-model="templateForm.experience" placeholder="e.g. 2 years relevant experience"
                        :disabled="templateForm.experience === NONE_REQ"
                        class="w-full h-10 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all disabled:opacity-50" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Min Exp (months)</label>
                      <input v-model.number="templateForm.minExperienceMonths" type="number" min="0" placeholder="0"
                        :disabled="templateForm.experience === NONE_REQ"
                        class="w-full h-10 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all disabled:opacity-50" />
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <div class="flex items-center justify-between mb-1.5">
                        <label class="text-[11px] font-medium text-[var(--text-muted)]">Training</label>
                        <button type="button" @click="toggleNoneTemplate('trainings')"
                          :class="['flex items-center gap-1 h-5 px-2 rounded-full text-[9px] font-bold border transition-all',
                            templateForm.trainings === NONE_REQ ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/30' : 'bg-[var(--bg-app)] text-[var(--text-faint)] border-[var(--border-main)] hover:text-[var(--text-muted)]']">
                          <i :class="['pi text-[8px]', templateForm.trainings === NONE_REQ ? 'pi-check-circle' : 'pi-minus-circle']"></i> None
                        </button>
                      </div>
                      <input v-model="templateForm.trainings" placeholder="e.g. 8 hours relevant training"
                        :disabled="templateForm.trainings === NONE_REQ"
                        class="w-full h-10 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all disabled:opacity-50" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Min Training (hours)</label>
                      <input v-model.number="templateForm.minTrainingHours" type="number" min="0" placeholder="0"
                        :disabled="templateForm.trainings === NONE_REQ"
                        class="w-full h-10 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all disabled:opacity-50" />
                    </div>
                  </div>

                  <!-- Eligibility multi-tag -->
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <label class="text-[11px] font-medium text-[var(--text-muted)]">Eligibility</label>
                      <button type="button" @click="toggleNoneEligibility(templateForm.eligibility)"
                        :class="['flex items-center gap-1 h-5 px-2 rounded-full text-[9px] font-bold border transition-all',
                          templateForm.eligibility.includes(NONE_REQ) ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/30' : 'bg-[var(--bg-app)] text-[var(--text-faint)] border-[var(--border-main)] hover:text-[var(--text-muted)]']">
                        <i :class="['pi text-[8px]', templateForm.eligibility.includes(NONE_REQ) ? 'pi-check-circle' : 'pi-minus-circle']"></i> None Required
                      </button>
                    </div>
                    <div v-if="templateForm.eligibility.length" class="flex flex-wrap gap-1.5 mb-2">
                      <span v-for="elig in templateForm.eligibility" :key="elig"
                        class="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[10px] font-semibold bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                        {{ elig }}
                        <button type="button" @click="removeEligibility(templateForm.eligibility, elig)" class="hover:text-red-500 transition-colors ml-0.5">
                          <i class="pi pi-times text-[8px]"></i>
                        </button>
                      </span>
                    </div>
                    <div v-if="!templateForm.eligibility.includes(NONE_REQ)" class="flex gap-2">
                      <select v-model="pendingTemplateEligibility" :class="[SELECT_CLS, 'flex-1']">
                        <option value="">Add accepted eligibility...</option>
                        <template v-for="group in ELIGIBILITY_GROUPS" :key="group.label">
                          <optgroup v-if="group.options.length" :label="group.label">
                            <option v-for="opt in group.options" :key="opt.value" :value="opt.value"
                              :disabled="templateForm.eligibility.includes(opt.value)">{{ opt.label }}</option>
                          </optgroup>
                        </template>
                      </select>
                      <button type="button" @click="addEligibility(templateForm.eligibility, pendingTemplateEligibility); pendingTemplateEligibility = ''"
                        :disabled="!pendingTemplateEligibility"
                        class="h-10 w-10 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold disabled:opacity-40 hover:bg-[var(--color-primary-dark)] transition-colors flex-shrink-0 flex items-center justify-center">
                        <i class="pi pi-plus"></i>
                      </button>
                    </div>
                    <p class="text-[9px] text-[var(--text-faint)] mt-1">Applicants matching any listed type pass QS auto-match.</p>
                  </div>
                </template>

              </div>

              <div class="flex items-center justify-between px-5 py-3.5 border-t border-[var(--border-main)] bg-[var(--bg-app)] shrink-0">
                <div class="flex gap-1">
                  <button v-if="templateFormTab === 'qs'" type="button" @click="templateFormTab = 'position'"
                    class="h-8 px-3 rounded-lg border border-[var(--border-main)] text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface)] transition-colors flex items-center gap-1.5">
                    <i class="pi pi-arrow-left text-[9px]"></i> Position
                  </button>
                  <button v-if="templateFormTab === 'position'" type="button" @click="templateFormTab = 'qs'"
                    class="h-8 px-3 rounded-lg border border-[var(--border-main)] text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface)] transition-colors flex items-center gap-1.5">
                    Qual. Standards <i class="pi pi-arrow-right text-[9px]"></i>
                  </button>
                </div>
                <div class="flex gap-2">
                  <button type="button" @click="templateView = 'list'"
                    class="h-9 px-4 rounded-xl border border-[var(--border-main)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface)] transition-colors">
                    Cancel
                  </button>
                  <button type="button" @click="saveTemplate" :disabled="templateSaving || !templateForm.positionTitle || !templateForm.positionCode"
                    class="btn-primary h-9 px-5 text-xs font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <i v-if="templateSaving" class="pi pi-spin pi-spinner text-xs"></i>
                    {{ templateSaving ? 'Saving...' : (templateFormMode === 'edit' ? 'Update Template' : 'Save Template') }}
                  </button>
                </div>
              </div>
            </template>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Bulk Publish Modal ────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="tpl-modal">
        <div v-if="showBulkPublish" class="fixed inset-0 z-[500] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div class="absolute inset-0" style="background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);" @click="showBulkPublish = false"></div>
          <div class="relative w-full max-w-sm bg-[var(--surface)] rounded-2xl border border-[var(--border-main)] overflow-hidden"
            style="box-shadow:0 24px 64px rgba(0,0,0,0.22);">
            <div style="height:3px;background:var(--color-primary);"></div>
            <div class="px-6 py-5">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <i class="pi pi-send text-green-600 text-sm"></i>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-[var(--text-main)]">Bulk Publish</h3>
                  <p class="text-[10px] text-[var(--text-muted)] mt-px">Publishing <span class="font-bold text-[var(--text-main)]">{{ selectedIds.size }}</span> posting{{ selectedIds.size !== 1 ? 's' : '' }}</p>
                </div>
              </div>
              <div class="space-y-3">
                <div>
                  <label class="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Application Deadline <span class="text-[var(--text-faint)] normal-case font-normal">(optional)</span></label>
                  <input v-model="bulkDeadline" type="date" :min="new Date().toISOString().slice(0,10)"
                    class="w-full h-10 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all" />
                  <p class="text-[9px] text-[var(--text-faint)] mt-1">Leave blank for open-ended posting with no deadline.</p>
                </div>
              </div>
              <div class="flex gap-2 mt-5">
                <button type="button" @click="showBulkPublish = false; bulkDeadline = ''"
                  class="flex-1 h-9 rounded-xl border border-[var(--border-main)] text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-app)] transition-colors">
                  Cancel
                </button>
                <button type="button" @click="bulkUpdateStatus('published', bulkDeadline || null)" :disabled="bulkLoading"
                  class="flex-1 h-9 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  <i v-if="bulkLoading" class="pi pi-spin pi-spinner text-xs"></i>
                  <i v-else class="pi pi-send text-xs"></i>
                  {{ bulkLoading ? 'Publishing...' : 'Publish Now' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Export Report Modal ──────────────────────────────────────── -->
    <AppTableReport
      v-model="showReport"
      title="Vacancy Registry"
      subtitle="Active Postings — RSP Portal"
      :columns="reportCols"
      :rows="filteredJobs"
      filename="Vacancies" />

  </div>
</template>

<style scoped>
.tpl-modal-enter-active { transition: opacity 180ms ease-out; }
.tpl-modal-leave-active { transition: opacity 140ms ease-in; }
.tpl-modal-enter-from,
.tpl-modal-leave-to     { opacity: 0; }

.bulk-bar-enter-active { transition: all 200ms ease-out; }
.bulk-bar-leave-active { transition: all 150ms ease-in; }
.bulk-bar-enter-from,
.bulk-bar-leave-to     { opacity: 0; transform: translateY(-6px); }
</style>
