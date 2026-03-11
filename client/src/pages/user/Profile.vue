<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'
import { ELIGIBILITY_GROUPS } from '@/utils/eligibilityOptions'
import { AppButton, AppCheckbox, AppRadio } from '@/components/ui'

const authStore = useAuthStore()
const toast = inject('$toast')

const yesNoOptions = [
  { label: 'Yes', value: true },
  { label: 'No', value: false }
]

const loading = ref(true)
const saving = ref(false)
const activeTab = ref(localStorage.getItem('pds_active_tab') || 'personal')

const setTab = (id) => {
  activeTab.value = id
  localStorage.setItem('pds_active_tab', id)
}

const tabs = [
  { id: 'personal', label: 'Personal Info', icon: 'pi-user' },
  { id: 'family', label: 'Family Background', icon: 'pi-users' },
  { id: 'education', label: 'Education', icon: 'pi-graduation-cap' },
  { id: 'eligibility', label: 'Eligibility', icon: 'pi-verified' },
  { id: 'experience', label: 'Work Experience', icon: 'pi-briefcase' },
  { id: 'training', label: 'L&D / Trainings', icon: 'pi-book' },
  { id: 'voluntary', label: 'Voluntary Work', icon: 'pi-heart' },
  { id: 'others', label: 'Other Info', icon: 'pi-list' },
]

const familyRelations = [
  { id: 'spouse', label: 'Spouse Details' },
  { id: 'father', label: "Father's Name" },
  { id: 'mother', label: "Mother's Details (Maiden Name)" }
]

const othersLists = [
  { id: 'skills', field: 'specialSkills', label: 'Special skills and hobbies' },
  { id: 'distinctions', field: 'nonAcademicDistinctions', label: 'Distinction/Recognition' },
  { id: 'memberships', field: 'memberships', label: 'Membership in association/Organization' }
]

const form = reactive({
  name: { firstName: '', middleName: '', lastName: '', suffix: '' },
  sex: '', birthDate: '', birthPlace: '', height: '', weight: '', bloodType: '',
  gsisNo: '', pagibigNo: '', philhealthNo: '', tinNo: '', philSysNo: '', agencyEmployeeNo: '',
  isIndigenous: false, isSoloParent: false, religion: '', disability: '', civilStatus: '',
  contact: { phones: [''], emails: [''] },
  currentAddress: { sitio: '', barangay: '', municipality: '', city: '', province: '', zipCode: '', country: 'Philippines' },
  comelecAddress: { sitio: '', barangay: '', municipality: '', city: '', province: '', zipCode: '', country: 'Philippines', document: '' },
  family: {
    spouse: { firstName: '', middleName: '', lastName: '', suffix: '', occupation: '', employer: '', businessAddress: '', phone: '' },
    father: { firstName: '', middleName: '', lastName: '', suffix: '' },
    mother: { firstName: '', middleName: '', lastName: '', suffix: '' },
    children: [],
  },
  education: [], eligibility: [], experience: [], voluntaryWork: [], training: [],
  competencies: [], specialSkills: [], nonAcademicDistinctions: [], memberships: [],
  pdsQuestions: {
    q34a: false, q34b: false, q35a: false, q35b: false, q36: false, q37: false, q38a: false, q38b: false, q39: false, q40a: false, q40b: false, q40c: false,
    q34_details: '', q35_details: '', q36_details: '', q37_details: '', q38_details: '', q39_details: '', q40_details: ''
  },
  references: [],
  performanceRating: { score: null, adjective: '', periodCovered: '' },
  visibility: { phone: false, email: false, address: false },
})

const religions = [
  'Roman Catholicism', 'Islam', 'Protestantism', 'Iglesia ni Cristo',
  'Philippine Independent Church (Aglipayan Church)', 'Seventh-day Adventist Church',
  'Jehovah’s Witnesses', 'Buddhism', 'Hinduism', 'Judaism', 'Baháʼí Faith', 'Other'
]

const disabilityOptions = [
  'None', 'Physical', 'Sensory', 'Intellectual', 'Learning', 'Mental', 'Developmental', 'Speech'
]

// Custom Multi-select for Disability
const showDisabilityDropdown = ref(false)
const selectedDisabilities = computed({
  get: () => form.disability ? form.disability.split(', ').filter(Boolean) : [],
  set: (val) => {
    form.disability = val.join(', ')
  }
})

const toggleDisability = (opt) => {
  let current = [...selectedDisabilities.value]
  if (current.includes(opt)) {
    current = current.filter(d => d !== opt)
  } else {
    current.push(opt)
  }
  selectedDisabilities.value = current
}

const handleComelecUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  try {
    const { data } = await apiClient.post('/v1/profile/upload-doc', formData)
    form.comelecAddress.document = data.fileUrl
    toast.fire({ icon: 'success', title: 'Document Uploaded' })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Upload Failed' })
  }
}

const handleEligibilityUpload = async (e, index) => {
  const file = e.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  try {
    const { data } = await apiClient.post('/v1/profile/upload-doc', formData)
    form.eligibility[index].document = data.fileUrl
    toast.fire({ icon: 'success', title: 'Certification Uploaded' })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Upload Failed' })
  }
}

const handleTrainingUpload = async (e, index) => {
  const file = e.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  try {
    const { data } = await apiClient.post('/v1/profile/upload-doc', formData)
    form.training[index].document = data.fileUrl
    toast.fire({ icon: 'success', title: 'Training Certificate Uploaded' })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Upload Failed' })
  }
}

const handleExperienceUpload = async (e, index) => {
  const file = e.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  try {
    const { data } = await apiClient.post('/v1/profile/upload-doc', formData)
    form.experience[index].document = data.fileUrl
    toast.fire({ icon: 'success', title: 'Certificate of Employment Uploaded' })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Upload Failed' })
  }
}

const addResponsibility = (expIdx) => {
  if (!form.experience[expIdx].keyResponsibilities) {
    form.experience[expIdx].keyResponsibilities = []
  }
  form.experience[expIdx].keyResponsibilities.push('')
}

const removeResponsibility = (expIdx, resIdx) => {
  form.experience[expIdx].keyResponsibilities.splice(resIdx, 1)
}

