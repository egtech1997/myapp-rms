<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { resolveUrl } from '@/utils/url'
import apiClient from '@/api/axios'

// UI Primitives
import { AppButton, AppFileViewer, AppSpinner, AppCard, AppTabs } from '@/components/ui'

// PDS Tabs
import PersonalTab from '@/components/user/pds/PersonalTab.vue'
import FamilyTab from '@/components/user/pds/FamilyTab.vue'
import EducationTab from '@/components/user/pds/EducationTab.vue'
import EligibilityTab from '@/components/user/pds/EligibilityTab.vue'
import ExperienceTab from '@/components/user/pds/ExperienceTab.vue'
import TrainingTab from '@/components/user/pds/TrainingTab.vue'
import OthersTab from '@/components/user/pds/OthersTab.vue'

defineOptions({ name: 'UserProfile' })

const authStore = useAuthStore()
const toast = inject('$toast')

// ── STATE ──────────────────────────────────────────────────────────────────
const loading = ref(true)
const saving  = ref(false)
const activeTab = ref(localStorage.getItem('pds_active_tab') || 'personal')

// File Viewer
const showViewer = ref(false)
const viewerUrl  = ref('')
const viewerTitle = ref('')

const openViewer = (url, title = 'Document Preview') => {
  if (!url) return
  viewerUrl.value = resolveUrl(url)
  viewerTitle.value = title
  showViewer.value = true
}

const tabs = [
  { id: 'personal',    label: 'Personal',    icon: 'pi-user' },
  { id: 'family',      label: 'Family',      icon: 'pi-users' },
  { id: 'education',   label: 'Education',   icon: 'pi-graduation-cap' },
  { id: 'eligibility', label: 'Eligibility', icon: 'pi-verified' },
  { id: 'experience',  label: 'Experience',  icon: 'pi-briefcase' },
  { id: 'training',    label: 'Training',    icon: 'pi-book' },
  { id: 'others',      label: 'Other',       icon: 'pi-list' },
]

const form = reactive({
  name: { firstName: '', middleName: '', lastName: '', suffix: '' },
  sex: '', birthDate: '', isIndigenous: false, isSoloParent: false, religion: '', disability: '', civilStatus: '',
  gsisNo: '', pagibigNo: '', philhealthNo: '', tinNo: '', philSysNo: '', agencyEmployeeNo: '',
  contact: { phones: [''], emails: [''] },
  currentAddress: { sitio: '', barangay: '', municipality: '', city: '', province: '', zipCode: '', country: 'Philippines' },
  comelecAddress: { sitio: '', barangay: '', municipality: '', city: '', province: '', zipCode: '', country: 'Philippines', document: '' },
  family: {
    spouse: { firstName: '', middleName: '', lastName: '', suffix: '', occupation: '', employer: '', businessAddress: '', phone: '' },
    father: { firstName: '', middleName: '', lastName: '', suffix: '' },
    mother: { firstName: '', middleName: '', lastName: '', suffix: '' },
    children: [],
  },
  education: [], eligibility: [], experience: [], training: [],
  voluntaryWork: [],
  specialSkills: [], nonAcademicDistinctions: [], memberships: [],
  pdsQuestions: {
    q34a: false, q34b: false, q35a: false, q35b: false, q36: false, q37: false,
    q38a: false, q38b: false, q39: false, q40a: false, q40b: false, q40c: false,
    q34_details: '', q35_details: '', q36_details: '', q37_details: '', q38_details: '', q39_details: '', q40_details: ''
  },
  performanceRating: { score: '', adjective: '', periodCovered: '' }
})

// ── ACTIONS ────────────────────────────────────────────────────────────────

const setTab = (id) => {
  activeTab.value = id
  localStorage.setItem('pds_active_tab', id)
}

