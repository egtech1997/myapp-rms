<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useJobs } from '@/composables/useJobs'
import apiClient from '@/api/axios'

const router = useRouter()
const authStore = useAuthStore()

const { jobs, loading, error, fetchJobs } = useJobs()
const searchQuery = ref('')
const filterTrack = ref('')
const filterType = ref('')
const selectedJob = ref(null)
const showModal = ref(false)
const applying = ref(false)
const applySuccess = ref(false)
const applyError = ref('')

onMounted(() => fetchJobs({ status: 'published' }))

const handleSearch = () => fetchJobs({ status: 'published', search: searchQuery.value })

const applyToJob = async () => {
    if (!authStore.isAuthenticated) {
        router.push({ path: '/auth/login', query: { redirect: '/vacancies' } })
        return
    }
    applying.value = true
    applyError.value = ''
    try {
        await apiClient.post('/v1/applications/apply', {
            jobId: selectedJob.value._id,
            category: selectedJob.value.hiringTrack,
        })
        applySuccess.value = true
    } catch (err) {
        applyError.value = err.response?.data?.message || 'Failed to submit application.'
    } finally {
        applying.value = false
    }
}

const closeModal = () => {
    showModal.value = false
    applySuccess.value = false
    applyError.value = ''
}

const filteredJobs = computed(() => {
    let list = [...jobs.value]
    if (filterTrack.value) list = list.filter(j => j.hiringTrack === filterTrack.value)
    if (filterType.value) list = list.filter(j => j.employmentType === filterType.value)
    return list
})

const openJob = (job) => {
    selectedJob.value = job
    showModal.value = true
}

const trackLabel = { teaching: 'Teaching', teaching_related: 'Teaching-Related', non_teaching: 'Non-Teaching' }
const trackClass = {
    teaching: 'bg-blue-100 text-blue-700 border-blue-200',
    teaching_related: 'bg-purple-100 text-purple-700 border-purple-200',
    non_teaching: 'bg-orange-100 text-orange-700 border-orange-200',
}
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : null
const isExpired = (d) => d && new Date(d) < new Date()
</script>

