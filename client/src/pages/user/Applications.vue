<script setup>
import { ref, computed, onMounted, onActivated, inject } from 'vue'
import apiClient from '@/api/axios'
import ApplicantCoverPagePdf from '@/components/user/ApplicantCoverPagePdf.vue'
import ApplicantIerPdf from '@/components/user/ApplicantIerPdf.vue'
import { AppBadge, AppModal, AppButton, AppFileViewer, AppSpinner } from '@/components/ui'
import { statusConfig } from '@/utils/statusColors'
import { resolveUrl } from '@/utils/url'
import ApplicationCard from '@/components/user/ApplicationCard.vue'

defineOptions({ name: 'UserApplications' })

const toast = inject('$toast')
const $swal = inject('$swal')

// ── State ───────────────────────────────────────────────────────────────────
const applications = ref([])
const loading      = ref(false)
const searchQuery  = ref('')
const filterStatus = ref('')

const selectedApp  = ref(null)
const showModal    = ref(false)
const showCoverPdf = ref(false)
const showIerPdf   = ref(false)
const activeTab    = ref('overview')

const showViewer   = ref(false)
const viewerUrl    = ref('')
const viewerTitle  = ref('')

const openViewer = (file) => {
  viewerUrl.value   = resolveUrl(file.fileUrl)
  viewerTitle.value = `Document: ${file.type.replace(/_/g, ' ').toUpperCase()}`
  showViewer.value  = true
}

// ── Computed ────────────────────────────────────────────────────────────────
const filtered = computed(() => {
  let list = applications.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a =>
      a.job?.positionTitle?.toLowerCase().includes(q) ||
      a.applicationCode?.toLowerCase().includes(q)
    )
  }
  if (filterStatus.value) list = list.filter(a => a.status === filterStatus.value)
  return list
})

const isFinalIer = computed(() => !!selectedApp.value?.isVerified && !!selectedApp.value?.job?.finalIerReleasedAt)

// Journey steps with status mapping
const journeySteps = [
  { key: 'applied',                icon: 'pi-send',         label: 'Applied',      desc: 'Application submitted' },
  { key: 'verifying',              icon: 'pi-search',       label: 'Under Review', desc: 'Documents being evaluated' },
  { key: 'comparative_assessment', icon: 'pi-chart-bar',    label: 'Evaluated',    desc: 'Initial evaluation complete' },
  { key: 'ranked',                 icon: 'pi-sort-amount-up', label: 'Ranked',     desc: 'Comparative assessment done' },
  { key: 'appointed',              icon: 'pi-check-circle', label: 'Appointed',    desc: 'Appointment issued' },
]

const statusOrder = { applied: 1, verifying: 2, comparative_assessment: 3, ranked: 4, appointed: 5 }

function stepState(step) {
  if (!selectedApp.value) return 'pending'
  const s = selectedApp.value.status
  if (s === 'disqualified') return step.key === 'applied' ? 'done' : (step.key === 'verifying' ? 'failed' : 'pending')
  const current = statusOrder[s] || 0
  const stepIdx = statusOrder[step.key] || 0
  if (current > stepIdx) return 'done'
  if (current === stepIdx) return 'active'
  return 'pending'
}

// Step detail toggle
const selectedStep = ref(null)
const toggleStep = (step) => {
  if (stepState(step) === 'pending') return
  selectedStep.value = selectedStep.value === step.key ? null : step.key
}

// Verification checklist helper
const VC_KEYS = [
  { key: 'education',   label: 'Education',    icon: 'pi-graduation-cap' },
  { key: 'experience',  label: 'Experience',   icon: 'pi-briefcase' },
  { key: 'training',    label: 'Training',     icon: 'pi-book' },
  { key: 'eligibility', label: 'Eligibility',  icon: 'pi-id-card' },
  { key: 'performance', label: 'Performance',  icon: 'pi-star' },
]

function vcItem(key) {
  return selectedApp.value?.verificationChecklist?.[key] || {}
}

function auditList(category) {
  return selectedApp.value?.applicantData?.[category] || []
}

// Only show VC categories where the applicant actually submitted data
const visibleVcKeys = computed(() => {
  if (!selectedApp.value) return []
  return VC_KEYS.filter(vc => {
    if (vc.key === 'performance') return !!selectedApp.value.applicantData?.performanceRating?.score
    return (selectedApp.value.applicantData?.[vc.key] || []).length > 0
  })
})

// Format helpers
const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
  : '—'

const formatShort = (d) => d
  ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—'

// Flatten submissionDocs object into array for display
const DOC_LABELS = {
  pds:                        'Personal Data Sheet (PDS)',
  applicationLetter:          'Application Letter',
  performanceRatingDoc:       'Performance Rating Document',
  latestAppointment:          'Latest Appointment',
  workExperienceSheet:        'Work Experience Sheet',
  outstandingAccomplishments: 'Outstanding Accomplishments',
  movs:                       'MOVs',
  research:                   'Research',
  awards:                     'Awards',
  others:                     'Others',
}