const loadProfile = async () => {
  loading.value = true
  try {
    const { data } = await apiClient.get('/v1/profile/me')
    if (data.data) {
       // Merge data into reactive form
       Object.assign(form, data.data)
    }
  } catch (err) {
    console.error('Failed to load profile', err)
    toast.fire({ icon: 'error', title: 'Failed to load profile data' })
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  saving.value = true
  try {
    await apiClient.put('/v1/profile/me', form)
    toast.fire({ icon: 'success', title: 'Profile saved successfully' })
  } catch (err) {
    console.error('Save failed', err)
    toast.fire({ icon: 'error', title: 'Failed to save profile' })
  } finally {
    saving.value = false
  }
}

// Global Upload Handler for Tab Components
const handleUpload = async (event, section, index, field) => {
  const file = event.target.files[0]
  if (!file) return
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', section)
  if (field) formData.append('field', field)

  try {
    const { data } = await apiClient.post('/v1/profile/upload-doc', formData)
    
    // Dynamically update the form based on section
    if (section === 'education') {
      form.education[index][field] = data.fileUrl
    } else if (section === 'eligibility') {
      form.eligibility[index].document = data.fileUrl
    } else if (section === 'experience') {
      form.experience[index].document = data.fileUrl
    } else if (section === 'training') {
      form.training[index].document = data.fileUrl
    }
    
    toast.fire({ icon: 'success', title: 'Document uploaded' })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Upload failed' })
  }
}

onMounted(loadProfile)
</script>

<template>
  <div class="max-w-6xl mx-auto pb-20">
    
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-slide-down">
      <div>
        <p class="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)] mb-2">Guih-Ranking PDS Hub</p>
        <h1 class="text-3xl font-black text-[var(--text-main)] tracking-tight">My Application Profile</h1>
        <p class="text-sm text-[var(--text-muted)] mt-1 font-medium">Keep your Personal Data Sheet (CS Form 212) up to date.</p>
      </div>
      <div class="flex items-center gap-3">
        <AppButton @click="saveProfile" :loading="saving" icon="pi-save" size="lg" class="shadow-lg shadow-[var(--color-primary)]/20 px-8">
           Save All Changes
        </AppButton>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div v-if="loading" class="py-20 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-[var(--border-main)]">
       <AppSpinner size="lg" />
       <p class="text-xs font-black uppercase tracking-widest text-[var(--text-faint)]">Synchronizing Profile...</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Left: Navigation Sidebar -->
      <div class="lg:col-span-1">
        <div class="sticky top-8 flex flex-col gap-2">
          <button v-for="tab in tabs" :key="tab.id"
            @click="setTab(tab.id)"
            :class="[
              'w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 group',
              activeTab === tab.id 
                ? 'bg-[var(--color-primary)] text-white shadow-xl shadow-[var(--color-primary)]/20 translate-x-2' 
                : 'bg-white border border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:border-[var(--border-strong)]'
            ]">
            <div :class="['w-8 h-8 rounded-xl flex items-center justify-center transition-colors', activeTab === tab.id ? 'bg-white/20' : 'bg-[var(--bg-app)] group-hover:bg-white']">
              <i :class="['pi text-xs', tab.icon]"></i>
            </div>
            <span class="text-xs font-black uppercase tracking-widest">{{ tab.label }}</span>
            <i v-if="activeTab === tab.id" class="pi pi-chevron-right ml-auto text-[10px] opacity-50"></i>
          </button>
          
          <div class="mt-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col gap-4">
             <div class="flex items-center gap-2 text-emerald-700">
                <i class="pi pi-shield text-xs"></i>
                <span class="text-[10px] font-black uppercase tracking-widest">Compliance</span>
             </div>
             <p class="text-[11px] text-emerald-800 leading-relaxed font-medium">Your data is stored securely and processed according to DepEd meritocracy standards.</p>
          </div>
        </div>
      </div>

      <!-- Right: Form Content -->
      <div class="lg:col-span-3">
        <div class="bg-white border border-[var(--border-main)] rounded-3xl shadow-sm min-h-[600px] overflow-hidden">
           <!-- Tab Header -->
           <div class="px-8 py-5 border-b border-[var(--border-main)] bg-[var(--surface-2)] flex items-center justify-between">
              <div class="flex items-center gap-3">
                 <h2 class="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">
                   {{ tabs.find(t => t.id === activeTab)?.label }} Section
                 </h2>
                 <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-tighter">Draft</span>
              </div>
              <div class="flex items-center gap-2 text-[var(--text-faint)]">
                 <i class="pi pi-lock text-[10px]"></i>
                 <span class="text-[10px] font-bold uppercase tracking-widest">Encrypted Field</span>
              </div>
           </div>

           <!-- Tab Viewport -->
           <div class="p-8">
              <PersonalTab    v-if="activeTab === 'personal'"    v-model="form" />
              <FamilyTab      v-if="activeTab === 'family'"      v-model="form.family" />
              <EducationTab   v-if="activeTab === 'education'"   v-model="form.education" @upload="(e, i, f) => handleUpload(e, 'education', i, f)" @preview="openViewer" />
              <EligibilityTab v-if="activeTab === 'eligibility'" v-model="form.eligibility" @upload="(e, i) => handleUpload(e, 'eligibility', i)" @preview="openViewer" />
              <ExperienceTab  v-if="activeTab === 'experience'"  v-model="form.experience" @upload="(e, i) => handleUpload(e, 'experience', i)" @preview="openViewer" />
              <TrainingTab    v-if="activeTab === 'training'"    v-model="form.training" @upload="(e, i) => handleUpload(e, 'training', i)" @preview="openViewer" />
              <OthersTab      v-if="activeTab === 'others'"      v-model="form" />
           </div>

           <!-- Sticky Footer inside card -->
           <div class="px-8 py-5 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex items-center justify-between">
              <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">End of {{ activeTab }} section</p>
              <AppButton @click="saveProfile" :loading="saving" size="sm" variant="secondary" icon="pi-check">
                 Quick Save
              </AppButton>
           </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <AppFileViewer v-model="showViewer" :url="viewerUrl" :title="viewerTitle" />

  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s var(--ease-out) both;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
