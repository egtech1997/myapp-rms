<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { AppButton, AppInput, AppTextarea, AppCard, AppBadge, AppAvatar } from '@/components/ui'
import apiClient from '@/api/axios'
import Swal from 'sweetalert2'

const props = defineProps({
  applicationId: { type: String, required: true },
  candidateName: { type: String, default: 'Candidate' },
  jobTitle:      { type: String, default: 'Position' },
  hiringTrack:   { type: String, default: 'non_teaching' },
  avatarUrl:     { type: String, default: '' },
})

const emit = defineEmits(['close', 'submitted'])

// ── STATE ──────────────────────────────────────────────────────────────────
const status = ref('draft')
const saving = ref(false)
const criteria = ref([])
const overallRemarks = ref('')
const application = ref(null)

// ── COMPUTED ────────────────────────────────────────────────────────────────
const totalScore = computed(() => {
  return criteria.value.reduce((sum, item) => sum + (Number(item.score) || 0), 0)
})

const maxPossible = computed(() => {
  return criteria.value.reduce((sum, item) => sum + (Number(item.maxScore) || 0), 0)
})

// Relevance Filtering
const relevantEducation = computed(() => {
  if (!application.value?.applicantData?.education) return []
  return application.value.applicantData.education.filter(e => e.isRelevant !== false)
})

const relevantExperience = computed(() => {
  if (!application.value?.applicantData?.experience) return []
  return application.value.applicantData.experience.filter(e => e.isRelevant !== false)
})

const relevantTraining = computed(() => {
  if (!application.value?.applicantData?.training) return []
  return application.value.applicantData.training.filter(t => t.isRelevant !== false)
})

const filteredStats = computed(() => {
  if (!application.value?.applicantData) return null
  const d = application.value.applicantData
  return {
    edu: (d.education?.length || 0) - relevantEducation.value.length,
    exp: (d.experience?.length || 0) - relevantExperience.value.length,
    trn: (d.training?.length || 0) - relevantTraining.value.length,
  }
})

const totalFiltered = computed(() => {
  if (!filteredStats.value) return 0
  return (filteredStats.value.edu || 0) + (filteredStats.value.exp || 0) + (filteredStats.value.trn || 0)
})

// ── METHODS ─────────────────────────────────────────────────────────────────
const loadExisting = async () => {
  try {
    const { data } = await apiClient.get(`/v1/interviews/application/${props.applicationId}`)
    if (data.data) {
      criteria.value = data.data.criteria
      overallRemarks.value = data.data.overallRemarks
      status.value = data.data.status
    }
  } catch (err) {
    // 404 is fine, means no draft yet
    if (err.response?.status !== 404) console.error("Failed to load interview", err)
  }
}

const fetchCriteria = async () => {
  try {
    if (criteria.value.length > 0) return
    const { data } = await apiClient.get(`/v1/rubrics/track/${props.hiringTrack || 'non_teaching'}`)
    if (data.data) {
      criteria.value = data.data.criteria.map(c => ({
        label: c.label,
        score: 0,
        maxScore: c.maxPoints,
        remarks: ''
      }))
    }
  } catch (err) {
    console.error("Failed to load rubric", err)
  }
}

const fetchApplication = async () => {
  try {
    const { data } = await apiClient.get(`/v1/applications/${props.applicationId}`)
    application.value = data.data
  } catch (err) {
    console.error("Failed to fetch application", err)
  }
}

const saveDraft = async () => {
  saving.value = true
  try {
    const payload = {
      applicationId: props.applicationId,
      criteria: criteria.value,
      overallRemarks: overallRemarks.value,
      status: 'draft'
    }
    await apiClient.post('/v1/interviews', payload)
    Swal.fire({ icon: 'success', title: 'Draft Saved', showConfirmButton: false, timer: 1500 })
  } finally {
    saving.value = false
  }
}

const finalizeSubmission = async () => {
  const result = await swal.fire({
    title: 'Finalize Evaluation?',
    text: "You won't be able to edit this score after submission.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Submit Final Score'
  })
  if (!result.isConfirmed) return

  saving.value = true
  try {
    const payload = {
      applicationId: props.applicationId,
      criteria: criteria.value,
      overallRemarks: overallRemarks.value,
      status: 'submitted'
    }
    const { data } = await apiClient.post('/v1/interviews', payload)
    status.value = 'submitted'
    // Update local interview object or reload
    await loadExisting() 
    emit('submitted')
    Swal.fire('Submitted!', 'Evaluation has been finalized.', 'success')
  } finally {
    saving.value = false
  }
}

