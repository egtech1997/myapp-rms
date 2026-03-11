<script setup>
import { ref } from 'vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

defineOptions({ name: 'AppTableReport' })

const props = defineProps({
  modelValue:  { type: Boolean, default: false },
  title:       { type: String,  default: 'Report' },
  subtitle:    { type: String,  default: '' },
  // columns: [{ label: 'Name', key: 'username' }]
  // or      [{ label: 'Name', value: (row) => row.username }]
  columns:     { type: Array,   default: () => [] },
  rows:        { type: Array,   default: () => [] },
  filename:    { type: String,  default: 'report' },
})
const emit = defineEmits(['update:modelValue'])

const pageRef    = ref(null)
const generating = ref(false)
const printDate  = new Date().toLocaleDateString('en-PH', {
  year: 'numeric', month: 'long', day: 'numeric',
})

const close = () => emit('update:modelValue', false)

const cell = (row, col) => {
  const v = col.value ? col.value(row) : row[col.key ?? '']
  return v ?? ''
}

// ── CSV ─────────────────────────────────────────────────────────────────────
function downloadCsv() {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
  const head = props.columns.map((c) => esc(c.label)).join(',')
  const body = props.rows.map((r) =>
    props.columns.map((c) => esc(cell(r, c))).join(',')
  )
  const csv  = [head, ...body].join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), {
    href: url, download: `${props.filename}.csv`,
  })
  a.click()
  URL.revokeObjectURL(url)
}

// ── PDF ─────────────────────────────────────────────────────────────────────
async function downloadPdf() {
  generating.value = true
  try {
    const el     = pageRef.value
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
    const img    = canvas.toDataURL('image/jpeg', 0.95)
    
    // Custom size: 8.5" x 13" (Folio/F4)
    // 13 inches = 330.2 mm
    // 8.5 inches = 215.9 mm
    const pdf = new jsPDF({ 
      orientation: 'landscape', 
      unit: 'mm', 
      format: [330.2, 215.9] 
    })
    
    const W      = pdf.internal.pageSize.getWidth()
    const ratio  = canvas.height / canvas.width
    const imgH   = W * ratio
    pdf.addImage(img, 'JPEG', 0, 0, W, imgH)
    pdf.save(`${props.filename}.pdf`)
  } finally {
    generating.value = false
  }
}

