<script setup>
import { ref, computed, onMounted, onActivated, inject } from 'vue'
import apiClient from '@/api/axios'
import ApplicantCoverPagePdf from '@/components/ApplicantCoverPagePdf.vue'
import { AppBadge, AppModal, AppTabs, AppButton } from '@/components/ui'
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

const modalTabs = computed(() => [
    { key: 'details',   label: 'Overview',     icon: 'pi-compass' },
    { key: 'documents', label: 'Requirements', icon: 'pi-file-pdf' }
])

const filtered = computed(() => {
    let list = applications.value
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        list = list.filter(a => 
            a.job?.positionTitle?.toLowerCase().includes(q) ||
            a.applicationCode?.toLowerCase().includes(q) ||
            (Array.isArray(a.job?.placeOfAssignment) && a.job.placeOfAssignment.some(p => p.toLowerCase().includes(q))) ||
            (typeof a.job?.placeOfAssignment === 'string' && a.job.placeOfAssignment.toLowerCase().includes(q))
        )
    }
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
        firstName:        p.name?.firstName,
        middleName:       p.name?.middleName,
        lastName:         p.name?.lastName,
        suffix:           p.name?.suffix,
        sex:              p.sex,
        birthDate:        p.birthDate,
        ethnicGroup:      p.ethnicGroup,
        religion:         p.religion,
        disability:       p.disability,
        civilStatus:      p.civilStatus,
        gsisNo:           p.gsisNo,
        pagibigNo:        p.pagibigNo,
        philhealthNo:     p.philhealthNo,
        tinNo:            p.tinNo,
        agencyEmployeeNo: p.agencyEmployeeNo,
        phones:           p.contact?.phones || [],
        emails:           p.contact?.emails || [],
        address:          p.address,
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
            `/applications/${selectedApp.value._id}/applicant-data`,
            { applicantData }
        )
        const updated = { ...selectedApp.value, applicantData: data.data.applicantData, updatedAt: data.data.updatedAt }
        selectedApp.value = updated
        const idx = applications.value.findIndex(a => a._id === updated._id)
        if (idx !== -1) applications.value[idx] = { ...applications.value[idx], ...updated }
        editMode.value = false
        toast.fire({ icon: 'success', title: 'Snapshot Updated' })
    } catch (err) {
        editError.value = err.response?.data?.message || 'Failed to save changes.'
    } finally {
        editSaving.value = false
    }
}
</script>

