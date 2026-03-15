<script setup>
import { ref, computed } from 'vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const props = defineProps({
  app: { type: Object, required: true },
})
const emit = defineEmits(['close'])

// ── Derived data ─────────────────────────────────────────────────────────────
const code = computed(() => props.app.applicationCode || '—')

const fullName = computed(() => {
  const pi = props.app.applicantData?.personalInfo || {}
  return [pi.lastName, pi.firstName, pi.middleName].filter(Boolean).join(', ').toUpperCase() || 'N/A'
})

const firstName = computed(() => {
  const pi = props.app.applicantData?.personalInfo || {}
  return pi.firstName || 'Applicant'
})

const address = computed(() => {
  const pi = props.app.applicantData?.personalInfo || {}
  const addr = pi.currentAddress || pi.address || {}
  if (typeof addr === 'string') return addr
  if (addr.full) return addr.full
  const parts = [addr.street, addr.barangay, addr.city || addr.municipality, addr.province].filter(Boolean)
  return parts.join(', ') || 'Address on file'
})

const job      = computed(() => props.app.job || {})
const qs       = computed(() => job.value.qualifications || {})
const posTitle = computed(() => job.value.positionTitle || 'N/A')
const office   = computed(() => {
  const places = job.value.placeOfAssignment || []
  return places.length ? places.join(', ') : 'Schools Division of Guihulngan City'
})

const ad          = computed(() => props.app.applicantData || {})
const education   = computed(() => ad.value.education   || [])
const experience  = computed(() => ad.value.experience  || [])
const training    = computed(() => ad.value.training    || [])
const eligibility = computed(() => ad.value.eligibility || [])
const perf        = computed(() => ad.value.performanceRating || {})

// ── Qualification logic ───────────────────────────────────────────────────────
const isFinal = computed(() => !!props.app.isVerified)
const vc      = computed(() => props.app.verificationChecklist || {})
const verifier     = computed(() => props.app.verifiedBy?.username || 'HRMO Officer')
const verifiedDate = computed(() => props.app.verifiedAt
  ? new Date(props.app.verifiedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
  : today)

// Returns true if job QS says "None Required" for this field (auto-qualifies)
function qsNoneFor(field) {
  const val = qs.value[field]
  if (!val) return false
  if (Array.isArray(val)) return val.length === 0 || val.every(v => String(v).toLowerCase() === 'none required')
  return String(val).toLowerCase().includes('none required')
}

// Only relevant records count toward qualification
const eduOk  = computed(() => qsNoneFor('education')  || education.value.some(e => e.isRelevant !== false && (e.degree || '').trim()))
const expOk  = computed(() => qsNoneFor('experience')  || experience.value.some(e => e.isRelevant !== false && (e.position || '').trim()))
const trnOk  = computed(() => qsNoneFor('trainings')   || training.value.some(e => e.isRelevant !== false && (e.title || '').trim()))
const eligOk = computed(() => qsNoneFor('eligibility') || eligibility.value.some(e => e.isRelevant !== false && (e.type || e.name || '').trim()))
const perfOk = computed(() => {
  if (perf.value.notApplicable) return true
  const s = parseFloat(perf.value.score)
  return !isNaN(s) && s >= 3.5
})

const eduRemark  = computed(() => isFinal.value ? (vc.value.education?.checked  ? 'Qualified' : 'Disqualified') : (eduOk.value  ? 'Qualified' : 'Disqualified'))
const expRemark  = computed(() => isFinal.value ? (vc.value.experience?.checked ? 'Qualified' : 'Disqualified') : (expOk.value  ? 'Qualified' : 'Disqualified'))
const trnRemark  = computed(() => isFinal.value ? (vc.value.training?.checked   ? 'Qualified' : 'Disqualified') : (trnOk.value  ? 'Qualified' : 'Disqualified'))
const eligRemark = computed(() => isFinal.value ? (vc.value.eligibility?.checked? 'Qualified' : 'Disqualified') : (eligOk.value ? 'Qualified' : 'Disqualified'))
const perfRemark = computed(() => {
  if (!isFinal.value && perf.value.notApplicable) return 'N/A'
  return isFinal.value ? (vc.value.performance?.checked ? 'Met' : 'Not Met') : (perfOk.value ? 'Met' : 'Not Met')
})

const isQualified = computed(() => isFinal.value
  ? (vc.value.education?.checked && vc.value.experience?.checked && vc.value.training?.checked && vc.value.eligibility?.checked && (vc.value.performance?.checked || perf.value.notApplicable))
  : (eduOk.value && expOk.value && trnOk.value && eligOk.value && perfOk.value))

const annexLabel = computed(() => isQualified.value ? 'ANNEX E-1' : 'ANNEX F-1')

// ── Format helpers ────────────────────────────────────────────────────────────
const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })

