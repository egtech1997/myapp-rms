<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import apiClient from '@/api/axios'
import { AppBadge, AppButton, AppCard, AppDrawer, AppPageHeader } from '@/components/ui'
import { statusConfig } from '@/utils/statusColors'

const toast = inject('$toast')

// ── BREADCRUMBS ───────────────────────────────────────────────────────────
const breadcrumbs = [
  { label: 'Evaluation', to: '/admin/dashboard' },
  { label: 'Assessment Board', active: true },
]

// ── DATA ──────────────────────────────────────────────────────────────────
const jobs = ref([])
const applications = ref([])
const rubrics = ref([])
const loading = ref(false)
const selectedJobId = ref('')
const searchQuery = ref('')

// Focus Mode: Scoring state
const selectedApp = ref(null)
const showScorecard = ref(false)
const evalTab = ref('credentials')
const saving = ref(false)

const evalTabs = [
  { id: 'credentials', label: 'A. Credentials', icon: 'pi-file' },
  { id: 'potential',   label: 'B. Potential',   icon: 'pi-bolt' },
  { id: 'finalize',    label: 'Summary',        icon: 'pi-check-circle' },
]

const rating = reactive({
  panelMembers: '',
  educationPoints: 0,
  trainingPoints: 0,
  experiencePoints: 0,
  performancePoints: 0,
  outstandingAccomplishments: 0,
  appEducationPoints: 0,
  appLearningPoints: 0,
  potentialPoints: { writtenTest: 0, bei: 0, workSample: 0 },
  remarks: '',
})

// ── METHODS ───────────────────────────────────────────────────────────────
const fetchInitialData = async () => {
  const [jobsRes, rubricsRes] = await Promise.all([
    apiClient.get('/v1/jobs'),
    apiClient.get('/v1/rubrics')
  ])
  jobs.value = jobsRes.data.data
  rubrics.value = rubricsRes.data.data
}

const loadApplications = async () => {
  if (!selectedJobId.value) return
  loading.value = true
  const { data } = await apiClient.get(`/v1/applications/job/${selectedJobId.value}`)
  applications.value = data.data.filter(a => ['comparative_assessment', 'ranked'].includes(a.status))
  loading.value = false
}

const openScoring = (app) => {
  selectedApp.value = app
  evalTab.value = 'credentials'
  
  const r = app.hrRating || {}
  rating.panelMembers = r.panelMembers || ''
  rating.educationPoints = r.educationPoints || 0
  rating.trainingPoints = r.trainingPoints || 0
  rating.experiencePoints = r.experiencePoints || 0
  rating.performancePoints = r.performancePoints || 0
  rating.outstandingAccomplishments = r.outstandingAccomplishments || 0
  rating.appEducationPoints = r.appEducationPoints || 0
  rating.appLearningPoints = r.appLearningPoints || 0
  rating.potentialPoints = {
    writtenTest: r.potentialPoints?.writtenTest || 0,
    bei: r.potentialPoints?.bei || 0,
    workSample: r.potentialPoints?.workSample || 0
  }
  rating.remarks = r.remarks || ''
  
  showScorecard.value = true
}

const activeRubric = computed(() => {
  if (!selectedApp.value) return null
  const track = selectedApp.value.submittedTo?.hiringTrack || selectedApp.value.category
  return rubrics.value.find(r => r.category === track) || null
})

const liveTotal = computed(() => {
  const r = rating
  return (
    Number(r.educationPoints || 0) + Number(r.trainingPoints || 0) + Number(r.experiencePoints || 0) +
    Number(r.performancePoints || 0) + Number(r.outstandingAccomplishments || 0) + Number(r.appEducationPoints || 0) +
    Number(r.appLearningPoints || 0) + Number(r.potentialPoints.writtenTest || 0) + Number(r.potentialPoints.bei || 0) +
    Number(r.potentialPoints.workSample || 0)
  )
})

