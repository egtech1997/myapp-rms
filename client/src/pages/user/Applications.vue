<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/api/axios'

const router = useRouter()

const applications = ref([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const filterStatus = ref('')
const selectedApp = ref(null)
const showModal = ref(false)

onMounted(fetchApplications)
onActivated(fetchApplications)

async function fetchApplications() {
    loading.value = true
    error.value = ''
    try {
        const { data } = await apiClient.get('/v1/applications/my-applications')
        applications.value = data.data || []
    } catch (err) {
        error.value = err.response?.data?.message || 'Failed to load applications.'
    } finally {
        loading.value = false
    }
}

const filtered = computed(() => {
    let list = [...applications.value]
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        list = list.filter(a => a.job?.positionTitle?.toLowerCase().includes(q))
    }
    if (filterStatus.value) {
        list = list.filter(a => a.status === filterStatus.value)
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const statusConfig = {
    applied:               { label: 'Applied',              class: 'bg-amber-100 text-amber-700 border-amber-200',   icon: 'pi-clock' },
    verifying:             { label: 'Under Verification',   class: 'bg-blue-100 text-blue-700 border-blue-200',      icon: 'pi-search' },
    comparative_assessment:{ label: 'For Assessment',       class: 'bg-purple-100 text-purple-700 border-purple-200', icon: 'pi-chart-bar' },
    ranked:                { label: 'Ranked',               class: 'bg-green-100 text-green-700 border-green-200',   icon: 'pi-check-circle' },
    disqualified:          { label: 'Disqualified',         class: 'bg-red-100 text-red-600 border-red-200',         icon: 'pi-times-circle' },
}

const trackLabel = {
    teaching: 'Teaching',
    teaching_related: 'Teaching-Related',
    non_teaching: 'Non-Teaching',
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const openApp = (app) => {
    selectedApp.value = app
    showModal.value = true
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
            <i class="pi pi-folder-open text-4xl text-slate-300"></i>
            <div class="text-center">
                <p class="text-sm font-medium">No applications found</p>
                <p class="text-xs mt-1">{{ searchQuery || filterStatus ? 'Try adjusting your filters.' : 'You haven\'t applied to any positions yet.' }}</p>
            </div>
            <router-link v-if="!searchQuery && !filterStatus" to="/vacancies"
                class="h-9 px-5 rounded-lg bg-[var(--text-main)] text-[var(--surface)] text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                <i class="pi pi-briefcase text-xs"></i> Browse Vacancies
            </router-link>
        </div>

        <!-- ── Application Cards ───────────────────────────────────────── -->
        <div v-else class="flex flex-col gap-3">
            <div v-for="app in filtered" :key="app._id"
                @click="openApp(app)"
                class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group">

                <!-- Status Icon -->
                <div :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border', statusConfig[app.status]?.class || 'bg-slate-100 text-slate-600 border-slate-200']">
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
                    <span :class="['text-[10px] font-bold px-2.5 py-1 rounded-full border', statusConfig[app.status]?.class || 'bg-slate-100 text-slate-600 border-slate-200']">
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
            @click.self="showModal = false">

            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-zoom-in max-h-[88vh]">

                <!-- Header -->
                <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-start justify-between gap-4">
                    <div>
                        <h3 class="text-base font-bold text-[var(--text-main)]">{{ selectedApp.job?.positionTitle || 'Application Details' }}</h3>
                        <p class="text-xs text-[var(--text-muted)] mt-0.5">Application #{{ selectedApp._id?.slice(-8).toUpperCase() }}</p>
                    </div>
                    <button @click="showModal = false" class="text-[var(--text-muted)] hover:text-[var(--text-main)] flex-shrink-0">
                        <i class="pi pi-times text-lg"></i>
                    </button>
                </div>

                <!-- Body -->
                <div class="overflow-y-auto flex-1 p-6 flex flex-col gap-5 custom-scrollbar">

                    <!-- Status -->
                    <div :class="['flex items-center gap-3 p-4 rounded-xl border', statusConfig[selectedApp.status]?.class || 'bg-slate-100 border-slate-200']">
                        <i :class="['pi text-xl', statusConfig[selectedApp.status]?.icon || 'pi-file']"></i>
                        <div>
                            <p class="text-xs font-semibold uppercase tracking-wider opacity-70">Application Status</p>
                            <p class="text-base font-bold">{{ statusConfig[selectedApp.status]?.label || selectedApp.status }}</p>
                        </div>
                    </div>

                    <!-- Job Details -->
                    <div v-if="selectedApp.job">
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Position Details</p>
                        <div class="grid grid-cols-2 gap-3">
                            <div v-for="[label, val] in [
                                ['Position', selectedApp.job.positionTitle],
                                ['Position Code', selectedApp.job.positionCode],
                                ['Assignment', selectedApp.job.placeOfAssignment],
                                ['Track', trackLabel[selectedApp.job.hiringTrack] || selectedApp.job.hiringTrack],
                                ['Salary Grade', `SG-${selectedApp.job.salaryGrade}`],
                                ['Monthly Salary', `₱${Number(selectedApp.job.salary).toLocaleString()}`],
                            ]" :key="label"
                                class="bg-[var(--bg-app)] rounded-xl p-3 border border-[var(--border-main)]">
                                <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">{{ label }}</p>
                                <p class="text-sm font-medium text-[var(--text-main)] truncate">{{ val }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Timeline -->
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Timeline</p>
                        <div class="flex flex-col divide-y divide-[var(--border-main)] border border-[var(--border-main)] rounded-xl overflow-hidden">
                            <div class="flex justify-between px-4 py-3 bg-[var(--bg-app)]">
                                <span class="text-xs text-[var(--text-muted)]">Date Applied</span>
                                <span class="text-xs font-semibold text-[var(--text-main)]">{{ formatDate(selectedApp.createdAt) }}</span>
                            </div>
                            <div class="flex justify-between px-4 py-3 bg-[var(--bg-app)]">
                                <span class="text-xs text-[var(--text-muted)]">Last Updated</span>
                                <span class="text-xs font-semibold text-[var(--text-main)]">{{ formatDate(selectedApp.updatedAt) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)]">
                    <button @click="showModal = false"
                        class="w-full h-10 rounded-lg border border-[var(--border-main)] text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--surface)] transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
        </Teleport>
    </div>
</template>

