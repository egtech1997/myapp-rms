<script setup>
import { ref, reactive, computed, onMounted, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/api/axios'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { AppBadge, AppButton, AppCard, AppModal, AppTableReport, AppPageHeader } from '@/components/ui'
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

// ── PICKER STATE ─────────────────────────────────────────────────────────────
const showJobPicker = ref(false)
const jobPickerSearch = ref('')

// ── MODAL STATE ───────────────────────────────────────────────────────────────
const selectedCandidate = ref(null)
const showDecisionModal = ref(false)
const reportRef = ref(null)

// ── COMPUTED ──────────────────────────────────────────────────────────────────
const selectedJob = computed(() => jobs.value.find(j => j._id === selectedJobId.value) || null)

const filteredJobs = computed(() => {
  if (!jobPickerSearch.value) return jobs.value
  const q = jobPickerSearch.value.toLowerCase()
  return jobs.value.filter(j => 
    j.positionTitle.toLowerCase().includes(q) || 
    (j.positionCode || '').toLowerCase().includes(q) ||
    j.placeOfAssignment.toLowerCase().includes(q)
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

const downloadCAR_RQA = async () => {
  if (!rqaData.value) return
  exporting.value = true
  toast.fire({ icon: 'info', title: 'Generating Report', text: 'Please wait...' })
  try {
    const el = reportRef.value
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/jpeg', 1.0)
    
    // Using Letter size portrait for official form
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`CAR-RQA_${selectedJob.value.positionCode}.pdf`)
    toast.fire({ icon: 'success', title: 'CAR-RQA Exported' })
  } catch {
    toast.fire({ icon: 'error', title: 'Export Failed' })
  } finally {
    exporting.value = false
  }
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
          <AppButton v-if="rqaData" variant="primary" icon="pi-file-pdf" @click="downloadCAR_RQA" :disabled="exporting" size="sm">Export CAR-RQA</AppButton>
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
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div v-for="item in rqaData.rankings.slice(0, 3)" :key="item._id" @click="openDecisionStation(item)" class="bg-white border-2 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer" :class="item.rank === 1 ? 'border-[var(--color-gold)]' : 'border-[var(--border-main)]'">
          <div class="flex justify-between items-start mb-2">
            <div :class="['w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow-inner', item.rank === 1 ? 'bg-[var(--color-gold)] text-white' : 'bg-[var(--bg-app)] text-[var(--text-muted)]']">#{{ item.rank }}</div>
            <i v-if="item.residencyPriority" class="pi pi-home text-[var(--color-primary)] text-sm" title="Residency Priority"></i>
          </div>
          <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight truncate">{{ item.applicantName }}</h3>
          <p class="text-3xl font-black text-[var(--text-main)] tabular-nums mt-1">{{ item.totalPoints.toFixed(2) }}</p>
        </div>
      </div>
      <AppTableReport :title="`Official RQA Ledger for ${selectedJob.positionTitle}`" :data="rqaData.rankings" :columns="['Rank', 'Applicant', 'Score', 'Residency']" class="flex-1">
        <template #body="{ item }">
          <td class="w-16 text-center">{{ item.rank }}</td>
          <td>{{ item.applicantName }}</td>
          <td class="w-24 text-center font-bold">{{ item.totalPoints.toFixed(2) }}</td>
          <td class="w-24 text-center">
            <AppBadge v-if="item.residencyPriority" variant="primary" size="sm">Local</AppBadge>
          </td>
          <td class="w-32 text-right">
            <AppButton size="xs" @click="openDecisionStation(item)" class="h-7 px-3 text-[10px]">Details</AppButton>
          </td>
        </template>
      </AppTableReport>
    </div>

    <!-- Job Picker -->
    <AppModal v-model="showJobPicker" title="Select Vacancy Registry" icon="pi-search" width="max-w-2xl">
       <div class="p-1 space-y-4">
        <input v-model="jobPickerSearch" placeholder="Filter by position or station..." class="w-full h-12 px-5 bg-[var(--bg-app)] border-2 border-[var(--border-main)] rounded-xl text-sm font-bold focus:border-[var(--color-primary)] outline-none transition-all uppercase tracking-tight" />
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
            <p class="text-5xl font-black tabular-nums">{{ selectedCandidate.totalPoints.toFixed(2) }}</p>
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
            <span class="text-base font-black text-[var(--text-main)] tabular-nums">{{ v.toFixed(2) }}</span>
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
  </div>
</template>
