<script setup>
import { ref, computed, onMounted, watch } from 'vue'
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

// ...

const fetchCriteria = async () => {
  try {
    // If we have an existing draft, use it
    if (criteria.value.length > 0) return

    // Else fetch from Rubric model
    const { data } = await apiClient.get(`/v1/rubrics/track/${props.hiringTrack || 'non_teaching'}`)
    if (data.data) {
      criteria.value = data.data.criteria.map(c => ({
        label: c.label,
        score: 0,
        maxScore: c.maxPoints,
        remarks: ''
      }))
    } else {
      // Fallback
      criteria.value = [
        { label: 'Communication Skills', score: 0, maxScore: 25, remarks: '' },
        { label: 'Ability to Present Ideas', score: 0, maxScore: 25, remarks: '' },
        { label: 'Judgment & Decision Making', score: 0, maxScore: 25, remarks: '' },
        { label: 'Potential & Personality', score: 0, maxScore: 25, remarks: '' }
      ]
    }
  } catch (err) {
    console.error("Failed to load rubric", err)
  }
}

onMounted(async () => {
  await loadExisting()
  await fetchCriteria()
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

    <!-- Scoring Body -->
    <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
      <div class="max-w-2xl mx-auto space-y-8">
        
        <!-- Instruction -->
        <div class="p-4 bg-[var(--color-primary-light)] rounded-xl border border-[var(--color-primary-ring)]">
          <p class="text-xs font-semibold text-[var(--color-primary-dark)] flex items-start gap-2">
            <i class="pi pi-info-circle mt-0.5"></i>
            <span>Evaluate the candidate based on the Behavioral Event Interview (BEI) method. Provide scores and concise evidence-based remarks for each criterion.</span>
          </p>
        </div>

        <!-- Criteria List -->
        <div class="space-y-6">
          <div v-for="(item, index) in criteria" :key="index" 
               class="group relative p-6 border border-[var(--border-main)] rounded-2xl hover:border-[var(--color-primary-ring)] transition-all bg-white hover:shadow-sm"
               :class="{ 'opacity-60 pointer-events-none': status === 'submitted' }">
            
            <div class="flex justify-between items-start mb-4">
              <label class="text-sm font-bold text-[var(--text-main)] group-hover:text-[var(--color-primary)] transition-colors">
                {{ item.label }}
              </label>
              <div class="flex items-baseline gap-1">
                <input 
                  type="number" 
                  v-model="item.score" 
                  :max="item.maxScore"
                  min="0"
                  step="0.5"
                  class="w-16 h-8 text-center text-sm font-black bg-[var(--bg-app)] border-none rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  placeholder="0"
                />
                <span class="text-[10px] font-bold text-[var(--text-faint)]">/ {{ item.maxScore }}</span>
              </div>
            </div>

            <AppTextarea 
              v-model="item.remarks" 
              placeholder="Observations and behavioral evidence..." 
              rows="2"
              class="text-xs"
            />

            <!-- Warning if over max -->
            <p v-if="item.score > item.maxScore" class="absolute -bottom-5 left-2 text-[10px] font-bold text-red-500 animate-slide-down">
              Score cannot exceed maximum of {{ item.maxScore }}
            </p>
          </div>
        </div>

        <!-- Overall Remarks -->
        <div class="pt-4 border-t border-[var(--border-main)]">
          <label class="text-xs font-black uppercase tracking-widest text-[var(--text-faint)] block mb-3">Overall Assessment & Recommendation</label>
          <AppTextarea 
            v-model="overallRemarks" 
            placeholder="Final panelist notes..." 
            rows="4"
            :disabled="status === 'submitted'"
          />
        </div>
      </div>
    </div>

    <!-- Sticky Footer / Score Summary -->
    <div class="p-6 border-t border-[var(--border-main)] bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <div class="max-w-2xl mx-auto flex items-center justify-between">
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)]">Running Total</p>
          <div class="flex items-baseline gap-2">
            <span class="text-4xl font-black text-[var(--text-main)] tracking-tighter">{{ totalScore.toFixed(1) }}</span>
            <span class="text-sm font-bold text-[var(--text-faint)]">/ {{ maxPossible }} points</span>
          </div>
        </div>

        <div class="flex gap-3">
          <AppButton 
            v-if="status === 'draft'"
            variant="secondary" 
            size="lg" 
            @click="saveDraft" 
            :loading="saving"
          >
            Save Progress
          </AppButton>
          
          <AppButton 
            v-if="status === 'draft'"
            variant="primary" 
            size="lg" 
            class="px-8 shadow-primary"
            @click="finalizeSubmission"
            :loading="saving"
            :disabled="totalScore > maxPossible"
          >
            Complete Evaluation
          </AppButton>

          <AppButton 
            v-else
            variant="secondary"
            size="lg"
            @click="emit('close')"
          >
            Close Sheet
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Refined input styling */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
</style>
