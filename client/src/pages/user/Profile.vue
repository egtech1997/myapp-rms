<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'
import { ELIGIBILITY_GROUPS } from '@/utils/eligibilityOptions'
import { AppTableReport } from '@/components/ui'
import PdsPage from '@/components/PdsPage.vue'

const authStore = useAuthStore()
const toast = inject('$toast')

const loading = ref(true)
const saving  = ref(false)
const exporting = ref(false)
const showPdsPreview = ref(false)
const activeTab = ref('personal')

// ── REPORT ──────────────────────────────────────────────────────
const showReport = ref(false)
const reportTitle = ref('Service Record')
const reportCols = ref([])
const reportRows = ref([])

const openExperienceReport = () => {
  reportTitle.value = 'Service Record (Work Experience)'
  reportCols.value = [
    { label: 'Position', key: 'position' },
    { label: 'Company / Agency', key: 'company' },
    { label: 'From', value: (r) => formatDate(r.periodFrom) },
    { label: 'To', value: (r) => r.periodTo ? formatDate(r.periodTo) : 'Present' },
    { label: 'Status', key: 'statusOfAppointment' },
    { label: 'Govt.', value: (r) => r.isGovernment ? 'Yes' : 'No' },
    { label: 'Salary', value: (r) => r.monthlySalary ? `₱${r.monthlySalary.toLocaleString()}` : '—' }
  ]
  reportRows.value = form.experience
  showReport.value = true
}

const openTrainingReport = () => {
  reportTitle.value = 'Learning & Development (Trainings)'
  reportCols.value = [
    { label: 'Training Title', key: 'title' },
    { label: 'Provider / Sponsor', key: 'provider' },
    { label: 'From', value: (r) => formatDate(r.periodFrom) },
    { label: 'To', value: (r) => formatDate(r.periodTo) },
    { label: 'Hours', key: 'hours' },
    { label: 'Type', key: 'typeOfLD' }
  ]
  reportRows.value = form.training
  showReport.value = true
}

// ── EXPORT ──────────────────────────────────────────────────────
const exportPDF = async () => {
  exporting.value = true
  try {
    const response = await apiClient.get('/v1/pds/me/export', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `PDS-${form.name.lastName || 'PROFILE'}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Export Failed', text: 'Could not generate PDS PDF.' })
  } finally {
    exporting.value = false
  }
}

const printPDF = async () => {
  exporting.value = true
  try {
    const response = await apiClient.get('/v1/pds/me/export', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const win = window.open(url, '_blank')
    if (win) win.focus()
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Print Failed', text: 'Could not generate PDS PDF.' })
  } finally {
    exporting.value = false
  }
}

const exportExcel = () => {
  // Simple CSV export of profile data
  const data = []
  const pushRow = (label, val) => data.push([`"${label}"`, `"${String(val || '').replace(/"/g, '""')}"`].join(','))
  
  pushRow('PERSONAL INFORMATION', '')
  pushRow('Full Name', fullName.value)
  pushRow('First Name', form.name.firstName)
  pushRow('Middle Name', form.name.middleName)
  pushRow('Last Name', form.name.lastName)
  pushRow('Suffix', form.name.suffix)
  pushRow('Sex', form.sex)
  pushRow('Date of Birth', form.birthDate)
  pushRow('Age', calcAge(form.birthDate))
  pushRow('Civil Status', form.civilStatus)
  pushRow('Ethnic Group', form.ethnicGroup)
  pushRow('Religion', form.religion)
  pushRow('Disability', form.disability)
  pushRow('Email(s)', form.contact.emails.join('; '))
  pushRow('Phone(s)', form.contact.phones.join('; '))
  pushRow('Address', `${form.address.sitio}, ${form.address.barangay}, ${form.address.municipality}, ${form.address.province}`)
  
  pushRow('', '')
  pushRow('FAMILY BACKGROUND', '')
  pushRow('Spouse', `${form.family.spouse.firstName} ${form.family.spouse.lastName}`)
  pushRow('Father', `${form.family.father.firstName} ${form.family.father.lastName}`)
  pushRow('Mother', `${form.family.mother.firstName} ${form.family.mother.lastName}`)
  form.family.children.forEach((c, i) => pushRow(`Child ${i+1}`, `${c.firstName} ${c.lastName} (B-Day: ${c.birthDate})`))

  pushRow('', '')
  pushRow('EDUCATIONAL BACKGROUND', '')
  form.education.forEach((e, i) => pushRow(`Education ${i+1}`, `${e.level}: ${e.school} - ${e.degree} (${e.periodFrom}-${e.periodTo})`))

  pushRow('', '')
  pushRow('CIVIL SERVICE ELIGIBILITY', '')
  form.eligibility.forEach((e, i) => pushRow(`Eligibility ${i+1}`, `${e.name} - Rating: ${e.rating} (Date: ${e.dateOfExam})`))

  pushRow('', '')
  pushRow('WORK EXPERIENCE', '')
  form.experience.forEach((e, i) => pushRow(`Experience ${i+1}`, `${e.position} at ${e.company} (${e.periodFrom} to ${e.periodTo || 'Present'})`))

  pushRow('', '')
  pushRow('LEARNING & DEVELOPMENT (TRAININGS)', '')
  form.training.forEach((t, i) => pushRow(`Training ${i+1}`, `${t.title} - ${t.hours} hours (${t.periodFrom} to ${t.periodTo})`))

  const csv = '\uFEFF' + data.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), {
    href: url, download: `PDS-DATA-${form.name.lastName || 'PROFILE'}.csv`,
  })
  a.click()
  URL.revokeObjectURL(url)
}

const tabs = [
  { id: 'personal',    label: 'Personal Info',        icon: 'pi-user'           },
  { id: 'family',      label: 'Family Background',    icon: 'pi-users'          },
  { id: 'education',   label: 'Education',            icon: 'pi-graduation-cap' },
  { id: 'eligibility', label: 'Eligibility',          icon: 'pi-verified'       },
  { id: 'experience',  label: 'Work Experience',      icon: 'pi-briefcase'      },
  { id: 'training',    label: 'L&D / Trainings',      icon: 'pi-book'           },
  { id: 'voluntary',   label: 'Voluntary Work',       icon: 'pi-heart'          },
  { id: 'others',      label: 'Other Info',           icon: 'pi-list'           },
]

