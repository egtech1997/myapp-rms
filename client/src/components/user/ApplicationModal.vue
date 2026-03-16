<script setup>
import { ref, computed, watch } from 'vue'
import { AppButton, AppInput, AppSelect, AppFileViewer } from '@/components/ui'
import apiClient from '@/api/axios'

defineOptions({ name: 'ApplicationModal' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  job:        { type: Object,  required: true },
  profile:    { type: Object,  default: null },
})

const emit = defineEmits(['update:modelValue', 'submitted'])

// ── Steps ────────────────────────────────────────────────────────────────────
const STEPS = ['details', 'select', 'upload', 'verify', 'review']
const step  = ref('details')
const stepLabel = { details: 'Job Details', select: 'Select Records', upload: 'Documents', verify: 'Verify', review: 'Review & Submit' }
const stepIdx = computed(() => STEPS.indexOf(step.value))

// ── PDS Selection ─────────────────────────────────────────────────────────────
const selEdu  = ref([])
const selElig = ref([])
const selExp  = ref([])
const selTrn  = ref([])
const perfRating        = ref({ score: '', adjective: '', periodCovered: '' })
const perfNotApplicable = ref(false)

// Returns true if a QS field explicitly says "None Required" or is empty/unset
const qsNoneFor = (field) => {
  const val = q.value[field]
  if (!val) return false
  if (Array.isArray(val)) return val.length === 0 || val.every(v => String(v).toLowerCase() === 'none required')
  return String(val).toLowerCase().includes('none required')
}

// ── Submission docs ───────────────────────────────────────────────────────────
const EMPTY_DOCS = () => ({
  pds: null,
  applicationLetter: null, performanceRatingDoc: null, latestAppointment: null,
  workExperienceSheet: null,
  outstandingAccomplishments: [], movs: [], research: null, awards: [], others: [],
})
const docs       = ref(EMPTY_DOCS())
const uploading  = ref({})
const uploadErr  = ref({})

// ── Submission ────────────────────────────────────────────────────────────────
const submitting = ref(false)
const submitError = ref('')

// ── Init on open ──────────────────────────────────────────────────────────────
watch(() => props.modelValue, (open) => {
  if (!open) return
  step.value = 'details'
  submitError.value = ''
  uploading.value = {}
  uploadErr.value = {}
  docs.value = EMPTY_DOCS()
  perfNotApplicable.value = false

  if (props.profile) {
    selEdu.value  = props.profile.education?.map((_, i) => i)  || []
    selElig.value = props.profile.eligibility?.map((_, i) => i) || []
    selExp.value  = props.profile.experience?.map((_, i) => i)  || []
    selTrn.value  = props.profile.training?.map((_, i) => i)    || []
    // Performance rating is per-application, not stored in profile — always start blank
    perfRating.value = { score: '', adjective: '', periodCovered: '' }
  }
})

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const fmtMY = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }) : 'Present'
const daysLeft = (d) => d ? Math.ceil((new Date(d) - new Date()) / 864e5) : null
const deadlineLabel = (d) => {
  const n = daysLeft(d)
  if (n === null) return 'Open'
  if (n < 0)  return 'Closed'
  if (n === 0) return 'Ends Today'
  if (n === 1) return 'Tomorrow'
  if (n <= 7)  return `${n} days left`
  return fmt(d)
}
const deadlineClass = (d) => {
  const n = daysLeft(d)
  if (n === null) return 'text-[var(--text-muted)]'
  if (n < 0)  return 'text-rose-500 font-black'
  if (n <= 7) return 'text-amber-500 font-black'
  return 'text-emerald-600 font-bold'
}

const trackPill  = { teaching: 'bg-blue-50 text-blue-700 border-blue-100', teaching_related: 'bg-purple-50 text-purple-700 border-purple-100', non_teaching: 'bg-amber-50 text-amber-700 border-amber-100' }
const trackLabel = { teaching: 'Teaching', teaching_related: 'Teaching-Related', non_teaching: 'Non-Teaching' }
const q = computed(() => props.job?.qualifications || {})

// ── PDS row definitions ────────────────────────────────────────────────────────
const pdsRows = computed(() => [
  { id: 'edu',  label: 'Education',   icon: 'pi-graduation-cap', qsField: 'education',  val: selEdu,  data: props.profile?.education,
    title: (e) => e.school, sub: (e) => [e.level, e.degree].filter(Boolean).join(' — '),
    period: (e) => e.yearGraduated ? `Grad. ${e.yearGraduated}` : (e.periodFrom ? `${e.periodFrom}–${e.periodTo||'present'}` : ''),
    hasDoc: (e) => !!(e.tor || e.diploma) },
  { id: 'elig', label: 'Eligibility', icon: 'pi-verified',       qsField: 'eligibility', val: selElig, data: props.profile?.eligibility,
    title: (e) => e.type || e.name, sub: (e) => e.name || '',
    period: (e) => e.dateOfExam ? fmt(e.dateOfExam) : '',
    hasDoc: (e) => !!(e.document || e.licenseDocument) },
  { id: 'exp',  label: 'Experience',  icon: 'pi-briefcase',      qsField: 'experience',  val: selExp,  data: props.profile?.experience,
    title: (e) => e.position, sub: (e) => e.company || '',
    period: (e) => `${fmtMY(e.periodFrom)} – ${fmtMY(e.periodTo)}`,
    hasDoc: (e) => !!e.document },
  { id: 'trn',  label: 'Training',    icon: 'pi-book',           qsField: 'trainings',   val: selTrn,  data: props.profile?.training,
    title: (e) => e.title, sub: (e) => [e.typeOfLD, e.provider].filter(Boolean).join(' · '),
    period: (e) => e.hours ? `${e.hours} hrs` : '',
    hasDoc: (e) => !!e.document },
])

const toggleItem = (valRef, i) => {
  const idx = valRef.value.indexOf(i)
  if (idx === -1) valRef.value.push(i)
  else valRef.value.splice(idx, 1)
}
const toggleAll = (row) => {
  const all = row.data?.map((_, i) => i) || []
  row.val.value = row.val.value.length === all.length ? [] : all
}

// ── Document slot definitions per track ───────────────────────────────────────
// Labels and guides are written for ALL applicant types (DepEd, other gov't, private/external).
// DepEd-specific document names are mentioned as examples, not as requirements.

const COMMON_SLOTS = [
  {
    key: 'pds', label: 'Personal Data Sheet (Signed & Notarized)', required: true, isArray: false,
    icon: 'pi-id-card',
    accept: '.pdf',
    guide: 'Your complete and updated Personal Data Sheet, physically signed on every page and notarized by a commissioned Notary Public. PDF format only.',
    example: 'DepEd / Gov\'t employees: CS Form No. 212 (Revised 2017) · Other applicants: equivalent bio-data form signed & notarized',
  },
  {
    key: 'applicationLetter', label: 'Application Letter', required: true, isArray: false,
    icon: 'pi-envelope',
    guide: 'A formal letter expressing your intent to apply for this position, addressed to the Schools Division Superintendent of Guihulngan City. State your name, position applied for, and contact details. Sign and date the letter.',
    example: 'e.g. "Dear SDS, I wish to apply for the position of…"',
  },
  {
    key: 'performanceRatingDoc', label: 'Latest Performance Evaluation Document', required: false, isArray: false,
    icon: 'pi-chart-bar',
    guide: 'Your most recent official performance appraisal covering at least one full rating period within the past year, signed by your supervisor or rating officer.',
    example: 'DepEd employees: IPCRF or RPMS form · Other gov\'t agencies: SPMS/IPCRF equivalent · Private sector: Employer-signed performance review or appraisal letter',
  },
  {
    key: 'latestAppointment', label: 'Proof of Current Employment / Appointment', required: false, isArray: false,
    icon: 'pi-file-edit',
    guide: 'A document showing your current position and employment status. If you are currently employed in government, submit your latest appointment paper. If from the private sector, a Certificate of Employment (COE) from your current employer is acceptable. First-time job seekers may skip this.',
    example: 'DepEd employees: Appointment Order or Notice of Step Increment (NOSI) · Other agencies: Latest appointment paper · Private sector: Certificate of Employment (COE)',
  },
  {
    key: 'workExperienceSheet', label: 'Work Experience Sheet', required: false, isArray: false,
    icon: 'pi-briefcase',
    guide: 'A supplemental document listing all positions held, duties, and duration of service in detail. Should be signed and certified correct by the applicant.',
    example: 'DepEd / Gov\'t employees: CS Form No. 212 Work Experience Sheet (separate sheet) · Private sector: Comprehensive CV or employment history form',
  },
]

const TEACHING_SLOTS = [
  {
    key: 'outstandingAccomplishments', label: 'Outstanding Accomplishments', required: false, isArray: true,
    icon: 'pi-star',
    guide: 'Documents demonstrating your notable contributions as an educator. Upload each accomplishment separately (e.g. one file per innovation, project, or program). You may upload multiple files.',
    example: 'Action Research · Classroom Innovation · Curriculum materials developed · Special project outputs · Recognized programs implemented · Speakership/presentation records · Published work',
  },
  {
    key: 'movs', label: 'Means of Verification (MOVs)', required: false, isArray: true,
    icon: 'pi-paperclip',
    guide: 'Proof that verifies each accomplishment you listed. Upload supporting evidence separately — one file per item. Each MOV must correspond to a specific accomplishment.',
    example: 'Innovation: prototype, documentation, or approval memo · Research/Publication: published paper or approval letter · Speakership: certificate of participation as speaker · Special Project: signed project completion report · Commendation letters · Signed attendance sheets · Photos of events or outputs',
  },
  {
    key: 'research', label: 'Research Work or Publications', required: false, isArray: false,
    icon: 'pi-book',
    guide: 'Any research study, publication, or innovation you have conducted or contributed to that is relevant to teaching. Must have an official approval or publication record.',
    example: 'DepEd employees: Approved Action Research or Classroom Innovation Report · Others: published journal article, thesis, capstone project, or technical paper',
  },
  {
    key: 'awards', label: 'Awards and Recognitions', required: false, isArray: true,
    icon: 'pi-trophy',
    guide: 'Official certificates or documents recognizing exceptional performance, service, or achievement. Upload each award separately.',
    example: 'Best Teacher award · Service recognition · Loyalty award · Academic excellence award · Government agency commendation · Outstanding Employee citation',
  },
]