// ── Print ────────────────────────────────────────────────────────────────────
function printReport() {
  const html = pageRef.value.outerHTML
  const win  = window.open('', '_blank', 'width=1300,height=900')
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8"/>
    <title>${props.title}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      @page{size:330.2mm 215.9mm landscape;margin:5mm;}
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:Arial,sans-serif;}
      .print-page { width: 100% !important; box-shadow: none !important; margin: 0 !important; }
    </style>
  </head><body>${html}</body></html>`)
  win.document.close()
  win.addEventListener('load', () => setTimeout(() => win.print(), 200))
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue"
        class="fixed inset-0 z-[500] flex items-center justify-center p-4"
        style="background:rgba(15,23,42,0.6);backdrop-filter:blur(3px);"
        @click.self="close">

        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-[var(--radius-2xl)] shadow-2xl
                    w-full max-w-[1360px] flex flex-col overflow-hidden max-h-[95vh] animate-zoom-in">

          <!-- Toolbar -->
          <div class="px-5 py-3.5 border-b border-[var(--border-main)] flex items-center
                      justify-between gap-3 flex-shrink-0 bg-[var(--bg-app)]">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                <i class="pi pi-file-pdf text-white text-sm"></i>
              </div>
              <div>
                <p class="text-sm font-bold text-[var(--text-main)]">{{ title }}</p>
                <p class="text-xs text-[var(--text-muted)]">{{ rows.length }} records &middot; {{ printDate }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <slot name="extra-actions"></slot>
              <button @click="downloadCsv"
                class="h-9 px-3.5 rounded-[var(--radius-md)] border border-[var(--border-main)] bg-[var(--surface)]
                       hover:bg-[var(--bg-app)] text-sm font-semibold text-[var(--text-main)]
                       transition-colors flex items-center gap-1.5">
                <i class="pi pi-file-excel text-green-600 text-xs"></i>
                <span class="hidden sm:inline">Excel</span>
              </button>
              <button @click="printReport"
                class="h-9 px-3.5 rounded-[var(--radius-md)] border border-[var(--border-main)] bg-[var(--surface)]
                       hover:bg-[var(--bg-app)] text-sm font-semibold text-[var(--text-main)]
                       transition-colors flex items-center gap-1.5">
                <i class="pi pi-print text-xs"></i>
                <span class="hidden sm:inline">Print</span>
              </button>
              <button @click="downloadPdf" :disabled="generating"
                class="h-9 px-4 rounded-[var(--radius-md)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]
                       disabled:opacity-60 text-white text-sm font-semibold transition-colors
                       flex items-center gap-1.5">
                <i :class="['pi text-xs', generating ? 'pi-spin pi-spinner' : 'pi-download']"></i>
                {{ generating ? 'Generating...' : 'Download PDF' }}
              </button>
              <button @click="close"
                class="h-9 w-9 rounded-[var(--radius-md)] border border-[var(--border-main)] bg-[var(--surface)]
                       hover:bg-[var(--bg-app)] flex items-center justify-center
                       text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                <i class="pi pi-times text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Preview -->
          <div class="overflow-auto flex-1 bg-slate-200 flex justify-center p-6 custom-scrollbar">

            <!-- Page Container — 13" Landscape is roughly 1248px wide at 96dpi -->
            <div ref="pageRef"
              style="width:1248px; min-height:816px; background:#fff;
                     font-family:'Arial',sans-serif; color:#000; flex-shrink:0; padding: 30px;
                     display: flex; flex-direction: column;"
              class="shadow-2xl print-page">

              <!-- Official Header (Dual Logo - Centered together) -->
              <div style="display:flex;align-items:center;justify-content:center;margin-bottom:10px;gap:20px; flex-shrink: 0;">
                <div style="width:45px;flex-shrink:0;">
                  <img src="/deped-national-logo.png" style="width:100%;height:auto;" />
                </div>
                <div style="text-align:center;">
                  <div style="font-size:8pt;text-transform:uppercase; line-height: 1;">Republic of the Philippines</div>
                  <div style="font-size:12pt;font-weight:900;color:#1d4ed8;line-height:1.1;">DEPARTMENT OF EDUCATION</div>
                  <div style="font-size:9pt;line-height: 1;">Negros Island Region (NIR)</div>
                  <div style="font-size:10pt;font-weight:800;text-transform:uppercase; line-height: 1;">Schools Division Office of Guihulngan City</div>
                </div>
                <div style="width:45px;flex-shrink:0;">
                  <img src="/deped-logo.png" style="width:100%;height:auto;" />
                </div>
              </div>

              <!-- Thick line -->
              <div style="background:#000;height:1.5px;margin-bottom:15px; flex-shrink: 0;"></div>

              <!-- Title Section -->
              <div style="text-align:center;margin-bottom:15px; flex-shrink: 0;">
                <div style="font-size:12pt;font-weight:900;text-transform:uppercase;letter-spacing:1px;">{{ title }}</div>
                <div v-if="subtitle" style="font-size:9pt;font-weight:700;margin-top:2px;">{{ subtitle }}</div>
              </div>

              <!-- Table -->
              <div style="flex: 1 1 auto; overflow: hidden;">
                <table style="width:100%; border-collapse:collapse; font-size:6pt; border:1px solid #000; table-layout: fixed;">
                  <thead>
                    <tr style="background:#1d4ed8;color:#fff;">
                      <th style="padding:4px 2px; border:1px solid #000; text-align:center; width:25px;">#</th>
                      <th v-for="col in columns" :key="col.label"
                        :style="{
                          padding: '4px 2px',
                          border: '1px solid #000',
                          textAlign: 'center',
                          width: col.width || 'auto'
                        }">
                        {{ col.label }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, i) in rows" :key="i">
                      <td style="padding:3px 2px; border:1px solid #000; text-align:center;">{{ i + 1 }}</td>
                      <td v-for="col in columns" :key="col.label"
                        style="padding:3px 2px; border:1px solid #000; color:#000; overflow: hidden; text-overflow: ellipsis; white-space: pre-line; word-break: break-word;">
                        {{ cell(row, col) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Official Footer -->
              <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:flex-end; flex-shrink: 0;">
                <div style="font-size:7pt;color:#666;">
                  <div>Generated by DepEd Recruitment & Selection Portal (ORAS)</div>
                  <div>Date: {{ printDate }}</div>
                </div>
                <div style="text-align:right;">
                   <div style="font-size:8pt;font-weight:800;">GUIHULNGAN CITY DIVISION</div>
                   <div style="font-size:7pt;font-style:italic;">"Service with a heart, Quality with a smile"</div>
                </div>
              </div>

            </div><!-- /Page -->
          </div><!-- /scroll -->

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active { transition: opacity 200ms ease-out; }
.modal-leave-active { transition: opacity 150ms ease-in; }
.modal-enter-from,
.modal-leave-to     { opacity: 0; }

.custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
</style>
