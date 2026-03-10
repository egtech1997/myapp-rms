<script setup>
import { ref, reactive, computed, onMounted, inject, watch, nextTick } from 'vue'
import apiClient from '@/api/axios'
import { AppBadge, AppButton, AppTableReport, AppPageHeader, AppModal } from '@/components/ui'
import { statusConfig } from '@/utils/statusColors'
import { useRecruitmentStore } from '@/stores/recruitment'
import { storeToRefs } from 'pinia'

import DigitalIES from '@/components/admin/DigitalIES.vue'

const toast = inject('$toast')
const swal = inject('$swal')
const recruitmentStore = useRecruitmentStore()
const { selectedJobId } = storeToRefs(recruitmentStore)

// ── DATA ─────────────────────────────────────────────────────────────────────
const jobs = ref([])
const applications = ref([])
const loading = ref(false)
const searchQuery = ref('')

// ── PICKER STATE ─────────────────────────────────────────────────────────────
const showJobPicker = ref(false)
const jobPickerSearch = ref('')

// ── IES MODAL STATE ──────────────────────────────────────────────────────────
const showIESModal = ref(false)
const iesData = ref(null)

// ── COMPUTED ──────────────────────────────────────────────────────────────────
const stats = computed(() => ({
  total: applications.value.length,
  evaluated: applications.value.filter(a => a.status === 'evaluated').length,
  pending: applications.value.filter(a => a.status !== 'evaluated').length,
}))

const filtered = computed(() => {
  let list = applications.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a => fullName(a).toLowerCase().includes(q) || (a.applicationCode || '').toLowerCase().includes(q))
  }
  return list
})

const selectedJob = computed(() => jobs.value.find(j => j._id === selectedJobId.value) || null)

const filteredJobs = computed(() => {
  if (!jobPickerSearch.value) return jobs.value
  const q = jobPickerSearch.value.toLowerCase()
  return jobs.value.filter(j =>
    j.positionTitle.toLowerCase().includes(q) ||
    (j.positionCode || '').toLowerCase().includes(q)
  )
})

// ── METHODS ───────────────────────────────────────────────────────────────────
const fetchJobs = async () => {
  const { data } = await apiClient.get('/v1/jobs')
  jobs.value = data.data
  if (selectedJobId.value) {
    loadApplications()
  }
}

const selectJob = (jobId) => {
  recruitmentStore.setSelectedJobId(jobId)
  showJobPicker.value = false
  loadApplications()
}

const loadApplications = async () => {
  if (!selectedJobId.value) {
    applications.value = []
    return
  }
  loading.value = true
  try {
    // We only want QUALIFIED applicants for evaluation
    const { data } = await apiClient.get(`/v1/applications/job/${selectedJobId.value}`)
    applications.value = data.data.filter(a => a.isQualified)
  } finally {
    loading.value = false
  }
}

watch(selectedJobId, loadApplications)

const openIES = (app) => {
  iesData.value = {
    applicationId: app._id,
    candidateName: fullName(app),
    jobTitle: selectedJob.value.positionTitle,
    hiringTrack: selectedJob.value.hiringTrack,
    avatarUrl: app.submittedBy?.avatarUrl
  }
  showIESModal.value = true
}

