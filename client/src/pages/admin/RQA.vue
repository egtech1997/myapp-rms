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

const getPlaceName = (place) => {
  if (!place) return 'No Station'
  if (Array.isArray(place)) {
    return place.map(p => typeof p === 'object' ? p.name : p).filter(Boolean).join(', ')
  }
  if (typeof place === 'object') return place.name || 'No Station'
  return place
}

const filteredJobs = computed(() => {
  if (!jobPickerSearch.value) return jobs.value
  const q = jobPickerSearch.value.toLowerCase()
  return jobs.value.filter(j =>
    j.positionTitle.toLowerCase().includes(q) ||
    (j.positionCode || '').toLowerCase().includes(q) ||
    (j.placeOfAssignment || []).toString().toLowerCase().includes(q)
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

const exportOfficialRQA = async () => {
  if (!selectedJobId.value) return
  exporting.value = true
  try {
    const response = await apiClient.get(`/v1/rqa/${selectedJobId.value}/export`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `CAR-RQA-${selectedJob.value.positionCode}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Export Failed', text: 'Could not generate official CAR-RQA PDF.' })
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
          <div v-if="rqaData" class="flex items-center gap-2">
            <AppButton variant="secondary" icon="pi-table" @click="showReportModal = true" size="sm">Export Table</AppButton>
            <AppButton variant="primary" icon="pi-file-pdf" @click="exportOfficialRQA" :loading="exporting" size="sm">Export Official CAR-RQA</AppButton>
          </div>
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

      <AppDataTable
        v-if="rqaData.rankings?.length"
        :columns="[
          { label: 'Rank',      width: '3.5rem',  align: 'center' },
          { label: 'Applicant', width: '1fr'                      },
          { label: 'Score',     width: '6rem',    align: 'center' },
          { label: 'Residency', width: '7rem',    align: 'center' },
          { label: 'Action',    width: '8rem',    align: 'right'  },
        ]"
        :rows="rqaData.rankings"
        class="flex-1">
        <template #default="{ item }">
          <div class="text-center tabular-nums font-bold text-[var(--text-muted)]">{{ item.rank }}</div>
          <div class="font-black text-[var(--text-main)] uppercase tracking-tight">{{ item.applicantName }}</div>
          <div class="text-center">
            <span class="text-xl font-black text-[var(--color-primary)] tabular-nums">{{ item.totalPoints.toFixed(2) }}</span>
          </div>
          <div class="flex justify-center">
            <AppBadge v-if="item.residencyPriority" variant="primary" size="xs">Local</AppBadge>
            <span v-else class="text-[9px] font-bold text-[var(--text-faint)] uppercase">Non-Local</span>
          </div>
          <div class="flex justify-end">
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

    <!-- ── JOB PICKER MODAL (Refined) ────────────────────────────────────────── -->
    <AppModal v-model="showJobPicker" title="Select Vacancy Registry" icon="pi-verified" width="max-w-2xl">
      <div class="flex flex-col gap-4">
        <!-- Search bar -->
        <div class="relative group">
          <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none group-focus-within:text-[var(--color-primary)] transition-colors z-10"></i>
          <input 
            v-model="jobPickerSearch" 
            placeholder="Search by position, code, or station..." 
            class="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-bold uppercase tracking-tight
                   text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 
                   focus:border-[var(--color-primary)] transition-all"
            autofocus
          />
        </div>

        <!-- Vacancy List -->
        <div class="max-h-[440px] overflow-y-auto pr-1 custom-scrollbar min-h-[320px] relative">
          <div v-if="filteredJobs.length > 0" class="space-y-2 pb-4">
            <button v-for="job in filteredJobs" :key="job._id" @click="selectJob(job._id)"
              class="w-full p-4 rounded-2xl border transition-all text-left flex items-start justify-between gap-4 group relative overflow-hidden"
              :class="selectedJobId === job._id
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/20 shadow-sm ring-1 ring-[var(--color-primary-ring)]/20'
                : 'border-[var(--border-main)] bg-[var(--surface)] hover:border-[var(--color-primary)] hover:bg-[var(--bg-app)]/40 hover:shadow-md'">
              
              <!-- Selection Indicator -->
              <div v-if="selectedJobId === job._id" 
                class="absolute top-0 right-0 w-8 h-8 bg-[var(--color-primary)] flex items-center justify-center rounded-bl-xl shadow-sm animate-fade-in">
                <i class="pi pi-check text-white text-[10px] font-black"></i>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <span :class="['text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest',
                    job.hiringTrack === 'teaching' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                    job.hiringTrack === 'teaching_related' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                    'bg-slate-50 text-slate-600 border-slate-200']">
                    {{ job.hiringTrack.replace('_', ' ') }}
                  </span>
                </div>

                <h4 class="text-sm font-black text-[var(--text-main)] truncate uppercase group-hover:text-[var(--color-primary)] transition-colors leading-tight tracking-tight">
                  {{ job.positionTitle }}
                </h4>
                
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                  <div class="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                    <i class="pi pi-tag text-[9px]"></i>
                    <span class="font-mono text-[var(--text-main)]">{{ job.positionCode }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                    <i class="pi pi-map-marker text-[9px]"></i>
                    <span class="truncate max-w-[220px]">{{ getPlaceName(job.placeOfAssignment) }}</span>
                  </div>
                </div>
              </div>

              <div class="flex flex-col items-end justify-center self-stretch flex-shrink-0 py-0.5">
                <AppBadge :variant="job.status" size="sm" class="font-black uppercase tracking-widest text-[8px]">
                  {{ job.status }}
                </AppBadge>
              </div>
            </button>
          </div>

          <!-- No results state -->
          <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center mb-4">
              <i class="pi pi-search-minus text-2xl text-[var(--text-faint)]"></i>
            </div>
            <h5 class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">No Vacancies Found</h5>
            <p class="text-[11px] text-[var(--text-muted)] mt-1.5 max-w-[240px] font-medium leading-relaxed">
              Try different keywords or browse all recruitment posts.
            </p>
            <AppButton variant="secondary" size="sm" class="mt-5" @click="jobPickerSearch = ''">Clear Search</AppButton>
          </div>
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
