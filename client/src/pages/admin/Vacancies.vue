<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'

const toast = inject('$toast')
const swal = inject('$swal')
const authStore = useAuthStore()

// ─── Data ──────────────────────────────────────────────────────────────────
const jobs = ref([])
const loading = ref(false)

// ─── Filters / Sort ────────────────────────────────────────────────────────
const searchQuery = ref('')
const filterStatus = ref('')
const filterTrack = ref('')
const filterType = ref('')
const sortBy = ref('createdAt')
const sortDir = ref('desc')

// ─── Modal ─────────────────────────────────────────────────────────────────
const showModal = ref(false)
const isEditing = ref(false)
const modalLoading = ref(false)

const emptyForm = () => ({
    positionTitle: '',
    positionCode: '',
    description: '',
    education: '',
    experience: '',
    trainings: '',
    eligibility: '',
    itemNumbers: [''],
    salary: '',
    salaryGrade: '',
    placeOfAssignment: '',
    employmentType: 'permanent',
    hiringTrack: 'non_teaching',
    status: 'draft',
    deadline: '',
})

const form = ref(emptyForm())
const editingId = ref(null)

// ─── Fetch ─────────────────────────────────────────────────────────────────
const fetchJobs = async () => {
    loading.value = true
    try {
        const { data } = await apiClient.get('/v1/jobs')
        jobs.value = data.data
    } catch (err) {
        toast.fire({ icon: 'error', title: 'Error', text: 'Failed to load jobs.' })
    } finally {
        loading.value = false
    }
}

onMounted(fetchJobs)

// ─── Computed: filtered + sorted ───────────────────────────────────────────
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
    if (filterTrack.value) list = list.filter(j => j.hiringTrack === filterTrack.value)
    if (filterType.value) list = list.filter(j => j.employmentType === filterType.value)

    list.sort((a, b) => {
        let vA, vB
        if (sortBy.value === 'positionTitle') {
            vA = a.positionTitle?.toLowerCase() || ''
            vB = b.positionTitle?.toLowerCase() || ''
        } else if (sortBy.value === 'salaryGrade') {
            vA = a.salaryGrade || 0
            vB = b.salaryGrade || 0
        } else if (sortBy.value === 'deadline') {
            vA = a.deadline ? new Date(a.deadline).getTime() : 0
            vB = b.deadline ? new Date(b.deadline).getTime() : 0
        } else {
            vA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            vB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        }
        if (vA < vB) return sortDir.value === 'asc' ? -1 : 1
        if (vA > vB) return sortDir.value === 'asc' ? 1 : -1
        return 0
    })

    return list
})

const hasActiveFilters = computed(() =>
    searchQuery.value || filterStatus.value || filterTrack.value || filterType.value
)

// Stats
const stats = computed(() => ({
    total: jobs.value.length,
    published: jobs.value.filter(j => j.status === 'published').length,
    draft: jobs.value.filter(j => j.status === 'draft').length,
    closed: jobs.value.filter(j => j.status === 'closed').length,
}))

const canManage = computed(() => authStore.can('vac_create'))

// ─── Sort ──────────────────────────────────────────────────────────────────
const toggleSort = (field) => {
    if (sortBy.value === field) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    else { sortBy.value = field; sortDir.value = 'asc' }
}

const clearFilters = () => {
    searchQuery.value = ''
    filterStatus.value = ''
    filterTrack.value = ''
    filterType.value = ''
}

// ─── Modal ─────────────────────────────────────────────────────────────────
const openCreate = () => {
    form.value = emptyForm()
    editingId.value = null
    isEditing.value = false
    showModal.value = true
}