const submitEval = async (finalize = false) => {
  saving.value = true
  try {
    const payload = { hrRating: rating, finalize }
    await apiClient.patch(`/v1/applications/${selectedApp.value._id}/evaluate`, payload)
    toast.fire({ icon: 'success', title: finalize ? 'Scores Published' : 'Draft Saved' })
    showScorecard.value = false
    loadApplications()
  } finally {
    saving.value = false
  }
}

onMounted(fetchInitialData)

const filtered = computed(() => {
  let list = applications.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a => (a.applicantData?.personalInfo?.lastName || '').toLowerCase().includes(q) || a.applicationCode.toLowerCase().includes(q))
  }
  return list
})

const catATotal = computed(() =>
  Number(rating.educationPoints    || 0) + Number(rating.trainingPoints       || 0) +
  Number(rating.experiencePoints   || 0) + Number(rating.performancePoints    || 0) +
  Number(rating.outstandingAccomplishments || 0) + Number(rating.appEducationPoints || 0) +
  Number(rating.appLearningPoints  || 0)
)
const catBTotal = computed(() =>
  Number(rating.potentialPoints.writtenTest || 0) + Number(rating.potentialPoints.bei || 0) +
  Number(rating.potentialPoints.workSample  || 0)
)

const isLocked = computed(() => selectedApp.value?.status === 'ranked' && selectedApp.value?.isEvaluated)

const fieldClasses = "h-10 px-3 text-xs bg-[var(--bg-app)] border border-[var(--border-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary-ring)] transition-all outline-none";
const scoreClasses = "w-full h-12 px-4 text-xl font-black bg-[var(--bg-app)] border-2 border-[var(--border-main)] rounded-xl focus:border-[var(--color-primary)] transition-all tabular-nums text-center disabled:opacity-60 disabled:cursor-not-allowed";
</script>