// Item-based computeds — preserve isRelevant flag for per-item strikethrough in IER

// Education: {text, isRelevant} — null text filtered out
function fmtEdu(e) { return (e.degree || '').trim() || null }
const eduItems = computed(() =>
  education.value.map(e => ({ text: fmtEdu(e), isRelevant: e.isRelevant })).filter(i => i.text)
)

// Experience: group by position, sum months, track isRelevant per group
const expItems = computed(() => {
  const map = new Map()
  experience.value.forEach(e => {
    const pos = (e.position || '').trim()
    if (!pos) return
    if (!map.has(pos)) map.set(pos, { months: 0, isRelevant: e.isRelevant })
    const entry = map.get(pos)
    if (e.isRelevant === false) entry.isRelevant = false
    if (e.periodFrom) {
      const from = new Date(e.periodFrom)
      const to   = e.periodTo ? new Date(e.periodTo) : new Date()
      entry.months += Math.max(0, Math.round((to - from) / (1000 * 60 * 60 * 24 * 30.44)))
    }
  })
  return [...map.entries()].map(([pos, d]) => ({
    text: d.months > 0 ? `${pos} \u2013 ${d.months} month${d.months !== 1 ? 's' : ''}` : pos,
    isRelevant: d.isRelevant,
  }))
})

// Training: {text, isRelevant} — null text filtered out
function fmtTrn(t) {
  const title = (t.title || '').trim()
  if (!title) return null
  return [title, t.hours ? `${t.hours} Hours` : ''].filter(Boolean).join(' \u2013 ')
}
const trnItems = computed(() =>
  training.value.map(t => ({ text: fmtTrn(t), isRelevant: t.isRelevant })).filter(i => i.text)
)

// Eligibility: produce a display label — never returns null when a record exists
function fmtElig(e) {
  // Prefer user-entered specific name, then category, then license number
  const primary = (e.name || e.type || e.licenseNumber || '').trim()
  if (primary) return primary
  // Fallback: build from available metadata so no record goes invisible
  const parts = [
    e.rating     ? `Rating: ${e.rating}%` : '',
    e.placeOfExam ? `at ${e.placeOfExam}` : '',
    e.dateOfExam  ? new Date(e.dateOfExam).toLocaleDateString('en-PH', { year: 'numeric', month: 'short' }) : '',
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Eligibility Record'
}
// fmtElig always returns a non-empty string — no filter needed, every record shows
const eligItems = computed(() =>
  eligibility.value.map(e => ({ text: fmtElig(e), isRelevant: e.isRelevant }))
)

// For cellFontSize — join all texts
const eduText  = computed(() => eduItems.value.map(i => i.text).join('\n'))
const expText  = computed(() => expItems.value.map(i => i.text).join('\n'))
const trnText  = computed(() => trnItems.value.map(i => i.text).join('\n'))
const eligText = computed(() => eligItems.value.map(i => i.text).join('\n'))

function fmtPerf() {
  if (perf.value.notApplicable) return 'Not Applicable (Fresh Graduate / JO / COS)'
  if (!perf.value.score && !perf.value.periodCovered) return 'Not provided'
  const period = perf.value.periodCovered || ''
  const score  = perf.value.score || ''
  const adj    = perf.value.adjective || ''
  const detail = [score, adj].filter(Boolean).join(' ')
  return period ? `${period}: ${detail}` : detail
}

// Dynamic font-size for cells based on content length
function cellFontSize(text, base = 8.5) {
  const len = (text || '').length
  if (len > 300) return `font-size:${base - 2}pt`
  if (len > 180) return `font-size:${base - 1}pt`
  return `font-size:${base}pt`
}

// ── Page size: LONG / Legal 8.5" x 13" ───────────────────────────────────────
// 8.5 * 25.4 = 215.9 mm,  13 * 25.4 = 330.2 mm
const PAGE_W_MM = 215.9
const PAGE_H_MM = 330.2
// Preview: 8.5" at 96 dpi = 816 px
const PREVIEW_W_PX = 816

// ── Print / Download ──────────────────────────────────────────────────────────
const downloading = ref(false)
const ierRef      = ref(null)

async function downloadPdf() {
  downloading.value = true
  try {
    const el     = ierRef.value
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      height: el.scrollHeight,
      windowHeight: el.scrollHeight,
    })

    const pdf   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [PAGE_W_MM, PAGE_H_MM] })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()

    const pageHpx    = Math.floor(canvas.width * (pageH / pageW))
    const totalPages = Math.ceil(canvas.height / pageHpx)

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage()
      const srcY   = i * pageHpx
      const sliceH = Math.min(pageHpx, canvas.height - srcY)

      const slice = document.createElement('canvas')
      slice.width  = canvas.width
      slice.height = pageHpx
      const ctx = slice.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, slice.width, slice.height)
      ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH)

      pdf.addImage(slice.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, pageW, pageH)
    }

    pdf.save(`IER-${code.value}.pdf`)
  } finally {
    downloading.value = false
  }
}

