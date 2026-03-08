<script setup>
import { ref, onMounted, computed } from 'vue'
import apiClient from '@/api/axios'
import { AppCard, AppButton, AppInput, AppTextarea, AppBadge, AppAvatar } from '@/components/ui'
import Swal from 'sweetalert2'

const loading = ref(false)
const sending = ref(false)
const candidates = ref([])
const selectedIds = ref(new Set())
const history = ref([])

const form = ref({
  subject: '',
  content: '',
  type: 'both',
  category: 'custom'
})

const fetchCandidates = async () => {
  loading.value = true
  try {
    // For MVP, we fetch the first 50 applications. 
    // In production, this would be linked to the SearchDashboard's selection.
    const { data } = await apiClient.get('/v1/applications/all?limit=50')
    candidates.value = data.data
  } catch (err) {
    console.error('Failed to fetch candidates', err)
  } finally {
    loading.value = false
  }
}

const fetchHistory = async () => {
  try {
    const { data } = await apiClient.get('/v1/bulk/history')
    history.value = data.data
  } catch (err) {
    console.error('Failed to fetch bulk history', err)
  }
}

const toggleSelection = (id) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  else selectedIds.value.add(id)
}

const selectAll = () => {
  if (selectedIds.value.size === candidates.value.length) selectedIds.value.clear()
  else candidates.value.forEach(c => selectedIds.value.add(c._id))
}

const handleSend = async () => {
  if (selectedIds.value.size === 0) return Swal.fire('Error', 'Please select at least one recipient.', 'error')
  if (!form.value.subject || !form.value.content) return Swal.fire('Error', 'Subject and content are required.', 'error')

  const confirm = await Swal.fire({
    title: 'Send Bulk Message?',
    text: `You are about to send this message to ${selectedIds.value.size} candidates.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Send Now'
  })

  if (!confirm.isConfirmed) return

  sending.value = true
  try {
    const recipients = candidates.value
      .filter(c => selectedIds.value.has(c._id))
      .map(c => ({ applicationId: c._id, userId: c.submittedBy._id }))

    await apiClient.post('/v1/bulk/send', {
      ...form.value,
      recipients
    })

    Swal.fire('Queued!', 'Your messages are being processed in the background.', 'success')
    selectedIds.value.clear()
    form.value.subject = ''
    form.value.content = ''
    fetchHistory()
  } catch (err) {
    Swal.fire('Error', 'Failed to initiate bulk communication.', 'error')
  } finally {
    sending.value = false
  }
}

const formatDate = (date) => new Date(date).toLocaleString()

onMounted(() => {
  fetchCandidates()
  fetchHistory()
})
</script>

<template>
  <div class="flex flex-col gap-8 animate-fade-in pb-12">
    <div class="flex justify-between items-end">
      <div>
        <h1 class="text-3xl font-black text-[var(--text-main)] tracking-tight">Bulk Communications</h1>
        <p class="text-sm text-[var(--text-muted)] font-medium">Send mass notifications, interview invites, or status updates.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- LEFT: Composition Form -->
      <div class="lg:col-span-1 space-y-6">
        <div class="p-6 bg-[var(--surface)] border border-[var(--border-main)] rounded-3xl shadow-sm space-y-6">
          <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Compose Message</h3>
          
          <div class="space-y-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-black text-[var(--text-faint)] uppercase">Communication Type</label>
              <select v-model="form.type" class="input text-xs">
                <option value="both">Email & In-App</option>
                <option value="email">Email Only</option>
                <option value="in_app">In-App Only</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-black text-[var(--text-faint)] uppercase">Category</label>
              <select v-model="form.category" class="input text-xs">
                <option value="custom">Custom Message</option>
                <option value="interview_invite">Interview Invitation</option>
                <option value="status_update">Status Update</option>
                <option value="announcement">Official Announcement</option>
              </select>
            </div>

            <AppInput v-model="form.subject" label="Subject Line" placeholder="e.g. Interview Schedule for Teacher I" />
            
            <AppTextarea v-model="form.content" label="Message Content" placeholder="Type your message here..." rows="8" />
          </div>

          <div class="pt-4 border-t border-[var(--border-main)]">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-bold text-[var(--text-muted)]">Selected Recipients:</span>
              <AppBadge variant="primary">{{ selectedIds.size }}</AppBadge>
            </div>
            <AppButton variant="primary" class="w-full shadow-primary" @click="handleSend" :loading="sending" :disabled="selectedIds.size === 0">
              <i class="pi pi-send mr-2"></i> Send to Selected
            </AppButton>
          </div>
        </div>

        <!-- Recent History -->
        <div class="p-6 bg-[var(--surface-2)] border border-[var(--border-main)] rounded-3xl space-y-4">
          <h3 class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Recently Sent</h3>
          <div class="space-y-3">
            <div v-for="h in history" :key="h._id" class="p-3 bg-white rounded-xl border border-[var(--border-main)] text-xs">
              <p class="font-black text-[var(--text-main)] truncate">{{ h.subject }}</p>
              <div class="flex justify-between items-center mt-2">
                <span class="text-[9px] font-bold text-[var(--text-faint)]">{{ formatDate(h.createdAt) }}</span>
                <AppBadge variant="success" size="xs">{{ h.stats.success }} / {{ h.stats.total }}</AppBadge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Candidate Selection -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-white border border-[var(--border-main)] rounded-3xl overflow-hidden shadow-sm">
          <div class="p-6 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--surface-2)]">
            <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Recipient Selection</h3>
            <AppButton variant="secondary" size="xs" @click="selectAll">
              {{ selectedIds.size === candidates.length ? 'Deselect All' : 'Select All' }}
            </AppButton>
          </div>

          <div class="max-h-[700px] overflow-y-auto custom-scrollbar">
            <table class="w-full text-left border-collapse">
              <thead class="sticky top-0 bg-[var(--surface)] z-10 shadow-sm">
                <tr class="border-b border-[var(--border-main)]">
                  <th class="p-4 w-12 text-center"></th>
                  <th class="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Candidate</th>
                  <th class="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Application</th>
                  <th class="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--border-main)]">
                <tr v-for="c in candidates" :key="c._id" 
                  class="hover:bg-[var(--bg-app)] transition-colors cursor-pointer"
                  @click="toggleSelection(c._id)">
                  <td class="p-4 text-center">
                    <input type="checkbox" :checked="selectedIds.has(c._id)" class="w-4 h-4 rounded border-[var(--border-main)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                  </td>
                  <td class="p-4">
                    <div class="flex items-center gap-3">
                      <AppAvatar :src="c.submittedBy?.avatarUrl" :name="c.applicantData?.personalInfo?.lastName" size="xs" />
                      <div class="min-w-0">
                        <p class="text-xs font-black text-[var(--text-main)] truncate">
                          {{ c.applicantData?.personalInfo?.firstName }} {{ c.applicantData?.personalInfo?.lastName }}
                        </p>
                        <p class="text-[9px] font-bold text-[var(--text-faint)]">{{ c.submittedBy?.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="p-4">
                    <p class="text-[10px] font-black text-[var(--text-main)] uppercase">{{ c.applicationCode }}</p>
                    <p class="text-[9px] font-bold text-[var(--text-muted)] truncate">{{ c.job?.positionTitle }}</p>
                  </td>
                  <td class="p-4">
                    <AppBadge size="xs" :variant="c.status === 'ranked' ? 'success' : 'gold'">{{ c.status }}</AppBadge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
