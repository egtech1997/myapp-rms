<script setup>
import { ref, computed, onMounted, onActivated, inject } from 'vue'
import apiClient from '@/api/axios'
import ApplicantCoverPagePdf from '@/components/user/ApplicantCoverPagePdf.vue'
import { AppBadge, AppModal, AppTabs, AppButton, AppFileViewer, AppSpinner } from '@/components/ui'
import { statusConfig } from '@/utils/statusColors'
import { resolveUrl } from '@/utils/url'

// Components
import ApplicationCard from '@/components/user/ApplicationCard.vue'

defineOptions({ name: 'UserApplications' })

const toast = inject('$toast')

// ── STATE ──────────────────────────────────────────────────────────────────
const applications = ref([])
const loading      = ref(false)
const searchQuery  = ref('')
const filterStatus = ref('')

const selectedApp  = ref(null)
const showModal    = ref(false)
const showCoverPdf = ref(false)
const activeTab    = ref('details')

// Snapshot Edit State
const editMode    = ref(false)
const editLoading = ref(false)
const editSaving  = ref(false)
const editProfile = ref(null)
const selEdu      = ref([])
const selElig     = ref([])
const selTrn      = ref([])
const selExp      = ref([])
const perfRating  = ref({ score: '', adjective: '', periodCovered: '' })

// File Viewer
const showViewer  = ref(false)
const viewerUrl   = ref('')
const viewerTitle = ref('')

const openViewer = (file) => {
  viewerUrl.value = resolveUrl(file.fileUrl)
  viewerTitle.value = `Document: ${file.type.replace(/_/g, ' ').toUpperCase()}`
  showViewer.value = true
}

// ── COMPUTED ───────────────────────────────────────────────────────────────
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

const modalTabs = [
  { key: 'details',   label: 'Overview',     icon: 'pi-compass' },
  { key: 'documents', label: 'Requirements', icon: 'pi-file-pdf' }
]

const canEdit = computed(() => 
  selectedApp.value && 
  !selectedApp.value.isVerified && 
  ['applied', 'verifying'].includes(selectedApp.value.status)
)

// ── ACTIONS ────────────────────────────────────────────────────────────────
const fetchApplications = async () => {
  loading.value = true
  try {
    const { data } = await apiClient.get('/v1/applications/my-applications')
    applications.value = data.data || []
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Failed to sync applications' })
  } finally {
    loading.value = false
  }
}

const openApp = (app) => {
  selectedApp.value = app
  editMode.value    = false
  activeTab.value   = 'details'
  showModal.value   = true
}

const startEdit = async () => {
  editLoading.value = true
  try {
    const { data } = await apiClient.get('/v1/profile/me')
    editProfile.value = data.data
    const p = editProfile.value
    const ad = selectedApp.value.applicantData || {}

    // Smart pre-selection based on existing snapshot
    selEdu.value = (p?.education || []).map((e, i) => 
      (ad.education || []).some(a => a.degree === e.degree) ? i : -1).filter(i => i !== -1)
    selElig.value = (p?.eligibility || []).map((e, i) => 
      (ad.eligibility || []).some(a => a.name === e.name) ? i : -1).filter(i => i !== -1)
    selExp.value = (p?.experience || []).map((e, i) => 
      (ad.experience || []).some(a => a.positionTitle === e.positionTitle) ? i : -1).filter(i => i !== -1)
    selTrn.value = (p?.training || []).map((e, i) => 
      (ad.training || []).some(a => a.title === e.title) ? i : -1).filter(i => i !== -1)

    perfRating.value = {
      score: ad.performanceRating?.score || p?.performanceRating?.score || '',
      adjective: ad.performanceRating?.adjective || p?.performanceRating?.adjective || '',
      periodCovered: ad.performanceRating?.periodCovered || p?.performanceRating?.periodCovered || '',
    }
    editMode.value = true
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Profile sync failed' })
  } finally {
    editLoading.value = false
  }
}