// ── COMPLETENESS ─────────────────────────────────────────────────
const completenessStats = computed(() => {
  const sections = {
    personal: !!(form.name.firstName && form.name.lastName && form.birthDate && form.sex),
    education: form.education.length > 0,
    eligibility: form.eligibility.length > 0,
    experience: form.experience.length > 0,
    training: form.training.length > 0,
    family: !!(form.family.father.lastName || form.family.mother.lastName),
    others: (form.competencies.length > 0 || form.specialSkills.length > 0),
  }
  const keys = Object.keys(sections)
  const compCount = keys.filter(k => sections[k]).length
  return { percent: Math.round((compCount / keys.length) * 100), sections }
})

const fullName = computed(() => [form.name.firstName, form.name.lastName].filter(Boolean).join(' ') || authStore.user?.username)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

// ── DYNAMIC ACTIONS ──────────────────────────────────────────────
const addItem = (list) => {
  if (list === 'children') form.family.children.push({ firstName: '', middleName: '', lastName: '', suffix: '', birthDate: '' })
  else if (list === 'education') form.education.push({ level: 'Bachelor', school: '', degree: '', periodFrom: '', periodTo: '', status: 'Graduated', unitsEarned: '', yearGraduated: '', honorsReceived: '' })
  else if (list === 'eligibility') form.eligibility.push({ type: '', name: '', rating: '', dateOfExam: '', placeOfExam: '', licenseNumber: '', licenseValidity: '', document: '' })
  else if (list === 'experience') form.experience.push({ periodFrom: '', periodTo: '', position: '', company: '', monthlySalary: null, salaryGrade: '', statusOfAppointment: 'Permanent', serviceType: 'Private', companyEmail: '', companyPhone: '', keyResponsibilities: [], document: '' })
  else if (list === 'voluntary') form.voluntaryWork.push({ organization: '', periodFrom: '', periodTo: '', hours: null, position: '' })
  else if (list === 'training') form.training.push({ title: '', dateIssued: '', hours: 0, typeOfLD: 'Technical', provider: '' })
  else if (['skills', 'distinctions', 'competencies'].includes(list)) {
    const map = { skills: 'specialSkills', distinctions: 'nonAcademicDistinctions', competencies: 'competencies' }
    form[map[list]].push('')
  }
}

const removeItem = (list, index) => {
  const map = {
    children: form.family.children, education: form.education, eligibility: form.eligibility,
    experience: form.experience, training: form.training, voluntary: form.voluntaryWork,
    skills: form.specialSkills, distinctions: form.nonAcademicDistinctions, competencies: form.competencies,
    phones: form.contact.phones, emails: form.contact.emails
  }
  map[list].splice(index, 1)
}

const addPhone = () => form.contact.phones.push('')
const addEmail = () => form.contact.emails.push('')

// ── DATA SYNC ──────────────────────────────────────────────────
const loadProfile = async () => {
  try {
    const { data } = await apiClient.get('/v1/profile/me')
    if (data.data) {
      const d = data.data
      // Map old address to currentAddress if needed
      if (d.address && !d.currentAddress) {
        d.currentAddress = { ...d.address }
      }
      Object.assign(form, d)
      const fix = (d) => d ? d.substring(0, 10) : ''
      form.birthDate = fix(form.birthDate)
      form.family.children?.forEach(c => c.birthDate = fix(c.birthDate))
      form.eligibility?.forEach(e => { e.dateOfExam = fix(e.dateOfExam); e.licenseValidity = fix(e.licenseValidity) })
      form.experience?.forEach(e => { e.periodFrom = fix(e.periodFrom); e.periodTo = fix(e.periodTo) })
      form.training?.forEach(t => { t.dateIssued = fix(t.dateIssued) })
      form.voluntaryWork?.forEach(v => { v.periodFrom = fix(v.periodFrom); v.periodTo = fix(v.periodTo) })
    }
  } catch (err) { } finally { loading.value = false }
}

const saveProfile = async () => {
  saving.value = true
  try {
    const p = JSON.parse(JSON.stringify(form))
    const clean = (arr, key) => (arr || []).filter(x => typeof x === 'string' ? x.trim() : x[key]?.trim())
    p.education = clean(p.education, 'school')
    p.eligibility = clean(p.eligibility, 'name')
    p.experience = clean(p.experience, 'position')
    p.training = clean(p.training, 'title')
    p.voluntaryWork = clean(p.voluntaryWork, 'organization')
    await apiClient.put('/v1/profile/me', p)
    toast.fire({ icon: 'success', title: 'PDS Profile Saved' })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Update Failed', text: err.response?.data?.message })
  } finally { saving.value = false }
}

onMounted(loadProfile)

// ── UI CONSTANTS ──────────────────────────────────────────────
const F = 'w-full h-11 px-4 text-sm bg-[var(--bg-app)] border border-[var(--border-main)] rounded-[var(--radius-md)] outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] text-[var(--text-main)] transition-all shadow-sm'
const LABEL = 'text-[10px] font-bold text-[var(--text-muted)]'
const SECTION = 'bg-[var(--surface)] border border-[var(--border-main)] rounded-[var(--radius-2xl)] p-6 shadow-sm relative'
const H3 = 'text-sm font-bold text-[var(--text-main)] mb-4'
const ADD_BTN = 'text-[9px] font-black text-[var(--color-primary)] hover:text-white bg-[var(--color-primary-light)]/20 hover:bg-[var(--color-primary)] hover:shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.4)] px-3 py-1.5 rounded-[var(--radius-md)] transition-all flex items-center gap-1.5 uppercase tracking-widest active:scale-95'
const REMOVE_BTN = 'w-10 h-10 flex items-center justify-center text-red-400 hover:text-white bg-transparent hover:bg-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] rounded-[var(--radius-md)] transition-all shrink-0 active:scale-95'
</script>

