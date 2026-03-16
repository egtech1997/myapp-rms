<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { AppButton, AppTextarea, AppBadge, AppAvatar, AppFileViewer } from '@/components/ui'
import { resolveUrl } from '@/utils/url'
import apiClient from '@/api/axios'
import Swal from 'sweetalert2'

const props = defineProps({
  applicationId:   { type: String,  required: true },
  candidateName:   { type: String,  default: 'Candidate' },
  jobTitle:        { type: String,  default: 'Position' },
  hiringTrack:     { type: String,  default: 'non_teaching' },
  avatarUrl:       { type: String,  default: '' },
  initialAppData:  { type: Object,  default: null }, // pre-loaded app from parent
})
const emit = defineEmits(['close', 'submitted'])

// ── SCORING STATE ─────────────────────────────────────────────────────────────
const rubric         = ref(null)
const interviewId    = ref(null)
const status         = ref('draft')
const saving         = ref(false)
const loadingRubric  = ref(true)
const overallRemarks = ref('')
const application    = ref(props.initialAppData ? { ...props.initialAppData } : null)
const scores         = ref([])

// ── PROFILE STATE ─────────────────────────────────────────────────────────────
const profileTab    = ref('personal')
const savingProfile = ref(false)
const showFileViewer  = ref(false)
const docPreviewUrl   = ref('')
const docPreviewLabel = ref('')

const profileTabs = [
  { id: 'personal',    label: 'Personal',    icon: 'pi-user'           },
  { id: 'education',   label: 'Education',   icon: 'pi-graduation-cap'  },
  { id: 'eligibility', label: 'Eligibility', icon: 'pi-verified'        },
  { id: 'experience',  label: 'Experience',  icon: 'pi-briefcase'       },
  { id: 'training',    label: 'Training',    icon: 'pi-star'            },
  { id: 'others',      label: 'Others',      icon: 'pi-list'            },
  { id: 'family',      label: 'Family',      icon: 'pi-heart'           },
  { id: 'references',  label: 'References',  icon: 'pi-address-book'    },
  { id: 'csc',         label: 'CSC Q&A',     icon: 'pi-shield'          },
  { id: 'documents',   label: 'Documents',   icon: 'pi-folder-open'     },
]

const PDS_QUESTIONS = [
  {
    group: '34', label: 'Relationship to Appointing Authority',
    parts: [
      { key: 'q34a', text: 'Related within 3rd degree (consanguinity/affinity) to appointing or recommending authority, chief of bureau, or immediate supervisor?' },
      { key: 'q34b', text: 'Related within 4th degree to the above? (for LGU Career Employees)' },
    ],
    detailKey: 'q34_details',
  },
  {
    group: '35', label: 'Administrative Offense',
    parts: [
      { key: 'q35a', text: 'Ever found guilty of any administrative offense?' },
      { key: 'q35b', text: 'Ever criminally charged before any court?' },
    ],
    detailKey: 'q35_details',
  },
  {
    group: '36', label: 'Criminal Conviction',
    parts: [{ key: 'q36', text: 'Ever convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?' }],
    detailKey: 'q36_details',
  },
  {
    group: '37', label: 'Separation from Service',
    parts: [{ key: 'q37', text: 'Ever separated from the service in connection with an administrative case?' }],
    detailKey: 'q37_details',
  },
  {
    group: '38', label: 'Candidacy / Resignation',
    parts: [
      { key: 'q38a', text: 'Candidate in any national or local election held within the last year (except Barangay election)?' },
      { key: 'q38b', text: 'Resigned from government service during the 3-month period before the last election to campaign for a candidate?' },
    ],
    detailKey: 'q38_details',
  },
  {
    group: '39', label: 'Immigrant / Permanent Resident Status',
    parts: [{ key: 'q39', text: 'Acquired the status of immigrant or permanent resident of another country?' }],
    detailKey: 'q39_details',
  },
  {
    group: '40', label: 'Indigenous / Disability / Solo Parent',
    parts: [
      { key: 'q40a', text: 'Member of any indigenous group? (RA 8371)' },
      { key: 'q40b', text: 'Person with disability? (RA 7277)' },
      { key: 'q40c', text: 'Solo parent? (RA 8972)' },
    ],
    detailKey: 'q40_details',
  },
]

// ── SCORING COMPUTED ──────────────────────────────────────────────────────────
const partACriteria = computed(() =>
  (rubric.value?.criteria || []).map((c, i) => ({ ...c, globalIndex: i })).filter(c => !c.isPotential)
)
const partBCriteria = computed(() =>
  (rubric.value?.criteria || []).map((c, i) => ({ ...c, globalIndex: i })).filter(c => c.isPotential)
)
const maxA       = computed(() => partACriteria.value.reduce((s, c) => s + (c.maxPoints || 0), 0))
const maxB       = computed(() => partBCriteria.value.reduce((s, c) => s + (c.maxPoints || 0), 0))
const maxTotal   = computed(() => rubric.value?.totalPoints || (maxA.value + maxB.value))
const totalA     = computed(() => partACriteria.value.reduce((s, c) => s + (Number(scores.value[c.globalIndex]?.score) || 0), 0))
const totalB     = computed(() => partBCriteria.value.reduce((s, c) => s + (Number(scores.value[c.globalIndex]?.score) || 0), 0))
const grandTotal = computed(() => totalA.value + totalB.value)
const overflowIndices = computed(() =>
  new Set((rubric.value?.criteria || []).reduce((acc, c, i) => {
    if ((Number(scores.value[i]?.score) || 0) > c.maxPoints) acc.push(i)
    return acc
  }, []))
)
const hasOverflow  = computed(() => overflowIndices.value.size > 0)
const scorePercent = computed(() => maxTotal.value > 0 ? Math.min(100, (grandTotal.value / maxTotal.value) * 100) : 0)

// ── PROFILE COMPUTED ──────────────────────────────────────────────────────────
const ad         = computed(() => application.value?.applicantData || {})
const pInfo      = computed(() => ad.value.personalInfo || {})
const allEdu     = computed(() => ad.value.education    || [])
const allElig    = computed(() => ad.value.eligibility  || [])
const allExp     = computed(() => ad.value.experience   || [])
const allTrn     = computed(() => ad.value.training     || [])
const familyData = computed(() => ad.value.family       || {})
const references = computed(() => ad.value.references   || [])
const pdsQ       = computed(() => ad.value.pdsQuestions || {})
const voluntary  = computed(() => ad.value.voluntaryWork || [])
const skills     = computed(() => ad.value.specialSkills || [])
const distinctions = computed(() => ad.value.nonAcademicDistinctions || [])
const memberships  = computed(() => ad.value.memberships || [])

const irrelevantCount = computed(() =>
  [...allEdu.value, ...allElig.value, ...allExp.value, ...allTrn.value]
    .filter(i => i.isRelevant === false).length
)

const allDocs = computed(() => {
  if (!application.value) return []
  const docs = []
  const sd   = application.value.submissionDocs || {}
  const add  = (label, url, group) => { if (url) docs.push({ label, url: resolveUrl(url), group }) }

  add('Signed PDS',             sd.pds?.fileUrl,               'Submission')
  add('Application Letter',     sd.applicationLetter?.fileUrl, 'Submission')
  add('Performance Rating',     sd.performanceRatingDoc?.fileUrl, 'Submission')
  add('Latest Appointment',     sd.latestAppointment?.fileUrl,  'Submission')
  add('Work Experience Sheet',  sd.workExperienceSheet?.fileUrl, 'Submission')
  add('Research / Publication', sd.research?.fileUrl,           'Submission')
  ;['outstandingAccomplishments', 'movs', 'awards', 'others'].forEach(k => {
    if (Array.isArray(sd[k])) sd[k].forEach((f, i) => add(`${k} #${i + 1}`, f?.fileUrl, 'Submission'))
  })
  ;(ad.value.education   || []).forEach((e, i) => {
    add(`Edu ${i + 1} — TOR`,     e.tor,    'Education')
    add(`Edu ${i + 1} — Diploma`, e.diploma, 'Education')
  })
  ;(ad.value.eligibility || []).forEach(e => {
    add(`${e.name || 'Eligibility'} — Certificate`, e.document,        'Eligibility')
    add(`${e.name || 'Eligibility'} — License`,     e.licenseDocument, 'Eligibility')
  })
  ;(ad.value.experience  || []).forEach((e, i) => add(`${e.position || `Exp ${i + 1}`} — COE`, e.document, 'Experience'))
  ;(ad.value.training    || []).forEach((t, i) => add(t.title || `Training ${i + 1}`, t.document, 'Training'))
  return docs
})

