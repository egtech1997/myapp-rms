<script setup>
import { ref, onMounted } from 'vue'
import apiClient from '@/api/axios'
import { AppCard, AppBadge, AppButton, AppInput, AppAvatar } from '@/components/ui'
import Swal from 'sweetalert2'

const props = defineProps({
  jobId: { type: String, required: true }
})

const pool = ref([])
const loading = ref(false)
const issuing = ref(false)

const fetchPool = async () => {
  loading.value = true
  try {
    const { data } = await apiClient.get(`/v1/appointments/pool/${props.jobId}`)
    pool.value = data.data.rankings
  } catch (err) {
    console.error('Failed to fetch selection pool', err)
  } finally {
    loading.value = false
  }
}

const selectedCandidate = ref(null)
const appointmentForm = ref({
  nature: 'original',
  status: 'permanent',
  effectiveDate: new Date().toISOString().split('T')[0],
  salary: 0,
  formMetadata: {
    station: '',
    itemNumber: '',
    vouchers: ''
  }
})

const openAppointModal = (candidate) => {
  selectedCandidate.value = candidate
  appointmentForm.value.salary = candidate.application.submittedTo?.salary || 0
}

const handleAppoint = async () => {
  const confirm = await Swal.fire({
    title: 'Confirm Appointment?',
    text: `You are about to officially appoint ${selectedCandidate.value.applicantName}. This action will be logged.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Issue Appointment'
  })

  if (!confirm.isConfirmed) return

  issuing.value = true
  try {
    await apiClient.patch('/v1/appointments/appoint', {
      applicationId: selectedCandidate.value.application._id,
      ...appointmentForm.value
    })
    
    Swal.fire('Success', 'Appointment issued and candidate notified.', 'success')
    selectedCandidate.value = null
    fetchPool()
  } catch (err) {
    Swal.fire('Error', err.response?.data?.message || 'Failed to issue appointment', 'error')
  } finally {
    issuing.value = false
  }
}

onMounted(fetchPool)
</script>

<template>
  <div class="flex flex-col gap-6 animate-fade-in">
    <!-- Selection Pool Table -->
    <div class="bg-white border border-[var(--border-main)] rounded-[var(--radius-2xl)] overflow-hidden shadow-sm">
      <div class="p-6 border-b border-[var(--border-main)] bg-[var(--surface-2)]">
        <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Selection Pool (RQA Top Candidates)</h3>
        <p class="text-[10px] text-[var(--text-muted)] font-bold uppercase mt-1">Candidates are sorted by final RQA rank</p>
      </div>

      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-white border-b border-[var(--border-main)]">
            <th class="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Rank</th>
            <th class="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Candidate</th>
            <th class="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Total Points</th>
            <th class="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Status</th>
            <th class="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--border-main)]">
          <tr v-for="item in pool" :key="item._id" 
              class="hover:bg-[var(--bg-app)] transition-colors group"
              :class="{ 'opacity-50': item.application?.status === 'appointed' }">
            <td class="p-4">
              <div :class="['w-7 h-7 rounded-[var(--radius-md)] flex items-center justify-center text-[10px] font-black border', 
                item.rank <= 5 ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-700']">
                {{ item.rank }}
              </div>
            </td>
            <td class="p-4">
              <div class="flex items-center gap-3">
                <AppAvatar :src="item.application?.submittedBy?.avatarUrl" :name="item.applicantName" size="xs" />
                <div class="min-w-0">
                  <p class="text-xs font-black text-[var(--text-main)] truncate">{{ item.applicantName }}</p>
                  <p class="text-[9px] font-bold text-[var(--text-faint)] uppercase">{{ item.application?.applicationCode || 'NO_CODE' }}</p>
                </div>
              </div>
            </td>
            <td class="p-4">
              <span class="text-xs font-black text-[var(--color-primary)]">{{ item.totalPoints.toFixed(2) }}</span>
            </td>
            <td class="p-4">
              <AppBadge :variant="item.application?.status === 'appointed' ? 'success' : 'secondary'" size="xs">
                {{ item.application?.status === 'appointed' ? 'Appointed' : 'Eligible' }}
              </AppBadge>
            </td>
            <td class="p-4 text-right">
              <AppButton v-if="item.application?.status !== 'appointed'" 
                variant="primary" size="sm" @click="openAppointModal(item)">
                Appoint
              </AppButton>
              <i v-else class="pi pi-check-circle text-green-500"></i>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Appointment Modal -->
    <Teleport to="body">
      <div v-if="selectedCandidate" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" @click.self="selectedCandidate = null">
        <div class="bg-white rounded-[var(--radius-2xl)] shadow-2xl border border-[var(--border-main)] w-full max-w-xl overflow-hidden animate-zoom-in">
          <div class="p-6 border-b border-[var(--border-main)] bg-[var(--surface-2)]">
            <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Prepare Appointment (CS Form 33-A)</h3>
            <p class="text-xs text-[var(--text-muted)] mt-1">Appointing: <span class="font-bold text-[var(--text-main)]">{{ selectedCandidate.applicantName }}</span></p>
          </div>
          
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Nature of Appointment</label>
                <select v-model="appointmentForm.nature" class="input text-xs">
                  <option value="original">Original</option>
                  <option value="promotion">Promotion</option>
                  <option value="transfer">Transfer</option>
                  <option value="reemployment">Reemployment</option>
                </select>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Employment Status</label>
                <select v-model="appointmentForm.status" class="input text-xs">
                  <option value="permanent">Permanent</option>
                  <option value="temporary">Temporary</option>
                  <option value="provisional">Provisional</option>
                  <option value="substitute">Substitute</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Effective Date</label>
                <input type="date" v-model="appointmentForm.effectiveDate" class="input text-xs" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Monthly Salary (PHP)</label>
                <input type="number" v-model="appointmentForm.salary" class="input text-xs" />
              </div>
            </div>

            <div class="p-4 bg-[var(--surface-2)] rounded-[var(--radius-xl)] border border-[var(--border-main)] space-y-3">
              <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Form Metadata</p>
              <div class="flex flex-col gap-1.5">
                <label class="text-[9px] font-bold text-[var(--text-muted)] uppercase">Station / Office</label>
                <input type="text" v-model="appointmentForm.formMetadata.station" placeholder="e.g. SDO Manila" class="input text-xs h-8" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[9px] font-bold text-[var(--text-muted)] uppercase">Item Number (PSI-POP)</label>
                <input type="text" v-model="appointmentForm.formMetadata.itemNumber" placeholder="e.g. OSEC-DECSB-TCH1-2023" class="input text-xs h-8" />
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-[var(--border-main)] bg-[var(--surface-2)] flex justify-end gap-3">
            <AppButton variant="secondary" size="md" @click="selectedCandidate = null">Cancel</AppButton>
            <AppButton variant="primary" size="md" @click="handleAppoint" :loading="issuing">Issue Appointment</AppButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
