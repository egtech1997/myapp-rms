<script setup>
import { ref, onMounted, watch } from 'vue'
import apiClient from '@/api/axios'
import { AppCard, AppBadge, AppAvatar, AppInput, AppButton } from '@/components/ui'

const logs = ref([])
const loading = ref(false)
const totalLogs = ref(0)
const page = ref(1)
const totalPages = ref(1)

const filters = ref({
  action: '',
  severity: '',
  entityModel: ''
})

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      ...filters.value
    }
    const { data } = await apiClient.get('/v1/audit-logs', { params })
    logs.value = data.data
    totalLogs.value = data.pagination.total
    totalPages.value = data.pagination.pages
  } catch (err) {
    console.error('Failed to fetch audit logs', err)
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

const getSeverityClass = (sev) => {
  switch (sev) {
    case 'critical': return 'bg-red-100 text-red-700 border-red-200'
    case 'high':     return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'medium':   return 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--border-main)]'
    default:         return 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border-main)]'
  }
}

const selectedLog = ref(null)

const openDiff = (log) => {
  selectedLog.value = log
}

watch([filters, page], fetchLogs, { deep: true })

onMounted(fetchLogs)
</script>

<template>
  <div class="flex flex-col gap-6 animate-fade-in">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-black text-[var(--text-main)] tracking-tight">Audit Logs</h1>
        <p class="text-sm text-[var(--text-muted)]">Track every administrative action and system change.</p>
      </div>
      <div class="flex items-center gap-2">
        <AppBadge variant="secondary">{{ totalLogs }} Entries</AppBadge>
        <AppButton variant="secondary" size="sm" @click="fetchLogs" :loading="loading">
          <i class="pi pi-refresh mr-2"></i> Refresh
        </AppButton>
      </div>
    </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white border border-[var(--border-main)] rounded-[var(--radius-2xl)]">
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Action Type</label>
        <select v-model="filters.action" class="input text-xs">
          <option value="">All Actions</option>
          <option value="APPLICATION_UPDATE">Application Update</option>
          <option value="SCORE_SUBMIT">Score Submit</option>
          <option value="RQA_GENERATE">RQA Generate</option>
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Entity</label>
        <select v-model="filters.entityModel" class="input text-xs">
          <option value="">All Entities</option>
          <option value="Application">Application</option>
          <option value="Interview">Interview</option>
          <option value="Job">Job</option>
          <option value="CAL">Ranking (CAL)</option>
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Severity</label>
        <select v-model="filters.severity" class="input text-xs">
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div class="flex items-end">
        <AppButton variant="primary" class="w-full" @click="page = 1; fetchLogs()">Apply Filters</AppButton>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="bg-white border border-[var(--border-main)] rounded-[var(--radius-2xl)] overflow-hidden shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-[var(--surface-2)] border-b border-[var(--border-main)]">
            <th class="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Timestamp</th>
            <th class="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Admin/Actor</th>
            <th class="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Action</th>
            <th class="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Severity</th>
            <th class="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Changes</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--border-main)]">
          <tr v-if="loading" v-for="i in 5" :key="i" class="animate-pulse">
            <td v-for="j in 5" :key="j" class="p-4"><div class="h-4 bg-[var(--surface-2)] rounded-[var(--radius-sm)] w-3/4"></div></td>
          </tr>
          <tr v-else v-for="log in logs" :key="log._id" class="hover:bg-[var(--bg-app)] transition-colors group">
            <td class="p-4">
              <p class="text-[11px] font-black text-[var(--text-main)]">{{ formatDate(log.createdAt).split(',')[1] }}</p>
              <p class="text-[10px] font-bold text-[var(--text-faint)]">{{ formatDate(log.createdAt).split(',')[0] }}</p>
            </td>
            <td class="p-4">
              <div class="flex items-center gap-3">
                <AppAvatar :src="log.actor?.avatarUrl" :name="log.actor?.username" size="xs" />
                <div class="min-w-0">
                  <p class="text-xs font-black text-[var(--text-main)] truncate">{{ log.actor?.name?.firstName || log.actor?.username }}</p>
                  <p class="text-[9px] font-bold text-[var(--text-faint)]">{{ log.ipAddress }}</p>
                </div>
              </div>
            </td>
            <td class="p-4">
              <p class="text-[11px] font-black text-[var(--color-primary)]">{{ log.action }}</p>
              <p class="text-[10px] text-[var(--text-muted)] line-clamp-1">{{ log.description }}</p>
            </td>
            <td class="p-4">
              <span :class="['text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest', getSeverityClass(log.severity)]">
                {{ log.severity }}
              </span>
            </td>
            <td class="p-4">
              <button @click="openDiff(log)" 
                class="text-[10px] font-black text-[var(--color-primary)] hover:underline flex items-center gap-1">
                <i class="pi pi-eye"></i> View Diff
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between">
      <p class="text-xs font-bold text-[var(--text-faint)]">Showing page {{ page }} of {{ totalPages }}</p>
      <div class="flex gap-2">
        <AppButton variant="secondary" size="sm" :disabled="page === 1" @click="page--">Previous</AppButton>
        <AppButton variant="secondary" size="sm" :disabled="page === totalPages" @click="page++">Next</AppButton>
      </div>
    </div>

    <!-- Diff Modal (Simplified) -->
    <Teleport to="body">
      <div v-if="selectedLog" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" @click.self="selectedLog = null">
        <div class="bg-white rounded-[var(--radius-2xl)] shadow-2xl border border-[var(--border-main)] w-full max-w-2xl overflow-hidden animate-zoom-in">
          <div class="p-6 border-b border-[var(--border-main)] bg-[var(--surface-2)] flex justify-between items-center">
            <div>
              <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Transaction Audit</h3>
              <p class="text-xs text-[var(--text-muted)]">ID: {{ selectedLog._id }}</p>
            </div>
            <AppButton variant="secondary" size="sm" @click="selectedLog = null">Close</AppButton>
          </div>
          <div class="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div class="grid grid-cols-2 gap-6">
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-red-500 mb-3">Previous State</p>
                <div class="p-4 bg-red-50/50 rounded-[var(--radius-xl)] border border-red-100 text-[11px] font-mono whitespace-pre-wrap overflow-x-auto">
                  {{ JSON.stringify(selectedLog.diff.before, null, 2) }}
                </div>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-green-500 mb-3">Updated State</p>
                <div class="p-4 bg-green-50/50 rounded-[var(--radius-xl)] border border-green-100 text-[11px] font-mono whitespace-pre-wrap overflow-x-auto">
                  {{ JSON.stringify(selectedLog.diff.after, null, 2) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
