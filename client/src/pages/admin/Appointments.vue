<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'
import { AppBadge, AppButton, AppCard, AppDrawer, AppInput, AppSelect, AppTextarea, AppPageHeader, AppModal } from '@/components/ui'
import { useRecruitmentStore } from '@/stores/recruitment'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const toast = inject('$toast')
const recruitmentStore = useRecruitmentStore()
const { selectedJobId } = storeToRefs(recruitmentStore)

// ── DATA ──────────────────────────────────────────────────────────────────
const jobs = ref([])
const poolData = ref(null)
const loading = ref(false)

// ── UI STATE ──────────────────────────────────────────────────────────────
const showJobPicker = ref(false)
const jobPickerSearch = ref('')
const searchCandidate = ref('')
const filterStatus = ref('all') // 'all', 'appointed', 'pending'
const sortBy = ref('rank') // 'rank', 'name', 'score'
const sortDir = ref('asc')

// Focus Mode: Appointment Decision
const selectedApp = ref(null)
const showDecisionDrawer = ref(false)
const appointing = ref(false)

const appointForm = ref({
  effectiveDate: '',
  itemNumber: '',
  nature: 'Original',
  status: 'Permanent',
  remarks: ''
})

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

const filteredPool = computed(() => {
  if (!poolData.value?.rankings) return []
  let list = [...poolData.value.rankings]

  // Search
  if (searchCandidate.value) {
    const q = searchCandidate.value.toLowerCase()
    list = list.filter(r => r.applicantName.toLowerCase().includes(q))
  }

  // Filter
  if (filterStatus.value !== 'all') {
    list = list.filter(r => {
      const isAppointed = r.application?.status === 'appointed'
      return filterStatus.value === 'appointed' ? isAppointed : !isAppointed
    })
  }

  // Sort
  list.sort((a, b) => {
    let vA, vB
    if (sortBy.value === 'name') {
      vA = a.applicantName.toLowerCase(); vB = b.applicantName.toLowerCase()
    } else if (sortBy.value === 'score') {
      vA = a.totalPoints; vB = b.totalPoints
    } else {
      vA = a.rank; vB = b.rank
    }
    
    if (vA < vB) return sortDir.value === 'asc' ? -1 : 1
    if (vA > vB) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })

  return list
})

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

// ── METHODS ───────────────────────────────────────────────────────────────
const fetchJobs = async () => {
  const { data } = await apiClient.get('/v1/jobs')
  jobs.value = data.data
  if (selectedJobId.value) {
    loadPool()
  }
}

const selectJob = (jobId) => {
  recruitmentStore.setSelectedJobId(jobId)
  showJobPicker.value = false
  loadPool()
}

const loadPool = async () => {
  if (!selectedJobId.value) {
    poolData.value = null
    return
  }
  loading.value = true
  try {
    const { data } = await apiClient.get(`/v1/appointments/pool/${selectedJobId.value}`)
    poolData.value = data.data
  } catch (err) {
    poolData.value = null
    toast.fire({ icon: 'error', title: 'Data Missing', text: 'Ensure the RQA is computed and finalized.' })
  } finally {
    loading.value = false
  }
}

watch(selectedJobId, () => loadPool())

const toggleSort = (s) => {
  if (sortBy.value === s) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortBy.value = s; sortDir.value = 'asc' }
}

const openDecision = (item) => {
  selectedApp.value = item
  const app = item.application
  appointForm.value = { 
    effectiveDate: app?.appointmentData?.effectiveDate?.slice(0, 10) || '', 
    itemNumber: app?.appointmentData?.itemNumber || '', 
    nature: app?.appointmentData?.nature || 'Original',
    status: app?.appointmentData?.status || 'Permanent',
    remarks: app?.appointmentData?.remarks || '' 
  }
  showDecisionDrawer.value = true
}

const submitAppointment = async () => {
  appointing.value = true
  try {
    const payload = {
      applicationId: selectedApp.value.application._id,
      ...appointForm.value
    }
    await apiClient.patch(`/v1/appointments/appoint`, payload)
    toast.fire({ icon: 'success', title: 'Appointment Issued' })
    showDecisionDrawer.value = false
    loadPool()
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Action Failed', text: err.response?.data?.message || 'Check requirements' })
  } finally {
    appointing.value = false
  }
}

onMounted(fetchJobs)
</script>

