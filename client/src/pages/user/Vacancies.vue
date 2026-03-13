<script setup>
import { ref, computed, onMounted, onActivated, inject, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useJobs } from '@/composables/useJobs'
import { useVacancyMetrics } from '@/composables/useVacancyMetrics'
import apiClient from '@/api/axios'

import VacancyFilters from '@/components/user/VacancyFilters.vue'
import VacancyCard from '@/components/user/VacancyCard.vue'
import ApplicationModal from '@/components/user/ApplicationModal.vue'

defineOptions({ name: 'UserVacancies' })

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const toast     = inject('$toast')

const { jobs, loading, fetchJobs } = useJobs()
const searchQuery = ref('')
const filterTrack = ref('')

const userProfile    = ref(null)
const profileLoading = ref(false)
const { getMatchStatus } = useVacancyMetrics(userProfile)

const fetchUserProfile = async () => {
  if (!authStore.isAuthenticated) return
  profileLoading.value = true
  try {
    const { data } = await apiClient.get('/v1/profile/me')
    userProfile.value = data.data
  } catch (err) {
    console.warn('Profile fetch failed', err)
  } finally {
    profileLoading.value = false
  }
}

// ── Auto-open job from ?job=<id> query param ──────────────────────────────────
const showModal   = ref(false)
const selectedJob = ref(null)

const tryAutoOpen = () => {
  const jobId = route.query.job
  if (!jobId || !jobs.value.length) return
  const match = jobs.value.find(j => j._id === jobId)
  if (match) {
    selectedJob.value = match
    showModal.value   = true
  }
}

const loadAll = async () => {
  await Promise.all([fetchJobs({ status: 'published' }), fetchUserProfile()])
  await nextTick()
  tryAutoOpen()
}

onMounted(loadAll)
onActivated(loadAll)

const handleSearch = () => fetchJobs({ status: 'published', search: searchQuery.value })

const filteredJobs = computed(() => {
  let list = jobs.value || []
  if (filterTrack.value) list = list.filter(j => j.hiringTrack === filterTrack.value)
  return list
})

const trackCounts = computed(() => ({
  all:              jobs.value.length,
  teaching:         jobs.value.filter(j => j.hiringTrack === 'teaching').length,
  teaching_related: jobs.value.filter(j => j.hiringTrack === 'teaching_related').length,
  non_teaching:     jobs.value.filter(j => j.hiringTrack === 'non_teaching').length,
}))

// Profile required — shown when user is logged in but has no profile yet
const needsProfile = computed(() =>
  authStore.isAuthenticated && !profileLoading.value && userProfile.value === null
)

const openJob = (job) => {
  selectedJob.value = job
  showModal.value   = true
}
</script>