const openEdit = (job) => {
    form.value = {
        positionTitle: job.positionTitle,
        positionCode: job.positionCode,
        description: job.description,
        education: job.qualifications?.education || '',
        experience: job.qualifications?.experience || '',
        trainings: job.qualifications?.trainings || '',
        eligibility: job.qualifications?.eligibility || '',
        itemNumbers: job.itemNumbers?.length ? [...job.itemNumbers] : [''],
        salary: job.salary,
        salaryGrade: job.salaryGrade,
        placeOfAssignment: job.placeOfAssignment,
        employmentType: job.employmentType || 'permanent',
        hiringTrack: job.hiringTrack || 'non_teaching',
        status: job.status || 'draft',
        deadline: job.deadline ? job.deadline.slice(0, 10) : '',
    }
    editingId.value = job._id
    isEditing.value = true
    showModal.value = true
}

const closeModal = () => {
    showModal.value = false
    editingId.value = null
}

// Item Numbers dynamic list
const addItemNumber = () => form.value.itemNumbers.push('')
const removeItemNumber = (i) => {
    if (form.value.itemNumbers.length > 1) form.value.itemNumbers.splice(i, 1)
}

// ─── Submit ────────────────────────────────────────────────────────────────
const handleSubmit = async () => {
    const cleanItems = form.value.itemNumbers.filter(n => n.trim() !== '')
    if (cleanItems.length === 0) {
        toast.fire({ icon: 'warning', title: 'Validation', text: 'At least one item number is required.' })
        return
    }

    modalLoading.value = true
    const payload = { ...form.value, itemNumbers: cleanItems }

    try {
        if (isEditing.value) {
            const { data } = await apiClient.patch(`/v1/jobs/${editingId.value}`, payload)
            const idx = jobs.value.findIndex(j => j._id === editingId.value)
            if (idx !== -1) jobs.value[idx] = data.data
            toast.fire({ icon: 'success', title: 'Job Updated' })
        } else {
            const { data } = await apiClient.post('/v1/jobs', payload)
            jobs.value.unshift(data.data)
            toast.fire({ icon: 'success', title: 'Job Created' })
        }
        closeModal()
    } catch (err) {
        toast.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to save job.' })
    } finally {
        modalLoading.value = false
    }
}

// ─── Quick Status Change ────────────────────────────────────────────────────
const setStatus = async (job, newStatus) => {
    try {
        const { data } = await apiClient.patch(`/v1/jobs/${job._id}`, { status: newStatus })
        const idx = jobs.value.findIndex(j => j._id === job._id)
        if (idx !== -1) jobs.value[idx] = data.data
        toast.fire({ icon: 'success', title: `Job ${newStatus}` })
    } catch (err) {
        toast.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to update status.' })
    }
}

