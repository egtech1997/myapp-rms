<script setup>
import { ref, computed, onMounted } from 'vue'
import { AppButton, AppTextarea, AppBadge, AppAvatar } from '@/components/ui'
import apiClient from '@/api/axios'
import Swal from 'sweetalert2'

const props = defineProps({
  applicationId: { type: String, required: true },
  candidateName:  { type: String, default: 'Candidate' },
  jobTitle:       { type: String, default: 'Position' },
  hiringTrack:    { type: String, default: 'non_teaching' },
  avatarUrl:      { type: String, default: '' },
})

const emit = defineEmits(['close', 'submitted'])

// ── STATE ───────────────────────────────────────────────────────────────────
const rubric        = ref(null)       // full rubric from DB
const interviewId   = ref(null)       // existing interview _id (for export)
const status        = ref('draft')    // 'draft' | 'submitted'
const saving        = ref(false)
const loadingRubric = ref(true)
const overallRemarks = ref('')
const application    = ref(null)

// scores[] is parallel to rubric.criteria[] — each { score, remarks }
const scores = ref([])

// ── COMPUTED: criteria split by Part ────────────────────────────────────────
// Give every criterion its index within rubric.criteria so we can access scores[]
const partACriteria = computed(() =>
  (rubric.value?.criteria || []).map((c, i) => ({ ...c, globalIndex: i })).filter(c => !c.isPotential)
)
const partBCriteria = computed(() =>
  (rubric.value?.criteria || []).map((c, i) => ({ ...c, globalIndex: i })).filter(c => c.isPotential)
)

const maxA = computed(() => partACriteria.value.reduce((s, c) => s + (c.maxPoints || 0), 0))
const maxB = computed(() => partBCriteria.value.reduce((s, c) => s + (c.maxPoints || 0), 0))
const maxTotal = computed(() => rubric.value?.totalPoints || (maxA.value + maxB.value))

const totalA = computed(() =>
  partACriteria.value.reduce((s, c) => s + (Number(scores.value[c.globalIndex]?.score) || 0), 0)
)
const totalB = computed(() =>
  partBCriteria.value.reduce((s, c) => s + (Number(scores.value[c.globalIndex]?.score) || 0), 0)
)
const grandTotal = computed(() => totalA.value + totalB.value)

// Flag criteria that exceed their maximum
const overflowIndices = computed(() =>
  new Set((rubric.value?.criteria || []).reduce((acc, c, i) => {
    if ((Number(scores.value[i]?.score) || 0) > c.maxPoints) acc.push(i)
    return acc
  }, []))
)
const hasOverflow = computed(() => overflowIndices.value.size > 0)

// ── COMPUTED: background sidebar ────────────────────────────────────────────
const relevantEducation = computed(() =>
  (application.value?.applicantData?.education || []).filter(e => e.isRelevant !== false)
)
const relevantExperience = computed(() =>
  (application.value?.applicantData?.experience || []).filter(e => e.isRelevant !== false)
)
const relevantTraining = computed(() =>
  (application.value?.applicantData?.training || []).filter(t => t.isRelevant !== false)
)
const relevantEligibility = computed(() =>
  (application.value?.applicantData?.eligibility || []).filter(e => e.isRelevant !== false)
)
const totalFiltered = computed(() => {
  if (!application.value?.applicantData) return 0
  const d = application.value.applicantData
  return (d.education?.length || 0) - relevantEducation.value.length
       + (d.experience?.length || 0) - relevantExperience.value.length
       + (d.training?.length || 0)   - relevantTraining.value.length
})

const TRACK_META = {
  teaching:         { label: 'Teaching Track',            color: 'bg-blue-100 text-blue-700 border-blue-200' },
  teaching_related: { label: 'Teaching-Related Track',    color: 'bg-purple-100 text-purple-700 border-purple-200' },
  non_teaching:     { label: 'Non-Teaching Track',        color: 'bg-slate-100 text-slate-700 border-slate-200' },
  school_admin:     { label: 'School Administrator Track', color: 'bg-amber-100 text-amber-700 border-amber-200' },
}
const trackMeta = computed(() => TRACK_META[props.hiringTrack] || { label: props.hiringTrack, color: 'bg-slate-100 text-slate-700 border-slate-200' })

