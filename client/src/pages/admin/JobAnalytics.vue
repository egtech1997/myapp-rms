<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/api/axios'
import { StatCard, AppCard, EmptyState, AppBadge, AppSpinner, AppBreadcrumb } from '@/components/ui'
import { statusConfig } from '@/utils/statusColors'
import { useRecruitmentStore } from '@/stores/recruitment'
import { storeToRefs } from 'pinia'

const router = useRouter()
const recruitmentStore = useRecruitmentStore()
const { selectedJobId } = storeToRefs(recruitmentStore)

// ── BREADCRUMBS ───────────────────────────────────────────────────────────
const breadcrumbs = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Job Analytics', active: true },
]
const loading = ref(false)
const jobsLoading = ref(true)
const jobs = ref([])
const analytics = ref(null)

// ── FETCH JOBS ───────────────────────────────────────────────────────────
const fetchJobs = async () => {
    try {
        const { data } = await apiClient.get('/v1/jobs')
        jobs.value = data.data || []
        if (selectedJobId.value) {
            fetchJobAnalytics(selectedJobId.value)
        }
    } finally {
        jobsLoading.value = false
    }
}

// ── FETCH ANALYTICS ──────────────────────────────────────────────────────
const fetchJobAnalytics = async (id) => {
    if (!id) {
        analytics.value = null
        return
    }
    loading.value = true
    try {
        const { data } = await apiClient.get(`/v1/analytics/job/${id}`)
        analytics.value = data.data
    } finally {
        loading.value = false
    }
}

watch(selectedJobId, (newId) => fetchJobAnalytics(newId))

onMounted(fetchJobs)

// ── HELPERS ──────────────────────────────────────────────────────────────
const getJobDetails = computed(() => jobs.value.find(j => j._id === selectedJobId.value))

const distributionData = computed(() => {
    if (!analytics.value?.distribution) return []
    // Map deciles to labels
    const labels = {
        0: '0-50', 50: '50-60', 60: '60-70', 70: '70-80', 80: '80-90', 90: '90-100'
    }
    return analytics.value.distribution.map(d => ({
        label: labels[d._id] || d._id,
        count: d.count
    }))
})

const maxCount = computed(() => Math.max(...distributionData.value.map(d => d.count), 1))

const criteriaBreakdown = computed(() => {
    if (!analytics.value?.summary) return []
    const s = analytics.value.summary
    return [
        { label: 'Education', value: s.avgEducation, max: 10 },
        { label: 'Experience', value: s.avgExperience, max: 10 },
        { label: 'Training', value: s.avgTraining, max: 10 },
        { label: 'Performance', value: s.avgPerformance, max: 20 },
        { label: 'Potential (BEI)', value: s.avgBEI, max: 20 },
        { label: 'Written/Sample', value: s.avgWritten + s.avgWorkSample, max: 30 },
    ]
})

const fieldClasses = "h-11 px-4 text-sm bg-[var(--surface)] border border-[var(--border-main)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] text-[var(--text-main)] transition-all";
</script>

