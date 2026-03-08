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
                    class="w-full h-9 pl-9 pr-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-shadow" />
            </div>
            <select v-model="filterStatus"
                class="h-9 px-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none appearance-none cursor-pointer min-w-[140px]">
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
        <div v-else-if="loading" class="flex flex-col gap-3">
            <div v-for="i in 4" :key="i" class="h-20 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] animate-pulse"></div>
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
        <div v-else class="flex flex-col gap-3">
            <div v-for="app in filtered" :key="app._id"
                @click="openApp(app)"
                class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-[var(--color-primary-ring)] hover:shadow-sm transition-all group">

                <!-- Status Icon -->
                <div :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border', statusConfig[app.status]?.class || 'bg-[var(--bg-app)] text-[var(--text-sub)] border-[var(--border-main)]']">
                    <i :class="['pi text-sm', statusConfig[app.status]?.icon || 'pi-file']"></i>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-[var(--text-main)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                        {{ app.job?.positionTitle || 'Position' }}
                    </p>
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-[var(--text-muted)]">
                        <span v-if="app.job?.placeOfAssignment" class="flex items-center gap-1">
                            <i class="pi pi-map-marker text-[9px]"></i>{{ app.job.placeOfAssignment }}
                        </span>
                        <span v-if="app.job?.hiringTrack" class="flex items-center gap-1">
                            <i class="pi pi-tag text-[9px]"></i>{{ trackLabel[app.job.hiringTrack] || app.job.hiringTrack }}
                        </span>
                        <span class="flex items-center gap-1">
                            <i class="pi pi-calendar text-[9px]"></i>Applied {{ formatDate(app.createdAt) }}
                        </span>
                    </div>
                </div>

                <!-- Status Badge -->
                <div class="flex items-center gap-3 flex-shrink-0">
                    <span :class="['text-[10px] font-bold px-2.5 py-1 rounded-full border', statusConfig[app.status]?.class || 'bg-[var(--bg-app)] text-[var(--text-sub)] border-[var(--border-main)]']">
                        {{ statusConfig[app.status]?.label || app.status }}
                    </span>
                    <i class="pi pi-angle-right text-sm text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"></i>
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
                            <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">
                                {{ editMode ? 'Selection Mode' : `Code: ${selectedApp.applicationCode}` }}
                            </p>
                            <span v-if="!editMode" class="w-1 h-1 rounded-full bg-[var(--border-strong)]"></span>
                            <div v-if="!editMode" class="flex gap-1">
                                <button @click="activeTab = 'details'" :class="[activeTab === 'details' ? 'text-[var(--color-primary)]' : 'text-[var(--text-faint)]']" class="text-[10px] font-black uppercase tracking-widest hover:text-[var(--text-main)] transition-colors">Details</button>
                                <span class="text-[10px] text-[var(--text-faint)]">/</span>
                                <button @click="activeTab = 'documents'" :class="[activeTab === 'documents' ? 'text-[var(--color-primary)]' : 'text-[var(--text-faint)]']" class="text-[10px] font-black uppercase tracking-widest hover:text-[var(--text-main)] transition-colors">Documents</button>
                            </div>
                        </div>
                    </div>
                    <button @click="closeModal" class="text-[var(--text-muted)] hover:text-[var(--text-main)] flex-shrink-0">
                        <i class="pi pi-times text-lg"></i>
                    </button>
                </div>

                <!-- ── VIEW MODE ────────────────────────────────────────── -->
                <template v-if="!editMode">
                <div class="overflow-y-auto flex-1 p-6 flex flex-col gap-6 custom-scrollbar">

                    <!-- Tab: Details -->
                    <template v-if="activeTab === 'details'">
                        <!-- Status Progress Tracker -->
                        <div class="mb-2">
                            <div class="flex items-center justify-between mb-4">
                                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)]">Application Journey</p>
                                <AppBadge :variant="statusConfig[selectedApp.status]?.class?.includes('green') ? 'success' : 'gold'" size="xs">
                                    {{ statusConfig[selectedApp.status]?.label }}
                                </AppBadge>
                            </div>
                            <div class="relative flex items-center justify-between">
                                <!-- Progress Line -->
                                <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-[var(--border-main)] z-0"></div>
                                <div class="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[var(--color-primary)] transition-all duration-1000 z-0"
                                    :style="{ width: selectedApp.status === 'applied' ? '0%' : selectedApp.status === 'verifying' ? '33%' : selectedApp.status === 'comparative_assessment' ? '66%' : '100%' }">
                                </div>

                                <!-- Steps -->
                                <div v-for="(step, idx) in [
                                    { id: 'applied', icon: 'pi-file-edit', label: 'Applied' },
                                    { id: 'verifying', icon: 'pi-search', label: 'Verified' },
                                    { id: 'comparative_assessment', icon: 'pi-chart-bar', label: 'Assessed' },
                                    { id: 'ranked', icon: 'pi-verified', label: 'Ranked' }
                                ]" :key="step.id" class="relative z-10 flex flex-col items-center gap-2">
                                    <div :class="['w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500', 
                                        selectedApp.status === step.id || (idx < ['applied', 'verifying', 'comparative_assessment', 'ranked'].indexOf(selectedApp.status))
                                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-lg'
                                        : 'bg-[var(--surface)] border-[var(--border-main)] text-[var(--text-faint)]']">
                                        <i :class="['pi text-[10px]', step.icon]"></i>
                                    </div>
                                    <span class="text-[9px] font-bold uppercase tracking-tighter text-[var(--text-faint)]">{{ step.label }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Assessment Results (If Ranked) -->
                        <div v-if="selectedApp.status === 'ranked' && selectedApp.hrRating" class="animate-fade-in-up">
                            <div class="p-4 rounded-2xl bg-gradient-to-br from-[var(--color-primary-light)] to-white border border-[var(--color-primary-ring)] shadow-sm">
                                <div class="flex items-center justify-between mb-4">
                                    <div>
                                        <p class="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Assessment Result</p>
                                        <h4 class="text-sm font-black text-[var(--text-main)]">Point Breakdown (DO 007)</h4>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-2xl font-black text-[var(--color-primary)] tracking-tighter">{{ selectedApp.totalScore.toFixed(2) }}</p>
                                        <p class="text-[9px] font-bold text-[var(--text-faint)] uppercase">Total Points</p>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-2">
                                    <div v-for="(val, label) in {
                                        'Education': selectedApp.hrRating.educationPoints,
                                        'Training': selectedApp.hrRating.trainingPoints,
                                        'Experience': selectedApp.hrRating.experiencePoints,
                                        'PBAC/BEI': selectedApp.hrRating.potentialPoints?.bei
                                    }" :key="label" class="p-2.5 rounded-xl bg-white/50 border border-[var(--color-primary-ring)]/30 flex items-center justify-between">
                                        <span class="text-[10px] font-bold text-[var(--text-muted)]">{{ label }}</span>
                                        <span class="text-xs font-black text-[var(--text-main)]">{{ val?.toFixed(2) || '0.00' }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Job Details -->
                        <div v-if="selectedApp.job">
                            <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-3">Vacancy Information</p>
                            <div class="grid grid-cols-2 gap-3">
                                <div v-for="[label, val] in [
                                    ['Position', selectedApp.job.positionTitle],
                                    ['Assignment', selectedApp.job.placeOfAssignment],
                                    ['Track', trackLabel[selectedApp.job.hiringTrack] || selectedApp.job.hiringTrack],
                                    ['Salary Grade', `SG-${selectedApp.job.salaryGrade}`],
                                ]" :key="label"
                                    class="bg-[var(--surface-2)] rounded-xl p-3 border border-[var(--border-main)]">
                                    <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-0.5">{{ label }}</p>
                                    <p class="text-xs font-bold text-[var(--text-main)] truncate">{{ val }}</p>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- Tab: Documents -->
                    <template v-else-if="activeTab === 'documents'">
                        <div class="space-y-6">
                            <div class="p-4 bg-[var(--color-primary-light)] border border-[var(--border-main)] rounded-2xl flex gap-3 items-start">
                                <i class="pi pi-info-circle text-[var(--color-primary)] mt-0.5"></i>
                                <p class="text-[11px] font-medium text-[var(--color-primary)] leading-relaxed">
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
                                    class="p-4 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl flex items-center justify-between group hover:border-[var(--color-primary-ring)] transition-all">
                                    <div class="flex items-center gap-3">
                                        <div class="w-9 h-9 rounded-xl bg-[var(--surface-2)] flex items-center justify-center border border-[var(--border-main)] text-[var(--text-faint)]">
                                            <i :class="['pi text-xs', docType.icon]"></i>
                                        </div>
                                        <div>
                                            <p class="text-xs font-black text-[var(--text-main)]">{{ docType.label }}</p>
                                            <p class="text-[9px] font-bold text-[var(--text-faint)] uppercase tracking-tighter">
                                                {{ selectedApp.attachments?.find(a => a.type === docType.id) ? 'Uploaded' : 'Pending Upload' }}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center gap-2">
                                        <a v-if="selectedApp.attachments?.find(a => a.type === docType.id)" 
                                           :href="selectedApp.attachments.find(a => a.type === docType.id).fileUrl" 
                                           target="_blank"
                                           class="h-8 px-3 rounded-lg border border-[var(--border-main)] flex items-center justify-center text-[10px] font-black uppercase text-[var(--text-muted)] hover:bg-[var(--bg-app)] transition-all">
                                           View
                                        </a>
                                        <label v-if="!selectedApp.isVerified" class="h-8 px-3 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-[10px] font-black uppercase text-white cursor-pointer hover:opacity-90 transition-all">
                                            <input type="file" class="hidden" @change="e => handleFileUpload(e, docType.id)" accept=".pdf,image/*" />
                                            {{ selectedApp.attachments?.find(a => a.type === docType.id) ? 'Replace' : 'Upload' }}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- Submitted Data Summary -->
                    <div v-if="selectedApp.applicantData">
                        <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-3">Snapshot Summary</p>
                        <div class="grid grid-cols-2 gap-2">
                            <div v-for="[label, count] in [
                                ['Education',    selectedApp.applicantData.education?.length   || 0],
                                ['Eligibility',  selectedApp.applicantData.eligibility?.length || 0],
                                ['Training',     selectedApp.applicantData.training?.length    || 0],
                                ['Experience',   selectedApp.applicantData.experience?.length  || 0],
                            ]" :key="label" class="flex justify-between items-center px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-main)] rounded-lg">
                                <span class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{{ label }}</span>
                                <span class="text-xs font-black text-[var(--text-main)]">{{ count }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer (view) -->
                <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--surface-2)] flex items-center justify-between gap-3 flex-shrink-0 flex-wrap">
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
                <div class="overflow-y-auto flex-1 p-6 flex flex-col gap-6 custom-scrollbar">

                    <!-- Error -->
                    <div v-if="editError" class="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                        <i class="pi pi-exclamation-circle flex-shrink-0"></i>{{ editError }}
                    </div>

                    <!-- No profile warning -->
                    <div v-if="!editProfile" class="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                        <i class="pi pi-exclamation-triangle mt-0.5 shrink-0"></i>
                        <p>Your profile could not be loaded. Your submitted data is shown as-is.</p>
                    </div>

                    <!-- Education -->
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                            <i class="pi pi-graduation-cap"></i> Education
                            <span class="font-normal normal-case">({{ selEdu.length }}/{{ editProfile?.education?.length || 0 }} selected)</span>
                        </p>
                        <div v-if="!editProfile?.education?.length" class="text-xs text-[var(--text-faint)] italic">No education entries in your profile.</div>
                        <div v-else class="flex flex-col gap-2">
                            <label v-for="(edu, i) in editProfile.education" :key="i"
                                :class="['flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                                    selEdu.includes(i) ? 'border-[var(--color-primary-ring)] bg-[var(--color-primary-light)]' : 'border-[var(--border-main)] bg-[var(--bg-app)] hover:border-[var(--color-primary-ring)]']">
                                <input type="checkbox" :checked="selEdu.includes(i)" @change="toggle(selEdu, i)" class="mt-0.5 accent-[var(--color-primary)]" />
                                <div class="min-w-0">
                                    <p class="text-sm font-semibold text-[var(--text-main)]">{{ edu.degree || edu.level }}</p>
                                    <p class="text-xs text-[var(--text-muted)]">{{ edu.school }}{{ edu.yearGraduated ? ` · ${edu.yearGraduated}` : '' }}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Eligibility -->
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                            <i class="pi pi-verified"></i> Eligibility
                            <span class="font-normal normal-case">({{ selElig.length }}/{{ editProfile?.eligibility?.length || 0 }} selected)</span>
                        </p>
                        <div v-if="!editProfile?.eligibility?.length" class="text-xs text-[var(--text-faint)] italic">No eligibility entries in your profile.</div>
                        <div v-else class="flex flex-col gap-2">
                            <label v-for="(elig, i) in editProfile.eligibility" :key="i"
                                :class="['flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                                    selElig.includes(i) ? 'border-purple-300 bg-purple-50' : 'border-[var(--border-main)] bg-[var(--bg-app)] hover:border-purple-200']">
                                <input type="checkbox" :checked="selElig.includes(i)" @change="toggle(selElig, i)" class="mt-0.5 accent-purple-600" />
                                <div class="min-w-0">
                                    <p class="text-sm font-semibold text-[var(--text-main)]">{{ elig.name }}</p>
                                    <p class="text-xs text-[var(--text-muted)]">{{ elig.placeOfExam }}{{ elig.rating ? ` · Rating: ${elig.rating}` : '' }}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Training -->
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                            <i class="pi pi-book"></i> Training &amp; Seminars
                            <span class="font-normal normal-case">({{ selTrn.length }}/{{ editProfile?.training?.length || 0 }} selected)</span>
                        </p>
                        <div v-if="!editProfile?.training?.length" class="text-xs text-[var(--text-faint)] italic">No training entries in your profile.</div>
                        <div v-else class="flex flex-col gap-2">
                            <label v-for="(trn, i) in editProfile.training" :key="i"
                                :class="['flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                                    selTrn.includes(i) ? 'border-amber-300 bg-amber-50' : 'border-[var(--border-main)] bg-[var(--bg-app)] hover:border-amber-200']">
                                <input type="checkbox" :checked="selTrn.includes(i)" @change="toggle(selTrn, i)" class="mt-0.5 accent-amber-500" />
                                <div class="min-w-0">
                                    <p class="text-sm font-semibold text-[var(--text-main)]">{{ trn.title }}</p>
                                    <p class="text-xs text-[var(--text-muted)]">{{ trn.provider }}{{ trn.hours ? ` · ${trn.hours}h` : '' }}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Experience -->
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                            <i class="pi pi-briefcase"></i> Work Experience
                            <span class="font-normal normal-case">({{ selExp.length }}/{{ editProfile?.experience?.length || 0 }} selected)</span>
                        </p>
                        <div v-if="!editProfile?.experience?.length" class="text-xs text-[var(--text-faint)] italic">No experience entries in your profile.</div>
                        <div v-else class="flex flex-col gap-2">
                            <label v-for="(exp, i) in editProfile.experience" :key="i"
                                :class="['flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                                    selExp.includes(i) ? 'border-green-300 bg-green-50' : 'border-[var(--border-main)] bg-[var(--bg-app)] hover:border-green-200']">
                                <input type="checkbox" :checked="selExp.includes(i)" @change="toggle(selExp, i)" class="mt-0.5 accent-green-600" />
                                <div class="min-w-0">
                                    <p class="text-sm font-semibold text-[var(--text-main)]">{{ exp.position }}</p>
                                    <p class="text-xs text-[var(--text-muted)]">{{ exp.company }}{{ exp.months ? ` · ${exp.months} mo` : '' }}{{ exp.isGovernment ? ' · Gov\'t' : '' }}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Performance Rating -->
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                            <i class="pi pi-star"></i> Latest Performance Rating
                        </p>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)]">
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Score (e.g. 4.5)</label>
                                <input v-model="perfRating.score" type="number" step="0.001" min="1" max="5" placeholder="Optional"
                                    class="input text-sm" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Adjective Rating</label>
                                <input v-model="perfRating.adjective" type="text" placeholder="e.g. Very Satisfactory"
                                    class="input text-sm" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Period Covered</label>
                                <input v-model="perfRating.periodCovered" type="text" placeholder="e.g. Jan-Dec 2024"
                                    class="input text-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer (edit) -->
                <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex items-center justify-between gap-3 flex-shrink-0">
                    <button @click="editMode = false"
                        class="h-10 px-5 rounded-lg border border-[var(--border-main)] text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--surface)] transition-colors">
                        Cancel
                    </button>
                    <button @click="saveEdit" :disabled="editSaving"
                        class="h-10 px-5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center gap-2">
                        <i :class="['pi text-xs', editSaving ? 'pi-spin pi-spinner' : 'pi-check']"></i>
                        {{ editSaving ? 'Saving...' : 'Save Changes' }}
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