// ── METHODS ─────────────────────────────────────────────────────────────────
// Build criteria payload to send to the API
const buildCriteria = () =>
  (rubric.value?.criteria || []).map((c, i) => ({
    label:    c.label,
    score:    Number(scores.value[i]?.score) || 0,
    maxScore: c.maxPoints,
    remarks:  scores.value[i]?.remarks || '',
  }))

const fetchRubric = async () => {
  loadingRubric.value = true
  try {
    const { data } = await apiClient.get(`/v1/rubrics/track/${props.hiringTrack || 'non_teaching'}`)
    rubric.value = data.data
    // Initialize scores array — will be overwritten by loadExisting if a saved interview exists
    scores.value = rubric.value.criteria.map(() => ({ score: 0, remarks: '' }))
  } catch (err) {
    console.error('Failed to load rubric', err)
    Swal.fire('Rubric Not Found', `No rubric is configured for the "${props.hiringTrack}" track. Please set up rubrics in Settings → Rubrics.`, 'warning')
  } finally {
    loadingRubric.value = false
  }
}

// Load this panelist's existing draft/submitted evaluation for the application
const loadExisting = async () => {
  try {
    const { data } = await apiClient.get(`/v1/interviews/application/${props.applicationId}`)
    const list = data.data
    if (!Array.isArray(list) || list.length === 0) return

    const mine = list[0]  // first entry (panelist's own evaluation)
    interviewId.value = mine._id
    status.value      = mine.status || 'draft'
    overallRemarks.value = mine.overallRemarks || ''

    // Overwrite scores with saved values (by position)
    if (mine.criteria?.length) {
      scores.value = mine.criteria.map(c => ({ score: c.score ?? 0, remarks: c.remarks || '' }))
    }
  } catch (err) {
    if (err.response?.status !== 404) console.error('Failed to load existing interview', err)
  }
}

const fetchApplication = async () => {
  try {
    const { data } = await apiClient.get(`/v1/applications/${props.applicationId}`)
    application.value = data.data
  } catch (err) {
    console.error('Failed to fetch application', err)
  }
}

const saveDraft = async () => {
  saving.value = true
  try {
    const { data } = await apiClient.post('/v1/interviews', {
      application:    props.applicationId,
      criteria:       buildCriteria(),
      overallRemarks: overallRemarks.value,
      status:         'draft',
    })
    interviewId.value = data.data._id
    Swal.fire({ icon: 'success', title: 'Draft Saved', showConfirmButton: false, timer: 1400 })
  } catch (err) {
    Swal.fire('Save Failed', err.response?.data?.message || 'An error occurred.', 'error')
  } finally {
    saving.value = false
  }
}

const finalizeSubmission = async () => {
  if (hasOverflow.value) {
    return Swal.fire('Invalid Scores', 'One or more scores exceed their maximum. Please review before submitting.', 'error')
  }
  const result = await Swal.fire({
    title: 'Finalize Evaluation?',
    text: "Scores cannot be changed after submission.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Submit Final Score',
    confirmButtonColor: '#4A4D8F',
  })
  if (!result.isConfirmed) return

  saving.value = true
  try {
    // 1. Save/upsert scores
    const { data } = await apiClient.post('/v1/interviews', {
      application:    props.applicationId,
      criteria:       buildCriteria(),
      overallRemarks: overallRemarks.value,
    })
    interviewId.value = data.data._id

    // 2. Finalize — sets status='submitted', updates Application BEI score
    await apiClient.patch(`/v1/interviews/${data.data._id}/submit`)

    status.value = 'submitted'
    emit('submitted')
    Swal.fire({ icon: 'success', title: 'Evaluation Submitted!', showConfirmButton: false, timer: 1800 })
  } catch (err) {
    Swal.fire('Submission Failed', err.response?.data?.message || 'An error occurred.', 'error')
  } finally {
    saving.value = false
  }
}