<template>
    <div class="flex flex-col gap-6 animate-fade-in-up p-2">
        <AppBreadcrumb :items="breadcrumbs" class="mb-2" />
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 class="text-xl font-black text-[var(--text-main)] tracking-tight">Job Deep-Dive Analytics</h1>
                <p class="text-xs text-[var(--text-muted)] font-medium">Detailed performance metrics per vacancy.</p>
            </div>
            <div class="flex gap-2 w-full sm:w-auto">
                <select :value="selectedJobId" @change="e => recruitmentStore.setSelectedJobId(e.target.value)" :class="[fieldClasses, 'flex-1 sm:w-80 shadow-sm']" :disabled="jobsLoading">
                    <option value="">— Select Vacancy to Analyze —</option>
                    <option v-for="job in jobs" :key="job._id" :value="job._id">
                        {{ job.positionTitle }} ({{ job.positionCode }})
                    </option>
                </select>
            </div>
        </div>

        <template v-if="!selectedJobId">
            <EmptyState 
                icon="chart-bar" 
                title="No vacancy selected" 
                description="Choose a job vacancy from the dropdown above to view its detailed scoring analytics and distribution."
                compact
                class="py-32"
            />
        </template>

        <template v-else-if="loading">
            <div class="flex flex-col items-center justify-center py-32 gap-4">
                <AppSpinner size="lg" />
                <p class="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Aggregating Data...</p>
            </div>
        </template>

        <template v-else-if="analytics && analytics.summary">
            <!-- Job Quick Info -->
            <div class="rounded-2xl p-6 text-white flex flex-col sm:flex-row justify-between items-center gap-4" style="background: var(--color-primary); box-shadow: var(--shadow-primary)">
                <div>
                    <p class="text-[10px] font-bold uppercase tracking-widest opacity-70">Active Analysis</p>
                    <h2 class="text-2xl font-black mt-1">{{ getJobDetails?.positionTitle }}</h2>
                    <div class="flex gap-2 mt-2">
                        <span class="bg-white/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{{ getJobDetails?.hiringTrack }}</span>
                        <span class="bg-white/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{{ getJobDetails?.placeOfAssignment }}</span>
                    </div>
                </div>
                <div class="text-center sm:text-right">
                    <p class="text-4xl font-black tabular-nums">{{ analytics.summary.count }}</p>
                    <p class="text-[10px] font-bold uppercase opacity-70">Qualified Applicants</p>
                </div>
            </div>

            <!-- Key Metric Cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Mean Total Score" :value="analytics.summary.avgTotal.toFixed(2)" icon="percentage" iconColor="blue" />
                <StatCard title="Avg Education" :value="analytics.summary.avgEducation.toFixed(2)" icon="graduation-cap" iconColor="purple" />
                <StatCard title="Avg Potential" :value="analytics.summary.avgBEI.toFixed(2)" icon="bolt" iconColor="amber" />
                <StatCard title="Score Ties" :value="analytics.ties.length" icon="copy" iconColor="red" description="Requires manual break" />
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <!-- Score Distribution (CSS Bar Chart) -->
                <AppCard header="Score Distribution" subheader="Frequency of total scores by decile">
                    <div class="flex items-end justify-between h-48 gap-2 pt-4 px-4">
                        <div v-for="d in distributionData" :key="d.label" class="flex-1 flex flex-col items-center group relative">
                            <!-- Tooltip on hover -->
                            <div class="absolute -top-8 bg-[var(--text-main)] text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {{ d.count }} applicants
                            </div>
                            <!-- Bar -->
                            <div 
                                class="w-full bg-[var(--color-primary-light)] group-hover:bg-[var(--color-primary)] rounded-t-lg transition-all duration-500 relative"
                                :style="{ height: `${(d.count / maxCount) * 100}%` }"
                            >
                                <div v-if="d.count > 0" class="absolute inset-x-0 bottom-full mb-1 text-[10px] font-black text-[var(--color-primary)] text-center">
                                    {{ d.count }}
                                </div>
                            </div>
                            <!-- Label -->
                            <span class="text-[9px] font-bold text-[var(--text-muted)] mt-2 rotate-45 sm:rotate-0">{{ d.label }}</span>
                        </div>
                    </div>
                    <p class="text-[10px] text-center text-[var(--text-muted)] mt-8 italic">Scores grouped by total points awarded</p>
                </AppCard>

                <!-- Criteria Balance -->
                <AppCard header="Criteria Performance" subheader="Average points awarded per section">
                    <div class="space-y-4">
                        <div v-for="item in criteriaBreakdown" :key="item.label" class="space-y-1.5">
                            <div class="flex justify-between items-center text-[10px] font-bold uppercase">
                                <span class="text-[var(--text-sub)]">{{ item.label }}</span>
                                <span class="text-[var(--color-primary)]">{{ item.value.toFixed(2) }} / {{ item.max }}</span>
                            </div>
                            <div class="h-2 bg-[var(--bg-app)] rounded-full overflow-hidden">
                                <div
                                    class="h-full bg-[var(--color-primary)] rounded-full transition-all duration-1000"
                                    :style="{ width: `${(item.value / item.max) * 100}%` }"
                                ></div>
                            </div>
                        </div>
                    </div>
                </AppCard>

                <!-- Tie Analysis -->
                <div class="lg:col-span-2">
                    <AppCard header="Tie Analysis Desk" subheader="Identified applicants with identical total scores">
                        <div v-if="analytics.ties.length === 0" class="py-12 flex flex-col items-center opacity-40">
                            <i class="pi pi-check-circle text-3xl mb-2"></i>
                            <p class="text-xs font-bold uppercase tracking-widest">No persistent ties found</p>
                        </div>
                        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div v-for="tie in analytics.ties" :key="tie._id" class="p-4 border border-red-100 bg-red-50/30 rounded-2xl">
                                <div class="flex justify-between items-start mb-3">
                                    <span class="text-xs font-black text-red-600 tabular-nums">{{ tie._id.toFixed(2) }} pts</span>
                                    <AppBadge :label="`${tie.count} Applicants`" color="red" />
                                </div>
                                <p class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Involved:</p>
                                <div class="flex flex-wrap gap-1">
                                    <span v-for="name in tie.applicants" :key="name" class="text-[10px] font-black text-[var(--text-sub)] bg-[var(--surface)] px-2 py-1 rounded border border-[var(--border-main)]">
                                        {{ name }}
                                    </span>
                                </div>
                                <button @click="router.push('/admin/rqa')" class="mt-4 w-full h-8 bg-[var(--surface)] border border-red-200 text-red-600 text-[9px] font-bold uppercase rounded-lg hover:bg-red-50 transition-all">
                                    Review in RQA Table
                                </button>
                            </div>
                        </div>
                    </AppCard>
                </div>

            </div>
        </template>

        <template v-else>
            <EmptyState 
                icon="exclamation-circle" 
                title="Insufficient Data" 
                description="This vacancy does not have enough qualified and evaluated applicants to generate deep-dive analytics."
                compact
                class="py-32"
            />
        </template>

    </div>
</template>