const submissionDocsList = computed(() => {
  const sd = selectedApp.value?.submissionDocs || {}
  const result = []
  for (const [key, val] of Object.entries(sd)) {
    if (!val) continue
    const label = DOC_LABELS[key] || key
    if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (item?.fileUrl) result.push({ type: label, index: i + 1, ...item })
      })
    } else if (val.fileUrl) {
      result.push({ type: label, ...val })
    }
  }
  return result
})

// ── Actions ─────────────────────────────────────────────────────────────────
const syncing = ref(false)

const syncProfile = async () => {
  const confirm = await $swal.fire({
    title: 'Sync Profile Data?',
    html: 'This will update your application snapshot with your <strong>current profile data</strong> (eligibility, education, experience, training). Use this if you updated your profile after submitting.<br/><br/>This cannot be done after the application is verified.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, sync now',
    confirmButtonColor: 'var(--color-primary)',
  })
  if (!confirm.isConfirmed) return

  syncing.value = true
  try {
    await apiClient.post(`/v1/applications/${selectedApp.value._id}/sync-profile`)
    toast.fire({ icon: 'success', title: 'Profile data synced successfully' })
    await fetchApplications()
    // Re-select the updated app
    const updated = applications.value.find(a => a._id === selectedApp.value._id)
    if (updated) selectedApp.value = updated
  } catch (err) {
    toast.fire({ icon: 'error', title: err?.response?.data?.message || 'Sync failed' })
  } finally {
    syncing.value = false
  }
}

const fetchApplications = async () => {
  loading.value = true
  try {
    const { data } = await apiClient.get('/v1/applications/my-applications')
    applications.value = data.data || []
  } catch {
    toast.fire({ icon: 'error', title: 'Failed to load applications' })
  } finally {
    loading.value = false
  }
}

const openApp = (app) => {
  selectedApp.value  = app
  activeTab.value    = 'overview'
  selectedStep.value = null
  showModal.value    = true
}

onMounted(fetchApplications)
onActivated(fetchApplications)
</script>