const form = reactive({
  name: { firstName: '', middleName: '', lastName: '', suffix: '' },
  sex: '',
  birthDate: '',
  ethnicGroup: '',
  religion: '',
  disability: '',
  civilStatus: '',
  contact: { phones: [''], emails: [''] },
  address: { sitio: '', barangay: '', municipality: '', city: '', province: '', zipCode: '', country: 'Philippines' },
  family: {
    spouse: { firstName: '', middleName: '', lastName: '', suffix: '', occupation: '', employer: '', businessAddress: '', phone: '' },
    father: { firstName: '', middleName: '', lastName: '', suffix: '' },
    mother: { firstName: '', middleName: '', lastName: '', suffix: '' },
    children: [],
  },
  education: [],
  eligibility: [],
  experience: [],
  voluntaryWork: [],
  training: [],
  competencies: [],
  specialSkills: [],
  nonAcademicDistinctions: [],
  memberships: [],
  performanceRating: { score: null, adjective: '', periodCovered: '' },
  visibility: { phone: false, email: false, address: false },
})

// ── COMPLETENESS ─────────────────────────────────────────────────
const completenessStats = computed(() => {
  const sections = {
    personal:    !!(form.name.firstName && form.name.lastName && form.birthDate && form.sex && form.address.province && form.disability),
    education:   form.education.length > 0,
    eligibility: form.eligibility.length > 0,
    experience:  form.experience.length > 0,
    training:    form.training.length > 0,
    family:      !!(form.family.father.lastName || form.family.mother.lastName),
    others:      (form.competencies.length > 0 || form.specialSkills.length > 0),
  }
  const keys = Object.keys(sections)
  const completedCount = keys.filter(k => sections[k]).length
  const percent = Math.round((completedCount / keys.length) * 100)
  const criticalMissing = []
  if (!sections.education) criticalMissing.push('Educational Background')
  if (!sections.eligibility) criticalMissing.push('Civil Service Eligibility')
  if (!sections.experience) criticalMissing.push('Work Experience')
  return { percent, sections, criticalMissing }
})

const fullName = computed(() => {
  const { firstName, middleName, lastName, suffix } = form.name
  const mi = middleName ? `${middleName.charAt(0)}.` : ''
  return [firstName, mi, lastName, suffix].filter(Boolean).join(' ') || authStore.user?.username
})

