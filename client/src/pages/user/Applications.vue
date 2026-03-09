<script setup>
import { ref, computed, onMounted, onActivated, inject } from 'vue'
import apiClient from '@/api/axios'
import ApplicantCoverPagePdf from '@/components/ApplicantCoverPagePdf.vue'
import { AppBadge } from '@/components/ui'
import { statusConfig } from '@/utils/statusColors'

const toast = inject('$toast')

const applications  = ref([])
const loading       = ref(false)
const error         = ref('')
const searchQuery   = ref('')
const filterStatus  = ref('')

const selectedApp   = ref(null)
const showModal     = ref(false)
const showCoverPdf  = ref(false)
const activeTab     = ref('details')
const editMode      = ref(false)
const editLoading   = ref(false)
const editSaving    = ref(false)
const editError     = ref('')
const editProfile   = ref(null)
const uploadLoading = ref(false)

const selEdu  = ref([])
const selElig = ref([])
const selTrn  = ref([])
const selExp  = ref([])
const perfRating = ref({ score: '', adjective: '', periodCovered: '' })

const trackLabel = { teaching: 'Teaching', teaching_related: 'Teaching-Related', non_teaching: 'Non-Teaching' }

const filtered = computed(() => {
    let list = applications.value
    if (searchQuery.value) list = list.filter(a => a.job?.positionTitle?.toLowerCase().includes(searchQuery.value.toLowerCase()))
    if (filterStatus.value) list = list.filter(a => a.status === filterStatus.value)
    return list
})

const canEdit = computed(() => selectedApp.value && !selectedApp.value.isVerified && ['applied', 'verifying'].includes(selectedApp.value.status))

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const fetchApplications = async () => {
    loading.value = true
    error.value = ''
    try {
        const { data } = await apiClient.get('/v1/applications/my-applications')
        applications.value = data.data || []
    } catch (err) {
        error.value = 'Failed to load applications.'
    } finally {
        loading.value = false
    }
}

onMounted(fetchApplications)
onActivated(fetchApplications)