const TEACHING_RELATED_SLOTS = [
  {
    key: 'outstandingAccomplishments', label: 'Outstanding Accomplishments', required: false, isArray: true,
    icon: 'pi-star',
    guide: 'Documents demonstrating your significant professional contributions relevant to this position. Upload each accomplishment as a separate file.',
    example: 'Special projects led · Programs implemented · Reports or outputs produced · Innovations or improvements introduced · Speakership or presentations · Published work',
  },
  {
    key: 'movs', label: 'Means of Verification (MOVs)', required: false, isArray: true,
    icon: 'pi-paperclip',
    guide: 'Proof that verifies each accomplishment you listed. Upload each MOV separately — one file per item.',
    example: 'Innovation: documentation or approval memo · Research: published paper or approval letter · Speakership: certificate as speaker · Project: signed completion report · Commendation letters · Program documentation',
  },
  {
    key: 'research', label: 'Research, Reports, or Publications', required: false, isArray: false,
    icon: 'pi-book',
    guide: 'Any formal research, technical report, or publication relevant to this position.',
    example: 'Research studies · Technical or feasibility reports · Published articles · Special project outputs',
  },
  {
    key: 'awards', label: 'Awards and Recognitions', required: false, isArray: true,
    icon: 'pi-trophy',
    guide: 'Official recognition of outstanding performance or service. Upload each award separately.',
    example: 'Government agency awards · Professional organization recognitions · Academic commendations · Outstanding Employee citation',
  },
]

const NON_TEACHING_SLOTS = [
  {
    key: 'outstandingAccomplishments', label: 'Outstanding Accomplishments', required: false, isArray: true,
    icon: 'pi-star',
    guide: 'Documents demonstrating your key work outputs and contributions relevant to this position. Upload each accomplishment as a separate file.',
    example: 'Special projects completed · Systems/processes improved · Programs implemented · Reports produced · Innovations introduced',
  },
  {
    key: 'movs', label: 'Means of Verification (MOVs)', required: false, isArray: true,
    icon: 'pi-paperclip',
    guide: 'Proof that verifies each accomplishment you listed. Upload each MOV separately — one file per item.',
    example: 'Signed project completion reports · Approval memos · Commendation letters · Published outputs · Program documentation · Work outputs with supervisor signature',
  },
  {
    key: 'awards', label: 'Awards and Recognitions', required: false, isArray: true,
    icon: 'pi-trophy',
    guide: 'Official recognition from a government agency or recognized organization. Upload each award separately.',
    example: 'Government agency commendations · Professional recognitions · Academic or service awards · Outstanding Employee citation',
  },
]

const findSlot = (key) => COMMON_SLOTS.find(s => s.key === key)
  || TEACHING_SLOTS.find(s => s.key === key)
  || TEACHING_RELATED_SLOTS.find(s => s.key === key)
  || NON_TEACHING_SLOTS.find(s => s.key === key)

const docSlots = computed(() => {
  const t = props.job?.hiringTrack
  const extra = t === 'teaching' ? TEACHING_SLOTS : t === 'teaching_related' ? TEACHING_RELATED_SLOTS : NON_TEACHING_SLOTS
  return [...COMMON_SLOTS, ...extra]
})

// Only PDS + Application Letter are unconditionally required
const requiredSlots = computed(() => docSlots.value.filter(s => s.required))
// Performance doc gets its own dedicated section — exclude from both lists
const optionalSlots = computed(() => docSlots.value.filter(s => !s.required && s.key !== 'performanceRatingDoc'))
const perfSlot      = computed(() => docSlots.value.find(s => s.key === 'performanceRatingDoc'))

// ── File upload handler ───────────────────────────────────────────────────────
const uploadDoc = async (slot, file, append = false) => {
  if (!file || !props.job) return
  const key = slot.key
  uploading.value = { ...uploading.value, [key]: true }
  uploadErr.value  = { ...uploadErr.value,  [key]: '' }

  const fd = new FormData()
  fd.append('jobId', props.job._id)  // MUST be before file
  fd.append('file', file)

  try {
    const { data } = await apiClient.post('/v1/applications/upload-doc', fd)
    const entry = { fileUrl: data.fileUrl, fileName: data.fileName }
    if (slot.isArray && append) {
      docs.value[key] = [...(docs.value[key] || []), entry]
    } else {
      docs.value[key] = entry
    }
  } catch (e) {
    uploadErr.value = { ...uploadErr.value, [key]: e.response?.data?.message || 'Upload failed' }
  } finally {
    uploading.value = { ...uploading.value, [key]: false }
  }
}

// ── File viewer ───────────────────────────────────────────────────────────────
const viewerVisible = ref(false)
const viewerUrl     = ref('')
const viewerTitle   = ref('Document Preview')

const viewDoc = (fileUrl, title = 'Document Preview') => {
  if (!fileUrl) return
  viewerUrl.value   = fileUrl
  viewerTitle.value = title
  viewerVisible.value = true
}

// Returns the actual selected record objects for a pdsRow
const getSelectedItems = (row) =>
  row.val.value.map(i => row.data?.[i]).filter(Boolean)

// Returns document entries { label, url } for a selected profile record
const getRecordDocs = (rowId, item) => {
  if (rowId === 'edu') {
    const d = []
    if (item.tor)     d.push({ label: 'Transcript of Records (TOR)', url: item.tor })
    if (item.diploma) d.push({ label: 'Diploma', url: item.diploma })
    return d
  }
  if (rowId === 'elig') {
    const d = []
    if (item.document)        d.push({ label: 'Eligibility Certificate', url: item.document })
    if (item.licenseDocument) d.push({ label: 'License / ID', url: item.licenseDocument })
    return d
  }
  if (rowId === 'exp') {
    return item.document ? [{ label: 'COE / Appointment Paper', url: item.document }] : []
  }
  if (rowId === 'trn') {
    return item.document ? [{ label: 'Training Certificate', url: item.document }] : []
  }
  return []
}

const removeDoc = (key, idx = null) => {
  if (idx !== null) {
    const arr = [...(docs.value[key] || [])]
    arr.splice(idx, 1)
    docs.value[key] = arr
  } else {
    docs.value[key] = null
  }
}

const docVal = (slot) => docs.value[slot.key]
const docUploaded = (slot) => {
  const v = docVal(slot)
  return slot.isArray ? (Array.isArray(v) && v.length > 0) : !!v
}

// ── Review checklist ──────────────────────────────────────────────────────────
// perfRatingFilled: all three rating fields must be completed when doc is uploaded
const perfRatingFilled = computed(() =>
  !!(perfRating.value.score && perfRating.value.adjective && perfRating.value.periodCovered)
)

// perfDocOk:
//   N/A checked → always ok
//   N/A not checked + doc uploaded → rating details must also be filled
//   N/A not checked + no doc → NOT ok (performance doc is required unless N/A)
const perfDocOk = computed(() => {
  if (perfNotApplicable.value) return true
  if (!docs.value.performanceRatingDoc) return false
  return perfRatingFilled.value
})

const canSubmit = computed(() =>
  requiredSlots.value.every(s => docUploaded(s)) && perfDocOk.value
)

// ── Submit ────────────────────────────────────────────────────────────────────
const handleApply = async () => {
  submitting.value = true
  submitError.value = ''
  try {
    await apiClient.post('/v1/applications/apply', {
      jobId:    props.job._id,
      category: props.job.hiringTrack,
      applicantData: {
        education:         selEdu.value.map(i  => props.profile?.education?.[i]).filter(Boolean),
        eligibility:       selElig.value.map(i => props.profile?.eligibility?.[i]).filter(Boolean),
        experience:        selExp.value.map(i  => props.profile?.experience?.[i]).filter(Boolean),
        training:          selTrn.value.map(i  => props.profile?.training?.[i]).filter(Boolean),
        performanceRating: perfNotApplicable.value
          ? { notApplicable: true }
          : { ...perfRating.value },
      },
      submissionDocs: docs.value,
    })
    step.value = 'success'
    emit('submitted')
  } catch (e) {
    submitError.value = e.response?.data?.message || 'Submission failed. Please try again.'
  } finally {
    submitting.value = false
  }
}

