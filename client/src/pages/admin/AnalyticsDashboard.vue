<script setup>
import { ref, onMounted, computed } from 'vue'
import apiClient from '@/api/axios'
import { StatCard, AppBadge, AppButton } from '@/components/ui'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement
} from 'chart.js'
import { Bar, Line, Pie } from 'vue-chartjs'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement
)

const loading = ref(true)
const overview = ref(null)
const trends = ref({ appTrends: [], apptTrends: [] })
const demographics = ref({ sexDist: [], eduDist: [] })
const efficiency = ref(null)

const fetchData = async () => {
  loading.value = true
  try {
    const [ovRes, trRes, dmRes, efRes] = await Promise.all([
      apiClient.get('/v1/analytics/overview'),
      apiClient.get('/v1/analytics/trends'),
      apiClient.get('/v1/analytics/demographics'),
      apiClient.get('/v1/analytics/efficiency')
    ])
    overview.value = ovRes.data.data
    trends.value = trRes.data.data
    demographics.value = dmRes.data.data
    efficiency.value = efRes.data.data
  } catch (err) {
    console.error('Failed to load analytics', err)
  } finally {
    loading.value = false
  }
}

// ── Chart Data Computations ──────────────────────────────────────────

const trendChartData = computed(() => ({
  labels: trends.value.appTrends.map(t => `${t._id.month}/${t._id.year}`),
  datasets: [
    {
      label: 'Applications',
      backgroundColor: '#4A4D8F',
      borderColor: '#4A4D8F',
      data: trends.value.appTrends.map(t => t.count),
      fill: false,
      tension: 0.4
    },
    {
      label: 'Appointments',
      backgroundColor: '#10b981',
      borderColor: '#10b981',
      data: trends.value.apptTrends.map(t => t.count),
      fill: false,
      tension: 0.4
    }
  ]
}))

const sexChartData = computed(() => ({
  labels: demographics.value.sexDist.map(d => d._id || 'Unknown'),
  datasets: [
    {
      backgroundColor: ['#3b82f6', '#f472b6', '#94a3b8'],
      data: demographics.value.sexDist.map(d => d.count)
    }
  ]
}))

const eduChartData = computed(() => ({
  labels: demographics.value.eduDist.map(d => d._id || 'Other'),
  datasets: [
    {
      label: 'Applicants',
      backgroundColor: '#6366f1',
      data: demographics.value.eduDist.map(d => d.count)
    }
  ]
}))

onMounted(fetchData)
</script>

<template>
  <div class="flex flex-col gap-8 animate-fade-in pb-12">
    <!-- Header -->
    <div class="flex justify-between items-end">
      <div>
        <h1 class="text-3xl font-black text-[var(--text-main)] tracking-tight">System Analytics</h1>
        <p class="text-sm text-[var(--text-muted)] font-medium">Real-time recruitment performance and demographic insights.</p>
      </div>
      <AppButton variant="secondary" size="sm" @click="fetchData">
        <i class="pi pi-refresh mr-2"></i> Update Data
      </AppButton>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
      <div v-for="i in 4" :key="i" class="h-32 bg-white rounded-2xl border border-[var(--border-main)]"></div>
    </div>

    <!-- Quick Metrics -->
    <div v-else-if="overview" class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard label="Active Vacancies" :value="overview.metrics.totalJobs" icon="pi pi-briefcase" color="blue" />
      <StatCard label="Total Applicants" :value="overview.metrics.totalApplications" icon="pi pi-users" color="indigo" />
      <StatCard label="Appointed" :value="overview.metrics.totalAppointments" icon="pi pi-verified" color="green" />
      <StatCard label="Avg. Process Time" :value="efficiency?.avgVerificationDays?.toFixed(1) + ' Days'" icon="pi pi-clock" color="amber" />
    </div>

    <!-- Charts Row 1: Trends -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 p-6 bg-[var(--surface)] border border-[var(--border-main)] rounded-3xl shadow-sm">
        <h3 class="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-faint)] mb-6">Recruitment Velocity (Last 6 Months)</h3>
        <div class="h-80">
          <Line :data="trendChartData" :options="{ responsive: true, maintainAspectRatio: false }" />
        </div>
      </div>

      <div class="p-6 bg-[var(--surface)] border border-[var(--border-main)] rounded-3xl shadow-sm">
        <h3 class="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-faint)] mb-6">Applicant Gender Ratio</h3>
        <div class="h-80 flex items-center justify-center">
          <Pie :data="sexChartData" :options="{ responsive: true, maintainAspectRatio: false }" />
        </div>
      </div>
    </div>

    <!-- Charts Row 2: Education & Tracks -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="p-6 bg-[var(--surface)] border border-[var(--border-main)] rounded-3xl shadow-sm">
        <h3 class="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-faint)] mb-6">Education Level Distribution</h3>
        <div class="h-80">
          <Bar :data="eduChartData" :options="{ responsive: true, maintainAspectRatio: false }" />
        </div>
      </div>

      <div class="p-6 bg-[var(--surface)] border border-[var(--border-main)] rounded-3xl shadow-sm">
        <h3 class="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-faint)] mb-6">Hiring Status Breakdown</h3>
        <div class="space-y-4 overflow-y-auto max-h-80 custom-scrollbar pr-2">
          <div v-for="stat in overview?.statusDistribution" :key="stat._id" 
            class="flex items-center justify-between p-4 bg-[var(--surface-2)] rounded-2xl border border-[var(--border-main)]">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div>
              <span class="text-xs font-black uppercase text-[var(--text-main)]">{{ stat._id }}</span>
            </div>
            <span class="text-xl font-black text-[var(--text-main)]">{{ stat.count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