<template>
  <div class="flex flex-col gap-6 pb-24 animate-fade-in">

    <!-- ── HERO HEADER ─────────────────────────────────────────────────────── -->
    <div class="relative rounded-3xl overflow-hidden bg-[var(--color-navy)] px-8 py-8 shadow-xl">
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/5 blur-3xl"></div>
        <div class="absolute -bottom-12 -left-10 w-60 h-60 rounded-full bg-[var(--color-primary)]/20 blur-3xl"></div>
      </div>
      <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-2 mb-3">
            <span class="w-1 h-4 rounded-full bg-[var(--color-gold)]"></span>
            <p class="text-[9px] font-black uppercase tracking-[0.35em] text-white/50">SDO Guihulngan City · Guih-Ranking Bulletin</p>
          </div>
          <h1 class="text-2xl font-black text-white tracking-tight leading-tight mb-1">Career Opportunities</h1>
          <p class="text-sm text-white/50 font-medium">Schools Division of Guihulngan City, Negros Oriental</p>
        </div>
        <div v-if="!loading" class="flex flex-wrap gap-2 shrink-0">
          <div v-for="t in [
            { label: 'Total',        count: trackCounts.all,              bg: 'bg-white/10',        text: 'text-white',         sub: 'text-white/50' },
            { label: 'Teaching',     count: trackCounts.teaching,         bg: 'bg-blue-500/20',     text: 'text-blue-300',      sub: 'text-blue-400/60' },
            { label: 'T-Related',    count: trackCounts.teaching_related, bg: 'bg-violet-500/20',   text: 'text-violet-300',    sub: 'text-violet-400/60' },
            { label: 'Non-Teaching', count: trackCounts.non_teaching,     bg: 'bg-amber-500/20',    text: 'text-amber-300',     sub: 'text-amber-400/60' },
          ]" :key="t.label"
            :class="['flex flex-col items-center justify-center w-16 py-2.5 rounded-2xl border border-white/10', t.bg]">
            <span :class="['text-xl font-black leading-none tabular-nums', t.text]">{{ t.count }}</span>
            <span :class="['text-[8px] font-black uppercase tracking-widest mt-0.5', t.sub]">{{ t.label }}</span>
          </div>
        </div>
        <div v-else class="flex gap-2 shrink-0">
          <div v-for="i in 4" :key="i" class="w-16 h-14 rounded-2xl bg-white/10 animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- ── PROFILE REQUIRED GATE ──────────────────────────────────────────── -->
    <Transition name="slide-down">
      <div v-if="needsProfile"
        class="flex items-start gap-4 px-5 py-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm">
        <div class="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <i class="pi pi-user-edit text-amber-600 text-sm"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-black text-amber-900">Complete your Applicant Profile first</p>
          <p class="text-xs text-amber-700 mt-0.5 leading-snug">
            Before you can apply for any position, you need to fill in your personal information, educational background, work experience, and eligibility. This only takes a few minutes.
          </p>
        </div>
        <router-link to="/user/profile"
          class="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">
          <i class="pi pi-arrow-right" style="font-size:9px"></i> Set Up Profile
        </router-link>
      </div>
    </Transition>

    <!-- ── AUTH NUDGE (guest) ──────────────────────────────────────────────── -->
    <div v-if="!authStore.isAuthenticated"
      class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20">
      <div class="w-7 h-7 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
        <i class="pi pi-user text-[var(--color-primary)]" style="font-size:11px"></i>
      </div>
      <p class="text-xs text-[var(--text-sub)] leading-snug flex-1">
        <router-link to="/auth/login" class="font-black text-[var(--color-primary)] underline underline-offset-2">Sign in</router-link>
        to see your automated qualification match score for each position.
      </p>
    </div>

    <!-- ── FILTERS ─────────────────────────────────────────────────────────── -->
    <VacancyFilters
      v-model:searchQuery="searchQuery"
      v-model:filterTrack="filterTrack"
      @search="handleSearch"
    />

    <!-- ── RESULT META ─────────────────────────────────────────────────────── -->
    <div v-if="!loading" class="flex items-center justify-between">
      <p class="text-xs text-[var(--text-faint)] font-semibold">
        <span class="font-black text-[var(--text-main)]">{{ filteredJobs.length }}</span>
        position{{ filteredJobs.length !== 1 ? 's' : '' }} found
        <span v-if="filterTrack" class="ml-1">· filtered by
          <span class="text-[var(--color-primary)] font-black capitalize">{{ filterTrack.replace('_', ' ') }}</span>
        </span>
      </p>
      <button v-if="filterTrack || searchQuery"
        @click="filterTrack = ''; searchQuery = ''"
        class="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] hover:underline flex items-center gap-1">
        <i class="pi pi-times" style="font-size:8px"></i> Clear filters
      </button>
    </div>

    <!-- ── SKELETON ────────────────────────────────────────────────────────── -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="rounded-2xl bg-[var(--surface)] border border-[var(--border-main)] overflow-hidden animate-pulse">
        <div class="h-1 bg-[var(--bg-app)]"></div>
        <div class="p-5 space-y-4">
          <div class="flex justify-between">
            <div class="h-5 w-20 rounded-full bg-[var(--bg-app)]"></div>
            <div class="h-5 w-20 rounded-full bg-[var(--bg-app)]"></div>
          </div>
          <div class="space-y-2">
            <div class="h-4 w-4/5 rounded-lg bg-[var(--bg-app)]"></div>
            <div class="h-3 w-2/5 rounded-lg bg-[var(--bg-app)]"></div>
            <div class="h-3 w-1/2 rounded-lg bg-[var(--bg-app)]"></div>
          </div>
          <div class="grid grid-cols-3 gap-3 py-3 border-y border-[var(--bg-app)]">
            <div v-for="j in 3" :key="j" class="space-y-1.5">
              <div class="h-2 w-3/4 rounded bg-[var(--bg-app)]"></div>
              <div class="h-3 w-1/2 rounded bg-[var(--bg-app)]"></div>
            </div>
          </div>
          <div class="flex justify-between items-end">
            <div class="space-y-1">
              <div class="h-2 w-16 rounded bg-[var(--bg-app)]"></div>
              <div class="h-5 w-24 rounded bg-[var(--bg-app)]"></div>
            </div>
            <div class="h-9 w-28 rounded-xl bg-[var(--bg-app)]"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── GRID ───────────────────────────────────────────────────────────── -->
    <div v-else-if="filteredJobs.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <VacancyCard
        v-for="job in filteredJobs" :key="job._id"
        :job="job"
        :matchStatus="getMatchStatus(job)"
        @click="openJob"
      />
    </div>

    <!-- ── EMPTY ──────────────────────────────────────────────────────────── -->
    <div v-else class="py-20 flex flex-col items-center justify-center text-center bg-[var(--surface)] border border-[var(--border-main)] rounded-3xl">
      <div class="w-16 h-16 rounded-2xl bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-faint)] mb-4">
        <i class="pi pi-search text-2xl"></i>
      </div>
      <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">No positions found</h3>
      <p class="text-xs text-[var(--text-muted)] mt-2 max-w-xs">We couldn't find any open vacancies matching your search. Try adjusting or clearing your filters.</p>
      <button @click="filterTrack = ''; searchQuery = ''"
        class="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] hover:underline flex items-center gap-1.5">
        <i class="pi pi-refresh" style="font-size:9px"></i> Clear all filters
      </button>
    </div>

    <!-- ── APPLICATION MODAL ──────────────────────────────────────────────── -->
    <ApplicationModal
      v-if="selectedJob"
      v-model="showModal"
      :job="selectedJob"
      :profile="userProfile"
      @submitted="toast.fire({ icon: 'success', title: 'Application submitted!' })"
    />

  </div>
</template>
