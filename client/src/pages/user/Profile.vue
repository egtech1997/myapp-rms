<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'
import { ELIGIBILITY_GROUPS } from '@/utils/eligibilityOptions'
import { AppButton } from '@/components/ui'

const authStore = useAuthStore()
const toast = inject('$toast')

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

const form = reactive({
  name: { firstName: '', middleName: '', lastName: '', suffix: '' },
  sex: '', birthDate: '', birthPlace: '', height: '', weight: '', bloodType: '',
  gsisNo: '', pagibigNo: '', philhealthNo: '', sssNo: '', tinNo: '', agencyEmployeeNo: '',
  ethnicGroup: '', religion: '', disability: '', civilStatus: '',
  contact: { phones: [''], emails: [''] },
  address: { sitio: '', barangay: '', municipality: '', city: '', province: '', zipCode: '', country: 'Philippines' },
  family: {
    spouse: { firstName: '', middleName: '', lastName: '', suffix: '', occupation: '', employer: '', businessAddress: '', phone: '' },
    father: { firstName: '', middleName: '', lastName: '', suffix: '' },
    mother: { firstName: '', middleName: '', lastName: '', suffix: '' },
    children: [],
  },
  education: [], eligibility: [], experience: [], voluntaryWork: [], training: [],
  competencies: [], specialSkills: [], nonAcademicDistinctions: [], memberships: [],
  performanceRating: { score: null, adjective: '', periodCovered: '' },
  visibility: { phone: false, email: false, address: false },
})

const familyRelations = [
  { id: 'spouse', label: 'Spouse Details' },
  { id: 'father', label: "Father's Name" },
  { id: 'mother', label: "Mother's Details (Maiden Name)" }
]

const othersLists = [
  { id: 'skills', field: 'specialSkills', label: 'Skills & Hobbies' },
  { id: 'distinctions', field: 'nonAcademicDistinctions', label: 'Distinctions' },
  { id: 'competencies', field: 'competencies', label: 'Core Competencies' }
]

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
  else if (list === 'eligibility') form.eligibility.push({ type: '', name: '', rating: '', dateOfExam: '', placeOfExam: '', licenseNumber: '', licenseValidity: '' })
  else if (list === 'experience') form.experience.push({ periodFrom: '', periodTo: '', position: '', company: '', monthlySalary: null, salaryGrade: '', statusOfAppointment: 'Permanent', isGovernment: false })
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
      Object.assign(form, d)
      const fix = (d) => d ? d.substring(0, 10) : ''
      form.birthDate = fix(form.birthDate)
      form.family.children?.forEach(c => c.birthDate = fix(c.birthDate))
      form.eligibility?.forEach(e => { e.dateOfExam = fix(e.dateOfExam); e.licenseValidity = fix(e.licenseValidity) })
      form.experience?.forEach(e => { e.periodFrom = fix(e.periodFrom); e.periodTo = fix(e.periodTo) })
      form.training?.forEach(t => { t.dateIssued = fix(t.dateIssued) })
      form.voluntaryWork?.forEach(v => { v.periodFrom = fix(v.periodFrom); v.periodTo = fix(v.periodTo) })
    }
  } catch (err) {} finally { loading.value = false }
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
const F = 'w-full h-11 px-4 text-sm bg-[var(--bg-app)] border border-[var(--border-main)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] text-[var(--text-main)] transition-all shadow-sm'
const LABEL = 'text-[10px] font-bold text-[var(--text-muted)]'
const SECTION = 'bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-6 shadow-sm relative'
const H3 = 'text-sm font-bold text-[var(--text-main)] mb-4'
const ADD_BTN = 'text-[9px] font-black text-[var(--color-primary)] hover:text-white bg-[var(--color-primary-light)]/20 hover:bg-[var(--color-primary)] hover:shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.4)] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 uppercase tracking-widest active:scale-95'
const REMOVE_BTN = 'w-10 h-10 flex items-center justify-center text-red-400 hover:text-white bg-transparent hover:bg-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] rounded-lg transition-all shrink-0 active:scale-95'
</script>

