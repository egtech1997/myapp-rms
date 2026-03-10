<script setup>
import { ref, computed, onMounted } from 'vue'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const props = defineProps({
  app: { type: Object, required: true },
})
const emit = defineEmits(['close'])

// ── Derived values ─────────────────────────────────────────────────────────
const code = computed(() => props.app.applicationCode || '—')

const fullName = computed(() => {
  const pi = props.app.applicantData?.personalInfo || {}
  return [pi.firstName, pi.middleName, pi.lastName, pi.suffix]
    .filter(Boolean).join(' ').toUpperCase() || 'N/A'
})

const position  = computed(() => props.app.job?.positionTitle     || 'N/A')
const station   = computed(() => {
  const val = props.app.job?.placeOfAssignment
  if (Array.isArray(val)) return val.join(', ')
  return val || ''
})
const trackMap  = { teaching: 'Teaching', teaching_related: 'Teaching-Related', non_teaching: 'Non-Teaching' }
const track     = computed(() => trackMap[props.app.category || props.app.job?.hiringTrack] || '')
const printDate = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })

// ── QR Code ────────────────────────────────────────────────────────────────
const qrDataUrl = ref('')
onMounted(async () => {
  qrDataUrl.value = await QRCode.toDataURL(code.value, {
    width: 200,
    margin: 1,
    color: { dark: '#001F3F', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
})

// ── Download PDF ───────────────────────────────────────────────────────────
const downloading = ref(false)
const coverRef    = ref(null)

async function downloadPdf() {
  downloading.value = true
  try {
    const el = coverRef.value
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: el.offsetWidth,
      height: el.offsetHeight,
    })
    const imgData = canvas.toDataURL('image/jpeg', 1.0)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pdfW = pdf.internal.pageSize.getWidth()
    const pdfH = pdf.internal.pageSize.getHeight()
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH)
    pdf.save(`ApplicationCover-${code.value}.pdf`)
  } finally {
    downloading.value = false
  }
}

