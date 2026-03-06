<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'

const authStore = useAuthStore()
const loading = ref(false)

const stats = ref({ totalJobs: 0, publishedJobs: 0, totalUsers: 0, totalApplications: 0 })
const recentJobs = ref([])

onMounted(async () => {
    loading.value = true
    try {
        const [jobsRes, usersRes] = await Promise.allSettled([
            apiClient.get('/v1/jobs'),
            apiClient.get('/v1/users'),
        ])

        if (jobsRes.status === 'fulfilled') {
            const jobs = jobsRes.value.data.data || []
            stats.value.totalJobs = jobs.length
            stats.value.totalApplications = jobs.reduce((s, j) => s + (j.applications?.length || 0), 0)
            stats.value.publishedJobs = jobs.filter(j => j.status === 'published').length
            recentJobs.value = [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
        }
        if (usersRes.status === 'fulfilled') {
            stats.value.totalUsers = (usersRes.value.data.data || []).length
        }
    } finally {
        loading.value = false
    }
})

const statCards = [
    { key: 'totalJobs',        label: 'Total Vacancies',    icon: 'pi-briefcase',   color: 'bg-blue-50 border-blue-200 text-blue-600' },
    { key: 'publishedJobs',    label: 'Published',          icon: 'pi-check-circle', color: 'bg-green-50 border-green-200 text-green-600' },
    { key: 'totalApplications',label: 'Applications',       icon: 'pi-folder-open', color: 'bg-purple-50 border-purple-200 text-purple-600' },
    { key: 'totalUsers',       label: 'Registered Users',   icon: 'pi-users',       color: 'bg-amber-50 border-amber-200 text-amber-600' },
]

const statusBadge = {
    published: 'bg-green-100 text-green-700 border-green-200',
    draft:     'bg-slate-100 text-slate-600 border-slate-200',
    closed:    'bg-red-100 text-red-600 border-red-200',
    archived:  'bg-orange-100 text-orange-600 border-orange-200',
}

const trackBadge = {
    teaching:         'bg-blue-100 text-blue-700',
    teaching_related: 'bg-purple-100 text-purple-700',
    non_teaching:     'bg-orange-100 text-orange-700',
}

const trackLabel = { teaching: 'Teaching', teaching_related: 'Teaching-Related', non_teaching: 'Non-Teaching' }

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const quickLinks = [
    { label: 'Manage Vacancies', icon: 'pi-briefcase',    to: '/admin/vacancies',  color: 'bg-blue-50 border-blue-200 text-blue-600' },
    { label: 'User Accounts',    icon: 'pi-users',         to: '/admin/user-list',  color: 'bg-green-50 border-green-200 text-green-600' },
    { label: 'Applicants List',  icon: 'pi-folder-open',  to: '/admin/applicants', color: 'bg-purple-50 border-purple-200 text-purple-600' },
    { label: 'Audit Logs',       icon: 'pi-history',       to: '/admin/audit-logs', color: 'bg-amber-50 border-amber-200 text-amber-600' },
]
</script>

<template>
    <div class="flex flex-col gap-6">

        <!-- Welcome -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <p class="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Administration</p>
                <h1 class="text-2xl font-bold text-[var(--text-main)] tracking-tight mt-0.5">
                    Welcome, <span class="capitalize">{{ authStore.user?.username }}</span>
                </h1>
            </div>
            <div class="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border-main)] px-4 py-2.5 rounded-xl">
                <i class="pi pi-calendar text-[11px]"></i>
                {{ new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
            </div>
        </div>

        <!-- Stat Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="card in statCards" :key="card.key"
                class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex items-start gap-4">
                <div :class="['w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0', card.color]">
                    <i :class="['pi text-sm', card.icon]"></i>
                </div>
                <div>
                    <p class="text-2xl font-bold text-[var(--text-main)]">
                        <span v-if="loading" class="inline-block w-8 h-6 bg-[var(--border-main)] rounded animate-pulse"></span>
                        <span v-else>{{ stats[card.key] }}</span>
                    </p>
                    <p class="text-xs font-medium text-[var(--text-muted)] mt-0.5">{{ card.label }}</p>
                </div>
            </div>
        </div>

        <!-- Main grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- Recent Vacancies -->
            <div class="lg:col-span-2 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden">
                <div class="px-5 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
                    <h2 class="text-sm font-bold text-[var(--text-main)]">Recent Vacancies</h2>
                    <router-link to="/admin/vacancies"
                        class="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 transition-colors">
                        View all <i class="pi pi-arrow-right text-[9px]"></i>
                    </router-link>
                </div>

                <div v-if="loading" class="p-5 flex flex-col gap-3">
                    <div v-for="i in 4" :key="i" class="h-12 rounded-lg bg-[var(--bg-app)] animate-pulse"></div>
                </div>

                <div v-else-if="recentJobs.length === 0" class="py-16 flex flex-col items-center gap-3 text-[var(--text-muted)]">
                    <i class="pi pi-briefcase text-3xl text-slate-300"></i>
                    <p class="text-sm">No vacancies yet</p>
                    <router-link to="/admin/vacancies"
                        class="text-xs font-semibold text-[var(--color-primary)] hover:underline">Create one</router-link>
                </div>

                <div v-else class="divide-y divide-[var(--border-main)]">
                    <div v-for="job in recentJobs" :key="job._id"
                        class="px-5 py-3.5 flex items-center gap-4 hover:bg-[var(--bg-app)] transition-colors">
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold text-[var(--text-main)] truncate">{{ job.positionTitle }}</p>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span :class="['text-[10px] font-semibold px-1.5 py-0.5 rounded', trackBadge[job.hiringTrack] || 'bg-slate-100 text-slate-600']">
                                    {{ trackLabel[job.hiringTrack] || job.hiringTrack }}
                                </span>
                                <span class="text-[10px] text-[var(--text-muted)]">{{ job.placeOfAssignment }}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 flex-shrink-0">
                            <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize', statusBadge[job.status] || 'bg-slate-100 text-slate-600 border-slate-200']">
                                {{ job.status }}
                            </span>
                            <span class="text-[10px] text-[var(--text-muted)] hidden sm:block">{{ formatDate(job.createdAt) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Links -->
            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden">
                <div class="px-5 py-4 border-b border-[var(--border-main)]">
                    <h2 class="text-sm font-bold text-[var(--text-main)]">Quick Access</h2>
                </div>
                <div class="p-3 flex flex-col gap-2">
                    <router-link v-for="link in quickLinks" :key="link.to" :to="link.to"
                        class="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-app)] border border-transparent hover:border-[var(--border-main)] transition-all group">
                        <div :class="['w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0', link.color]">
                            <i :class="['pi text-sm', link.icon]"></i>
                        </div>
                        <span class="text-sm font-medium text-[var(--text-main)]">{{ link.label }}</span>
                        <i class="pi pi-arrow-right text-[10px] text-[var(--text-muted)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>