const handleFileUpload = async (event, type) => {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    uploadLoading.value = true
    try {
        const { data } = await apiClient.post(`/v1/applications/${selectedApp.value._id}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        selectedApp.value.attachments = data.data.attachments
        const idx = applications.value.findIndex(a => a._id === selectedApp.value._id)
        if (idx !== -1) applications.value[idx].attachments = data.data.attachments
        toast.fire({ icon: 'success', title: 'File Uploaded' })
    } catch (err) {
        toast.fire({ icon: 'error', title: 'Upload Failed', text: err.response?.data?.message })
    } finally {
        uploadLoading.value = false
    }
}
const openApp = (app) => {
    selectedApp.value = app
    editMode.value    = false
    activeTab.value   = 'details'
    editError.value   = ''
    showModal.value   = true
}


const closeModal = () => {
    showModal.value = false
    editMode.value  = false
}

// ── Start edit — load profile, pre-select matching items ───────────────────
const startEdit = async () => {
    editLoading.value = true
    editError.value   = ''
    try {
        const { data } = await apiClient.get('/v1/profile/me')
        editProfile.value = data.data || null
        const p  = editProfile.value
        const ad = selectedApp.value.applicantData || {}

        // Pre-select profile items that are currently in the application snapshot
        selEdu.value  = (p?.education  || []).map((e, i) =>
            (ad.education  || []).some(a => a.degree === e.degree && a.school === e.school) ? i : -1
        ).filter(i => i !== -1)
        selElig.value = (p?.eligibility || []).map((e, i) =>
            (ad.eligibility || []).some(a => a.name === e.name) ? i : -1
        ).filter(i => i !== -1)
        selTrn.value  = (p?.training   || []).map((e, i) =>
            (ad.training   || []).some(a => a.title === e.title) ? i : -1
        ).filter(i => i !== -1)
        selExp.value  = (p?.experience || []).map((e, i) =>
            (ad.experience || []).some(a => a.position === e.position && a.company === e.company) ? i : -1
        ).filter(i => i !== -1)

        // If nothing matched, default to all selected
        if (!selEdu.value.length  && p?.education?.length)   selEdu.value  = p.education.map((_, i) => i)
        if (!selElig.value.length && p?.eligibility?.length) selElig.value = p.eligibility.map((_, i) => i)
        if (!selTrn.value.length  && p?.training?.length)    selTrn.value  = p.training.map((_, i) => i)
        if (!selExp.value.length  && p?.experience?.length)  selExp.value  = p.experience.map((_, i) => i)

        perfRating.value = {
            score:         ad.performanceRating?.score         ?? p?.performanceRating?.score         ?? '',
            adjective:     ad.performanceRating?.adjective     ?? p?.performanceRating?.adjective     ?? '',
            periodCovered: ad.performanceRating?.periodCovered ?? p?.performanceRating?.periodCovered ?? '',
        }
        editMode.value = true
    } catch {
        editError.value = 'Failed to load your profile. Please try again.'
    } finally {
        editLoading.value = false
    }
}

const toggle = (arr, idx) => {
    const i = arr.indexOf(idx)
    if (i === -1) arr.push(idx)
    else arr.splice(i, 1)
}

// ── Save edited applicant data ─────────────────────────────────────────────
const saveEdit = async () => {
    editSaving.value = true
    editError.value  = ''
    const p = editProfile.value
    const personalInfo = p ? {
        firstName: p.name?.firstName, middleName: p.name?.middleName,
        lastName:  p.name?.lastName,  suffix:     p.name?.suffix,
        sex: p.sex, birthDate: p.birthDate, civilStatus: p.civilStatus,
        contact: p.contact, address: p.address,
    } : {}

    const applicantData = {
        personalInfo,
        education:         p?.education?.filter((_, i)  => selEdu.value.includes(i))  || [],
        eligibility:       p?.eligibility?.filter((_, i) => selElig.value.includes(i)) || [],
        training:          p?.training?.filter((_, i)   => selTrn.value.includes(i))   || [],
        experience:        p?.experience?.filter((_, i)  => selExp.value.includes(i))  || [],
        performanceRating: {
            score:         perfRating.value.score ? Number(perfRating.value.score) : null,
            adjective:     perfRating.value.adjective     || '',
            periodCovered: perfRating.value.periodCovered || '',
        },
    }

    try {
        const { data } = await apiClient.patch(
            `/v1/applications/${selectedApp.value._id}/applicant-data`,
            { applicantData }
        )
        const updated = { ...selectedApp.value, applicantData: data.data.applicantData, updatedAt: data.data.updatedAt }
        selectedApp.value = updated
        const idx = applications.value.findIndex(a => a._id === updated._id)
        if (idx !== -1) applications.value[idx] = { ...applications.value[idx], ...updated }
        editMode.value = false
    } catch (err) {
        editError.value = err.response?.data?.message || 'Failed to save changes.'
    } finally {
        editSaving.value = false
    }
}
</script>

<template>
    <div class="flex flex-col gap-6">

        <!-- ── Header ──────────────────────────────────────────────────── -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
                <h1 class="text-2xl font-bold text-[var(--text-main)]">My Applications</h1>
                <p class="text-sm text-[var(--text-muted)]">Track the status of all your submitted applications.</p>
            </div>
            <div class="flex items-center gap-2">
                <span class="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm font-medium text-[var(--text-muted)]">
                    <i class="pi pi-folder-open mr-1.5"></i>{{ filtered.length }} application{{ filtered.length !== 1 ? 's' : '' }}
                </span>
                <button @click="fetchApplications"
                    class="p-2 rounded-lg border border-[var(--border-main)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors"
                    title="Refresh">
                    <i :class="['pi pi-refresh text-sm', { 'animate-spin': loading }]"></i>
                </button>
            </div>
        </div>

        <!-- ── Filters ─────────────────────────────────────────────────── -->
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none"></i>
                <input v-model="searchQuery" type="text" placeholder="Search by position title..."
                    class="w-full h-9 pl-9 pr-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-shadow" />
            </div>
            <select v-model="filterStatus"
                class="h-9 px-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] appearance-none cursor-pointer min-w-[140px] transition-shadow">
                <option value="">All Statuses</option>
                <option v-for="(cfg, key) in statusConfig" :key="key" :value="key">{{ cfg.label }}</option>
            </select>
        </div>

        <!-- ── Error ───────────────────────────────────────────────────── -->
        <div v-if="error"
            class="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <i class="pi pi-exclamation-circle flex-shrink-0"></i>
            {{ error }}
        </div>

        <!-- ── Loading ─────────────────────────────────────────────────── -->
        <div v-else-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div v-for="i in 4" :key="i" class="h-32 rounded-2xl bg-[var(--surface)] border border-[var(--border-main)] animate-pulse flex items-center p-5 gap-5">
                <div class="w-12 h-12 rounded-2xl bg-[var(--bg-app)]"></div>
                <div class="flex-1 space-y-3">
                    <div class="h-4 w-3/4 bg-[var(--bg-app)] rounded"></div>
                    <div class="h-3 w-1/2 bg-[var(--bg-app)] rounded"></div>
                </div>
            </div>
        </div>

        <!-- ── Empty ───────────────────────────────────────────────────── -->
        <div v-else-if="filtered.length === 0"
            class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl py-20 flex flex-col items-center gap-4 text-[var(--text-muted)]">
            <i class="pi pi-folder-open text-4xl text-[var(--text-faint)]"></i>
            <div class="text-center">
                <p class="text-sm font-medium">No applications found</p>
                <p class="text-xs mt-1">{{ searchQuery || filterStatus ? 'Try adjusting your filters.' : 'You haven\'t applied to any positions yet.' }}</p>
            </div>
            <router-link v-if="!searchQuery && !filterStatus" to="/user/vacancies"
                class="h-9 px-5 rounded-lg bg-[var(--text-main)] text-[var(--surface)] text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                <i class="pi pi-briefcase text-xs"></i> Browse Vacancies
            </router-link>
        </div>

        <!-- ── Application Cards ───────────────────────────────────────── -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div v-for="app in filtered" :key="app._id"
                @click="openApp(app)"
                class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-5 flex items-center gap-5 cursor-pointer hover:border-[var(--color-primary-ring)] hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                
                <!-- Background Accent -->
                <div class="absolute -right-12 -top-12 w-32 h-32 bg-[var(--color-primary)]/5 rounded-full blur-3xl group-hover:bg-[var(--color-primary)]/10 transition-all duration-700"></div>

                <!-- Status Icon -->
                <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-sm transition-transform group-hover:scale-110', 
                    statusConfig[app.status]?.class || 'bg-[var(--bg-app)] text-[var(--text-sub)] border-[var(--border-main)]']">
                    <i :class="['pi text-base', statusConfig[app.status]?.icon || 'pi-file']"></i>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0 relative z-10">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] font-black text-[var(--text-faint)] leading-none">
                            {{ app.applicationCode || 'Ref-pending' }}
                        </span>
                    </div>
                    <p class="text-base font-black text-[var(--text-main)] truncate group-hover:text-[var(--color-primary)] transition-colors tracking-tight">
                        {{ app.job?.positionTitle || 'Untitled Position' }}
                    </p>
                    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] font-bold text-[var(--text-muted)] tracking-wider">
                        <span v-if="app.job?.placeOfAssignment" class="flex items-center gap-1.5">
                            <i class="pi pi-map-marker text-[10px] text-[var(--color-primary)]"></i>{{ Array.isArray(app.job.placeOfAssignment) ? app.job.placeOfAssignment.join(', ') : app.job.placeOfAssignment }}
                        </span>
                        <span class="flex items-center gap-1.5">
                            <i class="pi pi-calendar text-[10px]"></i>{{ formatDate(app.createdAt) }}
                        </span>
                    </div>
                </div>

                <!-- Status Badge -->
                <div class="flex flex-col items-end gap-2 flex-shrink-0 relative z-10">
                    <span :class="['text-[10px] font-black px-3 py-1 rounded-lg border', 
                        statusConfig[app.status]?.class || 'bg-[var(--bg-app)] text-[var(--text-sub)] border-[var(--border-main)]']">
                        {{ statusConfig[app.status]?.label || app.status }}
                    </span>
                    <div class="flex -space-x-2">
                        <div v-for="i in 3" :key="i" class="w-5 h-5 rounded-full border-2 border-white bg-[var(--bg-app)] flex items-center justify-center overflow-hidden">
                           <i class="pi pi-user text-[8px] text-[var(--text-faint)]"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Application Detail Modal ──────────────────────────────────────── -->
        <Teleport to="body">
        <div v-if="showModal && selectedApp"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
            @click.self="closeModal">

            <div :class="['bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden animate-zoom-in max-h-[90vh] transition-all', editMode ? 'max-w-2xl' : 'max-w-lg']">

                <!-- Header -->
                <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-start justify-between gap-4 flex-shrink-0">
                    <div>
                        <h3 class="text-base font-bold text-[var(--text-main)]">
                            {{ editMode ? 'Edit Application Data' : (selectedApp.job?.positionTitle || 'Application Details') }}
                        </h3>
                        <div class="flex items-center gap-2 mt-1">
                            <p class="text-[10px] font-black text-[var(--text-faint)]">
                                {{ editMode ? 'Selection mode' : `Code: ${selectedApp.applicationCode}` }}
                            </p>
                            <span v-if="!editMode" class="w-1 h-1 rounded-full bg-[var(--border-main)]"></span>
                            <div v-if="!editMode" class="flex gap-1">
                                <button @click="activeTab = 'details'" :class="[activeTab === 'details' ? 'text-[var(--color-primary)]' : 'text-[var(--text-faint)]']" class="text-[10px] font-black hover:text-[var(--text-main)] transition-colors">Details</button>
                                <span class="text-[10px] text-[var(--text-faint)]">/</span>
                                <button @click="activeTab = 'documents'" :class="[activeTab === 'documents' ? 'text-[var(--color-primary)]' : 'text-[var(--text-faint)]']" class="text-[10px] font-black hover:text-[var(--text-main)] transition-colors">Documents</button>
                            </div>
                        </div>
                    </div>
                    <button @click="closeModal" class="text-[var(--text-muted)] hover:text-[var(--text-main)] flex-shrink-0">
                        <i class="pi pi-times text-lg"></i>
                    </button>
                </div>

                <!-- ── VIEW MODE ────────────────────────────────────────── -->
                <template v-if="!editMode">
                <div class="overflow-y-auto flex-1 p-6 flex flex-col gap-6 custom-scrollbar relative">
                    
                    <Transition name="fade-slide" mode="out-in">
                    <!-- Tab: Details -->
                    <div v-if="activeTab === 'details'" class="space-y-6">
                        <!-- Status Progress Tracker -->
                        <div class="mb-2 p-5 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-2xl">
                            <div class="flex items-center justify-between mb-6">
                                <p class="text-[10px] font-black text-[var(--text-faint)]">Application Journey</p>
                                <AppBadge :variant="selectedApp.status" size="xs">
                                    {{ statusConfig[selectedApp.status]?.label || selectedApp.status }}
                                </AppBadge>
                            </div>
                            <div class="relative flex items-center justify-between px-2">
                                <!-- Progress Line -->
                                <div class="absolute left-6 right-6 top-4 h-0.5 bg-[var(--border-main)] z-0"></div>
                                <div class="absolute left-6 top-4 h-0.5 bg-[var(--color-primary)] transition-all duration-1000 z-0 shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.3)]"
                                    :style="{ width: `calc(${selectedApp.status === 'applied' ? '0%' : selectedApp.status === 'verifying' ? '33.33%' : selectedApp.status === 'comparative_assessment' ? '66.66%' : '100%'} - 12px)` }">
                                </div>

                                <!-- Steps -->
                                <div v-for="(step, idx) in [
                                    { id: 'applied', icon: 'pi-file-edit', label: 'Applied' },
                                    { id: 'verifying', icon: 'pi-search', label: 'Verified' },
                                    { id: 'comparative_assessment', icon: 'pi-chart-bar', label: 'Assessed' },
                                    { id: 'ranked', icon: 'pi-verified', label: 'Ranked' }
                                ]" :key="step.id" class="relative z-10 flex flex-col items-center gap-2 group/step">
                                    <div :class="['w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-sm', 
                                        selectedApp.status === step.id || (idx < ['applied', 'verifying', 'comparative_assessment', 'ranked'].indexOf(selectedApp.status))
                                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white scale-110'
                                        : 'bg-[var(--surface)] border-[var(--border-main)] text-[var(--text-faint)]']">
                                        <i :class="['pi text-[11px]', step.icon]"></i>
                                    </div>
                                    <span :class="['text-[9px] font-black transition-colors',
                                        selectedApp.status === step.id ? 'text-[var(--color-primary)]' : 'text-[var(--text-faint)]']">
                                        {{ step.label }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Assessment Results (If Ranked) -->
                        <div v-if="selectedApp.status === 'ranked' && selectedApp.hrRating" class="animate-fade-in-up">
                            <div class="p-5 rounded-3xl bg-gradient-to-br from-[var(--color-primary-light)] via-white to-white border border-[var(--color-primary-ring)] shadow-md overflow-hidden relative">
                                <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-[var(--color-primary)]/5 rounded-full blur-3xl"></div>
                                <div class="flex items-center justify-between mb-5 relative z-10">
                                    <div>
                                        <p class="text-[10px] font-black text-[var(--color-primary)]">Comparative Assessment</p>
                                        <h4 class="text-base font-black text-[var(--text-main)] mt-0.5">Final Score Card</h4>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-3xl font-black text-[var(--color-primary)] tracking-tighter tabular-nums">{{ selectedApp.totalScore.toFixed(2) }}</p>
                                        <p class="text-[10px] font-bold text-[var(--text-faint)]">Aggregate</p>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-2 relative z-10">
                                    <div v-for="(val, label) in {
                                        'Education': selectedApp.hrRating.educationPoints,
                                        'Training': selectedApp.hrRating.trainingPoints,
                                        'Experience': selectedApp.hrRating.experiencePoints,
                                        'PBAC/BEI': selectedApp.hrRating.potentialPoints?.bei
                                    }" :key="label" class="p-3 rounded-2xl bg-white/60 backdrop-blur-sm border border-[var(--color-primary-ring)]/40 flex items-center justify-between transition-transform hover:scale-[1.02]">
                                        <span class="text-[10px] font-bold text-[var(--text-muted)] tracking-tight">{{ label }}</span>
                                        <span class="text-xs font-black text-[var(--text-main)] tabular-nums">{{ val?.toFixed(2) || '0.00' }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Job Details -->
                        <div v-if="selectedApp.job">
                            <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-3 px-1">Vacancy Information</p>
                            <div class="grid grid-cols-2 gap-3">
                                <div v-for="[label, val] in [
                                    ['Position', selectedApp.job.positionTitle],
                                    ['Assignment', selectedApp.job.placeOfAssignment],
                                    ['Track', trackLabel[selectedApp.job.hiringTrack] || selectedApp.job.hiringTrack],
                                    ['Salary Grade', `SG-${selectedApp.job.salaryGrade}`],
                                ]" :key="label"
                                    class="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border-main)] shadow-sm">
                                    <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-1">{{ label }}</p>
                                    <p class="text-xs font-black text-[var(--text-main)] truncate uppercase">{{ val }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Submitted Data Summary -->
                        <div v-if="selectedApp.applicantData">
                            <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-3 px-1">Application Snapshot</p>
                            <div class="grid grid-cols-4 gap-2">
                                <div v-for="[label, count, icon, color] in [
                                    ['Edu', selectedApp.applicantData.education?.length   || 0, 'pi-graduation-cap', 'text-blue-500'],
                                    ['Eli', selectedApp.applicantData.eligibility?.length || 0, 'pi-verified', 'text-purple-500'],
                                    ['Trn', selectedApp.applicantData.training?.length    || 0, 'pi-star', 'text-amber-500'],
                                    ['Exp', selectedApp.applicantData.experience?.length  || 0, 'pi-briefcase', 'text-emerald-500'],
                                ]" :key="label" class="flex flex-col items-center justify-center p-3 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-sm group/snap">
                                    <i :class="['pi text-[11px] mb-1.5 opacity-60 group-hover/snap:scale-125 transition-transform', icon, color]"></i>
                                    <span class="text-base font-black text-[var(--text-main)] leading-none tabular-nums">{{ count }}</span>
                                    <span class="text-[8px] font-black text-[var(--text-faint)] uppercase tracking-widest mt-1">{{ label }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tab: Documents -->
                    <div v-else-if="activeTab === 'documents'" class="space-y-6">
                        <div class="p-5 bg-[var(--color-primary-light)]/50 border border-[var(--color-primary-ring)]/30 rounded-2xl flex gap-4 items-start shadow-inner">
                            <div class="w-8 h-8 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white shrink-0 shadow-sm">
                                <i class="pi pi-info-circle text-sm"></i>
                            </div>
                            <p class="text-[11px] font-semibold text-[var(--color-primary-dark)] leading-relaxed">
                                Upload clear scanned copies of your requirements. Documents must be in PDF or Image format (max 5MB). 
                                Verified documents are locked and cannot be changed.
                            </p>
                        </div>

                        <div class="space-y-3">
                            <div v-for="docType in [
                                { id: 'transcript', label: 'Transcript of Records', icon: 'pi-file-pdf' },
                                { id: 'eligibility', label: 'Eligibility / Board Rating', icon: 'pi-verified' },
                                { id: 'service_record', label: 'Service Record / Experience', icon: 'pi-briefcase' },
                                { id: 'training_cert', label: 'Training Certificates', icon: 'pi-star' }
                            ]" :key="docType.id" 
                                class="p-4 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl flex items-center justify-between group hover:border-[var(--color-primary-ring)] hover:shadow-md transition-all">
                                <div class="flex items-center gap-4">
                                    <div class="w-11 h-11 rounded-2xl bg-[var(--bg-app)] flex items-center justify-center border border-[var(--border-main)] text-[var(--text-faint)] group-hover:bg-[var(--color-primary-light)] group-hover:text-[var(--color-primary)] transition-colors">
                                        <i :class="['pi text-sm', docType.icon]"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm font-black text-[var(--text-main)]">{{ docType.label }}</p>
                                        <div class="flex items-center gap-1.5 mt-0.5">
                                            <div :class="['w-1.5 h-1.5 rounded-full', selectedApp.attachments?.find(a => a.type === docType.id) ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-[var(--text-faint)]']"></div>
                                            <p class="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-tight">
                                                {{ selectedApp.attachments?.find(a => a.type === docType.id) ? 'Status: Uploaded' : 'Status: Pending' }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-2">
                                    <a v-if="selectedApp.attachments?.find(a => a.type === docType.id)" 
                                       :href="selectedApp.attachments.find(a => a.type === docType.id).fileUrl" 
                                       target="_blank"
                                       class="h-9 px-4 rounded-xl border border-[var(--border-main)] flex items-center justify-center text-[10px] font-black uppercase text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)] transition-all">
                                       <i class="pi pi-external-link mr-1.5"></i> View
                                    </a>
                                    <label v-if="!selectedApp.isVerified" class="h-9 px-4 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-[10px] font-black uppercase text-white cursor-pointer hover:opacity-90 hover:shadow-lg transition-all shadow-primary/20">
                                        <input type="file" class="hidden" @change="e => handleFileUpload(e, docType.id)" accept=".pdf,image/*" />
                                        <i :class="['pi mr-1.5 text-[10px]', selectedApp.attachments?.find(a => a.type === docType.id) ? 'pi-sync' : 'pi-upload']"></i>
                                        {{ selectedApp.attachments?.find(a => a.type === docType.id) ? 'Change' : 'Upload' }}
                                    </label>
                                    <div v-else-if="selectedApp.attachments?.find(a => a.type === docType.id)" class="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center" title="Verified">
                                        <i class="pi pi-check-circle"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </Transition>
                </div>

                <!-- Footer (view) -->
                <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex items-center justify-between gap-3 flex-shrink-0 flex-wrap">
                    <button @click="closeModal"
                        class="h-10 px-5 rounded-lg border border-[var(--border-main)] text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--surface)] transition-colors">
                        Close
                    </button>
                    <div class="flex items-center gap-2">
                        <!-- Cover Sheet -->
                        <button @click="showCoverPdf = true"
                            class="h-10 px-4 rounded-lg border border-[var(--border-main)] bg-[var(--surface)] hover:bg-[var(--bg-app)] text-[var(--text-main)] text-sm font-semibold transition-colors flex items-center gap-2">
                            <i class="pi pi-file-pdf text-xs text-red-500"></i> Cover Sheet
                        </button>
                        <!-- Edit (only if not locked) -->
                        <button v-if="canEdit" @click="startEdit" :disabled="editLoading"
                            class="btn-primary h-10 px-4 flex items-center gap-2">
                            <i :class="['pi text-xs', editLoading ? 'pi-spin pi-spinner' : 'pi-pencil']"></i>
                            {{ editLoading ? 'Loading...' : 'Edit Snapshot' }}
                        </button>
                        <span v-else-if="selectedApp.isVerified" class="text-xs font-bold text-[var(--text-faint)] uppercase tracking-widest flex items-center gap-1.5">
                            <i class="pi pi-lock text-[10px]"></i> Verified & Locked
                        </span>
                    </div>
                </div>
                </template>

                <!-- ── EDIT MODE ────────────────────────────────────────── -->
                <template v-else>
                <div class="overflow-y-auto flex-1 p-6 flex flex-col gap-6 custom-scrollbar bg-[var(--surface-2)]">

                    <div class="p-5 bg-white border border-[var(--border-main)] rounded-2xl shadow-sm">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
                                <i class="pi pi-pencil text-xs"></i>
                            </div>
                            <div>
                                <h4 class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">Modify Application Snapshot</h4>
                                <p class="text-[10px] text-[var(--text-muted)] font-medium">Select specific items from your profile to include in this application.</p>
                            </div>
                        </div>

                        <!-- Error -->
                        <div v-if="editError" class="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs mb-4">
                            <i class="pi pi-exclamation-circle flex-shrink-0"></i>{{ editError }}
                        </div>
                    </div>

                    <!-- Education -->
                    <div class="space-y-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)] flex items-center justify-between px-1">
                            <span class="flex items-center gap-2"><i class="pi pi-graduation-cap"></i> Education Background</span>
                            <span class="tabular-nums">{{ selEdu.length }} / {{ editProfile?.education?.length || 0 }}</span>
                        </p>
                        <div v-if="!editProfile?.education?.length" class="p-8 text-center bg-white border border-dashed border-[var(--border-main)] rounded-2xl text-[var(--text-faint)] text-xs italic">No education entries in your profile.</div>
                        <div v-else class="grid grid-cols-1 gap-2">
                            <label v-for="(edu, i) in editProfile.education" :key="i"
                                :class="['flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md',
                                    selEdu.includes(i) ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/30 ring-1 ring-[var(--color-primary)]/20' : 'border-[var(--border-main)] bg-white opacity-70 hover:opacity-100']">
                                <div class="relative flex items-center justify-center mt-1">
                                    <input type="checkbox" :checked="selEdu.includes(i)" @change="toggle(selEdu, i)" class="w-4 h-4 rounded border-[var(--border-main)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] transition-all cursor-pointer" />
                                </div>
                                <div class="min-w-0">
                                    <p class="text-xs font-black text-[var(--text-main)] uppercase tracking-tight">{{ edu.degree || edu.level }}</p>
                                    <p class="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">{{ edu.school }}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Eligibility -->
                    <div class="space-y-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)] flex items-center justify-between px-1">
                            <span class="flex items-center gap-2"><i class="pi pi-verified text-purple-500"></i> Civil Service Eligibility</span>
                            <span class="tabular-nums">{{ selElig.length }} / {{ editProfile?.eligibility?.length || 0 }}</span>
                        </p>
                        <div v-if="!editProfile?.eligibility?.length" class="p-8 text-center bg-white border border-dashed border-[var(--border-main)] rounded-2xl text-[var(--text-faint)] text-xs italic">No eligibility entries in your profile.</div>
                        <div v-else class="grid grid-cols-1 gap-2">
                            <label v-for="(elig, i) in editProfile.eligibility" :key="i"
                                :class="['flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md',
                                    selElig.includes(i) ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-200' : 'border-[var(--border-main)] bg-white opacity-70 hover:opacity-100']">
                                <div class="relative flex items-center justify-center mt-1">
                                    <input type="checkbox" :checked="selElig.includes(i)" @change="toggle(selElig, i)" class="w-4 h-4 rounded border-[var(--border-main)] text-purple-600 focus:ring-purple-500 transition-all cursor-pointer" />
                                </div>
                                <div class="min-w-0">
                                    <p class="text-xs font-black text-[var(--text-main)] uppercase tracking-tight">{{ elig.name }}</p>
                                    <p class="text-[10px] font-bold text-purple-700/70 mt-0.5">Rating: {{ elig.rating || 'N/A' }} · {{ elig.placeOfExam }}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Experience -->
                    <div class="space-y-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)] flex items-center justify-between px-1">
                            <span class="flex items-center gap-2"><i class="pi pi-briefcase text-emerald-500"></i> Relevant Experience</span>
                            <span class="tabular-nums">{{ selExp.length }} / {{ editProfile?.experience?.length || 0 }}</span>
                        </p>
                        <div v-if="!editProfile?.experience?.length" class="p-8 text-center bg-white border border-dashed border-[var(--border-main)] rounded-2xl text-[var(--text-faint)] text-xs italic">No experience entries in your profile.</div>
                        <div v-else class="grid grid-cols-1 gap-2">
                            <label v-for="(exp, i) in editProfile.experience" :key="i"
                                :class="['flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md',
                                    selExp.includes(i) ? 'border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200' : 'border-[var(--border-main)] bg-white opacity-70 hover:opacity-100']">
                                <div class="relative flex items-center justify-center mt-1">
                                    <input type="checkbox" :checked="selExp.includes(i)" @change="toggle(selExp, i)" class="w-4 h-4 rounded border-[var(--border-main)] text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer" />
                                </div>
                                <div class="min-w-0">
                                    <p class="text-xs font-black text-[var(--text-main)] uppercase tracking-tight">{{ exp.position }}</p>
                                    <p class="text-[10px] font-bold text-emerald-700/70 mt-0.5 uppercase tracking-tight">{{ exp.company }}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Performance -->
                    <div class="p-5 bg-white border border-[var(--border-main)] rounded-3xl shadow-sm space-y-4">
                        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)] flex items-center gap-2">
                            <i class="pi pi-star text-amber-500"></i> Latest Performance Rating
                        </p>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div class="space-y-1">
                                <label class="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Numeric Score</label>
                                <input v-model="perfRating.score" type="number" step="0.001" min="1" max="5" placeholder="4.500"
                                    class="w-full h-10 px-4 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl text-xs font-black focus:border-[var(--color-primary)] outline-none transition-all" />
                            </div>
                            <div class="space-y-1">
                                <label class="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Adjectival</label>
                                <input v-model="perfRating.adjective" type="text" placeholder="Very Satisfactory"
                                    class="w-full h-10 px-4 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl text-xs font-black focus:border-[var(--color-primary)] outline-none transition-all uppercase" />
                            </div>
                            <div class="space-y-1">
                                <label class="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Period</label>
                                <input v-model="perfRating.periodCovered" type="text" placeholder="Jan-Dec 2024"
                                    class="w-full h-10 px-4 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl text-xs font-black focus:border-[var(--color-primary)] outline-none transition-all uppercase" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer (edit) -->
                <div class="px-6 py-4 border-t border-[var(--border-main)] bg-white flex items-center justify-between gap-3 flex-shrink-0 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.05)]">
                    <button @click="editMode = false"
                        class="h-10 px-6 rounded-xl border border-[var(--border-main)] text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors">
                        Cancel
                    </button>
                    <button @click="saveEdit" :disabled="editSaving"
                        class="h-10 px-8 rounded-xl bg-[var(--color-primary)] text-[10px] font-black uppercase tracking-[0.2em] text-white hover:opacity-90 shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center gap-2">
                        <i :class="['pi text-[10px]', editSaving ? 'pi-spin pi-spinner' : 'pi-check']"></i>
                        {{ editSaving ? 'Saving Snapshot' : 'Save Changes' }}
                    </button>
                </div>
                </template>

            </div>
        </div>
        </Teleport>

        <!-- Cover PDF preview/download -->
        <ApplicantCoverPagePdf
            v-if="showCoverPdf && selectedApp"
            :app="selectedApp"
            @close="showCoverPdf = false"
        />
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

/* Tab Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.3s ease;
}
.fade-slide-enter-from {
    opacity: 0;
    transform: translateX(10px);
}
.fade-slide-leave-to {
    opacity: 0;
    transform: translateX(-10px);
}

.shadow-primary {
    box-shadow: 0 4px 14px 0 rgba(var(--color-primary-rgb), 0.3);
}

@keyframes bounce-subtle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}

.animate-bounce-subtle {
    animation: bounce-subtle 3s infinite;
}
</style>