const exportIES = async () => {
  if (!interviewId.value) {
    try {
      const { data } = await apiClient.get(`/v1/interviews/application/${props.applicationId}`)
      if (data.data?.length) interviewId.value = data.data[0]._id
    } catch {}
  }
  if (!interviewId.value) return Swal.fire('Error', 'No evaluation found to export.', 'error')
  try {
    const res = await apiClient.get(`/v1/interviews/${interviewId.value}/export`, { responseType: 'blob' })
    const url  = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href  = url
    link.setAttribute('download', `IES-${props.candidateName}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch {
    Swal.fire('Error', 'Failed to export IES PDF.', 'error')
  }
}

const clampScore = (idx) => {
  const max = rubric.value?.criteria[idx]?.maxPoints ?? Infinity
  const val = Number(scores.value[idx]?.score)
  if (!isNaN(val) && val > max) scores.value[idx].score = max
  if (!isNaN(val) && val < 0)   scores.value[idx].score = 0
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short' }) : '—'

const scorePercent = computed(() => maxTotal.value > 0 ? Math.min(100, (grandTotal.value / maxTotal.value) * 100) : 0)

onMounted(async () => {
  await fetchRubric()           // must run first to init scores[]
  await Promise.all([loadExisting(), fetchApplication()])
})
</script>

<template>
  <div class="flex flex-col h-full bg-[var(--surface)] animate-fade-in" style="min-height:600px">

    <!-- ── Header ── -->
    <div class="px-6 py-4 border-b border-[var(--border-main)] bg-[var(--bg-app)] flex-shrink-0">
      <div class="flex items-center gap-4">
        <AppAvatar :src="avatarUrl" :name="candidateName" size="xl" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <span class="text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest"
              :class="trackMeta.color">{{ trackMeta.label }}</span>
            <AppBadge :variant="status === 'submitted' ? 'appointed' : 'verifying'" size="sm">
              {{ status === 'submitted' ? 'Submitted' : 'Draft' }}
            </AppBadge>
          </div>
          <h2 class="text-base font-extrabold text-[var(--text-main)] leading-tight truncate uppercase">{{ candidateName }}</h2>
          <p class="text-xs text-[var(--text-muted)] mt-0.5">Applying for: <span class="font-bold text-[var(--color-primary)]">{{ jobTitle }}</span></p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-1">Grand Total</p>
          <p class="text-3xl font-black tabular-nums leading-none"
            :class="grandTotal >= maxTotal * 0.75 ? 'text-emerald-600' : grandTotal >= maxTotal * 0.5 ? 'text-amber-500' : 'text-[var(--text-main)]'">
            {{ grandTotal.toFixed(1) }}
          </p>
          <p class="text-[10px] text-[var(--text-faint)] font-bold">/ {{ maxTotal }} pts</p>
        </div>
      </div>
    </div>

    <!-- ── Body ── -->
    <div class="flex-1 flex overflow-hidden">

      <!-- Left sidebar: Background Summary -->
      <aside class="w-72 border-r border-[var(--border-main)] bg-[var(--bg-app)]/40 overflow-y-auto custom-scrollbar p-5 space-y-6 flex-shrink-0">

        <div v-if="totalFiltered > 0" class="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <i class="pi pi-filter text-amber-500 text-[10px] mt-0.5 shrink-0"></i>
          <p class="text-[10px] text-amber-700 leading-snug font-bold">
            {{ totalFiltered }} record{{ totalFiltered !== 1 ? 's' : '' }} marked irrelevant by HR — shown below are relevant records only.
          </p>
        </div>

        <!-- Education -->
        <div>
          <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-2 flex items-center justify-between">
            Education <span class="text-[var(--color-primary)]">{{ relevantEducation.length }}</span>
          </p>
          <div v-if="!relevantEducation.length" class="text-[10px] text-[var(--text-faint)] italic">None on record</div>
          <div v-for="edu in relevantEducation" :key="edu._id || edu.degree"
            class="mb-2 p-3 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-sm">
            <p class="text-[10px] font-black uppercase text-[var(--text-main)] leading-tight">{{ edu.degree || '—' }}</p>
            <p class="text-[9px] text-[var(--text-muted)] mt-0.5 leading-snug">{{ edu.school }}</p>
            <p class="text-[9px] font-bold text-[var(--color-primary)] mt-0.5">{{ edu.yearGraduated || edu.periodTo || '—' }}</p>
          </div>
        </div>

        <!-- Eligibility -->
        <div>
          <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-2 flex items-center justify-between">
            Eligibility <span class="text-[var(--color-primary)]">{{ relevantEligibility.length }}</span>
          </p>
          <div v-if="!relevantEligibility.length" class="text-[10px] text-[var(--text-faint)] italic">None on record</div>
          <div v-for="e in relevantEligibility" :key="e._id || e.name"
            class="mb-2 p-3 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-sm">
            <p class="text-[10px] font-black uppercase text-[var(--text-main)] leading-tight">{{ e.name || e.type || '—' }}</p>
            <p v-if="e.licenseNumber" class="text-[9px] text-[var(--text-muted)] mt-0.5">Lic. #{{ e.licenseNumber }}</p>
          </div>
        </div>

        <!-- Experience -->
        <div>
          <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-2 flex items-center justify-between">
            Experience <span class="text-[var(--color-primary)]">{{ relevantExperience.length }}</span>
          </p>
          <div v-if="!relevantExperience.length" class="text-[10px] text-[var(--text-faint)] italic">None on record</div>
          <div v-for="exp in relevantExperience" :key="exp._id || exp.position"
            class="mb-2 p-3 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-sm">
            <p class="text-[10px] font-black uppercase text-[var(--text-main)] leading-tight">{{ exp.position }}</p>
            <p class="text-[9px] text-[var(--text-muted)] mt-0.5 leading-snug">{{ exp.company }}</p>
            <p class="text-[9px] font-bold text-[var(--color-primary)] mt-0.5">{{ formatDate(exp.periodFrom) }} — {{ exp.isPresent ? 'Present' : formatDate(exp.periodTo) }}</p>
          </div>
        </div>

        <!-- Training -->
        <div>
          <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-2 flex items-center justify-between">
            Training <span class="text-[var(--color-primary)]">{{ relevantTraining.length }}</span>
          </p>
          <div v-if="!relevantTraining.length" class="text-[10px] text-[var(--text-faint)] italic">None on record</div>
          <div v-for="trn in relevantTraining" :key="trn._id || trn.title"
            class="mb-2 p-3 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-sm">
            <p class="text-[10px] font-black uppercase text-[var(--text-main)] leading-tight">{{ trn.title }}</p>
            <p class="text-[9px] text-[var(--color-primary)] font-bold mt-0.5">{{ trn.hours }} hrs · {{ trn.typeOfLD || '—' }}</p>
          </div>
        </div>

      </aside>

      <!-- Scoring Area -->
      <div class="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-app)]/20">

        <!-- Loading state -->
        <div v-if="loadingRubric" class="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-faint)]">
          <i class="pi pi-spin pi-spinner text-2xl text-[var(--color-primary)]"></i>
          <p class="text-xs font-bold uppercase tracking-widest">Loading Rubric...</p>
        </div>

        <!-- No rubric found -->
        <div v-else-if="!rubric" class="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-faint)] p-10 text-center">
          <i class="pi pi-exclamation-triangle text-3xl text-amber-400"></i>
          <p class="text-sm font-bold text-[var(--text-main)]">No Rubric Configured</p>
          <p class="text-xs leading-relaxed">A rubric for the <strong>{{ trackMeta.label }}</strong> has not been set up yet. Please go to <strong>Settings → Rubrics</strong> to create one.</p>
        </div>

        <template v-else>
          <div class="max-w-3xl mx-auto p-8 space-y-10">

            <!-- Instruction banner -->
            <div class="flex items-start gap-3 p-4 bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 rounded-2xl">
              <i class="pi pi-info-circle text-[var(--color-primary)] mt-0.5 shrink-0"></i>
              <p class="text-[11px] text-[var(--color-primary-dark)] font-semibold leading-relaxed">
                Evaluate the candidate using the <strong>{{ rubric.title || trackMeta.label }} Rubric</strong> ({{ rubric.description || 'DepEd DO 007, s. 2023' }}).
                Score each criterion based on Behavioral Event Interview (BEI) evidence and background documentation.
              </p>
            </div>

            <!-- ── PART A: Background Factors ── -->
            <section v-if="partACriteria.length">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                    <span class="text-white text-[10px] font-black">A</span>
                  </div>
                  <div>
                    <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">Part A — Background Factors</h3>
                    <p class="text-[10px] text-[var(--text-muted)]">Scored from submitted credentials and records</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-[9px] font-bold uppercase text-[var(--text-faint)]">Part A Total</p>
                  <p class="text-lg font-black tabular-nums"
                    :class="totalA > maxA ? 'text-red-500' : 'text-[var(--color-primary)]'">
                    {{ totalA.toFixed(1) }} <span class="text-[11px] text-[var(--text-faint)] font-bold">/ {{ maxA }}</span>
                  </p>
                </div>
              </div>

              <!-- Part A table -->
              <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-sm">
                <div class="grid grid-cols-12 px-5 py-2.5 bg-[var(--bg-app)] border-b border-[var(--border-main)] text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)]">
                  <div class="col-span-6">Criterion</div>
                  <div class="col-span-2 text-center">Max</div>
                  <div class="col-span-2 text-center">Score</div>
                  <div class="col-span-2 text-center">Remarks</div>
                </div>
                <div class="divide-y divide-[var(--border-main)]">
                  <div v-for="c in partACriteria" :key="c.globalIndex"
                    class="grid grid-cols-12 px-5 py-3.5 items-center transition-colors"
                    :class="[
                      status === 'submitted' ? 'bg-[var(--bg-app)]/30' : 'hover:bg-[var(--bg-app)]/50',
                      overflowIndices.has(c.globalIndex) ? 'bg-red-50' : ''
                    ]">
                    <div class="col-span-6">
                      <p class="text-xs font-bold text-[var(--text-main)]">{{ c.label }}</p>
                    </div>
                    <div class="col-span-2 text-center">
                      <span class="text-xs font-black text-[var(--text-faint)]">{{ c.maxPoints }}</span>
                    </div>
                    <div class="col-span-2 flex justify-center">
                      <div class="flex items-center gap-1 bg-[var(--bg-app)] border rounded-lg px-2 py-1"
                        :class="overflowIndices.has(c.globalIndex) ? 'border-red-300 bg-red-50' : 'border-[var(--border-main)]'">
                        <input
                          type="number" :min="0" :max="c.maxPoints" step="0.5"
                          :disabled="status === 'submitted'"
                          v-model="scores[c.globalIndex].score"
                          @change="clampScore(c.globalIndex)"
                          class="w-10 text-center text-sm font-black bg-transparent border-none outline-none tabular-nums disabled:opacity-60" />
                      </div>
                    </div>
                    <div class="col-span-2 flex justify-center">
                      <input
                        type="text" :disabled="status === 'submitted'"
                        v-model="scores[c.globalIndex].remarks"
                        placeholder="Note..."
                        class="w-full text-[10px] bg-[var(--bg-app)] border border-[var(--border-main)] rounded-lg px-2 py-1 outline-none focus:border-[var(--color-primary)] disabled:opacity-60 transition-colors" />
                    </div>
                  </div>
                </div>
                <div class="px-5 py-3 bg-[var(--bg-app)] border-t border-[var(--border-main)] flex items-center justify-between">
                  <span class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Part A Subtotal</span>
                  <span class="text-sm font-black tabular-nums"
                    :class="totalA > maxA ? 'text-red-500' : 'text-[var(--color-primary)]'">
                    {{ totalA.toFixed(1) }} / {{ maxA }}
                  </span>
                </div>
              </div>
            </section>

            <!-- ── PART B: Potential Assessment / BEI ── -->
            <section v-if="partBCriteria.length">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-7 h-7 rounded-lg bg-[var(--color-navy)] flex items-center justify-center">
                    <span class="text-white text-[10px] font-black">B</span>
                  </div>
                  <div>
                    <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">Part B — Potential Assessment</h3>
                    <p class="text-[10px] text-[var(--text-muted)]">Panel interview, demo teaching, and BEI criteria</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-[9px] font-bold uppercase text-[var(--text-faint)]">Part B Total</p>
                  <p class="text-lg font-black tabular-nums"
                    :class="totalB > maxB ? 'text-red-500' : 'text-[var(--color-primary)]'">
                    {{ totalB.toFixed(1) }} <span class="text-[11px] text-[var(--text-faint)] font-bold">/ {{ maxB }}</span>
                  </p>
                </div>
              </div>

              <!-- Part B cards -->
              <div class="space-y-4">
                <div v-for="c in partBCriteria" :key="c.globalIndex"
                  class="bg-[var(--surface)] border rounded-2xl p-5 shadow-sm transition-all"
                  :class="[
                    status === 'submitted' ? 'opacity-75' : 'hover:border-[var(--color-primary)]/40',
                    overflowIndices.has(c.globalIndex) ? 'border-red-300 bg-red-50/30' : 'border-[var(--border-main)]'
                  ]">
                  <div class="flex items-start justify-between gap-4 mb-4">
                    <div class="flex-1">
                      <p class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">{{ c.label }}</p>
                      <p v-if="overflowIndices.has(c.globalIndex)"
                        class="text-[10px] font-bold text-red-500 mt-1">
                        <i class="pi pi-exclamation-triangle mr-1"></i>Score exceeds maximum of {{ c.maxPoints }}
                      </p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <div class="flex items-center bg-[var(--bg-app)] border rounded-xl px-3 py-1.5"
                        :class="overflowIndices.has(c.globalIndex) ? 'border-red-300' : 'border-[var(--border-main)]'">
                        <input
                          type="number" :min="0" :max="c.maxPoints" step="0.5"
                          :disabled="status === 'submitted'"
                          v-model="scores[c.globalIndex].score"
                          @change="clampScore(c.globalIndex)"
                          class="w-14 text-center text-lg font-black bg-transparent border-none outline-none tabular-nums disabled:opacity-60" />
                        <span class="text-[10px] font-black text-[var(--text-faint)] ml-1">/ {{ c.maxPoints }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Score bar -->
                  <div class="h-1.5 bg-[var(--bg-app)] rounded-full overflow-hidden mb-4 border border-[var(--border-main)]/40">
                    <div class="h-full rounded-full transition-all duration-300"
                      :class="overflowIndices.has(c.globalIndex) ? 'bg-red-500' : 'bg-[var(--color-primary)]'"
                      :style="{ width: `${Math.min(100, ((Number(scores[c.globalIndex]?.score) || 0) / c.maxPoints) * 100)}%` }">
                    </div>
                  </div>

                  <AppTextarea
                    v-model="scores[c.globalIndex].remarks"
                    :placeholder="`BEI evidence / behavioral observations for '${c.label}'...`"
                    :rows="2"
                    :disabled="status === 'submitted'"
                    class="text-xs font-medium" />
                </div>
              </div>

              <!-- Part B subtotal -->
              <div class="mt-4 px-5 py-3 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl flex items-center justify-between shadow-sm">
                <span class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Part B Subtotal</span>
                <span class="text-sm font-black tabular-nums"
                  :class="totalB > maxB ? 'text-red-500' : 'text-[var(--color-primary)]'">
                  {{ totalB.toFixed(1) }} / {{ maxB }}
                </span>
              </div>
            </section>

            <!-- Overall Remarks -->
            <div class="border-t border-[var(--border-main)] pt-8">
              <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-3">Overall Assessment & Recommendation</p>
              <AppTextarea
                v-model="overallRemarks"
                placeholder="Final panelist notes, overall impression, and recommendation..."
                :rows="4"
                :disabled="status === 'submitted'"
                class="font-medium" />
            </div>

          </div>
        </template>
      </div>
    </div>

    <!-- ── Footer ── -->
    <div class="flex-shrink-0 border-t border-[var(--border-main)] bg-[var(--surface)] shadow-[0_-8px_24px_rgba(0,0,0,0.05)] z-10">
      <!-- Score progress bar -->
      <div class="h-1 bg-[var(--bg-app)]">
        <div class="h-full transition-all duration-500"
          :class="hasOverflow ? 'bg-red-500' : grandTotal >= maxTotal * 0.75 ? 'bg-emerald-500' : 'bg-[var(--color-primary)]'"
          :style="{ width: `${scorePercent}%` }"></div>
      </div>

      <div class="px-6 py-4 flex items-center justify-between gap-6">
        <!-- Score breakdown -->
        <div class="flex items-center gap-6">
          <div v-if="partACriteria.length">
            <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)]">Part A</p>
            <p class="text-base font-black tabular-nums text-[var(--text-main)]">
              {{ totalA.toFixed(1) }}<span class="text-[10px] text-[var(--text-faint)] font-bold"> / {{ maxA }}</span>
            </p>
          </div>
          <div v-if="partACriteria.length && partBCriteria.length" class="h-8 w-px bg-[var(--border-main)]"></div>
          <div v-if="partBCriteria.length">
            <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)]">Part B</p>
            <p class="text-base font-black tabular-nums text-[var(--text-main)]">
              {{ totalB.toFixed(1) }}<span class="text-[10px] text-[var(--text-faint)] font-bold"> / {{ maxB }}</span>
            </p>
          </div>
          <div class="h-8 w-px bg-[var(--border-main)]"></div>
          <div>
            <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)]">Grand Total</p>
            <p class="text-2xl font-black tabular-nums leading-none"
              :class="hasOverflow ? 'text-red-500' : grandTotal >= maxTotal * 0.75 ? 'text-emerald-600' : 'text-[var(--color-primary)]'">
              {{ grandTotal.toFixed(1) }}<span class="text-xs text-[var(--text-faint)] font-bold"> / {{ maxTotal }}</span>
            </p>
          </div>
          <div v-if="hasOverflow" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
            <i class="pi pi-exclamation-triangle text-red-500 text-xs"></i>
            <span class="text-[10px] font-bold text-red-600">Score overflow — please fix before submitting</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3">
          <template v-if="status === 'draft'">
            <AppButton variant="secondary" size="lg" @click="saveDraft" :loading="saving"
              class="font-black uppercase tracking-widest text-[10px]">
              Save Draft
            </AppButton>
            <AppButton variant="primary" size="lg" @click="finalizeSubmission" :loading="saving"
              :disabled="hasOverflow || !rubric"
              class="font-black uppercase tracking-widest text-[10px]">
              Submit Score
            </AppButton>
          </template>
          <template v-else>
            <AppButton variant="primary" size="lg" @click="exportIES"
              class="font-black uppercase tracking-widest text-[10px]">
              <i class="pi pi-download mr-2 text-xs"></i> Export IES PDF
            </AppButton>
          </template>
          <AppButton variant="ghost" size="lg" @click="emit('close')"
            class="font-black uppercase tracking-widest text-[10px]">
            Close
          </AppButton>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-main); border-radius: 10px; }
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
</style>
