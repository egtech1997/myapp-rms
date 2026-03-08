<script setup>
import { ref, computed, watch, onMounted, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'
import { AppButton, AppBadge, AppModal, AppInput, AppSelect, AppTextarea, AppTableReport, AppPageHeader } from '@/components/ui'
import { statusConfig } from '@/utils/statusColors'

const toast = inject('$toast')
const swal  = inject('$swal')
const authStore = useAuthStore()

// ─── Data ──────────────────────────────────────────────────────────────────
const jobs    = ref([])
const loading = ref(true)

// ─── Filters / Sort ────────────────────────────────────────────────────────
const searchQuery  = ref('')
const filterStatus = ref('')
const filterTrack  = ref('')
const sortBy       = ref('createdAt')
const sortDir      = ref('desc')

// ─── Drawer ────────────────────────────────────────────────────────────────
const showDrawer    = ref(false)
const isEditing     = ref(false)
const drawerLoading = ref(false)
const editingId     = ref(null)

const emptyForm = () => ({
  positionTitle: '', positionCode: '', description: '',
  education: '', experience: '', minExperienceMonths: 0,
  trainings: '', minTrainingHours: 0, eligibility: '',
  competencyRequirements: [], itemNumbers: [''],
  salary: '', salaryGrade: '', placeOfAssignment: '',
  employmentType: 'permanent', hiringTrack: 'non_teaching',
  status: 'draft', deadline: '',
})
const form = ref(emptyForm())

// ─── Export ────────────────────────────────────────────────────────────────
const showReport = ref(false)
const reportCols = [
  { label: 'Position Title',    key: 'positionTitle' },
  { label: 'Item Code',         key: 'positionCode'  },
  { label: 'SG',                key: 'salaryGrade'   },
  { label: 'Track',             value: (r) => ({ teaching: 'Teaching', teaching_related: 'Teach.-Related', non_teaching: 'Non-Teaching' })[r.hiringTrack] ?? r.hiringTrack },
  { label: 'Status',            value: (r) => statusConfig[r.status]?.label ?? r.status },
  { label: 'Place',             key: 'placeOfAssignment' },
  { label: 'Deadline',          value: (r) => formatDate(r.deadline) },
  { label: 'Applicants',        value: (r) => r.applications?.length ?? 0 },
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
onMounted(fetchJobs)

// ─── Computed ──────────────────────────────────────────────────────────────
const filteredJobs = computed(() => {
  let list = [...jobs.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(j =>
      j.positionTitle?.toLowerCase().includes(q) ||
      j.positionCode?.toLowerCase().includes(q) ||
      j.placeOfAssignment?.toLowerCase().includes(q)
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
      vA = new Date(a.createdAt).getTime()
      vB = new Date(b.createdAt).getTime()
    }
    if (vA < vB) return sortDir.value === 'asc' ? -1 : 1
    if (vA > vB) return sortDir.value === 'asc' ?  1 : -1
    return 0
  })
  return list
})

const canManage = computed(() => authStore.can('vac_create'))
const hasFilters = computed(() => searchQuery.value || filterStatus.value || filterTrack.value)

// ─── Pagination ─────────────────────────────────────────────────────────────
const currentPage = ref(1)
const pageSize    = ref(15)

watch([searchQuery, filterStatus, filterTrack], () => { currentPage.value = 1 })

const pagedJobs  = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredJobs.value.slice(start, start + pageSize.value)
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredJobs.value.length / pageSize.value)))
const pageNumbers = computed(() => {
  const p = totalPages.value
  if (p <= 7) return Array.from({ length: p }, (_, i) => i + 1)
  if (currentPage.value <= 4) return [1, 2, 3, 4, 5, '…', p]
  if (currentPage.value >= p - 3) return [1, '…', p - 4, p - 3, p - 2, p - 1, p]
  return [1, '…', currentPage.value - 1, currentPage.value, currentPage.value + 1, '…', p]
})