const exportConsolidatedIES = async (app) => {
  try {
    const response = await apiClient.get(`/v1/interviews/application/${app._id}/export-consolidated`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `IES-CONSOLIDATED-${fullName(app)}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Export Failed', text: 'Ensure evaluations are submitted before exporting.' })
  }
}

const fullName = (app) => {
  const p = app.applicantData?.personalInfo
  if (!p) return 'Unknown Candidate'
  return [p.firstName, p.middleName, p.lastName, p.suffix].filter(Boolean).join(' ')
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

onMounted(fetchJobs)
</script>

<template>
  <div class="flex flex-col gap-5 h-full">
    <AppPageHeader title="Interview Evaluations" subtitle="Conduct and manage Digital IES for qualified candidates." icon="pi-pencil" />

    <!-- Toolbar -->
    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-3.5 flex flex-col lg:flex-row gap-3">
      <div class="flex flex-col sm:flex-row items-center gap-3 flex-1">
        <button @click="showJobPicker = true"
          class="flex items-center gap-3 px-4 h-10 bg-[var(--bg-app)] border border-[var(--border-main)] hover:border-[var(--color-primary)] rounded-lg transition-all text-left w-full sm:min-w-[400px] group">
          <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
            <i class="pi pi-briefcase text-xs"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p v-if="selectedJob" class="text-xs font-bold text-[var(--text-main)] truncate uppercase tracking-tight">
              {{ selectedJob.positionTitle }}
            </p>
            <p v-else class="text-xs font-semibold text-[var(--text-faint)]">Select a vacancy to evaluate...</p>
          </div>
          <i class="pi pi-chevron-down text-[10px] text-[var(--text-faint)] group-hover:text-[var(--color-primary)] transition-colors"></i>
        </button>

        <div v-if="selectedJobId" class="relative flex-1 max-w-sm">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none"></i>
          <input v-model="searchQuery" type="search" placeholder="Search candidate..."
            class="w-full h-10 pl-9 pr-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm
                   text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-shadow" />
        </div>
      </div>
    </div>

    <!-- Stats Row -->
    <div v-if="selectedJobId && !loading" class="grid grid-cols-3 gap-3">
      <div v-for="stat in [
        { label: 'Qualified Applicants', value: stats.total, color: 'text-[var(--text-main)]', icon: 'pi-users' },
        { label: 'Evaluated',   value: stats.evaluated, color: 'text-emerald-600', icon: 'pi-check-circle' },
        { label: 'Pending',    value: stats.pending, color: 'text-amber-500', icon: 'pi-clock' }
      ]" :key="stat.label" class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-4 shadow-sm flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)]">
          <i :class="['pi', stat.icon]"></i>
        </div>
        <div>
          <p class="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest">{{ stat.label }}</p>
          <p class="text-2xl font-extrabold tabular-nums leading-none mt-0.5" :class="stat.color">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div v-if="selectedJobId" class="flex-1 overflow-hidden flex flex-col bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-sm">
      <div class="grid grid-cols-12 px-6 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)] text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest flex-shrink-0">
        <div class="col-span-4">Candidate</div>
        <div class="col-span-3">Code</div>
        <div class="col-span-2 text-center">Status</div>
        <div class="col-span-3 text-right">Actions</div>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--border-main)]">
        <div v-if="loading" class="p-4 flex flex-col gap-3">
          <div v-for="i in 5" :key="i" class="h-14 rounded-xl bg-[var(--bg-app)] animate-pulse"></div>
        </div>

        <template v-else>
          <div v-for="app in filtered" :key="app._id" class="grid grid-cols-12 px-6 py-3 items-center hover:bg-[var(--bg-app)] transition-colors group">
            <div class="col-span-4 flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center text-xs font-bold text-[var(--color-primary)] overflow-hidden">
                <img v-if="app.submittedBy?.avatarUrl" :src="app.submittedBy.avatarUrl" class="w-full h-full object-cover" />
                <span v-else>{{ fullName(app).charAt(0) }}</span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-[var(--text-main)] truncate uppercase leading-tight">{{ fullName(app) }}</p>
                <p class="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{{ app.submittedBy?.email }}</p>
              </div>
            </div>

            <div class="col-span-3">
              <span class="font-mono text-[11px] text-[var(--text-muted)] bg-[var(--bg-app)] px-2 py-0.5 rounded border border-[var(--border-main)]">{{ app.applicationCode }}</span>
            </div>

            <div class="col-span-2 flex justify-center">
              <AppBadge :variant="app.status === 'evaluated' ? 'success' : 'gold'" size="sm">
                {{ app.status === 'evaluated' ? 'Evaluated' : 'For Interview' }}
              </AppBadge>
            </div>

            <div class="col-span-3 text-right flex justify-end gap-2">
              <AppButton size="sm" variant="primary" icon="pi-pencil" @click="openIES(app)">Evaluate</AppButton>
              <button @click="exportConsolidatedIES(app)" class="h-8 w-8 rounded-lg border border-[var(--border-main)] bg-[var(--surface)] hover:bg-[var(--bg-app)] text-[var(--text-muted)] flex items-center justify-center">
                <i class="pi pi-file-pdf text-xs"></i>
              </button>
            </div>
          </div>

          <div v-if="filtered.length === 0" class="flex flex-col items-center justify-center py-16 gap-3 text-[var(--text-muted)]">
            <i class="pi pi-inbox text-3xl opacity-20"></i>
            <p class="text-sm font-bold uppercase tracking-widest">No qualified applicants found</p>
          </div>
        </template>
      </div>
    </div>

    <!-- Modals -->
    <AppModal v-model="showJobPicker" title="Select Vacancy" width="max-w-xl">
      <div class="p-2 space-y-2">
        <input v-model="jobPickerSearch" placeholder="Search positions..." class="w-full h-10 px-4 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm mb-4" />
        <div class="max-h-96 overflow-y-auto custom-scrollbar space-y-1">
          <button v-for="job in filteredJobs" :key="job._id" @click="selectJob(job._id)" class="w-full p-3 rounded-lg border border-[var(--border-main)] hover:border-[var(--color-primary)] hover:bg-[var(--bg-app)] text-left transition-all">
            <p class="text-xs font-bold text-[var(--text-main)] uppercase">{{ job.positionTitle }}</p>
            <p class="text-[10px] text-[var(--text-muted)] font-mono mt-1">{{ job.positionCode }}</p>
          </button>
        </div>
      </div>
    </AppModal>

    <AppModal v-model="showIESModal" title="Digital Interview Evaluation" icon="pi-pencil" width="max-w-7xl" body-class="p-0">
      <DigitalIES v-if="iesData" v-bind="iesData" @close="showIESModal = false" @submitted="loadApplications" />
    </AppModal>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-main); border-radius: 10px; }
</style>
