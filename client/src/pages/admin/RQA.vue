<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/api/axios'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { AppBadge, AppButton, AppCard, AppDrawer, AppTableReport, AppPageHeader } from '@/components/ui'
import { statusConfig } from '@/utils/statusColors'

const toast  = inject('$toast')
const router = useRouter()

// ── BREADCRUMBS ───────────────────────────────────────────────────────────
const breadcrumbs = [
  { label: 'Selection', to: '/admin/dashboard' },
  { label: 'Ranked Registry (RQA)', active: true },
]

// ── DATA ──────────────────────────────────────────────────────────────────
const jobs = ref([])
const rqaData = ref(null)
const loading = ref(false)
const generating = ref(false)
const exporting = ref(false)
const selectedJobId = ref('')

// Focus Mode: Decision Station
const selectedCandidate = ref(null)
const showDecisionDrawer = ref(false)
const reportRef = ref(null)

// ── METHODS ───────────────────────────────────────────────────────────────
const fetchJobs = async () => {
  const { data } = await apiClient.get('/v1/jobs')
  jobs.value = data.data
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
    toast.fire({ icon: 'success', title: 'Ranking Computed' })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Error', text: 'Evaluation data incomplete.' })
  } finally {
    generating.value = false
  }
}

const openDecisionStation = (item) => {
  selectedCandidate.value = item
  showDecisionDrawer.value = true
}

const downloadCAR_RQA = async () => {
  if (!rqaData.value) return
  exporting.value = true
  toast.fire({ icon: 'info', title: 'Preparing PDF', text: 'Rendering official CAR-RQA document...' })

  try {
    const el = reportRef.value
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/jpeg', 1.0)
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    pdf.addImage(imgData, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight())
    pdf.save(`CAR-RQA-${selectedJobId.value.slice(-6)}.pdf`)
    toast.fire({ icon: 'success', title: 'Export Complete' })
  } catch {
    toast.fire({ icon: 'error', title: 'Export Error' })
  } finally {
    exporting.value = false
  }
}

const getJobTitle = () => jobs.value.find(j => j._id === selectedJobId.value)?.positionTitle || 'Vacancy'

// ── Export ─────────────────────────────────────────────────────────────────
const showReport = ref(false)
const reportCols = [
  { label: 'Rank',       key: 'rank' },
  { label: 'Applicant',  key: 'applicantName' },
  { label: 'Education',  value: (r) => r.educationPoints?.toFixed(2) ?? '0.00' },
  { label: 'Experience', value: (r) => r.experiencePoints?.toFixed(2) ?? '0.00' },
  { label: 'Training',   value: (r) => r.trainingPoints?.toFixed(2) ?? '0.00' },
  { label: 'Total Score',value: (r) => r.totalPoints?.toFixed(2) ?? '0.00' },
  { label: 'Resident',   value: (r) => r.residencyPriority ? 'Yes' : 'No' },
]

onMounted(fetchJobs)
</script>