const exportIES = async () => {
  // We need the interview ID to export
  try {
    const { data } = await apiClient.get(`/v1/interviews/application/${props.applicationId}`)
    if (!data.data?._id) return Swal.fire('Error', 'No evaluation found to export.', 'error')

    const response = await apiClient.get(`/v1/interviews/${data.data._id}/export`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `IES-${props.candidateName}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    Swal.fire('Error', 'Failed to export PDF scorecard.', 'error')
  }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short' }) : '—'

onMounted(async () => {
  await Promise.all([
    loadExisting(),
    fetchCriteria(),
    fetchApplication()
  ])
})
</script>

<template>
  <div class="flex flex-col h-full bg-white animate-fade-in">
    <!-- Header -->
    <div class="p-6 border-b border-[var(--border-main)] bg-[var(--surface-2)]">
      <div class="flex items-center gap-4">
        <AppAvatar :src="avatarUrl" :name="candidateName" size="xl" />
        <div class="flex-1">
          <h2 class="text-xl font-extrabold text-[var(--text-main)] leading-tight">{{ candidateName }}</h2>
          <p class="text-sm font-medium text-[var(--text-muted)] mt-1">Applying for: <span class="text-[var(--color-primary)]">{{ jobTitle }}</span></p>
        </div>
        <div class="text-right">
          <AppBadge :variant="status === 'submitted' ? 'success' : 'gold'" class="mb-2">
            {{ status === 'submitted' ? 'Evaluated' : 'Evaluating' }}
          </AppBadge>
          <div class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Digital IES v2.0</div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <!-- Background Summary (NEW: Respects Relevance) -->
      <aside class="w-80 border-r border-[var(--border-main)] bg-[var(--bg-app)]/30 overflow-y-auto custom-scrollbar p-6 space-y-8">
        <div>
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)] mb-4">Background Summary</h3>
          <div v-if="totalFiltered > 0" class="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-xl">
             <p class="text-[10px] font-bold text-amber-700 leading-tight">
               <i class="pi pi-filter text-[9px] mr-1"></i>
               Showing relevant records only. {{ totalFiltered }} items were filtered out by HR.
             </p>
          </div>
        </div>

        <!-- Relevant Education -->
        <div class="space-y-3">
          <h4 class="text-[9px] font-bold uppercase text-[var(--text-muted)] flex justify-between">
            Education <span>{{ relevantEducation.length }}</span>
          </h4>
          <div v-for="edu in relevantEducation" :key="edu._id" class="p-3 bg-white border border-[var(--border-main)] rounded-lg shadow-sm">
            <p class="text-[10px] font-black uppercase text-[var(--text-main)] leading-tight">{{ edu.degree }}</p>
            <p class="text-[9px] font-medium text-[var(--text-muted)] mt-1">{{ edu.school }}</p>
          </div>
        </div>

        <!-- Relevant Experience -->
        <div class="space-y-3">
          <h4 class="text-[9px] font-bold uppercase text-[var(--text-muted)] flex justify-between">
            Experience <span>{{ relevantExperience.length }}</span>
          </h4>
          <div v-for="exp in relevantExperience" :key="exp._id" class="p-3 bg-white border border-[var(--border-main)] rounded-lg shadow-sm">
            <p class="text-[10px] font-black uppercase text-[var(--text-main)] leading-tight">{{ exp.position }}</p>
            <p class="text-[9px] font-medium text-[var(--text-muted)] mt-1">{{ exp.company }}</p>
            <p class="text-[8px] font-bold text-[var(--color-primary)] mt-1">{{ formatDate(exp.periodFrom) }} - {{ exp.isPresent ? 'Present' : formatDate(exp.periodTo) }}</p>
          </div>
        </div>

        <!-- Relevant Training -->
        <div class="space-y-3">
          <h4 class="text-[9px] font-bold uppercase text-[var(--text-muted)] flex justify-between">
            Training <span>{{ relevantTraining.length }}</span>
          </h4>
          <div v-for="trn in relevantTraining" :key="trn._id" class="p-3 bg-white border border-[var(--border-main)] rounded-lg shadow-sm">
            <p class="text-[10px] font-black uppercase text-[var(--text-main)] leading-tight">{{ trn.title }}</p>
            <p class="text-[9px] font-medium text-[var(--text-muted)] mt-1">{{ trn.hours }} Hours</p>
          </div>
        </div>
      </aside>

      <!-- Scoring Body -->
      <div class="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/30">
        <div class="max-w-2xl mx-auto space-y-8">
          
          <!-- Instruction -->
          <div class="p-5 bg-[var(--color-primary-light)]/30 rounded-2xl border border-[var(--color-primary-ring)]/20 shadow-sm">
            <p class="text-[11px] font-semibold text-[var(--color-primary-dark)] flex items-start gap-3 leading-relaxed">
              <i class="pi pi-info-circle mt-0.5 text-sm"></i>
              <span>Evaluate the candidate based on the Behavioral Event Interview (BEI) method. Provide scores and concise evidence-based remarks for each criterion below.</span>
            </p>
          </div>

          <!-- Criteria List -->
          <div class="space-y-6">
            <div v-for="(item, index) in criteria" :key="index" 
                 class="group relative p-6 border border-[var(--border-main)] rounded-2xl hover:border-[var(--color-primary-ring)] transition-all bg-white shadow-sm hover:shadow-md"
                 :class="{ 'opacity-60 pointer-events-none': status === 'submitted' }">
              
              <div class="flex justify-between items-start mb-5">
                <label class="text-sm font-black text-[var(--text-main)] group-hover:text-[var(--color-primary)] transition-colors uppercase tracking-tight">
                  {{ item.label }}
                </label>
                <div class="flex items-center gap-2 bg-[var(--bg-app)] px-3 py-1.5 rounded-xl border border-[var(--border-main)]">
                  <input 
                    type="number" 
                    v-model="item.score" 
                    :max="item.maxScore"
                    min="0"
                    step="0.5"
                    class="w-12 text-center text-sm font-black bg-transparent border-none outline-none tabular-nums"
                    placeholder="0"
                  />
                  <span class="text-[10px] font-black text-[var(--text-faint)]">/ {{ item.maxScore }}</span>
                </div>
              </div>

              <AppTextarea 
                v-model="item.remarks" 
                placeholder="Observations and behavioral evidence..." 
                rows="3"
                class="text-xs font-medium"
              />

              <!-- Warning if over max -->
              <p v-if="item.score > item.maxScore" class="absolute -bottom-5 left-2 text-[10px] font-bold text-red-500 animate-slide-down">
                Score cannot exceed maximum of {{ item.maxScore }}
              </p>
            </div>
          </div>

          <!-- Overall Remarks -->
          <div class="pt-8 border-t border-[var(--border-main)]">
            <label class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)] block mb-4">Overall Assessment & Recommendation</label>
            <AppTextarea 
              v-model="overallRemarks" 
              placeholder="Final panelist notes..." 
              rows="5"
              class="font-medium"
              :disabled="status === 'submitted'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky Footer / Score Summary -->
    <div class="p-6 border-t border-[var(--border-main)] bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.04)] z-10">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-10">
          <div>
            <p class="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)] mb-1">Running Total</p>
            <div class="flex items-baseline gap-2">
              <span class="text-4xl font-black text-[var(--text-main)] tracking-tighter tabular-nums">{{ totalScore.toFixed(1) }}</span>
              <span class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">/ {{ maxPossible }} points</span>
            </div>
          </div>

          <div class="h-10 w-px bg-[var(--border-main)]"></div>

          <div v-if="totalFiltered > 0" class="flex flex-col">
             <span class="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 mb-1">Relevance Filter</span>
             <span class="text-xs font-bold text-[var(--text-muted)]">{{ totalFiltered }} items hidden</span>
          </div>
        </div>

        <div class="flex gap-4">
          <AppButton 
            v-if="status === 'draft'"
            variant="secondary" 
            size="lg" 
            @click="saveDraft" 
            :loading="saving"
            class="px-8 font-black uppercase tracking-widest text-[10px]"
          >
            Save Draft
          </AppButton>
          
          <AppButton 
            v-if="status === 'draft'"
            variant="primary" 
            size="lg" 
            class="px-10 shadow-lg font-black uppercase tracking-widest text-[10px]"
            @click="finalizeSubmission"
            :loading="saving"
            :disabled="totalScore > maxPossible"
          >
            Submit Score
          </AppButton>

          <AppButton 
            v-else
            variant="primary"
            size="lg"
            @click="exportIES"
            class="px-8 font-black uppercase tracking-widest text-[10px]"
          >
            <i class="pi pi-download mr-2"></i> Export IES
          </AppButton>

          <AppButton 
            variant="secondary"
            size="lg"
            @click="emit('close')"
            class="px-8 font-black uppercase tracking-widest text-[10px]"
          >
            Close Sheet
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border-main);
  border-radius: 10px;
}

input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
</style>