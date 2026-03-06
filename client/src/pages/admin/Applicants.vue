<script setup>
import { ref, computed, onMounted } from 'vue'
import apiClient from '@/api/axios'

const jobs = ref([])
const applications = ref([])
const loading = ref(false)
const selectedJobId = ref('')
const searchQuery = ref('')

onMounted(async () => {
    loading.value = true
    try {
        const { data } = await apiClient.get('/v1/jobs')
        jobs.value = data.data || []
    } catch {
        // silent
    } finally {
        loading.value = false
    }
})

const loadApplications = async () => {
    if (!selectedJobId.value) return
    loading.value = true
    try {
        const { data } = await apiClient.get(`/v1/applications/job/${selectedJobId.value}`)
        applications.value = data.data || []
    } catch {
        applications.value = []
    } finally {
        loading.value = false
    }
}

const filtered = computed(() => {
    if (!searchQuery.value) return applications.value
    const q = searchQuery.value.toLowerCase()
    return applications.value.filter(a =>
        a.submittedBy?.username?.toLowerCase().includes(q) ||
        a.submittedBy?.email?.toLowerCase().includes(q)
    )
})

const statusConfig = {
    applied:                { label: 'Applied',         class: 'bg-amber-100 text-amber-700 border-amber-200' },
    verifying:              { label: 'Verifying',       class: 'bg-blue-100 text-blue-700 border-blue-200' },
    comparative_assessment: { label: 'For Assessment',  class: 'bg-purple-100 text-purple-700 border-purple-200' },
    ranked:                 { label: 'Ranked',          class: 'bg-green-100 text-green-700 border-green-200' },
    disqualified:           { label: 'Disqualified',    class: 'bg-red-100 text-red-600 border-red-200' },
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
</script>

<template>
    <div class="flex flex-col gap-6">

        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-[var(--text-main)] tracking-tight">Applicants List</h1>
                <p class="text-sm text-[var(--text-muted)] mt-0.5">View all applicants per job vacancy.</p>
            </div>
        </div>

        <!-- Toolbar -->
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
            <select v-model="selectedJobId" @change="loadApplications"
                class="h-9 px-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none flex-1">
                <option value="">— Select a Job Vacancy —</option>
                <option v-for="job in jobs" :key="job._id" :value="job._id">{{ job.positionTitle }} ({{ job.placeOfAssignment }})</option>
            </select>
            <div class="relative">
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs pointer-events-none"></i>
                <input v-model="searchQuery" type="text" placeholder="Search applicant..."
                    class="w-full sm:w-56 h-9 pl-8 pr-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)]" />
            </div>
        </div>

        <!-- No job selected -->
        <div v-if="!selectedJobId" class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl py-20 flex flex-col items-center gap-3 text-[var(--text-muted)]">
            <i class="pi pi-briefcase text-4xl text-slate-300"></i>
            <p class="text-sm font-medium">Select a job vacancy above to view applicants</p>
        </div>

        <!-- Loading -->
        <div v-else-if="loading" class="flex flex-col gap-3">
            <div v-for="i in 4" :key="i" class="h-16 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] animate-pulse"></div>
        </div>

        <!-- Empty -->
        <div v-else-if="filtered.length === 0" class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl py-20 flex flex-col items-center gap-3 text-[var(--text-muted)]">
            <i class="pi pi-users text-4xl text-slate-300"></i>
            <p class="text-sm font-medium">No applicants found</p>
        </div>

        <!-- Table -->
        <div v-else class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden">
            <div class="px-5 py-3 border-b border-[var(--border-main)] flex items-center justify-between">
                <p class="text-sm font-semibold text-[var(--text-main)]">{{ filtered.length }} applicant{{ filtered.length !== 1 ? 's' : '' }}</p>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-[var(--border-main)] bg-[var(--bg-app)]">
                            <th class="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Applicant</th>
                            <th class="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                            <th class="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Score</th>
                            <th class="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Applied</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[var(--border-main)]">
                        <tr v-for="app in filtered" :key="app._id"
                            class="hover:bg-[var(--bg-app)] transition-colors">
                            <td class="px-5 py-3.5">
                                <div>
                                    <p class="font-semibold text-[var(--text-main)]">{{ app.submittedBy?.username || '—' }}</p>
                                    <p class="text-xs text-[var(--text-muted)]">{{ app.submittedBy?.email }}</p>
                                </div>
                            </td>
                            <td class="px-5 py-3.5">
                                <span :class="['text-[10px] font-bold px-2.5 py-1 rounded-full border', statusConfig[app.status]?.class || 'bg-slate-100 text-slate-600 border-slate-200']">
                                    {{ statusConfig[app.status]?.label || app.status }}
                                </span>
                            </td>
                            <td class="px-5 py-3.5 text-[var(--text-muted)]">{{ app.totalScore ?? '—' }}</td>
                            <td class="px-5 py-3.5 text-[var(--text-muted)] text-xs">{{ formatDate(app.createdAt) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