<template>
    <div class="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] font-sans px-4 py-10">
        <div class="max-w-5xl mx-auto flex flex-col gap-8">

            <!-- Header -->
            <div class="text-center">
                <h1 class="text-3xl font-bold text-[var(--text-main)] tracking-tight">Job Vacancies</h1>
                <p class="text-[var(--text-muted)] mt-2">Browse available positions at DepEd GNC.</p>
            </div>

            <!-- Search & Filters -->
            <div class="flex flex-col sm:flex-row gap-3">
                <div class="relative flex-1">
                    <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none"></i>
                    <input v-model="searchQuery" @input="handleSearch" type="text" placeholder="Search positions..."
                        class="w-full h-10 pl-9 pr-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm placeholder:text-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-shadow" />
                </div>
                <select v-model="filterTrack"
                    class="h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:outline-none appearance-none cursor-pointer">
                    <option value="">All Tracks</option>
                    <option value="teaching">Teaching</option>
                    <option value="teaching_related">Teaching-Related</option>
                    <option value="non_teaching">Non-Teaching</option>
                </select>
                <select v-model="filterType"
                    class="h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:outline-none appearance-none cursor-pointer">
                    <option value="">All Types</option>
                    <option value="permanent">Permanent</option>
                    <option value="contractual">Contractual</option>
                    <option value="job order">Job Order</option>
                    <option value="casual">Casual</option>
                </select>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div v-for="i in 4" :key="i" class="h-40 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] animate-pulse"></div>
            </div>

            <!-- Error -->
            <div v-else-if="error" class="text-center py-16 text-[var(--text-muted)]">
                <i class="pi pi-exclamation-circle text-4xl text-slate-300 mb-3 block"></i>
                <p class="text-sm">{{ error }}</p>
            </div>

            <!-- Empty -->
            <div v-else-if="filteredJobs.length === 0" class="text-center py-16 text-[var(--text-muted)]">
                <i class="pi pi-briefcase text-4xl text-slate-300 mb-3 block"></i>
                <p class="text-sm font-medium">No vacancies found</p>
                <p class="text-xs mt-1">Check back later for new openings.</p>
            </div>

            <!-- Job Cards -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button v-for="job in filteredJobs" :key="job._id"
                    @click="openJob(job)"
                    class="text-left bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group">

                    <div class="flex items-start justify-between gap-3 mb-3">
                        <div>
                            <p class="font-bold text-[var(--text-main)] leading-tight group-hover:text-[var(--color-primary)] transition-colors">{{ job.positionTitle }}</p>
                            <p class="text-xs text-[var(--text-muted)] mt-1">{{ job.positionCode }} · {{ job.placeOfAssignment }}</p>
                        </div>
                        <span :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0', trackClass[job.hiringTrack] || 'bg-gray-100 text-gray-600 border-gray-200']">
                            {{ trackLabel[job.hiringTrack] || job.hiringTrack }}
                        </span>
                    </div>

                    <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                        <span class="flex items-center gap-1"><i class="pi pi-chart-bar text-[10px]"></i> SG-{{ job.salaryGrade }}</span>
                        <span class="flex items-center gap-1"><i class="pi pi-money-bill text-[10px]"></i> ₱{{ Number(job.salary).toLocaleString() }}/mo</span>
                        <span class="flex items-center gap-1 capitalize"><i class="pi pi-briefcase text-[10px]"></i> {{ job.employmentType }}</span>
                        <span class="flex items-center gap-1"><i class="pi pi-users text-[10px]"></i> {{ job.noOfVacancy }} slot{{ job.noOfVacancy !== 1 ? 's' : '' }}</span>
                    </div>

                    <div v-if="job.deadline" class="mt-3 pt-3 border-t border-[var(--border-main)]">
                        <p :class="['text-xs flex items-center gap-1', isExpired(job.deadline) ? 'text-red-500 font-medium' : 'text-[var(--text-muted)]']">
                            <i class="pi pi-calendar text-[10px]"></i>
                            {{ isExpired(job.deadline) ? 'Deadline passed: ' : 'Apply by: ' }}{{ formatDate(job.deadline) }}
                        </p>
                    </div>
                </button>
            </div>

            <!-- Results count -->
            <p v-if="!loading && filteredJobs.length > 0" class="text-center text-xs text-[var(--text-muted)]">
                Showing {{ filteredJobs.length }} open position{{ filteredJobs.length !== 1 ? 's' : '' }}
            </p>
        </div>

        <!-- Job Detail Modal -->
        <Teleport to="body">
        <div v-if="showModal && selectedJob"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
            @click.self="closeModal">

            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-zoom-in max-h-[90vh]">

                <!-- Header -->
                <div class="px-6 py-5 border-b border-[var(--border-main)] flex items-start justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full border', trackClass[selectedJob.hiringTrack] || 'bg-gray-100 text-gray-600 border-gray-200']">
                                {{ trackLabel[selectedJob.hiringTrack] }}
                            </span>
                            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-green-100 text-green-700 border-green-200 capitalize">{{ selectedJob.employmentType }}</span>
                        </div>
                        <h2 class="text-lg font-bold text-[var(--text-main)]">{{ selectedJob.positionTitle }}</h2>
                        <p class="text-sm text-[var(--text-muted)] mt-0.5">{{ selectedJob.positionCode }} · {{ selectedJob.placeOfAssignment }}</p>
                    </div>
                    <button @click="closeModal" class="text-[var(--text-muted)] hover:text-[var(--text-main)] flex-shrink-0 mt-1">
                        <i class="pi pi-times text-lg"></i>
                    </button>
                </div>

                <!-- Body -->
                <div class="overflow-y-auto custom-scrollbar flex-1 p-6 flex flex-col gap-6">

                    <!-- Salary -->
                    <div class="grid grid-cols-3 gap-3">
                        <div class="bg-[var(--bg-app)] rounded-xl p-3 border border-[var(--border-main)] text-center">
                            <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Salary Grade</p>
                            <p class="text-lg font-bold text-[var(--text-main)]">SG-{{ selectedJob.salaryGrade }}</p>
                        </div>
                        <div class="bg-[var(--bg-app)] rounded-xl p-3 border border-[var(--border-main)] text-center">
                            <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Monthly</p>
                            <p class="text-lg font-bold text-[var(--text-main)]">₱{{ Number(selectedJob.salary).toLocaleString() }}</p>
                        </div>
                        <div class="bg-[var(--bg-app)] rounded-xl p-3 border border-[var(--border-main)] text-center">
                            <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Slots</p>
                            <p class="text-lg font-bold text-[var(--text-main)]">{{ selectedJob.noOfVacancy }}</p>
                        </div>
                    </div>

                    <!-- Description -->
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Description</p>
                        <p class="text-sm text-[var(--text-main)] leading-relaxed">{{ selectedJob.description }}</p>
                    </div>

                    <!-- Qualification Standards -->
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Qualification Standards</p>
                        <div class="flex flex-col divide-y divide-[var(--border-main)] border border-[var(--border-main)] rounded-xl overflow-hidden">
                            <div v-for="(val, key) in selectedJob.qualifications" :key="key"
                                class="flex gap-4 px-4 py-3 bg-[var(--bg-app)]">
                                <span class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] w-24 flex-shrink-0 pt-0.5 capitalize">{{ key }}</span>
                                <span class="text-sm text-[var(--text-main)]">{{ val }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Deadline -->
                    <div v-if="selectedJob.deadline"
                        :class="['flex items-center gap-3 p-4 rounded-xl border', isExpired(selectedJob.deadline) ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700']">
                        <i class="pi pi-calendar text-lg flex-shrink-0"></i>
                        <div>
                            <p class="text-xs font-semibold">{{ isExpired(selectedJob.deadline) ? 'Application Period Closed' : 'Application Deadline' }}</p>
                            <p class="text-sm font-bold">{{ formatDate(selectedJob.deadline) }}</p>
                        </div>
                    </div>
                </div>

                <!-- Apply error -->
                <div v-if="applyError" class="mx-6 mb-2 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <i class="pi pi-exclamation-circle flex-shrink-0"></i>{{ applyError }}
                </div>

                <!-- Apply success -->
                <div v-if="applySuccess" class="mx-6 mb-2 flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                    <i class="pi pi-check-circle flex-shrink-0"></i>Application submitted! Track it in <router-link to="/user/applications" class="underline font-semibold ml-1">My Applications</router-link>.
                </div>

                <!-- Footer -->
                <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-between items-center">
                    <button @click="closeModal" class="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                        Close
                    </button>
                    <button v-if="!applySuccess"
                        @click="applyToJob"
                        :disabled="applying"
                        class="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
                        <i :class="['pi text-xs', applying ? 'pi-spin pi-spinner' : 'pi-send']"></i>
                        {{ applying ? 'Submitting...' : 'Apply Now' }}
                    </button>
                    <router-link v-else to="/user/applications"
                        class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                        <i class="pi pi-folder-open text-xs"></i> View Applications
                    </router-link>
                </div>
            </div>
        </div>
        </Teleport>
    </div>
</template>

