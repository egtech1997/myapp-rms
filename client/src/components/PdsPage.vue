<script setup>
import { ref, computed, onMounted } from 'vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const props = defineProps({
  profile: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const downloading = ref(false)
const pdsRef = ref(null)

// ── Helpers ────────────────────────────────────────────────────────────────
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''
const fullName = computed(() => {
  const p = props.profile.name || {}
  return [p.firstName, p.middleName, p.lastName, p.suffix].filter(Boolean).join(' ').toUpperCase()
})

// ── Actions ────────────────────────────────────────────────────────────────
async function downloadPdf() {
  downloading.value = true
  try {
    const el = pdsRef.value
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pages = el.querySelectorAll('.pds-page')
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const canvas = await html2canvas(page, {
        scale: 3, 
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
    }
    pdf.save(`PDS-${props.profile.name?.lastName || 'PROFILE'}.pdf`)
  } finally {
    downloading.value = false
  }
}

function printPds() {
  const el = pdsRef.value
  const win = window.open('', '_blank', 'width=1000,height=1200')
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8"/>
    <title>PDS — ${fullName.value}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      @page { size:A4 portrait; margin:0; }
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; background:#f1f5f9; }
      .pds-page { background:#fff; width:210mm; height:297mm; margin:0 auto; box-shadow:none; page-break-after:always; position:relative; overflow:hidden; padding: 10mm; font-family: 'Arial Narrow', Arial, sans-serif; font-size: 7.5pt; color: #000; line-height: 1.1; }
      .pds-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; table-layout: fixed; }
      .pds-table td { border: 1px solid #000; padding: 2px 4px; vertical-align: middle; word-wrap: break-word; }
      .bg-label { background: #eaeaea !important; font-weight: bold; }
      .pds-section-title { background: #969696 !important; color: #fff !important; font-weight: bold; font-style: italic; font-size: 9.5pt; padding: 3px 8px; border: 1.5px solid #000; border-top: none; }
      .text-data { font-family: 'Arial', sans-serif; font-weight: bold; color: #000080; text-transform: uppercase; font-size: 8pt; }
      .box { width: 10px; height: 10px; border: 1px solid #000; display: inline-block; margin-right: 3px; text-align: center; line-height: 8px; font-size: 7pt; background: #fff; }
      .q-col-left { width: 65%; }
      .q-col-right { width: 35%; }
    </style>
  </head><body>${el.innerHTML}</body></html>`)
  win.document.close()
  win.addEventListener('load', () => setTimeout(() => win.print(), 500))
}

// Inline Style Constants to avoid <style> block issues with Tailwind/Vite
const S = {
  page: "width:210mm; height:297mm; background:#fff; position:relative; overflow:hidden; padding:8mm; font-family:'Arial Narrow', Arial, sans-serif; font-size:7.5pt; color:#000; line-height:1.1;",
  table: "width:100%; border-collapse:collapse; border:1.5px solid #000; table-layout:fixed;",
  td: "border:1px solid #000; padding:2px 4px; vertical-align:middle; word-wrap:break-word;",
  label: "background:#eaeaea; font-weight:bold;",
  sectionTitle: "background:#969696; color:#fff; font-weight:bold; font-style:italic; font-size:9.5pt; padding:3px 8px; border:1.5px solid #000; border-top:none;",
  data: "font-family:'Arial', sans-serif; font-weight:bold; color:#000080; text-transform:uppercase; font-size:8pt;",
  box: "width:10px; height:10px; border:1px solid #000; display:inline-block; margin-right:3px; text-align:center; line-height:8px; font-size:7pt; background:#fff;",
  qLeft: "width:65%; text-align:left;",
  qRight: "width:35%;"
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
      @click.self="emit('close')">

      <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-zoom-in h-[96vh]">
        
        <!-- Toolbar -->
        <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between gap-3 bg-[var(--bg-app)] shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
              <i class="pi pi-file-pdf text-white text-lg"></i>
            </div>
            <div>
              <p class="text-sm font-black text-[var(--text-main)] tracking-tight">CS Form No. 212 (Revised 2017)</p>
              <p class="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest leading-none mt-1">Official Personal Data Sheet</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="printPds"
              class="h-10 px-5 rounded-xl border border-[var(--border-main)] bg-[var(--surface)] hover:bg-slate-50 text-[var(--text-main)] text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2">
              <i class="pi pi-print"></i> Print
            </button>
            <button @click="downloadPdf" :disabled="downloading"
              class="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2">
              <i :class="['pi', downloading ? 'pi-spin pi-spinner' : 'pi-download']"></i>
              {{ downloading ? 'Generating...' : 'Download PDF' }}
            </button>
            <button @click="emit('close')" class="h-10 w-10 rounded-xl border border-[var(--border-main)] bg-[var(--surface)] hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center text-[var(--text-muted)]">
              <i class="pi pi-times"></i>
            </button>
          </div>
        </div>

        <!-- Preview Area -->
        <div class="overflow-y-auto flex-1 bg-slate-500/20 p-10 flex flex-col items-center gap-10 custom-scrollbar scroll-smooth">
          
          <div ref="pdsRef" class="flex flex-col gap-10 shadow-inner">
            
            <!-- PAGE 1 -->
            <div class="pds-page shadow-2xl relative" :style="S.page">
               <div style="font-size:6pt; font-style:italic; margin-bottom:4px;">CS Form No. 212<br/>Revised 2017</div>
               <div style="text-align:center; margin-bottom:8px;">
                 <h1 style="font-size:18pt; font-weight:900; font-style:italic;">PERSONAL DATA SHEET</h1>
                 <p style="font-size:7pt; font-style:italic;">WARNING: Any misrepresentation made in the Personal Data Sheet and the Work Experience Sheet shall cause the filing of administrative/criminal case/s against the person concerned.</p>
               </div>
               <div :style="S.sectionTitle">I. PERSONAL INFORMATION</div>
               <table :style="S.table">
                 <tr><td :style="S.td + S.label + 'width:120px;'">2. SURNAME</td><td colspan="3" :style="S.td + S.data">{{ profile.name?.lastName }}</td></tr>
                 <tr><td :style="S.td + S.label">FIRST NAME</td><td colspan="2" :style="S.td + S.data">{{ profile.name?.firstName }}</td><td :style="S.td + S.label + 'width:160px; font-size:6pt;'">NAME EXTENSION (JR., SR) <span :style="S.data + 'margin-left:8px;'">{{ profile.name?.suffix || 'N/A' }}</span></td></tr>
                 <tr><td :style="S.td + S.label">MIDDLE NAME</td><td colspan="3" :style="S.td + S.data">{{ profile.name?.middleName }}</td></tr>
                 <tr>
                   <td :style="S.td + S.label">3. DATE OF BIRTH</td><td :style="S.td + S.data">{{ formatDate(profile.birthDate) }}</td>
                   <td :style="S.td + S.label">16. CITIZENSHIP</td>
                   <td :style="S.td + S.data"><span :style="S.box">x</span> Filipino <span :style="S.box"></span> Dual Citizenship</td>
                 </tr>
                 <tr>
                   <td :style="S.td + S.label">SEX</td><td :style="S.td + S.data"><span :style="S.box">{{ profile.sex==='male'?'x':'' }}</span> Male <span :style="S.box">{{ profile.sex==='female'?'x':'' }}</span> Female</td>
                   <td :style="S.td + S.label">CIVIL STATUS</td>
                   <td :style="S.td + S.data">{{ profile.civilStatus }}</td>
                 </tr>
                 <tr>
                   <td :style="S.td + S.label">RESIDENTIAL ADDRESS</td><td colspan="3" :style="S.td + S.data">{{ profile.address?.sitio }} {{ profile.address?.barangay }}, {{ profile.address?.municipality }}, {{ profile.address?.province }} {{ profile.address?.zipCode }}</td>
                 </tr>
                 <tr>
                   <td :style="S.td + S.label">MOBILE NO.</td><td :style="S.td + S.data">{{ profile.contact?.phones?.[0] }}</td>
                   <td :style="S.td + S.label">E-MAIL ADDRESS</td><td :style="S.td + S.data">{{ profile.contact?.emails?.[0] }}</td>
                 </tr>
                 <tr>
                   <td :style="S.td + S.label">ETHNIC GROUP</td><td :style="S.td + S.data">{{ profile.ethnicGroup }}</td>
                   <td :style="S.td + S.label">RELIGION</td><td :style="S.td + S.data">{{ profile.religion }}</td>
                 </tr>
                 <tr>
                   <td :style="S.td + S.label">DISABILITY</td><td colspan="3" :style="S.td + S.data">{{ profile.disability || 'N/A' }}</td>
                 </tr>
               </table>
               <!-- More tables would be here... -->
               <div style="position:absolute; bottom:16px; left:32px; font-size:6pt; font-style:italic;">CS FORM 212 (Revised 2017), Page 1 of 4</div>
            </div>

            <!-- PAGE 4 -->
            <div class="pds-page shadow-2xl relative" :style="S.page">
               <div :style="S.sectionTitle">IX. QUESTIONS</div>
               <table :style="S.table + 'border-bottom:none;'">
                 <tr>
                   <td :style="S.td + S.qLeft + 'padding:4px;'">34. Are you related by consanguinity or affinity to the appointing or recommending authority...</td>
                   <td :style="S.td + S.qRight">
                     <div style="padding-left:16px;">
                       <div><span :style="S.box"></span> YES <span :style="S.box">x</span> NO</div>
                     </div>
                   </td>
                 </tr>
                 <tr>
                   <td :style="S.td + S.qLeft + 'padding:4px;'">35. a. Have you ever been found guilty of any administrative offense?</td>
                   <td :style="S.td + S.qRight"><div style="padding-left:16px;"><span :style="S.box"></span> YES <span :style="S.box">x</span> NO</div></td>
                 </tr>
                 <tr>
                   <td :style="S.td + S.qLeft + 'padding:4px; font-weight:bold;'">41. REFERENCES</td>
                   <td :style="S.td + S.qRight"></td>
                 </tr>
               </table>
               <table :style="S.table">
                 <tr :style="S.label + 'text-align:center;'"><td :style="S.td">NAME</td><td :style="S.td">ADDRESS</td><td :style="S.td">TEL NO.</td></tr>
                 <tr v-for="n in 3" :key="n"><td :style="S.td + 'height:28px;'">N/A</td><td :style="S.td">N/A</td><td :style="S.td">N/A</td></tr>
               </table>
               <div :style="S.sectionTitle + 'margin-top:8px;'">42. DECLARATION</div>
               <div style="border:1px solid #000; padding:12px; font-size:7pt; text-align:justify; background:#fff;">
                 I declare under oath that I have personally accomplished this Personal Data Sheet...
               </div>
               <div style="display:flex; align-items:flex-end; border:1px solid #000; border-top:none; height:240px;">
                 <div style="width:25%; height:100%; border-right:1px solid #000; display:flex; flex-direction:column;">
                   <div style="flex:1; display:flex; align-items:center; justify-content:center; color:#ccc; font-weight:bold; text-align:center; padding:16px;">THUMBMARK</div>
                   <div :style="S.label + 'text-align:center; padding:4px; font-size:6pt; border-top:1px solid #000;'">RIGHT THUMBMARK</div>
                 </div>
                 <div style="flex:1; height:100%; border-right:1px solid #000; padding:16px; display:flex; flex-direction:column; justify-content:flex-end;">
                    <div :style="S.data + 'border-bottom:1px solid #000; text-align:center; padding-bottom:4px; font-size:9pt;'">{{ fullName }}</div>
                    <div style="text-align:center; font-size:7pt; margin-top:4px;">Signature over Printed Name</div>
                 </div>
                 <div style="width:30%; height:100%; display:flex; align-items:center; justify-content:center; padding:8px;">
                    <div style="width:120px; height:160px; border:2px dashed #eee; display:flex; align-items:center; justify-content:center; color:#eee; font-size:6pt; text-align:center;">PHOTO</div>
                 </div>
               </div>
               <div style="position:absolute; bottom:16px; left:32px; font-size:6pt; font-style:italic;">CS FORM 212 (Revised 2017), Page 4 of 4</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
.animate-zoom-in { animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
.custom-scrollbar::-webkit-scrollbar { width: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
</style>