<template>
  <div class="animate-fade-in-up max-w-5xl mx-auto py-4 px-4 sm:px-6">

    <!-- HEADER -->
    <div :class="[SECTION, 'mb-6 flex flex-col md:flex-row items-center gap-8 overflow-hidden group']">
      <div class="absolute -top-24 -right-24 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl transition-all group-hover:bg-[var(--color-primary)]/10"></div>
      <div class="relative w-24 h-24 flex-shrink-0">
        <svg class="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8" fill="transparent" class="text-[var(--border-main)]" />
          <circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8" fill="transparent"
            :stroke-dasharray="251.2" :stroke-dashoffset="251.2 - (251.2 * completenessStats.percent) / 100"
            class="text-[var(--color-primary)] transition-all duration-1000 ease-out" stroke-linecap="round" />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-xl font-black text-[var(--text-main)]">{{ completenessStats.percent }}%</span>
          <span class="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-center leading-none">Data Ready</span>
        </div>
      </div>
      <div class="flex-1 text-center md:text-left relative z-10">
        <h2 class="text-lg font-bold text-[var(--text-main)] tracking-tight">Personal Data Sheet (CS Form 212)</h2>
        <p class="text-xs text-[var(--text-muted)] mt-1 font-medium">{{ fullName }}</p>
      </div>
    </div>

    <!-- TABS -->
    <div class="flex gap-1 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-1.5 mb-8 overflow-x-auto no-scrollbar shadow-sm">
      <button v-for="tab in tabs" :key="tab.id" @click="setTab(tab.id)"
        :class="['flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all relative',
          activeTab === tab.id ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)]']">
        <i :class="['pi text-[11px]', tab.icon]"></i>{{ tab.label }}
        <div v-if="completenessStats.sections[tab.id]" class="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 border border-white"></div>
      </button>
    </div>

    <div v-if="loading" class="p-20 flex justify-center"><i class="pi pi-spin pi-spinner text-3xl opacity-20"></i></div>

    <div v-else class="space-y-8 pb-32">

      <!-- ══ TAB 1: PERSONAL ════════════════════════════════════════ -->
      <section v-if="activeTab === 'personal'" class="space-y-6 animate-fade-in">
        <div :class="SECTION">
          <h3 :class="H3">Basic Information</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div class="flex flex-col gap-1.5"><label :class="LABEL">First Name</label><input v-model="form.name.firstName" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Middle Name</label><input v-model="form.name.middleName" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Last Name</label><input v-model="form.name.lastName" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Suffix</label><input v-model="form.name.suffix" :class="F" /></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Date of Birth</label><input v-model="form.birthDate" type="date" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Sex</label><select v-model="form.sex" :class="F"><option value="male">Male</option><option value="female">Female</option></select></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Civil Status</label><select v-model="form.civilStatus" :class="F"><option value="">Select...</option><option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option></select></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Ethnic Group</label><input v-model="form.ethnicGroup" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Religion</label><input v-model="form.religion" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Disability (if any)</label><input v-model="form.disability" :class="F" /></div>
          </div>
        </div>
        
        <div :class="SECTION">
          <h3 :class="H3">Contacts & Identification</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
            <div class="space-y-3">
              <div class="flex items-center justify-between"><label :class="LABEL">Mobile Numbers</label><button @click="addPhone" :class="ADD_BTN"><i class="pi pi-plus text-[8px]"></i> Add Phone</button></div>
              <transition-group name="list" tag="div" class="space-y-2">
                <div v-for="(p, i) in form.contact.phones" :key="i" class="flex gap-2 items-center">
                  <input v-model="form.contact.phones[i]" :class="F" placeholder="09xxxxxxxxx" />
                  <button @click="removeItem('phones', i)" :disabled="form.contact.phones.length === 1" :class="REMOVE_BTN"><i class="pi pi-trash text-xs"></i></button>
                </div>
              </transition-group>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between"><label :class="LABEL">Email Addresses</label><button @click="addEmail" :class="ADD_BTN"><i class="pi pi-plus text-[8px]"></i> Add Email</button></div>
              <transition-group name="list" tag="div" class="space-y-2">
                <div v-for="(e, i) in form.contact.emails" :key="i" class="flex gap-2 items-center">
                  <input v-model="form.contact.emails[i]" :class="F" placeholder="user@example.com" />
                  <button @click="removeItem('emails', i)" :disabled="form.contact.emails.length === 1" :class="REMOVE_BTN"><i class="pi pi-trash text-xs"></i></button>
                </div>
              </transition-group>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div class="flex flex-col gap-1.5"><label :class="LABEL">GSIS ID NO.</label><input v-model="form.gsisNo" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">PAG-IBIG ID NO.</label><input v-model="form.pagibigNo" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">PHILHEALTH NO.</label><input v-model="form.philhealthNo" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">SSS NO.</label><input v-model="form.sssNo" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">TIN NO.</label><input v-model="form.tinNo" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">AGENCY EMPLOYEE NO.</label><input v-model="form.agencyEmployeeNo" :class="F" /></div>
          </div>
        </div>

        <div :class="SECTION">
          <h3 :class="H3">Residential Address</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2 flex flex-col gap-1.5">
              <label :class="LABEL">Sitio / House No. / Street</label>
              <input v-model="form.address.sitio" :class="F" placeholder="Block 4, Lot 7, Magsaysay St." />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Barangay</label>
              <input v-model="form.address.barangay" :class="F" placeholder="Barangay" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Municipality / City</label>
              <input v-model="form.address.municipality" :class="F" placeholder="Municipality" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Province</label>
              <input v-model="form.address.province" :class="F" placeholder="Province" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">ZIP Code</label>
              <input v-model="form.address.zipCode" :class="F" placeholder="6214" />
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
          <div class="flex justify-between items-center mb-6"><h3 :class="H3" class="mb-0">Children</h3><button @click="addItem('children')" :class="ADD_BTN"><i class="pi pi-plus text-[8px]"></i> Add Child</button></div>
          <transition-group name="list" tag="div" class="space-y-3">
            <div v-for="(c, i) in form.family.children" :key="i" class="p-5 bg-[var(--bg-app)]/50 rounded-xl border border-[var(--border-main)] flex flex-col sm:flex-row gap-4 items-end transition-all hover:border-[var(--color-primary)] shadow-sm">
              <div class="flex-1 grid grid-cols-2 gap-3 w-full">
                <input v-model="c.firstName" :class="F" placeholder="Child's Name" />
                <input v-model="c.birthDate" type="date" :class="F" />
              </div>
              <button @click="removeItem('children', i)" :class="REMOVE_BTN"><i class="pi pi-trash text-sm"></i></button>
            </div>
          </transition-group>
        </div>
      </section>

      <!-- ══ TAB 3: EDUCATION ═══════════════════════════════════════ -->
      <section v-if="activeTab === 'education'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center"><h3 :class="H3" class="mb-0 text-base">Educational Background</h3><AppButton size="sm" icon="pi-plus" @click="addItem('education')">Add Record</AppButton></div>
        <transition-group name="list" tag="div" class="space-y-4">
          <div v-for="(e, i) in form.education" :key="i" :class="SECTION" class="group/item overflow-hidden transition-all hover:border-[var(--color-primary)]">
            <div class="flex justify-between items-start mb-5">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shadow-sm"><i class="pi pi-graduation-cap text-lg"></i></div>
                <div><span class="text-xs font-black uppercase text-[var(--text-main)] tracking-widest">{{ e.level }}</span><p class="text-[9px] text-[var(--text-muted)] font-bold uppercase">{{ e.status || 'Academic Status' }}</p></div>
              </div>
              <button @click="removeItem('education', i)" :class="REMOVE_BTN"><i class="pi pi-trash text-sm"></i></button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Level</label><select v-model="e.level" :class="F"><option>Elementary</option><option>Secondary</option><option>Vocational</option><option>Bachelor</option><option>Masteral</option><option>Doctorate</option></select></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">School Name</label><input v-model="e.school" :class="F" placeholder="University or School" /></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">{{ ['Vocational','Associate'].includes(e.level) ? 'Certificate / Course' : 'Degree / Course Title' }}</label><input v-model="e.degree" :class="F" placeholder="e.g. BS Information Technology" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Period From (Year)</label><input v-model="e.periodFrom" :class="F" placeholder="YYYY" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Period To (Year)</label><input v-model="e.periodTo" :class="F" placeholder="YYYY" /></div>
            </div>
            <div v-if="!['Elementary','Secondary'].includes(e.level)" class="p-5 bg-[var(--bg-app)]/50 rounded-xl border border-[var(--border-main)] grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Academic Status</label><select v-model="e.status" :class="F"><option>Graduated</option><option v-if="['Masteral','Doctorate'].includes(e.level)">CAR (Completed Academic Requirements)</option><option>Ongoing / Units Earned</option><option>Associate / Diploma</option></select></div>
              <div v-if="e.status === 'Graduated'" class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5"><label :class="LABEL">Year Graduated</label><input v-model="e.yearGraduated" :class="F" placeholder="YYYY" /></div>
                <div class="flex flex-col gap-1.5"><label :class="LABEL">Honors Received</label><input v-model="e.honorsReceived" :class="F" placeholder="Cum Laude, CPA, etc." /></div>
              </div>
              <div v-else class="flex flex-col gap-1.5"><label :class="LABEL">Highest Units Earned</label><input v-model="e.unitsEarned" :class="F" placeholder="e.g. 36 Units" /></div>
            </div>
          </div>
        </transition-group>
      </section>

      <!-- ══ TAB 4: ELIGIBILITY ══════════════════════════════════════ -->
      <section v-if="activeTab === 'eligibility'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center"><h3 :class="H3" class="mb-0 text-base">Civil Service Eligibility</h3><AppButton size="sm" icon="pi-plus" @click="addItem('eligibility')">Add Record</AppButton></div>
        <transition-group name="list" tag="div" class="space-y-4">
          <div v-for="(e, i) in form.eligibility" :key="i" :class="SECTION" class="transition-all hover:border-[var(--color-primary)]">
            <div class="flex justify-between items-start mb-5">
              <div class="flex items-center gap-3"><div class="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shadow-sm"><i class="pi pi-verified text-lg"></i></div><span class="text-xs font-black uppercase text-[var(--text-main)] tracking-widest">{{ e.name || 'NEW RECORD' }}</span></div>
              <button @click="removeItem('eligibility', i)" :class="REMOVE_BTN"><i class="pi pi-trash text-sm"></i></button>
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
              <div class="flex flex-col gap-1.5"><label :class="LABEL">License / Exam Title</label><input v-model="e.name" :class="F" /></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Rating / Score</label><input v-model="e.rating" :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Date of Exam</label><input v-model="e.dateOfExam" type="date" :class="F" /></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">License Number</label><input v-model="e.licenseNumber" :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">License Validity</label><input v-model="e.licenseValidity" type="date" :class="F" /></div>
            </div>
          </div>
        </transition-group>
      </section>

      <!-- ══ TAB 5: EXPERIENCE ════════════════════════════════════════ -->
      <section v-if="activeTab === 'experience'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center"><h3 :class="H3" class="mb-0 text-base">Work Experience</h3><AppButton size="sm" icon="pi-plus" @click="addItem('experience')">Add Record</AppButton></div>
        <transition-group name="list" tag="div" class="space-y-4">
          <div v-for="(e, i) in form.experience" :key="i" :class="SECTION" class="transition-all hover:border-[var(--color-primary)]">
            <div class="flex justify-between items-start mb-5">
              <div class="flex items-center gap-3"><div class="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shadow-sm"><i class="pi pi-briefcase text-lg"></i></div><span class="text-xs font-black uppercase text-[var(--text-main)] tracking-widest">{{ e.position || 'POSITION' }}</span></div>
              <button @click="removeItem('experience', i)" :class="REMOVE_BTN"><i class="pi pi-trash text-sm"></i></button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"><input v-model="e.position" :class="F" placeholder="Position Title" /><input v-model="e.company" :class="F" placeholder="Company / Agency" /></div>
            <div class="grid grid-cols-2 gap-4"><input v-model="e.periodFrom" type="date" :class="F" /><input v-model="e.periodTo" type="date" :class="F" /></div>
          </div>
        </transition-group>
      </section>

      <!-- ══ TAB 6: TRAINING ═════════════════════════════════════════ -->
      <section v-if="activeTab === 'training'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center"><h3 :class="H3" class="mb-0 text-base">Learning & Development</h3><AppButton size="sm" icon="pi-plus" @click="addItem('training')">Add Training Record</AppButton></div>
        <transition-group name="list" tag="div" class="space-y-4">
          <div v-for="(t, i) in form.training" :key="i" :class="SECTION" class="transition-all hover:border-[var(--color-primary)]">
            <div class="flex justify-between items-start mb-5">
              <div class="flex items-center gap-3"><div class="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shadow-sm"><i class="pi pi-book text-lg"></i></div><span class="text-xs font-black uppercase text-[var(--text-main)] tracking-widest">{{ t.title || 'NEW TRAINING' }}</span></div>
              <button @click="removeItem('training', i)" :class="REMOVE_BTN"><i class="pi pi-trash text-sm"></i></button>
            </div>
            <div class="flex flex-col gap-1.5 mb-4"><label :class="LABEL">Title of Training</label><input v-model="t.title" :class="F" /></div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">No. of Hours</label><input v-model.number="t.hours" type="number" :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Date Issued</label><input v-model="t.dateIssued" type="date" :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Provider / Sponsor</label><input v-model="t.provider" :class="F" /></div>
            </div>
          </div>
        </transition-group>
      </section>

      <!-- ══ TAB 7: VOLUNTARY WORK ═══════════════════════════════════ -->
      <section v-if="activeTab === 'voluntary'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center"><h3 :class="H3" class="mb-0 text-base">Voluntary Work</h3><AppButton size="sm" icon="pi-plus" @click="addItem('voluntary')">Add Voluntary Record</AppButton></div>
        <transition-group name="list" tag="div" class="space-y-4">
          <div v-for="(v, i) in form.voluntaryWork" :key="i" :class="SECTION" class="transition-all hover:border-[var(--color-primary)]">
            <div class="flex justify-between items-start mb-5">
              <div class="flex items-center gap-3"><div class="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shadow-sm"><i class="pi pi-heart text-lg"></i></div><span class="text-xs font-black uppercase text-[var(--text-main)] tracking-widest">{{ v.organization || 'NEW ORGANIZATION' }}</span></div>
              <button @click="removeItem('voluntary', i)" :class="REMOVE_BTN"><i class="pi pi-trash text-sm"></i></button>
            </div>
            <input v-model="v.organization" :class="F" placeholder="Organization Name" class="mb-4" />
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Date From</label><input v-model="v.periodFrom" type="date" :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Position</label><input v-model="v.position" :class="F" /></div>
            </div>
          </div>
        </transition-group>
      </section>

      <!-- ══ TAB 8: OTHERS ═══════════════════════════════════════════ -->
      <section v-if="activeTab === 'others'" class="space-y-6 animate-fade-in">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div v-for="l in othersLists" :key="l.id" :class="SECTION">
            <div class="flex justify-between items-center mb-6"><h3 :class="H3" class="mb-0 text-xs">{{ l.label }}</h3><button @click="addItem(l.id)" :class="ADD_BTN"><i class="pi pi-plus text-[8px]"></i> Add Entry</button></div>
            <transition-group name="list" tag="div" class="space-y-2">
              <div v-for="(item, i) in form[l.field]" :key="i" class="flex gap-2 items-center">
                <input v-model="form[l.field][i]" :class="F" placeholder="Enter detail..." />
                <button @click="removeItem(l.id, i)" :class="REMOVE_BTN"><i class="pi pi-trash text-sm"></i></button>
              </div>
            </transition-group>
          </div>
        </div>
      </section>

    </div>

    <!-- STICKY SAVE -->
    <div class="fixed bottom-8 right-8 z-40">
      <AppButton size="xl" icon="pi-save" @click="saveProfile" :loading="saving" class="shadow-2xl font-bold px-10">Save PDS Profile</AppButton>
    </div>

  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(10px); }
</style>