function printIer() {
  const el  = ierRef.value
  const win = window.open('', '_blank', 'width=900,height=1300')
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8"/>
    <title>IER - ${code.value}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      @page { size:8.5in 13in portrait; margin:0; }
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    </style>
  </head><body>${el.outerHTML}</body></html>`)
  win.document.close()
  win.addEventListener('load', () => setTimeout(() => win.print(), 300))
}
</script>

<template>
  <div style="display:contents">
  <Teleport to="body">
  <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
    @click.self="emit('close')">

    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-zoom-in max-h-[96vh]">

      <!-- Toolbar -->
      <div class="px-5 py-3.5 border-b border-[var(--border-main)] flex items-center justify-between gap-3 flex-shrink-0 bg-[var(--bg-app)]">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center"
            :class="isQualified ? 'bg-emerald-600' : 'bg-red-500'">
            <i class="pi pi-file-edit text-white text-sm"></i>
          </div>
          <div>
            <p class="text-sm font-bold text-[var(--text-main)]">
              {{ isFinal ? 'Final' : 'Preliminary' }} Individual Evaluation Report
              <span class="ml-2 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                :class="isQualified ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'">
                {{ isQualified ? 'Qualified' : 'Not Qualified' }}
              </span>
            </p>
            <p class="text-xs text-[var(--text-muted)] font-mono">{{ code }} · {{ annexLabel }} · {{ isFinal ? 'Official' : 'Preliminary' }} · Long (8.5" × 13")</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="printIer"
            class="h-9 px-4 rounded-lg border border-[var(--border-main)] bg-[var(--surface)] hover:bg-[var(--bg-app)] text-[var(--text-main)] text-sm font-semibold transition-colors flex items-center gap-2">
            <i class="pi pi-print text-xs"></i> Print
          </button>
          <button @click="downloadPdf" :disabled="downloading"
            class="h-9 px-4 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center gap-2">
            <i :class="['pi text-xs', downloading ? 'pi-spin pi-spinner' : 'pi-download']"></i>
            {{ downloading ? 'Generating...' : 'Download PDF' }}
          </button>
          <button @click="emit('close')" class="h-9 w-9 rounded-lg border border-[var(--border-main)] bg-[var(--surface)] hover:bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <!-- Preview scroll -->
      <div class="overflow-y-auto flex-1 bg-slate-200 flex justify-center p-6 custom-scrollbar">

        <!-- LONG paper: 8.5" × 13" → 816px × 1248px at 96dpi -->
        <div ref="ierRef"
          :style="`width:${PREVIEW_W_PX}px; min-height:1248px; background:#fff; font-family:'Times New Roman',Times,serif; color:#000; flex-shrink:0; padding:36px 52px 44px 52px; position:relative;`"
          class="shadow-2xl">

          <!-- ANNEX label -->
          <div style="position:absolute; top:28px; right:44px; border:1.5px solid #000; padding:3px 10px; font-size:8.5pt; font-weight:700; letter-spacing:0.04em;">
            {{ annexLabel }}
          </div>

          <!-- Logo + DepEd Header -->
          <div style="display:flex; flex-direction:column; align-items:center; gap:5px; margin-bottom:16px;">
            <img src="/deped-national-logo.png" alt="DepEd" style="width:68px; height:68px; object-fit:contain;" />
            <div style="text-align:center; line-height:1.4;">
              <div style="font-size:9pt; font-style:italic;">Republic of the Philippines</div>
              <div style="font-size:15pt; font-weight:900; font-family:'Times New Roman',serif;">Department of Education</div>
              <div style="font-size:8.5pt;">Schools Division of Guihulngan City</div>
              <div style="font-size:9pt; font-weight:700; text-transform:uppercase; letter-spacing:0.04em;">Personnel Division</div>
            </div>
          </div>

          <!-- Divider -->
          <div style="border-top:1px solid #555; margin-bottom:10px;"></div>

          <!-- Final IER notice -->
          <div v-if="isFinal" style="margin-bottom:12px; padding:5px 10px; border:1px solid #2d6a4f; background:#d8f3dc; border-radius:3px; font-size:8pt; color:#1b4332; display:flex; align-items:center; gap:6px;">
            <strong>OFFICIAL / FINAL IER</strong> — Verified by {{ verifier }} on {{ verifiedDate }}
          </div>

          <!-- Date -->
          <div style="font-size:9.5pt; margin-bottom:14px;">{{ isFinal ? verifiedDate : today }}</div>

          <!-- Recipient -->
          <div style="margin-bottom:18px;">
            <div style="font-size:9.5pt; font-weight:700; text-transform:uppercase;">{{ fullName }}</div>
            <div style="font-size:9.5pt;">{{ address }}</div>
          </div>

          <!-- Salutation -->
          <div style="font-size:9.5pt; margin-bottom:12px;">
            Dear <strong>{{ firstName }}</strong>,
          </div>

          <!-- Body — QUALIFIED -->
          <div v-if="isQualified" style="font-size:9.5pt; text-align:justify; margin-bottom:16px; line-height:1.7;">
            Congratulations!<br/><br/>
            We are pleased to inform you that based on the initial evaluation, we have found your
            qualifications to be substantial vis-a-vis the Civil Service Commission (CSC) approved
            Qualification Standards (QS) of <strong>{{ posTitle }}</strong> position under <strong>{{ office }}</strong>.
            Below are the results of the initial evaluation conducted by the undersigned dated <strong>{{ today }}</strong>:
          </div>

          <!-- Body — NOT QUALIFIED -->
          <div v-else style="font-size:9.5pt; text-align:justify; margin-bottom:16px; line-height:1.7;">
            Please be informed of the results of the initial evaluation of your qualifications vis-a-vis
            the Civil Service Commission (CSC)-approved Qualification Standards (QS) of
            <strong>{{ posTitle }}</strong> position under <strong>{{ office }}</strong>, as follows:
          </div>

          <!-- QS Table -->
          <table style="width:100%; border-collapse:collapse; margin-bottom:16px; table-layout:fixed;">
            <colgroup>
              <col style="width:20%"/>
              <col style="width:30%"/>
              <col style="width:34%"/>
              <col style="width:16%"/>
            </colgroup>
            <thead>
              <tr style="background:#3a3a6e; color:#fff;">
                <th style="border:1px solid #555; padding:6px 7px; text-align:center; font-size:8pt; font-weight:700;">Position Applied for</th>
                <th style="border:1px solid #555; padding:6px 7px; text-align:center; font-size:8pt; font-weight:700;">CSC-approved QS<br/>of the Position</th>
                <th style="border:1px solid #555; padding:6px 7px; text-align:center; font-size:8pt; font-weight:700;">Your Qualifications</th>
                <th style="border:1px solid #555; padding:6px 7px; text-align:center; font-size:8pt; font-weight:700;">Remarks</th>
              </tr>
            </thead>
            <tbody>

              <!-- Education -->
              <tr style="vertical-align:top;">
                <!-- Position cell spans edu + exp + trn + elig rows -->
                <td rowspan="4"
                  style="border:1px solid #555; padding:8px 7px; vertical-align:middle; text-align:center; font-size:8.5pt; font-weight:700; line-height:1.5; overflow:hidden; word-break:break-word;">
                  {{ posTitle }}
                </td>
                <td style="border:1px solid #555; padding:6px 7px; vertical-align:top; font-size:8.5pt;">
                  <strong>Education:</strong> {{ qs.education || 'As required by CSC' }}
                </td>
                <!-- Your Qualifications: degree name only -->
                <td :style="`border:1px solid #555; padding:6px 7px; vertical-align:top; overflow:hidden; word-break:break-word; ${cellFontSize(eduText)}`">
                  <template v-if="eduItems.length">
                    <div v-for="(item, idx) in eduItems" :key="idx"
                      :style="item.isRelevant === false ? 'color:#dc2626;text-decoration:line-through;line-height:1.6;' : 'line-height:1.6;'">
                      {{ item.text }}
                    </div>
                  </template>
                  <span v-else>{{ qsNoneFor('education') ? 'None Required (per QS)' : 'None provided' }}</span>
                </td>
                <td :style="`border:1px solid #555; padding:6px 7px; text-align:center; vertical-align:middle; font-size:8.5pt; font-weight:700; color:${eduRemark === 'Qualified' ? '#155724' : '#721c24'}`">
                  {{ eduRemark }}
                </td>
              </tr>

              <!-- Experience -->
              <tr style="vertical-align:top;">
                <td style="border:1px solid #555; padding:6px 7px; vertical-align:top; font-size:8.5pt;">
                  <strong>Experience:</strong> {{ qs.experience || 'As required by CSC' }}
                </td>
                <!-- position – total months -->
                <td :style="`border:1px solid #555; padding:6px 7px; vertical-align:top; overflow:hidden; word-break:break-word; ${cellFontSize(expText)}`">
                  <template v-if="expItems.length">
                    <div v-for="(item, idx) in expItems" :key="idx"
                      :style="item.isRelevant === false ? 'color:#dc2626;text-decoration:line-through;line-height:1.6;' : 'line-height:1.6;'">
                      {{ item.text }}
                    </div>
                  </template>
                  <span v-else>{{ qsNoneFor('experience') ? 'None Required (per QS)' : 'None provided' }}</span>
                </td>
                <td :style="`border:1px solid #555; padding:6px 7px; text-align:center; vertical-align:middle; font-size:8.5pt; font-weight:700; color:${expRemark === 'Qualified' ? '#155724' : '#721c24'}`">
                  {{ expRemark }}
                </td>
              </tr>

              <!-- Training -->
              <tr style="vertical-align:top;">
                <td style="border:1px solid #555; padding:6px 7px; vertical-align:top; font-size:8.5pt;">
                  <strong>Training:</strong> {{ qs.trainings || 'As required by CSC' }}
                </td>
                <!-- title – hours -->
                <td :style="`border:1px solid #555; padding:6px 7px; vertical-align:top; overflow:hidden; word-break:break-word; ${cellFontSize(trnText)}`">
                  <template v-if="trnItems.length">
                    <div v-for="(item, idx) in trnItems" :key="idx"
                      :style="item.isRelevant === false ? 'color:#dc2626;text-decoration:line-through;line-height:1.6;' : 'line-height:1.6;'">
                      {{ item.text }}
                    </div>
                  </template>
                  <span v-else>{{ qsNoneFor('trainings') ? 'None Required (per QS)' : 'None provided' }}</span>
                </td>
                <td :style="`border:1px solid #555; padding:6px 7px; text-align:center; vertical-align:middle; font-size:8.5pt; font-weight:700; color:${trnRemark === 'Qualified' ? '#155724' : '#721c24'}`">
                  {{ trnRemark }}
                </td>
              </tr>

              <!-- Eligibility -->
              <tr style="vertical-align:top;">
                <td style="border:1px solid #555; padding:6px 7px; vertical-align:top; font-size:8.5pt;">
                  <strong>Eligibility:</strong>
                  <span v-if="Array.isArray(qs.eligibility) && qs.eligibility.length">{{ qs.eligibility.join('; ') }}</span>
                  <span v-else>As required by CSC</span>
                </td>
                <!-- eligibility name only -->
                <td :style="`border:1px solid #555; padding:6px 7px; vertical-align:top; overflow:hidden; word-break:break-word; ${cellFontSize(eligText)}`">
                  <template v-if="eligItems.length">
                    <div v-for="(item, idx) in eligItems" :key="idx"
                      :style="item.isRelevant === false ? 'color:#dc2626;text-decoration:line-through;line-height:1.6;' : 'line-height:1.6;'">
                      {{ item.text }}
                    </div>
                  </template>
                  <span v-else>{{ qsNoneFor('eligibility') ? 'None Required (per QS)' : 'None provided' }}</span>
                </td>
                <td :style="`border:1px solid #555; padding:6px 7px; text-align:center; vertical-align:middle; font-size:8.5pt; font-weight:700; color:${eligRemark === 'Qualified' ? '#155724' : '#721c24'}`">
                  {{ eligRemark }}
                </td>
              </tr>

              <!-- Performance sub-header row -->
              <tr>
                <td rowspan="2"
                  style="border:1px solid #555; padding:8px 7px; vertical-align:middle; text-align:center; font-size:8.5pt; font-weight:700; line-height:1.5; overflow:hidden; word-break:break-word;">
                  {{ posTitle }}
                </td>
                <td style="border:1px solid #555; padding:5px 7px; font-size:8pt; font-weight:700; text-align:center; border-top:2px solid #333;">Performance Requirement<br/>of the Position</td>
                <td style="border:1px solid #555; padding:5px 7px; font-size:8pt; font-weight:700; text-align:center; border-top:2px solid #333;">Your Qualifications</td>
                <td style="border:1px solid #555; padding:5px 7px; font-size:8pt; font-weight:700; text-align:center; border-top:2px solid #333;">Remarks</td>
              </tr>

              <!-- Performance data -->
              <tr style="vertical-align:top;">
                <td style="border:1px solid #555; padding:6px 7px; vertical-align:top; font-size:8.5pt;">
                  <strong>Performance:</strong> At least Very Satisfactory in the last three (3) immediately preceding rating periods, each covering one (1) year performance
                </td>
                <td style="border:1px solid #555; padding:6px 7px; vertical-align:top; white-space:pre-line; font-size:8.5pt; overflow:hidden; word-break:break-word;">{{ fmtPerf() }}</td>
                <td :style="`border:1px solid #555; padding:6px 7px; text-align:center; vertical-align:middle; font-size:8.5pt; font-weight:700; color:${perfRemark === 'Met' || perfRemark === 'N/A' ? '#155724' : '#721c24'}`">
                  {{ perfRemark }}
                </td>
              </tr>

            </tbody>
          </table>

          <!-- Post-table — QUALIFIED -->
          <template v-if="isQualified">
            <div style="font-size:9.5pt; text-align:justify; line-height:1.7; margin-bottom:12px;">
              Please be advised of your assigned application code <strong><u>{{ code }}</u></strong> which
              shall be used as you proceed with the next stage of the selection process. You may refer
              to the official issuances of <strong><u>Schools Division of Guihulngan City</u></strong> for
              the additional announcements in this regard.
            </div>
            <div style="font-size:9.5pt; text-align:justify; line-height:1.7; margin-bottom:12px;">
              For inquiries, you may contact the <strong><u>HRMO Office, SDO Guihulngan City</u></strong>.
            </div>
            <div style="font-size:9.5pt; margin-bottom:18px;">Thank you.</div>
          </template>

          <!-- Post-table — NOT QUALIFIED -->
          <template v-else>
            <div style="font-size:9.5pt; text-align:justify; line-height:1.7; margin-bottom:12px;">
              While your qualifications made a favorable impression, we regret to inform you that
              you did not meet the minimum QS set for <strong>{{ posTitle }}</strong> position.
              You may, however, continue to submit job applications in response to other vacancy announcements.
            </div>
            <div style="font-size:9.5pt; text-align:justify; line-height:1.7; margin-bottom:18px;">
              The results of the initial evaluation shall be released and posted for transparency
              purposes. You may refer to your assigned application code <strong>{{ code }}</strong> in
              the official posting of the results. Thank you and we wish you the best of luck in your future success.
            </div>
          </template>

          <!-- Closing -->
          <div style="font-size:9.5pt; line-height:1.8; margin-bottom:32px;">
            Very truly yours,
          </div>

          <!-- HRMO Signature -->
          <div style="font-size:9.5pt; margin-bottom:44px;">
            <div style="font-weight:700; text-transform:uppercase;">RACHEL L. CHIONG</div>
            <div>Administrative Officer VI, HRMO</div>
          </div>

          <!-- Footer -->
          <div style="border-top:1px solid #555; padding-top:5px; font-size:7.5pt; color:#444; line-height:1.7;">
            <div>Schools Division of Guihulngan City, Poblacion, Guihulngan City, Negros Oriental, NIR 6214</div>
            <div>Telephone Nos.: (035) 000-0000 &nbsp;&nbsp; Email Address: sdo.guihulnganc@deped.gov.ph</div>
          </div>

        </div><!-- /long paper -->
      </div><!-- /scroll -->

    </div>
  </div>
  </Teleport>
  </div>
</template>
