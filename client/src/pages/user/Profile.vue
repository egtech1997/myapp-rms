<script setup>
import { ref, reactive, computed, onMounted, onActivated, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import { resolveUrl } from '@/utils/url'
import apiClient from '@/api/axios'

import { AppSpinner, AppFileViewer, AppModal } from '@/components/ui'

import PersonalTab    from '@/components/user/pds/PersonalTab.vue'
import FamilyTab      from '@/components/user/pds/FamilyTab.vue'
import EducationTab   from '@/components/user/pds/EducationTab.vue'
import EligibilityTab from '@/components/user/pds/EligibilityTab.vue'
import ExperienceTab  from '@/components/user/pds/ExperienceTab.vue'
import TrainingTab    from '@/components/user/pds/TrainingTab.vue'
import OthersTab      from '@/components/user/pds/OthersTab.vue'
import ReferencesTab  from '@/components/user/pds/ReferencesTab.vue'

defineOptions({ name: 'UserProfile' })

const authStore = useAuthStore()
const route     = useRoute()
const router    = useRouter()
const toast     = inject('$toast')

const isSetupMode = computed(() => route.query.setup === '1')
const nextPath    = computed(() => route.query.next || '/user/vacancies')

const loading   = ref(true)
const saving    = ref(false)
const activeTab = ref(localStorage.getItem('profile_active_tab') || 'personal')

const showViewer  = ref(false)
const viewerUrl   = ref('')
const viewerTitle = ref('')
const showTips    = ref(false)

const openViewer = (url, title = 'Document Preview') => {
  if (!url) return
  viewerUrl.value   = resolveUrl(url)
  viewerTitle.value = title
  showViewer.value  = true
}

const tabs = [
  { id: 'personal',    label: 'Personal',    icon: 'pi-user'           },
  { id: 'family',      label: 'Family',      icon: 'pi-users'          },
  { id: 'education',   label: 'Education',   icon: 'pi-graduation-cap' },
  { id: 'eligibility', label: 'Eligibility', icon: 'pi-verified'       },
  { id: 'experience',  label: 'Experience',  icon: 'pi-briefcase'      },
  { id: 'training',    label: 'Training',    icon: 'pi-book'           },
  { id: 'others',      label: 'Others',      icon: 'pi-list'           },
  { id: 'references',  label: 'References',  icon: 'pi-address-book'   },
]

const form = reactive({
  name: { firstName: '', middleName: '', lastName: '', suffix: '' },
  sex: '', birthDate: '', isIndigenous: false, isSoloParent: false, religion: '', disability: '', civilStatus: '',
  gsisNo: '', pagibigNo: '', philhealthNo: '', tinNo: '', philSysNo: '', agencyEmployeeNo: '',
  contact: { phones: [''], emails: [''] },
  currentAddress:  { sitio: '', barangay: '', municipality: '', city: '', province: '', zipCode: '', country: 'Philippines' },
  comelecAddress:  { sitio: '', barangay: '', municipality: '', city: '', province: '', zipCode: '', country: 'Philippines', document: '' },
  family: {
    spouse:   { firstName: '', middleName: '', lastName: '', suffix: '', occupation: '', employer: '', businessAddress: '', phone: '' },
    father:   { firstName: '', middleName: '', lastName: '', suffix: '' },
    mother:   { firstName: '', middleName: '', lastName: '', suffix: '' },
    children: [],
  },
  education: [], eligibility: [], experience: [], training: [],
  references: [],
  voluntaryWork: [],
  specialSkills: [], nonAcademicDistinctions: [], memberships: [],
  pdsQuestions: {
    q34a: false, q34b: false, q35a: false, q35b: false, q36: false, q37: false,
    q38a: false, q38b: false, q39: false, q40a: false, q40b: false, q40c: false,
    q34_details: '', q35_details: '', q36_details: '', q37_details: '',
    q38_details: '', q39_details: '', q40_details: '',
  },
  performanceRating: { score: '', adjective: '', periodCovered: '' },
})

const avatarSrc = computed(() =>
  authStore.user?.avatarUrl ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'U')}&background=4A4D8F&color=fff&bold=true`
)

const fullName = computed(() => {
  const n = form.name
  if (!n?.firstName) return authStore.user?.username || 'User'
  return [n.firstName, n.middleName ? n.middleName[0] + '.' : '', n.lastName]
    .filter(Boolean).join(' ')
})

const completenessSteps = computed(() => [
  { id: 'personal',    done: !!form.name?.firstName },
  { id: 'family',      done: !!(form.family?.father?.firstName || form.family?.children?.length) },
  { id: 'education',   done: !!(form.education?.length) },
  { id: 'eligibility', done: !!(form.eligibility?.length) },
  { id: 'experience',  done: !!(form.experience?.length) },
  { id: 'training',    done: !!(form.training?.length) },
  { id: 'others',      done: !!(form.specialSkills?.length || form.voluntaryWork?.length) },
  { id: 'references',  done: !!(form.references?.some(r => r.name)) },
])

const completenessPercent = computed(() => {
  const done = completenessSteps.value.filter(s => s.done).length
  return Math.round((done / completenessSteps.value.length) * 100)
})

const isDone = (tabId) => completenessSteps.value.find(s => s.id === tabId)?.done

const setTab = (id) => {
  activeTab.value = id
  localStorage.setItem('profile_active_tab', id)
}

const loadProfile = async () => {
  loading.value = true
  try {
    const { data } = await apiClient.get('/v1/profile/me')
    if (data.data) Object.assign(form, data.data)
  } catch {
    toast.fire({ icon: 'error', title: 'Failed to load profile data' })
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  saving.value = true
  try {
    await apiClient.put('/v1/profile/me', form)
    toast.fire({ icon: 'success', title: 'Profile saved!' })
    // If in setup mode and required fields are now filled, continue to intended destination
    if (isSetupMode.value && form.name?.firstName) {
      router.push(nextPath.value)
    }
  } catch {
    toast.fire({ icon: 'error', title: 'Failed to save profile' })
  } finally {
    saving.value = false
  }
}

const handleUpload = async (event, section, index, field) => {
  const file = event.target.files[0]
  if (!file) return

  // Resolve old URL for server-side cleanup on replace
  let oldUrl = ''
  if (section === 'education'     && index !== null) oldUrl = form.education[index]?.[field]              || ''
  if (section === 'eligibility'   && index !== null) oldUrl = form.eligibility[index]?.[field]            || ''
  if (section === 'experience'    && index !== null) oldUrl = form.experience[index]?.document            || ''
  if (section === 'training'      && index !== null) oldUrl = form.training[index]?.document              || ''
  if (section === 'comelecAddress')                  oldUrl = form.comelecAddress?.document               || ''

  // IMPORTANT: append type/field BEFORE file so multer reads them
  // in the diskStorage destination callback (stream order matters)
  const formData = new FormData()
  formData.append('type', section)
  if (field)  formData.append('field', field)
  if (oldUrl) formData.append('oldUrl', oldUrl)
  formData.append('file', file)

  try {
    const { data } = await apiClient.post('/v1/profile/upload-doc', formData)
    const at = data.uploadedAt || new Date().toISOString()
    if (section === 'education') {
      form.education[index][field] = data.fileUrl
      form.education[index][field === 'diploma' ? 'diplomaUploadedAt' : 'torUploadedAt'] = at
    }
    if (section === 'eligibility') {
      form.eligibility[index][field] = data.fileUrl
      form.eligibility[index][field === 'document' ? 'documentUploadedAt' : 'licenseDocumentUploadedAt'] = at
    }
    if (section === 'experience') {
      form.experience[index].document = data.fileUrl
      form.experience[index].documentUploadedAt = at
    }
    if (section === 'training') {
      form.training[index].document = data.fileUrl
      form.training[index].documentUploadedAt = at
    }
    if (section === 'comelecAddress') {
      form.comelecAddress.document = data.fileUrl
      form.comelecAddress.documentUploadedAt = at
    }
    // Auto-save so file URLs persist across page refreshes
    await apiClient.put('/v1/profile/me', form)
    toast.fire({ icon: 'success', title: 'Document uploaded and saved' })
  } catch {
    toast.fire({ icon: 'error', title: 'Upload failed' })
  }
}

onMounted(loadProfile)
onActivated(loadProfile)
</script>

<template>
  <div class="max-w-4xl mx-auto pb-12 animate-fade-in">

    <!-- ── Loading ──────────────────────────────────────────── -->
    <div v-if="loading" class="flex flex-col items-center justify-center gap-3 py-28
      bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-main)]"
      style="box-shadow:var(--shadow-sm)">
      <AppSpinner size="lg" />
      <p class="text-[11px] font-bold uppercase tracking-widest text-[var(--text-faint)]">Loading profile…</p>
    </div>

    <div v-else class="bg-[var(--surface)] border border-[var(--border-main)] rounded-[var(--radius-xl)] overflow-hidden"
      style="box-shadow:var(--shadow-md)">

      <!-- ── Profile banner ───────────────────────────────── -->
      <div class="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 border-b border-[var(--border-main)]"
        style="background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 5%, white) 0%, white 70%)">

        <!-- Avatar -->
        <img :src="avatarSrc" :alt="fullName"
          class="w-14 h-14 rounded-2xl object-cover border-2 border-[var(--color-primary-light)] shadow-sm shrink-0" />

        <!-- Identity -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">Applicant Profile</p>
            <button @click="showTips = true"
              class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-300 text-amber-600 bg-amber-50 hover:bg-amber-400 hover:text-white hover:border-amber-400 transition-all duration-200 outline-none">
              <i class="pi pi-lightbulb" style="font-size:8px"></i> Tips
            </button>
          </div>
          <p class="text-base font-black text-[var(--text-main)] leading-tight">{{ fullName }}</p>
          <p class="text-xs text-[var(--text-muted)] truncate">{{ authStore.user?.email }}</p>
        </div>

        <!-- Completeness + save -->
        <div class="flex flex-col sm:items-end gap-2 shrink-0">
          <button
            @click="saveProfile"
            :disabled="saving"
            class="btn-primary h-9 px-5 text-xs flex items-center gap-2 disabled:opacity-50 self-start sm:self-auto">
            <i :class="['pi text-[10px]', saving ? 'pi-spin pi-spinner' : 'pi-save']"></i>
            {{ saving ? 'Saving…' : 'Save All Changes' }}
          </button>
          <div class="flex items-center gap-2 min-w-[160px]">
            <div class="flex-1 h-1.5 bg-[var(--bg-app)] rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500"
                :class="completenessPercent === 100 ? 'bg-green-500' : 'bg-[var(--color-primary)]'"
                :style="{ width: completenessPercent + '%' }" />
            </div>
            <span class="text-[10px] font-black shrink-0"
              :class="completenessPercent === 100 ? 'text-green-600' : 'text-[var(--color-primary)]'">
              {{ completenessPercent }}%
            </span>
          </div>
          <p class="text-[10px] text-[var(--text-faint)]">
            {{ completenessSteps.filter(s => s.done).length }}/{{ completenessSteps.length }} sections filled
          </p>
        </div>
      </div>

      <!-- ── Horizontal tab bar ───────────────────────────── -->
      <div class="flex overflow-x-auto border-b border-[var(--border-main)] bg-[var(--surface)] scrollbar-none">
        <button
          v-for="tab in tabs" :key="tab.id"
          @click="setTab(tab.id)"
          :class="[
            'relative flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap',
            'transition-colors duration-150 shrink-0',
            activeTab === tab.id
              ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)]/40'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)]',
          ]">
          <i :class="['pi text-[11px]', tab.icon]"></i>
          {{ tab.label }}
          <!-- Done dot -->
          <span v-if="isDone(tab.id)"
            class="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
          <!-- Active underline -->
          <span v-if="activeTab === tab.id"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)] rounded-t-full"></span>
        </button>
      </div>

      <!-- ── Tab content ──────────────────────────────────── -->
      <div class="p-6">
        <PersonalTab    v-if="activeTab === 'personal'"    v-model="form"
          @upload="(e, section) => handleUpload(e, section, null, null)" @preview="openViewer" />
        <FamilyTab      v-if="activeTab === 'family'"      v-model="form.family" />
        <EducationTab   v-if="activeTab === 'education'"   v-model="form.education"
          @upload="(e, i, f) => handleUpload(e, 'education', i, f)" @preview="openViewer" />
        <EligibilityTab v-if="activeTab === 'eligibility'" v-model="form.eligibility"
          @upload="(e, i, f) => handleUpload(e, 'eligibility', i, f)" @preview="openViewer" />
        <ExperienceTab  v-if="activeTab === 'experience'"  v-model="form.experience"
          @upload="(e, i) => handleUpload(e, 'experience', i)" @preview="openViewer" />
        <TrainingTab    v-if="activeTab === 'training'"    v-model="form.training"
          @upload="(e, i) => handleUpload(e, 'training', i)" @preview="openViewer" />
        <OthersTab      v-if="activeTab === 'others'"      v-model="form" />
        <ReferencesTab  v-if="activeTab === 'references'"  v-model="form.references" />
      </div>

    </div>

    <AppFileViewer v-model="showViewer" :url="viewerUrl" :title="viewerTitle" />

    <!-- ── Upload Tips Modal ──────────────────────────────────────────────── -->
    <AppModal v-model="showTips" title="Document Upload Tips" size="lg">
      <div class="space-y-4">

        <!-- Intro -->
        <div class="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <i class="pi pi-lightbulb text-amber-500 mt-0.5 shrink-0"></i>
          <p class="text-xs text-amber-800 leading-relaxed">
            Upload supporting documents to each record so HR can verify your qualifications during the application process. Good-quality uploads prevent delays and rejections.
          </p>
        </div>

        <!-- Multi-page → PDF -->
        <div class="rounded-2xl border border-[var(--border-main)] overflow-hidden">
          <div class="px-4 py-3 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center gap-2">
            <i class="pi pi-file-pdf text-[var(--text-muted)]" style="font-size:11px"></i>
            <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">File Format Rules</p>
          </div>

          <div class="px-4 py-3 bg-[var(--surface)] border-b border-[var(--border-main)] flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
              <i class="pi pi-file-pdf text-rose-500" style="font-size:14px"></i>
            </div>
            <div>
              <p class="text-xs font-black text-[var(--text-main)] mb-0.5">Multi-page documents → PDF required</p>
              <p class="text-xs text-[var(--text-sub)] leading-relaxed">
                Documents with <strong>more than one page</strong> (e.g. Transcript of Records, IPCRF, Appointment Order) must be saved as a <strong>single PDF file</strong>. Do not upload separate images per page — they will not be accepted.
              </p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span v-for="ex in ['Transcript of Records','IPCRF / RPMS','Appointment Order','PDS Form 212','COE (multi-page)']" :key="ex"
                  class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-200">{{ ex }}</span>
              </div>
            </div>
          </div>

          <div class="px-4 py-3 bg-[var(--surface)] flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0 mt-0.5">
              <i class="pi pi-image text-sky-500" style="font-size:14px"></i>
            </div>
            <div>
              <p class="text-xs font-black text-[var(--text-main)] mb-0.5">Single-page documents → image accepted</p>
              <p class="text-xs text-[var(--text-sub)] leading-relaxed">
                Documents that fit on <strong>one page</strong> can be uploaded as a <strong>JPG or PNG photo</strong>. Make sure the full document is visible with no cut-off edges.
              </p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span v-for="ex in ['Training Certificate','Eligibility Certificate','License ID','Award / Commendation','Single-page COE']" :key="ex"
                  class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-50 text-sky-600 border border-sky-200">{{ ex }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quality tips -->
        <div class="rounded-2xl border border-[var(--border-main)] overflow-hidden">
          <div class="px-4 py-3 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center gap-2">
            <i class="pi pi-eye text-[var(--text-muted)]" style="font-size:11px"></i>
            <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">Photo Quality Checklist</p>
          </div>
          <div class="px-4 py-3 bg-[var(--surface)] space-y-2.5">
            <div v-for="tip in [
              { icon: 'pi-sun',        text: 'Take photos in good lighting — natural light near a window works best.' },
              { icon: 'pi-stop',       text: 'Lay the document flat on a plain surface. No folds, wrinkles, or curled edges.' },
              { icon: 'pi-eye',        text: 'All text, signatures, and official stamps must be clearly readable.' },
              { icon: 'pi-times-circle', text: 'Avoid shadows across the document and glare from flashlights.' },
              { icon: 'pi-expand',     text: 'The entire document must fit inside the frame — no cut-off edges.' },
            ]" :key="tip.text" class="flex items-start gap-2.5">
              <div class="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                <i :class="['pi text-[9px] text-emerald-600', tip.icon]"></i>
              </div>
              <p class="text-xs text-[var(--text-sub)] leading-snug">{{ tip.text }}</p>
            </div>
          </div>
        </div>

        <!-- Scanner apps -->
        <div class="rounded-2xl border border-amber-200 overflow-hidden">
          <div class="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
            <i class="pi pi-mobile text-amber-600" style="font-size:11px"></i>
            <p class="text-[10px] font-black uppercase tracking-widest text-amber-800">No scanner? Use your phone</p>
          </div>
          <div class="px-4 py-3 bg-[var(--surface)] space-y-3">
            <p class="text-xs text-[var(--text-sub)] leading-relaxed">
              Free scanner apps automatically straighten, crop, and convert your document photo into a clean PDF — no physical scanner needed.
            </p>
            <div class="grid grid-cols-2 gap-2">
              <div v-for="app in [
                { name: 'Adobe Scan',     icon: 'pi-file-pdf', note: 'iOS & Android — best quality PDF output' },
                { name: 'Microsoft Lens', icon: 'pi-camera',   note: 'iOS & Android — integrates with OneDrive' },
                { name: 'Google Drive',   icon: 'pi-google',   note: 'Android built-in — tap + then Scan' },
                { name: 'CamScanner',     icon: 'pi-qrcode',   note: 'iOS & Android — quick and reliable' },
              ]" :key="app.name"
                class="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)]">
                <i :class="['pi text-amber-500 shrink-0 mt-0.5', app.icon]" style="font-size:14px"></i>
                <div class="min-w-0">
                  <p class="text-xs font-bold text-[var(--text-main)]">{{ app.name }}</p>
                  <p class="text-[10px] text-[var(--text-faint)] leading-snug">{{ app.note }}</p>
                </div>
              </div>
            </div>
            <p class="text-[10px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2 border border-amber-200">
              <strong>How to use:</strong> Open app → tap <strong>Scan</strong> → point camera at document → adjust crop → save as <strong>PDF</strong> → upload here.
            </p>
          </div>
        </div>

      </div>
    </AppModal>
  </div>
</template>

<style scoped>
.scrollbar-none { scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
