<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { StatCard, AppButton, AppCard, AppBadge } from '@/components/ui'
import apiClient from '@/api/axios'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(true)

const metrics = ref({ totalJobs: 0, totalApplications: 0, totalUsers: 0, finalizedRQA: 0 })
const pipeline = ref([])
const topVacancies = ref([])

onMounted(async () => {
    try {
        const { data } = await apiClient.get('/v1/analytics/dashboard')
        metrics.value = data.data.metrics
        pipeline.value = data.data.pipeline
        topVacancies.value = data.data.topVacancies
    } finally {
        loading.value = false
    }
})

const getStatusCount = (status) => {
    return pipeline.value.find(p => p._id === status)?.count || 0
}

const quickActions = [
    { label: 'Create Vacancy', icon: 'pi-plus',        to: '/admin/vacancies',   color: 'blue'   },
    { label: 'Verify Queue',   icon: 'pi-check-circle', to: '/admin/applicants',  color: 'purple' },
    { label: 'Score Board',    icon: 'pi-chart-bar',    to: '/admin/evaluations', color: 'emerald'},
    { label: 'Generate RQA',   icon: 'pi-verified',     to: '/admin/rqa',         color: 'amber'  },
]
</script>

<template>
    <div class="flex flex-col gap-8 animate-fade-in-up">

        <!-- 1. Command Header -->
        <section class="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2 border-b border-[var(--border-main)]">
            <div>
                <h1 class="text-2xl font-black text-[var(--text-main)] tracking-tight leading-none">Command Center</h1>
                <p class="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest mt-3">Recruitment Lifecycle Overview</p>
            </div>
            <div class="flex items-center gap-2">
                <div class="flex -space-x-2 mr-4">
                    <div v-for="i in 3" :key="i"
                        class="w-7 h-7 rounded-lg border-2 border-[var(--surface)] bg-[var(--bg-app)] flex items-center justify-center text-[10px] font-black text-[var(--text-muted)]">
                        {{ String.fromCharCode(64 + i) }}
                    </div>
                    <div class="w-7 h-7 rounded-lg border-2 border-[var(--surface)] bg-[var(--color-primary)] flex items-center justify-center text-[10px] font-black text-white">+</div>
                </div>
                <AppButton variant="secondary" icon="pi-cog" size="sm" />
                <AppButton variant="primary" icon="pi-external-link" size="sm">Open Public Portal</AppButton>
            </div>
        </section>

        <!-- 2. Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Active Postings"   :value="metrics.totalJobs"         icon="briefcase" iconColor="blue"    :loading="loading" />
            <StatCard title="Total Candidates"  :value="metrics.totalApplications"  icon="users"     iconColor="purple"  :loading="loading" trend="8" />
            <StatCard title="Finalized RQA"     :value="metrics.finalizedRQA"       icon="verified"  iconColor="emerald" :loading="loading" />
            <StatCard title="System Users"      :value="metrics.totalUsers"         icon="shield"    iconColor="gold"    :loading="loading" description="Registered accounts" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

            <!-- 3. Pipeline (Span 8) -->
            <div class="lg:col-span-8 flex flex-col gap-6">
                <AppCard class="card-raised overflow-hidden">
                    <template #header>
                        <div class="px-6 py-4 flex justify-between items-center bg-[var(--bg-app)] border-b border-[var(--border-main)]">
                            <h3 class="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">Applicant Flow Funnel</h3>
                            <AppBadge variant="neutral">LIVE</AppBadge>
                        </div>
                    </template>

                    <div class="p-8">
                        <div class="flex items-center gap-2 mb-8">
                            <div v-for="step in ['applied', 'comparative_assessment', 'ranked']" :key="step" class="flex-1 flex flex-col gap-3">
                                <div class="flex justify-between items-end">
                                    <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-tighter">{{ step.replace('_', ' ') }}</span>
                                    <span class="text-lg font-black text-[var(--text-main)] tabular-nums">{{ getStatusCount(step) }}</span>
                                </div>
                                <div class="h-2 rounded-full bg-[var(--bg-app)] overflow-hidden">
                                    <div class="h-full bg-[var(--color-primary)] transition-all duration-1000"
                                         :style="{ width: `${(getStatusCount(step) / (metrics.totalApplications || 1)) * 100}%` }"></div>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-3 mt-10">
                            <p class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">High-Velocity Postings</p>
                            <div v-for="job in topVacancies" :key="job._id"
                                class="flex items-center justify-between p-3 rounded-xl border border-[var(--border-main)] hover:bg-[var(--bg-app)] transition-all group cursor-pointer">
                                <div class="flex items-center gap-4">
                                    <div class="w-9 h-9 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] flex items-center justify-center text-[10px] font-black text-[var(--text-muted)] group-hover:text-[var(--color-primary)] group-hover:border-[var(--color-primary-ring)] transition-all">
                                        {{ job.positionCode.slice(0, 2) }}
                                    </div>
                                    <div>
                                        <p class="text-xs font-black text-[var(--text-main)] tracking-tight">{{ job.positionTitle }}</p>
                                        <p class="text-[10px] text-[var(--text-muted)] font-medium">{{ job.positionCode }}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-6">
                                    <div class="text-right">
                                        <p class="text-[10px] font-black text-[var(--color-primary)] tabular-nums">{{ job.applications?.length || 0 }}</p>
                                        <p class="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Applications</p>
                                    </div>
                                    <i class="pi pi-chevron-right text-[10px] text-[var(--text-faint)] group-hover:translate-x-1 transition-transform"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </AppCard>
            </div>

            <!-- 4. Quick Shortcuts (Span 4) -->
            <div class="lg:col-span-4 flex flex-col gap-6">

                <!-- Quick Actions Grid -->
                <div class="grid grid-cols-2 gap-3">
                    <button v-for="act in quickActions" :key="act.label" @click="router.push(act.to)"
                        class="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-main)] shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[var(--color-primary-ring)] transition-all text-left group">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white mb-4 bg-[var(--color-primary)]">
                            <i :class="['pi text-xs', act.icon]"></i>
                        </div>
                        <p class="text-xs font-black text-[var(--text-main)] leading-tight">{{ act.label }}</p>
                        <p class="text-[9px] text-[var(--text-muted)] font-bold uppercase mt-1">Jump to</p>
                    </button>
                </div>

                <!-- Recent Activity Feed -->
                <AppCard class="card-raised flex-1">
                    <template #header>
                        <div class="px-5 py-3 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-app)]">
                            <h3 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Audit Stream</h3>
                            <button class="text-[9px] font-black text-[var(--color-primary)] uppercase hover:underline">View All</button>
                        </div>
                    </template>
                    <div class="p-2 space-y-1">
                        <div v-for="i in 5" :key="i" class="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--bg-app)] transition-colors cursor-default">
                            <div class="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0"></div>
                            <div>
                                <p class="text-xs font-medium text-[var(--text-sub)] leading-tight">
                                    <span class="font-black text-[var(--text-main)]">Juan D.</span> verified
                                    <span class="font-black text-[var(--text-main)]">Teacher I</span> documents.
                                </p>
                                <p class="text-[9px] text-[var(--text-muted)] font-bold uppercase mt-1">4m ago &bull; Verification Hub</p>
                            </div>
                        </div>
                    </div>
                </AppCard>
            </div>
        </div>
    </div>
</template>
