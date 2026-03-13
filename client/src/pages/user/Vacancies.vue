<script setup>
import { ref, computed, onMounted, onActivated, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useJobs } from '@/composables/useJobs'
import { useVacancyMetrics } from '@/composables/useVacancyMetrics'
import { resolveUrl } from '@/utils/url'
import apiClient from '@/api/axios'

// Components
import VacancyFilters from '@/components/user/VacancyFilters.vue'
import VacancyCard from '@/components/user/VacancyCard.vue'
import ApplicationModal from '@/components/user/ApplicationModal.vue'
import { AppFileViewer, AppSpinner } from '@/components/ui'

defineOptions({ name: 'UserVacancies' })

const router    = useRouter()
const authStore = useAuthStore()
const toast     = inject('$toast')

// ── DATA FETCHING ────────────────────────────────────────────────────────────
const { jobs, loading, fetchJobs } = useJobs()
const searchQuery = ref('')
const filterTrack = ref('')

const userProfile = ref(null)
const { getMatchStatus } = useVacancyMetrics(userProfile)

const fetchUserProfile = async () => {
  if (!authStore.isAuthenticated) return
  try {
    const { data } = await apiClient.get('/v1/profile/me')
    userProfile.value = data.data
  } catch (err) {
    console.warn('Profile fetch failed', err)
  }
}

const loadAll = async () => {
  await Promise.all([
    fetchJobs({ status: 'published' }),
    fetchUserProfile()
  ])
}

onMounted(loadAll)
onActivated(loadAll)

const handleSearch = () => {
  fetchJobs({ status: 'published', search: searchQuery.value })
}

// ── FILTERING ────────────────────────────────────────────────────────────────
const filteredJobs = computed(() => {
  let list = jobs.value || []
  if (filterTrack.value) {
    list = list.filter(j => j.hiringTrack === filterTrack.value)
  }
  return list
})

const trackCounts = computed(() => ({
  teaching:         jobs.value.filter(j => j.hiringTrack === 'teaching').length,
  teaching_related: jobs.value.filter(j => j.hiringTrack === 'teaching_related').length,
  non_teaching:     jobs.value.filter(j => j.hiringTrack === 'non_teaching').length,
}))

// ── APPLICATION FLOW ────────────────────────────────────────────────────────
const showModal    = ref(false)
const selectedJob  = ref(null)
const applying     = ref(false)
const applyError   = ref('')

// Selection state for modal
const selEdu  = ref([])
const selElig = ref([])
const selTrn  = ref([])
const selExp  = ref([])
const perfRating = ref({ score: '', adjective: '', periodCovered: '' })

const openJob = (job) => {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/auth/login', query: { redirect: '/user/vacancies' } })
    return
  }
  selectedJob.value = job
  applyError.value  = ''
  
  // Re-initialize selections from profile
  if (userProfile.value) {
    selEdu.value  = userProfile.value.education?.map((_, i) => i) || []
    selElig.value = userProfile.value.eligibility?.map((_, i) => i) || []
    selTrn.value  = userProfile.value.training?.map((_, i) => i) || []
    selExp.value  = userProfile.value.experience?.map((_, i) => i) || []
    
    perfRating.value = {
        score:         userProfile.value.performanceRating?.score         ?? '',
        adjective:     userProfile.value.performanceRating?.adjective     ?? '',
        periodCovered: userProfile.value.performanceRating?.periodCovered ?? '',
      }
    }

    showModal.value = true
  }
const handleApply = async () => {
  applying.value = true
  applyError.value = ''
  
  try {
    const payload = {
      jobId: selectedJob.value._id,
      selectedEducation:   selEdu.value,
      selectedExperience:  selExp.value,
      selectedTraining:    selTrn.value,
      selectedEligibility: selElig.value,
      performanceRating:   perfRating.value,
    }
    
    await apiClient.post('/v1/applications', payload)
    return true // Success for modal step transition
  } catch (err) {
    applyError.value = err.response?.data?.message || 'Submission failed'
    return false
  } finally {
    applying.value = false
  }
}

