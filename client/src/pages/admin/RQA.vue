<script setup>
import { ref, reactive, computed, onMounted, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/api/axios'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { AppBadge, AppButton, AppCard, AppModal, AppTableReport, AppDataTable, AppPageHeader } from '@/components/ui'
import { statusConfig } from '@/utils/statusColors'
import { useRecruitmentStore } from '@/stores/recruitment'
import { storeToRefs } from 'pinia'

const toast  = inject('$toast')
const router = useRouter()
const recruitmentStore = useRecruitmentStore()
const { selectedJobId } = storeToRefs(recruitmentStore)

// ── DATA ──────────────────────────────────────────────────────────────────
const jobs = ref([])
const rqaData = ref(null)
const loading = ref(false)
const generating = ref(false)
const exporting = ref(false)
const showReportModal = ref(false)

// ── PICKER STATE ─────────────────────────────────────────────────────────────
const showJobPicker = ref(false)
const jobPickerSearch = ref('')

// ── MODAL STATE ───────────────────────────────────────────────────────────────
const selectedCandidate = ref(null)
const showDecisionModal = ref(false)
const reportRef = ref(null)

const reportCols = [
  { label: 'Rank', key: 'rank' },
  { label: 'Applicant Name', key: 'applicantName' },
  { label: 'Total Score', value: (r) => r.totalPoints.toFixed(2) },
  { label: 'Residency', value: (r) => r.residencyPriority ? 'Local' : 'Non-Local' },
  { label: 'Education', key: 'educationPoints' },
  { label: 'Experience', key: 'experiencePoints' },
  { label: 'Training', key: 'trainingPoints' },
]

// ── COMPUTED ──────────────────────────────────────────────────────────────────
const selectedJob = computed(() => jobs.value.find(j => j._id === selectedJobId.value) || null)

const filteredJobs = computed(() => {
  if (!jobPickerSearch.value) return jobs.value
  const q = jobPickerSearch.value.toLowerCase()
  return jobs.value.filter(j => 
    j.positionTitle.toLowerCase().includes(q) || 
    (j.positionCode || '').toLowerCase().includes(q) ||
    (j.placeOfAssignment || '').toString().toLowerCase().includes(q)
  )
})

// ── METHODS ───────────────────────────────────────────────────────────────
const fetchJobs = async () => {
  const { data } = await apiClient.get('/v1/jobs')
  jobs.value = data.data
  if (selectedJobId.value) {
    loadRQA()
  }
}

const selectJob = (jobId) => {
  recruitmentStore.setSelectedJobId(jobId)
  showJobPicker.value = false
  loadRQA()
}

const loadRQA = async () => {
  if (!selectedJobId.value) return
  loading.value = true
  try {
    const { data } = await apiClient.get(`/v1/rqa/${selectedJobId.value}`)
    rqaData.value = data.data
  } catch (err) {
    rqaData.value = null
  } finally {
    loading.value = false
  }
}

const generateRanking = async () => {
  generating.value = true
  try {
    const { data } = await apiClient.post(`/v1/rqa/${selectedJobId.value}/generate`)
    rqaData.value = data.data
    toast.fire({ icon: 'success', title: 'Ranking Complete', text: 'RQA has been successfully generated.' })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Generation Failed', text: err.response?.data?.message || 'Please ensure all candidates have been rated.' })
  } finally {
    generating.value = false
  }
}

const openDecisionStation = (item) => {
  selectedCandidate.value = item
  showDecisionModal.value = true
}

watch(selectedJobId, () => {
  loadRQA()
})

onMounted(fetchJobs)
</script>

<template>
  <div class="flex flex-col gap-6 h-full">
    <AppPageHeader title="Registry of Qualified Applicants" subtitle="Official ranking based on HRMPSB assessment." icon="pi-verified">
      <template #actions>
        <template v-if="selectedJobId">
          <AppButton variant="secondary" icon="pi-sync" @click="generateRanking" :loading="generating" size="sm">Generate/Update Rank</AppButton>
          <AppButton v-if="rqaData" variant="primary" icon="pi-file-pdf" @click="showReportModal = true" size="sm">Export CAR-RQA</AppButton>
        </template>
      </template>
    </AppPageHeader>

    <!-- Toolbar -->
    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
      <button @click="showJobPicker = true"
        class="flex items-center gap-3 px-4 h-12 bg-[var(--bg-app)] border-2 border-transparent hover:border-[var(--color-primary-ring)] rounded-xl transition-all text-left w-full sm:min-w-[400px] group">
        <div class="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
          <i class="pi pi-search text-sm"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p v-if="selectedJob" class="text-xs font-black text-[var(--text-main)] truncate uppercase tracking-tight">{{ selectedJob.positionTitle }}</p>
          <p v-if="selectedJob" class="text-[10px] text-[var(--text-muted)] font-mono truncate">{{ selectedJob.positionCode }}</p>
          <p v-else class="text-sm font-bold text-[var(--text-faint)]">Select vacancy to view registry...</p>
        </div>
        <i class="pi pi-chevron-down text-[10px] text-[var(--text-faint)] group-hover:text-[var(--color-primary)]"></i>
      </button>
      
      <div v-if="selectedJob" class="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">
        <div class="flex flex-col items-end leading-tight">
          <span>Ranked Applicants</span>
          <span class="text-emerald-600 tabular-nums font-bold">{{ rqaData?.rankings?.length || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- Registry Table -->
    <div v-if="rqaData" class="flex-1 overflow-hidden flex flex-col min-h-0">
      <!-- Top 3 highlights -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4" v-if="rqaData.rankings?.length">
        <div v-for="item in rqaData.rankings.slice(0, 3)" :key="item._id" @click="openDecisionStation(item)" class="bg-white border-2 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer" :class="item.rank === 1 ? 'border-[var(--color-gold)]' : 'border-[var(--border-main)]'">
          <div class="flex justify-between items-start mb-2">
            <div :class="['w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow-inner', item.rank === 1 ? 'bg-[var(--color-gold)] text-white' : 'bg-[var(--bg-app)] text-[var(--text-muted)]']">#{{ item.rank }}</div>
            <i v-if="item.residencyPriority" class="pi pi-home text-[var(--color-primary)] text-sm" title="Residency Priority"></i>
          </div>
          <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight truncate">{{ item.applicantName }}</h3>
          <p class="text-3xl font-black text-[var(--text-main)] tabular-nums mt-1">{{ item.totalPoints.toFixed(2) }}</p>
        </div>
      </div>

      <AppDataTable v-if="rqaData.rankings?.length" :columns="['Rank', 'Applicant', 'Score', 'Residency']" :rows="rqaData.rankings" class="flex-1">
        <template #default="{ item }">
          <div class="col-span-1 text-center tabular-nums font-bold text-[var(--text-muted)]">{{ item.rank }}</div>
          <div class="col-span-5 font-black text-[var(--text-main)] uppercase tracking-tight">{{ item.applicantName }}</div>
          <div class="col-span-2 text-center">
            <span class="text-xl font-black text-[var(--color-primary)] tabular-nums">{{ item.totalPoints.toFixed(2) }}</span>
          </div>
          <div class="col-span-2 flex justify-center">
            <AppBadge v-if="item.residencyPriority" variant="primary" size="xs">Local</AppBadge>
            <span v-else class="text-[9px] font-bold text-[var(--text-faint)] uppercase">Non-Local</span>
          </div>
          <div class="col-span-2 text-right">
            <AppButton size="xs" variant="secondary" @click="openDecisionStation(item)" class="h-8 px-3">
              <i class="pi pi-search-plus mr-1.5 text-[10px]"></i> Details
            </AppButton>
          </div>
        </template>
      </AppDataTable>

      <div v-else class="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-40">
        <i class="pi pi-users text-4xl mb-3 block"></i>
        <p class="text-xs font-black uppercase tracking-widest">No candidates have been ranked yet</p>
      </div>
    </div>

    <!-- Empty State: No Record -->
    <div v-else-if="selectedJobId && !loading" class="flex-1 flex flex-col items-center justify-center py-20 text-center bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-sm">
      <div class="w-16 h-16 rounded-3xl bg-[var(--bg-app)] flex items-center justify-center mb-4">
        <i class="pi pi-verified text-2xl text-[var(--color-primary)]/30"></i>
      </div>
      <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">RQA Not Generated</h3>
      <p class="text-xs text-[var(--text-muted)] max-w-xs mt-1 font-medium">The Comparative Assessment Result (CAR-RQA) for this position hasn't been finalized yet.</p>
      <AppButton variant="primary" size="sm" class="mt-6 font-black uppercase tracking-widest text-[10px]" @click="generateRanking" :loading="generating">
        <i class="pi pi-sync mr-2"></i> Click to Generate Now
      </AppButton>
    </div>

    <!-- Job Picker -->
    <AppModal v-model="showJobPicker" title="Select Vacancy Registry" icon="pi-search" width="max-w-2xl">
       <div class="space-y-4">
        <AppInput v-model="jobPickerSearch" placeholder="Filter by position or station..." prefixIcon="pi-search" />
        <div class="max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
          <button v-for="job in filteredJobs" :key="job._id" @click="selectJob(job._id)" class="w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between group" :class="selectedJobId === job._id ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/30 shadow-md' : 'border-[var(--bg-app)] bg-[var(--bg-app)] hover:border-[var(--border-main)]'">
            <div class="flex-1 min-w-0">
              <span class="text-[9px] font-black text-[var(--color-primary)] uppercase tracking-widest">{{ job.hiringTrack }}</span>
              <h4 class="text-sm font-black text-[var(--text-main)] truncate uppercase mt-1">{{ job.positionTitle }}</h4>
            </div>
            <AppBadge :variant="job.status" size="xs" class="uppercase">{{ job.status }}</AppBadge>
          </button>
        </div>
      </div>
    </AppModal>

    <!-- Details Modal -->
    <AppModal v-model="showDecisionModal" :title="`Merit Profile: ${selectedCandidate?.applicantName}`" icon="pi-user-check" width="max-w-3xl">
      <div v-if="selectedCandidate" class="space-y-6">
        <div class="bg-[var(--color-navy)] text-white p-8 rounded-2xl flex justify-between items-center shadow-2xl">
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest opacity-60">Rank</p>
            <p class="text-5xl font-black">#{{ selectedCandidate.rank }}</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] font-black uppercase tracking-widest opacity-60">Total Merit Points</p>
            <p class="text-5xl font-black tabular-nums">{{ (selectedCandidate.totalPoints || 0).toFixed(2) }}</p>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div v-for="[l, v] in [
            ['Education', selectedCandidate.educationPoints],
            ['Training', selectedCandidate.trainingPoints],
            ['Experience', selectedCandidate.experiencePoints],
            ['LET/Board Rating', selectedCandidate.boardRating],
            ['COI/Interview', selectedCandidate.coiPoints],
            ['Performance', selectedCandidate.performancePoints],
          ]" :key="l" class="bg-white border border-[var(--border-main)] p-4 rounded-xl flex justify-between items-center">
            <span class="text-xs font-bold text-[var(--text-muted)]">{{ l }}</span>
            <span class="text-base font-black text-[var(--text-main)] tabular-nums">{{ (v || 0).toFixed(2) }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-4 w-full">
          <AppButton variant="ghost" @click="showDecisionModal = false">Close</AppButton>
          <AppButton variant="primary" @click="router.push('/admin/appointments')">Go to Appointment</AppButton>
        </div>
      </template>
    </AppModal>

    <!-- ── Export Report Modal ────────────────────────────────────────────────── -->
    <AppTableReport
      v-model="showReportModal"
      title="Registry of Qualified Applicants"
      :subtitle="selectedJob?.positionTitle"
      :columns="reportCols"
      :rows="rqaData?.rankings || []"
      :filename="`RQA-${selectedJob?.positionCode}`" />

  </div>
</template>