<template>
  <div class="flex flex-col gap-6 h-full">
    <AppPageHeader title="Assessment Board" subtitle="Score applicants based on rubric criteria and potential points." icon="pi-list-check" />

    <!-- 1. Funnel Selection -->
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--surface)] border border-[var(--border-main)] p-4 rounded-xl shadow-sm">
      <div class="flex-1 min-w-0">
        <select v-model="selectedJobId" @change="loadApplications"
          class="w-full sm:w-96 h-10 px-4 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl text-sm font-black text-[var(--text-main)] focus:ring-2 focus:ring-[var(--color-primary-ring)] transition-all outline-none">
          <option value="">Select funnel for deliberation...</option>
          <option v-for="job in jobs" :key="job._id" :value="job._id">{{ job.positionTitle }} ({{ job.placeOfAssignment }})</option>
        </select>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative w-64">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[10px]"></i>
          <input v-model="searchQuery" placeholder="Quick search scored pool..."
            class="w-full h-10 pl-9 pr-4 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-[var(--color-primary-ring)] outline-none" />
        </div>
      </div>
    </header>

    <!-- 2. The Scoreboard -->
    <div v-if="selectedJobId" class="flex-1 overflow-hidden flex flex-col min-h-0 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-sm">

      <!-- Table Header -->
      <div class="grid grid-cols-12 px-6 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)] text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">
        <div class="col-span-5">Applicant</div>
        <div class="col-span-3 text-center">Merit Points (Live)</div>
        <div class="col-span-2 text-center">Phase</div>
        <div class="col-span-2 text-right">Actions</div>
      </div>

      <!-- Scrollable Body -->
      <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--border-main)]">
        <div v-if="loading" v-for="i in 6" :key="i" class="px-6 py-4 animate-pulse flex items-center justify-between">
          <div class="h-4 w-48 bg-[var(--bg-app)] rounded"></div>
          <div class="h-8 w-24 bg-[var(--bg-app)] rounded-lg"></div>
        </div>

        <div v-else v-for="app in filtered" :key="app._id"
          class="grid grid-cols-12 px-6 py-4 items-center group hover:bg-[var(--bg-app)] transition-colors cursor-default">

          <div class="col-span-5 flex items-center gap-4">
            <div class="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-xs font-black">
              {{ app.applicantData.personalInfo.lastName.charAt(0) }}
            </div>
            <div>
              <p class="text-sm font-black text-[var(--text-main)]">{{ app.applicantData.personalInfo.firstName }} {{ app.applicantData.personalInfo.lastName }}</p>
              <p class="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tight">{{ app.applicationCode }}</p>
            </div>
          </div>

          <div class="col-span-3 text-center">
            <span class="text-lg font-black text-[var(--color-primary)] tabular-nums">{{ app.totalScore?.toFixed(2) || '0.00' }}</span>
          </div>
          
          <div class="col-span-2 text-center">
            <AppBadge :variant="app.status === 'ranked' ? 'success' : 'neutral'">{{ app.status === 'ranked' ? 'Finalized' : 'In Deliberation' }}</AppBadge>
          </div>

          <div class="col-span-2 text-right">
            <AppButton size="xs" variant="secondary" @click="openScoring(app)">
              {{ app.status === 'ranked' ? 'View Score' : 'Score Candidate' }}
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. DELIBERATION SCORECARD (DRAWER) -->
    <AppDrawer 
      :show="showScorecard" 
      :title="selectedApp ? `${selectedApp.applicantData.personalInfo.firstName} ${selectedApp.applicantData.personalInfo.lastName}` : ''" 
      subtitle="HRMPSB Comparative Assessment Scorecard"
      size="xl"
      @close="showScorecard = false">
      
      <div class="flex flex-col gap-8 py-4">
        
        <!-- Locked Banner -->
        <div v-if="isLocked" class="flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <i class="pi pi-lock text-amber-500"></i>
          <p class="text-xs font-bold text-amber-700">This application has been finalized and ranked. Score fields are locked.</p>
        </div>

        <!-- Live Consensus Banner -->
        <div class="sticky top-0 z-10 p-5 rounded-xl bg-[var(--color-navy)] text-white shadow-2xl flex justify-between items-center transition-all">
          <div class="flex items-center gap-6">
            <div class="flex flex-col items-center w-16 h-16 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center shadow-lg">
              <span class="text-lg font-black tabular-nums leading-none">{{ liveTotal.toFixed(1) }}</span>
              <span class="text-[8px] font-black uppercase tracking-widest opacity-70 mt-0.5">Total</span>
            </div>
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest" style="color: var(--color-silver-blue);">HRMPSB Consensus Score</p>
              <h2 class="text-base font-black mt-0.5 tracking-tight uppercase">{{ activeRubric?.category?.replace('_', ' ') || 'Assessment' }} Track</h2>
              <div class="flex gap-4 mt-1">
                <span class="text-[9px] font-bold text-white/60">Cat A: <span class="text-white font-black">{{ catATotal.toFixed(1) }}</span></span>
                <span class="text-[9px] font-bold text-white/60">Cat B: <span class="text-amber-300 font-black">{{ catBTotal.toFixed(1) }}</span></span>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <AppButton v-if="!isLocked" variant="secondary" size="sm" @click="submitEval(false)" :loading="saving">Save Draft</AppButton>
            <AppButton v-if="!isLocked" variant="primary" size="sm" @click="submitEval(true)" :loading="saving">Finalize &amp; Rank</AppButton>
            <AppButton v-else variant="secondary" size="sm" @click="showScorecard = false">Close</AppButton>
          </div>
        </div>

        <!-- Applicant Quick-Reference -->
        <div v-if="selectedApp" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div v-for="[l, v] in [
            ['Performance', selectedApp.applicantData?.performanceRating?.score ? selectedApp.applicantData.performanceRating.score + ' – ' + selectedApp.applicantData.performanceRating.adjective : '—'],
            ['Top Education', selectedApp.applicantData?.education?.[0]?.level || '—'],
            ['Eligibility', selectedApp.applicantData?.eligibility?.[0]?.name || 'None on file'],
            ['Exp. Records', (selectedApp.applicantData?.experience?.length || 0) + ' records'],
          ]" :key="l" class="bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl p-3">
            <p class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-1">{{ l }}</p>
            <p class="text-xs font-black text-[var(--text-sub)] truncate" :title="v">{{ v }}</p>
          </div>
        </div>

        <!-- Panel Composition -->
        <AppCard class="card-raised p-6 space-y-4">
          <div class="flex items-center gap-3 mb-2">
            <i class="pi pi-users text-[var(--color-primary)]"></i>
            <h3 class="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">Panel Board Members</h3>
          </div>
          <input v-model="rating.panelMembers" placeholder="e.g. Chair: Dr. Smith, Member: Jane Doe..." :class="[fieldClasses, 'w-full !h-12 !text-sm']" />
          <p class="text-[10px] text-[var(--text-muted)] italic">Recording consensus scores for the official HRMPSB Minutes.</p>
        </AppCard>

        <!-- Scoring Sections -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- Category A: Credentials -->
          <div class="space-y-6">
            <div class="flex items-center gap-3 border-b border-[var(--border-main)] pb-2">
              <span class="w-6 h-6 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-[10px] font-black">A</span>
              <h4 class="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">Credentials Deliberation</h4>
            </div>
            <div class="grid grid-cols-1 gap-6">
              <div v-for="field in [
                { id: 'educationPoints', label: 'Education', rubric: 'education' },
                { id: 'trainingPoints', label: 'Training', rubric: 'training' },
                { id: 'experiencePoints', label: 'Experience', rubric: 'experience' },
                { id: 'performancePoints', label: 'Performance', rubric: 'performance' },
              ]" :key="field.id" class="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-between gap-8">
                <div class="flex-1">
                  <p class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{{ field.label }}</p>
                  <p class="text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-tighter">Max: {{ activeRubric?.weights?.[field.rubric] || 0 }} pts</p>
                </div>
                <input v-model.number="rating[field.id]" type="number" :class="scoreClasses" class="w-32" :disabled="isLocked" />
              </div>
            </div>
          </div>

          <!-- Category B: Potential -->
          <div class="space-y-6">
            <div class="flex items-center gap-3 border-b border-[var(--border-main)] pb-2">
              <span class="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-black">B</span>
              <h4 class="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">Potential & Assessment</h4>
            </div>
            <div class="grid grid-cols-1 gap-6">
              <div v-for="pField in [
                { id: 'writtenTest', label: 'Written Exam' },
                { id: 'bei', label: 'Panel Interview' },
                { id: 'workSample', label: 'Work Sample / Demo' }
              ]" :key="pField.id" class="p-4 rounded-2xl bg-amber-50/30 border border-amber-100 flex items-center justify-between gap-8">
                <div class="flex-1">
                  <p class="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">{{ pField.label }}</p>
                  <p class="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Max: {{ activeRubric?.weights?.potential?.[pField.id] || 0 }} pts</p>
                </div>
                <input v-model.number="rating.potentialPoints[pField.id]" type="number" :class="scoreClasses" class="w-32 !bg-amber-50/50 !border-amber-100 focus:!border-amber-400" :disabled="isLocked" />
              </div>
            </div>
          </div>

        </div>

        <!-- Remarks -->
        <AppCard class="card-raised p-6 space-y-4">
          <h3 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Official Board Remarks</h3>
          <textarea v-model="rating.remarks" placeholder="Provide final board justification for this applicant's ranking..."
            class="w-full p-4 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl text-sm font-medium min-h-[120px] focus:ring-2 focus:ring-[var(--color-primary-ring)] transition-all resize-none outline-none"></textarea>
        </AppCard>

      </div>
    </AppDrawer>

  </div>
</template>