// ── FILE VIEWER ──────────────────────────────────────────────────────────────
const showViewer = ref(false)
const viewerUrl  = ref('')
const viewerTitle = ref('')

const openViewer = (url, title) => {
  if (!url) return
  viewerUrl.value = resolveUrl(url)
  viewerTitle.value = title
  showViewer.value = true
}
</script>

<template>
  <div class="flex flex-col gap-8 pb-20 animate-fade-in">
    
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
       <div>
          <p class="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)] mb-2">Guih-Ranking Bulletin</p>
          <h1 class="text-3xl font-black text-[var(--text-main)] tracking-tight">Career Opportunities</h1>
          <p class="text-sm text-[var(--text-muted)] mt-1 font-medium italic">Join the Schools Division of Guihulngan City</p>
       </div>
       
       <!-- Stats Pills -->
       <div v-if="!loading" class="flex flex-wrap gap-2">
          <div v-for="track in [
            { label: 'Teaching', count: trackCounts.teaching, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Related', count: trackCounts.teaching_related, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Non-Teaching', count: trackCounts.non_teaching, color: 'text-amber-600', bg: 'bg-amber-50' },
          ]" :key="track.label" :class="['px-4 py-2 rounded-xl border border-white/50 shadow-sm flex items-center gap-3', track.bg]">
             <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">{{ track.label }}</span>
             <span :class="['text-sm font-black', track.color]">{{ track.count }}</span>
          </div>
       </div>
    </div>

    <!-- Filters -->
    <VacancyFilters 
      v-model:searchQuery="searchQuery"
      v-model:filterTrack="filterTrack"
      @search="handleSearch"
    />

    <!-- Auth Nudge -->
    <div v-if="!authStore.isAuthenticated" 
      class="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-4 text-blue-800 shadow-sm animate-pulse">
       <i class="pi pi-info-circle text-lg"></i>
       <p class="text-xs font-semibold">
         <router-link to="/auth/login" class="font-black underline uppercase tracking-widest">Sign in</router-link> 
         to see your automated QS match score for each position.
       </p>
    </div>

    <!-- Job Grid -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
       <div v-for="i in 6" :key="i" class="h-64 rounded-3xl bg-white border border-[var(--border-main)] animate-pulse"></div>
    </div>

    <div v-else-if="filteredJobs.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
       <VacancyCard 
         v-for="job in filteredJobs" :key="job._id"
         :job="job"
         :matchStatus="getMatchStatus(job)"
         @click="openJob"
       />
    </div>

    <!-- Empty State -->
    <div v-else class="py-24 flex flex-col items-center justify-center text-center bg-white border border-[var(--border-main)] rounded-3xl shadow-sm">
       <div class="w-20 h-20 rounded-full bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-faint)] mb-4">
          <i class="pi pi-search text-3xl"></i>
       </div>
       <h3 class="text-lg font-black text-[var(--text-main)] uppercase tracking-tight">No positions found</h3>
       <p class="text-xs text-[var(--text-muted)] mt-2 max-w-xs mx-auto">We couldn't find any vacancies matching your current filters. Try resetting or adjusting your search.</p>
       <button @click="filterTrack = ''; searchQuery = ''" class="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] hover:underline">Clear all filters</button>
    </div>

    <!-- Modals -->
    <ApplicationModal 
      v-if="selectedJob"
      v-model="showModal"
      :job="selectedJob"
      :profile="userProfile"
      :applying="applying"
      :applyError="applyError"
      v-model:selEdu="selEdu"
      v-model:selExp="selExp"
      v-model:selElig="selElig"
      v-model:selTrn="selTrn"
      v-model:perfRating="perfRating"
      @apply="handleApply"
      @preview="openViewer"
    />

    <AppFileViewer 
      v-model="showViewer"
      :url="viewerUrl"
      :title="viewerTitle"
    />

  </div>
</template>