// ── AGE CALC ──────────────────────────────────────────────────────
const calcAge = (dateStr) => {
  if (!dateStr) return null
  const today = new Date()
  const birth = new Date(dateStr)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// ── HELPERS ───────────────────────────────────────────────────────
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const addPhone = () => form.contact.phones.push('')
const removePhone = (i) => { if (form.contact.phones.length > 1) form.contact.phones.splice(i, 1) }
const addEmail = () => form.contact.emails.push('')
const removeEmail = (i) => { if (form.contact.emails.length > 1) form.contact.emails.splice(i, 1) }

const addResponsibility = (exp) => exp.keyResponsibilities.push('')
const removeResponsibility = (exp, i) => exp.keyResponsibilities.splice(i, 1)

const addItem = (list) => {
  if (list === 'children')     form.family.children.push({ firstName: '', middleName: '', lastName: '', suffix: '', birthDate: '' })
  if (list === 'education')    form.education.push({ level: '', school: '', degree: '', periodFrom: '', periodTo: '', notGraduated: false, unitsEarned: null, yearGraduated: null, honorsReceived: '' })
  if (list === 'eligibility')  form.eligibility.push({ type: '', name: '', rating: '', dateOfExam: '', placeOfExam: '', licenseNumber: '', licenseValidity: '' })
  if (list === 'experience')   form.experience.push({ periodFrom: '', periodTo: '', position: '', company: '', monthlySalary: null, salaryGrade: '', statusOfAppointment: 'Permanent', isGovernment: false, keyResponsibilities: [] })
  if (list === 'voluntary')    form.voluntaryWork.push({ organization: '', periodFrom: '', periodTo: '', hours: null, position: '' })
  if (list === 'training')     form.training.push({ title: '', periodFrom: '', periodTo: '', hours: 0, typeOfLD: 'Technical', provider: '' })
  if (list === 'competencies') form.competencies.push('')
  if (list === 'skills')       form.specialSkills.push('')
  if (list === 'distinctions') form.nonAcademicDistinctions.push('')
  if (list === 'memberships')  form.memberships.push('')
}

const removeItem = (list, index) => {
  if (list === 'children')     form.family.children.splice(index, 1)
  if (list === 'education')    form.education.splice(index, 1)
  if (list === 'eligibility')  form.eligibility.splice(index, 1)
  if (list === 'experience')   form.experience.splice(index, 1)
  if (list === 'voluntary')    form.voluntaryWork.splice(index, 1)
  if (list === 'training')     form.training.splice(index, 1)
  if (list === 'competencies') form.competencies.splice(index, 1)
  if (list === 'skills')       form.specialSkills.splice(index, 1)
  if (list === 'distinctions') form.nonAcademicDistinctions.splice(index, 1)
  if (list === 'memberships')  form.memberships.splice(index, 1)
}

// ── LOAD ──────────────────────────────────────────────────────────
const loadProfile = async () => {
  try {
    const { data } = await apiClient.get('/v1/profile/me')
    if (data.data) {
      const d = data.data
      if (d.sex !== undefined)         form.sex         = d.sex
      if (d.birthDate)                 form.birthDate   = d.birthDate.substring(0, 10)
      if (d.ethnicGroup !== undefined) form.ethnicGroup = d.ethnicGroup
      if (d.religion !== undefined)    form.religion    = d.religion
      if (d.disability !== undefined)  form.disability  = d.disability
      if (d.civilStatus !== undefined) form.civilStatus = d.civilStatus
      if (d.name)    Object.assign(form.name,    d.name)
      if (d.address) Object.assign(form.address, d.address)
      if (d.visibility) Object.assign(form.visibility, d.visibility)
      if (d.performanceRating) Object.assign(form.performanceRating, d.performanceRating)
      // Contact — support old single-value format
      if (d.contact) {
        if (d.contact.phones?.length) form.contact.phones = d.contact.phones
        else if (d.contact.phone)     form.contact.phones = [d.contact.phone]
        if (d.contact.emails?.length) form.contact.emails = d.contact.emails
        else if (d.contact.email)     form.contact.emails = [d.contact.email]
      }
      // Family — deep merge
      if (d.family) {
        if (d.family.spouse)   Object.assign(form.family.spouse,  d.family.spouse)
        if (d.family.father)   Object.assign(form.family.father,  d.family.father)
        if (d.family.mother)   Object.assign(form.family.mother,  d.family.mother)
        if (d.family.children) form.family.children = d.family.children.map(c => ({
          firstName: c.firstName || '', middleName: c.middleName || '',
          lastName: c.lastName || '', suffix: c.suffix || '',
          birthDate: c.birthDate ? new Date(c.birthDate).toISOString().substring(0, 10) : '',
        }))
      }
      // Arrays
      if (d.education)               form.education               = d.education.map(e => ({ ...e }))
      if (d.eligibility)             form.eligibility             = d.eligibility.map(e => ({ ...e, dateOfExam: e.dateOfExam ? new Date(e.dateOfExam).toISOString().substring(0, 10) : '', licenseValidity: e.licenseValidity ? new Date(e.licenseValidity).toISOString().substring(0, 10) : '' }))
      if (d.experience)              form.experience              = d.experience.map(e => ({ ...e, periodFrom: e.periodFrom ? new Date(e.periodFrom).toISOString().substring(0, 10) : '', periodTo: e.periodTo ? new Date(e.periodTo).toISOString().substring(0, 10) : '', keyResponsibilities: e.keyResponsibilities || [] }))
      if (d.voluntaryWork)           form.voluntaryWork           = d.voluntaryWork.map(v => ({ ...v, periodFrom: v.periodFrom ? new Date(v.periodFrom).toISOString().substring(0, 10) : '', periodTo: v.periodTo ? new Date(v.periodTo).toISOString().substring(0, 10) : '' }))
      if (d.training)                form.training                = d.training.map(t => ({ ...t, periodFrom: t.periodFrom ? new Date(t.periodFrom).toISOString().substring(0, 10) : '', periodTo: t.periodTo ? new Date(t.periodTo).toISOString().substring(0, 10) : '' }))
      if (d.competencies)            form.competencies            = d.competencies
      if (d.specialSkills)           form.specialSkills           = d.specialSkills
      if (d.nonAcademicDistinctions) form.nonAcademicDistinctions = d.nonAcademicDistinctions
      if (d.memberships)             form.memberships             = d.memberships
    }
  } catch (err) { } finally {
    loading.value = false
  }
}

// ── SAVE ──────────────────────────────────────────────────────────
const saveProfile = async () => {
  saving.value = true
  try {
    const payload = JSON.parse(JSON.stringify(form))
    const stripKeys = ['_id', 'id', '__v', 'user', 'createdAt', 'updatedAt', 'fullName', 'age']
    stripKeys.forEach(k => delete payload[k])
    // Clean contact arrays
    payload.contact.phones = (payload.contact.phones || []).filter(p => p.trim())
    payload.contact.emails = (payload.contact.emails || []).filter(e => e.trim())
    // Filter incomplete arrays
    payload.experience    = (payload.experience    || []).filter(e => e.position?.trim() && e.company?.trim())
    payload.voluntaryWork = (payload.voluntaryWork || []).filter(v => v.organization?.trim())
    payload.education     = (payload.education     || []).filter(e => e.level && e.school?.trim())
    payload.eligibility   = (payload.eligibility   || []).filter(e => e.name?.trim())
    payload.training      = (payload.training      || []).filter(t => t.title?.trim())
    // Clean responsibilities
    payload.experience.forEach(e => {
      e.keyResponsibilities = (e.keyResponsibilities || []).filter(r => r.trim())
    })
    await apiClient.put('/v1/profile/me', payload)
    toast.fire({ icon: 'success', title: 'Success', text: 'PDS records updated.' })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Update failed.' })
  } finally {
    saving.value = false
  }
}

onMounted(loadProfile)

const F = 'w-full h-11 px-4 text-sm bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] text-[var(--text-main)] transition-all'
const LABEL = 'text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider'
const SECTION = 'bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-6 shadow-sm'
</script>

<template>
  <div class="animate-fade-in-up max-w-5xl mx-auto py-4 px-4 sm:px-6">

    <!-- HEADER -->
    <div :class="[SECTION, 'mb-6 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group']">
      <div class="absolute -top-24 -right-24 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl transition-all duration-700 group-hover:bg-[var(--color-primary)]/10"></div>
      <div class="relative w-24 h-24 flex-shrink-0">
        <svg class="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8" fill="transparent" class="text-[var(--border-main)]" />
          <circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8" fill="transparent"
            :stroke-dasharray="251.2" :stroke-dashoffset="251.2 - (251.2 * completenessStats.percent) / 100"
            class="text-[var(--color-primary)] transition-all duration-1000 ease-out" stroke-linecap="round" />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-xl font-black text-[var(--text-main)]">{{ completenessStats.percent }}%</span>
          <span class="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-center leading-none">Data<br/>Ready</span>
        </div>
      </div>
      <div class="flex-1 text-center md:text-left relative z-10">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-black text-[var(--text-main)] tracking-tight">Personal Data Sheet (CS Form 212)</h2>
            <p class="text-xs text-[var(--text-muted)] mt-1 font-medium">{{ fullName }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button @click="showPdsPreview = true"
              class="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all">
              <i class="pi pi-eye"></i>
              <span>Preview PDS</span>
            </button>
            <div class="relative group">
              <button
                class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">
                <i class="pi pi-file-excel"></i>
                <span>Report</span>
                <i class="pi pi-chevron-down text-[8px]"></i>
              </button>
              <!-- Simple dropdown for report types -->
              <div class="absolute right-0 top-full mt-2 w-48 bg-white border border-[var(--border-main)] rounded-xl shadow-xl py-2 z-50 hidden group-hover:block animate-fade-in">
                <button @click="openExperienceReport" class="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--color-primary)] transition-colors">
                  Service Record
                </button>
                <button @click="openTrainingReport" class="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--color-primary)] transition-colors">
                  Training History
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
          <template v-if="completenessStats.criticalMissing.length > 0">
            <span v-for="miss in completenessStats.criticalMissing" :key="miss"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-black border border-red-100 uppercase tracking-tighter">
              <i class="pi pi-exclamation-triangle"></i> {{ miss }} Missing
            </span>
          </template>
          <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black border border-emerald-100 uppercase tracking-tighter">
            <i class="pi pi-check-circle"></i> Profile Validated
          </span>
        </div>
      </div>
    </div>

    <!-- TABS -->
    <div class="flex gap-1 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-1.5 mb-8 overflow-x-auto no-scrollbar shadow-sm">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        :class="['flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all relative',
          activeTab === tab.id ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)]']">
        <i :class="['pi text-[11px]', tab.icon]"></i>{{ tab.label }}
        <div v-if="completenessStats.sections[tab.id]"
          class="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 border border-white"></div>
      </button>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="flex flex-col gap-4">
      <div v-for="n in 5" :key="n" class="h-16 bg-[var(--bg-app)] animate-pulse rounded-2xl"></div>
    </div>

    <div v-else class="space-y-8 pb-32">

      <!-- ══ TAB 1: PERSONAL ════════════════════════════════════════ -->
      <section v-if="activeTab === 'personal'" class="space-y-6 animate-fade-in">

        <!-- Name -->
        <div :class="SECTION">
          <div class="flex items-center gap-2 mb-5">
            <i class="pi pi-user text-[var(--color-primary)] text-sm"></i>
            <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">I. Personal Information</h3>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">First Name <span class="text-red-400">*</span></label>
              <input v-model="form.name.firstName" :class="F" placeholder="Juan" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Middle Name</label>
              <input v-model="form.name.middleName" :class="F" placeholder="Santos" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Last Name <span class="text-red-400">*</span></label>
              <input v-model="form.name.lastName" :class="F" placeholder="Dela Cruz" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Suffix</label>
              <input v-model="form.name.suffix" :class="F" placeholder="Jr. / Sr. / III" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Date of Birth <span class="text-red-400">*</span></label>
              <input v-model="form.birthDate" type="date" :class="F" />
              <p v-if="form.birthDate" class="text-[10px] text-[var(--text-muted)]">Age: {{ calcAge(form.birthDate) }} years old</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Sex <span class="text-red-400">*</span></label>
              <select v-model="form.sex" :class="F">
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Civil Status</label>
              <select v-model="form.civilStatus" :class="F">
                <option value="">Select...</option>
                <option>Single</option><option>Married</option>
                <option>Widowed</option><option>Separated</option><option>Other</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Ethnic Group</label>
              <input v-model="form.ethnicGroup" :class="F" placeholder="e.g. Tagalog, Bisaya, Ilocano..." />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Religion</label>
              <input v-model="form.religion" :class="F" placeholder="e.g. Roman Catholic, Islam..." />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Disability (if any)</label>
              <input v-model="form.disability" :class="F" placeholder="e.g. N/A, Visual Impairment..." />
            </div>
          </div>
        </div>

        <!-- Contact (dynamic arrays) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div :class="SECTION">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">Mobile Numbers</h3>
              <button @click="addPhone" class="text-[10px] font-bold text-[var(--color-primary)] hover:underline uppercase tracking-widest">+ Add Number</button>
            </div>
            <div class="space-y-2">
              <div v-for="(phone, i) in form.contact.phones" :key="'ph'+i" class="flex gap-2 animate-fade-in">
                <div class="relative flex-1">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs">+63</span>
                  <input v-model="form.contact.phones[i]" :class="F" class="pl-10" placeholder="9xx-xxx-xxxx" type="tel" />
                </div>
                <button @click="removePhone(i)" :disabled="form.contact.phones.length === 1"
                  class="w-11 h-11 flex items-center justify-center text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors">
                  <i class="pi pi-times"></i>
                </button>
              </div>
            </div>
          </div>
          <div :class="SECTION">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">Email Addresses</h3>
              <button @click="addEmail" class="text-[10px] font-bold text-[var(--color-primary)] hover:underline uppercase tracking-widest">+ Add Email</button>
            </div>
            <div class="space-y-2">
              <div v-for="(email, i) in form.contact.emails" :key="'em'+i" class="flex gap-2 animate-fade-in">
                <input v-model="form.contact.emails[i]" :class="[F, 'flex-1']" placeholder="you@example.com" type="email" />
                <button @click="removeEmail(i)" :disabled="form.contact.emails.length === 1"
                  class="w-11 h-11 flex items-center justify-center text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors">
                  <i class="pi pi-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Address -->
        <div :class="SECTION">
          <h3 class="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest mb-4">Residential Address</h3>
          <div class="grid grid-cols-2 gap-3">
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
              <label :class="LABEL">Province <span class="text-red-400">*</span></label>
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

        <!-- Spouse -->
        <div :class="SECTION">
          <div class="flex items-center gap-2 mb-5">
            <i class="pi pi-users text-[var(--color-primary)] text-sm"></i>
            <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">II. Family Background</h3>
          </div>
          <p class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest border-b border-[var(--border-main)] pb-2 mb-4">Spouse Information</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">First Name</label>
              <input v-model="form.family.spouse.firstName" :class="F" placeholder="First Name" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Middle Name</label>
              <input v-model="form.family.spouse.middleName" :class="F" placeholder="Middle Name" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Last Name</label>
              <input v-model="form.family.spouse.lastName" :class="F" placeholder="Last Name" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Suffix</label>
              <input v-model="form.family.spouse.suffix" :class="F" placeholder="Jr. / Sr." />
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Occupation</label>
              <input v-model="form.family.spouse.occupation" :class="F" placeholder="e.g. Teacher, Nurse..." />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Employer / Business Name</label>
              <input v-model="form.family.spouse.employer" :class="F" placeholder="Department / Company" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Contact Number</label>
              <input v-model="form.family.spouse.phone" :class="F" placeholder="09xx-xxx-xxxx" />
            </div>
          </div>
        </div>

        <!-- Father & Mother -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div :class="SECTION">
            <p class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest border-b border-[var(--border-main)] pb-2 mb-4">Father's Name</p>
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label :class="LABEL">First Name</label>
                  <input v-model="form.family.father.firstName" :class="F" placeholder="First Name" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label :class="LABEL">Middle Name</label>
                  <input v-model="form.family.father.middleName" :class="F" placeholder="Middle Name" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label :class="LABEL">Last Name</label>
                  <input v-model="form.family.father.lastName" :class="F" placeholder="Last Name" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label :class="LABEL">Suffix</label>
                  <input v-model="form.family.father.suffix" :class="F" placeholder="Jr. / Sr." />
                </div>
              </div>
            </div>
          </div>
          <div :class="SECTION">
            <p class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest border-b border-[var(--border-main)] pb-2 mb-4">Mother's Maiden Name</p>
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label :class="LABEL">First Name</label>
                  <input v-model="form.family.mother.firstName" :class="F" placeholder="First Name" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label :class="LABEL">Middle Name</label>
                  <input v-model="form.family.mother.middleName" :class="F" placeholder="Middle Name" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label :class="LABEL">Last Name</label>
                  <input v-model="form.family.mother.lastName" :class="F" placeholder="Last Name" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label :class="LABEL">Suffix</label>
                  <input v-model="form.family.mother.suffix" :class="F" placeholder="(if any)" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Children -->
        <div :class="SECTION">
          <div class="flex items-center justify-between mb-4">
            <p class="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">Children</p>
            <button @click="addItem('children')" class="text-[10px] font-bold text-[var(--color-primary)] hover:underline uppercase tracking-widest">+ Add Child</button>
          </div>
          <div v-if="form.family.children.length === 0" class="text-center py-6 text-[var(--text-faint)] text-xs">
            No children added yet.
          </div>
          <div class="space-y-4">
            <div v-for="(child, i) in form.family.children" :key="i" class="p-4 bg-[var(--bg-app)] rounded-xl border border-[var(--border-main)] animate-fade-in">
              <div class="flex items-center justify-between mb-3">
                <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Child #{{ i + 1 }}
                  <span v-if="child.birthDate" class="text-[var(--color-primary)] ml-2">Age: {{ calcAge(child.birthDate) }}</span>
                </span>
                <button @click="removeItem('children', i)" class="text-red-400 hover:text-red-600 transition-colors text-xs">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="flex flex-col gap-1">
                  <label :class="LABEL">First Name</label>
                  <input v-model="child.firstName" :class="F" placeholder="First Name" />
                </div>
                <div class="flex flex-col gap-1">
                  <label :class="LABEL">Middle Name</label>
                  <input v-model="child.middleName" :class="F" placeholder="Middle Name" />
                </div>
                <div class="flex flex-col gap-1">
                  <label :class="LABEL">Last Name</label>
                  <input v-model="child.lastName" :class="F" placeholder="Last Name" />
                </div>
                <div class="flex flex-col gap-1">
                  <label :class="LABEL">Suffix</label>
                  <input v-model="child.suffix" :class="F" placeholder="Jr./Sr." />
                </div>
              </div>
              <div class="mt-3 flex flex-col gap-1 max-w-xs">
                <label :class="LABEL">Date of Birth</label>
                <input v-model="child.birthDate" type="date" :class="F" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══ TAB 3: EDUCATION ═══════════════════════════════════════ -->
      <section v-if="activeTab === 'education'" class="space-y-6 animate-fade-in">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">III. Educational Background</h3>
          <button @click="addItem('education')" class="btn-primary h-9 px-5 text-xs font-bold">+ Add Level</button>
        </div>
        <div v-if="form.education.length === 0" :class="[SECTION, 'text-center py-10']">
          <i class="pi pi-graduation-cap text-3xl text-[var(--text-faint)] mb-3 block"></i>
          <p class="text-sm font-bold text-[var(--text-muted)]">No educational records yet.</p>
          <p class="text-xs text-[var(--text-faint)] mt-1">Click "Add Level" to start — from Elementary to Doctorate.</p>
        </div>
        <div v-for="(edu, i) in form.education" :key="i" :class="[SECTION, 'relative transition-all hover:border-[var(--color-primary-ring)]']">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center">
                <i class="pi pi-graduation-cap text-[var(--color-primary)] text-xs"></i>
              </div>
              <span class="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">{{ edu.level || `Record #${i+1}` }}</span>
            </div>
            <button @click="removeItem('education', i)" class="text-red-400 hover:text-red-600 transition-colors text-sm">
              <i class="pi pi-trash"></i>
            </button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Level <span class="text-red-400">*</span></label>
              <select v-model="edu.level" :class="F">
                <option value="">Select Level...</option>
                <option>Elementary</option>
                <option>Secondary</option>
                <option>Vocational / Trade Course</option>
                <option>Bachelor</option>
                <option>Masteral</option>
                <option>Doctorate</option>
              </select>
            </div>
            <div class="sm:col-span-2 flex flex-col gap-1.5">
              <label :class="LABEL">School / University Name <span class="text-red-400">*</span></label>
              <input v-model="edu.school" :class="F" placeholder="e.g. University of the Philippines" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Degree / Course Title <span class="text-red-400">*</span></label>
              <input v-model="edu.degree" :class="F" placeholder="e.g. Bachelor of Secondary Education" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Honors / Awards Received</label>
              <input v-model="edu.honorsReceived" :class="F" placeholder="e.g. Cum Laude, With Honors" />
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Year From</label>
              <input v-model="edu.periodFrom" :class="F" placeholder="2008" type="number" min="1950" max="2100" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Year To</label>
              <input v-model="edu.periodTo" :class="F" placeholder="2012" type="number" min="1950" max="2100" />
            </div>
          </div>
          <!-- Graduated toggle -->
          <div class="p-4 bg-[var(--bg-app)] rounded-xl border border-[var(--border-main)]">
            <label class="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" v-model="edu.notGraduated" class="w-4 h-4 rounded accent-[var(--color-primary)]" />
              <div>
                <span class="text-xs font-bold text-[var(--text-main)]">Did not graduate / No degree received</span>
                <p class="text-[10px] text-[var(--text-muted)] mt-0.5">Check this if you attended but did not complete the program.</p>
              </div>
            </label>
            <div class="mt-4 grid grid-cols-2 gap-4" v-if="edu.notGraduated">
              <div class="flex flex-col gap-1.5">
                <label :class="LABEL">Units Earned</label>
                <input v-model.number="edu.unitsEarned" type="number" :class="F" placeholder="e.g. 75 units" min="0" />
              </div>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-4" v-else>
              <div class="flex flex-col gap-1.5">
                <label :class="LABEL">Year Graduated</label>
                <input v-model.number="edu.yearGraduated" type="number" :class="F" placeholder="e.g. 2012" min="1950" max="2100" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══ TAB 4: ELIGIBILITY ══════════════════════════════════════ -->
      <section v-if="activeTab === 'eligibility'" class="space-y-6 animate-fade-in">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">IV. Civil Service Eligibility</h3>
          <button @click="addItem('eligibility')" class="btn-primary h-9 px-5 text-xs font-bold">+ Add Record</button>
        </div>
        <div v-if="form.eligibility.length === 0" :class="[SECTION, 'text-center py-10']">
          <i class="pi pi-verified text-3xl text-[var(--text-faint)] mb-3 block"></i>
          <p class="text-sm font-bold text-[var(--text-muted)]">No eligibility records.</p>
          <p class="text-xs text-[var(--text-faint)] mt-1">Add LET, CS Professional/Sub-Professional, Bar, Board exams, etc.</p>
        </div>
        <div v-for="(el, i) in form.eligibility" :key="i" :class="[SECTION, 'relative transition-all hover:border-[var(--color-primary-ring)]']">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center">
                <i class="pi pi-verified text-[var(--color-primary)] text-xs"></i>
              </div>
              <div>
                <span class="text-xs font-black text-[var(--text-main)] uppercase tracking-widest block leading-tight">{{ el.type || `Record #${i+1}` }}</span>
                <span v-if="el.name" class="text-[10px] text-[var(--text-muted)]">{{ el.name }}</span>
              </div>
            </div>
            <button @click="removeItem('eligibility', i)" class="text-red-400 hover:text-red-600 transition-colors">
              <i class="pi pi-trash"></i>
            </button>
          </div>
          <!-- Type + Title row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Eligibility Category <span class="text-red-400">*</span></label>
              <select v-model="el.type" :class="F">
                <option value="" disabled>Select category...</option>
                <optgroup v-for="group in ELIGIBILITY_GROUPS" :key="group.label" :label="group.label">
                  <option v-for="opt in group.options" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </optgroup>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Specific Exam / License Title <span class="text-red-400">*</span></label>
              <input v-model="el.name" :class="F" placeholder="e.g. Licensure Examination for Teachers (LET)" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Rating / Score (%)</label>
              <input v-model="el.rating" :class="F" placeholder="e.g. 82.40" />
            </div>
            <div></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Date of Examination</label>
              <input v-model="el.dateOfExam" type="date" :class="F" />
            </div>
            <div class="sm:col-span-2 flex flex-col gap-1.5">
              <label :class="LABEL">Place / Venue of Examination</label>
              <input v-model="el.placeOfExam" :class="F" placeholder="e.g. University of Negros Occidental - Recoletos, Bacolod City" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[var(--bg-app)] rounded-xl border border-[var(--border-main)]">
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">License / Certificate Number <span class="text-[var(--text-faint)] normal-case font-normal">(if applicable)</span></label>
              <input v-model="el.licenseNumber" :class="F" placeholder="e.g. 0000000" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">License Validity / Expiry Date</label>
              <input v-model="el.licenseValidity" type="date" :class="F" />
            </div>
          </div>
        </div>
      </section>

      <!-- ══ TAB 5: EXPERIENCE ════════════════════════════════════════ -->
      <section v-if="activeTab === 'experience'" class="space-y-6 animate-fade-in">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">V. Work Experience</h3>
          <button @click="addItem('experience')" class="btn-primary h-9 px-5 text-xs font-bold">+ Add Service Record</button>
        </div>
        <div v-if="form.experience.length === 0" :class="[SECTION, 'text-center py-10']">
          <i class="pi pi-briefcase text-3xl text-[var(--text-faint)] mb-3 block"></i>
          <p class="text-sm font-bold text-[var(--text-muted)]">No work experience records yet.</p>
        </div>
        <div v-for="(exp, i) in form.experience" :key="i" :class="[SECTION, 'relative transition-all hover:border-[var(--color-primary-ring)]']">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center">
                <i class="pi pi-briefcase text-[var(--color-primary)] text-xs"></i>
              </div>
              <div>
                <span class="text-xs font-black text-[var(--text-main)]">{{ exp.position || `Record #${i+1}` }}</span>
                <span v-if="exp.company" class="text-[10px] text-[var(--text-muted)] ml-2">@ {{ exp.company }}</span>
              </div>
            </div>
            <button @click="removeItem('experience', i)" class="text-red-400 hover:text-red-600 transition-colors">
              <i class="pi pi-trash"></i>
            </button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Position Title <span class="text-red-400">*</span></label>
              <input v-model="exp.position" :class="F" placeholder="e.g. Teacher I, Administrative Officer II" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Department / Agency / Company <span class="text-red-400">*</span></label>
              <input v-model="exp.company" :class="F" placeholder="e.g. DepEd Division of Guihulngan City" />
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Date From</label>
              <input v-model="exp.periodFrom" type="date" :class="F" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Date To <span class="text-[var(--text-faint)] normal-case font-normal">(leave blank if current)</span></label>
              <input v-model="exp.periodTo" type="date" :class="F" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Monthly Salary (₱)</label>
              <input v-model.number="exp.monthlySalary" type="number" :class="F" placeholder="0.00" min="0" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Salary Grade / Step</label>
              <input v-model="exp.salaryGrade" :class="F" placeholder="e.g. SG-11/1" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Status of Appointment</label>
              <select v-model="exp.statusOfAppointment" :class="F">
                <option>Permanent</option><option>Temporary</option>
                <option>Coterminous</option><option>Contractual</option>
                <option>Casual</option><option>Job Order</option>
              </select>
            </div>
            <div class="flex items-center gap-3 pt-6">
              <input type="checkbox" v-model="exp.isGovernment" :id="`gov-${i}`" class="w-4 h-4 accent-[var(--color-primary)]" />
              <label :for="`gov-${i}`" class="text-xs font-bold text-[var(--text-main)] cursor-pointer">Government Service</label>
            </div>
          </div>
          <!-- Key Responsibilities -->
          <div class="p-4 bg-[var(--bg-app)] rounded-xl border border-[var(--border-main)]">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Key Responsibilities</p>
                <p class="text-[10px] text-[var(--text-faint)] mt-0.5">Optional — describe major duties performed in this role.</p>
              </div>
              <button @click="addResponsibility(exp)" class="text-[10px] font-bold text-[var(--color-primary)] hover:underline uppercase tracking-widest">+ Add</button>
            </div>
            <div class="space-y-2">
              <div v-for="(resp, ri) in exp.keyResponsibilities" :key="ri" class="flex gap-2 animate-fade-in">
                <div class="w-5 h-11 flex items-center justify-center shrink-0">
                  <div class="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"></div>
                </div>
                <input v-model="exp.keyResponsibilities[ri]" :class="[F, 'flex-1']"
                  :placeholder="`e.g. Prepared lesson plans and conducted daily classes`" />
                <button @click="removeResponsibility(exp, ri)" class="w-11 h-11 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors">
                  <i class="pi pi-times"></i>
                </button>
              </div>
              <p v-if="exp.keyResponsibilities.length === 0" class="text-xs text-[var(--text-faint)] italic py-2">No responsibilities listed.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ══ TAB 6: L&D / TRAININGS ══════════════════════════════════ -->
      <section v-if="activeTab === 'training'" class="space-y-6 animate-fade-in">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">VII. Learning &amp; Development (Trainings)</h3>
            <p class="text-[10px] text-[var(--text-muted)] mt-1">Include seminars, workshops, conferences, technical trainings, tech-voc certifications, etc.</p>
          </div>
          <button @click="addItem('training')" class="btn-primary h-9 px-5 text-xs font-bold shrink-0">+ Add Training</button>
        </div>
        <div v-if="form.training.length === 0" :class="[SECTION, 'text-center py-10']">
          <i class="pi pi-book text-3xl text-[var(--text-faint)] mb-3 block"></i>
          <p class="text-sm font-bold text-[var(--text-muted)]">No training records yet.</p>
        </div>
        <div v-for="(t, i) in form.training" :key="i" :class="[SECTION, 'relative transition-all hover:border-[var(--color-primary-ring)]']">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center">
                <i class="pi pi-book text-[var(--color-primary)] text-xs"></i>
              </div>
              <div>
                <span class="text-xs font-black text-[var(--text-main)]">{{ t.title || `Training #${i+1}` }}</span>
                <span v-if="t.typeOfLD" class="ml-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[var(--color-primary-light)] text-[var(--color-primary)]">{{ t.typeOfLD }}</span>
              </div>
            </div>
            <button @click="removeItem('training', i)" class="text-red-400 hover:text-red-600 transition-colors">
              <i class="pi pi-trash"></i>
            </button>
          </div>
          <div class="flex flex-col gap-1.5 mb-4">
            <label :class="LABEL">Training / Seminar Title <span class="text-red-400">*</span></label>
            <input v-model="t.title" :class="F" placeholder="e.g. Advanced Training on ICT Integration in DepEd Schools" />
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Date From</label>
              <input v-model="t.periodFrom" type="date" :class="F" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Date To</label>
              <input v-model="t.periodTo" type="date" :class="F" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">No. of Hours <span class="text-red-400">*</span></label>
              <input v-model.number="t.hours" type="number" :class="F" placeholder="e.g. 8" min="0" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label :class="LABEL">Type of L&amp;D</label>
              <select v-model="t.typeOfLD" :class="F">
                <option>Technical</option>
                <option>Managerial</option>
                <option>Supervisory</option>
                <option>Academic</option>
                <option>Foundation</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <label :class="LABEL">Conducted by / Provider / Sponsor</label>
            <input v-model="t.provider" :class="F" placeholder="e.g. DepEd Region VII, CSC, TESDA, State College..." />
          </div>
        </div>
      </section>

      <!-- ══ TAB 7: VOLUNTARY WORK ════════════════════════════════════ -->
      <section v-if="activeTab === 'voluntary'" class="space-y-6 animate-fade-in">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">VI. Voluntary Work / Involvement</h3>
            <p class="text-[10px] text-[var(--text-muted)] mt-1">Include community service, civic organizations, NGOs, and other unpaid contributions.</p>
          </div>
          <button @click="addItem('voluntary')" class="btn-primary h-9 px-5 text-xs font-bold shrink-0">+ Add Entry</button>
        </div>
        <div v-if="form.voluntaryWork.length === 0" :class="[SECTION, 'text-center py-10']">
          <i class="pi pi-heart text-3xl text-[var(--text-faint)] mb-3 block"></i>
          <p class="text-sm font-bold text-[var(--text-muted)]">No voluntary work records.</p>
        </div>
        <div v-for="(v, i) in form.voluntaryWork" :key="i" :class="[SECTION, 'relative transition-all hover:border-[var(--color-primary-ring)]']">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 space-y-3">
              <div class="flex flex-col gap-1.5">
                <label :class="LABEL">Organization / Group Name <span class="text-red-400">*</span></label>
                <input v-model="v.organization" :class="F" placeholder="e.g. Red Cross Chapter, Rotary Club..." />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label :class="LABEL">Position / Nature of Work</label>
                  <input v-model="v.position" :class="F" placeholder="e.g. Volunteer, Coordinator" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label :class="LABEL">Date From</label>
                  <input v-model="v.periodFrom" type="date" :class="F" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label :class="LABEL">Date To</label>
                  <input v-model="v.periodTo" type="date" :class="F" />
                </div>
              </div>
              <div class="flex flex-col gap-1.5 max-w-xs">
                <label :class="LABEL">Number of Hours</label>
                <input v-model.number="v.hours" type="number" :class="F" placeholder="e.g. 120" min="0" />
              </div>
            </div>
            <button @click="removeItem('voluntary', i)" class="text-red-400 hover:text-red-600 transition-colors mt-1 shrink-0">
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>
      </section>

      <!-- ══ TAB 8: OTHERS ═══════════════════════════════════════════ -->
      <section v-if="activeTab === 'others'" class="space-y-6 animate-fade-in">
        <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">VIII. Other Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

          <!-- Special Skills & Hobbies -->
          <div :class="SECTION">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">Special Skills &amp; Hobbies</p>
                <p class="text-[10px] text-[var(--text-muted)] mt-0.5">e.g. Computer Programming, Playing Guitar, Drawing...</p>
              </div>
              <button @click="addItem('skills')" class="text-[10px] font-bold text-[var(--color-primary)] hover:underline uppercase tracking-widest shrink-0">+ Add</button>
            </div>
            <div class="space-y-2">
              <div v-for="(item, i) in form.specialSkills" :key="i" class="flex gap-2 animate-fade-in">
                <input v-model="form.specialSkills[i]" :class="[F, 'flex-1']" placeholder="e.g. Microsoft Excel, Public Speaking..." />
                <button @click="removeItem('skills', i)" class="w-11 h-11 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors">
                  <i class="pi pi-times"></i>
                </button>
              </div>
              <p v-if="form.specialSkills.length === 0" class="text-xs text-[var(--text-faint)] italic py-2">None listed yet.</p>
            </div>
          </div>

          <!-- Non-Academic Distinctions -->
          <div :class="SECTION">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">Non-Academic Distinctions</p>
                <p class="text-[10px] text-[var(--text-muted)] mt-0.5">Awards, recognitions, honors outside academics — e.g. Best Teacher Award, Community Leadership Award...</p>
              </div>
              <button @click="addItem('distinctions')" class="text-[10px] font-bold text-[var(--color-primary)] hover:underline uppercase tracking-widest shrink-0">+ Add</button>
            </div>
            <div class="space-y-2">
              <div v-for="(item, i) in form.nonAcademicDistinctions" :key="i" class="flex gap-2 animate-fade-in">
                <input v-model="form.nonAcademicDistinctions[i]" :class="[F, 'flex-1']" placeholder="e.g. Most Outstanding Teacher, Division Level, 2023" />
                <button @click="removeItem('distinctions', i)" class="w-11 h-11 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors">
                  <i class="pi pi-times"></i>
                </button>
              </div>
              <p v-if="form.nonAcademicDistinctions.length === 0" class="text-xs text-[var(--text-faint)] italic py-2">None listed yet.</p>
            </div>
          </div>

          <!-- Membership in Organizations -->
          <div :class="SECTION">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">Membership in Organizations</p>
                <p class="text-[10px] text-[var(--text-muted)] mt-0.5">Professional organizations, associations, clubs, civic groups — include role and year.</p>
              </div>
              <button @click="addItem('memberships')" class="text-[10px] font-bold text-[var(--color-primary)] hover:underline uppercase tracking-widest shrink-0">+ Add</button>
            </div>
            <div class="space-y-2">
              <div v-for="(item, i) in form.memberships" :key="i" class="flex gap-2 animate-fade-in">
                <input v-model="form.memberships[i]" :class="[F, 'flex-1']" placeholder="e.g. Philippine Association of Classroom Teachers (PACT), Member, 2021" />
                <button @click="removeItem('memberships', i)" class="w-11 h-11 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors">
                  <i class="pi pi-times"></i>
                </button>
              </div>
              <p v-if="form.memberships.length === 0" class="text-xs text-[var(--text-faint)] italic py-2">None listed yet.</p>
            </div>
          </div>

          <!-- Core Competencies -->
          <div :class="SECTION">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">Core Competencies</p>
                <p class="text-[10px] text-[var(--text-muted)] mt-0.5">Professional competencies relevant to the position — used for job matching and evaluation.</p>
              </div>
              <button @click="addItem('competencies')" class="text-[10px] font-bold text-[var(--color-primary)] hover:underline uppercase tracking-widest shrink-0">+ Add</button>
            </div>
            <div class="space-y-2">
              <div v-for="(item, i) in form.competencies" :key="i" class="flex gap-2 animate-fade-in">
                <input v-model="form.competencies[i]" :class="[F, 'flex-1']" placeholder="e.g. Classroom Management, Curriculum Planning, Student Assessment..." />
                <button @click="removeItem('competencies', i)" class="w-11 h-11 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors">
                  <i class="pi pi-times"></i>
                </button>
              </div>
              <p v-if="form.competencies.length === 0" class="text-xs text-[var(--text-faint)] italic py-2">None listed yet.</p>
            </div>
          </div>
        </div>
      </section>

    </div><!-- /v-else -->

    <!-- STICKY SAVE -->
    <div class="fixed bottom-8 right-8 z-40">
      <button @click="saveProfile" :disabled="saving"
        class="group btn-primary px-8 h-14 rounded-2xl shadow-2xl flex items-center gap-3 transition-all hover:scale-[1.05] active:scale-[0.95] disabled:opacity-70">
        <i :class="saving ? 'pi pi-spin pi-spinner' : 'pi pi-save'" class="text-lg"></i>
        <span class="font-black uppercase tracking-widest text-sm">{{ saving ? 'Saving...' : 'Save PDS Profile' }}</span>
      </button>
    </div>

    <!-- REPORT MODAL -->
    <AppTableReport
      v-model="showReport"
      :title="reportTitle"
      subtitle="Personal Data Summary — RSP Portal"
      :columns="reportCols"
      :rows="reportRows"
      :filename="form.name.lastName + '-' + reportTitle" />

    <!-- PDS PREVIEW -->
    <PdsPage
      v-if="showPdsPreview"
      :profile="form"
      @close="showPdsPreview = false" />

  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>