const saveEdit = async () => {
  editSaving.value = true
  const p = editProfile.value
  const applicantData = {
    personalInfo: {
      firstName: p.name.firstName, lastName: p.name.lastName, middleName: p.name.middleName,
      email: p.contact.emails[0], phone: p.contact.phones[0], address: p.currentAddress
    },
    education:   p.education.filter((_, i) => selEdu.value.includes(i)),
    eligibility: p.eligibility.filter((_, i) => selElig.value.includes(i)),
    experience:  p.experience.filter((_, i) => selExp.value.includes(i)),
    training:    p.training.filter((_, i) => selTrn.value.includes(i)),
    performanceRating: perfRating.value
  }

  try {
    const { data } = await apiClient.patch(`/v1/applications/${selectedApp.value._id}/applicant-data`, { applicantData })
    selectedApp.value.applicantData = data.data.applicantData
    editMode.value = false
    toast.fire({ icon: 'success', title: 'Application snapshot updated' })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Update failed' })
  } finally {
    editSaving.value = false
  }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

onMounted(fetchApplications)
onActivated(fetchApplications)
</script>

<template>
  <div class="flex flex-col gap-8 pb-20 animate-fade-in">
    
    <!-- 1. Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
       <div>
          <p class="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)] mb-2">Guih-Ranking Portfolio</p>
          <h1 class="text-3xl font-black text-[var(--text-main)] tracking-tight">My Submissions</h1>
          <p class="text-sm text-[var(--text-muted)] mt-1 font-medium">Track your application journey and recruitment progress.</p>
       </div>
       <div class="flex items-center gap-3">
          <div class="h-12 px-5 rounded-2xl bg-white border border-[var(--border-main)] flex items-center gap-4 shadow-sm">
             <div class="w-8 h-8 rounded-lg bg-[var(--bg-app)] flex items-center justify-center text-[var(--color-primary)]">
                <i class="pi pi-folder-open text-xs"></i>
             </div>
             <div class="text-right">
                <p class="text-lg font-black text-[var(--text-main)] leading-none">{{ filtered.length }}</p>
                <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)] mt-1">Total</p>
             </div>
          </div>
          <button @click="fetchApplications" :disabled="loading" class="w-12 h-12 rounded-2xl bg-white border border-[var(--border-main)] flex items-center justify-center text-[var(--text-faint)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all shadow-sm">
             <i :class="['pi pi-sync', { 'animate-spin': loading }]"></i>
          </button>
       </div>
    </div>

    <!-- 2. Filters -->
    <div class="bg-white border border-[var(--border-main)] rounded-2xl p-4 flex flex-col md:flex-row gap-4 shadow-sm">
       <div class="relative flex-1 group">
          <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] group-focus-within:text-[var(--color-primary)]"></i>
          <input v-model="searchQuery" type="text" placeholder="Search applications..." 
            class="w-full h-12 pl-11 pr-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-medium focus:bg-white focus:ring-4 focus:ring-[var(--color-primary-ring)]/10 outline-none transition-all" />
       </div>
       <select v-model="filterStatus" class="h-12 px-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-[var(--color-primary-ring)]/10 transition-all cursor-pointer">
          <option value="">All Statuses</option>
          <option v-for="(cfg, key) in statusConfig" :key="key" :value="key">{{ cfg.label }}</option>
       </select>
    </div>

    <!-- 3. Content -->
    <div v-if="loading && !applications.length" class="grid grid-cols-1 md:grid-cols-2 gap-6">
       <div v-for="i in 4" :key="i" class="h-32 rounded-3xl bg-white border border-[var(--border-main)] animate-pulse"></div>
    </div>

    <div v-else-if="filtered.length === 0" class="py-24 text-center bg-white border border-[var(--border-main)] rounded-3xl">
       <div class="w-20 h-20 rounded-full bg-[var(--bg-app)] flex items-center justify-center mx-auto mb-4 text-[var(--text-faint)]">
          <i class="pi pi-inbox text-3xl"></i>
       </div>
       <h3 class="text-lg font-black text-[var(--text-main)] uppercase">No applications found</h3>
       <p class="text-xs text-[var(--text-muted)] mt-2">Try adjusting your filters or start exploring new opportunities.</p>
       <router-link to="/user/vacancies" class="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] bg-[var(--color-primary-light)] px-6 py-3 rounded-xl hover:shadow-lg transition-all">
          Browse Vacancies <i class="pi pi-arrow-right"></i>
       </router-link>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
       <ApplicationCard 
         v-for="app in filtered" :key="app._id"
         :app="app"
         @click="openApp"
       />
    </div>

    <!-- 4. Detail Modal -->
    <AppModal v-model="showModal" 
      :title="editMode ? 'Update Data Snapshot' : (selectedApp?.job?.positionTitle || 'Application Detail')"
      :subtitle="editMode ? 'Resync your PDS records for this specific application.' : 'Recruitment journey and verification status.'"
      size="lg" @close="showModal = false">
      
      <template v-if="!editMode">
         <AppTabs v-model="activeTab" :tabs="modalTabs">
            <template #details>
               <div class="space-y-10 py-4 animate-fade-in">
                  <!-- Progress Tracker UI can be extracted too, but for now kept inline for brevity in logic -->
                  <div class="p-8 bg-[var(--surface-2)] border border-[var(--border-main)] rounded-[2.5rem] flex flex-col items-center">
                     <div class="w-full flex items-center justify-between mb-10">
                        <h4 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.2em]">Application Journey</h4>
                        <AppBadge v-if="selectedApp" :variant="selectedApp.status" size="sm">{{ statusConfig[selectedApp.status]?.label }}</AppBadge>
                     </div>
                     
                     <div v-if="selectedApp" class="w-full flex justify-between relative px-4">
                        <div class="absolute top-5 left-10 right-10 h-1 bg-[var(--border-main)] -z-0"></div>
                        <div v-for="(step, idx) in [
                           { id: 'applied', icon: 'pi-send', label: 'Applied' },
                           { id: 'verifying', icon: 'pi-search', label: 'Verified' },
                           { id: 'comparative_assessment', icon: 'pi-chart-bar', label: 'Assessed' },
                           { id: 'appointed', icon: 'pi-check-circle', label: 'Appointed' }
                        ]" :key="step.id" class="flex flex-col items-center gap-3 z-10">
                           <div :class="['w-10 h-10 rounded-xl flex items-center justify-center border-4 transition-all', 
                              (statusConfig[selectedApp.status]?.order || 0) >= idx + 1 ? 'bg-[var(--color-primary)] border-white text-white shadow-lg' : 'bg-white border-[var(--bg-app)] text-[var(--text-faint)]']">
                              <i :class="['pi text-xs', step.icon]"></i>
                           </div>
                           <span class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)]">{{ step.label }}</span>
                        </div>
                     </div>
                  </div>

                  <!-- Score Card (If Assessed) -->
                  <div v-if="selectedApp?.hrRating" class="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                     <div class="absolute top-0 right-0 p-8">
                        <p class="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Assessment Score</p>
                        <p class="text-5xl font-black tabular-nums tracking-tighter">{{ selectedApp.totalScore?.toFixed(3) || '0.000' }}</p>
                     </div>
                     <div class="relative z-10">
                        <h4 class="text-xs font-black uppercase tracking-widest text-blue-400 mb-6">Comparative Results</h4>
                        <div class="grid grid-cols-2 gap-4 max-w-sm">
                           <div v-for="(val, lbl) in { 'EDU': selectedApp.hrRating.educationPoints, 'EXP': selectedApp.hrRating.experiencePoints, 'TRN': selectedApp.hrRating.trainingPoints, 'ELG': selectedApp.hrRating.eligibilityPoints }" :key="lbl" class="bg-white/5 p-3 rounded-xl border border-white/5">
                              <p class="text-[9px] font-black text-white/40 mb-1">{{ lbl }}</p>
                              <p class="text-lg font-black tabular-nums">{{ val?.toFixed(2) || '0.00' }}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </template>

            <template #documents>
               <div class="grid grid-cols-1 gap-3 py-4 animate-fade-in">
                  <div v-for="doc in selectedApp?.attachments || []" :key="doc._id" class="p-5 bg-white border border-[var(--border-main)] rounded-2xl flex items-center justify-between group hover:border-[var(--color-primary)] transition-all">
                     <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-faint)] group-hover:bg-[var(--color-primary-light)] group-hover:text-[var(--color-primary)] transition-all">
                           <i class="pi pi-file-pdf"></i>
                        </div>
                        <div>
                           <p class="text-xs font-black text-[var(--text-main)] uppercase tracking-tight">{{ doc.type.replace(/_/g, ' ') }}</p>
                           <p class="text-[10px] text-[var(--text-faint)] font-bold mt-0.5">Snapshot from Profile</p>
                        </div>
                     </div>
                     <button @click="openViewer(doc)" class="w-10 h-10 rounded-xl bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-faint)] hover:bg-[var(--text-main)] hover:text-white transition-all">
                        <i class="pi pi-eye text-xs"></i>
                     </button>
                  </div>
               </div>
            </template>
         </AppTabs>
      </template>

      <!-- Snapshot Editor -->
      <template v-else>
         <div class="space-y-8 py-4 animate-fade-in">
            <div v-for="sec in [
               { id: 'edu', label: 'Academic Records', icon: 'pi-graduation-cap', sel: selEdu, list: editProfile?.education, t: e => e.degree },
               { id: 'exp', label: 'Service Experience', icon: 'pi-briefcase', sel: selExp, list: editProfile?.experience, t: e => e.positionTitle },
            ]" :key="sec.id" class="space-y-4">
               <h5 class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] flex items-center gap-2">
                  <i :class="['pi text-[10px]', sec.icon]"></i> {{ sec.label }}
               </h5>
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div v-for="(item, i) in sec.list" :key="i" @click="() => { 
                     const idx = sec.sel.indexOf(i); 
                     if (idx === -1) sec.sel.push(i); else sec.sel.splice(idx, 1);
                  }" :class="['p-4 rounded-2xl border-2 transition-all cursor-pointer', sec.sel.includes(i) ? 'border-[var(--color-primary)] bg-blue-50/30' : 'border-[var(--border-main)] opacity-60 hover:opacity-100']">
                     <p class="text-xs font-black uppercase tracking-tight truncate">{{ sec.t(item) }}</p>
                     <p class="text-[9px] font-bold text-[var(--text-faint)] truncate mt-1">{{ item.schoolName || item.department }}</p>
                  </div>
               </div>
            </div>
         </div>
      </template>

      <template #footer>
         <template v-if="!editMode">
            <AppButton variant="secondary" @click="showModal = false">Close</AppButton>
            <div class="flex gap-2">
               <AppButton variant="outline" icon="pi-file-pdf" @click="showCoverPdf = true">Export Cover</AppButton>
               <AppButton v-if="canEdit" variant="primary" icon="pi-sync" :loading="editLoading" @click="startEdit">Update Snapshot</AppButton>
            </div>
         </template>
         <template v-else>
            <AppButton variant="secondary" @click="editMode = false">Cancel</AppButton>
            <AppButton variant="primary" icon="pi-check-circle" :loading="editSaving" @click="saveEdit">Finalize Update</AppButton>
         </template>
      </template>
    </AppModal>

    <!-- Global Helpers -->
    <ApplicantCoverPagePdf v-if="showCoverPdf && selectedApp" :app="selectedApp" @close="showCoverPdf = false" />
    <AppFileViewer v-model="showViewer" :url="viewerUrl" :title="viewerTitle" />

  </div>
</template>
