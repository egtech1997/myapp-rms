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
    const pdf    = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const W      = pdf.internal.pageSize.getWidth()
    const H      = pdf.internal.pageSize.getHeight()
    const ratio  = canvas.height / canvas.width
    const imgH   = W * ratio
    pdf.addImage(img, 'JPEG', 0, 0, W, Math.min(imgH, H))
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
      @page{size:A4 landscape;margin:8mm;}
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:Arial,sans-serif;}
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

        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl
                    w-full max-w-6xl flex flex-col overflow-hidden max-h-[95vh] animate-zoom-in">

          <!-- Toolbar -->
          <div class="px-5 py-3.5 border-b border-[var(--border-main)] flex items-center
                      justify-between gap-3 flex-shrink-0 bg-[var(--bg-app)]">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                <i class="pi pi-file-pdf text-white text-sm"></i>
              </div>
              <div>
                <p class="text-sm font-bold text-[var(--text-main)]">{{ title }}</p>
                <p class="text-xs text-[var(--text-muted)]">{{ rows.length }} records &middot; {{ printDate }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button @click="downloadCsv"
                class="h-9 px-3.5 rounded-lg border border-[var(--border-main)] bg-[var(--surface)]
                       hover:bg-[var(--bg-app)] text-sm font-semibold text-[var(--text-main)]
                       transition-colors flex items-center gap-1.5">
                <i class="pi pi-file-excel text-green-600 text-xs"></i>
                <span class="hidden sm:inline">Excel</span>
              </button>
              <button @click="printReport"
                class="h-9 px-3.5 rounded-lg border border-[var(--border-main)] bg-[var(--surface)]
                       hover:bg-[var(--bg-app)] text-sm font-semibold text-[var(--text-main)]
                       transition-colors flex items-center gap-1.5">
                <i class="pi pi-print text-xs"></i>
                <span class="hidden sm:inline">Print</span>
              </button>
              <button @click="downloadPdf" :disabled="generating"
                class="h-9 px-4 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]
                       disabled:opacity-60 text-white text-sm font-semibold transition-colors
                       flex items-center gap-1.5">
                <i :class="['pi text-xs', generating ? 'pi-spin pi-spinner' : 'pi-download']"></i>
                {{ generating ? 'Generating...' : 'Download PDF' }}
              </button>
              <button @click="close"
                class="h-9 w-9 rounded-lg border border-[var(--border-main)] bg-[var(--surface)]
                       hover:bg-[var(--bg-app)] flex items-center justify-center
                       text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                <i class="pi pi-times text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Preview -->
          <div class="overflow-y-auto flex-1 bg-slate-200 flex justify-center p-6 custom-scrollbar">

            <!-- A4 Landscape page — 1123px = 297mm at 96dpi -->
            <div ref="pageRef"
              style="width:1123px;min-height:794px;background:#fff;
                     font-family:'Arial',sans-serif;color:#001F3F;flex-shrink:0;"
              class="shadow-2xl">

              <!-- DepEd header band -->
              <div style="background:#001F3F;color:#fff;padding:10px 28px;
                          display:flex;align-items:center;gap:16px;">
                <div style="width:42px;height:42px;border:2px solid rgba(255,255,255,.3);
                             border-radius:50%;display:flex;align-items:center;
                             justify-content:center;font-size:20px;flex-shrink:0;">
                  &#127973;
                </div>
                <div style="flex:1;">
                  <div style="font-size:6.5pt;letter-spacing:.1em;opacity:.7;text-transform:uppercase;">
                    Republic of the Philippines
                  </div>
                  <div style="font-size:11.5pt;font-weight:800;letter-spacing:.04em;line-height:1.2;">
                    Department of Education
                  </div>
                  <div style="font-size:7.5pt;opacity:.8;margin-top:1px;">
                    Schools Division of Guihulngan City
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:13pt;font-weight:900;letter-spacing:.05em;text-transform:uppercase;">
                    {{ title }}
                  </div>
                  <div v-if="subtitle" style="font-size:7.5pt;opacity:.75;margin-top:2px;">{{ subtitle }}</div>
                  <div style="font-size:6.5pt;opacity:.6;margin-top:3px;">Generated: {{ printDate }}</div>
                </div>
              </div>
              <!-- Gold stripe -->
              <div style="background:#EFBF04;height:4px;"></div>

              <!-- Table -->
              <div style="padding:18px 24px;">
                <table style="width:100%;border-collapse:collapse;font-size:8pt;">
                  <thead>
                    <tr style="background:#001F3F;color:#fff;">
                      <th style="padding:7px 10px;text-align:left;font-size:6.5pt;
                                 letter-spacing:.08em;text-transform:uppercase;width:32px;">#</th>
                      <th v-for="col in columns" :key="col.label"
                        style="padding:7px 10px;text-align:left;font-size:6.5pt;
                               letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;">
                        {{ col.label }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, i) in rows" :key="i"
                      :style="{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }">
                      <td style="padding:5px 10px;border-bottom:1px solid #e2e8f0;
                                 color:#94a3b8;font-size:7pt;">{{ i + 1 }}</td>
                      <td v-for="col in columns" :key="col.label"
                        style="padding:5px 10px;border-bottom:1px solid #e2e8f0;color:#0f172a;">
                        {{ cell(row, col) }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr style="background:#f1f5f9;">
                      <td :colspan="columns.length + 1"
                        style="padding:7px 10px;font-size:7.5pt;font-weight:700;
                               color:#475569;border-top:2px solid #001F3F;">
                        Total Records: {{ rows.length }}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <!-- Footer -->
                <div style="margin-top:18px;border-top:1.5px solid #cbd5e1;
                            padding-top:8px;display:flex;justify-content:space-between;">
                  <div style="font-size:6.5pt;color:#64748b;line-height:1.7;">
                    <div style="font-weight:800;color:#001F3F;">DepEd — RSP Portal</div>
                    <div>Schools Division of Guihulngan City &bull; Poblacion, Guihulngan City, Negros Oriental 6214</div>
                    <div style="color:#94a3b8;margin-top:1px;">System-generated document.</div>
                  </div>
                  <div style="font-size:6.5pt;color:#64748b;text-align:right;line-height:1.7;">
                    <div>Generated: {{ printDate }}</div>
                    <div>Total: {{ rows.length }} records</div>
                  </div>
                </div>
              </div>

            </div><!-- /A4 -->
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
</style>