<template>
  <div class="flex flex-col gap-6 h-full">
    <AppPageHeader title="Ranked Registry (RQA)" subtitle="Generate, review, and export ranked qualified applicant lists." icon="pi-verified">
      <template #actions>
        <template v-if="selectedJobId">
          <AppButton variant="secondary" icon="pi-sync" @click="generateRanking" :loading="generating" size="sm">Recalculate</AppButton>
          <AppButton v-if="rqaData" variant="secondary" icon="pi-download" @click="showReport = true" size="sm">Export</AppButton>
          <AppButton v-if="rqaData" variant="primary" icon="pi-file-pdf" @click="downloadCAR_RQA" :disabled="exporting" size="sm">CAR-RQA PDF</AppButton>
        </template>
      </template>
    </AppPageHeader>

    <!-- 1. Global Registry Toolbar -->
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--surface)] border border-[var(--border-main)] p-4 rounded-xl shadow-sm">
      <div class="flex-1 min-w-0">
        <select v-model="selectedJobId" @change="loadRQA"
          class="w-full sm:w-96 h-10 px-4 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl text-sm font-black text-[var(--text-main)] focus:ring-2 focus:ring-[var(--color-primary-ring)] transition-all outline-none">
          <option value="">Select funnel to view ranked registry...</option>
          <option v-for="job in jobs" :key="job._id" :value="job._id">{{ job.positionTitle }} ({{ job.placeOfAssignment }})</option>
        </select>
      </div>
    </header>

    <template v-if="rqaData">
      <!-- 2. The Elite Pool (Top 5 Cards) -->
      <section class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div v-for="item in rqaData.rankings.slice(0, 5)" :key="item._id"
          @click="openDecisionStation(item)"
          class="card-raised p-4 hover:border-[var(--color-primary)] hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden">

          <div class="absolute top-0 right-0 p-2">
            <div :class="['w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm',
              item.rank === 1 ? 'bg-amber-400 text-amber-900' : 'bg-[var(--bg-app)] text-[var(--text-muted)]']">
              #{{ item.rank }}
            </div>
          </div>

          <p class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest mb-1">Top Tier</p>
          <h3 class="text-xs font-black text-[var(--text-main)] truncate pr-6">{{ item.applicantName }}</h3>

          <div class="mt-4 flex justify-between items-end">
            <div>
              <p class="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">Merit Score</p>
              <p class="text-lg font-black text-[var(--text-main)] tabular-nums">{{ item.totalPoints.toFixed(2) }}</p>
            </div>
            <i v-if="item.residencyPriority" class="pi pi-home text-[var(--color-primary)] text-xs" title="Local Resident"></i>
          </div>

          <div class="mt-3 h-1 rounded-full bg-[var(--bg-app)] overflow-hidden">
            <div class="h-full bg-[var(--color-primary)]" :style="{ width: `${item.totalPoints}%` }"></div>
          </div>
        </div>
      </section>

      <!-- 3. Full Interactive Registry Table -->
      <div class="flex-1 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
        <div class="px-6 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)] flex justify-between items-center">
          <h3 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Complete Registry Data</h3>
          <span class="text-[9px] font-bold text-[var(--text-muted)] italic">Sorted by DO 007 s. 2023 Tie-breaking Rules</span>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-[var(--surface)] shadow-sm">
              <tr class="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest border-b border-[var(--border-main)]">
                <th class="px-6 py-4 w-16">Rank</th>
                <th class="px-6 py-4">Applicant Name</th>
                <th class="px-6 py-4 text-center">Score</th>
                <th class="px-6 py-4">Tie-Breaker Data</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border-main)]">
              <tr v-for="item in rqaData.rankings" :key="item._id"
                class="hover:bg-[var(--bg-app)] transition-colors group cursor-default">
                <td class="px-6 py-4">
                  <div :class="['w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm',
                    item.rank <= 3 ? 'bg-[var(--text-main)] text-white' : 'bg-[var(--bg-app)] text-[var(--text-muted)]']">
                    {{ item.rank }}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <p class="text-xs font-black text-[var(--text-main)]">{{ item.applicantName }}</p>
                  <p v-if="item.residencyPriority" class="text-[8px] font-bold text-[var(--color-primary)] uppercase tracking-tight flex items-center gap-1 mt-0.5">
                    <i class="pi pi-home"></i> Local Resident
                  </p>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="text-sm font-black text-[var(--color-primary)] tabular-nums">{{ item.totalPoints.toFixed(2) }}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex gap-3 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                    <span>ED: {{ item.educationPoints.toFixed(1) }}</span>
                    <span>EX: {{ item.experiencePoints.toFixed(1) }}</span>
                    <span>TR: {{ item.trainingPoints.toFixed(1) }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-right">
                  <AppButton size="xs" variant="secondary" @click="openDecisionStation(item)">Station</AppButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <div v-else-if="selectedJobId" class="flex-1 flex flex-col items-center justify-center text-center opacity-40">
      <i class="pi pi-chart-bar text-5xl mb-4"></i>
      <h3 class="text-lg font-black text-[var(--text-main)]">Ranking Required</h3>
      <p class="text-sm text-[var(--text-muted)] max-w-xs mt-1">Numerical rankings have not been computed for this vacancy yet.</p>
      <AppButton variant="primary" class="mt-6" :loading="generating" @click="generateRanking">Compute RQA Now</AppButton>
    </div>

    <!-- 4. FOCUS MODE: DECISION STATION (DRAWER) -->
    <AppDrawer 
      :show="showDecisionDrawer" 
      :title="selectedCandidate?.applicantName" 
      :subtitle="`Current Rank: #${selectedCandidate?.rank}`"
      size="xl"
      @close="showDecisionDrawer = false">
      
      <div class="flex flex-col gap-10 py-4">
        
        <!-- Selection Status Banner -->
        <div class="p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden" style="background: var(--color-navy);">
           <div class="relative z-10 flex justify-between items-end">
              <div>
                <AppBadge variant="gold" class="mb-4">Qualified Candidate</AppBadge>
                <h2 class="text-3xl font-black tracking-tight leading-none">{{ selectedCandidate?.applicantName }}</h2>
                <div class="mt-6 flex gap-8">
                   <div>
                     <p class="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em] mb-1">Final Merit Score</p>
                     <p class="text-2xl font-black text-white tabular-nums">{{ selectedCandidate?.totalPoints.toFixed(2) }}</p>
                   </div>
                   <div class="h-10 w-px bg-white/10"></div>
                   <div>
                     <p class="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em] mb-1">Position Rank</p>
                     <p class="text-2xl font-black text-white tabular-nums">#{{ selectedCandidate?.rank }}</p>
                   </div>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                 <AppButton variant="primary" block size="lg" @click="router.push('/admin/appointments')">
                   Go to Appointments
                 </AppButton>
                 <AppButton variant="secondary" block size="sm" @click="showDecisionDrawer = false">Close</AppButton>
              </div>
           </div>
           <!-- Decorative BG logic -->
           <div class="absolute -top-24 -right-24 w-64 h-64 bg-[var(--color-primary)]/8 blur-[100px] rounded-full"></div>
        </div>

        <!-- 3-Tier Data Breakdown -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           <!-- Tier 1: Critical (Score Breakdown) -->
           <div class="lg:col-span-2 space-y-8">
              <div>
                <h4 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest border-b border-[var(--border-main)] pb-2 mb-6">Decision Data Breakdown</h4>
                <div class="grid grid-cols-2 gap-4">
                   <div v-for="[l, v] in [
                    ['Classroom Observation (COI)', selectedCandidate?.coiPoints],
                    ['Board Rating / Exam', selectedCandidate?.boardRating],
                    ['Education Points', selectedCandidate?.educationPoints],
                    ['Experience Points', selectedCandidate?.experiencePoints],
                    ['Training Points', selectedCandidate?.trainingPoints]
                   ]" :key="l" class="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] flex justify-between items-center">
                      <span class="text-[10px] font-black text-[var(--text-muted)] uppercase leading-tight">{{ l }}</span>
                      <span class="text-sm font-black text-[var(--text-main)] tabular-nums">{{ v?.toFixed(2) }}</span>
                   </div>
                </div>
              </div>

              <!-- Supporting: Full PDS Quick-View (Collapsible placeholder) -->
              <AppCard class="card-raised p-6">
                 <h4 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest mb-4">Board Remarks & Justification</h4>
                 <p class="text-sm font-medium text-[var(--text-sub)] leading-relaxed italic">
                   "Candidate demonstrated exceptional pedagogical knowledge during the COI. Board consensus reached on high potential for leadership roles."
                 </p>
              </AppCard>
           </div>

           <!-- Sidebar: Appointment Context -->
           <div class="space-y-6">
              <AppCard class="card-raised p-6 bg-[var(--color-primary-light)] border-[var(--color-primary-ring)]">
                 <h4 class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest mb-4">SDS Instructions</h4>
                 <ul class="space-y-3">
                    <li v-for="i in ['Review COI scores', 'Check residency proof', 'Verify item number availability']" :key="i" class="flex gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                       <i class="pi pi-check-circle text-[var(--color-primary)]"></i> {{ i }}
                    </li>
                 </ul>
              </AppCard>
           </div>

        </div>

      </div>
    </AppDrawer>

    <!-- Export Report Modal -->
    <AppTableReport
      v-if="rqaData"
      v-model="showReport"
      title="Registry of Qualified Applicants"
      :subtitle="`Position: ${getJobTitle()}`"
      :columns="reportCols"
      :rows="rqaData?.rankings ?? []"
      filename="RQA-Registry" />

    <!-- HIDDEN CAR-RQA EXPORT TEMPLATE -->
    <div v-if="rqaData" class="fixed -left-[3000px] top-0 pointer-events-none">
       <div ref="reportRef" style="width: 1123px; padding: 40px; background: #fff; font-family: 'Arial', sans-serif;">
          <!-- Official Landscape Header logic -->
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
             <p style="font-size: 10pt; margin: 0;">Republic of the Philippines</p>
             <p style="font-size: 14pt; font-weight: bold; margin: 2px 0;">DEPARTMENT OF EDUCATION</p>
             <h2 style="font-size: 16pt; font-weight: 900; margin-top: 20px;">COMPARATIVE ASSESSMENT RESULT (CAR-RQA)</h2>
             <p style="font-size: 10pt; font-weight: bold; margin-top: 5px;">POSITION: {{ getJobTitle() }}</p>
          </div>
          <!-- Table logic matches screen but styled for print -->
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 9pt;">
             <thead>
                <tr style="background: #f2f2f2;">
                   <th style="border: 1px solid #000; padding: 8px;">Rank</th>
                   <th style="border: 1px solid #000; padding: 8px; width: 250px;">Name of Applicant</th>
                   <th style="border: 1px solid #000; padding: 8px;">Education</th>
                   <th style="border: 1px solid #000; padding: 8px;">Experience</th>
                   <th style="border: 1px solid #000; padding: 8px;">Training</th>
                   <th style="border: 1px solid #000; padding: 8px;">TOTAL</th>
                </tr>
             </thead>
             <tbody>
                <tr v-for="item in rqaData.rankings" :key="item._id">
                   <td style="border: 1px solid #000; padding: 6px; text-align: center;">{{ item.rank }}</td>
                   <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">{{ item.applicantName.toUpperCase() }}</td>
                   <td style="border: 1px solid #000; padding: 6px; text-align: center;">{{ item.educationPoints.toFixed(2) }}</td>
                   <td style="border: 1px solid #000; padding: 6px; text-align: center;">{{ item.experiencePoints.toFixed(2) }}</td>
                   <td style="border: 1px solid #000; padding: 6px; text-align: center;">{{ item.trainingPoints.toFixed(2) }}</td>
                   <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: 900;">{{ item.totalPoints.toFixed(2) }}</td>
                </tr>
             </tbody>
          </table>
       </div>
    </div>

  </div>
</template>

