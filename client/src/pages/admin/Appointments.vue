<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'
import { AppBadge, AppButton, AppCard, AppDrawer, AppInput, AppTextarea, AppPageHeader } from '@/components/ui'

const authStore = useAuthStore()
const toast = inject('$toast')

// ── BREADCRUMBS ───────────────────────────────────────────────────────────
const breadcrumbs = [
  { label: 'Selection', to: '/admin/dashboard' },
  { label: 'Appointments Hub', active: true },
]

// ── DATA ──────────────────────────────────────────────────────────────────
const jobs = ref([])
const poolData = ref(null)
const loading = ref(false)
const selectedJobId = ref('')

// Focus Mode: Appointment Decision
const selectedApp = ref(null)
const showDecisionDrawer = ref(false)
const appointing = ref(false)

const appointForm = ref({
  effectiveDate: '',
  itemNumber: '',
  remarks: ''
})

// ── METHODS ───────────────────────────────────────────────────────────────
const fetchJobs = async () => {
  const { data } = await apiClient.get('/v1/jobs')
  jobs.value = data.data
}

const loadPool = async () => {
  if (!selectedJobId.value) return
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

const openDecision = (item) => {
  selectedApp.value = item
  appointForm.value = { 
    effectiveDate: item.application?.appointmentData?.effectiveDate?.slice(0, 10) || '', 
    itemNumber: item.application?.appointmentData?.itemNumber || '', 
    remarks: item.application?.appointmentData?.remarks || '' 
  }
  showDecisionDrawer.value = true
}

const submitAppointment = async () => {
  appointing.value = true
  try {
    await apiClient.patch(`/v1/appointments/${selectedApp.value.application._id}/appoint`, appointForm.value)
    toast.fire({ icon: 'success', title: 'Selection Finalized' })
    showDecisionDrawer.value = false
    loadPool()
  } catch {
    toast.fire({ icon: 'error', title: 'Action Failed' })
  } finally {
    appointing.value = false
  }
}

const getJobTitle = () => jobs.value.find(j => j._id === selectedJobId.value)?.positionTitle || 'Vacancy'

onMounted(fetchJobs)
</script>

<template>
  <div class="flex flex-col gap-6 h-full">
    <AppPageHeader title="Appointments Hub" subtitle="Finalize candidate selection and issue appointment decisions." icon="pi-star" />

    <!-- 1. Selection Toolbar -->
    <header class="bg-[var(--surface)] border border-[var(--border-main)] p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
      <select v-model="selectedJobId" @change="loadPool"
        class="w-full sm:w-96 h-10 px-4 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl text-sm font-bold text-[var(--text-main)] focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all outline-none">
        <option value="">Select vacancy for appointment...</option>
        <option v-for="job in jobs" :key="job._id" :value="job._id">{{ job.positionTitle }} - {{ job.placeOfAssignment }}</option>
      </select>
      <div v-if="poolData" class="flex items-center gap-2">
         <span class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mr-2">Hiring Track:</span>
         <AppBadge variant="neutral">{{ poolData.hiringTrack }}</AppBadge>
      </div>
    </header>

    <!-- 2. The Selection Pool (Top 5) -->
    <div v-if="poolData" class="flex-1 overflow-y-auto custom-scrollbar">
       <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="item in poolData.pool" :key="item._id" 
            @click="openDecision(item)"
            :class="['group card-raised p-8 flex flex-col transition-all cursor-pointer relative overflow-hidden',
              item.application?.status === 'appointed' ? 'bg-emerald-50/30 border-emerald-200' : 'bg-[var(--surface)] hover:border-[var(--color-primary)] hover:shadow-xl hover:-translate-y-0.5']">

             <!-- Rank Indicator -->
             <div class="flex justify-between items-start mb-8">
                <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black',
                  item.rank <= 3 ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--bg-app)] text-[var(--text-muted)]']">
                  #{{ item.rank }}
                </div>
                <AppBadge v-if="item.application?.status === 'appointed'" variant="success">Appointed</AppBadge>
             </div>

             <h3 class="text-lg font-black text-[var(--text-main)] tracking-tight leading-none truncate">{{ item.applicantName }}</h3>
             <p class="text-xs font-mono text-[var(--text-muted)] mt-2 uppercase tracking-tighter">{{ item.application?.applicationCode }}</p>

             <!-- Decision Merit -->
             <div class="mt-10 space-y-4">
                <div class="flex justify-between items-end">
                   <div>
                      <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Final Weighted Score</p>
                      <p class="text-2xl font-black text-[var(--text-main)] tabular-nums">{{ item.totalPoints.toFixed(2) }}</p>
                   </div>
                   <div class="text-right">
                      <p class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Residency</p>
                      <i v-if="item.residencyPriority" class="pi pi-home text-[var(--color-primary)]" title="Bona fide resident"></i>
                      <span v-else class="text-[var(--text-faint)]">—</span>
                   </div>
                </div>
                <div class="h-1.5 bg-[var(--bg-app)] rounded-full overflow-hidden">
                   <div class="h-full bg-[var(--color-primary)] transition-all duration-1000" :style="{ width: `${item.totalPoints}%` }"></div>
                </div>
             </div>

             <div class="mt-8 pt-6 border-t border-[var(--border-main)]">
                <AppButton variant="secondary" block size="sm">
                  {{ item.application?.status === 'appointed' ? 'View Appointment' : 'Open Decision Station' }}
                </AppButton>
             </div>
          </div>
       </div>
    </div>

    <!-- Empty/Loading States -->
    <div v-else-if="selectedJobId" class="flex-1 flex flex-col items-center justify-center text-center py-20">
       <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center mb-4">
         <i class="pi pi-users text-2xl text-[var(--text-muted)]"></i>
       </div>
       <h3 class="text-base font-bold text-[var(--text-main)]">No selection pool found</h3>
       <p class="text-sm text-[var(--text-muted)] mt-1 max-w-xs">Ranking must be finalized before candidates appear in the selection pool.</p>
    </div>

    <!-- 3. FOCUS MODE: APPOINTMENT STATION (DRAWER) -->
    <AppDrawer 
      :show="showDecisionDrawer" 
      :title="selectedApp?.applicantName" 
      :subtitle="`Decision Station for #${selectedApp?.rank} Ranked Candidate`"
      size="lg"
      @close="showDecisionDrawer = false">
      
      <div class="flex flex-col gap-10 py-4">
         
         <!-- Summary Identity -->
         <div class="p-8 rounded-2xl relative overflow-hidden" style="background: var(--color-navy);">
            <div class="relative z-10">
               <div class="flex justify-between items-start">
                  <div>
                     <AppBadge variant="primary" class="mb-4">Selection Tier</AppBadge>
                     <h2 class="text-2xl font-black text-white tracking-tight leading-none">{{ selectedApp?.applicantName }}</h2>
                     <p class="text-xs font-bold uppercase tracking-widest mt-2" style="color: var(--color-silver-blue);">Ranked #{{ selectedApp?.rank }} • Score: {{ selectedApp?.totalPoints.toFixed(2) }}</p>
                  </div>
                  <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-black text-white">
                     {{ selectedApp?.applicantName.charAt(0) }}
                  </div>
               </div>
            </div>
            <div class="absolute -bottom-12 -right-12 w-48 h-48 rounded-full" style="background: var(--color-primary); opacity: 0.1; filter: blur(60px);"></div>
         </div>

         <!-- Decision Workflow -->
         <div class="space-y-8">
            <section class="space-y-4">
               <h4 class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border-main)] pb-2">Appointment Metadata</h4>
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="flex flex-col gap-2">
                     <label class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-tighter">Effective Date</label>
                     <AppInput v-model="appointForm.effectiveDate" type="date" />
                  </div>
                  <div class="flex flex-col gap-2">
                     <label class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-tighter">Plantilla Item Number</label>
                     <AppInput v-model="appointForm.itemNumber" placeholder="e.g. OSEC-DECSB-TCHR1-..." />
                  </div>
               </div>
               <div class="flex flex-col gap-2">
                  <label class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-tighter">SDS Deliberation Remarks</label>
                  <AppTextarea v-model="appointForm.remarks" placeholder="Optional notes for the official record..." rows="4" />
               </div>
            </section>

            <!-- Compliance Guard -->
            <div class="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
               <i class="pi pi-shield text-amber-600 mt-1"></i>
               <div>
                  <p class="text-[11px] font-black text-amber-800 uppercase tracking-tight">Legal Notice</p>
                  <p class="text-[10px] text-amber-700 leading-relaxed mt-1">Confirming this appointment will lock the candidate's record and notify the HRMO for document preparation. This action is irreversible.</p>
               </div>
            </div>
         </div>

         <!-- Action Bar -->
         <div class="flex gap-3 pt-6 border-t border-[var(--border-main)]">
            <AppButton variant="primary" block size="lg" :loading="appointing" @click="submitAppointment">
               Finalize Official Appointment
            </AppButton>
            <AppButton variant="secondary" @click="showDecisionDrawer = false">Cancel</AppButton>
         </div>

      </div>
    </AppDrawer>

  </div>
</template>