<template>
  <div class="animate-fade-in-up max-w-5xl mx-auto py-4 px-4 sm:px-6">

    <!-- HEADER -->
    <div :class="[SECTION, 'mb-6 flex flex-col md:flex-row items-center gap-8 overflow-hidden group']">
      <div
        class="absolute -top-24 -right-24 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl transition-all group-hover:bg-[var(--color-primary)]/10">
      </div>
      <div class="relative w-24 h-24 flex-shrink-0">
        <svg class="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8" fill="transparent"
            class="text-[var(--border-main)]" />
          <circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8" fill="transparent"
            :stroke-dasharray="251.2" :stroke-dashoffset="251.2 - (251.2 * completenessStats.percent) / 100"
            class="text-[var(--color-primary)] transition-all duration-1000 ease-out" stroke-linecap="round" />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-xl font-black text-[var(--text-main)]">{{ completenessStats.percent }}%</span>
          <span
            class="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-center leading-none">Data
            Ready</span>
        </div>
      </div>
      <div class="flex-1 text-center md:text-left relative z-10">
        <h2 class="text-lg font-bold text-[var(--text-main)] tracking-tight">Personal Data Sheet (CS Form 212)</h2>
        <p class="text-xs text-[var(--text-muted)] mt-1 font-medium">{{ fullName }}</p>
      </div>
    </div>

    <!-- TABS -->
    <div
      class="flex gap-1 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-1.5 mb-8 overflow-x-auto no-scrollbar shadow-sm">
      <button v-for="tab in tabs" :key="tab.id" @click="setTab(tab.id)"
        :class="['flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all relative',
          activeTab === tab.id ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)]']">
        <i :class="['pi text-[11px]', tab.icon]"></i>{{ tab.label }}
        <div v-if="completenessStats.sections[tab.id]"
          class="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 border border-white"></div>
      </button>
    </div>

    <div v-if="loading" class="p-20 flex justify-center"><i class="pi pi-spin pi-spinner text-3xl opacity-20"></i></div>

    <div v-else class="space-y-8 pb-32">

      <!-- ══ TAB 1: PERSONAL ════════════════════════════════════════ -->
      <section v-if="activeTab === 'personal'" class="space-y-6 animate-fade-in">
        <div :class="SECTION">
          <h3 :class="H3">Basic Information</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div class="flex flex-col gap-1.5"><label :class="LABEL">First Name</label><input
                v-model="form.name.firstName" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Middle Name</label><input
                v-model="form.name.middleName" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Last Name</label><input
                v-model="form.name.lastName" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Suffix</label><input v-model="form.name.suffix"
                :class="F" /></div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Date of Birth</label><input
                v-model="form.birthDate" type="date" :class="F" /></div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Sex</label>
              <select v-model="form.sex" :class="F">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="LGBTQ+">LGBTQ.</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Civil Status</label><select
                v-model="form.civilStatus" :class="F">
                <option value="">Select...</option>
                <option>Single</option>
                <option>Married</option>
                <option>Widowed</option>
                <option>Separated</option>
              </select></div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Religion</label>
              <select v-model="form.religion" :class="F">
                <option value="">Select Religion...</option>
                <option v-for="r in religions" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
          </div>

          <div :class="SECTION" class="bg-[var(--bg-app)]/30 border-dashed">
            <h3 :class="H3" class="text-[10px] opacity-50 mb-4">Special Personal Status</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
              <div class="flex flex-col gap-2">
                <label :class="LABEL">Member of Indigenous Group?</label>
                <div class="flex items-center h-11">
                  <AppCheckbox v-model="form.isIndigenous" label="Yes" />
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <label :class="LABEL">Solo Parent?</label>
                <div class="flex items-center h-11">
                  <AppCheckbox v-model="form.isSoloParent" label="Yes" />
                </div>
              </div>
              <div class="flex flex-col gap-2 relative">
                <label :class="LABEL">Disability:</label>
                <div class="relative">
                  <button @click="showDisabilityDropdown = !showDisabilityDropdown" type="button"
                    :class="[F, 'flex items-center justify-between text-left h-11']">
                    <span v-if="selectedDisabilities.length" class="truncate text-xs font-bold">{{
                      selectedDisabilities.join(', ') }}</span>
                    <span v-else class="text-[var(--text-muted)] text-xs">Select options...</span>
                    <i class="pi pi-chevron-down text-[10px] transition-transform"
                      :class="{ 'rotate-180': showDisabilityDropdown }"></i>
                  </button>

                  <transition name="fade">
                    <div v-if="showDisabilityDropdown"
                      class="absolute left-0 right-0 top-full mt-2 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-3 shadow-xl z-[60] grid grid-cols-1 gap-1 min-w-[200px]">
                      <div v-for="opt in disabilityOptions" :key="opt" @click="toggleDisability(opt)"
                        class="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all hover:bg-[var(--bg-app)] group">
                        <div class="w-4 h-4 rounded border flex items-center justify-center transition-all"
                          :class="selectedDisabilities.includes(opt) ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--border-main)]'">
                          <i v-if="selectedDisabilities.includes(opt)" class="pi pi-check text-[8px] text-white"></i>
                        </div>
                        <span
                          class="text-xs font-medium text-[var(--text-main)] group-hover:text-[var(--color-primary)]">{{
                          opt }}</span>
                      </div>
                      <div class="pt-2 border-t border-[var(--border-main)] mt-1">
                        <button @click="showDisabilityDropdown = false"
                          class="w-full py-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/20 rounded-lg">Apply
                          & Close</button>
                      </div>
                    </div>
                  </transition>
                </div>
                <div v-if="showDisabilityDropdown" @click="showDisabilityDropdown = false" class="fixed inset-0 z-[55]">
                </div>
              </div>
            </div>
          </div>
        </div>

        <div :class="SECTION">
          <h3 :class="H3">Contacts & Identification</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
            <div class="space-y-3">
              <div class="flex items-center justify-between"><label :class="LABEL">Mobile Numbers</label><button
                  @click="addPhone" :class="ADD_BTN"><i class="pi pi-plus text-[8px]"></i> Add Phone</button></div>
              <transition-group name="list" tag="div" class="space-y-2">
                <div v-for="(p, i) in form.contact.phones" :key="i" class="flex gap-2 items-center">
                  <input v-model="form.contact.phones[i]" :class="F" placeholder="09xxxxxxxxx" />
                  <button @click="removeItem('phones', i)" :disabled="form.contact.phones.length === 1"
                    :class="REMOVE_BTN"><i class="pi pi-trash text-xs"></i></button>
                </div>
              </transition-group>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between"><label :class="LABEL">Email Addresses</label><button
                  @click="addEmail" :class="ADD_BTN"><i class="pi pi-plus text-[8px]"></i> Add Email</button></div>
              <transition-group name="list" tag="div" class="space-y-2">
                <div v-for="(e, i) in form.contact.emails" :key="i" class="flex gap-2 items-center">
                  <input v-model="form.contact.emails[i]" :class="F" placeholder="user@example.com" />
                  <button @click="removeItem('emails', i)" :disabled="form.contact.emails.length === 1"
                    :class="REMOVE_BTN"><i class="pi pi-trash text-xs"></i></button>
                </div>
              </transition-group>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div class="flex flex-col gap-1.5"><label :class="LABEL">GSIS ID NO. (if applicable)</label><input
                v-model="form.gsisNo" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">PAG-IBIG ID NO. (if applicable)</label><input
                v-model="form.pagibigNo" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">PHILHEALTH NO. (if applicable)</label><input
                v-model="form.philhealthNo" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">TIN NO. (if applicable)</label><input
                v-model="form.tinNo" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">PhilSys NO. (National ID)</label><input
                v-model="form.philSysNo" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">AGENCY EMPLOYEE NO. (if applicable)</label><input
                v-model="form.agencyEmployeeNo" :class="F" /></div>
          </div>
        </div>

        <div :class="SECTION">
          <h3 :class="H3">Current Address</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2 flex flex-col gap-1.5">
              <label :class="LABEL">Sitio / House No. / Street</label>
              <input v-model="form.currentAddress.sitio" :class="F" placeholder="Block 4, Lot 7, Magsaysay St." />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Barangay</label>
              <input v-model="form.currentAddress.barangay" :class="F" placeholder="Barangay" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Municipality / City</label>
              <input v-model="form.currentAddress.municipality" :class="F" placeholder="Municipality" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Province</label>
              <input v-model="form.currentAddress.province" :class="F" placeholder="Province" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">ZIP Code</label>
              <input v-model="form.currentAddress.zipCode" :class="F" placeholder="6214" />
            </div>
          </div>
        </div>

        <div :class="SECTION">
          <h3 :class="H3">Comelec Registered Address</h3>
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="col-span-2 flex flex-col gap-1.5">
              <label :class="LABEL">Sitio / House No. / Street</label>
              <input v-model="form.comelecAddress.sitio" :class="F" placeholder="Block 4, Lot 7, Magsaysay St." />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Barangay</label>
              <input v-model="form.comelecAddress.barangay" :class="F" placeholder="Barangay" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Municipality / City</label>
              <input v-model="form.comelecAddress.municipality" :class="F" placeholder="Municipality" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Province</label>
              <input v-model="form.comelecAddress.province" :class="F" placeholder="Province" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">ZIP Code</label>
              <input v-model="form.comelecAddress.zipCode" :class="F" placeholder="6214" />
            </div>
          </div>

          <div
            class="p-6 bg-[var(--bg-app)]/50 rounded-2xl border-2 border-dashed border-[var(--border-main)] flex flex-col items-center gap-4 transition-all hover:border-[var(--color-primary)]/50">
            <div
              class="w-12 h-12 rounded-full bg-[var(--color-primary-light)]/20 flex items-center justify-center text-[var(--color-primary)]">
              <i class="pi pi-cloud-upload text-xl"></i>
            </div>
            <div class="text-center">
              <h4 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)] mb-1">Comelec
                Certification</h4>
              <p class="text-[10px] text-[var(--text-muted)] font-medium">Upload a digital copy of your Comelec ID or
                Certificate (PDF/JPG/PNG)</p>
            </div>

            <label class="relative group cursor-pointer">
              <div
                class="h-10 px-6 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] flex items-center gap-2 text-xs font-bold text-[var(--text-sub)] transition-all group-hover:bg-[var(--bg-app)]">
                <i class="pi pi-file-plus text-[10px]"></i>
                {{ form.comelecAddress.document ? 'Change Certification' : 'Upload Certification' }}
              </div>
              <input type="file" class="hidden" accept=".pdf,image/*" @change="handleComelecUpload" />
            </label>

            <div v-if="form.comelecAddress.document"
              class="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
              <i class="pi pi-check-circle text-[10px]"></i>
              <span class="text-[10px] font-black uppercase tracking-tight">Certification Attached</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ══ TAB 2: FAMILY ══════════════════════════════════════════ -->
      <section v-if="activeTab === 'family'" class="space-y-6 animate-fade-in">
        <div v-for="rel in familyRelations" :key="rel.id" :class="SECTION">
          <h3 :class="H3">{{ rel.label }}</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input v-model="form.family[rel.id].firstName" :class="F" placeholder="First Name" />
            <input v-model="form.family[rel.id].middleName" :class="F" placeholder="Middle Name" />
            <input v-model="form.family[rel.id].lastName" :class="F" placeholder="Last Name" />
            <input v-model="form.family[rel.id].suffix" :class="F" placeholder="Suffix" />
          </div>
        </div>
        <div :class="SECTION">
          <div class="flex justify-between items-center mb-6">
            <h3 :class="H3" class="mb-0">Children</h3><button @click="addItem('children')" :class="ADD_BTN"><i
                class="pi pi-plus text-[8px]"></i> Add Child</button>
          </div>
          <transition-group name="list" tag="div" class="space-y-3">
            <div v-for="(c, i) in form.family.children" :key="i"
              class="p-5 bg-[var(--bg-app)]/50 rounded-xl border border-[var(--border-main)] flex flex-col sm:flex-row gap-4 items-end transition-all hover:border-[var(--color-primary)] shadow-sm">
              <div class="flex-1 grid grid-cols-2 gap-3 w-full">
                <input v-model="c.firstName" :class="F" placeholder="Child's Name" />
                <input v-model="c.birthDate" type="date" :class="F" />
              </div>
              <button @click="removeItem('children', i)" :class="REMOVE_BTN"><i
                  class="pi pi-trash text-sm"></i></button>
            </div>
          </transition-group>
        </div>
      </section>

      <!-- ══ TAB 3: EDUCATION ═══════════════════════════════════════ -->
      <section v-if="activeTab === 'education'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center">
          <h3 :class="H3" class="mb-0 text-base">Educational Background</h3>
          <AppButton size="sm" icon="pi-plus" @click="addItem('education')">Add Record</AppButton>
        </div>
        <transition-group name="list" tag="div" class="space-y-4">
          <div v-for="(e, i) in form.education" :key="i" :class="SECTION"
            class="group/item overflow-hidden transition-all hover:border-[var(--color-primary)]">
            <div class="flex justify-between items-start mb-5">
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shadow-sm">
                  <i class="pi pi-graduation-cap text-lg"></i></div>
                <div><span class="text-xs font-black uppercase text-[var(--text-main)] tracking-widest">{{ e.level
                    }}</span>
                  <p class="text-[9px] text-[var(--text-muted)] font-bold uppercase">{{ e.status || 'Academic Status' }}
                  </p>
                </div>
              </div>
              <button @click="removeItem('education', i)" :class="REMOVE_BTN"><i
                  class="pi pi-trash text-sm"></i></button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Level</label><select v-model="e.level"
                  :class="F">
                  <option>Vocational</option>
                  <option>Bachelor</option>
                  <option>Masteral</option>
                  <option>Doctorate</option>
                </select></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">School Name</label><input v-model="e.school"
                  :class="F" placeholder="University or School" /></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">{{ ['Vocational', 'Associate'].includes(e.level) ?
                'Certificate / Course' : 'Degree / Course Title' }}</label><input v-model="e.degree" :class="F"
                  placeholder="e.g. BS Information Technology" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Period From (Year)</label><input
                  v-model="e.periodFrom" :class="F" placeholder="YYYY" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Period To (Year)</label><input
                  v-model="e.periodTo" :class="F" placeholder="YYYY" /></div>
            </div>
            <div v-if="!['Elementary', 'Secondary'].includes(e.level)"
              class="p-5 bg-[var(--bg-app)]/50 rounded-xl border border-[var(--border-main)] grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Academic Status</label><select v-model="e.status"
                  :class="F">
                  <option>Graduated</option>
                  <option v-if="['Masteral', 'Doctorate'].includes(e.level)">CAR (Completed Academic Requirements)
                  </option>
                  <option>Ongoing / Units Earned</option>
                  <option>Associate / Diploma</option>
                </select></div>
              <div v-if="e.status === 'Graduated'" class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5"><label :class="LABEL">Year Graduated</label><input
                    v-model="e.yearGraduated" :class="F" placeholder="YYYY" /></div>
                <div class="flex flex-col gap-1.5"><label :class="LABEL">Honors Received</label><input
                    v-model="e.honorsReceived" :class="F" placeholder="Cum Laude, CPA, etc." /></div>
              </div>
              <div v-else class="flex flex-col gap-1.5"><label :class="LABEL">Highest Units Earned</label><input
                  v-model="e.unitsEarned" :class="F" placeholder="e.g. 36 Units" /></div>
            </div>
          </div>
        </transition-group>
      </section>

      <!-- ══ TAB 4: ELIGIBILITY ══════════════════════════════════════ -->
      <section v-if="activeTab === 'eligibility'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center">
          <h3 :class="H3" class="mb-0 text-base">Civil Service Eligibility</h3>
          <AppButton size="sm" icon="pi-plus" @click="addItem('eligibility')">Add Record</AppButton>
        </div>
        <transition-group name="list" tag="div" class="space-y-4">
          <div v-for="(e, i) in form.eligibility" :key="i" :class="SECTION"
            class="transition-all hover:border-[var(--color-primary)]">
            <div class="flex justify-between items-start mb-5">
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shadow-sm">
                  <i class="pi pi-verified text-lg"></i></div><span
                  class="text-xs font-black uppercase text-[var(--text-main)] tracking-widest">{{ e.name || 'NEW RECORD'
                  }}</span>
              </div>
              <button @click="removeItem('eligibility', i)" :class="REMOVE_BTN"><i
                  class="pi pi-trash text-sm"></i></button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div class="flex flex-col gap-1.5">
                <label :class="LABEL">Category</label>
                <select v-model="e.type" :class="F">
                  <option value="" disabled>Select category...</option>
                  <optgroup v-for="group in ELIGIBILITY_GROUPS" :key="group.label" :label="group.label">
                    <option v-for="opt in group.options" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </optgroup>
                </select>
              </div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">License / Exam Title</label><input
                  v-model="e.name" :class="F" /></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Rating / Score</label><input v-model="e.rating"
                  :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Date of Exam</label><input v-model="e.dateOfExam"
                  type="date" :class="F" /></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">License Number</label><input
                  v-model="e.licenseNumber" :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">License Validity</label><input
                  v-model="e.licenseValidity" type="date" :class="F" /></div>
            </div>

            <!-- UPLOAD FOR ELIGIBILITY -->
            <div
              class="mt-6 p-4 bg-[var(--bg-app)]/50 rounded-xl border-2 border-dashed border-[var(--border-main)] flex items-center justify-between gap-4 group/upload">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-[var(--color-primary-light)]/20 flex items-center justify-center text-[var(--color-primary)]">
                  <i class="pi pi-verified text-sm"></i>
                </div>
                <div>
                  <h4 class="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">Certification /
                    Rating / ID</h4>
                  <p class="text-[9px] text-[var(--text-muted)] font-medium">Upload a digital copy (PDF/JPG/PNG)</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div v-if="e.document"
                  class="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                  <i class="pi pi-check-circle text-[9px]"></i>
                  <span class="text-[9px] font-black uppercase tracking-tight">Attached</span>
                </div>
                <label class="relative cursor-pointer">
                  <div
                    class="h-9 px-4 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] flex items-center gap-2 text-[10px] font-bold text-[var(--text-sub)] transition-all hover:bg-[var(--bg-app)]">
                    <i class="pi pi-cloud-upload text-[10px]"></i>
                    {{ e.document ? 'Change' : 'Upload' }}
                  </div>
                  <input type="file" class="hidden" accept=".pdf,image/*"
                    @change="handleEligibilityUpload($event, i)" />
                </label>
              </div>
            </div>
          </div>
        </transition-group>
      </section>

      <!-- ══ TAB 5: EXPERIENCE ════════════════════════════════════════ -->
      <section v-if="activeTab === 'experience'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center">
          <h3 :class="H3" class="mb-0 text-base">Work Experience</h3>
          <AppButton size="sm" icon="pi-plus" @click="addItem('experience')">Add Record</AppButton>
        </div>
        <transition-group name="list" tag="div" class="space-y-4">
          <div v-for="(e, i) in form.experience" :key="i" :class="SECTION"
            class="transition-all hover:border-[var(--color-primary)]">
            <div class="flex justify-between items-start mb-5">
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shadow-sm">
                  <i class="pi pi-briefcase text-lg"></i></div><span
                  class="text-xs font-black uppercase text-[var(--text-main)] tracking-widest">{{ e.position ||
                  'POSITION' }}</span>
              </div>
              <button @click="removeItem('experience', i)" :class="REMOVE_BTN"><i
                  class="pi pi-trash text-sm"></i></button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"><input v-model="e.position" :class="F"
                placeholder="Position Title" /><input v-model="e.company" :class="F" placeholder="Company / Agency" />
            </div>

            <!-- DYNAMIC RESPONSIBILITIES -->
            <div class="mb-6 p-4 bg-white/40 rounded-xl border border-[var(--border-main)]">
              <div class="flex justify-between items-center mb-3">
                <label :class="LABEL" class="text-[var(--color-primary)] opacity-80">Key Responsibilities / Job
                  Description</label>
                <button @click="addResponsibility(i)" type="button"
                  class="text-[8px] font-black uppercase text-[var(--color-primary)] hover:underline flex items-center gap-1">
                  <i class="pi pi-plus text-[7px]"></i> Add Responsibility
                </button>
              </div>
              <div class="space-y-2">
                <div v-for="(resp, rIdx) in e.keyResponsibilities" :key="rIdx" class="flex gap-2 group/resp">
                  <input v-model="e.keyResponsibilities[rIdx]" :class="F" class="h-9 text-xs"
                    placeholder="e.g. Conducted daily classroom instruction..." />
                  <button @click="removeResponsibility(i, rIdx)" type="button"
                    class="w-9 h-9 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover/resp:opacity-100">
                    <i class="pi pi-times text-[10px]"></i>
                  </button>
                </div>
                <div v-if="!e.keyResponsibilities?.length"
                  class="text-center py-2 italic text-[9px] text-[var(--text-muted)]">No responsibilities added yet
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5"><label :class="LABEL">From</label><input v-model="e.periodFrom"
                    type="date" :class="F" /></div>
                <div class="flex flex-col gap-1.5"><label :class="LABEL">To</label><input v-model="e.periodTo"
                    type="date" :class="F" /></div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label :class="LABEL">Service Type</label>
                <select v-model="e.serviceType" :class="F">
                  <option>Government</option>
                  <option>Private</option>
                  <option>Self-Employed</option>
                </select>
              </div>
            </div>

            <!-- COMPANY CONTACT INFO -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div class="flex flex-col gap-1.5">
                <label :class="LABEL">Email of Company / Agency</label>
                <input v-model="e.companyEmail" type="email" :class="F" placeholder="hr@company.com" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label :class="LABEL">Contact No. of Company / Agency</label>
                <input v-model="e.companyPhone" :class="F" placeholder="(02) 8XXX-XXXX / 09XXXXXXXXX" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Monthly Salary</label><input
                  v-model.number="e.monthlySalary" type="number" :class="F" placeholder="0.00" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Salary Grade & Step</label><input
                  v-model="e.salaryGrade" :class="F" placeholder="e.g. 11-1" /></div>
              <div class="flex flex-col gap-1.5">
                <label :class="LABEL">Status of Appointment</label>
                <select v-model="e.statusOfAppointment" :class="F">
                  <option value="">Select status...</option>
                  <option>Permanent</option>
                  <option>Temporary</option>
                  <option>Coterminous</option>
                  <option>Contractual</option>
                  <option>Casual</option>
                  <option>Job Order</option>
                </select>
              </div>
            </div>

            <!-- UPLOAD FOR EXPERIENCE -->
            <div
              class="mt-6 p-4 bg-[var(--bg-app)]/50 rounded-xl border-2 border-dashed border-[var(--border-main)] flex items-center justify-between gap-4 group/upload">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-[var(--color-primary-light)]/20 flex items-center justify-center text-[var(--color-primary)]">
                  <i class="pi pi-briefcase text-sm"></i>
                </div>
                <div>
                  <h4 class="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">Certificate of
                    Employment</h4>
                  <p class="text-[9px] text-[var(--text-muted)] font-medium">Upload a digital copy (PDF/JPG/PNG)</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div v-if="e.document"
                  class="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                  <i class="pi pi-check-circle text-[9px]"></i>
                  <span class="text-[9px] font-black uppercase tracking-tight">Attached</span>
                </div>
                <label class="relative cursor-pointer">
                  <div
                    class="h-9 px-4 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] flex items-center gap-2 text-[10px] font-bold text-[var(--text-sub)] transition-all hover:bg-[var(--bg-app)]">
                    <i class="pi pi-cloud-upload text-[10px]"></i>
                    {{ e.document ? 'Change' : 'Upload' }}
                  </div>
                  <input type="file" class="hidden" accept=".pdf,image/*" @change="handleExperienceUpload($event, i)" />
                </label>
              </div>
            </div>
          </div>
        </transition-group>
      </section>

      <!-- ══ TAB 6: TRAINING ═════════════════════════════════════════ -->
      <section v-if="activeTab === 'training'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center">
          <h3 :class="H3" class="mb-0 text-base">Learning & Development</h3>
          <AppButton size="sm" icon="pi-plus" @click="addItem('training')">Add Training Record</AppButton>
        </div>
        <transition-group name="list" tag="div" class="space-y-4">
          <div v-for="(t, i) in form.training" :key="i" :class="SECTION"
            class="transition-all hover:border-[var(--color-primary)]">
            <div class="flex justify-between items-start mb-5">
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shadow-sm">
                  <i class="pi pi-book text-lg"></i></div><span
                  class="text-xs font-black uppercase text-[var(--text-main)] tracking-widest">{{ t.title || 'NEW TRAINING' }}</span>
              </div>
              <button @click="removeItem('training', i)" :class="REMOVE_BTN"><i
                  class="pi pi-trash text-sm"></i></button>
            </div>
            <div class="flex flex-col gap-1.5 mb-4"><label :class="LABEL">Title of Training</label><input
                v-model="t.title" :class="F" /></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Type of L&D</label>
                <select v-model="t.typeOfLD" :class="F">
                  <option value="">Select type...</option>
                  <option>Technical</option>
                  <option>Managerial</option>
                  <option>Supervisory</option>
                  <option>Academic</option>
                  <option>Foundation</option>
                  <option>Other</option>
                </select>
              </div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Provider / Sponsor</label><input
                  v-model="t.provider" :class="F" /></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">No. of Hours</label><input
                  v-model.number="t.hours" type="number" :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Date Issued</label><input v-model="t.dateIssued"
                  type="date" :class="F" /></div>
            </div>

            <!-- UPLOAD FOR TRAINING -->
            <div
              class="mt-6 p-4 bg-[var(--bg-app)]/50 rounded-xl border-2 border-dashed border-[var(--border-main)] flex items-center justify-between gap-4 group/upload">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-[var(--color-primary-light)]/20 flex items-center justify-center text-[var(--color-primary)]">
                  <i class="pi pi-book text-sm"></i>
                </div>
                <div>
                  <h4 class="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">Training
                    Certificate</h4>
                  <p class="text-[9px] text-[var(--text-muted)] font-medium">Upload a digital copy (PDF/JPG/PNG)</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div v-if="t.document"
                  class="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                  <i class="pi pi-check-circle text-[9px]"></i>
                  <span class="text-[9px] font-black uppercase tracking-tight">Attached</span>
                </div>
                <label class="relative cursor-pointer">
                  <div
                    class="h-9 px-4 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] flex items-center gap-2 text-[10px] font-bold text-[var(--text-sub)] transition-all hover:bg-[var(--bg-app)]">
                    <i class="pi pi-cloud-upload text-[10px]"></i>
                    {{ t.document ? 'Change' : 'Upload' }}
                  </div>
                  <input type="file" class="hidden" accept=".pdf,image/*" @change="handleTrainingUpload($event, i)" />
                </label>
              </div>
            </div>
          </div>
        </transition-group>
      </section>

      <!-- ══ TAB 7: VOLUNTARY WORK ═══════════════════════════════════ -->
      <section v-if="activeTab === 'voluntary'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center">
          <h3 :class="H3" class="mb-0 text-base">Voluntary Work</h3>
          <AppButton size="sm" icon="pi-plus" @click="addItem('voluntary')">Add Voluntary Record</AppButton>
        </div>
        <transition-group name="list" tag="div" class="space-y-4">
          <div v-for="(v, i) in form.voluntaryWork" :key="i" :class="SECTION"
            class="transition-all hover:border-[var(--color-primary)]">
            <div class="flex justify-between items-start mb-5">
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shadow-sm">
                  <i class="pi pi-heart text-lg"></i></div><span
                  class="text-xs font-black uppercase text-[var(--text-main)] tracking-widest">{{ v.organization || 'NEW ORGANIZATION' }}</span>
              </div>
              <button @click="removeItem('voluntary', i)" :class="REMOVE_BTN"><i
                  class="pi pi-trash text-sm"></i></button>
            </div>
            <input v-model="v.organization" :class="F" placeholder="Organization Name" class="mb-4" />
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Date From</label><input v-model="v.periodFrom"
                  type="date" :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Position</label><input v-model="v.position"
                  :class="F" /></div>
            </div>
          </div>
        </transition-group>
      </section>

      <!-- ══ TAB 8: OTHER INFO ══════════════════════════════════════ -->
      <section v-if="activeTab === 'others'" class="space-y-8 animate-fade-in">

        <!-- REFERENCES -->
        <div :class="SECTION">
          <div class="flex justify-between items-center mb-6">
            <h3 :class="H3" class="mb-0 flex items-center gap-2">
              <i class="pi pi-users text-[var(--color-primary)]"></i>
              Character References
            </h3>
            <button @click="form.references.push({ name: '', address: '', phone: '' })" :class="ADD_BTN">
              <i class="pi pi-plus text-[8px]"></i> Add Reference
            </button>
          </div>

          <div class="mb-6 p-4 bg-[var(--color-primary-light)]/10 border border-[var(--color-primary)]/20 rounded-xl space-y-2.5">
            <div class="flex gap-3 items-start">
              <i class="pi pi-circle-fill text-[5px] mt-1.5 text-[var(--color-primary)]"></i>
              <p class="text-[10px] text-[var(--text-main)] font-bold italic leading-relaxed">
                References must NOT be related by consanguinity or affinity to the applicant.
              </p>
            </div>
            <div class="flex gap-3 items-start">
              <i class="pi pi-circle-fill text-[5px] mt-1.5 text-[var(--color-primary)]"></i>
              <p class="text-[10px] text-[var(--text-main)] font-bold italic leading-relaxed">
                Ensure references are persons who know you well and can vouch for your character and work ethics.
              </p>
            </div>
            <div class="flex gap-3 items-start">
              <i class="pi pi-circle-fill text-[5px] mt-1.5 text-[var(--color-primary)]"></i>
              <p class="text-[10px] text-[var(--text-main)] font-bold italic leading-relaxed">
                References should be informed and available for contact or verification by the HRMPSB during the assessment period.
              </p>
            </div>
          </div>

          <transition-group name="list" tag="div" class="space-y-4">
            <div v-for="(ref, i) in form.references" :key="i"
              class="p-6 bg-[var(--bg-app)]/50 rounded-2xl border border-[var(--border-main)] relative group/ref">
              <button @click="form.references.splice(i, 1)"
                class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover/ref:opacity-100 shadow-lg">
                <i class="pi pi-trash text-xs"></i>
              </button>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label :class="LABEL">Full Name</label>
                  <input v-model="ref.name" :class="F" placeholder="Reference Person Name" />
                </div>
                <div class="flex flex-col gap-1.5 sm:col-span-1">
                  <label :class="LABEL">Office / Residential Address</label>
                  <input v-model="ref.address" :class="F" placeholder="Complete Address" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label :class="LABEL">Contact Number / Email</label>
                  <input v-model="ref.phone" :class="F" placeholder="Phone or Email" />
                </div>
              </div>
            </div>
          </transition-group>

          <div v-if="!form.references.length"
            class="p-12 border-2 border-dashed border-[var(--border-main)] rounded-2xl flex flex-col items-center justify-center gap-3 opacity-40">
            <i class="pi pi-users text-3xl"></i>
            <p class="text-xs font-bold uppercase tracking-widest">No references added</p>
          </div>
        </div>

        <!-- PDS QUESTIONS -->
        <div :class="SECTION">
          <h3 :class="H3" class="mb-6 flex items-center gap-2">
            <i class="pi pi-question-circle text-[var(--color-primary)]"></i>
            Legal & Administrative Queries
          </h3>

          <div class="space-y-8">
            <!-- Q34 -->
            <div class="space-y-4">
              <p class="text-xs font-bold text-[var(--text-main)] leading-relaxed">34. Are you related within the third
                degree of consanguinity or affinity to the appointing or recommending authority, or to the chief of
                bureau or office or to the person who has immediate supervision over you in the Office, Bureau or
                Department where you will be appointed,</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pl-4 border-l-2 border-[var(--color-primary)]/20">
                <div class="flex flex-col gap-2">
                  <label class="text-[10px] text-[var(--text-muted)] font-medium">a. within the Government
                    service?</label>
                  <AppRadio v-model="form.pdsQuestions.q34a" :options="yesNoOptions" name="q34a" direction="horizontal" size="sm" />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[10px] text-[var(--text-muted)] font-medium">b. within the specific Bureau or
                    Office?</label>
                  <AppRadio v-model="form.pdsQuestions.q34b" :options="yesNoOptions" name="q34b" direction="horizontal" size="sm" />
                </div>
              </div>
            </div>

            <!-- Q35 -->
            <div class="space-y-4">
              <p class="text-xs font-bold text-[var(--text-main)] leading-relaxed">35. a. Have you ever been found
                guilty of any administrative offense?</p>
              <div class="pl-4 border-l-2 border-[var(--color-primary)]/20">
                <AppRadio v-model="form.pdsQuestions.q35a" :options="yesNoOptions" name="q35a" direction="horizontal" size="sm" />
              </div>
              <p class="text-xs font-bold text-[var(--text-main)] leading-relaxed">b. Have you been criminally charge
                before any court?</p>
              <div class="pl-4 border-l-2 border-[var(--color-primary)]/20">
                <AppRadio v-model="form.pdsQuestions.q35b" :options="yesNoOptions" name="q35b" direction="horizontal" size="sm" />
              </div>
            </div>

            <!-- Q36 -->
            <div class="space-y-4">
              <p class="text-xs font-bold text-[var(--text-main)] leading-relaxed">36. Have you ever been convicted of
                any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?</p>
              <div class="pl-4 border-l-2 border-[var(--color-primary)]/20">
                <AppRadio v-model="form.pdsQuestions.q36" :options="yesNoOptions" name="q36" direction="horizontal" size="sm" />
              </div>
            </div>

            <!-- Q37 -->
            <div class="space-y-4">
              <p class="text-xs font-bold text-[var(--text-main)] leading-relaxed">37. Have you ever been separated from
                the service in any of the following modes: resignation, retirement, dropped from the rolls, dismissal,
                termination, end of term, finished contract or phased out (abolition) in the public or private sector?
              </p>
              <div class="pl-4 border-l-2 border-[var(--color-primary)]/20">
                <AppRadio v-model="form.pdsQuestions.q37" :options="yesNoOptions" name="q37" direction="horizontal" size="sm" />
              </div>
            </div>

            <!-- Q40 -->
            <div class="space-y-4">
              <p class="text-xs font-bold text-[var(--text-main)] leading-relaxed">40. a. Are you a member of any
                indigenous group?</p>
              <div class="pl-4 border-l-2 border-[var(--color-primary)]/20">
                <AppRadio v-model="form.pdsQuestions.q40a" :options="yesNoOptions" name="q40a" direction="horizontal" size="sm" />
              </div>
              <p class="text-xs font-bold text-[var(--text-main)] leading-relaxed">b. Are you a person with disability?
              </p>
              <div class="pl-4 border-l-2 border-[var(--color-primary)]/20">
                <AppRadio v-model="form.pdsQuestions.q40b" :options="yesNoOptions" name="q40b" direction="horizontal" size="sm" />
              </div>
              <p class="text-xs font-bold text-[var(--text-main)] leading-relaxed">c. Are you a solo parent?</p>
              <div class="pl-4 border-l-2 border-[var(--color-primary)]/20">
                <AppRadio v-model="form.pdsQuestions.q40c" :options="yesNoOptions" name="q40c" direction="horizontal" size="sm" />
              </div>
            </div>

            <div class="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <label :class="LABEL" class="text-amber-600 mb-2">If you answered YES to any of the above, please provide
                details:</label>
              <textarea v-model="form.pdsQuestions.q34_details"
                class="w-full h-24 p-3 text-xs bg-white/50 border border-[var(--border-main)] rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20"
                placeholder="Specify details, dates, cases, etc."></textarea>
            </div>
          </div>
        </div>

        <!-- List Sections (Skills, Distinctions, Memberships) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div v-for="l in othersLists" :key="l.id" :class="SECTION">
            <div class="flex justify-between items-center mb-6">
              <h3 :class="H3" class="mb-0 text-[11px] uppercase tracking-widest">{{ l.label }}</h3>
              <button @click="addItem(l.id)" :class="ADD_BTN"><i class="pi pi-plus text-[8px]"></i> Add Entry</button>
            </div>
            <transition-group name="list" tag="div" class="space-y-2">
              <div v-for="(item, i) in form[l.field]" :key="i" class="flex gap-2 items-center">
                <input v-model="form[l.field][i]" :class="F" class="h-10 text-xs" placeholder="Enter detail..." />
                <button @click="removeItem(l.id, i)" :class="REMOVE_BTN"><i class="pi pi-trash text-sm"></i></button>
              </div>
            </transition-group>
            <div v-if="!form[l.field]?.length"
              class="text-center py-6 italic text-[10px] text-[var(--text-muted)] opacity-50 border border-dashed border-[var(--border-main)] rounded-xl">
              No entries added for this category
            </div>
          </div>
        </div>

      </section>

    </div>

    <!-- STICKY SAVE -->
    <div class="fixed bottom-8 right-8 z-40">
      <AppButton size="xl" icon="pi-save" @click="saveProfile" :loading="saving" class="shadow-2xl font-bold px-10">Save
        PDS Profile</AppButton>
    </div>

  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