<template>
  <div class="flex flex-col gap-6 h-full">
    <AppPageHeader title="Appointments Station" subtitle="Issue official appointment decisions for ranked candidates." icon="pi-star" />

    <!-- 1. Selection Toolbar -->
    <div class="bg-[var(--surface)] border border-[var(--border-main)] p-3 rounded-xl flex flex-col lg:flex-row items-center gap-4">
      <button @click="showJobPicker = true"
        class="flex items-center gap-3 px-4 h-11 bg-[var(--bg-app)] border border-[var(--border-main)] hover:border-[var(--color-primary)] rounded-lg transition-all text-left flex-1 group min-w-0">
        <div class="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] flex-shrink-0">
          <i class="pi pi-briefcase text-xs"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p v-if="selectedJob" class="text-xs font-bold text-[var(--text-main)] truncate uppercase tracking-tight">{{ selectedJob.positionTitle }}</p>
          <p v-if="selectedJob" class="text-[10px] text-[var(--text-muted)] font-mono truncate">{{ selectedJob.positionCode }} &bull; {{ getPlaceName(selectedJob.placeOfAssignment) }}</p>
          <p v-else class="text-xs font-semibold text-[var(--text-faint)]">Select a registry to begin selection...</p>
        </div>
        <i class="pi pi-chevron-down text-[10px] text-[var(--text-faint)] group-hover:text-[var(--color-primary)] transition-colors"></i>
      </button>

      <template v-if="poolData">
        <div class="h-8 w-px bg-[var(--border-main)] hidden lg:block"></div>
        
        <div class="relative w-full lg:w-64 group">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-xs z-10"></i>
          <input v-model="searchCandidate" type="search" placeholder="Find candidate..."
            class="w-full h-10 pl-9 pr-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 transition-all font-medium" />
        </div>

        <select v-model="filterStatus" class="h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30">
          <option value="all">All Candidates</option>
          <option value="pending">Pending Only</option>
          <option value="appointed">Appointed Only</option>
        </select>
      </template>
    </div>

    <!-- 2. The Full Ranking List -->
    <div v-if="poolData" class="flex-1 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <!-- Table Header -->
      <div class="grid grid-cols-12 px-6 py-3.5 bg-[var(--bg-app)] border-b border-[var(--border-main)] text-[10px] font-black uppercase text-[var(--text-faint)] tracking-[0.2em]">
        <div class="col-span-1 cursor-pointer hover:text-[var(--text-main)] transition-colors flex items-center gap-1" @click="toggleSort('rank')">
          Rank <i :class="['pi text-[8px]', sortBy === 'rank' ? (sortDir === 'asc' ? 'pi-sort-amount-up' : 'pi-sort-amount-down') : 'pi-sort-alt']"></i>
        </div>
        <div class="col-span-5 cursor-pointer hover:text-[var(--text-main)] transition-colors flex items-center gap-1" @click="toggleSort('name')">
          Candidate Name <i :class="['pi text-[8px]', sortBy === 'name' ? (sortDir === 'asc' ? 'pi-sort-amount-up' : 'pi-sort-amount-down') : 'pi-sort-alt']"></i>
        </div>
        <div class="col-span-2 text-center cursor-pointer hover:text-[var(--text-main)] transition-colors flex items-center justify-center gap-1" @click="toggleSort('score')">
          Total Score <i :class="['pi text-[8px]', sortBy === 'score' ? (sortDir === 'asc' ? 'pi-sort-amount-up' : 'pi-sort-amount-down') : 'pi-sort-alt']"></i>
        </div>
        <div class="col-span-2 text-center">Status</div>
        <div class="col-span-2 text-right">Decision</div>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--border-main)]">
        <div v-if="loading" class="p-12 flex flex-col items-center gap-3 opacity-50">
          <i class="pi pi-spin pi-spinner text-3xl"></i>
          <p class="text-xs font-black uppercase tracking-widest">Loading registry...</p>
        </div>
        <div v-else-if="filteredPool.length === 0" class="py-32 text-center">
          <i class="pi pi-search-minus text-4xl text-[var(--text-faint)] mb-4 block"></i>
          <p class="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">No candidates match your criteria</p>
        </div>
        
        <div v-for="item in filteredPool" :key="item._id"
          class="grid grid-cols-12 px-6 py-4 items-center hover:bg-[var(--bg-app)] transition-colors group relative overflow-hidden">
          
          <div v-if="item.rank <= 5 && item.application?.status !== 'appointed'" class="absolute left-0 top-0 w-1 h-full bg-amber-400"></div>

          <!-- Rank -->
          <div class="col-span-1">
            <div :class="['w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black',
              item.rank <= 3 ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'bg-[var(--bg-app)] text-[var(--text-muted)]']">
              {{ item.rank }}
            </div>
          </div>

          <!-- Info -->
          <div class="col-span-5 flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] flex items-center justify-center text-xs font-black text-[var(--text-muted)] flex-shrink-0">
              {{ item.applicantName.charAt(0) }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-[var(--text-main)] truncate uppercase leading-tight">{{ item.applicantName }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span v-if="item.residencyPriority" class="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase border border-blue-100 flex items-center gap-1">
                  <i class="pi pi-home"></i> Local
                </span>
                <span class="text-[9px] font-mono text-[var(--text-faint)] uppercase tracking-tighter">{{ item.application?.applicationCode }}</span>
              </div>
            </div>
          </div>

          <!-- Score -->
          <div class="col-span-2 text-center">
            <span class="text-lg font-black tabular-nums text-[var(--color-primary)]">{{ item.totalPoints.toFixed(2) }}</span>
          </div>

          <!-- Status -->
          <div class="col-span-2 flex justify-center">
            <AppBadge v-if="item.application?.status === 'appointed'" variant="success" size="xs">Appointed</AppBadge>
            <AppBadge v-else variant="neutral" size="xs">Eligible</AppBadge>
          </div>

          <!-- Action -->
          <div class="col-span-2 text-right">
            <AppButton v-if="item.application?.status !== 'appointed'" variant="secondary" size="xs" @click="openDecision(item)">
              Select Candidate
            </AppButton>
            <AppButton v-else variant="ghost" size="xs" icon="pi-file-pdf" title="Export Appointment">
              View CS-33
            </AppButton>
          </div>
        </div>
      </div>
      
      <!-- Footer Metadata -->
      <div class="px-6 py-3 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-between items-center shrink-0">
        <div class="flex items-center gap-4">
          <p class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            Total Candidates: <span class="text-[var(--text-main)]">{{ poolData.rankings?.length || 0 }}</span>
          </p>
          <div class="w-px h-3 bg-[var(--border-main)]"></div>
          <p class="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
            <i class="pi pi-star-fill text-[8px]"></i> Top 5 Priority Zone
          </p>
        </div>
        <p class="text-[9px] text-[var(--text-faint)] italic">Sorted by Merit & Localization Law (DO 007, s. 2023)</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="selectedJobId && !loading" class="flex-1 flex flex-col items-center justify-center text-center py-20 bg-[var(--surface)] border border-dashed border-[var(--border-main)] rounded-2xl">
       <div class="w-16 h-16 rounded-3xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center mb-4">
         <i class="pi pi-users text-3xl text-[var(--text-faint)]"></i>
       </div>
       <h3 class="text-base font-black text-[var(--text-main)] uppercase tracking-tight">Registry Not Loaded</h3>
       <p class="text-sm text-[var(--text-muted)] mt-1 max-w-xs font-medium">Select a vacancy from the toolbar to view the finalized comparative assessment list.</p>
    </div>

    <!-- ── JOB PICKER MODAL ────────────────────────────────────────── -->
    <AppModal v-model="showJobPicker" title="Select Recruitment Registry" icon="pi-star" width="max-w-2xl">
      <div class="flex flex-col gap-4">
        <div class="relative group">
          <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none group-focus-within:text-[var(--color-primary)] transition-colors z-10"></i>
          <input v-model="jobPickerSearch" placeholder="Search positions or stations..." 
            class="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-bold uppercase tracking-tight
                   text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 
                   focus:border-[var(--color-primary)] transition-all" autofocus />
        </div>

        <div class="max-h-[440px] overflow-y-auto pr-1 custom-scrollbar min-h-[320px] relative">
          <div v-if="filteredJobs.length > 0" class="space-y-2 pb-4">
            <button v-for="job in filteredJobs" :key="job._id" @click="selectJob(job._id)"
              class="w-full p-4 rounded-2xl border transition-all text-left flex items-start justify-between gap-4 group relative overflow-hidden"
              :class="selectedJobId === job._id
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/20 shadow-sm'
                : 'border-[var(--border-main)] bg-[var(--surface)] hover:border-[var(--color-primary)] hover:bg-[var(--bg-app)]/40'">
              
              <div v-if="selectedJobId === job._id" class="absolute top-0 right-0 w-8 h-8 bg-[var(--color-primary)] flex items-center justify-center rounded-bl-xl shadow-sm">
                <i class="pi pi-check text-white text-[10px] font-black"></i>
              </div>

              <div class="flex-1 min-w-0">
                <span class="text-[9px] font-black px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-600 uppercase tracking-widest">{{ job.hiringTrack.replace('_', ' ') }}</span>
                <h4 class="text-sm font-black text-[var(--text-main)] truncate uppercase group-hover:text-[var(--color-primary)] transition-colors mt-2">{{ job.positionTitle }}</h4>
                <p class="text-[10px] text-[var(--text-muted)] font-mono mt-1 uppercase">{{ job.positionCode }} &bull; {{ getPlaceName(job.placeOfAssignment) }}</p>
              </div>
              <AppBadge :variant="job.status" size="sm" class="uppercase tracking-widest text-[8px]">{{ job.status }}</AppBadge>
            </button>
          </div>
        </div>
      </div>
    </AppModal>

    <!-- 3. FOCUS MODE: APPOINTMENT STATION (DRAWER) -->
    <AppDrawer :show="showDecisionDrawer" :title="selectedApp?.applicantName" subtitle="Official Selection & Appointment Station" size="lg" @close="showDecisionDrawer = false">
      <div class="flex flex-col gap-10 py-4">
         <!-- Summary Identity -->
         <div class="p-8 rounded-2xl relative overflow-hidden" style="background: var(--color-navy);">
            <div class="relative z-10 flex justify-between items-start">
               <div>
                  <AppBadge variant="primary" class="mb-4">Ranked #{{ selectedApp?.rank }}</AppBadge>
                  <h2 class="text-2xl font-black text-white tracking-tight leading-none uppercase">{{ selectedApp?.applicantName }}</h2>
                  <p class="text-xs font-bold uppercase tracking-widest mt-2" style="color: var(--color-silver-blue);">Comparative Score: {{ selectedApp?.totalPoints.toFixed(2) }}</p>
               </div>
               <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-black text-white">
                  {{ selectedApp?.applicantName.charAt(0) }}
               </div>
            </div>
            <div class="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-[var(--color-primary)] opacity-10 blur-[60px]"></div>
         </div>

         <!-- Decision Workflow -->
         <div class="space-y-8">
            <section class="space-y-5">
               <div class="flex items-center gap-3 border-b border-[var(--border-main)] pb-3">
                 <i class="pi pi-file-edit text-[var(--color-primary)] text-sm"></i>
                 <span class="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.15em]">Appointment Particulars</span>
               </div>
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <AppInput
                    v-model="appointForm.effectiveDate"
                    label="Effective Date"
                    type="date"
                    hint="Date the appointment takes effect"
                  />
                  <AppSelect
                    v-model="appointForm.nature"
                    label="Nature of Appointment"
                    :options="['Original','Promotion','Transfer','Reappointment','Reinstatement']"
                  />
                  <AppSelect
                    v-model="appointForm.status"
                    label="Employment Status"
                    :options="['Permanent','Temporary','Substitute','Coterminous']"
                  />
                  <AppInput
                    v-model="appointForm.itemNumber"
                    label="Plantilla Item No."
                    placeholder="e.g. OSEC-DECSB-T1-99999"
                    hint="From the approved Plantilla of Personnel"
                  />
               </div>
               <AppTextarea
                 v-model="appointForm.remarks"
                 label="SDS Deliberation Notes"
                 placeholder="Official remarks for record..."
                 :rows="3"
                 hint="These notes will be included in the appointment record"
               />
            </section>

            <div class="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
               <i class="pi pi-info-circle text-amber-600 mt-1"></i>
               <div>
                  <p class="text-[11px] font-black text-amber-800 uppercase tracking-tight leading-none mb-1.5">Selection Compliance</p>
                  <p class="text-[10px] text-amber-700 leading-relaxed font-medium">Under the merit principle, the appointing authority may select any of the top five (5) candidates. This decision will release the official notification to the candidate.</p>
               </div>
            </div>
         </div>

         <!-- Action Bar -->
         <div class="flex gap-3 pt-6 border-t border-[var(--border-main)] mt-auto">
            <AppButton variant="primary" block size="lg" :loading="appointing" @click="submitAppointment">
               Finalize Appointment Decision
            </AppButton>
            <AppButton variant="secondary" @click="showDecisionDrawer = false">Cancel</AppButton>
         </div>
      </div>
    </AppDrawer>

  </div>
</template>