const toggleSort = (field) => {
  if (sortBy.value === field) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortBy.value = field; sortDir.value = 'asc' }
}
const sortIcon = (field) => {
  if (sortBy.value !== field) return 'pi-sort text-[var(--text-faint)]'
  return sortDir.value === 'asc' ? 'pi-sort-amount-up text-[var(--color-primary)]' : 'pi-sort-amount-down text-[var(--color-primary)]'
}
const clearFilters = () => {
  searchQuery.value = ''; filterStatus.value = ''; filterTrack.value = ''
}

// ─── CRUD ──────────────────────────────────────────────────────────────────
const openCreate = () => {
  form.value = emptyForm(); editingId.value = null; isEditing.value = false; showDrawer.value = true
}
const openEdit = (job) => {
  form.value = {
    positionTitle: job.positionTitle, positionCode: job.positionCode,
    description: job.description,
    education: job.qualifications?.education ?? '',
    experience: job.qualifications?.experience ?? '',
    minExperienceMonths: job.qualifications?.minExperienceMonths ?? 0,
    trainings: job.qualifications?.trainings ?? '',
    minTrainingHours: job.qualifications?.minTrainingHours ?? 0,
    eligibility: job.qualifications?.eligibility ?? '',
    competencyRequirements: job.qualifications?.competencyRequirements ? [...job.qualifications.competencyRequirements] : [],
    itemNumbers: job.itemNumbers ? [...job.itemNumbers] : [''],
    salary: job.salary, salaryGrade: job.salaryGrade,
    placeOfAssignment: job.placeOfAssignment,
    employmentType: job.employmentType ?? 'permanent',
    hiringTrack: job.hiringTrack ?? 'non_teaching',
    status: job.status ?? 'draft',
    deadline: job.deadline ? job.deadline.slice(0, 10) : '',
  }
  editingId.value = job._id; isEditing.value = true; showDrawer.value = true
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

// ─── Helpers ───────────────────────────────────────────────────────────────
const addItem    = (arr) => arr.push('')
const removeItem = (arr, i) => arr.splice(i, 1)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const isExpired  = (d) => d && new Date(d) < new Date()

const trackLabel = { teaching: 'Teaching', teaching_related: 'Teach.-Related', non_teaching: 'Non-Teaching' }
</script>

<template>
  <div class="flex flex-col gap-5 animate-fade-in-up">

    <AppPageHeader title="Active Postings" subtitle="Manage recruitment vacancies and qualification standards." icon="pi-briefcase">
      <template #actions>
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-xs font-medium text-[var(--text-muted)]">
          <i class="pi pi-briefcase text-[11px]"></i>
          <span>{{ filteredJobs.length }} posting{{ filteredJobs.length !== 1 ? 's' : '' }}</span>
        </div>
        <button @click="fetchJobs" :title="'Refresh'"
          class="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--border-main)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors">
          <i :class="['pi pi-refresh text-sm', { 'animate-spin': loading }]"></i>
        </button>
        <AppButton v-if="canManage" variant="primary" icon="pi-plus" @click="openCreate">
          New Posting
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- ── Toolbar ───────────────────────────────────────────────────── -->
    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-3.5 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none"></i>
        <input v-model="searchQuery" type="search" placeholder="Search by title, code, or location..."
          class="w-full h-9 pl-9 pr-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm
                 text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60 focus:outline-none
                 focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-shadow" />
      </div>
      <div class="flex gap-2 flex-wrap">
        <select v-model="filterStatus"
          class="h-9 px-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm
                 text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30
                 focus:border-[var(--color-primary)] appearance-none cursor-pointer transition-shadow">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
          <option value="archived">Archived</option>
        </select>
        <select v-model="filterTrack"
          class="h-9 px-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm
                 text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30
                 focus:border-[var(--color-primary)] appearance-none cursor-pointer transition-shadow">
          <option value="">All Tracks</option>
          <option value="teaching">Teaching</option>
          <option value="teaching_related">Teaching-Related</option>
          <option value="non_teaching">Non-Teaching</option>
        </select>
        <button v-if="hasFilters" @click="clearFilters"
          class="h-9 px-3 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold
                 text-red-500 hover:bg-red-100 transition-colors flex items-center gap-1.5">
          <i class="pi pi-times text-[10px]"></i> Clear
        </button>
      </div>
    </div>

    <!-- ── Export Bar ────────────────────────────────────────────────── -->
    <div class="flex items-center justify-end px-1">
      <button @click="showReport = true"
        class="h-8 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--surface)]
               hover:bg-[var(--bg-app)] text-xs font-semibold text-[var(--text-muted)]
               hover:text-[var(--text-main)] transition-colors flex items-center gap-1.5">
        <i class="pi pi-download text-[10px]"></i> Export
      </button>
    </div>

    <!-- ── Table ─────────────────────────────────────────────────────── -->
    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden">

      <!-- Loading -->
      <div v-if="loading" class="p-6 flex flex-col gap-3">
        <div v-for="i in 5" :key="i" class="h-14 rounded-xl bg-[var(--bg-app)] animate-pulse"
          :style="{ animationDelay: `${i * 60}ms` }"></div>
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredJobs.length === 0" class="py-20 flex flex-col items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center">
          <i class="pi pi-briefcase text-2xl text-[var(--text-muted)]"></i>
        </div>
        <div class="text-center">
          <p class="text-sm font-semibold text-[var(--text-main)]">No vacancies found</p>
          <p class="text-xs text-[var(--text-muted)] mt-0.5">Try adjusting your search or filters</p>
        </div>
        <button v-if="hasFilters" @click="clearFilters"
          class="text-xs font-semibold text-[var(--color-primary)] hover:underline">
          Clear filters
        </button>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[var(--border-main)] bg-[var(--bg-app)]">
              <th class="px-5 py-3 text-left w-8">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">#</span>
              </th>
              <th class="px-5 py-3 text-left">
                <button @click="toggleSort('positionTitle')"
                  class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                  Position <i :class="['pi text-[9px]', sortIcon('positionTitle')]"></i>
                </button>
              </th>
              <th class="px-5 py-3 text-left">
                <button @click="toggleSort('salaryGrade')"
                  class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                  SG <i :class="['pi text-[9px]', sortIcon('salaryGrade')]"></i>
                </button>
              </th>
              <th class="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Track</th>
              <th class="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
              <th class="px-5 py-3 text-left">
                <button @click="toggleSort('deadline')"
                  class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                  Deadline <i :class="['pi text-[9px]', sortIcon('deadline')]"></i>
                </button>
              </th>
              <th class="px-5 py-3 text-center">
                <button @click="toggleSort('applicants')"
                  class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors mx-auto">
                  Apps <i :class="['pi text-[9px]', sortIcon('applicants')]"></i>
                </button>
              </th>
              <th class="px-5 py-3 w-24 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--border-main)]">
            <tr v-for="(job, i) in pagedJobs" :key="job._id"
              class="hover:bg-[var(--bg-app)] transition-colors group">

              <!-- # -->
              <td class="px-5 py-3.5 text-xs text-[var(--text-faint)] tabular-nums">{{ (currentPage - 1) * pageSize + i + 1 }}</td>

              <!-- Position -->
              <td class="px-5 py-3.5">
                <p class="font-semibold text-[var(--text-main)] text-sm leading-tight">{{ job.positionTitle }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="font-mono bg-[var(--bg-app)] text-[var(--text-muted)] border border-[var(--border-main)] px-1.5 py-px rounded text-[10px]">
                    {{ job.positionCode }}
                  </span>
                  <span v-if="job.placeOfAssignment" class="text-[10px] text-[var(--text-muted)] truncate max-w-[160px]">
                    {{ job.placeOfAssignment }}
                  </span>
                </div>
              </td>

              <!-- SG -->
              <td class="px-5 py-3.5 text-sm font-bold text-[var(--text-main)] tabular-nums">
                {{ job.salaryGrade ? `SG-${job.salaryGrade}` : '—' }}
              </td>

              <!-- Track -->
              <td class="px-5 py-3.5">
                <span :class="['text-[10px] font-semibold px-2 py-[3px] rounded-full border',
                  job.hiringTrack === 'teaching' ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary-ring)]' :
                  job.hiringTrack === 'teaching_related' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  'bg-[var(--bg-app)] text-[var(--text-muted)] border-[var(--border-main)]']">
                  {{ trackLabel[job.hiringTrack] ?? job.hiringTrack }}
                </span>
              </td>

              <!-- Status -->
              <td class="px-5 py-3.5">
                <AppBadge :variant="job.status" size="sm">{{ statusConfig[job.status]?.label ?? job.status }}</AppBadge>
              </td>

              <!-- Deadline -->
              <td class="px-5 py-3.5">
                <span :class="['text-xs font-medium', isExpired(job.deadline) ? 'text-red-500' : 'text-[var(--text-main)]']">
                  {{ formatDate(job.deadline) }}
                </span>
                <span v-if="isExpired(job.deadline)" class="block text-[9px] text-red-400 font-semibold">Expired</span>
              </td>

              <!-- Applicants -->
              <td class="px-5 py-3.5 text-center">
                <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                             bg-[var(--bg-app)] border border-[var(--border-main)] text-[var(--text-main)]">
                  {{ job.applications?.length ?? 0 }}
                </span>
              </td>

              <!-- Actions — always visible -->
              <td class="px-5 py-3.5 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <button v-if="canManage" @click="openEdit(job)"
                    title="Edit vacancy"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)]
                           hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors border border-transparent hover:border-[var(--color-primary-ring)]">
                    <i class="pi pi-pencil text-xs"></i>
                  </button>
                  <button v-if="canManage" @click="handleDelete(job)"
                    title="Delete vacancy"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)]
                           hover:bg-red-50 hover:text-red-600 transition-colors border border-transparent hover:border-red-200">
                    <i class="pi pi-trash text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Table footer: stats + pagination -->
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
              <span v-if="p === '…'" class="w-7 h-7 flex items-center justify-center text-xs text-[var(--text-faint)]">…</span>
              <button v-else @click="currentPage = p"
                :class="['w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all',
                  currentPage === p
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'border border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]']">
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

    <!-- ── Create / Edit Modal ─────────────────────────────────────── -->
    <AppModal v-model="showDrawer"
      :title="isEditing ? 'Edit Posting' : 'New Posting'"
      :subtitle="isEditing ? `Editing: ${form.positionCode}` : 'Define vacancy details and qualification standards.'"
      icon="pi-briefcase" size="xl">

      <form @submit.prevent="handleSubmit" class="space-y-8">

        <!-- ── 1. Position Identity ──────────────────────────────────── -->
        <section class="space-y-4">
          <div class="flex items-center gap-2 border-b border-[var(--border-main)] pb-2.5">
            <span class="w-5 h-5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-[9px] font-black">1</span>
            <h4 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Position Identity</h4>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Position Title <span class="text-red-400">*</span></label>
              <AppInput v-model="form.positionTitle" placeholder="e.g. Master Teacher I" required />
            </div>
            <div>
              <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Position Code <span class="text-red-400">*</span></label>
              <AppInput v-model="form.positionCode" placeholder="OSEC-DECSB-TCHR1" required />
              <p class="text-[9px] text-[var(--text-faint)] mt-1">Base identifier (e.g. OSEC-DECSB-TCHR1)</p>
            </div>
            <div>
              <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Salary Grade <span class="text-red-400">*</span></label>
              <AppInput v-model.number="form.salaryGrade" type="number" min="1" max="33" placeholder="e.g. 13" required />
            </div>
            <div>
              <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Monthly Salary (₱) <span class="text-red-400">*</span></label>
              <AppInput v-model.number="form.salary" type="number" min="0" placeholder="e.g. 29165" required />
            </div>
            <div>
              <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Employment Type</label>
              <select v-model="form.employmentType"
                class="w-full h-10 px-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all appearance-none">
                <option value="permanent">Permanent</option>
                <option value="contractual">Contractual</option>
                <option value="casual">Casual</option>
                <option value="job order">Job Order</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Hiring Track <span class="text-red-400">*</span></label>
              <select v-model="form.hiringTrack"
                class="w-full h-10 px-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all appearance-none">
                <option value="teaching">Teaching</option>
                <option value="teaching_related">Teaching-Related</option>
                <option value="non_teaching">Non-Teaching</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Duties &amp; Description</label>
            <AppTextarea v-model="form.description" rows="3" placeholder="Describe the duties, responsibilities, and scope of the position..." />
          </div>
        </section>

        <!-- ── 2. Plantilla Item Numbers ─────────────────────────────── -->
        <section class="space-y-4">
          <div class="flex items-center justify-between border-b border-[var(--border-main)] pb-2.5">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-[9px] font-black">2</span>
              <h4 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Plantilla Item Numbers</h4>
            </div>
            <!-- Auto-count badge -->
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20">
              <i class="pi pi-briefcase text-[var(--color-primary)] text-[9px]"></i>
              <span class="text-[10px] font-black text-[var(--color-primary)]">
                {{ form.itemNumbers.filter(n => n.trim()).length }} vacanc{{ form.itemNumbers.filter(n => n.trim()).length === 1 ? 'y' : 'ies' }}
              </span>
            </div>
          </div>
          <p class="text-[10px] text-[var(--text-muted)]">Each plantilla item number = 1 vacancy slot. Add one line per available position.</p>
          <div class="space-y-2">
            <div v-for="(item, i) in form.itemNumbers" :key="i" class="flex items-center gap-2">
              <div class="w-6 h-9 flex items-center justify-center text-[10px] font-black text-[var(--text-faint)] flex-shrink-0 tabular-nums">
                {{ i + 1 }}
              </div>
              <input
                v-model="form.itemNumbers[i]"
                :placeholder="`OSEC-DECSB-TCHR1-${String(i + 1).padStart(6, '0')}`"
                class="flex-1 h-9 px-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-mono text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all" />
              <button type="button" @click="removeItem(form.itemNumbers, i)"
                :disabled="form.itemNumbers.length === 1"
                class="w-9 h-9 rounded-xl border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>
          </div>
          <button type="button" @click="addItem(form.itemNumbers)"
            class="flex items-center gap-2 h-9 px-4 rounded-xl border border-dashed border-[var(--color-primary)]/40 text-[var(--color-primary)] text-xs font-bold hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all">
            <i class="pi pi-plus text-[10px]"></i>
            Add Item Number
          </button>
        </section>

        <!-- ── 3. Assignment & Publication ───────────────────────────── -->
        <section class="space-y-4">
          <div class="flex items-center gap-2 border-b border-[var(--border-main)] pb-2.5">
            <span class="w-5 h-5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-[9px] font-black">3</span>
            <h4 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Assignment &amp; Publication</h4>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Place of Assignment <span class="text-red-400">*</span></label>
              <AppInput v-model="form.placeOfAssignment" placeholder="e.g. Guihulngan City National High School" required />
            </div>
            <div>
              <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Publication Status</label>
              <select v-model="form.status"
                class="w-full h-10 px-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all appearance-none">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Application Deadline</label>
              <AppInput v-model="form.deadline" type="date" />
            </div>
          </div>
        </section>

        <!-- ── 4. Qualification Standards (QS) ──────────────────────── -->
        <section class="space-y-4">
          <div class="flex items-center gap-2 border-b border-[var(--border-main)] pb-2.5">
            <span class="w-5 h-5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-[9px] font-black">4</span>
            <h4 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Qualification Standards (QS)</h4>
          </div>
          <p class="text-[10px] text-[var(--text-muted)]">Per CSC MC 03 s. 2001 / DO 007 s. 2023. Used for initial applicant screening and QS-match scoring.</p>

          <div>
            <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Education <span class="text-red-400">*</span></label>
            <AppInput v-model="form.education" placeholder="e.g. Bachelor of Secondary Education or any Bachelor's Degree" required />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Experience Description <span class="text-red-400">*</span></label>
              <AppInput v-model="form.experience" placeholder="e.g. 2 years of relevant teaching experience" required />
            </div>
            <div>
              <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Minimum Experience <span class="text-[var(--text-faint)]">(months)</span></label>
              <div class="flex items-center gap-2">
                <AppInput v-model.number="form.minExperienceMonths" type="number" min="0" placeholder="0" class="flex-1" />
                <span class="text-xs text-[var(--text-muted)] font-medium whitespace-nowrap">months</span>
              </div>
              <p class="text-[9px] text-[var(--text-faint)] mt-1">Used for QS auto-match. 0 = no minimum.</p>
            </div>
            <div>
              <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Training Description <span class="text-red-400">*</span></label>
              <AppInput v-model="form.trainings" placeholder="e.g. 8 hours of relevant training" required />
            </div>
            <div>
              <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Minimum Training <span class="text-[var(--text-faint)]">(hours)</span></label>
              <div class="flex items-center gap-2">
                <AppInput v-model.number="form.minTrainingHours" type="number" min="0" placeholder="0" class="flex-1" />
                <span class="text-xs text-[var(--text-muted)] font-medium whitespace-nowrap">hours</span>
              </div>
              <p class="text-[9px] text-[var(--text-faint)] mt-1">Used for QS auto-match. 0 = no minimum.</p>
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Eligibility <span class="text-red-400">*</span></label>
            <AppInput v-model="form.eligibility" placeholder="e.g. RA 1080 (Registered Teacher) or Career Service (Professional)" required />
          </div>
        </section>

        <!-- ── 5. Competency Requirements ────────────────────────────── -->
        <section class="space-y-4">
          <div class="flex items-center gap-2 border-b border-[var(--border-main)] pb-2.5">
            <span class="w-5 h-5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-[9px] font-black">5</span>
            <h4 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Competency Requirements</h4>
            <span class="text-[9px] text-[var(--text-faint)] font-medium">(Optional)</span>
          </div>
          <p class="text-[10px] text-[var(--text-muted)]">Core competencies required for this position. These are shown to applicants in the vacancy detail.</p>

          <div v-if="form.competencyRequirements.length === 0" class="text-center py-6 border border-dashed border-[var(--border-main)] rounded-xl text-[var(--text-faint)]">
            <i class="pi pi-list text-lg mb-1"></i>
            <p class="text-[10px]">No competencies added yet.</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="(comp, i) in form.competencyRequirements" :key="i" class="flex items-center gap-2">
              <div class="w-6 h-9 flex items-center justify-center text-[10px] font-black text-[var(--text-faint)] flex-shrink-0 tabular-nums">{{ i + 1 }}</div>
              <input
                v-model="form.competencyRequirements[i]"
                placeholder="e.g. Classroom management, Curriculum planning..."
                class="flex-1 h-9 px-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all" />
              <button type="button" @click="removeItem(form.competencyRequirements, i)"
                class="w-9 h-9 rounded-xl border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>
          </div>
          <button type="button" @click="addItem(form.competencyRequirements)"
            class="flex items-center gap-2 h-9 px-4 rounded-xl border border-dashed border-[var(--color-primary)]/40 text-[var(--color-primary)] text-xs font-bold hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all">
            <i class="pi pi-plus text-[10px]"></i>
            Add Competency
          </button>
        </section>

      </form>

      <template #footer>
        <AppButton variant="ghost" @click="showDrawer = false">Cancel</AppButton>
        <AppButton variant="primary" :loading="drawerLoading" @click="handleSubmit">
          {{ isEditing ? 'Update Posting' : 'Create Posting' }}
        </AppButton>
      </template>
    </AppModal>

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