<template>
    <div class="flex flex-col gap-6 animate-fade-in">

        <!-- ── Header ──────────────────────────────────────────────────── -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div class="space-y-1">
                <h1 class="text-2xl font-black text-[var(--text-main)] tracking-tight">Application Portfolio</h1>
                <p class="text-xs font-medium text-[var(--text-muted)] tracking-wide">Manage your career journey and document submissions.</p>
            </div>
            <div class="flex items-center gap-2">
                <div class="h-10 px-4 rounded-xl bg-white border border-[var(--border-main)] flex items-center gap-3 shadow-sm group">
                    <i class="pi pi-folder-open text-[var(--color-primary)] text-sm group-hover:scale-110 transition-transform"></i>
                    <div class="flex flex-col leading-none">
                        <span class="text-sm font-black text-[var(--text-main)]">{{ filtered.length }}</span>
                        <span class="text-[9px] font-bold text-[var(--text-faint)] uppercase tracking-widest">Submissions</span>
                    </div>
                </div>
                <button @click="fetchApplications"
                    class="w-10 h-10 rounded-xl border border-[var(--border-main)] bg-white text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary-ring)] hover:shadow-lg transition-all"
                    :disabled="loading" title="Sync Records">
                    <i :class="['pi pi-sync text-sm', { 'animate-spin': loading }]"></i>
                </button>
            </div>
        </div>

        <!-- ── Filters ─────────────────────────────────────────────────── -->
        <div class="bg-white/80 backdrop-blur-md border border-[var(--border-main)] rounded-2xl p-4 flex flex-col sm:flex-row gap-4 shadow-sm">
            <div class="relative flex-1 group">
                <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm group-focus-within:text-[var(--color-primary)] transition-colors"></i>
                <input v-model="searchQuery" type="text" placeholder="Search by position title or reference code..."
                    class="w-full h-11 pl-11 pr-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-medium text-[var(--text-main)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:ring-4 focus:ring-[var(--color-primary-ring)]/10 focus:border-[var(--color-primary)] transition-all" />
            </div>
            <div class="relative">
                <select v-model="filterStatus"
                    class="h-11 pl-4 pr-10 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-xs font-black uppercase tracking-widest text-[var(--text-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary-ring)]/10 focus:border-[var(--color-primary)] appearance-none cursor-pointer min-w-[180px] transition-all">
                    <option value="">All Statuses</option>
                    <option v-for="(cfg, key) in statusConfig" :key="key" :value="key">{{ cfg.label }}</option>
                </select>
                <i class="pi pi-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-faint)] pointer-events-none"></i>
            </div>
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
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div v-for="app in filtered" :key="app._id"
                @click="openApp(app)"
                class="bg-white border border-[var(--border-main)] rounded-3xl p-6 flex items-center gap-6 cursor-pointer hover:border-[var(--color-primary)] hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all group relative overflow-hidden">
                
                <!-- Status Bar Accent -->
                <div :class="['absolute left-0 inset-y-0 w-1.5 transition-all group-hover:w-2', statusConfig[app.status]?.class.split(' ')[1].replace('text-', 'bg-') || 'bg-slate-400']"></div>

                <!-- Status Icon Container -->
                <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-all group-hover:rotate-6 group-hover:scale-110', 
                    statusConfig[app.status]?.class || 'bg-[var(--bg-app)] text-[var(--text-sub)] border-[var(--border-main)]']">
                    <i :class="['pi text-xl', statusConfig[app.status]?.icon || 'pi-file']"></i>
                </div>

                <!-- Main Info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1.5">
                        <span class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest bg-[var(--color-primary-light)]/40 px-2 py-0.5 rounded-md">
                            {{ app.applicationCode || 'REF-PENDING' }}
                        </span>
                        <span class="w-1 h-1 rounded-full bg-[var(--border-main)]"></span>
                        <span class="text-[10px] font-bold text-[var(--text-faint)] tabular-nums">{{ formatDate(app.createdAt) }}</span>
                    </div>
                    <h3 class="text-base font-black text-[var(--text-main)] truncate tracking-tight group-hover:text-[var(--color-primary)] transition-colors leading-tight uppercase">
                        {{ app.job?.positionTitle || 'Untitled Position' }}
                    </h3>
                    <div class="flex items-center gap-3 mt-3">
                        <div class="flex items-center gap-1.5">
                            <i class="pi pi-map-marker text-[10px] text-[var(--color-primary)]"></i>
                            <span class="text-[10px] font-bold text-[var(--text-muted)] truncate max-w-[120px] uppercase tracking-tighter">
                                {{ Array.isArray(app.job?.placeOfAssignment) ? app.job.placeOfAssignment[0] : app.job?.placeOfAssignment || 'Not Set' }}
                            </span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <i class="pi pi-shield text-[10px] text-amber-500"></i>
                            <span class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">SG-{{ app.job?.salaryGrade || '?' }}</span>
                        </div>
                    </div>
                </div>

                <!-- Status Badge -->
                <div class="flex flex-col items-end gap-3 shrink-0">
                    <div :class="['text-[9px] font-black px-3 py-1.5 rounded-xl border-2 uppercase tracking-widest shadow-sm', 
                        statusConfig[app.status]?.class || 'bg-[var(--bg-app)] text-[var(--text-sub)] border-[var(--border-main)]']">
                        {{ statusConfig[app.status]?.label || app.status }}
                    </div>
                    <div class="flex items-center -space-x-1.5">
                        <div v-for="i in 3" :key="i" class="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden ring-1 ring-slate-100 shadow-sm">
                           <i class="pi pi-user text-[10px] text-slate-400"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Application Detail Modal ──────────────────────────────────────── -->
        <AppModal v-model="showModal"
            :title="editMode ? 'Edit Snapshot Data' : (selectedApp?.job?.positionTitle || 'Application Summary')"
            :subtitle="editMode ? 'Customize the data profile for this specific application.' : 'Official recruitment progress and document management.'"
            :icon="editMode ? 'pi-pencil' : (statusConfig[selectedApp?.status]?.icon || 'pi-file')"
            :size="editMode ? 'lg' : 'md'"
            @close="closeModal">

            <!-- ── VIEW MODE ────────────────────────────────────────── -->
            <template v-if="!editMode">
                <AppTabs v-model="activeTab" :tabs="modalTabs" variant="underline" class="mb-6">
                    <!-- Tab: Overview -->
                    <template #details>
                        <div class="space-y-8 py-2">
                            <!-- Application Journey (Progress Tracker) -->
                            <div class="p-6 bg-[var(--surface-2)] border border-[var(--border-main)] rounded-[2rem] relative overflow-hidden group">
                                <div class="absolute -right-20 -top-20 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl transition-all duration-1000"></div>
                                
                                <div class="flex items-center justify-between mb-8 relative z-10">
                                    <h4 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.2em]">Application Journey</h4>
                                    <AppBadge v-if="selectedApp" :variant="selectedApp.status" size="xs" dot pulseDot>
                                        {{ statusConfig[selectedApp.status]?.label }}
                                    </AppBadge>
                                </div>

                                <div v-if="selectedApp?.status === 'disqualified'" class="mb-6 p-4 rounded-2xl bg-red-50/50 border border-red-100 flex items-start gap-4">
                                    <i class="pi pi-info-circle text-red-500 mt-0.5"></i>
                                    <div>
                                        <p class="text-xs font-black text-red-700 uppercase tracking-tight">Status: Regretfully Disqualified</p>
                                        <p class="text-[10px] font-bold text-red-600/70 mt-1 leading-relaxed">{{ selectedApp.disqualificationReason || 'You did not meet the minimum qualification standards for this position.' }}</p>
                                    </div>
                                </div>

                                <div v-if="selectedApp" class="relative flex items-center justify-between px-4 py-2">
                                    <!-- Base Track -->
                                    <div class="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-[var(--border-main)] rounded-full z-0 opacity-50"></div>
                                    <!-- Progress Fill -->
                                    <div class="absolute left-10 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 z-0 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                        :style="{ width: `calc(${selectedApp.status === 'applied' ? '0%' : selectedApp.status === 'verifying' ? '33.33%' : (selectedApp.status === 'comparative_assessment' || selectedApp.status === 'ranked') ? '66.66%' : selectedApp.status === 'appointed' ? '100%' : '0%'} - 20px)` }">
                                    </div>

                                    <!-- Steps -->
                                    <div v-for="(step, idx) in [
                                        { id: 'applied', icon: 'pi-send', label: 'Applied' },
                                        { id: 'verifying', icon: 'pi-search', label: 'Verified' },
                                        { id: 'comparative_assessment', icon: 'pi-chart-bar', label: 'Assessed' },
                                        { id: 'appointed', icon: 'pi-check-circle', label: 'Appointed' }
                                    ]" :key="step.id" class="relative z-10 flex flex-col items-center gap-3">
                                        <div :class="['w-11 h-11 rounded-2xl flex items-center justify-center border-4 transition-all duration-700 shadow-md', 
                                            selectedApp.status === step.id || (idx < ['applied', 'verifying', 'comparative_assessment', 'appointed'].indexOf(selectedApp.status))
                                            ? 'bg-[var(--color-primary)] border-[var(--surface)] text-white scale-110 shadow-blue-500/20'
                                            : 'bg-[var(--surface)] border-[var(--bg-app)] text-[var(--text-faint)]']">
                                            <i :class="['pi text-xs', step.icon]"></i>
                                        </div>
                                        <span :class="['text-[9px] font-black uppercase tracking-widest transition-colors',
                                            (selectedApp.status === step.id || idx < ['applied', 'verifying', 'comparative_assessment', 'appointed'].indexOf(selectedApp.status)) ? 'text-[var(--color-primary)]' : 'text-[var(--text-faint)]']">
                                            {{ step.label }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Vacancy Information -->
                            <div v-if="selectedApp?.job" class="space-y-4">
                                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)] flex items-center gap-3">
                                    <span class="shrink-0">Vacancy Information</span>
                                    <div class="h-px bg-[var(--border-main)] flex-1 opacity-50"></div>
                                </p>
                                <div class="grid grid-cols-2 gap-3">
                                    <div v-for="[label, val] in [
                                        ['Assignment', Array.isArray(selectedApp.job.placeOfAssignment) ? selectedApp.job.placeOfAssignment.join(', ') : selectedApp.job.placeOfAssignment],
                                        ['Track', trackLabel[selectedApp.job.hiringTrack] || selectedApp.job.hiringTrack],
                                        ['Salary Grade', `SG-${selectedApp.job.salaryGrade}`],
                                        ['Closing Date', formatDate(selectedApp.job.closingDate)]
                                    ]" :key="label" class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm">
                                        <p class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-1">{{ label }}</p>
                                        <p class="text-sm font-black text-[var(--text-main)] truncate uppercase">{{ val }}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Comparative Assessment (If Evaluated) -->
                            <div v-if="selectedApp && (selectedApp.status === 'ranked' || selectedApp.status === 'comparative_assessment') && selectedApp.hrRating" class="animate-fade-in-up">
                                <div class="p-6 rounded-[2.5rem] bg-slate-900 shadow-2xl relative overflow-hidden group">
                                    <div class="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                    <div class="absolute left-0 bottom-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                                    
                                    <div class="flex items-center justify-between mb-8 relative z-10">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                                                <i class="pi pi-chart-line text-sm"></i>
                                            </div>
                                            <div>
                                                <h4 class="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Comparative Assessment</h4>
                                                <p class="text-[10px] font-bold text-white/50 tracking-wide mt-0.5">Official Score Summary</p>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg">{{ selectedApp.totalScore.toFixed(3) }}</div>
                                            <div class="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1">Total Points</div>
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-2 gap-3 relative z-10">
                                        <div v-for="(val, label) in {
                                            'Education': selectedApp.hrRating.educationPoints,
                                            'Training': selectedApp.hrRating.trainingPoints,
                                            'Experience': selectedApp.hrRating.experiencePoints,
                                            'Performance': selectedApp.hrRating.performancePoints,
                                            'Eligibility': selectedApp.hrRating.eligibilityPoints,
                                            'Potential': selectedApp.hrRating.potentialPoints?.bei
                                        }" :key="label" 
                                            class="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1 transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] cursor-default">
                                            <span class="text-[9px] font-black text-white/40 uppercase tracking-widest">{{ label }}</span>
                                            <span class="text-base font-black text-white tabular-nums">{{ val?.toFixed(3) || '0.000' }}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="mt-6 flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5">
                                        <p class="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] italic">Generated by Digital IES v2.4 Engine</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Data Snapshot Info -->
                            <div v-if="selectedApp" class="space-y-4">
                                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)] flex items-center gap-3">
                                    <span class="shrink-0">Information Snapshot</span>
                                    <div class="h-px bg-[var(--border-main)] flex-1 opacity-50"></div>
                                </p>
                                <div class="grid grid-cols-2 gap-3">
                                    <div v-for="[label, count, icon, color] in [
                                        ['Academic Records', selectedApp.applicantData?.education?.length   || 0, 'pi-graduation-cap', 'text-blue-500 bg-blue-50'],
                                        ['Official Eligibility', selectedApp.applicantData?.eligibility?.length || 0, 'pi-verified', 'text-purple-500 bg-purple-50'],
                                        ['Professional Training', selectedApp.applicantData?.training?.length    || 0, 'pi-star', 'text-amber-500 bg-amber-50'],
                                        ['Relevant Experience', selectedApp.applicantData?.experience?.length  || 0, 'pi-briefcase', 'text-emerald-500 bg-emerald-50'],
                                    ]" :key="label" class="flex items-center gap-4 p-4 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-sm">
                                        <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color]">
                                            <i :class="['pi text-sm', icon]"></i>
                                        </div>
                                        <div class="min-w-0">
                                            <p class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-0.5">{{ label }}</p>
                                            <p class="text-sm font-black text-[var(--text-main)] tabular-nums">{{ count }} Entries</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>

                    <template #documents>
                        <div v-if="selectedApp" class="space-y-6 py-2">
                            <div class="p-6 bg-[var(--color-primary)] rounded-[2rem] text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                                <div class="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                                <div class="flex gap-5 items-start relative z-10">
                                    <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                                        <i class="pi pi-cloud-upload text-xl"></i>
                                    </div>
                                    <div class="space-y-1">
                                        <h4 class="text-sm font-black uppercase tracking-tight">Requirement Checklist</h4>
                                        <p class="text-[11px] font-medium text-blue-100 leading-relaxed">
                                            Submit high-resolution scans of your documents. Once verified by HR, attachments are locked to maintain assessment integrity.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 gap-3">
                                <div v-for="docType in [
                                    { id: 'transcript', label: 'Transcript of Records', icon: 'pi-file-pdf', required: true },
                                    { id: 'eligibility', label: 'Eligibility / Board Rating', icon: 'pi-verified', required: true },
                                    { id: 'service_record', label: 'Service Record / Experience', icon: 'pi-briefcase', required: false },
                                    { id: 'training_cert', label: 'Training Certificates', icon: 'pi-star', required: false },
                                    { id: 'pds_signed', label: 'Signed PDS (Page 4)', icon: 'pi-pencil', required: true },
                                ]" :key="docType.id" 
                                    class="p-5 bg-[var(--surface)] border border-[var(--border-main)] rounded-3xl flex items-center justify-between group hover:border-[var(--color-primary)] transition-all">
                                    <div class="flex items-center gap-5">
                                        <div class="w-12 h-12 rounded-2xl bg-[var(--bg-app)] flex items-center justify-center border border-[var(--border-main)] text-[var(--text-faint)] group-hover:bg-[var(--color-primary-light)] group-hover:text-[var(--color-primary)] transition-colors">
                                            <i :class="['pi text-base', docType.icon]"></i>
                                        </div>
                                        <div>
                                            <div class="flex items-center gap-2">
                                                <p class="text-sm font-black text-[var(--text-main)]">{{ docType.label }}</p>
                                                <span v-if="docType.required" class="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded">Required</span>
                                            </div>
                                            <div class="flex items-center gap-2 mt-1">
                                                <div :class="['w-1.5 h-1.5 rounded-full', selectedApp.attachments?.find(a => a.type === docType.id) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300']"></div>
                                                <p class="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest">
                                                    {{ selectedApp.attachments?.find(a => a.type === docType.id) ? 'Authenticated & Uploaded' : 'Action Required: Missing' }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center gap-2">
                                        <a v-if="selectedApp.attachments?.find(a => a.type === docType.id)" 
                                           :href="selectedApp.attachments.find(a => a.type === docType.id).fileUrl" 
                                           target="_blank"
                                           class="w-10 h-10 rounded-xl bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--text-main)] hover:text-white transition-all">
                                           <i class="pi pi-external-link text-xs"></i>
                                        </a>
                                        <label v-if="!selectedApp.isVerified" class="h-10 px-5 rounded-xl bg-[var(--text-main)] text-white flex items-center justify-center text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-[var(--color-primary)] hover:shadow-lg transition-all active:scale-95">
                                            <input type="file" class="hidden" @change="e => handleFileUpload(e, docType.id)" accept=".pdf,image/*" />
                                            <i :class="['pi mr-2 text-[10px]', selectedApp.attachments?.find(a => a.type === docType.id) ? 'pi-sync' : 'pi-upload']"></i>
                                            {{ selectedApp.attachments?.find(a => a.type === docType.id) ? 'Replace' : 'Upload' }}
                                        </label>
                                        <div v-else-if="selectedApp.attachments?.find(a => a.type === docType.id)" class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center" title="HR Verified">
                                            <i class="pi pi-check-circle text-lg"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </AppTabs>
            </template>

            <!-- ── EDIT MODE ────────────────────────────────────────── -->
            <template v-else>
                <div class="space-y-8 py-2">
                    <div class="p-6 bg-[var(--surface-2)] border border-[var(--border-main)] rounded-[2rem] shadow-sm flex items-start gap-5">
                        <div class="w-12 h-12 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shrink-0 border border-[var(--color-primary-ring)] shadow-sm">
                            <i class="pi pi-history text-lg"></i>
                        </div>
                        <div class="space-y-1">
                            <h4 class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">Point-in-Time Data Sync</h4>
                            <p class="text-[11px] font-medium text-[var(--text-muted)] leading-relaxed">
                                This updates the personal, academic, and professional data snapshot specifically for this application. 
                                It ensures evaluators see your most updated credentials.
                            </p>
                        </div>
                    </div>

                    <!-- Selection Sections -->
                    <div v-for="section in [
                        { id: 'education',  label: 'Academic Records', icon: 'pi-graduation-cap', color: 'text-blue-500',   sel: selEdu,   list: editProfile?.education,   sub: e => e.school,         title: e => e.degree || e.level },
                        { id: 'eligibility', label: 'Official Eligibilities', icon: 'pi-verified',       color: 'text-purple-500', sel: selElig,  list: editProfile?.eligibility, sub: e => `Rating: ${e.rating || 'N/A'}`, title: e => e.name },
                        { id: 'experience',  label: 'Work Experience',      icon: 'pi-briefcase',      color: 'text-emerald-500', sel: selExp,   list: editProfile?.experience,  sub: e => e.company,        title: e => e.position },
                        { id: 'training',    label: 'Training Programs',    icon: 'pi-star',           color: 'text-amber-500',   sel: selTrn,   list: editProfile?.training,    sub: e => e.provider,       title: e => e.title },
                    ]" :key="section.id" class="space-y-4">
                        <div class="flex items-center justify-between px-2">
                            <div class="flex items-center gap-3">
                                <i :class="['pi text-xs', section.icon, section.color]"></i>
                                <h5 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.2em]">{{ section.label }}</h5>
                            </div>
                            <span class="text-[9px] font-black text-[var(--text-faint)] uppercase tabular-nums tracking-widest">{{ section.sel.length }} SELECTED</span>
                        </div>

                        <div v-if="!section.list?.length" class="p-10 text-center bg-[var(--surface)] border border-dashed border-[var(--border-main)] rounded-3xl text-[var(--text-faint)] text-xs font-medium italic">
                            No records found in your profile to snapshot.
                        </div>
                        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label v-for="(item, i) in section.list" :key="i"
                                :class="['group flex items-start gap-4 p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300',
                                    section.sel.includes(i) ? 'border-[var(--color-primary)] bg-[var(--surface)] shadow-xl shadow-blue-500/5 ring-1 ring-[var(--color-primary)]/10' : 'border-[var(--border-main)] bg-[var(--surface)] opacity-60 hover:opacity-100 hover:shadow-lg']">
                                <div class="relative flex items-center justify-center mt-1">
                                    <input type="checkbox" :checked="section.sel.includes(i)" @change="toggle(section.sel, i)" 
                                        class="w-5 h-5 rounded-lg border-2 border-[var(--border-main)] text-[var(--color-primary)] focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer" />
                                </div>
                                <div class="min-w-0">
                                    <p :class="['text-xs font-black uppercase tracking-tight truncate transition-colors', section.sel.includes(i) ? 'text-[var(--color-primary)]' : 'text-[var(--text-main)]']">
                                        {{ section.title(item) }}
                                    </p>
                                    <p class="text-[10px] font-bold text-[var(--text-faint)] mt-1 truncate group-hover:text-[var(--text-muted)]">{{ section.sub(item) }}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Performance Rating -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-3 px-2">
                            <i class="pi pi-chart-line text-xs text-rose-500"></i>
                            <h5 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.2em]">Efficiency Rating</h5>
                        </div>
                        <div class="p-8 bg-[var(--surface)] border border-[var(--border-main)] rounded-[2.5rem] shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div class="space-y-2">
                                <label class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] ml-1">Numeric (1-5)</label>
                                <input v-model="perfRating.score" type="number" step="0.001" min="1" max="5"
                                    class="w-full h-12 px-5 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-2xl text-sm font-black text-[var(--text-main)] focus:border-[var(--color-primary)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none tabular-nums" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] ml-1">Adjectival</label>
                                <input v-model="perfRating.adjective" type="text"
                                    class="w-full h-12 px-5 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-2xl text-sm font-black text-[var(--text-main)] focus:border-[var(--color-primary)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none uppercase" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] ml-1">Period</label>
                                <input v-model="perfRating.periodCovered" type="text"
                                    class="w-full h-12 px-5 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-2xl text-sm font-black text-[var(--text-main)] focus:border-[var(--color-primary)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none uppercase" />
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- ── MODAL FOOTER ──────────────────────────────────────── -->
            <template #footer>
                <template v-if="!editMode">
                    <AppButton variant="secondary" size="lg" @click="closeModal">Exit</AppButton>
                    <div class="flex gap-3">
                        <AppButton variant="outline" size="lg" icon="pi-file-pdf" @click="showCoverPdf = true">Export Cover</AppButton>
                        <AppButton v-if="canEdit" variant="primary" size="lg" icon="pi-pencil" :loading="editLoading" @click="startEdit">Update Snapshot</AppButton>
                        <div v-else-if="selectedApp?.isVerified" class="flex items-center gap-3 px-6 h-12 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)]">
                            <div class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Snapshot Locked</span>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <AppButton variant="secondary" size="lg" @click="editMode = false">Discard Changes</AppButton>
                    <AppButton variant="primary" size="lg" icon="pi-cloud-upload" :loading="editSaving" @click="saveEdit">Finalize Snapshot</AppButton>
                </template>
            </template>
        </AppModal>

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
    width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

/* Tab Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.fade-slide-enter-from {
    opacity: 0;
    transform: translateY(10px);
}
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
.animate-shake { animation: shake 0.4s ease-in-out; }

@keyframes bounce-subtle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
}
.animate-bounce-subtle { animation: bounce-subtle 4s ease-in-out infinite; }
</style>