const closeModal = () => {
  emit('update:modelValue', false)
  setTimeout(() => { step.value = 'details' }, 300)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue"
      class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
      @click.self="closeModal">
      <div class="absolute inset-0 bg-[var(--color-navy)]/60 backdrop-blur-sm animate-fade-in"></div>

      <div class="relative bg-[var(--surface)] border border-[var(--border-main)] rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-zoom-in max-h-[96vh] sm:max-h-[92vh]">

        <!-- ── Persistent header ─────────────────────────────────────────── -->
        <div class="px-6 sm:px-8 pt-5 pb-4 border-b border-[var(--border-main)] shrink-0"
          style="background:linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 5%, white) 0%, white 65%)">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex-1 min-w-0 pr-2">
              <div class="flex items-center gap-2 mb-1">
                <span :class="['text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider shrink-0', trackPill[job.hiringTrack] || trackPill.non_teaching]">
                  {{ trackLabel[job.hiringTrack] || job.hiringTrack }}
                </span>
              </div>
              <h2 class="text-base font-black text-[var(--text-main)] uppercase tracking-tight leading-tight">{{ job.positionTitle }}</h2>
              <p class="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
                <i class="pi pi-map-marker text-[10px] text-[var(--color-primary)]"></i>
                {{ Array.isArray(job.placeOfAssignment) ? job.placeOfAssignment.join(', ') : (job.placeOfAssignment || 'Schools Division') }}
              </p>
            </div>
            <button @click="closeModal"
              class="w-8 h-8 rounded-xl border border-[var(--border-main)] bg-[var(--surface)] flex items-center justify-center text-[var(--text-faint)] hover:text-rose-500 transition-all shrink-0">
              <i class="pi pi-times text-xs"></i>
            </button>
          </div>

          <!-- Step indicator -->
          <div v-if="step !== 'success'" class="flex items-center gap-1.5">
            <template v-for="(s, idx) in STEPS" :key="s">
              <div class="flex items-center gap-1.5 shrink-0">
                <div :class="['w-5 h-5 rounded-full text-[8px] font-black flex items-center justify-center transition-all shrink-0',
                  stepIdx > idx  ? 'bg-emerald-500 text-white'
                  : stepIdx === idx ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--bg-app)] text-[var(--text-faint)] border border-[var(--border-main)]']">
                  <i v-if="stepIdx > idx" class="pi pi-check" style="font-size:7px"></i>
                  <span v-else>{{ idx + 1 }}</span>
                </div>
                <span :class="['text-[9px] font-bold whitespace-nowrap hidden sm:block',
                  stepIdx === idx ? 'text-[var(--color-primary)]' : 'text-[var(--text-faint)]']">
                  {{ stepLabel[s] }}
                </span>
              </div>
              <div v-if="idx < STEPS.length - 1" class="flex-1 h-px bg-[var(--border-main)] min-w-[12px]"></div>
            </template>
          </div>
        </div>

        <!-- ══ STEP 1: JOB DETAILS ══════════════════════════════════════════ -->
        <template v-if="step === 'details'">
          <div class="overflow-y-auto custom-scrollbar flex-1 px-6 sm:px-8 py-6 space-y-5">

            <!-- Key stats -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div v-for="s in [
                { icon:'pi-wallet',   label:'Monthly Salary', val:`₱${Number(job.salary||0).toLocaleString()}`, hi:true },
                { icon:'pi-star',     label:'Salary Grade',   val:`SG-${job.salaryGrade||'—'}` },
                { icon:'pi-users',    label:'Open Slots',     val:job.hideVacancyCount ? 'See Posting' : `${job.noOfVacancy||1} slot${(job.noOfVacancy||1)>1?'s':''}` },
                { icon:'pi-calendar', label:'Deadline',       val:deadlineLabel(job.deadline), cls:deadlineClass(job.deadline) },
              ]" :key="s.label"
                class="p-3 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex flex-col gap-1">
                <div class="flex items-center gap-1.5">
                  <i :class="['pi text-[10px] text-[var(--text-faint)]', s.icon]"></i>
                  <p class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest">{{ s.label }}</p>
                </div>
                <p :class="['text-xs font-black', s.cls || (s.hi ? 'text-[var(--color-primary)]' : 'text-[var(--text-main)]')]">{{ s.val }}</p>
              </div>
            </div>

            <!-- Qualification Standards -->
            <div class="rounded-2xl border border-[var(--border-main)] overflow-hidden">
              <div class="px-4 py-3 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
                  <i class="pi pi-list-check text-[10px] text-[var(--color-primary)]"></i>
                </div>
                <h3 class="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">Qualification Standards (QS)</h3>
                <span class="text-[9px] text-[var(--text-faint)] ml-auto hidden sm:block">DO 007, s. 2023</span>
              </div>
              <div class="divide-y divide-[var(--border-main)]">
                <div v-for="row in [
                  { icon:'pi-graduation-cap', label:'Education',   val: q.education || 'Not specified' },
                  { icon:'pi-briefcase',      label:'Experience',  val: q.experience || (q.minExperienceMonths ? `${q.minExperienceMonths} months` : 'Not specified') },
                  { icon:'pi-book',           label:'Training',    val: q.trainings  || (q.minTrainingHours   ? `${q.minTrainingHours} hours`   : 'Not specified') },
                  { icon:'pi-verified',       label:'Eligibility', val: (Array.isArray(q.eligibility) ? q.eligibility.join(', ') : q.eligibility) || 'None Required' },
                ]" :key="row.label" class="flex gap-3 px-4 py-3 bg-[var(--surface)]">
                  <div class="w-6 h-6 rounded-md bg-[var(--bg-app)] flex items-center justify-center shrink-0 mt-0.5">
                    <i :class="['pi text-[10px] text-[var(--color-primary)]', row.icon]"></i>
                  </div>
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-0.5">{{ row.label }}</p>
                    <p class="text-xs font-medium text-[var(--text-main)] leading-snug">{{ row.val }}</p>
                  </div>
                </div>
                <div v-if="q.competencyRequirements?.length" class="flex gap-3 px-4 py-3 bg-[var(--surface)]">
                  <div class="w-6 h-6 rounded-md bg-[var(--bg-app)] flex items-center justify-center shrink-0 mt-0.5">
                    <i class="pi pi-bolt text-[10px] text-[var(--color-primary)]"></i>
                  </div>
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-1.5">Competencies</p>
                    <div class="flex flex-wrap gap-1.5">
                      <span v-for="c in q.competencyRequirements" :key="c"
                        class="px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[10px] font-bold">{{ c }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div v-if="job.description" class="flex gap-3 px-4 py-4 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)]">
              <i class="pi pi-align-left text-[10px] text-[var(--text-faint)] mt-0.5 shrink-0"></i>
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-1">Position Description</p>
                <p class="text-xs text-[var(--text-sub)] leading-relaxed">{{ job.description }}</p>
              </div>
            </div>

            <!-- What you need to prepare -->
            <div class="rounded-2xl border border-[var(--color-primary)]/20 overflow-hidden">
              <div class="px-4 py-3 bg-[var(--color-primary-light)] flex items-center gap-2.5">
                <i class="pi pi-lightbulb text-[var(--color-primary)] shrink-0"></i>
                <p class="text-xs font-bold text-[var(--color-primary)]">What you need to prepare</p>
              </div>
              <div class="px-4 py-3 bg-[var(--surface)] space-y-2">
                <div v-for="item in [
                  { icon: 'pi-envelope',   text: 'Application Letter addressed to the Schools Division Superintendent' },
                  { icon: 'pi-id-card',    text: 'Signed and notarized Personal Data Sheet (CS Form 212)' },
                  { icon: 'pi-chart-bar',  text: 'Latest Performance Evaluation (IPCRF/RPMS) — or mark N/A if fresh grad, unemployed, or JO/COS applicant' },
                  { icon: 'pi-graduation-cap', text: 'Transcript of Records (TOR) and/or Diploma from your profile' },
                  { icon: 'pi-verified',   text: 'Eligibility / License certificate from your profile' },
                  { icon: 'pi-briefcase',  text: 'COE or Appointment Paper from your work experience records' },
                  { icon: 'pi-book',       text: 'Training certificates from your training records' },
                ]" :key="item.text" class="flex items-start gap-2.5">
                  <div class="w-5 h-5 rounded-md bg-[var(--color-primary-light)] flex items-center justify-center shrink-0 mt-0.5">
                    <i :class="['pi text-[9px] text-[var(--color-primary)]', item.icon]"></i>
                  </div>
                  <p class="text-xs text-[var(--text-sub)] leading-snug">{{ item.text }}</p>
                </div>
              </div>
            </div>

            <!-- Upload rules -->
            <div class="rounded-2xl border border-[var(--border-main)] overflow-hidden">
              <div class="px-4 py-3 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center gap-2.5">
                <i class="pi pi-upload text-[var(--text-muted)] shrink-0" style="font-size:11px"></i>
                <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">Document Upload Rules</p>
              </div>

              <!-- PDF rule -->
              <div class="px-4 py-3 bg-[var(--surface)] border-b border-[var(--border-main)] flex items-start gap-3">
                <div class="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                  <i class="pi pi-file-pdf text-rose-500" style="font-size:14px"></i>
                </div>
                <div>
                  <p class="text-xs font-black text-[var(--text-main)] mb-0.5">Multi-page documents → PDF required</p>
                  <p class="text-xs text-[var(--text-sub)] leading-relaxed">
                    If your document has <strong>more than one page</strong> (e.g. TOR, PDS, IPCRF), you must combine all pages into a <strong>single PDF file</strong> before uploading. Do not upload separate images per page.
                  </p>
                </div>
              </div>

              <!-- Image rule -->
              <div class="px-4 py-3 bg-[var(--surface)] border-b border-[var(--border-main)] flex items-start gap-3">
                <div class="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0 mt-0.5">
                  <i class="pi pi-image text-sky-500" style="font-size:14px"></i>
                </div>
                <div>
                  <p class="text-xs font-black text-[var(--text-main)] mb-0.5">Single-page documents → image accepted</p>
                  <p class="text-xs text-[var(--text-sub)] leading-relaxed">
                    If your document fits on <strong>one page</strong> (e.g. a single certificate, medal photo, award), uploading a clear <strong>JPG or PNG photo</strong> is fine. Make sure the entire document is visible with no cut edges.
                  </p>
                </div>
              </div>

              <!-- Quality rule -->
              <div class="px-4 py-3 bg-[var(--surface)] border-b border-[var(--border-main)] flex items-start gap-3">
                <div class="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                  <i class="pi pi-eye text-emerald-500" style="font-size:14px"></i>
                </div>
                <div>
                  <p class="text-xs font-black text-[var(--text-main)] mb-0.5">All text, signatures &amp; stamps must be readable</p>
                  <p class="text-xs text-[var(--text-sub)] leading-relaxed">
                    Lay the document flat on a well-lit surface. Avoid shadows, glare, and folded corners. Blurry or unreadable documents will be <strong>rejected during verification</strong>.
                  </p>
                </div>
              </div>

              <!-- Scanner tip -->
              <div class="px-4 py-3 bg-amber-50 flex items-start gap-3">
                <div class="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                  <i class="pi pi-mobile text-amber-600" style="font-size:14px"></i>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-black text-amber-800 mb-1">No scanner? Use your phone</p>
                  <p class="text-xs text-amber-700 leading-relaxed mb-2">
                    Free scanner apps automatically straighten and convert your photo into a clean PDF.
                  </p>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <div v-for="app in [
                      { name: 'Adobe Scan',     note: 'iOS & Android' },
                      { name: 'Microsoft Lens', note: 'iOS & Android' },
                      { name: 'Google Drive',   note: 'Android built-in' },
                      { name: 'CamScanner',     note: 'iOS & Android' },
                    ]" :key="app.name"
                      class="px-2.5 py-1.5 rounded-lg bg-white border border-amber-200">
                      <p class="text-[10px] font-bold text-[var(--text-main)]">{{ app.name }}</p>
                      <p class="text-[9px] text-[var(--text-faint)]">{{ app.note }}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div class="px-6 sm:px-8 py-4 border-t border-[var(--border-main)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
            <AppButton variant="secondary" @click="closeModal">Close</AppButton>
            <AppButton @click="step = 'select'" iconRight="pi-arrow-right">Select Profile Records</AppButton>
          </div>
        </template>

        <!-- ══ STEP 2: SELECT PDS + PERFORMANCE RATING ═════════════════════ -->
        <template v-else-if="step === 'select'">
          <div class="overflow-y-auto custom-scrollbar flex-1 px-6 sm:px-8 py-6 space-y-5">

            <!-- Profile Record Sections -->
            <div class="space-y-3">
              <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] flex items-center gap-2">
                <i class="pi pi-id-card text-xs text-[var(--color-primary)]"></i> Select Profile Records to Attach
                <span class="text-[9px] italic text-[var(--text-faint)] font-normal normal-case tracking-normal ml-auto hidden sm:block">Click rows to check/uncheck</span>
              </p>

              <div v-for="row in pdsRows" :key="row.id"
                class="border rounded-2xl overflow-hidden"
                :class="qsNoneFor(row.qsField) ? 'border-[var(--border-main)] opacity-70' : 'border-[var(--border-main)]'">
                <div class="px-4 py-3 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] flex items-center justify-center shrink-0">
                      <i :class="['pi text-[10px]', row.icon, qsNoneFor(row.qsField) ? 'text-[var(--text-faint)]' : 'text-[var(--text-muted)]']"></i>
                    </div>
                    <div>
                      <p class="text-xs font-bold text-[var(--text-main)] flex items-center gap-2">
                        {{ row.label }}
                        <span v-if="qsNoneFor(row.qsField)"
                          class="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Not Required
                        </span>
                      </p>
                      <p class="text-[10px] text-[var(--text-faint)]">{{ row.val.value.length }} of {{ row.data?.length || 0 }} selected</p>
                    </div>
                  </div>
                  <button v-if="row.data?.length" @click="toggleAll(row)" class="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)] hover:underline shrink-0 px-1">
                    {{ row.val.value.length === row.data.length ? 'None' : 'All' }}
                  </button>
                </div>
                <div class="bg-[var(--surface)]">
                  <div v-if="!row.data?.length" class="px-4 py-4 text-center">
                    <template v-if="qsNoneFor(row.qsField)">
                      <p class="text-[10px] text-emerald-600 font-bold">This position does not require {{ row.label.toLowerCase() }}.</p>
                      <p class="text-[10px] text-[var(--text-faint)] mt-0.5 italic">You may still add records in your profile to strengthen your application.</p>
                    </template>
                    <template v-else>
                      <p class="text-[10px] text-[var(--text-faint)] italic">No {{ row.label.toLowerCase() }} records in your profile yet.</p>
                      <router-link to="/user/profile" class="text-[10px] font-black text-[var(--color-primary)] hover:underline">Add in Profile →</router-link>
                    </template>
                  </div>
                  <div v-else class="divide-y divide-[var(--border-main)]">
                    <div v-for="(item, i) in row.data" :key="i"
                      @click="toggleItem(row.val, i)"
                      class="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-app)] transition-colors cursor-pointer">
                      <div :class="['w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all',
                        row.val.value.includes(i) ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'bg-[var(--surface)] border-[var(--border-main)]']">
                        <i v-if="row.val.value.includes(i)" class="pi pi-check text-white" style="font-size:9px"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-[var(--text-main)] truncate">{{ row.title(item) || '—' }}</p>
                        <p class="text-[10px] text-[var(--text-faint)] truncate">{{ row.sub(item) }}<span v-if="row.period(item)" class="ml-2 opacity-60">· {{ row.period(item) }}</span></p>
                      </div>
                      <span :class="['flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 border',
                        row.hasDoc(item) ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-[var(--bg-app)] border-[var(--border-main)] text-[var(--text-faint)]']">
                        <i :class="['pi', row.hasDoc(item) ? 'pi-paperclip' : 'pi-upload']" style="font-size:8px"></i>
                        {{ row.hasDoc(item) ? 'Doc' : 'No doc' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="px-6 sm:px-8 py-4 border-t border-[var(--border-main)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
            <AppButton variant="secondary" @click="step = 'details'"><i class="pi pi-arrow-left text-[10px] mr-1"></i> Back</AppButton>
            <AppButton @click="step = 'upload'" iconRight="pi-arrow-right">Upload Documents</AppButton>
          </div>
        </template>

        <!-- ══ STEP 3: DOCUMENT UPLOAD ══════════════════════════════════════ -->
        <template v-else-if="step === 'upload'">
          <div class="overflow-y-auto custom-scrollbar flex-1 px-6 sm:px-8 py-6 space-y-4">

            <!-- Required Documents -->
            <div class="space-y-1">
              <p class="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-1.5 pb-1">
                <i class="pi pi-asterisk" style="font-size:8px"></i> Required Documents
              </p>

              <template v-for="slot in requiredSlots" :key="slot.key">
                <div class="rounded-2xl border overflow-hidden transition-all"
                  :class="!docUploaded(slot) ? 'border-rose-200' : 'border-emerald-200'">
                  <!-- Slot header -->
                  <div class="px-4 py-3 flex items-start gap-3 border-b"
                    :class="!docUploaded(slot) ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'">
                    <div :class="['w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                      docUploaded(slot) ? 'bg-emerald-100' : 'bg-rose-100']">
                      <i :class="['pi text-[10px]', slot.icon,
                        docUploaded(slot) ? 'text-emerald-600' : 'text-rose-500']"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <p class="text-xs font-bold text-[var(--text-main)]">{{ slot.label }}</p>
                        <span v-if="docUploaded(slot)" class="ml-auto text-[9px] font-black text-emerald-600 flex items-center gap-1 shrink-0">
                          <i class="pi pi-check-circle" style="font-size:9px"></i> Uploaded
                        </span>
                      </div>
                      <p class="text-[10px] text-[var(--text-faint)] mt-0.5 leading-snug">{{ slot.guide }}</p>
                      <p v-if="slot.example" class="text-[10px] text-[var(--text-muted)] mt-1 leading-snug italic border-l-2 border-[var(--border-main)] pl-2">
                        <span class="not-italic font-bold text-[var(--text-faint)]">e.g. </span>{{ slot.example }}
                      </p>
                    </div>
                  </div>
                  <!-- Upload area -->
                  <div class="px-4 py-3 bg-[var(--surface)]">
                    <template v-if="slot.isArray">
                      <div v-if="(docs[slot.key] || []).length" class="flex flex-col gap-1.5 mb-2">
                        <div v-for="(f, idx) in docs[slot.key]" :key="idx"
                          class="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)]">
                          <i :class="['pi text-xs shrink-0', f.fileName?.endsWith('.pdf') ? 'pi-file-pdf text-[var(--color-primary)]' : 'pi-image text-emerald-500']"></i>
                          <p class="text-xs text-[var(--text-main)] flex-1 truncate font-medium">{{ f.fileName }}</p>
                          <button @click="removeDoc(slot.key, idx)" class="text-[10px] text-rose-500 font-bold hover:underline shrink-0">Remove</button>
                        </div>
                      </div>
                      <label :class="['flex items-center gap-2 h-9 px-3 rounded-xl cursor-pointer border transition-all w-fit text-xs font-bold',
                        uploading[slot.key] ? 'border-[var(--border-main)] text-[var(--text-faint)] cursor-wait'
                          : 'border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]']">
                        <i :class="['pi text-[10px]', uploading[slot.key] ? 'pi-spin pi-spinner' : 'pi-plus']"></i>
                        {{ uploading[slot.key] ? 'Uploading…' : 'Add file' }}
                        <input type="file" class="hidden" :accept="slot.accept || '.pdf,image/*'" :disabled="!!uploading[slot.key]"
                          @change="e => uploadDoc(slot, e.target.files[0], true)" />
                      </label>
                    </template>
                    <template v-else>
                      <div v-if="docs[slot.key]" class="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--bg-app)] border border-emerald-200">
                        <i :class="['pi text-xs shrink-0', docs[slot.key].fileName?.endsWith('.pdf') ? 'pi-file-pdf text-[var(--color-primary)]' : 'pi-image text-emerald-500']"></i>
                        <p class="text-xs text-[var(--text-main)] flex-1 truncate font-medium">{{ docs[slot.key].fileName }}</p>
                        <label class="text-[10px] font-bold text-[var(--color-primary)] hover:underline cursor-pointer shrink-0">
                          Replace
                          <input type="file" class="hidden" :accept="slot.accept || '.pdf,image/*'" :disabled="!!uploading[slot.key]"
                            @change="e => uploadDoc(slot, e.target.files[0])" />
                        </label>
                        <button @click="removeDoc(slot.key)" class="text-[10px] text-rose-500 font-bold hover:underline shrink-0">Remove</button>
                      </div>
                      <label v-else :class="['flex items-center gap-2 h-9 px-3 rounded-xl cursor-pointer border transition-all w-fit text-xs font-bold',
                        uploading[slot.key] ? 'border-[var(--border-main)] text-[var(--text-faint)] cursor-wait'
                          : 'border-rose-300 text-rose-500 hover:bg-rose-50']">
                        <i :class="['pi text-[10px]', uploading[slot.key] ? 'pi-spin pi-spinner' : 'pi-upload']"></i>
                        {{ uploading[slot.key] ? 'Uploading…' : 'Choose file' }}
                        <input type="file" class="hidden" :accept="slot.accept || '.pdf,image/*'" :disabled="!!uploading[slot.key]"
                          @change="e => uploadDoc(slot, e.target.files[0])" />
                      </label>
                    </template>
                    <p v-if="uploadErr[slot.key]" class="text-[10px] text-rose-500 mt-1.5 flex items-center gap-1">
                      <i class="pi pi-exclamation-circle" style="font-size:9px"></i> {{ uploadErr[slot.key] }}
                    </p>

                    <!-- Performance rating details — shown inline after doc upload -->
                    <template v-if="slot.key === 'performanceRatingDoc' && docs.performanceRatingDoc">
                      <div class="mt-3 pt-3 border-t border-[var(--border-main)]">
                        <p class="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600 mb-2.5 flex items-center gap-1.5">
                          <i class="pi pi-star" style="font-size:8px"></i> Fill in rating details from the document
                        </p>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <AppInput
                            v-model="perfRating.score"
                            label="Rating Score"
                            type="number"
                            size="sm"
                            placeholder="e.g. 4.85"
                            hint="Scale 1.00–5.00"
                          />
                          <AppSelect
                            v-model="perfRating.adjective"
                            label="Adjectival Rating"
                            size="sm"
                            placeholder="Select…"
                            :options="['Outstanding','Very Satisfactory','Satisfactory','Unsatisfactory','Poor']"
                          />
                          <AppInput
                            v-model="perfRating.periodCovered"
                            label="Period Covered"
                            size="sm"
                            placeholder="e.g. Jan 2024 – Dec 2024"
                            hint="Must span at least 1 year"
                          />
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </template>
            </div>

            <!-- Performance Rating — Dedicated Section with N/A toggle -->
            <div class="rounded-2xl border overflow-hidden transition-all"
              :class="perfNotApplicable ? 'border-slate-200' : perfDocOk ? 'border-emerald-200' : 'border-amber-300'">
              <!-- Header -->
              <div class="px-4 py-3 flex items-start gap-3 border-b"
                :class="perfNotApplicable ? 'bg-slate-50 border-slate-200' : perfDocOk ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'">
                <div :class="['w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                  perfNotApplicable ? 'bg-slate-200' : perfDocOk ? 'bg-emerald-100' : 'bg-amber-100']">
                  <i :class="['pi pi-chart-bar text-[10px]',
                    perfNotApplicable ? 'text-slate-400' : perfDocOk ? 'text-emerald-600' : 'text-amber-600']"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="text-xs font-bold text-[var(--text-main)]">Performance Evaluation Document</p>
                    <span v-if="perfNotApplicable" class="text-[9px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full">N/A</span>
                    <span v-else-if="perfDocOk" class="ml-auto text-[9px] font-black text-emerald-600 flex items-center gap-1 shrink-0">
                      <i class="pi pi-check-circle" style="font-size:9px"></i> Ready
                    </span>
                    <span v-else class="text-[9px] font-black text-amber-600 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full">Required</span>
                  </div>
                  <p class="text-[10px] text-[var(--text-faint)] mt-0.5 leading-snug">{{ perfSlot?.guide }}</p>
                  <p v-if="perfSlot?.example" class="text-[10px] text-[var(--text-muted)] mt-1 leading-snug italic border-l-2 border-[var(--border-main)] pl-2">
                    <span class="not-italic font-bold text-[var(--text-faint)]">e.g. </span>{{ perfSlot.example }}
                  </p>
                </div>
              </div>

              <!-- N/A Toggle -->
              <div class="px-4 py-3 bg-[var(--surface)] border-b border-[var(--border-main)]">
                <label class="flex items-start gap-3 cursor-pointer group">
                  <div class="mt-0.5 shrink-0">
                    <div @click="perfNotApplicable = !perfNotApplicable"
                      :class="['w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                        perfNotApplicable ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'bg-white border-[var(--border-main)] group-hover:border-[var(--color-primary)]']">
                      <i v-if="perfNotApplicable" class="pi pi-check text-white" style="font-size:9px"></i>
                    </div>
                  </div>
                  <div>
                    <p class="text-xs font-bold text-[var(--text-main)]">Not Applicable — I do not have a performance evaluation</p>
                    <p class="text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug">
                      Check this if you are a <strong>fresh graduate</strong>, currently <strong>unemployed</strong>, or applying for a
                      <strong>Job Order (JO) / Contract of Service (COS)</strong> position where no formal performance appraisal exists.
                      HR will note this during document verification.
                    </p>
                  </div>
                </label>
              </div>

              <!-- Upload area (hidden when N/A) -->
              <div v-if="!perfNotApplicable" class="px-4 py-3 bg-[var(--surface)]">
                <div v-if="docs.performanceRatingDoc" class="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--bg-app)] border border-emerald-200 mb-3">
                  <i :class="['pi text-xs shrink-0', docs.performanceRatingDoc.fileName?.endsWith('.pdf') ? 'pi-file-pdf text-[var(--color-primary)]' : 'pi-image text-emerald-500']"></i>
                  <p class="text-xs text-[var(--text-main)] flex-1 truncate font-medium">{{ docs.performanceRatingDoc.fileName }}</p>
                  <label class="text-[10px] font-bold text-[var(--color-primary)] hover:underline cursor-pointer shrink-0">
                    Replace
                    <input type="file" class="hidden" accept=".pdf,image/*" @change="e => uploadDoc(perfSlot, e.target.files[0])" />
                  </label>
                  <button @click="removeDoc('performanceRatingDoc')" class="text-[10px] text-rose-500 font-bold hover:underline shrink-0">Remove</button>
                </div>
                <label v-else :class="['flex items-center gap-2 h-9 px-3 rounded-xl cursor-pointer border transition-all w-fit text-xs font-bold',
                  uploading.performanceRatingDoc ? 'border-[var(--border-main)] text-[var(--text-faint)] cursor-wait'
                    : 'border-amber-300 text-amber-600 hover:bg-amber-50']">
                  <i :class="['pi text-[10px]', uploading.performanceRatingDoc ? 'pi-spin pi-spinner' : 'pi-upload']"></i>
                  {{ uploading.performanceRatingDoc ? 'Uploading…' : 'Choose file' }}
                  <input type="file" class="hidden" accept=".pdf,image/*" :disabled="!!uploading.performanceRatingDoc"
                    @change="e => uploadDoc(perfSlot, e.target.files[0])" />
                </label>
                <p v-if="uploadErr.performanceRatingDoc" class="text-[10px] text-rose-500 mt-1.5 flex items-center gap-1">
                  <i class="pi pi-exclamation-circle" style="font-size:9px"></i> {{ uploadErr.performanceRatingDoc }}
                </p>
                <!-- Rating details inline -->
                <template v-if="docs.performanceRatingDoc">
                  <div class="mt-3 pt-3 border-t border-[var(--border-main)]">
                    <p class="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600 mb-2.5 flex items-center gap-1.5">
                      <i class="pi pi-star" style="font-size:8px"></i> Fill in rating details from the document
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <AppInput v-model="perfRating.score" label="Rating Score" type="number" size="sm" placeholder="e.g. 4.85" hint="Scale 1.00–5.00" />
                      <AppSelect v-model="perfRating.adjective" label="Adjectival Rating" size="sm" placeholder="Select…"
                        :options="['Outstanding','Very Satisfactory','Satisfactory','Unsatisfactory','Poor']" />
                      <AppInput v-model="perfRating.periodCovered" label="Period Covered" size="sm" placeholder="e.g. Jan 2024 – Dec 2024" hint="Must span at least 1 year" />
                    </div>
                    <p v-if="docs.performanceRatingDoc && !perfRatingFilled" class="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                      <i class="pi pi-exclamation-triangle" style="font-size:9px"></i> Please fill in all three rating fields to proceed.
                    </p>
                  </div>
                </template>
              </div>

              <!-- N/A confirmation note -->
              <div v-else class="px-4 py-3 bg-slate-50 border-t border-slate-200">
                <p class="text-[10px] text-slate-500 flex items-center gap-1.5">
                  <i class="pi pi-info-circle" style="font-size:9px"></i>
                  Your application will be submitted without a performance evaluation. HR will verify this during the review process.
                </p>
              </div>
            </div>

            <!-- Optional Documents -->
            <div class="space-y-1">
              <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)] flex items-center gap-1.5 pb-1">
                <i class="pi pi-plus-circle" style="font-size:8px"></i> Optional Documents
              </p>
              <template v-for="slot in optionalSlots" :key="slot.key">
                <div class="rounded-2xl border overflow-hidden transition-all"
                  :class="docUploaded(slot) ? 'border-emerald-200' : 'border-[var(--border-main)]'">
                  <!-- Slot header -->
                  <div class="px-4 py-3 flex items-start gap-3 border-b"
                    :class="docUploaded(slot) ? 'bg-emerald-50 border-emerald-200' : 'bg-[var(--bg-app)] border-[var(--border-main)]'">
                    <div :class="['w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                      docUploaded(slot) ? 'bg-emerald-100' : 'bg-[var(--color-primary-light)]']">
                      <i :class="['pi text-[10px]', slot.icon,
                        docUploaded(slot) ? 'text-emerald-600' : 'text-[var(--color-primary)]']"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <p class="text-xs font-bold text-[var(--text-main)]">{{ slot.label }}</p>
                        <span class="text-[9px] text-[var(--text-faint)]">Optional</span>
                        <span v-if="docUploaded(slot)" class="ml-auto text-[9px] font-black text-emerald-600 flex items-center gap-1 shrink-0">
                          <i class="pi pi-check-circle" style="font-size:9px"></i> Uploaded
                        </span>
                      </div>
                      <p class="text-[10px] text-[var(--text-faint)] mt-0.5 leading-snug">{{ slot.guide }}</p>
                      <p v-if="slot.example" class="text-[10px] text-[var(--text-muted)] mt-1 leading-snug italic border-l-2 border-[var(--border-main)] pl-2">
                        <span class="not-italic font-bold text-[var(--text-faint)]">e.g. </span>{{ slot.example }}
                      </p>
                    </div>
                  </div>
                  <!-- Upload area -->
                  <div class="px-4 py-3 bg-[var(--surface)]">
                    <template v-if="slot.isArray">
                      <div v-if="(docs[slot.key] || []).length" class="flex flex-col gap-1.5 mb-2">
                        <div v-for="(f, idx) in docs[slot.key]" :key="idx"
                          class="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)]">
                          <i :class="['pi text-xs shrink-0', f.fileName?.endsWith('.pdf') ? 'pi-file-pdf text-[var(--color-primary)]' : 'pi-image text-emerald-500']"></i>
                          <p class="text-xs text-[var(--text-main)] flex-1 truncate font-medium">{{ f.fileName }}</p>
                          <button @click="removeDoc(slot.key, idx)" class="text-[10px] text-rose-500 font-bold hover:underline shrink-0">Remove</button>
                        </div>
                      </div>
                      <label :class="['flex items-center gap-2 h-9 px-3 rounded-xl cursor-pointer border transition-all w-fit text-xs font-bold',
                        uploading[slot.key] ? 'border-[var(--border-main)] text-[var(--text-faint)] cursor-wait'
                          : 'border-[var(--border-main)] text-[var(--text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]']">
                        <i :class="['pi text-[10px]', uploading[slot.key] ? 'pi-spin pi-spinner' : 'pi-plus']"></i>
                        {{ uploading[slot.key] ? 'Uploading…' : 'Add file' }}
                        <input type="file" class="hidden" :accept="slot.accept || '.pdf,image/*'" :disabled="!!uploading[slot.key]"
                          @change="e => uploadDoc(slot, e.target.files[0], true)" />
                      </label>
                    </template>
                    <template v-else>
                      <div v-if="docs[slot.key]" class="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--bg-app)] border border-emerald-200">
                        <i :class="['pi text-xs shrink-0', docs[slot.key].fileName?.endsWith('.pdf') ? 'pi-file-pdf text-[var(--color-primary)]' : 'pi-image text-emerald-500']"></i>
                        <p class="text-xs text-[var(--text-main)] flex-1 truncate font-medium">{{ docs[slot.key].fileName }}</p>
                        <label class="text-[10px] font-bold text-[var(--color-primary)] hover:underline cursor-pointer shrink-0">
                          Replace
                          <input type="file" class="hidden" :accept="slot.accept || '.pdf,image/*'" :disabled="!!uploading[slot.key]"
                            @change="e => uploadDoc(slot, e.target.files[0])" />
                        </label>
                        <button @click="removeDoc(slot.key)" class="text-[10px] text-rose-500 font-bold hover:underline shrink-0">Remove</button>
                      </div>
                      <label v-else :class="['flex items-center gap-2 h-9 px-3 rounded-xl cursor-pointer border transition-all w-fit text-xs font-bold',
                        uploading[slot.key] ? 'border-[var(--border-main)] text-[var(--text-faint)] cursor-wait'
                          : 'border-[var(--border-main)] text-[var(--text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]']">
                        <i :class="['pi text-[10px]', uploading[slot.key] ? 'pi-spin pi-spinner' : 'pi-upload']"></i>
                        {{ uploading[slot.key] ? 'Uploading…' : 'Choose file' }}
                        <input type="file" class="hidden" :accept="slot.accept || '.pdf,image/*'" :disabled="!!uploading[slot.key]"
                          @change="e => uploadDoc(slot, e.target.files[0])" />
                      </label>
                    </template>
                    <p v-if="uploadErr[slot.key]" class="text-[10px] text-rose-500 mt-1.5 flex items-center gap-1">
                      <i class="pi pi-exclamation-circle" style="font-size:9px"></i> {{ uploadErr[slot.key] }}
                    </p>
                  </div>
                </div>
              </template>
            </div>

          </div>

          <div class="px-6 sm:px-8 py-4 border-t border-[var(--border-main)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
            <AppButton variant="secondary" @click="step = 'select'"><i class="pi pi-arrow-left text-[10px] mr-1"></i> Back</AppButton>
            <AppButton @click="step = 'verify'" iconRight="pi-arrow-right">Verify Documents</AppButton>
          </div>
        </template>

        <!-- ══ STEP 4: VERIFY DOCUMENTS ══════════════════════════════════════ -->
        <template v-else-if="step === 'verify'">
          <div class="overflow-y-auto custom-scrollbar flex-1 px-6 sm:px-8 py-6 space-y-2">

            <!-- Header note -->
            <div class="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-4">
              <i class="pi pi-eye text-amber-600 mt-0.5 shrink-0"></i>
              <p class="text-xs text-amber-800 leading-relaxed">
                <strong>Check each document carefully.</strong> Click <strong>View</strong> to open and confirm you uploaded the correct file. Documents are shown in physical folder order.
              </p>
            </div>

            <!-- ① Application Letter -->
            <template v-if="findSlot('applicationLetter')">
              <div class="flex items-center gap-3 px-4 py-3 rounded-2xl border"
                :class="docs.applicationLetter ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'">
                <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black"
                  :class="docs.applicationLetter ? 'bg-emerald-500 text-white' : 'bg-rose-400 text-white'">1</div>
                <div class="flex-1 min-w-0">
                  <p class="text-[10px] font-black uppercase tracking-widest mb-0.5"
                    :class="docs.applicationLetter ? 'text-emerald-700' : 'text-rose-500'">Application Letter</p>
                  <p class="text-xs font-medium text-[var(--text-main)] truncate">{{ docs.applicationLetter?.fileName || 'Not uploaded — required' }}</p>
                </div>
                <button v-if="docs.applicationLetter" @click="viewDoc(docs.applicationLetter.fileUrl, 'Application Letter')"
                  class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black text-[var(--color-primary)] bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)] hover:text-white transition-all outline-none">
                  <i class="pi pi-eye" style="font-size:9px"></i> View
                </button>
                <button v-else @click="step = 'upload'"
                  class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black text-rose-600 bg-rose-100 border border-rose-200 hover:bg-rose-500 hover:text-white transition-all outline-none">
                  <i class="pi pi-upload" style="font-size:9px"></i> Upload
                </button>
              </div>
            </template>

            <!-- ② Personal Data Sheet -->
            <template v-if="findSlot('pds')">
              <div class="flex items-center gap-3 px-4 py-3 rounded-2xl border"
                :class="docs.pds ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'">
                <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black"
                  :class="docs.pds ? 'bg-emerald-500 text-white' : 'bg-rose-400 text-white'">2</div>
                <div class="flex-1 min-w-0">
                  <p class="text-[10px] font-black uppercase tracking-widest mb-0.5"
                    :class="docs.pds ? 'text-emerald-700' : 'text-rose-500'">Personal Data Sheet (PDS)</p>
                  <p class="text-xs font-medium text-[var(--text-main)] truncate">{{ docs.pds?.fileName || 'Not uploaded — required' }}</p>
                </div>
                <button v-if="docs.pds" @click="viewDoc(docs.pds.fileUrl, 'Personal Data Sheet (PDS)')"
                  class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black text-[var(--color-primary)] bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)] hover:text-white transition-all outline-none">
                  <i class="pi pi-eye" style="font-size:9px"></i> View
                </button>
                <button v-else @click="step = 'upload'"
                  class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black text-rose-600 bg-rose-100 border border-rose-200 hover:bg-rose-500 hover:text-white transition-all outline-none">
                  <i class="pi pi-upload" style="font-size:9px"></i> Upload
                </button>
              </div>
            </template>

            <!-- ③ Performance Rating -->
            <div class="flex items-center gap-3 px-4 py-3 rounded-2xl border"
              :class="docs.performanceRatingDoc ? 'border-emerald-200 bg-emerald-50' : perfNotApplicable ? 'border-slate-200 bg-slate-50' : 'border-amber-200 bg-amber-50'">
              <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black"
                :class="docs.performanceRatingDoc ? 'bg-emerald-500 text-white' : perfNotApplicable ? 'bg-slate-400 text-white' : 'bg-amber-400 text-white'">3</div>
              <div class="flex-1 min-w-0">
                <p class="text-[10px] font-black uppercase tracking-widest mb-0.5"
                  :class="docs.performanceRatingDoc ? 'text-emerald-700' : perfNotApplicable ? 'text-slate-500' : 'text-amber-700'">Performance Rating / IPCRF</p>
                <p class="text-xs font-medium text-[var(--text-main)] truncate">
                  {{ docs.performanceRatingDoc ? docs.performanceRatingDoc.fileName : perfNotApplicable ? 'Marked as Not Applicable' : 'Not uploaded' }}
                </p>
                <p v-if="docs.performanceRatingDoc && perfRatingFilled" class="text-[9px] text-emerald-600 mt-0.5">
                  {{ perfRating.adjective }} · {{ perfRating.score }} · {{ perfRating.periodCovered }}
                </p>
              </div>
              <button v-if="docs.performanceRatingDoc" @click="viewDoc(docs.performanceRatingDoc.fileUrl, 'Performance Rating / IPCRF')"
                class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black text-[var(--color-primary)] bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)] hover:text-white transition-all outline-none">
                <i class="pi pi-eye" style="font-size:9px"></i> View
              </button>
            </div>

            <!-- ④ Education Records (TOR / Diploma) -->
            <div class="rounded-2xl border overflow-hidden" :class="pdsRows[0].val.value.length > 0 ? 'border-[var(--border-main)]' : 'border-[var(--border-main)]'">
              <div class="px-4 py-2.5 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center gap-2.5">
                <div class="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0 text-[9px] font-black text-white">4</div>
                <i class="pi pi-graduation-cap text-[10px] text-[var(--color-primary)]"></i>
                <p class="text-xs font-black text-[var(--text-main)]">Education Records</p>
                <span class="ml-auto text-[10px] font-bold text-[var(--text-faint)]">{{ pdsRows[0].val.value.length }} selected</span>
              </div>
              <div v-if="pdsRows[0].val.value.length === 0" class="px-4 py-3 bg-[var(--surface)]">
                <p class="text-[10px] text-[var(--text-faint)]">No education records selected.</p>
              </div>
              <div v-else class="divide-y divide-[var(--border-main)]">
                <div v-for="(item, i) in getSelectedItems(pdsRows[0])" :key="i" class="px-4 py-3 bg-[var(--surface)]">
                  <p class="text-xs font-bold text-[var(--text-main)] leading-snug">{{ pdsRows[0].title(item) }}</p>
                  <p v-if="pdsRows[0].sub(item)" class="text-[10px] text-[var(--text-muted)]">{{ pdsRows[0].sub(item) }}</p>
                  <p v-if="pdsRows[0].period(item)" class="text-[9px] text-[var(--text-faint)]">{{ pdsRows[0].period(item) }}</p>
                  <div v-if="getRecordDocs('edu', item).length" class="mt-2 flex flex-wrap gap-1.5">
                    <button v-for="doc in getRecordDocs('edu', item)" :key="doc.label"
                      @click="viewDoc(doc.url, doc.label)"
                      class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)] hover:text-white transition-all outline-none">
                      <i class="pi pi-eye" style="font-size:9px"></i> {{ doc.label }}
                    </button>
                  </div>
                  <p v-else class="mt-1.5 text-[10px] text-amber-600 flex items-center gap-1">
                    <i class="pi pi-exclamation-triangle" style="font-size:9px"></i> No document attached in profile.
                  </p>
                </div>
              </div>
            </div>

            <!-- ⑤ Eligibility Records -->
            <div class="rounded-2xl border overflow-hidden">
              <div class="px-4 py-2.5 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center gap-2.5">
                <div class="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0 text-[9px] font-black text-white">5</div>
                <i class="pi pi-verified text-[10px] text-[var(--color-primary)]"></i>
                <p class="text-xs font-black text-[var(--text-main)]">Eligibility Records</p>
                <span class="ml-auto text-[10px] font-bold"
                  :class="qsNoneFor('eligibility') ? 'text-emerald-600' : 'text-[var(--text-faint)]'">
                  {{ qsNoneFor('eligibility') ? 'Not required' : `${pdsRows[1].val.value.length} selected` }}
                </span>
              </div>
              <div v-if="qsNoneFor('eligibility')" class="px-4 py-3 bg-emerald-50">
                <p class="text-[10px] text-emerald-600 flex items-center gap-1.5"><i class="pi pi-check-circle" style="font-size:9px"></i> Not required for this position.</p>
              </div>
              <div v-else-if="pdsRows[1].val.value.length === 0" class="px-4 py-3 bg-[var(--surface)]">
                <p class="text-[10px] text-[var(--text-faint)]">No eligibility records selected.</p>
              </div>
              <div v-else class="divide-y divide-[var(--border-main)]">
                <div v-for="(item, i) in getSelectedItems(pdsRows[1])" :key="i" class="px-4 py-3 bg-[var(--surface)]">
                  <p class="text-xs font-bold text-[var(--text-main)]">{{ pdsRows[1].title(item) }}</p>
                  <p v-if="pdsRows[1].period(item)" class="text-[9px] text-[var(--text-faint)]">{{ pdsRows[1].period(item) }}</p>
                  <div v-if="getRecordDocs('elig', item).length" class="mt-2 flex flex-wrap gap-1.5">
                    <button v-for="doc in getRecordDocs('elig', item)" :key="doc.label"
                      @click="viewDoc(doc.url, doc.label)"
                      class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)] hover:text-white transition-all outline-none">
                      <i class="pi pi-eye" style="font-size:9px"></i> {{ doc.label }}
                    </button>
                  </div>
                  <p v-else class="mt-1.5 text-[10px] text-amber-600 flex items-center gap-1">
                    <i class="pi pi-exclamation-triangle" style="font-size:9px"></i> No document attached in profile.
                  </p>
                </div>
              </div>
            </div>

            <!-- ⑥ Work Experience Records -->
            <div class="rounded-2xl border overflow-hidden">
              <div class="px-4 py-2.5 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center gap-2.5">
                <div class="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0 text-[9px] font-black text-white">6</div>
                <i class="pi pi-briefcase text-[10px] text-[var(--color-primary)]"></i>
                <p class="text-xs font-black text-[var(--text-main)]">Work Experience Records</p>
                <span class="ml-auto text-[10px] font-bold"
                  :class="qsNoneFor('experience') ? 'text-emerald-600' : 'text-[var(--text-faint)]'">
                  {{ qsNoneFor('experience') ? 'Not required' : `${pdsRows[2].val.value.length} selected` }}
                </span>
              </div>
              <div v-if="qsNoneFor('experience')" class="px-4 py-3 bg-emerald-50">
                <p class="text-[10px] text-emerald-600 flex items-center gap-1.5"><i class="pi pi-check-circle" style="font-size:9px"></i> Not required for this position.</p>
              </div>
              <div v-else-if="pdsRows[2].val.value.length === 0" class="px-4 py-3 bg-[var(--surface)]">
                <p class="text-[10px] text-[var(--text-faint)]">No experience records selected.</p>
              </div>
              <div v-else class="divide-y divide-[var(--border-main)]">
                <div v-for="(item, i) in getSelectedItems(pdsRows[2])" :key="i" class="px-4 py-3 bg-[var(--surface)]">
                  <p class="text-xs font-bold text-[var(--text-main)]">{{ pdsRows[2].title(item) }}</p>
                  <p v-if="pdsRows[2].sub(item)" class="text-[10px] text-[var(--text-muted)]">{{ pdsRows[2].sub(item) }}</p>
                  <p v-if="pdsRows[2].period(item)" class="text-[9px] text-[var(--text-faint)]">{{ pdsRows[2].period(item) }}</p>
                  <div v-if="getRecordDocs('exp', item).length" class="mt-2 flex flex-wrap gap-1.5">
                    <button v-for="doc in getRecordDocs('exp', item)" :key="doc.label"
                      @click="viewDoc(doc.url, doc.label)"
                      class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)] hover:text-white transition-all outline-none">
                      <i class="pi pi-eye" style="font-size:9px"></i> {{ doc.label }}
                    </button>
                  </div>
                  <p v-else class="mt-1.5 text-[10px] text-amber-600 flex items-center gap-1">
                    <i class="pi pi-exclamation-triangle" style="font-size:9px"></i> No document attached in profile.
                  </p>
                </div>
              </div>
            </div>

            <!-- ⑦ Training Records -->
            <div class="rounded-2xl border overflow-hidden">
              <div class="px-4 py-2.5 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center gap-2.5">
                <div class="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0 text-[9px] font-black text-white">7</div>
                <i class="pi pi-book text-[10px] text-[var(--color-primary)]"></i>
                <p class="text-xs font-black text-[var(--text-main)]">Training Records</p>
                <span class="ml-auto text-[10px] font-bold"
                  :class="qsNoneFor('trainings') ? 'text-emerald-600' : 'text-[var(--text-faint)]'">
                  {{ qsNoneFor('trainings') ? 'Not required' : `${pdsRows[3].val.value.length} selected` }}
                </span>
              </div>
              <div v-if="qsNoneFor('trainings')" class="px-4 py-3 bg-emerald-50">
                <p class="text-[10px] text-emerald-600 flex items-center gap-1.5"><i class="pi pi-check-circle" style="font-size:9px"></i> Not required for this position.</p>
              </div>
              <div v-else-if="pdsRows[3].val.value.length === 0" class="px-4 py-3 bg-[var(--surface)]">
                <p class="text-[10px] text-[var(--text-faint)]">No training records selected.</p>
              </div>
              <div v-else class="divide-y divide-[var(--border-main)]">
                <div v-for="(item, i) in getSelectedItems(pdsRows[3])" :key="i" class="px-4 py-3 bg-[var(--surface)]">
                  <p class="text-xs font-bold text-[var(--text-main)]">{{ pdsRows[3].title(item) }}</p>
                  <p v-if="pdsRows[3].sub(item)" class="text-[10px] text-[var(--text-muted)]">{{ pdsRows[3].sub(item) }}</p>
                  <p v-if="pdsRows[3].period(item)" class="text-[9px] text-[var(--text-faint)]">{{ pdsRows[3].period(item) }}</p>
                  <div v-if="getRecordDocs('trn', item).length" class="mt-2 flex flex-wrap gap-1.5">
                    <button v-for="doc in getRecordDocs('trn', item)" :key="doc.label"
                      @click="viewDoc(doc.url, doc.label)"
                      class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)] hover:text-white transition-all outline-none">
                      <i class="pi pi-eye" style="font-size:9px"></i> {{ doc.label }}
                    </button>
                  </div>
                  <p v-else class="mt-1.5 text-[10px] text-amber-600 flex items-center gap-1">
                    <i class="pi pi-exclamation-triangle" style="font-size:9px"></i> No document attached in profile.
                  </p>
                </div>
              </div>
            </div>

            <!-- ⑧ Proof of Employment / Latest Appointment (optional) -->
            <div v-if="docs.latestAppointment" class="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[var(--border-main)] bg-[var(--surface)]">
              <div class="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0 text-[9px] font-black text-white">8</div>
              <div class="flex-1 min-w-0">
                <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-0.5">Proof of Employment / Latest Appointment</p>
                <p class="text-xs font-medium text-[var(--text-main)] truncate">{{ docs.latestAppointment.fileName }}</p>
              </div>
              <button @click="viewDoc(docs.latestAppointment.fileUrl, 'Latest Appointment')"
                class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black text-[var(--color-primary)] bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)] hover:text-white transition-all outline-none">
                <i class="pi pi-eye" style="font-size:9px"></i> View
              </button>
            </div>

            <!-- ⑨ Work Experience Sheet (optional) -->
            <div v-if="docs.workExperienceSheet" class="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[var(--border-main)] bg-[var(--surface)]">
              <div class="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0 text-[9px] font-black text-white">9</div>
              <div class="flex-1 min-w-0">
                <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-0.5">Work Experience Sheet</p>
                <p class="text-xs font-medium text-[var(--text-main)] truncate">{{ docs.workExperienceSheet.fileName }}</p>
              </div>
              <button @click="viewDoc(docs.workExperienceSheet.fileUrl, 'Work Experience Sheet')"
                class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black text-[var(--color-primary)] bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)] hover:text-white transition-all outline-none">
                <i class="pi pi-eye" style="font-size:9px"></i> View
              </button>
            </div>

            <!-- ⑩+ Track-specific optional docs -->
            <template v-for="(slot, si) in optionalSlots.filter(s => !['latestAppointment','workExperienceSheet'].includes(s.key))" :key="slot.key">
              <template v-if="slot.isArray && docUploaded(slot)">
                <div v-for="(f, idx) in docs[slot.key]" :key="idx"
                  class="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[var(--border-main)] bg-[var(--surface)]">
                  <div class="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0 text-[9px] font-black text-white">{{ 10 + si }}</div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-0.5">{{ slot.label }} ({{ idx + 1 }})</p>
                    <p class="text-xs font-medium text-[var(--text-main)] truncate">{{ f.fileName }}</p>
                  </div>
                  <button @click="viewDoc(f.fileUrl, `${slot.label} (${idx + 1})`)"
                    class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black text-[var(--color-primary)] bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)] hover:text-white transition-all outline-none">
                    <i class="pi pi-eye" style="font-size:9px"></i> View
                  </button>
                </div>
              </template>
              <div v-else-if="!slot.isArray && docUploaded(slot)"
                class="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[var(--border-main)] bg-[var(--surface)]">
                <div class="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0 text-[9px] font-black text-white">{{ 10 + si }}</div>
                <div class="flex-1 min-w-0">
                  <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-0.5">{{ slot.label }}</p>
                  <p class="text-xs font-medium text-[var(--text-main)] truncate">{{ docs[slot.key]?.fileName }}</p>
                </div>
                <button @click="viewDoc(docs[slot.key]?.fileUrl, slot.label)"
                  class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black text-[var(--color-primary)] bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)] hover:text-white transition-all outline-none">
                  <i class="pi pi-eye" style="font-size:9px"></i> View
                </button>
              </div>
            </template>

          </div>

          <div class="px-6 sm:px-8 py-4 border-t border-[var(--border-main)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
            <AppButton variant="secondary" @click="step = 'upload'"><i class="pi pi-arrow-left text-[10px] mr-1"></i> Back</AppButton>
            <AppButton @click="step = 'review'" iconRight="pi-arrow-right">Proceed to Submit</AppButton>
          </div>
        </template>

        <!-- ══ STEP 5: REVIEW CHECKLIST ══════════════════════════════════════ -->
        <template v-else-if="step === 'review'">
          <div class="overflow-y-auto custom-scrollbar flex-1 px-6 sm:px-8 py-6 space-y-4">

            <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Pre-submission Checklist</p>

            <!-- Performance Rating -->
            <div v-if="docs.performanceRatingDoc || perfNotApplicable" class="rounded-2xl overflow-hidden border"
              :class="perfNotApplicable ? 'border-slate-200' : perfRatingFilled ? 'border-emerald-200' : 'border-amber-200'">
              <div class="px-4 py-3 flex items-center gap-3"
                :class="perfNotApplicable ? 'bg-slate-50' : perfRatingFilled ? 'bg-emerald-50' : 'bg-amber-50'">
                <div :class="['w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                  perfNotApplicable ? 'bg-slate-400 text-white' : perfRatingFilled ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white']">
                  <i :class="['pi', perfNotApplicable ? 'pi-minus' : perfRatingFilled ? 'pi-check' : 'pi-exclamation-triangle']" style="font-size:10px"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p :class="['text-xs font-black', perfNotApplicable ? 'text-slate-600' : perfRatingFilled ? 'text-emerald-800' : 'text-amber-800']">Performance Rating</p>
                  <p :class="['text-[10px] mt-0.5 truncate', perfNotApplicable ? 'text-slate-500' : perfRatingFilled ? 'text-emerald-600' : 'text-amber-600']">
                    {{ perfNotApplicable ? 'Not Applicable — no performance evaluation submitted' : perfRatingFilled ? `${perfRating.adjective} · ${perfRating.score} · ${perfRating.periodCovered}` : 'Go back and fill in the rating details' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Required documents -->
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-2">Required Documents</p>
              <div class="space-y-2">
                <div v-for="slot in requiredSlots" :key="slot.key"
                  class="flex items-center gap-3 px-4 py-3 rounded-2xl border"
                  :class="docUploaded(slot) ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'">
                  <div :class="['w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                    docUploaded(slot) ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white']">
                    <i :class="['pi', docUploaded(slot) ? 'pi-check' : 'pi-times']" style="font-size:10px"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p :class="['text-xs font-bold', docUploaded(slot) ? 'text-emerald-800' : 'text-rose-700']">{{ slot.label }}</p>
                    <p :class="['text-[10px] truncate', docUploaded(slot) ? 'text-emerald-600' : 'text-rose-500']">
                      {{ docUploaded(slot) ? (slot.isArray ? `${docs[slot.key]?.length} file(s)` : docs[slot.key]?.fileName) : 'Not yet uploaded' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Optional documents -->
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-2">Optional Documents</p>
              <div class="space-y-2">
                <div v-for="slot in optionalSlots" :key="slot.key"
                  class="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-[var(--border-main)] bg-[var(--surface)]">
                  <div :class="['w-5 h-5 rounded-full flex items-center justify-center shrink-0 border',
                    docUploaded(slot) ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-[var(--bg-app)] border-[var(--border-main)] text-[var(--text-faint)]']">
                    <i :class="['pi', docUploaded(slot) ? 'pi-check' : 'pi-minus']" style="font-size:8px"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-[var(--text-main)]">{{ slot.label }}</p>
                    <p class="text-[10px] text-[var(--text-faint)] truncate">
                      {{ docUploaded(slot) ? (slot.isArray ? `${docs[slot.key]?.length} file(s)` : docs[slot.key]?.fileName) : 'Not uploaded — optional' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Profile Records Summary -->
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-2">Profile Records Selected</p>
              <div class="grid grid-cols-2 gap-2">
                <div v-for="row in pdsRows" :key="row.id"
                  class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border bg-[var(--surface)]"
                  :class="row.val.value.length > 0 ? 'border-[var(--border-main)]'
                    : qsNoneFor(row.qsField) ? 'border-emerald-100 bg-emerald-50'
                    : 'border-[var(--border-main)]'">
                  <div :class="['w-5 h-5 rounded-full flex items-center justify-center shrink-0 border',
                    row.val.value.length > 0 ? 'bg-emerald-100 border-emerald-200 text-emerald-600'
                    : qsNoneFor(row.qsField) ? 'bg-emerald-100 border-emerald-200 text-emerald-500'
                    : 'bg-[var(--bg-app)] border-[var(--border-main)] text-[var(--text-faint)]']">
                    <i :class="['pi', row.val.value.length > 0 || qsNoneFor(row.qsField) ? 'pi-check' : 'pi-minus']" style="font-size:8px"></i>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[10px] font-bold text-[var(--text-main)]">{{ row.label }}</p>
                    <p class="text-[9px] text-[var(--text-faint)]">
                      {{ row.val.value.length > 0 ? `${row.val.value.length} selected`
                        : qsNoneFor(row.qsField) ? 'Not required for this position'
                        : 'None selected' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Consent -->
            <div class="flex items-start gap-3 p-4 rounded-2xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20">
              <i class="pi pi-shield text-[var(--color-primary)] mt-0.5 shrink-0"></i>
              <p class="text-xs text-[var(--text-sub)] leading-relaxed">
                By submitting, you authorize SDO Guihulngan City to verify your submitted records and documents in accordance with <strong>RA 6713</strong> and CSC guidelines. Falsification is subject to administrative and criminal liability.
              </p>
            </div>
          </div>

          <div class="px-6 sm:px-8 py-4 border-t border-[var(--border-main)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
            <AppButton variant="secondary" @click="step = 'verify'"><i class="pi pi-arrow-left text-[10px] mr-1"></i> Back</AppButton>
            <div class="flex items-center gap-3">
              <p v-if="submitError" class="text-[10px] font-bold text-rose-500 flex items-center gap-1 max-w-[180px]">
                <i class="pi pi-exclamation-circle" style="font-size:9px"></i> {{ submitError }}
              </p>
              <AppButton @click="handleApply" :loading="submitting" :disabled="!canSubmit || submitting" icon="pi-send">
                {{ canSubmit ? 'Submit Application' : 'Complete Required Items' }}
              </AppButton>
            </div>
          </div>
        </template>

        <!-- ══ STEP 5: SUCCESS ════════════════════════════════════════════════ -->
        <template v-else>
          <div class="p-10 sm:p-12 flex flex-col items-center text-center gap-6">
            <div class="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500">
              <i class="pi pi-check-circle text-5xl"></i>
            </div>
            <div>
              <h2 class="text-2xl font-black text-[var(--text-main)] tracking-tight">Application Submitted!</h2>
              <p class="text-sm text-[var(--text-muted)] mt-2 max-w-sm mx-auto leading-relaxed">
                Your application for <strong>{{ job.positionTitle }}</strong> has been recorded along with all uploaded documents.
              </p>
            </div>
            <div class="p-4 rounded-2xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 text-left max-w-sm w-full">
              <p class="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] mb-2">What happens next?</p>
              <div class="space-y-1.5">
                <div v-for="tip in ['HR reviews and verifies your submitted documents','Eligible applicants are invited for comparative assessment','An IER (Individual Evaluation Report) will be generated for your records','Results are posted on the SDO bulletin board']"
                  :key="tip" class="flex items-start gap-2">
                  <i class="pi pi-arrow-right text-[9px] text-[var(--color-primary)] mt-0.5 shrink-0"></i>
                  <p class="text-xs text-[var(--text-sub)]">{{ tip }}</p>
                </div>
              </div>
            </div>
            <div class="flex flex-col gap-3 w-full max-w-xs">
              <router-link to="/user/applications" custom v-slot="{ navigate }">
                <AppButton @click="navigate" block>Track My Application</AppButton>
              </router-link>
              <AppButton variant="secondary" @click="closeModal" block>Browse Other Vacancies</AppButton>
            </div>
          </div>
        </template>

      </div>
    </div>
  </Teleport>

  <AppFileViewer
    v-model="viewerVisible"
    :url="viewerUrl"
    :title="viewerTitle"
  />
</template>