// ─── Delete ────────────────────────────────────────────────────────────────
const handleDelete = async (job) => {
    const result = await swal.fire({
        title: 'Delete Job?',
        html: `This will permanently delete <strong>${job.positionTitle}</strong>.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
    })
    if (!result.isConfirmed) return

    try {
        await apiClient.delete(`/v1/jobs/${job._id}`)
        jobs.value = jobs.value.filter(j => j._id !== job._id)
        toast.fire({ icon: 'success', title: 'Job Deleted' })
    } catch (err) {
        toast.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to delete.' })
    }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const isExpired = (deadline) => deadline && new Date(deadline) < new Date()

const statusConfig = {
    draft: { label: 'Draft', class: 'bg-slate-100 text-slate-600 border-slate-200' },
    published: { label: 'Published', class: 'bg-green-100 text-green-700 border-green-200' },
    closed: { label: 'Closed', class: 'bg-red-100 text-red-600 border-red-200' },
    archived: { label: 'Archived', class: 'bg-amber-100 text-amber-700 border-amber-200' },
}

const trackConfig = {
    teaching: { label: 'Teaching', class: 'bg-blue-100 text-blue-700 border-blue-200' },
    teaching_related: { label: 'Teaching-Related', class: 'bg-purple-100 text-purple-700 border-purple-200' },
    non_teaching: { label: 'Non-Teaching', class: 'bg-orange-100 text-orange-700 border-orange-200' },
}

const nextStatuses = (current) => {
    const all = ['draft', 'published', 'closed', 'archived']
    return all.filter(s => s !== current)
}

const sortIcon = (field) => {
    if (sortBy.value !== field) return 'pi-sort'
    return sortDir.value === 'asc' ? 'pi-sort-up' : 'pi-sort-down'
}
</script>

<template>
    <div class="flex flex-col gap-6">

        <!-- ── Header ──────────────────────────────────────────────────── -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
                <h1 class="text-2xl font-bold text-[var(--text-main)]">Job Vacancies</h1>
                <p class="text-sm text-[var(--text-muted)]">Manage job postings and vacancy announcements.</p>
            </div>
            <div class="flex items-center gap-2">
                <button @click="fetchJobs"
                    class="p-2 rounded-lg border border-[var(--border-main)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors"
                    title="Refresh">
                    <i :class="['pi pi-refresh text-sm', { 'animate-spin': loading }]"></i>
                </button>
                <button v-if="canManage" @click="openCreate"
                    class="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2">
                    <i class="pi pi-plus text-xs"></i> Post Vacancy
                </button>
            </div>
        </div>

        <!-- ── Stats ───────────────────────────────────────────────────── -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div v-for="(val, key) in stats" :key="key"
                class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">{{ key }}</p>
                <p class="text-2xl font-bold text-[var(--text-main)]">{{ val }}</p>
            </div>
        </div>

        <!-- ── Toolbar ─────────────────────────────────────────────────── -->
        <div
            class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
                <i
                    class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none"></i>
                <input v-model="searchQuery" type="text" placeholder="Search by title, code, or assignment..."
                    class="w-full h-9 pl-9 pr-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-shadow" />
            </div>
            <div class="flex gap-2 flex-wrap">
                <select v-model="filterStatus"
                    class="h-9 px-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none appearance-none cursor-pointer">
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                </select>
                <select v-model="filterTrack"
                    class="h-9 px-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none appearance-none cursor-pointer">
                    <option value="">All Tracks</option>
                    <option value="teaching">Teaching</option>
                    <option value="teaching_related">Teaching-Related</option>
                    <option value="non_teaching">Non-Teaching</option>
                </select>
                <select v-model="filterType"
                    class="h-9 px-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none appearance-none cursor-pointer">
                    <option value="">All Types</option>
                    <option value="permanent">Permanent</option>
                    <option value="contractual">Contractual</option>
                    <option value="job order">Job Order</option>
                    <option value="casual">Casual</option>
                </select>
                <select v-model="sortBy"
                    class="h-9 px-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none appearance-none cursor-pointer">
                    <option value="createdAt">Sort: Date Created</option>
                    <option value="positionTitle">Sort: Title</option>
                    <option value="salaryGrade">Sort: Salary Grade</option>
                    <option value="deadline">Sort: Deadline</option>
                </select>
                <button @click="sortDir = sortDir === 'asc' ? 'desc' : 'asc'"
                    class="h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                    <i :class="['pi text-sm', sortDir === 'asc' ? 'pi-sort-amount-up' : 'pi-sort-amount-down']"></i>
                </button>
                <button v-if="hasActiveFilters" @click="clearFilters"
                    class="h-9 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-xs font-medium text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors flex items-center gap-1.5">
                    <i class="pi pi-times text-[10px]"></i> Clear
                </button>
            </div>
        </div>

        <!-- ── Table ───────────────────────────────────────────────────── -->
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-sm overflow-hidden">

            <div v-if="loading" class="p-8 flex flex-col gap-3">
                <div v-for="i in 5" :key="i" class="h-16 rounded-lg bg-[var(--bg-app)] animate-pulse"></div>
            </div>

            <div v-else-if="filteredJobs.length === 0"
                class="py-20 flex flex-col items-center gap-3 text-[var(--text-muted)]">
                <i class="pi pi-briefcase text-4xl text-slate-300"></i>
                <p class="text-sm font-medium">No job vacancies found</p>
                <button v-if="hasActiveFilters" @click="clearFilters"
                    class="text-xs text-[var(--color-primary)] hover:underline">Clear filters</button>
                <button v-else-if="canManage" @click="openCreate" class="text-xs text-[var(--color-primary)] hover:underline">Post
                    your first vacancy</button>
            </div>

            <div v-else class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-[var(--border-main)] bg-[var(--bg-app)]">
                            <th class="px-4 py-3 text-left">
                                <button @click="toggleSort('positionTitle')"
                                    class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                    Position <i :class="['pi text-[10px]', sortIcon('positionTitle')]"></i>
                                </button>
                            </th>
                            <th
                                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Track</th>
                            <th
                                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Type</th>
                            <th class="px-4 py-3 text-left">
                                <button @click="toggleSort('salaryGrade')"
                                    class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                    SG <i :class="['pi text-[10px]', sortIcon('salaryGrade')]"></i>
                                </button>
                            </th>
                            <th
                                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Vacancies</th>
                            <th
                                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Status</th>
                            <th class="px-4 py-3 text-left">
                                <button @click="toggleSort('deadline')"
                                    class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                    Deadline <i :class="['pi text-[10px]', sortIcon('deadline')]"></i>
                                </button>
                            </th>
                            <th
                                class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[var(--border-main)]">
                        <tr v-for="job in filteredJobs" :key="job._id"
                            class="hover:bg-[var(--bg-app)] transition-colors group">
                            <!-- Position -->
                            <td class="px-4 py-3">
                                <p class="font-semibold text-[var(--text-main)] leading-tight">{{ job.positionTitle }}
                                </p>
                                <p class="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
                                    <i class="pi pi-tag text-[9px]"></i>{{ job.positionCode }}
                                    <span class="text-[var(--border-main)]">·</span>
                                    <i class="pi pi-map-marker text-[9px]"></i>{{ job.placeOfAssignment }}
                                </p>
                            </td>
                            <!-- Track -->
                            <td class="px-4 py-3">
                                <span
                                    :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full border', trackConfig[job.hiringTrack]?.class || 'bg-gray-100 text-gray-600 border-gray-200']">
                                    {{ trackConfig[job.hiringTrack]?.label || job.hiringTrack }}
                                </span>
                            </td>
                            <!-- Type -->
                            <td class="px-4 py-3 text-sm text-[var(--text-muted)] capitalize">{{ job.employmentType }}
                            </td>
                            <!-- SG -->
                            <td class="px-4 py-3">
                                <span class="text-sm font-semibold text-[var(--text-main)]">SG-{{ job.salaryGrade
                                    }}</span>
                                <p class="text-xs text-[var(--text-muted)]">₱{{ Number(job.salary).toLocaleString() }}
                                </p>
                            </td>
                            <!-- Vacancies -->
                            <td class="px-4 py-3 text-center">
                                <span
                                    class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-bold text-[var(--text-main)]">
                                    {{ job.noOfVacancy || job.itemNumbers?.length || 0 }}
                                </span>
                            </td>
                            <!-- Status -->
                            <td class="px-4 py-3">
                                <span
                                    :class="['text-[10px] font-semibold px-2.5 py-1 rounded-full border', statusConfig[job.status]?.class]">
                                    {{ statusConfig[job.status]?.label || job.status }}
                                </span>
                            </td>
                            <!-- Deadline -->
                            <td class="px-4 py-3">
                                <span v-if="job.deadline"
                                    :class="['text-sm', isExpired(job.deadline) ? 'text-red-500 font-medium' : 'text-[var(--text-muted)]']">
                                    <i v-if="isExpired(job.deadline)" class="pi pi-exclamation-circle text-xs mr-1"></i>
                                    {{ formatDate(job.deadline) }}
                                </span>
                                <span v-else class="text-[var(--text-muted)]">—</span>
                            </td>
                            <!-- Actions -->
                            <td class="px-4 py-3" @click.stop>
                                <div
                                    class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <!-- Quick status buttons -->
                                    <button v-if="canManage && job.status === 'draft'"
                                        @click="setStatus(job, 'published')"
                                        class="text-xs px-2.5 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors font-medium"
                                        title="Publish">
                                        <i class="pi pi-send text-[10px]"></i> Publish
                                    </button>
                                    <button v-if="canManage && job.status === 'published'"
                                        @click="setStatus(job, 'closed')"
                                        class="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors font-medium"
                                        title="Close">
                                        <i class="pi pi-lock text-[10px]"></i> Close
                                    </button>
                                    <button v-if="canManage && (job.status === 'closed' || job.status === 'draft')"
                                        @click="setStatus(job, 'archived')"
                                        class="text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors font-medium"
                                        title="Archive">
                                        Archive
                                    </button>
                                    <button v-if="canManage" @click="openEdit(job)"
                                        class="p-1.5 rounded-lg border border-[var(--border-main)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors"
                                        title="Edit">
                                        <i class="pi pi-pencil text-xs"></i>
                                    </button>
                                    <button v-if="canManage" @click="handleDelete(job)"
                                        class="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                        title="Delete">
                                        <i class="pi pi-trash text-xs"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- ── Create / Edit Modal ────────────────────────────────────────────── -->
        <Teleport to="body">
        <div v-if="showModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
            @click.self="closeModal">

            <div
                class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-zoom-in max-h-[92vh]">

                <!-- Header -->
                <div
                    class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between flex-shrink-0">
                    <div>
                        <h3 class="text-base font-bold text-[var(--text-main)]">
                            {{ isEditing ? 'Edit Job Vacancy' : 'Post New Vacancy' }}
                        </h3>
                        <p class="text-xs text-[var(--text-muted)] mt-0.5">Fill in all required qualification standards.
                        </p>
                    </div>
                    <button @click="closeModal"
                        class="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                        <i class="pi pi-times text-lg"></i>
                    </button>
                </div>

                <!-- Scrollable Body -->
                <div class="overflow-y-auto custom-scrollbar flex-1 p-6">
                    <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">

                        <!-- Section: Basic Info -->
                        <div>
                            <h4
                                class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                <span
                                    class="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                                Basic Information
                            </h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div class="sm:col-span-2 flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-[var(--text-muted)]">Position Title <span
                                            class="text-red-500">*</span></label>
                                    <input v-model="form.positionTitle" type="text" placeholder="e.g. Teacher I"
                                        required class="field" />
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-[var(--text-muted)]">Position Code <span
                                            class="text-red-500">*</span></label>
                                    <input v-model="form.positionCode" type="text" placeholder="e.g. TCHR1-001" required
                                        class="field uppercase" />
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-[var(--text-muted)]">Place of Assignment
                                        <span class="text-red-500">*</span></label>
                                    <input v-model="form.placeOfAssignment" type="text"
                                        placeholder="e.g. GNC Elementary School" required class="field" />
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-[var(--text-muted)]">Hiring Track <span
                                            class="text-red-500">*</span></label>
                                    <select v-model="form.hiringTrack" required class="field">
                                        <option value="teaching">Teaching</option>
                                        <option value="teaching_related">Teaching-Related</option>
                                        <option value="non_teaching">Non-Teaching</option>
                                    </select>
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-[var(--text-muted)]">Employment
                                        Type</label>
                                    <select v-model="form.employmentType" class="field">
                                        <option value="permanent">Permanent</option>
                                        <option value="contractual">Contractual</option>
                                        <option value="job order">Job Order</option>
                                        <option value="casual">Casual</option>
                                    </select>
                                </div>
                                <div class="sm:col-span-2 flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-[var(--text-muted)]">Description <span
                                            class="text-red-500">*</span></label>
                                    <textarea v-model="form.description" rows="3"
                                        placeholder="Brief description of duties and responsibilities..." required
                                        class="field resize-none"></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Section: Salary & Status -->
                        <div>
                            <h4
                                class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                <span
                                    class="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                                Salary & Status
                            </h4>
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-[var(--text-muted)]">Salary Grade <span
                                            class="text-red-500">*</span></label>
                                    <input v-model.number="form.salaryGrade" type="number" min="1" max="33"
                                        placeholder="e.g. 11" required class="field" />
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-[var(--text-muted)]">Monthly Salary (₱)
                                        <span class="text-red-500">*</span></label>
                                    <input v-model.number="form.salary" type="number" min="1" placeholder="e.g. 25000"
                                        required class="field" />
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-[var(--text-muted)]">Status</label>
                                    <select v-model="form.status" class="field">
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="closed">Closed</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-[var(--text-muted)]">Application
                                        Deadline</label>
                                    <input v-model="form.deadline" type="date" class="field" />
                                </div>
                            </div>
                        </div>

                        <!-- Section: Qualification Standards -->
                        <div>
                            <h4
                                class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                <span
                                    class="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-[10px] font-bold">3</span>
                                Qualification Standards (QS)
                            </h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-[var(--text-muted)]">Education <span
                                            class="text-red-500">*</span></label>
                                    <input v-model="form.education" type="text"
                                        placeholder="e.g. Bachelor's Degree in Education" required class="field" />
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-[var(--text-muted)]">Experience <span
                                            class="text-red-500">*</span></label>
                                    <input v-model="form.experience" type="text" placeholder="e.g. None required"
                                        required class="field" />
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-[var(--text-muted)]">Training <span
                                            class="text-red-500">*</span></label>
                                    <input v-model="form.trainings" type="text" placeholder="e.g. None required"
                                        required class="field" />
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-xs font-semibold text-[var(--text-muted)]">Eligibility <span
                                            class="text-red-500">*</span></label>
                                    <input v-model="form.eligibility" type="text" placeholder="e.g. LET / PBET" required
                                        class="field" />
                                </div>
                            </div>
                        </div>

                        <!-- Section: Item Numbers -->
                        <div>
                            <h4
                                class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                <span
                                    class="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-[10px] font-bold">4</span>
                                Plantilla Item Numbers
                                <span class="text-[var(--text-muted)] font-normal normal-case tracking-normal">({{
                                    form.itemNumbers.filter(n => n).length}} vacancy slot{{
                                        form.itemNumbers.filter(n => n).length !== 1 ? 's' : ''}})</span>
                            </h4>
                            <div class="flex flex-col gap-2">
                                <div v-for="(item, i) in form.itemNumbers" :key="i" class="flex gap-2">
                                    <input v-model="form.itemNumbers[i]" type="text"
                                        :placeholder="`Item No. ${i + 1}, e.g. TCHR1-GNC-001`" class="field flex-1" />
                                    <button type="button" @click="removeItemNumber(i)"
                                        :disabled="form.itemNumbers.length <= 1"
                                        class="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border-main)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                        <i class="pi pi-minus text-xs"></i>
                                    </button>
                                </div>
                                <button type="button" @click="addItemNumber"
                                    class="mt-1 h-9 rounded-lg border border-dashed border-[var(--border-main)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-gray-400 transition-colors flex items-center justify-center gap-1.5">
                                    <i class="pi pi-plus text-[10px]"></i> Add Item Number
                                </button>
                            </div>
                        </div>

                    </form>
                </div>

                <!-- Footer -->
                <div
                    class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-end gap-3 flex-shrink-0">
                    <button @click="closeModal"
                        class="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                        Cancel
                    </button>
                    <button @click="handleSubmit" :disabled="modalLoading"
                        class="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                        <i v-if="modalLoading" class="pi pi-spin pi-spinner text-sm"></i>
                        <i v-else :class="isEditing ? 'pi pi-save' : 'pi pi-send'" class="text-sm"></i>
                        {{ modalLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Post Vacancy') }}
                    </button>
                </div>
            </div>
        </div>
        </Teleport>
    </div>
</template>