// ── Print ──────────────────────────────────────────────────────────────────
function printCover() {
  const el = coverRef.value
  const win = window.open('', '_blank', 'width=900,height=1100')
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8"/>
    <title>Application Cover — ${code.value}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      @page { size:A4 portrait; margin:0; }
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    </style>
  </head><body>${el.outerHTML}</body></html>`)
  win.document.close()
  win.addEventListener('load', () => setTimeout(() => win.print(), 200))
}
</script>

<template>
  <!-- Single element root required for KeepAlive + Transition compatibility -->
  <div style="display:contents">
  <Teleport to="body">
  <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
    @click.self="emit('close')">

    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-zoom-in max-h-[96vh]">

      <!-- Toolbar -->
      <div class="px-5 py-3.5 border-b border-[var(--border-main)] flex items-center justify-between gap-3 flex-shrink-0 bg-[var(--bg-app)]">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <i class="pi pi-file-pdf text-white text-sm"></i>
          </div>
          <div>
            <p class="text-sm font-bold text-[var(--text-main)]">Application Cover</p>
            <p class="text-xs text-[var(--text-muted)] font-mono">{{ code }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="printCover"
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

      <!-- Preview Scroll Area -->
      <div class="overflow-y-auto flex-1 bg-slate-200 flex justify-center p-6 custom-scrollbar">

        <!-- A4 Page — 794px = 210mm at 96dpi -->
        <div ref="coverRef"
          style="width:794px; min-height:1123px; background:#fff; font-family:'Arial',sans-serif; color:#001F3F; position:relative; flex-shrink:0;"
          class="shadow-2xl">

          <!-- Header band -->
          <div style="background:#001F3F; color:#fff; padding:12px 24px; display:flex; align-items:center; gap:16px;">
            <div style="width:48px; height:48px; border:2px solid rgba(255,255,255,0.35); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0;">
              &#127973;
            </div>
            <div style="flex:1;">
              <div style="font-size:8pt; letter-spacing:0.1em; opacity:0.7; text-transform:uppercase;">Republic of the Philippines</div>
              <div style="font-size:14pt; font-weight:800; letter-spacing:0.04em; line-height:1.2;">Department of Education</div>
              <div style="font-size:8.5pt; opacity:0.85; margin-top:1px;">Schools Division of Guihulngan City</div>
            </div>
            <div style="font-size:7.5pt; opacity:0.65; text-align:right; line-height:1.6;">
              Poblacion, Guihulngan City<br/>Negros Oriental, NIR 6214
            </div>
          </div>
          <!-- Gold stripe -->
          <div style="background:#EFBF04; height:5px;"></div>

          <!-- Content area -->
          <div style="padding:28px 36px 32px 40px; display:flex; flex-direction:column; gap:0; position:relative; min-height:1058px;">

            <!-- QR code — top right -->
            <div style="position:absolute; top:28px; right:36px; display:flex; flex-direction:column; align-items:center; gap:5px;">
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR" style="width:110px; height:110px; border:2.5px solid #001F3F; padding:4px;" />
              <div v-else style="width:110px; height:110px; border:2.5px solid #001F3F; display:flex; align-items:center; justify-content:center; font-size:8pt; color:#94a3b8;">Loading…</div>
              <span style="font-size:6.5pt; color:#64748b; letter-spacing:0.06em; text-transform:uppercase;">Scan to verify</span>
            </div>

            <!-- Title -->
            <div style="padding-right:130px;">
              <div style="font-size:7.5pt; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:#EFBF04; margin-bottom:5px;">
                Merit Selection Plan — Recruitment, Selection &amp; Placement
              </div>
              <div style="font-size:26pt; font-weight:900; color:#001F3F; letter-spacing:0.03em; line-height:1.05; text-transform:uppercase;">
                Application Cover
              </div>
              <div style="font-size:8.5pt; color:#475569; margin-top:6px;">
                Attach this cover to your physical application folder when submitting to the Division.
              </div>
            </div>

            <!-- Divider -->
            <div style="border-top:3px solid #001F3F; margin:20px 0 0 0;"></div>

            <!-- Info table -->
            <div style="margin-top:24px; border:2.5px solid #001F3F; border-radius:4px; overflow:hidden;">

              <!-- Application Code row -->
              <div style="display:flex; align-items:stretch; background:#eff6ff; border-bottom:1px solid #cbd5e1;">
                <div style="width:160px; flex-shrink:0; background:#001F3F; color:#fff; font-size:7pt; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:12px 14px; display:flex; align-items:center;">
                  Application Code
                </div>
                <div style="flex:1; padding:12px 16px; font-family:'Courier New',monospace; font-size:16pt; font-weight:900; color:#4A4D8F; letter-spacing:0.08em; display:flex; align-items:center;">
                  {{ code }}
                </div>
              </div>

              <!-- Applicant Name -->
              <div style="display:flex; align-items:stretch; border-bottom:1px solid #cbd5e1;">
                <div style="width:160px; flex-shrink:0; background:#001F3F; color:#fff; font-size:7pt; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:12px 14px; display:flex; align-items:center;">
                  Applicant Name
                </div>
                <div style="flex:1; padding:12px 16px; font-size:14pt; font-weight:800; color:#001F3F; display:flex; align-items:center;">
                  {{ fullName }}
                </div>
              </div>

              <!-- Position -->
              <div style="display:flex; align-items:stretch; border-bottom:1px solid #cbd5e1;">
                <div style="width:160px; flex-shrink:0; background:#001F3F; color:#fff; font-size:7pt; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:12px 14px; display:flex; align-items:center;">
                  Position Applied For
                </div>
                <div style="flex:1; padding:12px 16px; font-size:13pt; font-weight:700; color:#001F3F; display:flex; align-items:center;">
                  {{ position }}
                </div>
              </div>

              <!-- Place of Assignment -->
              <div v-if="station" style="display:flex; align-items:stretch; border-bottom:1px solid #cbd5e1;">
                <div style="width:160px; flex-shrink:0; background:#001F3F; color:#fff; font-size:7pt; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:12px 14px; display:flex; align-items:center;">
                  Place of Assignment
                </div>
                <div style="flex:1; padding:12px 16px; font-size:11pt; font-weight:600; color:#001F3F; display:flex; align-items:center;">
                  {{ station }}
                </div>
              </div>

              <!-- Hiring Track -->
              <div v-if="track" style="display:flex; align-items:stretch; border-bottom:1px solid #cbd5e1;">
                <div style="width:160px; flex-shrink:0; background:#001F3F; color:#fff; font-size:7pt; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:12px 14px; display:flex; align-items:center;">
                  Hiring Track
                </div>
                <div style="flex:1; padding:12px 16px; font-size:11pt; font-weight:600; color:#001F3F; display:flex; align-items:center;">
                  {{ track }}
                </div>
              </div>

              <!-- Date Printed -->
              <div style="display:flex; align-items:stretch;">
                <div style="width:160px; flex-shrink:0; background:#001F3F; color:#fff; font-size:7pt; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:12px 14px; display:flex; align-items:center;">
                  Date Printed
                </div>
                <div style="flex:1; padding:12px 16px; font-size:10pt; font-weight:500; color:#334155; display:flex; align-items:center;">
                  {{ printDate }}
                </div>
              </div>
            </div>

            <!-- Instructions -->
            <div style="margin-top:24px; border:1.5px solid #cbd5e1; border-radius:4px; padding:14px 18px; background:#f8fafc;">
              <div style="font-size:7.5pt; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#001F3F; margin-bottom:10px;">
                Instructions for the Applicant
              </div>
              <ol style="padding-left:18px; display:flex; flex-direction:column; gap:5px; list-style:decimal;">
                <li style="font-size:8pt; color:#334155; line-height:1.5;">Print this cover on a clean sheet of paper and attach it as the <strong>front page</strong> of your physical application folder.</li>
                <li style="font-size:8pt; color:#334155; line-height:1.5;">Ensure all supporting documents (CSC eligibility, TOR, training certificates, IPCR/OPCR) are organized and labelled behind this cover.</li>
                <li style="font-size:8pt; color:#334155; line-height:1.5;">Submit your complete folder to the <strong>Human Resource Management Office (HRMO)</strong>, Schools Division of Guihulngan City, Poblacion, Guihulngan City, Negros Oriental 6214, on or before the application deadline.</li>
                <li style="font-size:8pt; color:#334155; line-height:1.5;">The QR code on this cover corresponds to your unique application code. Keep a copy of this document for your records.</li>
              </ol>
            </div>

            <!-- Signature lines -->
            <div style="margin-top:36px; display:flex; gap:48px;">
              <div style="flex:1; display:flex; flex-direction:column; gap:42px;">
                <div>
                  <div style="border-top:1.5px solid #001F3F;"></div>
                  <div style="font-size:7.5pt; color:#475569; text-transform:uppercase; letter-spacing:0.06em; margin-top:4px;">Applicant's Signature over Printed Name</div>
                </div>
              </div>
              <div style="flex:1; display:flex; flex-direction:column; gap:42px;">
                <div>
                  <div style="border-top:1.5px solid #001F3F;"></div>
                  <div style="font-size:7.5pt; color:#475569; text-transform:uppercase; letter-spacing:0.06em; margin-top:4px;">Date Received &amp; HRMO Initial</div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="margin-top:auto; padding-top:28px;">
              <div style="border-top:2px solid #001F3F; padding-top:10px; display:flex; justify-content:space-between; align-items:flex-end;">
                <div style="font-size:7pt; color:#64748b; line-height:1.7;">
                  <div style="font-weight:800; color:#001F3F; letter-spacing:0.06em; text-transform:uppercase;">DepEd — RSP Portal</div>
                  <div>Schools Division of Guihulngan City</div>
                  <div>Poblacion, Guihulngan City, Negros Oriental, NIR 6214</div>
                  <div style="margin-top:3px; color:#94a3b8;">This document is system-generated and does not require a wet signature to be valid.</div>
                </div>
                <div style="font-size:7pt; color:#64748b; text-align:right; line-height:1.7;">
                  <div>Application Code: <strong style="font-family:'Courier New',monospace; color:#001F3F;">{{ code }}</strong></div>
                  <div>Generated: {{ printDate }}</div>
                </div>
              </div>
            </div>

          </div><!-- /content -->
        </div><!-- /a4 -->
      </div><!-- /scroll -->

    </div>
  </div>
  </Teleport>
  </div>
</template>