const docGroups = computed(() => {
  const g = {}
  for (const d of allDocs.value) {
    if (!g[d.group]) g[d.group] = []
    g[d.group].push(d)
  }
  return g
})

// ── TRACK META ────────────────────────────────────────────────────────────────
const TRACK_META = {
  teaching:         { label: 'Teaching Track',             color: 'bg-blue-100 text-blue-700 border-blue-200'     },
  teaching_related: { label: 'Teaching-Related Track',     color: 'bg-purple-100 text-purple-700 border-purple-200' },
  non_teaching:     { label: 'Non-Teaching Track',         color: 'bg-slate-100 text-slate-700 border-slate-200'   },
  school_admin:     { label: 'School Administrator Track', color: 'bg-amber-100 text-amber-700 border-amber-200'   },
}
const trackMeta = computed(() => TRACK_META[props.hiringTrack] || { label: props.hiringTrack, color: 'bg-slate-100 text-slate-700 border-slate-200' })

// ── HELPERS ───────────────────────────────────────────────────────────────────
const str = (v) => {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'YES' : 'NO'
  if (typeof v === 'string')  return v
  if (Array.isArray(v))       return v.map(x => str(x)).filter(x => x && x !== '—').join(', ')
  if (typeof v === 'object')  return v.label || v.name || v.type || v.city || v.municipality || v.province || '—'
  return String(v)
}
const buildName = (n) => {
  if (!n) return '—'
  if (typeof n === 'string') return n
  return [n.lastName, n.firstName, n.middleName, n.suffix].filter(Boolean).join(', ')
}
const buildAddr = (a) => {
  if (!a) return '—'
  return [a.sitio, a.barangay, a.municipality, a.city, a.province, a.region].filter(x => x && str(x) !== '—').map(x => str(x)).join(', ') || '—'
}
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short' }) : '—'
const formatFull = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'
const calcAge    = (d) => { if (!d) return '—'; const b = new Date(d), t = new Date(); return Math.floor((t - b) / (365.25 * 24 * 3600 * 1000)) + ' yrs' }
const isDocPdf = (u) => (u || '').split('?')[0].toLowerCase().endsWith('.pdf')

const viewDoc = (url, label) => { docPreviewUrl.value = resolveUrl(url); docPreviewLabel.value = label; showFileViewer.value = true }
const clearDocPreview = () => { docPreviewUrl.value = ''; docPreviewLabel.value = '' }

// ── SCORING METHODS ───────────────────────────────────────────────────────────
const buildCriteria = () =>
  (rubric.value?.criteria || []).map((c, i) => ({
    label: c.label, score: Number(scores.value[i]?.score) || 0, maxScore: c.maxPoints, remarks: scores.value[i]?.remarks || '',
  }))

const fetchRubric = async () => {
  loadingRubric.value = true
  try {
    const { data } = await apiClient.get(`/v1/rubrics/track/${props.hiringTrack || 'non_teaching'}`)
    rubric.value = data.data
    scores.value = rubric.value.criteria.map(() => ({ score: 0, remarks: '' }))
  } catch (err) {
    Swal.fire('Rubric Not Found', `No rubric configured for "${props.hiringTrack}". Go to Settings → Rubrics.`, 'warning')
  } finally {
    loadingRubric.value = false
  }
}

const loadExisting = async () => {
  try {
    const { data } = await apiClient.get(`/v1/interviews/application/${props.applicationId}`)
    const list = data.data
    if (!Array.isArray(list) || !list.length) return
    const mine = list[0]
    interviewId.value    = mine._id
    status.value         = mine.status || 'draft'
    overallRemarks.value = mine.overallRemarks || ''
    if (mine.criteria?.length) scores.value = mine.criteria.map(c => ({ score: c.score ?? 0, remarks: c.remarks || '' }))
  } catch (err) {
    if (err.response?.status !== 404) console.error('loadExisting error', err)
  }
}

const fetchApplication = async () => {
  if (props.initialAppData) return // already seeded from parent
  try {
    const { data } = await apiClient.get(`/v1/applications/${props.applicationId}`)
    application.value = data.data
  } catch (err) {
    console.error('fetchApplication error', err)
  }
}

const saveApplicantData = async () => {
  if (!application.value?._id) return
  savingProfile.value = true
  try {
    // Deep-clone to strip Vue reactive proxies and prevent corruption of document URLs
    const applicantData = JSON.parse(JSON.stringify(application.value.applicantData))
    await apiClient.patch(`/v1/applications/${application.value._id}/status`, { applicantData })
  } catch (e) { console.error('saveApplicantData error', e) }
  finally { savingProfile.value = false }
}

const restoreItem = async (item) => { item.isRelevant = true; await saveApplicantData() }

const saveDraft = async () => {
  saving.value = true
  try {
    const { data } = await apiClient.post('/v1/interviews', { application: props.applicationId, criteria: buildCriteria(), overallRemarks: overallRemarks.value, status: 'draft' })
    interviewId.value = data.data._id
    Swal.fire({ icon: 'success', title: 'Draft Saved', showConfirmButton: false, timer: 1400 })
  } catch (err) { Swal.fire('Save Failed', err.response?.data?.message || 'An error occurred.', 'error') }
  finally { saving.value = false }
}

const finalizeSubmission = async () => {
  if (hasOverflow.value) return Swal.fire('Invalid Scores', 'One or more scores exceed their maximum.', 'error')
  const r = await Swal.fire({ title: 'Finalize Evaluation?', text: 'Scores cannot be changed after submission.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, Submit Final Score', confirmButtonColor: '#4A4D8F' })
  if (!r.isConfirmed) return
  saving.value = true
  try {
    const { data } = await apiClient.post('/v1/interviews', { application: props.applicationId, criteria: buildCriteria(), overallRemarks: overallRemarks.value })
    interviewId.value = data.data._id
    await apiClient.patch(`/v1/interviews/${data.data._id}/submit`)
    status.value = 'submitted'
    emit('submitted')
    Swal.fire({ icon: 'success', title: 'Evaluation Submitted!', showConfirmButton: false, timer: 1800 })
  } catch (err) { Swal.fire('Submission Failed', err.response?.data?.message || 'An error occurred.', 'error') }
  finally { saving.value = false }
}

const exportIES = async () => {
  if (!interviewId.value) {
    try { const { data } = await apiClient.get(`/v1/interviews/application/${props.applicationId}`); if (data.data?.length) interviewId.value = data.data[0]._id } catch {}
  }
  if (!interviewId.value) return Swal.fire('Error', 'No evaluation found to export.', 'error')
  try {
    const res = await apiClient.get(`/v1/interviews/${interviewId.value}/export`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data])); const link = document.createElement('a')
    link.href = url; link.setAttribute('download', `IES-${props.candidateName}.pdf`); document.body.appendChild(link); link.click(); document.body.removeChild(link)
  } catch { Swal.fire('Error', 'Failed to export IES PDF.', 'error') }
}

const clampScore = (idx) => {
  const max = rubric.value?.criteria[idx]?.maxPoints ?? Infinity; const val = Number(scores.value[idx]?.score)
  if (!isNaN(val) && val > max) scores.value[idx].score = max
  if (!isNaN(val) && val < 0)   scores.value[idx].score = 0
}

onMounted(async () => {
  document.body.style.overflow = 'hidden'
  await fetchRubric()
  await Promise.all([loadExisting(), fetchApplication()])
})
onBeforeUnmount(() => { document.body.style.overflow = '' })
</script>