<template>
  <div class="flex flex-col gap-8 pb-20 animate-fade-in">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)] mb-1.5">Recruitment Portal</p>
        <h1 class="text-3xl font-black text-[var(--text-main)] tracking-tight">My Applications</h1>
        <p class="text-sm text-[var(--text-muted)] mt-1">Track your application journey and review verification results.</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Stats -->
        <div class="flex gap-2">
          <template v-for="(cfg, key) in statusConfig" :key="key">
            <div v-if="applications.filter(a => a.status === key).length"
              class="h-10 px-3 rounded-xl bg-white border border-[var(--border-main)] flex items-center gap-2 shadow-sm">
              <div class="w-2 h-2 rounded-full" :style="{ background: cfg.color }"></div>
              <span class="text-xs font-black text-[var(--text-main)]">{{ applications.filter(a => a.status === key).length }}</span>
              <span class="text-[9px] font-bold uppercase text-[var(--text-faint)]">{{ cfg.label }}</span>
            </div>
          </template>
        </div>
        <button @click="fetchApplications" :disabled="loading"
          class="w-10 h-10 rounded-xl bg-white border border-[var(--border-main)] flex items-center justify-center text-[var(--text-faint)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all shadow-sm">
          <i :class="['pi pi-sync text-sm', { 'animate-spin': loading }]"></i>
        </button>
      </div>
    </div>

    <!-- ── Filters ─────────────────────────────────────────────────────────── -->
    <div class="bg-white border border-[var(--border-main)] rounded-2xl p-4 flex flex-col md:flex-row gap-3 shadow-sm">
      <div class="relative flex-1 group">
        <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-faint)] group-focus-within:text-[var(--color-primary)] transition-colors"></i>
        <input v-model="searchQuery" type="text" placeholder="Search by position or application code..."
          class="w-full h-11 pl-11 pr-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 outline-none transition-all" />
      </div>
      <select v-model="filterStatus"
        class="h-11 px-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-[11px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 transition-all cursor-pointer">
        <option value="">All Statuses</option>
        <option v-for="(cfg, key) in statusConfig" :key="key" :value="key">{{ cfg.label }}</option>
      </select>
    </div>

    <!-- ── Cards ───────────────────────────────────────────────────────────── -->
    <div v-if="loading && !applications.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="i in 4" :key="i" class="h-36 rounded-2xl bg-white border border-[var(--border-main)] animate-pulse"></div>
    </div>

    <div v-else-if="filtered.length === 0"
      class="py-24 text-center bg-white border border-[var(--border-main)] rounded-3xl">
      <div class="w-20 h-20 rounded-full bg-[var(--bg-app)] flex items-center justify-center mx-auto mb-4 text-[var(--text-faint)]">
        <i class="pi pi-inbox text-3xl"></i>
      </div>
      <h3 class="text-lg font-black text-[var(--text-main)] uppercase">No applications found</h3>
      <p class="text-xs text-[var(--text-muted)] mt-2">Try adjusting your filters or browse new vacancies.</p>
      <router-link to="/user/vacancies"
        class="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] bg-[var(--color-primary-light)] px-6 py-3 rounded-xl hover:shadow-lg transition-all">
        Browse Vacancies <i class="pi pi-arrow-right"></i>
      </router-link>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ApplicationCard v-for="app in filtered" :key="app._id" :app="app" @click="openApp" />
    </div>

    <!-- ── Detail Modal ────────────────────────────────────────────────────── -->
    <AppModal v-model="showModal"
      :title="selectedApp?.job?.positionTitle || 'Application Detail'"
      :subtitle="selectedApp?.applicationCode"
      size="xl" @close="showModal = false">

      <template v-if="selectedApp">

        <!-- ── Journey Bar ──────────────────────────────────────────────── -->
        <div class="mb-6 p-5 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-app)]">
          <!-- Disqualified banner -->
          <div v-if="selectedApp.status === 'disqualified'"
            class="mb-4 flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
            <div class="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <i class="pi pi-times-circle text-white text-xs"></i>
            </div>
            <div>
              <p class="text-sm font-black text-red-700 uppercase tracking-tight">Application Disqualified</p>
              <p v-if="selectedApp.disqualificationReason" class="text-xs text-red-600 mt-0.5">{{ selectedApp.disqualificationReason }}</p>
            </div>
          </div>

          <!-- Steps -->
          <div class="flex items-start justify-between relative">
            <!-- Progress line -->
            <div class="absolute top-5 left-0 right-0 h-0.5 bg-[var(--border-main)] mx-6 -z-0"></div>
            <div v-for="step in journeySteps" :key="step.key"
              class="flex flex-col items-center gap-2 z-10 flex-1 transition-all"
              :class="stepState(step) !== 'pending' ? 'cursor-pointer' : 'cursor-default'"
              @click="toggleStep(step)">
              <!-- Icon bubble -->
              <div :class="[
                'w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all shadow-sm',
                stepState(step) === 'done'   ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' :
                stepState(step) === 'active' ? 'bg-white border-[var(--color-primary)] text-[var(--color-primary)] shadow-lg ring-4 ring-[var(--color-primary-light)]' :
                stepState(step) === 'failed' ? 'bg-red-500 border-red-500 text-white' :
                'bg-white border-[var(--border-main)] text-[var(--text-faint)]',
                selectedStep === step.key ? 'ring-4 ring-[var(--color-gold)] scale-110' : ''
              ]">
                <i :class="['pi text-sm', stepState(step) === 'done' ? 'pi-check' : step.icon]"></i>
              </div>
              <div class="text-center">
                <p :class="[
                  'text-[9px] font-black uppercase tracking-wider leading-tight',
                  stepState(step) === 'done'   ? 'text-[var(--color-primary)]' :
                  stepState(step) === 'active' ? 'text-[var(--text-main)]' :
                  'text-[var(--text-faint)]'
                ]">{{ step.label }}</p>
                <p v-if="stepState(step) === 'active'"
                  class="text-[8px] text-[var(--text-muted)] mt-0.5 hidden md:block">{{ step.desc }}</p>
              </div>
            </div>
          </div>

          <!-- Verified badge -->
          <div v-if="selectedApp.isVerified"
            class="mt-4 pt-4 border-t border-[var(--border-main)] flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <i class="pi pi-verified text-white text-[10px]"></i>
              </div>
              <span class="text-xs font-black text-emerald-700 uppercase tracking-wider">Documents Verified</span>
            </div>
            <div class="text-right">
              <p class="text-[10px] font-bold text-[var(--text-muted)]">
                by <span class="text-[var(--text-main)]">{{ selectedApp.verifiedBy?.username || 'HR Verifier' }}</span>
                · {{ formatShort(selectedApp.verifiedAt) }}
              </p>
            </div>
          </div>

          <!-- ── Step Detail Panel ──────────────────────────────────────── -->
          <div v-if="selectedStep" class="mt-4 pt-4 border-t border-[var(--color-gold)]/40 animate-fade-in">

            <!-- Applied -->
            <template v-if="selectedStep === 'applied'">
              <p class="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)] mb-3">
                <i class="pi pi-send mr-1.5"></i>Application Submitted
              </p>
              <div class="grid grid-cols-2 gap-2">
                <div class="p-2.5 rounded-lg bg-white border border-[var(--border-main)]">
                  <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)]">Date Submitted</p>
                  <p class="text-xs font-bold text-[var(--text-main)] mt-0.5">{{ formatDate(selectedApp.createdAt) }}</p>
                </div>
                <div class="p-2.5 rounded-lg bg-white border border-[var(--border-main)]">
                  <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)]">Application Code</p>
                  <p class="text-xs font-bold font-mono text-[var(--text-main)] mt-0.5">{{ selectedApp.applicationCode }}</p>
                </div>
              </div>
            </template>

            <!-- Verifying -->
            <template v-else-if="selectedStep === 'verifying'">
              <!-- Disqualified at this stage -->
              <template v-if="selectedApp.status === 'disqualified'">
                <p class="text-[9px] font-black uppercase tracking-widest text-red-600 mb-3">
                  <i class="pi pi-times-circle mr-1.5"></i>Verification Result — Disqualified
                </p>
                <div class="p-3 rounded-xl bg-red-50 border border-red-200">
                  <p class="text-[9px] font-black uppercase tracking-widest text-red-500 mb-1">Reason</p>
                  <p class="text-xs text-red-800">{{ selectedApp.disqualificationReason || 'No reason specified.' }}</p>
                </div>
              </template>
              <!-- Awaiting verification -->
              <template v-else-if="!selectedApp.isVerified">
                <div class="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <i class="pi pi-clock text-amber-500 text-lg"></i>
                  <div>
                    <p class="text-sm font-bold text-amber-800">Documents Under Review</p>
                    <p class="text-xs text-amber-700 mt-0.5">Your documents are being reviewed by HR. You will be notified of any updates.</p>
                  </div>
                </div>
              </template>
              <!-- Verified -->
              <template v-else>
                <div class="flex items-center justify-between mb-3">
                  <p class="text-[9px] font-black uppercase tracking-widest text-emerald-600">
                    <i class="pi pi-shield mr-1.5"></i>Verification Complete
                  </p>
                  <p class="text-[10px] text-[var(--text-muted)]">
                    by <span class="font-bold text-[var(--text-main)]">{{ selectedApp.verifiedBy?.username || 'HR Officer' }}</span>
                    · {{ formatShort(selectedApp.verifiedAt) }}
                  </p>
                </div>
                <!-- Category results -->
                <div class="space-y-1.5 mb-3">
                  <div v-for="vc in visibleVcKeys" :key="vc.key"
                    class="flex items-center gap-2.5 p-2 rounded-lg border"
                    :class="vcItem(vc.key).checked ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'">
                    <i :class="['pi text-[11px]', vcItem(vc.key).checked ? 'pi-check text-emerald-600' : 'pi-times text-red-500']"></i>
                    <span class="text-[11px] font-bold flex-1" :class="vcItem(vc.key).checked ? 'text-emerald-800' : 'text-red-700'">{{ vc.label }}</span>
                    <span :class="['text-[10px] font-black uppercase', vcItem(vc.key).checked ? 'text-emerald-600' : 'text-red-500']">
                      {{ vc.key === 'performance' ? (vcItem(vc.key).checked ? 'Met' : 'Not Met') : (vcItem(vc.key).checked ? 'Qualified' : 'Not Qualified') }}
                    </span>
                    <span v-if="vcItem(vc.key).note" class="text-[10px] text-[var(--text-muted)] italic truncate max-w-[100px]" :title="vcItem(vc.key).note">
                      · {{ vcItem(vc.key).note }}
                    </span>
                  </div>
                </div>
                <!-- Non-relevant records -->
                <template v-if="visibleVcKeys.some(vc => auditList(vc.key).some(r => r.isRelevant === false))">
                  <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-1.5">Non-Relevant Records</p>
                  <div class="space-y-1">
                    <template v-for="vc in visibleVcKeys" :key="'nr-' + vc.key">
                      <div v-for="(rec, i) in auditList(vc.key).filter(r => r.isRelevant === false)" :key="i"
                        class="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                        <i class="pi pi-times-circle text-red-500 text-[10px] mt-0.5 flex-shrink-0"></i>
                        <div class="flex-1 min-w-0">
                          <p class="text-[10px] font-bold text-red-700">
                            [{{ vc.label }}]
                            <template v-if="vc.key === 'education'">{{ rec.degree || rec.school }}</template>
                            <template v-else-if="vc.key === 'experience'">{{ rec.position || rec.company }}</template>
                            <template v-else-if="vc.key === 'training'">{{ rec.title }}</template>
                            <template v-else-if="vc.key === 'eligibility'">{{ rec.name }}</template>
                            — Non-Relevant
                          </p>
                          <p v-if="rec.auditRemarks" class="text-[10px] text-red-600 italic mt-0.5">{{ rec.auditRemarks }}</p>
                        </div>
                      </div>
                    </template>
                  </div>
                </template>
              </template>
            </template>

            <!-- Comparative Assessment -->
            <template v-else-if="selectedStep === 'comparative_assessment'">
              <p class="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)] mb-3">
                <i class="pi pi-chart-bar mr-1.5"></i>Evaluation Points Breakdown
              </p>
              <div v-if="selectedApp.hrRating" class="grid grid-cols-2 gap-2">
                <div v-for="[lbl, icon, val] in [
                  ['Education', 'pi-graduation-cap', selectedApp.hrRating.educationPoints],
                  ['Experience', 'pi-briefcase', selectedApp.hrRating.experiencePoints],
                  ['Training', 'pi-book', selectedApp.hrRating.trainingPoints],
                  ['Eligibility', 'pi-id-card', selectedApp.hrRating.eligibilityPoints],
                ]" :key="lbl"
                  class="p-3 rounded-xl bg-white border border-[var(--border-main)] flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center flex-shrink-0">
                    <i :class="['pi text-[var(--color-primary)] text-xs', icon]"></i>
                  </div>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)]">{{ lbl }}</p>
                    <p class="text-sm font-black text-[var(--text-main)] tabular-nums">{{ val?.toFixed(3) || '0.000' }}</p>
                  </div>
                </div>
              </div>
              <div v-else class="flex items-center gap-2 text-[var(--text-muted)] text-xs py-2">
                <i class="pi pi-clock"></i> Assessment not yet complete.
              </div>
            </template>

            <!-- Ranked -->
            <template v-else-if="selectedStep === 'ranked'">
              <p class="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)] mb-3">
                <i class="pi pi-sort-amount-up mr-1.5"></i>Comparative Assessment Score
              </p>
              <div v-if="selectedApp.totalScore"
                class="flex items-center justify-between p-4 rounded-xl bg-[var(--color-navy)] text-white">
                <div>
                  <p class="text-[9px] font-black uppercase tracking-widest text-blue-300 mb-1">Total Score</p>
                  <p class="text-3xl font-black tabular-nums">{{ selectedApp.totalScore?.toFixed(3) }}</p>
                </div>
                <i class="pi pi-trophy text-[var(--color-gold)] text-3xl"></i>
              </div>
              <div v-else class="flex items-center gap-2 text-[var(--text-muted)] text-xs py-2">
                <i class="pi pi-clock"></i> Ranking not yet finalized.
              </div>
            </template>

            <!-- Appointed -->
            <template v-else-if="selectedStep === 'appointed'">
              <div class="text-center py-4">
                <div class="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <i class="pi pi-check-circle text-white text-2xl"></i>
                </div>
                <p class="text-base font-black text-emerald-700 uppercase tracking-tight">Congratulations!</p>
                <p class="text-xs text-[var(--text-muted)] mt-2 max-w-xs mx-auto">You have been officially appointed to the position. Please report to the Division Office for appointment document issuance.</p>
              </div>
            </template>

          </div>
        </div>

        <!-- ── Tabs ─────────────────────────────────────────────────────── -->
        <div class="flex gap-1 mb-5 bg-[var(--bg-app)] rounded-xl p-1 border border-[var(--border-main)]">
          <button v-for="tab in [
            { key: 'overview',      label: 'Overview',       icon: 'pi-compass' },
            { key: 'verification',  label: 'Qualifications', icon: 'pi-shield' },
            { key: 'documents',     label: 'Documents',      icon: 'pi-file-pdf' },
          ]" :key="tab.key"
            @click="activeTab = tab.key"
            :class="[
              'flex-1 h-9 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all',
              activeTab === tab.key
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            ]">
            <i :class="['pi text-[10px]', tab.icon]"></i> {{ tab.label }}
          </button>
        </div>

        <!-- ── Overview Tab ─────────────────────────────────────────────── -->
        <div v-show="activeTab === 'overview'" class="space-y-4 animate-fade-in">
          <!-- Info grid -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div v-for="item in [
              { label: 'Application Code', value: selectedApp.applicationCode, mono: true },
              { label: 'Date Applied',     value: formatDate(selectedApp.createdAt) },
              { label: 'Position',         value: selectedApp.job?.positionTitle },
              { label: 'Salary Grade',     value: selectedApp.job?.salaryGrade ? `SG-${selectedApp.job.salaryGrade}` : '—' },
              { label: 'Hiring Track',     value: ({ teaching: 'Teaching', teaching_related: 'Teaching-Related', non_teaching: 'Non-Teaching' })[selectedApp.job?.hiringTrack] || '—' },
              { label: 'Assignment',       value: Array.isArray(selectedApp.job?.placeOfAssignment) ? selectedApp.job.placeOfAssignment.join(', ') : (selectedApp.job?.placeOfAssignment || '—') },
            ]" :key="item.label"
              class="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)]">
              <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-1">{{ item.label }}</p>
              <p :class="['text-xs font-bold text-[var(--text-main)] leading-snug', item.mono ? 'font-mono' : '']">{{ item.value || '—' }}</p>
            </div>
          </div>

          <!-- Score card if evaluated -->
          <div v-if="selectedApp.hrRating && selectedApp.totalScore"
            class="p-5 rounded-2xl bg-[var(--color-navy)] text-white relative overflow-hidden">
            <div class="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5"></div>
            <div class="relative z-10 flex items-center justify-between">
              <div>
                <p class="text-[9px] font-black uppercase tracking-widest text-blue-300 mb-1">Comparative Assessment Score</p>
                <p class="text-4xl font-black tabular-nums">{{ selectedApp.totalScore?.toFixed(3) }}</p>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div v-for="[lbl, val] in [['EDU', selectedApp.hrRating.educationPoints], ['EXP', selectedApp.hrRating.experiencePoints], ['TRN', selectedApp.hrRating.trainingPoints], ['ELG', selectedApp.hrRating.eligibilityPoints]]"
                  :key="lbl" class="bg-white/10 rounded-lg p-2 text-center">
                  <p class="text-[8px] font-black text-white/50">{{ lbl }}</p>
                  <p class="text-sm font-black">{{ val?.toFixed(2) || '0.00' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Snapshot summary -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div v-for="cat in [
              { label: 'Education',   count: selectedApp.applicantData?.education?.length || 0,   icon: 'pi-graduation-cap' },
              { label: 'Experience',  count: selectedApp.applicantData?.experience?.length || 0,   icon: 'pi-briefcase' },
              { label: 'Training',    count: selectedApp.applicantData?.training?.length || 0,     icon: 'pi-book' },
              { label: 'Eligibility', count: selectedApp.applicantData?.eligibility?.length || 0,  icon: 'pi-id-card' },
            ]" :key="cat.label"
              class="p-3 rounded-xl bg-white border border-[var(--border-main)] flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] flex-shrink-0">
                <i :class="['pi text-xs', cat.icon]"></i>
              </div>
              <div>
                <p class="text-lg font-black text-[var(--text-main)] leading-none">{{ cat.count }}</p>
                <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mt-0.5">{{ cat.label }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Verification / Qualifications Tab ────────────────────────── -->
        <div v-show="activeTab === 'verification'" class="space-y-4 animate-fade-in">

          <!-- Not yet verified notice -->
          <div v-if="!selectedApp.isVerified"
            class="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <i class="pi pi-info-circle text-amber-500 mt-0.5"></i>
            <div>
              <p class="text-sm font-bold text-amber-800">Preliminary Assessment</p>
              <p class="text-xs text-amber-700 mt-0.5">This shows your submitted data for each qualification category. Official verification happens when you visit the Division office and an HR officer reviews your original documents.</p>
            </div>
          </div>

          <!-- Verified header -->
          <div v-else class="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
                <i class="pi pi-shield text-white text-sm"></i>
              </div>
              <div>
                <p class="text-sm font-black text-emerald-800">Official Verification Complete</p>
                <p class="text-xs text-emerald-700">Verified by {{ selectedApp.verifiedBy?.username || 'HR Officer' }} on {{ formatDate(selectedApp.verifiedAt) }}</p>
              </div>
            </div>
            <AppBadge :variant="selectedApp.status" size="sm">
              {{ statusConfig[selectedApp.status]?.label }}
            </AppBadge>
          </div>

          <!-- Sync tip — if no data and not yet verified -->
          <div v-if="!visibleVcKeys.length && !selectedApp.isVerified"
            class="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-1">
            <i class="pi pi-exclamation-triangle text-amber-500 mt-0.5"></i>
            <div>
              <p class="text-sm font-bold text-amber-800">No qualification data in this snapshot</p>
              <p class="text-xs text-amber-700 mt-0.5">If you added eligibility, education, or experience to your profile <em>after</em> submitting, click <strong>Sync Profile</strong> in the footer to update this application's snapshot.</p>
            </div>
          </div>

          <!-- Verification checklist cards -->
          <div v-if="!visibleVcKeys.length" class="py-8 text-center text-[var(--text-faint)]">
            <i class="pi pi-folder-open text-2xl mb-2 block"></i>
            <p class="text-sm font-bold">No qualification data submitted</p>
          </div>
          <div class="grid grid-cols-1 gap-3">
            <div v-for="vc in visibleVcKeys" :key="vc.key"
              class="rounded-xl border overflow-hidden"
              :class="selectedApp.isVerified
                ? (vcItem(vc.key).checked ? 'border-emerald-200' : 'border-red-200')
                : 'border-[var(--border-main)]'">

              <!-- Category header -->
              <div :class="[
                'flex items-center justify-between px-4 py-3',
                selectedApp.isVerified
                  ? (vcItem(vc.key).checked ? 'bg-emerald-50' : 'bg-red-50')
                  : 'bg-[var(--bg-app)]'
              ]">
                <div class="flex items-center gap-2.5">
                  <div :class="[
                    'w-7 h-7 rounded-lg flex items-center justify-center',
                    selectedApp.isVerified
                      ? (vcItem(vc.key).checked ? 'bg-emerald-500' : 'bg-red-500')
                      : 'bg-[var(--color-primary)]'
                  ]">
                    <i :class="['pi text-white text-[11px]', vc.icon]"></i>
                  </div>
                  <span class="text-xs font-black uppercase tracking-wide text-[var(--text-main)]">{{ vc.label }}</span>
                </div>
                <!-- Verified result badge -->
                <template v-if="selectedApp.isVerified">
                  <span :class="[
                    'text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full',
                    vcItem(vc.key).checked
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  ]">
                    <i :class="['pi mr-1', vcItem(vc.key).checked ? 'pi-check' : 'pi-times']"></i>
                    {{ vc.key === 'performance' ? (vcItem(vc.key).checked ? 'Met' : 'Not Met') : (vcItem(vc.key).checked ? 'Qualified' : 'Disqualified') }}
                  </span>
                </template>
                <!-- Not verified yet -->
                <template v-else>
                  <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--border-main)] text-[var(--text-muted)]">
                    {{ (selectedApp.applicantData?.[vc.key] || []).length > 0 || (vc.key === 'performance' && selectedApp.applicantData?.performanceRating?.score) ? 'Data Submitted' : 'No Data' }}
                  </span>
                </template>
              </div>

              <!-- Verifier remark -->
              <div v-if="selectedApp.isVerified && vcItem(vc.key).note"
                class="px-4 py-2.5 border-t"
                :class="vcItem(vc.key).checked ? 'border-emerald-100 bg-white' : 'border-red-100 bg-white'">
                <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-1">Verifier Remark</p>
                <p class="text-xs text-[var(--text-main)]">{{ vcItem(vc.key).note }}</p>
              </div>

              <!-- Per-record audit (education / experience / training / eligibility) -->
              <div v-if="vc.key !== 'performance' && auditList(vc.key).length"
                class="border-t border-[var(--border-main)] divide-y divide-[var(--border-main)]">
                <div v-for="(rec, i) in auditList(vc.key)" :key="i"
                  class="px-4 py-2.5 bg-white flex items-start gap-3">
                  <!-- Relevance indicator -->
                  <div :class="[
                    'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                    rec.isRelevant === false ? 'bg-red-100' : rec.isRelevant === true ? 'bg-emerald-100' : 'bg-[var(--bg-app)]'
                  ]">
                    <i :class="[
                      'pi text-[9px]',
                      rec.isRelevant === false ? 'pi-times text-red-500' :
                      rec.isRelevant === true  ? 'pi-check text-emerald-500' :
                      'pi-minus text-[var(--text-faint)]'
                    ]"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <!-- Record title by category -->
                    <p class="text-xs font-bold text-[var(--text-main)] truncate">
                      <template v-if="vc.key === 'education'">{{ rec.degree || 'Education Record' }}</template>
                      <template v-else-if="vc.key === 'experience'">{{ rec.position || 'Experience Record' }}</template>
                      <template v-else-if="vc.key === 'training'">{{ rec.title || 'Training Record' }}</template>
                      <template v-else-if="vc.key === 'eligibility'">{{ rec.name || 'Eligibility Record' }}</template>
                    </p>
                    <!-- Sub-info -->
                    <p class="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                      <template v-if="vc.key === 'education'">{{ rec.school }}</template>
                      <template v-else-if="vc.key === 'experience'">{{ rec.company }}</template>
                      <template v-else-if="vc.key === 'training'">{{ rec.hours ? rec.hours + ' hours' : '' }}{{ rec.provider ? ' · ' + rec.provider : '' }}</template>
                      <template v-else-if="vc.key === 'eligibility'">{{ rec.rating ? 'Rating: ' + rec.rating : '' }}</template>
                    </p>
                    <!-- Audit remark -->
                    <p v-if="rec.auditRemarks" class="text-[10px] text-red-600 mt-1 italic">
                      <i class="pi pi-comment mr-1"></i>{{ rec.auditRemarks }}
                    </p>
                  </div>
                  <!-- Relevance tag -->
                  <span v-if="rec.isRelevant !== undefined && rec.isRelevant !== null"
                    :class="[
                      'text-[9px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0',
                      rec.isRelevant === false ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
                    ]">
                    {{ rec.isRelevant ? 'Relevant' : 'Irrelevant' }}
                  </span>
                </div>
              </div>

              <!-- Performance rating display -->
              <div v-if="vc.key === 'performance' && selectedApp.applicantData?.performanceRating?.score"
                class="border-t border-[var(--border-main)] px-4 py-2.5 bg-white flex items-center gap-3">
                <div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--bg-app)]">
                  <i class="pi pi-star text-[9px] text-[var(--color-primary)]"></i>
                </div>
                <div>
                  <p class="text-xs font-bold text-[var(--text-main)]">
                    {{ selectedApp.applicantData.performanceRating.score }}
                    <span class="font-normal text-[var(--text-muted)]"> — {{ selectedApp.applicantData.performanceRating.adjective }}</span>
                  </p>
                  <p v-if="selectedApp.applicantData.performanceRating.periodCovered" class="text-[10px] text-[var(--text-muted)]">
                    {{ selectedApp.applicantData.performanceRating.periodCovered }}
                  </p>
                </div>
              </div>

            </div>
          </div>

          <!-- Disqualification reason -->
          <div v-if="selectedApp.status === 'disqualified' && selectedApp.disqualificationReason"
            class="p-4 rounded-xl bg-red-50 border border-red-200">
            <p class="text-[9px] font-black uppercase tracking-widest text-red-500 mb-1">Disqualification Reason</p>
            <p class="text-sm text-red-800">{{ selectedApp.disqualificationReason }}</p>
          </div>
        </div>

        <!-- ── Documents Tab ─────────────────────────────────────────────── -->
        <div v-show="activeTab === 'documents'" class="space-y-3 animate-fade-in">
          <div v-if="!submissionDocsList.length"
            class="py-12 text-center text-[var(--text-faint)]">
            <i class="pi pi-folder-open text-3xl mb-3 block"></i>
            <p class="text-sm font-bold">No documents uploaded</p>
            <p class="text-xs mt-1">Documents you upload during application will appear here.</p>
          </div>
          <div v-for="(doc, idx) in submissionDocsList" :key="idx"
            class="flex items-center gap-4 p-4 bg-white border border-[var(--border-main)] rounded-xl hover:border-[var(--color-primary)] transition-all group">
            <div class="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-primary-light)] transition-colors">
              <i class="pi pi-file-pdf text-red-500 group-hover:text-[var(--color-primary)] transition-colors"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-black text-[var(--text-main)] uppercase tracking-tight truncate">
                {{ doc.type }}{{ doc.index ? ' #' + doc.index : '' }}
              </p>
              <p class="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{{ doc.fileName || 'Document' }}</p>
              <p v-if="doc.uploadedAt" class="text-[9px] text-[var(--text-faint)] mt-0.5">
                <i class="pi pi-clock mr-1"></i>{{ formatShort(doc.uploadedAt) }}
              </p>
            </div>
            <button @click="openViewer(doc)"
              class="w-9 h-9 rounded-xl bg-[var(--bg-app)] hover:bg-[var(--text-main)] flex items-center justify-center text-[var(--text-faint)] hover:text-white transition-all flex-shrink-0">
              <i class="pi pi-eye text-xs"></i>
            </button>
          </div>
        </div>

      </template>

      <!-- ── Footer ────────────────────────────────────────────────────────── -->
      <template #footer>
        <AppButton variant="secondary" @click="showModal = false">Close</AppButton>
        <div class="flex gap-2 flex-wrap">
          <!-- Sync profile — only when not yet verified -->
          <AppButton v-if="selectedApp && !selectedApp.isVerified"
            variant="ghost" icon="pi-refresh"
            :disabled="syncing"
            @click="syncProfile">
            {{ syncing ? 'Syncing...' : 'Sync Profile' }}
          </AppButton>
          <AppButton variant="outline" icon="pi-file-pdf" @click="showCoverPdf = true">Cover Page</AppButton>
          <!-- IER — Preliminary when not verified, Final when verified -->
          <AppButton
            :variant="isFinalIer ? 'primary' : 'outline'"
            :icon="isFinalIer ? 'pi-verified' : 'pi-file-edit'"
            @click="showIerPdf = true">
            {{ isFinalIer ? 'Final IER' : 'Preliminary IER' }}
          </AppButton>
        </div>
      </template>
    </AppModal>

    <!-- ── Global helpers ─────────────────────────────────────────────────── -->
    <ApplicantCoverPagePdf v-if="showCoverPdf && selectedApp" :app="selectedApp" @close="showCoverPdf = false" />
    <ApplicantIerPdf       v-if="showIerPdf  && selectedApp" :app="selectedApp" @close="showIerPdf  = false" />
    <AppFileViewer v-model="showViewer" :url="viewerUrl" :title="viewerTitle" />

  </div>
</template>