<template>
  <div class="flex flex-col bg-[var(--surface)] animate-fade-in" style="height:100vh;width:100vw;overflow:hidden">

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="flex-shrink-0 px-6 py-3.5 border-b border-[var(--border-main)] bg-[var(--bg-app)] flex items-center gap-5">
      <AppAvatar :src="avatarUrl" :name="candidateName" size="xl" />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-0.5">
          <span class="text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest" :class="trackMeta.color">{{ trackMeta.label }}</span>
          <AppBadge :variant="status === 'submitted' ? 'appointed' : 'verifying'" size="sm">{{ status === 'submitted' ? 'Submitted' : 'Draft' }}</AppBadge>
          <span v-if="irrelevantCount > 0" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            {{ irrelevantCount }} item{{ irrelevantCount > 1 ? 's' : '' }} marked irrelevant by HR
          </span>
        </div>
        <h2 class="text-lg font-extrabold text-[var(--text-main)] leading-tight truncate uppercase tracking-tight">{{ candidateName }}</h2>
        <p class="text-sm text-[var(--text-muted)]">Applying for: <span class="font-bold text-[var(--color-primary)]">{{ jobTitle }}</span></p>
      </div>
      <div class="text-right shrink-0">
        <p class="text-xs font-black uppercase tracking-widest text-[var(--text-faint)] mb-1">Grand Total</p>
        <p class="text-4xl font-black tabular-nums leading-none"
          :class="grandTotal >= maxTotal * 0.75 ? 'text-emerald-600' : grandTotal >= maxTotal * 0.5 ? 'text-amber-500' : 'text-[var(--text-main)]'">
          {{ grandTotal.toFixed(1) }}
        </p>
        <p class="text-xs text-[var(--text-faint)] font-bold">/ {{ maxTotal }} pts</p>
      </div>
      <button @click="emit('close')" class="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--border-main)] text-[var(--text-muted)] hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-colors shrink-0">
        <i class="pi pi-times text-sm"></i>
      </button>
    </div>

    <!-- ── Body ───────────────────────────────────────────────────────────── -->
    <div class="flex-1 flex overflow-hidden">

      <!-- ════════════════════════════════════════════════════════════
           LEFT: Profile Panel
      ════════════════════════════════════════════════════════════ -->
      <div class="flex flex-col border-r border-[var(--border-main)]" style="width:46%;min-width:0">

        <!-- Tab bar -->
        <div class="flex-shrink-0 border-b border-[var(--border-main)] bg-[var(--bg-app)] px-3 pt-2.5">
          <div class="flex gap-1 overflow-x-auto pb-1.5" style="scrollbar-width:none">
            <button v-for="tab in profileTabs" :key="tab.id"
              @click="profileTab = tab.id"
              class="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap"
              :class="profileTab === tab.id
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-main)]'">
              <i :class="['pi text-[11px]', tab.icon]"></i>
              {{ tab.label }}
              <span v-if="irrelevantCount > 0 && ['education','eligibility','experience','training'].includes(tab.id) && profileTab !== tab.id"
                class="w-4 h-4 rounded-full bg-amber-400 text-white text-[8px] font-black flex items-center justify-center">!</span>
            </button>
          </div>
        </div>

        <!-- Tab content -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">

          <!-- ── PERSONAL ────────────────────────────────────────────────── -->
          <template v-if="profileTab === 'personal'">

            <div class="flex items-center gap-4 p-4 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl">
              <AppAvatar :src="application?.submittedBy?.avatarUrl" :name="candidateName" size="xl" />
              <div class="min-w-0">
                <p class="text-base font-extrabold text-[var(--text-main)] uppercase tracking-tight leading-tight">{{ candidateName }}</p>
                <p class="text-sm text-[var(--text-muted)] mt-0.5">{{ (pInfo.emails || [])[0] || application?.submittedBy?.email || '—' }}</p>
                <div class="flex gap-2 mt-1 flex-wrap">
                  <span v-for="ph in (pInfo.phones || [])" :key="ph" class="text-xs font-semibold text-[var(--text-sub)] bg-[var(--bg-app)] px-2 py-0.5 rounded-lg border border-[var(--border-main)]">{{ ph }}</span>
                </div>
              </div>
            </div>

            <!-- Name -->
            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4">
              <p class="text-xs font-black text-[var(--color-primary)] uppercase tracking-widest mb-3 flex items-center gap-2"><i class="pi pi-user text-xs"></i> Legal Name</p>
              <div class="grid grid-cols-2 gap-3">
                <div v-for="[l,v] in [['Last Name', pInfo.lastName],['First Name', pInfo.firstName],['Middle Name', pInfo.middleName],['Suffix', pInfo.suffix]]" :key="l">
                  <p class="text-xs text-[var(--text-faint)] font-semibold uppercase tracking-wide">{{ l }}</p>
                  <p class="text-sm font-bold text-[var(--text-main)] mt-0.5 uppercase">{{ v || '—' }}</p>
                </div>
              </div>
            </div>

            <!-- Demographics -->
            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4">
              <p class="text-xs font-black text-[var(--color-primary)] uppercase tracking-widest mb-3 flex items-center gap-2"><i class="pi pi-id-card text-xs"></i> Demographics</p>
              <div class="grid grid-cols-2 gap-3">
                <div v-for="[l,v] in [
                  ['Date of Birth', formatFull(pInfo.birthDate)],
                  ['Age', calcAge(pInfo.birthDate)],
                  ['Sex', str(pInfo.sex)],
                  ['Civil Status', str(pInfo.civilStatus)],
                  ['Religion', str(pInfo.religion)],
                  ['Ethnic Group', str(pInfo.ethnicGroup)],
                  ['Indigenous', pInfo.isIndigenous ? 'YES' : 'NO'],
                  ['Citizenship', str(pInfo.citizenship)],
                ]" :key="l">
                  <p class="text-xs text-[var(--text-faint)] font-semibold uppercase tracking-wide">{{ l }}</p>
                  <p class="text-sm font-bold text-[var(--text-main)] mt-0.5 uppercase">{{ v || '—' }}</p>
                </div>
              </div>
            </div>

            <!-- Special Status -->
            <div class="grid grid-cols-2 gap-3">
              <div class="p-4 rounded-2xl border" :class="pInfo.isSoloParent ? 'bg-amber-50 border-amber-200' : 'bg-[var(--surface)] border-[var(--border-main)]'">
                <p class="text-xs font-black uppercase tracking-wide mb-1" :class="pInfo.isSoloParent ? 'text-amber-700' : 'text-[var(--text-faint)]'">
                  <i class="pi pi-star mr-1"></i>Solo Parent
                </p>
                <p class="text-sm font-bold" :class="pInfo.isSoloParent ? 'text-amber-700' : 'text-[var(--text-muted)]'">{{ pInfo.isSoloParent ? 'YES' : 'NO' }}</p>
                <p v-if="pInfo.soloParentCaseNo" class="text-xs text-amber-600 mt-0.5">Case: {{ pInfo.soloParentCaseNo }}</p>
              </div>
              <div class="p-4 rounded-2xl border" :class="(pInfo.disability && pInfo.disability !== '') ? 'bg-sky-50 border-sky-200' : 'bg-[var(--surface)] border-[var(--border-main)]'">
                <p class="text-xs font-black uppercase tracking-wide mb-1" :class="(pInfo.disability && pInfo.disability !== '') ? 'text-sky-700' : 'text-[var(--text-faint)]'">
                  <i class="pi pi-heart mr-1"></i>Disability
                </p>
                <p class="text-sm font-bold" :class="(pInfo.disability && pInfo.disability !== '') ? 'text-sky-700' : 'text-[var(--text-muted)]'">{{ str(pInfo.disability) || 'None' }}</p>
              </div>
            </div>

            <!-- Government IDs -->
            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4">
              <p class="text-xs font-black text-[var(--color-primary)] uppercase tracking-widest mb-3 flex items-center gap-2"><i class="pi pi-shield text-xs"></i> Government IDs</p>
              <div class="grid grid-cols-2 gap-3">
                <div v-for="[l,v] in [
                  ['GSIS BP No.', pInfo.gsisNo],
                  ['Pag-IBIG No.', pInfo.pagibigNo],
                  ['PhilHealth No.', pInfo.philhealthNo],
                  ['TIN No.', pInfo.tinNo],
                  ['PhilSys No.', pInfo.philSysNo],
                  ['Agency Emp. No.', pInfo.agencyEmployeeNo],
                ]" :key="l">
                  <p class="text-xs text-[var(--text-faint)] font-semibold uppercase tracking-wide">{{ l }}</p>
                  <p class="text-sm font-bold text-[var(--text-main)] mt-0.5 font-mono">{{ v || '—' }}</p>
                </div>
              </div>
            </div>

            <!-- Addresses -->
            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4 space-y-3">
              <p class="text-xs font-black text-[var(--color-primary)] uppercase tracking-widest flex items-center gap-2"><i class="pi pi-map-marker text-xs"></i> Addresses</p>
              <div v-if="pInfo.currentAddress">
                <p class="text-xs font-bold text-[var(--text-faint)] uppercase tracking-wide mb-1">Current / Residential</p>
                <p class="text-sm font-semibold text-[var(--text-main)] leading-relaxed">{{ buildAddr(pInfo.currentAddress) }}</p>
              </div>
              <div v-if="pInfo.comelecAddress">
                <p class="text-xs font-bold text-[var(--text-faint)] uppercase tracking-wide mb-1">Permanent / COMELEC</p>
                <p class="text-sm font-semibold text-[var(--text-main)] leading-relaxed">{{ buildAddr(pInfo.comelecAddress) }}</p>
              </div>
              <div v-if="!pInfo.currentAddress && !pInfo.comelecAddress && pInfo.address">
                <p class="text-sm font-semibold text-[var(--text-main)] leading-relaxed">{{ buildAddr(pInfo.address) }}</p>
              </div>
            </div>

            <!-- Special Skills / Hobbies -->
            <div v-if="skills.length > 0" class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4">
              <p class="text-xs font-black text-[var(--color-primary)] uppercase tracking-widest mb-3 flex items-center gap-2"><i class="pi pi-star text-xs"></i> Special Skills &amp; Hobbies</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="s in skills" :key="s" class="text-sm font-semibold px-3 py-1 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">{{ s }}</span>
              </div>
            </div>

            <!-- Non-Academic Distinctions -->
            <div v-if="distinctions.length > 0" class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4">
              <p class="text-xs font-black text-[var(--color-primary)] uppercase tracking-widest mb-3 flex items-center gap-2"><i class="pi pi-award text-xs"></i> Non-Academic Distinctions</p>
              <ul class="space-y-1.5">
                <li v-for="d in distinctions" :key="d" class="flex items-start gap-2 text-sm text-[var(--text-sub)]">
                  <i class="pi pi-check-circle text-[var(--color-primary)] text-xs mt-0.5 shrink-0"></i>{{ d }}
                </li>
              </ul>
            </div>

            <!-- Memberships -->
            <div v-if="memberships.length > 0" class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4">
              <p class="text-xs font-black text-[var(--color-primary)] uppercase tracking-widest mb-3 flex items-center gap-2"><i class="pi pi-users text-xs"></i> Memberships</p>
              <ul class="space-y-1.5">
                <li v-for="m in memberships" :key="m" class="flex items-start gap-2 text-sm text-[var(--text-sub)]">
                  <i class="pi pi-circle text-[var(--color-primary)] text-[9px] mt-1 shrink-0"></i>{{ m }}
                </li>
              </ul>
            </div>
          </template>

          <!-- ── EDUCATION ───────────────────────────────────────────────── -->
          <template v-else-if="profileTab === 'education'">
            <div v-if="!allEdu.length" class="text-center py-14 text-[var(--text-faint)] text-sm">No education records on file</div>
            <div v-for="(edu, i) in allEdu" :key="i" class="rounded-2xl border p-4 transition-all"
              :class="edu.isRelevant === false ? 'border-red-200 bg-red-50/60' : 'border-[var(--border-main)] bg-[var(--surface)]'">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-extrabold uppercase leading-tight" :class="edu.isRelevant === false ? 'text-red-500 line-through opacity-75' : 'text-[var(--text-main)]'">{{ edu.degree || '—' }}</p>
                  <p class="text-sm text-[var(--text-muted)] mt-0.5">{{ edu.school || '—' }}</p>
                </div>
                <span class="flex-shrink-0 text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg border"
                  :class="edu.isRelevant === false ? 'bg-red-100 text-red-600 border-red-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'">
                  {{ edu.isRelevant === false ? 'Irrelevant' : 'Relevant' }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                <div v-for="[l,v] in [['Graduated',edu.yearGraduated||edu.periodTo||'—'],['Year From',edu.periodFrom||'—'],['Units Earned',edu.unitsEarned||'—'],['Honors',edu.honorsReceived||'—']]" :key="l" v-if="v && v !== '—'">
                  <p class="text-xs text-[var(--text-faint)] font-semibold uppercase tracking-wide">{{ l }}</p>
                  <p class="text-sm font-bold text-[var(--text-main)] mt-0.5">{{ v }}</p>
                </div>
              </div>
              <div v-if="edu.auditRemarks" class="mb-3 flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <i class="pi pi-comment text-amber-500 text-sm shrink-0 mt-0.5"></i>
                <div><p class="text-xs font-black text-amber-600 uppercase tracking-wider">HR Verifier Note</p><p class="text-sm text-amber-700 leading-snug mt-0.5">{{ edu.auditRemarks }}</p></div>
              </div>
              <div class="mb-3">
                <p class="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-1.5"><i class="pi pi-pencil mr-1"></i>Evaluator Note</p>
                <textarea v-model="edu.evaluatorNote" @blur="saveApplicantData" rows="2" placeholder="Add your interview observation..."
                  class="w-full text-sm bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl px-3 py-2 outline-none focus:border-[var(--color-primary)] resize-none transition-colors placeholder:text-[var(--text-faint)]" />
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <button v-if="edu.isRelevant === false" @click="restoreItem(edu)" :disabled="savingProfile"
                  class="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-60">
                  <i class="pi pi-undo text-xs"></i> Restore
                </button>
                <button v-if="edu.tor" @click="viewDoc(edu.tor, `${edu.school || 'Education'} — TOR`)"
                  class="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 transition-colors">
                  <i class="pi pi-file text-xs"></i> TOR
                </button>
                <button v-if="edu.diploma" @click="viewDoc(edu.diploma, `${edu.school || 'Education'} — Diploma`)"
                  class="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 transition-colors">
                  <i class="pi pi-file text-xs"></i> Diploma
                </button>
                <span v-if="!edu.tor && !edu.diploma" class="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-[var(--border-main)] bg-[var(--bg-app)] text-sm font-semibold text-[var(--text-faint)] cursor-default">
                  <i class="pi pi-file text-xs"></i> No Document
                </span>
              </div>
            </div>
          </template>

          <!-- ── ELIGIBILITY ─────────────────────────────────────────────── -->
          <template v-else-if="profileTab === 'eligibility'">
            <div v-if="!allElig.length" class="text-center py-14 text-[var(--text-faint)] text-sm">No eligibility records on file</div>
            <div v-for="(el, i) in allElig" :key="i" class="rounded-2xl border p-4 transition-all"
              :class="el.isRelevant === false ? 'border-red-300 bg-red-50/70' : 'border-[var(--border-main)] bg-[var(--surface)]'">

              <!-- Header row -->
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-extrabold uppercase leading-tight"
                    :class="el.isRelevant === false ? 'text-red-500 line-through' : 'text-[var(--text-main)]'">
                    {{ el.name || '—' }}
                  </p>
                  <p v-if="el.type" class="text-xs font-semibold mt-0.5"
                    :class="el.isRelevant === false ? 'text-red-400 line-through' : 'text-[var(--text-muted)]'">
                    {{ el.type }}
                  </p>
                </div>
                <span class="flex-shrink-0 text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg border"
                  :class="el.isRelevant === false ? 'bg-red-100 text-red-600 border-red-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'">
                  {{ el.isRelevant === false ? 'Irrelevant' : 'Relevant' }}
                </span>
              </div>

              <!-- Details grid — always shown, strikethrough + red when irrelevant -->
              <div class="grid grid-cols-2 gap-x-4 gap-y-3 mb-3"
                :class="el.isRelevant === false ? 'opacity-80' : ''">
                <div v-for="[l, v] in [
                  ['Rating (%)',        el.rating          || '—'],
                  ['License / Cert No.', el.licenseNumber  || '—'],
                  ['Date of Exam',      formatFull(el.dateOfExam)],
                  ['License Validity',  formatFull(el.licenseValidity)],
                  ['Place of Exam',     el.placeOfExam     || '—'],
                ]" :key="l">
                  <p class="text-xs font-semibold uppercase tracking-wide"
                    :class="el.isRelevant === false ? 'text-red-300' : 'text-[var(--text-faint)]'">{{ l }}</p>
                  <p class="text-sm font-bold mt-0.5"
                    :class="el.isRelevant === false ? 'text-red-500 line-through' : 'text-[var(--text-main)]'">{{ v }}</p>
                </div>
              </div>

              <!-- HR Verifier note -->
              <div v-if="el.auditRemarks" class="mb-3 flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <i class="pi pi-comment text-amber-500 text-sm shrink-0 mt-0.5"></i>
                <div>
                  <p class="text-xs font-black text-amber-600 uppercase tracking-wider">HR Verifier Note</p>
                  <p class="text-sm text-amber-700 leading-snug mt-0.5">{{ el.auditRemarks }}</p>
                </div>
              </div>

              <!-- Evaluator note -->
              <div class="mb-3">
                <p class="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-1.5"><i class="pi pi-pencil mr-1"></i>Evaluator Note</p>
                <textarea v-model="el.evaluatorNote" @blur="saveApplicantData" rows="2" placeholder="Add your interview observation..."
                  class="w-full text-sm bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl px-3 py-2 outline-none focus:border-[var(--color-primary)] resize-none transition-colors placeholder:text-[var(--text-faint)]" />
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 flex-wrap">
                <button v-if="el.isRelevant === false" @click="restoreItem(el)" :disabled="savingProfile"
                  class="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-60">
                  <i class="pi pi-undo text-xs"></i> Restore
                </button>
                <button v-if="el.document" @click="viewDoc(el.document, (el.name || el.type || 'Eligibility') + ' — Rating Certificate')"
                  class="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 transition-colors">
                  <i class="pi pi-file text-xs"></i> Rating Cert
                </button>
                <span v-else class="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-[var(--border-main)] bg-[var(--bg-app)] text-sm font-semibold text-[var(--text-faint)] cursor-default">
                  <i class="pi pi-file text-xs"></i> No Cert
                </span>
                <button v-if="el.licenseDocument" @click="viewDoc(el.licenseDocument, (el.name || el.type || 'Eligibility') + ' — License ID')"
                  class="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 transition-colors">
                  <i class="pi pi-id-card text-xs"></i> License ID
                </button>
                <span v-else class="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-[var(--border-main)] bg-[var(--bg-app)] text-sm font-semibold text-[var(--text-faint)] cursor-default">
                  <i class="pi pi-id-card text-xs"></i> No License
                </span>
              </div>
            </div>
          </template>

          <!-- ── EXPERIENCE ──────────────────────────────────────────────── -->
          <template v-else-if="profileTab === 'experience'">
            <div v-if="!allExp.length" class="text-center py-14 text-[var(--text-faint)] text-sm">No work experience records</div>
            <div v-for="(exp, i) in allExp" :key="i" class="rounded-2xl border p-4 transition-all"
              :class="exp.isRelevant === false ? 'border-red-200 bg-red-50/60' : 'border-[var(--border-main)] bg-[var(--surface)]'">
              <div class="flex items-start justify-between gap-3 mb-1">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-extrabold uppercase leading-tight" :class="exp.isRelevant === false ? 'text-red-500 line-through opacity-75' : 'text-[var(--text-main)]'">{{ exp.position || '—' }}</p>
                  <p class="text-sm text-[var(--text-muted)] mt-0.5">{{ exp.company || '—' }}</p>
                  <p class="text-xs font-bold text-[var(--color-primary)] mt-0.5">{{ formatDate(exp.periodFrom) }} — {{ exp.isPresent ? 'Present' : formatDate(exp.periodTo) }}</p>
                </div>
                <span class="flex-shrink-0 text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg border mt-0.5"
                  :class="exp.isRelevant === false ? 'bg-red-100 text-red-600 border-red-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'">
                  {{ exp.isRelevant === false ? 'Irrelevant' : 'Relevant' }}
                </span>
              </div>
              <div class="grid grid-cols-3 gap-x-4 gap-y-2 mt-3 mb-3">
                <div v-for="[l,v] in [['Salary / Grade',exp.monthlySalary||exp.salaryGrade||'—'],['Appt. Status',str(exp.statusOfAppointment||exp.appointmentStatus||exp.status)],['Service Type',exp.serviceType||'—']]" :key="l">
                  <p class="text-xs text-[var(--text-faint)] font-semibold uppercase tracking-wide">{{ l }}</p>
                  <p class="text-sm font-bold text-[var(--text-main)] mt-0.5">{{ v }}</p>
                </div>
              </div>
              <!-- Key Responsibilities -->
              <div v-if="exp.keyResponsibilities || exp.responsibilities" class="mb-3 p-3 bg-[var(--bg-app)] rounded-xl border border-[var(--border-main)]">
                <p class="text-xs font-black text-[var(--color-primary)] uppercase tracking-wider mb-2"><i class="pi pi-list-check mr-1"></i>Key Responsibilities</p>
                <ul class="space-y-1.5">
                  <li v-for="(r, ri) in (Array.isArray(exp.keyResponsibilities || exp.responsibilities) ? (exp.keyResponsibilities || exp.responsibilities) : String(exp.keyResponsibilities || exp.responsibilities).split('\n').filter(Boolean))" :key="ri"
                    class="flex items-start gap-2 text-sm text-[var(--text-sub)] leading-snug">
                    <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0"></span>
                    <span>{{ typeof r === 'object' ? str(r) : r }}</span>
                  </li>
                </ul>
              </div>
              <div v-if="exp.auditRemarks" class="mb-3 flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <i class="pi pi-comment text-amber-500 text-sm shrink-0 mt-0.5"></i>
                <div><p class="text-xs font-black text-amber-600 uppercase tracking-wider">HR Verifier Note</p><p class="text-sm text-amber-700 leading-snug mt-0.5">{{ exp.auditRemarks }}</p></div>
              </div>
              <div class="mb-3">
                <p class="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-1.5"><i class="pi pi-pencil mr-1"></i>Evaluator Note</p>
                <textarea v-model="exp.evaluatorNote" @blur="saveApplicantData" rows="2" placeholder="Add your interview observation..."
                  class="w-full text-sm bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl px-3 py-2 outline-none focus:border-[var(--color-primary)] resize-none transition-colors placeholder:text-[var(--text-faint)]" />
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <button v-if="exp.isRelevant === false" @click="restoreItem(exp)" :disabled="savingProfile"
                  class="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-60">
                  <i class="pi pi-undo text-xs"></i> Restore
                </button>
                <button v-if="exp.document" @click="viewDoc(exp.document, (exp.position || 'Experience') + ' — COE')"
                  class="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 transition-colors">
                  <i class="pi pi-file text-xs"></i> COE
                </button>
                <span v-else class="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-[var(--border-main)] bg-[var(--bg-app)] text-sm font-semibold text-[var(--text-faint)] cursor-default">
                  <i class="pi pi-file text-xs"></i> No Document
                </span>
              </div>
            </div>
          </template>

          <!-- ── TRAINING ────────────────────────────────────────────────── -->
          <template v-else-if="profileTab === 'training'">
            <div v-if="!allTrn.length" class="text-center py-14 text-[var(--text-faint)] text-sm">No training records on file</div>
            <div v-for="(trn, i) in allTrn" :key="i" class="rounded-2xl border p-4 transition-all"
              :class="trn.isRelevant === false ? 'border-red-200 bg-red-50/60' : 'border-[var(--border-main)] bg-[var(--surface)]'">
              <div class="flex items-start justify-between gap-3 mb-3">
                <p class="text-sm font-extrabold uppercase leading-tight flex-1" :class="trn.isRelevant === false ? 'text-red-500 line-through opacity-75' : 'text-[var(--text-main)]'">{{ trn.title || '—' }}</p>
                <span class="flex-shrink-0 text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg border"
                  :class="trn.isRelevant === false ? 'bg-red-100 text-red-600 border-red-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'">
                  {{ trn.isRelevant === false ? 'Irrelevant' : 'Relevant' }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                <div v-for="[l,v] in [['Hours',trn.hours ? trn.hours+' hrs' : '—'],['Type / Level',trn.typeOfLD||trn.level||'—'],['Provider',str(trn.provider||trn.conductedBy)],['Date Issued',formatDate(trn.dateIssued)]]" :key="l" v-if="v && v !== '—'">
                  <p class="text-xs text-[var(--text-faint)] font-semibold uppercase tracking-wide">{{ l }}</p>
                  <p class="text-sm font-bold text-[var(--text-main)] mt-0.5 leading-snug">{{ v }}</p>
                </div>
              </div>
              <div v-if="trn.auditRemarks" class="mb-3 flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <i class="pi pi-comment text-amber-500 text-sm shrink-0 mt-0.5"></i>
                <div><p class="text-xs font-black text-amber-600 uppercase tracking-wider">HR Verifier Note</p><p class="text-sm text-amber-700 leading-snug mt-0.5">{{ trn.auditRemarks }}</p></div>
              </div>
              <div class="mb-3">
                <p class="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-1.5"><i class="pi pi-pencil mr-1"></i>Evaluator Note</p>
                <textarea v-model="trn.evaluatorNote" @blur="saveApplicantData" rows="2" placeholder="Add your interview observation..."
                  class="w-full text-sm bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl px-3 py-2 outline-none focus:border-[var(--color-primary)] resize-none transition-colors placeholder:text-[var(--text-faint)]" />
              </div>
              <div class="flex items-center gap-2">
                <button v-if="trn.isRelevant === false" @click="restoreItem(trn)" :disabled="savingProfile"
                  class="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-60">
                  <i class="pi pi-undo text-xs"></i> Restore
                </button>
                <button v-if="trn.document" @click="viewDoc(trn.document, trn.title || 'Training')"
                  class="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 transition-colors">
                  <i class="pi pi-file text-xs"></i> Certificate
                </button>
                <span v-else class="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-[var(--border-main)] bg-[var(--bg-app)] text-sm font-semibold text-[var(--text-faint)] cursor-default">
                  <i class="pi pi-file text-xs"></i> No Document
                </span>
              </div>
            </div>
          </template>

          <!-- ── OTHERS ──────────────────────────────────────────────────── -->
          <template v-else-if="profileTab === 'others'">
            <!-- Voluntary Work -->
            <div>
              <p class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest mb-3 flex items-center gap-2"><i class="pi pi-heart-fill text-[var(--color-primary)]"></i> Voluntary Work</p>
              <div v-if="!voluntary.length" class="text-sm text-[var(--text-faint)] italic py-3">None listed</div>
              <div v-for="(v, i) in voluntary" :key="i" class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4 mb-3">
                <p class="text-sm font-bold text-[var(--text-main)] uppercase">{{ v.organization || '—' }}</p>
                <p class="text-sm text-[var(--text-muted)] mt-0.5">{{ v.position || '—' }}</p>
                <div class="flex gap-4 mt-2 text-xs text-[var(--text-faint)] font-semibold">
                  <span>{{ formatDate(v.periodFrom) }} — {{ formatDate(v.periodTo) }}</span>
                  <span v-if="v.hours">{{ v.hours }} hours</span>
                </div>
              </div>
            </div>

            <div class="h-px bg-[var(--border-main)]"></div>

            <!-- Special Skills -->
            <div>
              <p class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest mb-3 flex items-center gap-2"><i class="pi pi-star text-[var(--color-primary)]"></i> Special Skills &amp; Hobbies</p>
              <div v-if="!skills.length" class="text-sm text-[var(--text-faint)] italic py-3">None listed</div>
              <div v-else class="flex flex-wrap gap-2">
                <span v-for="s in skills" :key="s" class="text-sm font-semibold px-3 py-1.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">{{ s }}</span>
              </div>
            </div>

            <div class="h-px bg-[var(--border-main)]"></div>

            <!-- Non-Academic Distinctions -->
            <div>
              <p class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest mb-3 flex items-center gap-2"><i class="pi pi-award text-[var(--color-primary)]"></i> Non-Academic Distinctions</p>
              <div v-if="!distinctions.length" class="text-sm text-[var(--text-faint)] italic py-3">None listed</div>
              <ul v-else class="space-y-2">
                <li v-for="d in distinctions" :key="d" class="flex items-start gap-2 text-sm text-[var(--text-sub)]">
                  <i class="pi pi-check-circle text-[var(--color-primary)] text-sm shrink-0 mt-0.5"></i>{{ d }}
                </li>
              </ul>
            </div>

            <div class="h-px bg-[var(--border-main)]"></div>

            <!-- Memberships -->
            <div>
              <p class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest mb-3 flex items-center gap-2"><i class="pi pi-users text-[var(--color-primary)]"></i> Memberships in Organizations</p>
              <div v-if="!memberships.length" class="text-sm text-[var(--text-faint)] italic py-3">None listed</div>
              <ul v-else class="space-y-2">
                <li v-for="m in memberships" :key="m" class="flex items-start gap-2 text-sm text-[var(--text-sub)]">
                  <i class="pi pi-circle text-[var(--color-primary)] text-xs shrink-0 mt-1"></i>{{ m }}
                </li>
              </ul>
            </div>
          </template>

          <!-- ── FAMILY ──────────────────────────────────────────────────── -->
          <template v-else-if="profileTab === 'family'">
            <div v-if="!familyData.spouse && !(familyData.children||[]).length && !familyData.father && !familyData.mother"
              class="text-center py-14 text-[var(--text-faint)] text-sm">No family information on file</div>

            <!-- Spouse -->
            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4">
              <p class="text-sm font-black text-[var(--color-primary)] uppercase tracking-widest mb-3 flex items-center gap-2"><i class="pi pi-heart"></i> Spouse</p>
              <p class="text-base font-bold text-[var(--text-main)] uppercase mb-3">{{ buildName(familyData.spouse) }}</p>
              <div class="grid grid-cols-2 gap-3">
                <div v-for="[l,v] in [
                  ['Occupation',       str(familyData.spouse?.occupation)],
                  ['Employer',         str(familyData.spouse?.employer)],
                  ['Business Address', str(familyData.spouse?.businessAddress)],
                  ['Phone',            str(familyData.spouse?.phone)],
                ]" :key="l" v-if="v && v !== '—'">
                  <p class="text-xs text-[var(--text-faint)] font-semibold uppercase tracking-wide">{{ l }}</p>
                  <p class="text-sm font-bold text-[var(--text-main)] mt-0.5">{{ v }}</p>
                </div>
              </div>
              <p v-if="buildName(familyData.spouse) === '—'" class="text-sm text-[var(--text-faint)] italic">No spouse information</p>
            </div>

            <!-- Children -->
            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4">
              <p class="text-sm font-black text-[var(--color-primary)] uppercase tracking-widest mb-3 flex items-center gap-2">
                <i class="pi pi-users"></i> Children ({{ (familyData.children||[]).length }})
              </p>
              <div v-if="!(familyData.children||[]).length" class="text-sm text-[var(--text-faint)] italic">No children listed</div>
              <div v-else class="space-y-2">
                <div v-for="(c, ci) in (familyData.children||[])" :key="ci"
                  class="flex items-center justify-between px-4 py-3 bg-[var(--bg-app)] rounded-xl border border-[var(--border-main)]">
                  <div>
                    <p class="text-sm font-bold text-[var(--text-main)] uppercase">{{ buildName(c) }}</p>
                    <p v-if="c.birthDate" class="text-xs text-[var(--text-muted)] mt-0.5">Born: {{ formatFull(c.birthDate) }}</p>
                  </div>
                  <span v-if="c.birthDate" class="text-sm font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] px-3 py-1 rounded-full shrink-0">
                    Age {{ new Date().getFullYear() - new Date(c.birthDate).getFullYear() }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Parents -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4">
                <p class="text-xs font-black text-[var(--text-faint)] uppercase tracking-widest mb-2">Father</p>
                <p class="text-sm font-bold text-[var(--text-main)] uppercase">{{ buildName(familyData.father) }}</p>
                <p v-if="familyData.father?.occupation" class="text-sm text-[var(--text-muted)] mt-1">{{ str(familyData.father.occupation) }}</p>
              </div>
              <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4">
                <p class="text-xs font-black text-[var(--text-faint)] uppercase tracking-widest mb-2">Mother</p>
                <p class="text-sm font-bold text-[var(--text-main)] uppercase">{{ buildName(familyData.mother) }}</p>
                <p v-if="familyData.mother?.occupation" class="text-sm text-[var(--text-muted)] mt-1">{{ str(familyData.mother.occupation) }}</p>
                <p v-if="familyData.mother?.maidenName" class="text-xs text-[var(--text-faint)] mt-0.5">({{ familyData.mother.maidenName }})</p>
              </div>
            </div>
          </template>

          <!-- ── REFERENCES ──────────────────────────────────────────────── -->
          <template v-else-if="profileTab === 'references'">
            <div v-if="!references.length" class="text-center py-14 text-[var(--text-faint)] text-sm">No character references on file</div>
            <div v-for="(ref, i) in references" :key="i"
              class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
                  <span class="text-sm font-black text-[var(--color-primary)]">{{ i + 1 }}</span>
                </div>
                <p class="text-base font-bold text-[var(--text-main)] uppercase">{{ ref.name || '—' }}</p>
              </div>
              <div class="space-y-2">
                <div v-if="ref.address">
                  <p class="text-xs text-[var(--text-faint)] font-semibold uppercase tracking-wide">Address</p>
                  <p class="text-sm font-semibold text-[var(--text-main)] mt-0.5">{{ ref.address }}</p>
                </div>
                <div v-if="ref.phone">
                  <p class="text-xs text-[var(--text-faint)] font-semibold uppercase tracking-wide">Contact No.</p>
                  <p class="text-sm font-semibold text-[var(--text-main)] mt-0.5">{{ ref.phone }}</p>
                </div>
              </div>
            </div>
          </template>

          <!-- ── CSC Q&A ─────────────────────────────────────────────────── -->
          <template v-else-if="profileTab === 'csc'">
            <div class="flex items-start gap-3 p-4 bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 rounded-2xl mb-1">
              <i class="pi pi-shield text-[var(--color-primary)] text-lg shrink-0 mt-0.5"></i>
              <p class="text-sm text-[var(--color-primary-dark)] font-semibold leading-relaxed">CSC Personal Data Sheet — Questions 34 to 40. These disclosures are important for eligibility and integrity screening.</p>
            </div>
            <div v-for="q in PDS_QUESTIONS" :key="q.group" class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4">
              <p class="text-xs font-black text-[var(--color-primary)] uppercase tracking-widest mb-3 flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-[var(--color-primary)] text-white text-xs font-black flex items-center justify-center shrink-0">{{ q.group }}</span>
                {{ q.label }}
              </p>
              <div class="space-y-3">
                <div v-for="p in q.parts" :key="p.key" class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                    :class="pdsQ[p.key] === true ? 'bg-rose-100 border-rose-200 text-rose-600' : pdsQ[p.key] === false ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-[var(--bg-app)] border-[var(--border-main)] text-[var(--text-faint)]'">
                    <i :class="['pi text-sm', pdsQ[p.key] === true ? 'pi-times-circle' : pdsQ[p.key] === false ? 'pi-check-circle' : 'pi-minus']"></i>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm text-[var(--text-sub)] leading-relaxed">{{ p.text }}</p>
                    <span class="text-xs font-black uppercase tracking-widest mt-1 inline-block"
                      :class="pdsQ[p.key] === true ? 'text-rose-600' : pdsQ[p.key] === false ? 'text-emerald-600' : 'text-[var(--text-faint)]'">
                      {{ pdsQ[p.key] === true ? 'YES' : pdsQ[p.key] === false ? 'NO' : 'Not Answered' }}
                    </span>
                  </div>
                </div>
                <div v-if="pdsQ[q.detailKey]" class="mt-2 ml-11 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <p class="text-xs font-black text-rose-600 uppercase tracking-wider mb-1">Details</p>
                  <p class="text-sm text-rose-800 leading-relaxed">{{ pdsQ[q.detailKey] }}</p>
                </div>
              </div>
            </div>
          </template>

          <!-- ── DOCUMENTS ───────────────────────────────────────────────── -->
          <template v-else-if="profileTab === 'documents'">
            <div v-if="!allDocs.length" class="text-center py-14 text-[var(--text-faint)] text-sm">No uploaded documents found</div>
            <template v-else>
              <div v-for="(docs, group) in docGroups" :key="group" class="mb-2">
                <p class="text-xs font-black text-[var(--text-faint)] uppercase tracking-widest mb-2 px-1">{{ group }}</p>
                <div class="space-y-2">
                  <button v-for="doc in docs" :key="doc.url" @click="viewDoc(doc.url, doc.label)"
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border-main)] bg-[var(--surface)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary-light)] transition-all text-left group">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      :class="isDocPdf(doc.url) ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-600'">
                      <i :class="['pi text-base', isDocPdf(doc.url) ? 'pi-file-pdf' : 'pi-image']"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-bold text-[var(--text-main)] truncate group-hover:text-[var(--color-primary)] transition-colors">{{ doc.label }}</p>
                      <p class="text-xs text-[var(--text-faint)]">Click to preview</p>
                    </div>
                    <i class="pi pi-eye text-sm text-[var(--text-faint)] group-hover:text-[var(--color-primary)] transition-colors shrink-0"></i>
                  </button>
                </div>
              </div>
            </template>
          </template>

        </div>

        <!-- Save indicator -->
        <div v-if="savingProfile" class="px-5 py-2 bg-[var(--color-primary-light)] border-t border-[var(--border-main)] flex items-center gap-2 flex-shrink-0">
          <i class="pi pi-spin pi-spinner text-[var(--color-primary)] text-sm"></i>
          <span class="text-sm text-[var(--color-primary)] font-bold">Saving profile changes...</span>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════════════
           RIGHT: Scoring Rubric
      ════════════════════════════════════════════════════════════ -->
      <div class="flex-1 flex flex-col overflow-hidden" style="min-width:0">

        <!-- Rubric header strip -->
        <div class="flex-shrink-0 px-6 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)] flex items-center justify-between">
          <div class="flex items-center gap-3">
            <i class="pi pi-list-check text-[var(--color-primary)]"></i>
            <span class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">Scoring Rubric</span>
            <span v-if="rubric" class="text-xs text-[var(--text-muted)]">{{ rubric.title }}</span>
          </div>
          <div class="flex items-center gap-4 text-xs font-bold">
            <span class="text-[var(--text-faint)]">Part A: <span class="text-[var(--color-primary)]">{{ totalA.toFixed(1) }} / {{ maxA }}</span></span>
            <span class="text-[var(--text-faint)]">Part B: <span class="text-[var(--color-primary)]">{{ totalB.toFixed(1) }} / {{ maxB }}</span></span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-app)]/20">
          <!-- Loading -->
          <div v-if="loadingRubric" class="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-faint)]">
            <i class="pi pi-spin pi-spinner text-2xl text-[var(--color-primary)]"></i>
            <p class="text-sm font-bold uppercase tracking-widest">Loading Rubric...</p>
          </div>
          <!-- No rubric -->
          <div v-else-if="!rubric" class="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-faint)] p-12 text-center">
            <i class="pi pi-exclamation-triangle text-4xl text-amber-400"></i>
            <p class="text-base font-bold text-[var(--text-main)]">No Rubric Configured</p>
            <p class="text-sm leading-relaxed">A rubric for the <strong>{{ trackMeta.label }}</strong> has not been set up yet. Go to <strong>Settings &rarr; Rubrics</strong> to create one.</p>
          </div>
          <template v-else>
            <div class="max-w-3xl mx-auto p-8 space-y-10">

              <!-- Instruction banner -->
              <div class="flex items-start gap-3 p-4 bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 rounded-2xl">
                <i class="pi pi-info-circle text-[var(--color-primary)] mt-0.5 shrink-0 text-lg"></i>
                <p class="text-sm text-[var(--color-primary-dark)] font-semibold leading-relaxed">
                  Evaluate using the <strong>{{ rubric.title || trackMeta.label }} Rubric</strong> ({{ rubric.description || 'DepEd DO 007, s. 2023' }}).
                  Review credentials in the profile panel, then score based on BEI evidence and background documentation.
                </p>
              </div>

              <!-- ── PART A ── -->
              <section v-if="partACriteria.length">
                <div class="flex items-center justify-between mb-5">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                      <span class="text-white text-sm font-black">A</span>
                    </div>
                    <div>
                      <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">Part A — Background Factors</h3>
                      <p class="text-xs text-[var(--text-muted)]">Scored from submitted credentials and records</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-xs font-bold uppercase text-[var(--text-faint)]">Part A Total</p>
                    <p class="text-xl font-black tabular-nums" :class="totalA > maxA ? 'text-red-500' : 'text-[var(--color-primary)]'">
                      {{ totalA.toFixed(1) }} <span class="text-sm text-[var(--text-faint)] font-bold">/ {{ maxA }}</span>
                    </p>
                  </div>
                </div>
                <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-sm">
                  <div class="grid grid-cols-12 px-5 py-3 bg-[var(--bg-app)] border-b border-[var(--border-main)] text-xs font-black uppercase tracking-widest text-[var(--text-faint)]">
                    <div class="col-span-6">Criterion</div>
                    <div class="col-span-2 text-center">Max</div>
                    <div class="col-span-2 text-center">Score</div>
                    <div class="col-span-2 text-center">Remarks</div>
                  </div>
                  <div class="divide-y divide-[var(--border-main)]">
                    <div v-for="c in partACriteria" :key="c.globalIndex"
                      class="grid grid-cols-12 px-5 py-4 items-center transition-colors"
                      :class="[status === 'submitted' ? 'bg-[var(--bg-app)]/30' : 'hover:bg-[var(--bg-app)]/50', overflowIndices.has(c.globalIndex) ? 'bg-red-50' : '']">
                      <div class="col-span-6"><p class="text-sm font-bold text-[var(--text-main)]">{{ c.label }}</p></div>
                      <div class="col-span-2 text-center"><span class="text-sm font-black text-[var(--text-faint)]">{{ c.maxPoints }}</span></div>
                      <div class="col-span-2 flex justify-center">
                        <div class="flex items-center bg-[var(--bg-app)] border rounded-lg px-2 py-1.5"
                          :class="overflowIndices.has(c.globalIndex) ? 'border-red-300 bg-red-50' : 'border-[var(--border-main)]'">
                          <input type="number" :min="0" :max="c.maxPoints" step="0.5" :disabled="status === 'submitted'"
                            v-model="scores[c.globalIndex].score" @change="clampScore(c.globalIndex)"
                            class="w-12 text-center text-base font-black bg-transparent border-none outline-none tabular-nums disabled:opacity-60" />
                        </div>
                      </div>
                      <div class="col-span-2 flex justify-center">
                        <input type="text" :disabled="status === 'submitted'" v-model="scores[c.globalIndex].remarks" placeholder="Note..."
                          class="w-full text-sm bg-[var(--bg-app)] border border-[var(--border-main)] rounded-lg px-2 py-1 outline-none focus:border-[var(--color-primary)] disabled:opacity-60 transition-colors" />
                      </div>
                    </div>
                  </div>
                  <div class="px-5 py-3.5 bg-[var(--bg-app)] border-t border-[var(--border-main)] flex items-center justify-between">
                    <span class="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Part A Subtotal</span>
                    <span class="text-base font-black tabular-nums" :class="totalA > maxA ? 'text-red-500' : 'text-[var(--color-primary)]'">{{ totalA.toFixed(1) }} / {{ maxA }}</span>
                  </div>
                </div>
              </section>

              <!-- ── PART B ── -->
              <section v-if="partBCriteria.length">
                <div class="flex items-center justify-between mb-5">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-[var(--color-navy)] flex items-center justify-center">
                      <span class="text-white text-sm font-black">B</span>
                    </div>
                    <div>
                      <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">Part B — Potential Assessment</h3>
                      <p class="text-xs text-[var(--text-muted)]">Panel interview, demo teaching, and BEI criteria</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-xs font-bold uppercase text-[var(--text-faint)]">Part B Total</p>
                    <p class="text-xl font-black tabular-nums" :class="totalB > maxB ? 'text-red-500' : 'text-[var(--color-primary)]'">
                      {{ totalB.toFixed(1) }} <span class="text-sm text-[var(--text-faint)] font-bold">/ {{ maxB }}</span>
                    </p>
                  </div>
                </div>
                <div class="space-y-4">
                  <div v-for="c in partBCriteria" :key="c.globalIndex"
                    class="bg-[var(--surface)] border rounded-2xl p-5 shadow-sm transition-all"
                    :class="[status === 'submitted' ? 'opacity-75' : 'hover:border-[var(--color-primary)]/40', overflowIndices.has(c.globalIndex) ? 'border-red-300 bg-red-50/30' : 'border-[var(--border-main)]']">
                    <div class="flex items-start justify-between gap-4 mb-4">
                      <div class="flex-1">
                        <p class="text-base font-black text-[var(--text-main)] uppercase tracking-tight">{{ c.label }}</p>
                        <p v-if="overflowIndices.has(c.globalIndex)" class="text-sm font-bold text-red-500 mt-1">
                          <i class="pi pi-exclamation-triangle mr-1"></i>Score exceeds maximum of {{ c.maxPoints }}
                        </p>
                      </div>
                      <div class="flex items-center bg-[var(--bg-app)] border rounded-2xl px-4 py-2 shrink-0"
                        :class="overflowIndices.has(c.globalIndex) ? 'border-red-300' : 'border-[var(--border-main)]'">
                        <input type="number" :min="0" :max="c.maxPoints" step="0.5" :disabled="status === 'submitted'"
                          v-model="scores[c.globalIndex].score" @change="clampScore(c.globalIndex)"
                          class="w-16 text-center text-2xl font-black bg-transparent border-none outline-none tabular-nums disabled:opacity-60" />
                        <span class="text-sm font-black text-[var(--text-faint)] ml-1">/ {{ c.maxPoints }}</span>
                      </div>
                    </div>
                    <div class="h-2 bg-[var(--bg-app)] rounded-full overflow-hidden mb-4 border border-[var(--border-main)]/40">
                      <div class="h-full rounded-full transition-all duration-300"
                        :class="overflowIndices.has(c.globalIndex) ? 'bg-red-500' : 'bg-[var(--color-primary)]'"
                        :style="{ width: `${Math.min(100, ((Number(scores[c.globalIndex]?.score) || 0) / c.maxPoints) * 100)}%` }"></div>
                    </div>
                    <AppTextarea v-model="scores[c.globalIndex].remarks"
                      :placeholder="`BEI evidence and behavioral observations for '${c.label}'...`"
                      :rows="3" :disabled="status === 'submitted'" class="text-sm font-medium" />
                  </div>
                </div>
                <div class="mt-4 px-5 py-4 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl flex items-center justify-between shadow-sm">
                  <span class="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Part B Subtotal</span>
                  <span class="text-base font-black tabular-nums" :class="totalB > maxB ? 'text-red-500' : 'text-[var(--color-primary)]'">{{ totalB.toFixed(1) }} / {{ maxB }}</span>
                </div>
              </section>

              <!-- Overall Remarks -->
              <div class="border-t border-[var(--border-main)] pt-8">
                <p class="text-sm font-black uppercase tracking-widest text-[var(--text-faint)] mb-3">Overall Assessment &amp; Recommendation</p>
                <AppTextarea v-model="overallRemarks" placeholder="Final panelist notes, overall impression, and recommendation..." :rows="5" :disabled="status === 'submitted'" class="font-medium text-sm" />
              </div>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="flex-shrink-0 border-t border-[var(--border-main)] bg-[var(--surface)] z-10">
          <div class="h-1.5 bg-[var(--bg-app)]">
            <div class="h-full transition-all duration-500"
              :class="hasOverflow ? 'bg-red-500' : grandTotal >= maxTotal * 0.75 ? 'bg-emerald-500' : 'bg-[var(--color-primary)]'"
              :style="{ width: `${scorePercent}%` }"></div>
          </div>
          <div class="px-6 py-4 flex items-center justify-between gap-6">
            <div class="flex items-center gap-6">
              <div v-if="partACriteria.length">
                <p class="text-xs font-black uppercase tracking-widest text-[var(--text-faint)]">Part A</p>
                <p class="text-lg font-black tabular-nums text-[var(--text-main)]">{{ totalA.toFixed(1) }}<span class="text-sm text-[var(--text-faint)] font-bold"> / {{ maxA }}</span></p>
              </div>
              <div v-if="partACriteria.length && partBCriteria.length" class="h-10 w-px bg-[var(--border-main)]"></div>
              <div v-if="partBCriteria.length">
                <p class="text-xs font-black uppercase tracking-widest text-[var(--text-faint)]">Part B</p>
                <p class="text-lg font-black tabular-nums text-[var(--text-main)]">{{ totalB.toFixed(1) }}<span class="text-sm text-[var(--text-faint)] font-bold"> / {{ maxB }}</span></p>
              </div>
              <div class="h-10 w-px bg-[var(--border-main)]"></div>
              <div>
                <p class="text-xs font-black uppercase tracking-widest text-[var(--text-faint)]">Grand Total</p>
                <p class="text-3xl font-black tabular-nums leading-none"
                  :class="hasOverflow ? 'text-red-500' : grandTotal >= maxTotal * 0.75 ? 'text-emerald-600' : 'text-[var(--color-primary)]'">
                  {{ grandTotal.toFixed(1) }}<span class="text-sm text-[var(--text-faint)] font-bold"> / {{ maxTotal }}</span>
                </p>
              </div>
              <div v-if="hasOverflow" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200">
                <i class="pi pi-exclamation-triangle text-red-500"></i>
                <span class="text-sm font-bold text-red-600">Score overflow — fix before submitting</span>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <template v-if="status === 'draft'">
                <AppButton variant="secondary" size="lg" @click="saveDraft" :loading="saving">Save Draft</AppButton>
                <AppButton variant="primary" size="lg" @click="finalizeSubmission" :loading="saving" :disabled="hasOverflow || !rubric">Submit Score</AppButton>
              </template>
              <template v-else>
                <AppButton variant="primary" size="lg" @click="exportIES"><i class="pi pi-download mr-2"></i>Export IES PDF</AppButton>
              </template>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ── Document Viewer (overlays DigitalIES via Teleport) ───────────── -->
    <AppFileViewer
      v-model="showFileViewer"
      :url="docPreviewUrl"
      :title="docPreviewLabel"
      @update:modelValue="v => { if (!v) clearDocPreview() }"
    />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-main); border-radius: 10px; }
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
</style>
