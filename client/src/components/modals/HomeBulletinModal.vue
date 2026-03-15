<script setup>
import { computed } from 'vue'
import { resolveUrl } from '@/utils/url'

defineOptions({ name: 'HomeBulletinModal' })

// ── Tag colors (same palette as HomeBulletin) ─────────────────────────────────
const TAG_PALETTE = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-purple-50 text-purple-700 border-purple-200',
]
function tagColor(tag) {
  let h = 0
  for (const c of tag) h = (h + c.charCodeAt(0)) % TAG_PALETTE.length
  return TAG_PALETTE[h]
}

const props = defineProps({
  visible:      { type: Boolean, default: false },
  announcement: { type: Object,  default: null },
})
defineEmits(['update:visible'])

// ── Type meta ────────────────────────────────────────────────────────────────
const TYPE_META = {
  general:            { label: 'General',             color: 'bg-slate-100 text-slate-700' },
  interview_schedule: { label: 'Interview Schedule',  color: 'bg-blue-100 text-blue-700' },
  results:            { label: 'Results Release',     color: 'bg-emerald-100 text-emerald-700' },
  memorandum:         { label: 'Memorandum',          color: 'bg-rose-100 text-rose-700' },
  event:              { label: 'Event',               color: 'bg-violet-100 text-violet-700' },
  award:              { label: 'Award',               color: 'bg-amber-100 text-amber-700' },
  policy:             { label: 'Policy',              color: 'bg-indigo-100 text-indigo-700' },
  training:           { label: 'Training',            color: 'bg-teal-100 text-teal-700' },
  system:             { label: 'System Update',       color: 'bg-orange-100 text-orange-700' },
  ier_release:        { label: 'IER Release',         color: 'bg-purple-100 text-purple-700' },
  rqa_release:        { label: 'RQA Release',         color: 'bg-cyan-100 text-cyan-700' },
}

const FILE_ICONS = {
  pdf:   { icon: 'pi-file-pdf',   color: 'text-red-500',     bg: 'bg-red-50',     label: 'PDF' },
  word:  { icon: 'pi-file-word',  color: 'text-blue-600',    bg: 'bg-blue-50',    label: 'Word' },
  excel: { icon: 'pi-file-excel', color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Excel' },
  image: { icon: 'pi-image',      color: 'text-violet-500',  bg: 'bg-violet-50',  label: 'Image' },
  other: { icon: 'pi-file',       color: 'text-slate-500',   bg: 'bg-slate-50',   label: 'File' },
}

const typeMeta = computed(() => {
  const t = props.announcement?.type
  return TYPE_META[t] || TYPE_META.general
})

const scheduledDateLabel = computed(() => {
  const d = props.announcement?.scheduledDate
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
})

const postedDateLabel = computed(() => {
  const d = props.announcement?.createdAt
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
})

const fileIcon = (ft) => FILE_ICONS[ft] || FILE_ICONS.other
const bannerUrl = computed(() => props.announcement?.image ? resolveUrl(props.announcement.image) : '')
</script>

<template>
  <Teleport to="body">
    <Transition name="bulletin-fade">
      <div
        v-if="visible && announcement"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style="background: rgba(10, 5, 30, 0.72); backdrop-filter: blur(6px);"
        @click.self="$emit('update:visible', false)"
      >
        <!-- Panel -->
        <div
          class="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden bm-panel"
          style="max-height: 90vh;"
          @click.stop
        >
          <!-- Hero image (if present) -->
          <div v-if="bannerUrl" class="relative w-full h-52 bg-slate-100 shrink-0 overflow-hidden group">
            <img :src="bannerUrl" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent"></div>

            <!-- Close button -->
            <button @click="$emit('update:visible', false)"
              class="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white/80 hover:text-white flex items-center justify-center transition-all z-10 backdrop-blur-sm">
              <i class="pi pi-times text-sm"></i>
            </button>

            <!-- Type badge + title overlay -->
            <div class="absolute bottom-5 left-7 right-12">
              <span class="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-sm bg-white/20 text-white border border-white/20 inline-block mb-2">
                {{ typeMeta.label }}
              </span>
              <h2 class="text-xl font-black text-white leading-snug drop-shadow-md tracking-tight line-clamp-2">
                {{ announcement.title }}
              </h2>
            </div>
          </div>

          <!-- Header (no image) -->
          <div v-else class="px-7 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
            <div class="flex-1 min-w-0">
              <span :class="['text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full inline-block mb-2', typeMeta.color]">
                {{ typeMeta.label }}
              </span>
              <h2 class="text-lg font-black text-slate-900 leading-snug tracking-tight">{{ announcement.title }}</h2>
            </div>
            <button @click="$emit('update:visible', false)"
              class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>

          <!-- Body (scrollable) -->
          <div class="flex-1 overflow-y-auto custom-scrollbar">

            <!-- Meta strip: schedule + poster + tags -->
            <div class="border-b" style="background: linear-gradient(to right, #FDF7FA, #F5F3FF); border-color:#EEF1F7;">
              <div class="flex flex-wrap gap-x-5 gap-y-3 px-7 py-4">

                <!-- Scheduled date / time / venue -->
                <div v-if="scheduledDateLabel" class="flex items-start gap-2">
                  <i class="pi pi-calendar text-blue-500 text-sm mt-0.5 shrink-0"></i>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Schedule</p>
                    <p class="text-xs font-bold text-slate-700">{{ scheduledDateLabel }}</p>
                    <p v-if="announcement.scheduledTime" class="text-[10px] text-slate-500">{{ announcement.scheduledTime }}</p>
                  </div>
                </div>

                <div v-if="announcement.venue" class="flex items-start gap-2">
                  <i class="pi pi-map-marker text-rose-400 text-sm mt-0.5 shrink-0"></i>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Venue</p>
                    <p class="text-xs font-bold text-slate-700">{{ announcement.venue }}</p>
                  </div>
                </div>

                <div class="flex items-start gap-2">
                  <i class="pi pi-clock text-slate-400 text-sm mt-0.5 shrink-0"></i>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Posted</p>
                    <p class="text-xs font-bold text-slate-600">{{ postedDateLabel }}</p>
                    <p v-if="announcement.postedBy?.username" class="text-[10px] text-slate-400">by {{ announcement.postedBy.username }}</p>
                  </div>
                </div>
              </div>

              <!-- Tags -->
              <div v-if="announcement.tags?.length" class="px-7 pb-4 flex flex-wrap gap-1.5">
                <span
                  v-for="tag in announcement.tags" :key="tag"
                  :class="['inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-[10px] font-black border', tagColor(tag)]"
                >
                  <span class="opacity-50">#</span>{{ tag }}
                </span>
              </div>
            </div>

            <!-- Content -->
            <div class="px-7 py-5">
              <div class="bm-content text-sm text-slate-600 leading-relaxed" v-html="announcement.content"></div>
            </div>

            <!-- Related Links -->
            <div v-if="announcement.links?.length" class="px-7 pb-5 space-y-2">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                <i class="pi pi-link mr-1.5"></i>Related Links
              </p>
              <template v-for="lnk in announcement.links" :key="lnk._id || lnk.url">
                <!-- Resource link -->
                <div v-if="lnk.type === 'resource' && lnk.resourceId"
                  class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                  <div class="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <i class="pi pi-file-pdf text-red-500 text-sm"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-slate-700 truncate">{{ lnk.label || lnk.resourceId.title }}</p>
                    <p class="text-[9px] text-slate-400 font-bold uppercase">Resource</p>
                  </div>
                  <a :href="resolveUrl(lnk.resourceId.filePath)" :download="lnk.resourceId.originalName" target="_blank"
                    class="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black text-white transition-all"
                    style="background: #4A4D8F;">
                    <i class="pi pi-download text-[9px]"></i>
                    Download
                  </a>
                </div>

                <!-- Job link -->
                <div v-else-if="lnk.type === 'job' && lnk.jobId"
                  class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                  <div class="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <i class="pi pi-briefcase text-indigo-500 text-sm"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-slate-700 truncate">{{ lnk.label || lnk.jobId.positionTitle }}</p>
                    <p class="text-[9px] text-slate-400 font-bold uppercase">{{ lnk.jobId.positionCode }}</p>
                  </div>
                  <a href="/vacancies" target="_blank"
                    class="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black text-white transition-all"
                    style="background: #4A4D8F;">
                    <i class="pi pi-external-link text-[9px]"></i>
                    View
                  </a>
                </div>

                <!-- URL link -->
                <div v-else-if="lnk.type === 'url' && lnk.url"
                  class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                  <div class="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                    <i class="pi pi-globe text-teal-500 text-sm"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-slate-700 truncate">{{ lnk.label || lnk.url }}</p>
                    <p class="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[180px]">{{ lnk.url }}</p>
                  </div>
                  <a :href="lnk.url" target="_blank" rel="noopener noreferrer"
                    class="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black text-white transition-all"
                    style="background: #4A4D8F;">
                    <i class="pi pi-external-link text-[9px]"></i>
                    Open
                  </a>
                </div>
              </template>
            </div>

            <!-- Attachments -->
            <div v-if="announcement.attachments?.length" class="px-7 pb-5 space-y-2">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                <i class="pi pi-paperclip mr-1.5"></i>Attached Files
              </p>
              <a v-for="att in announcement.attachments" :key="att.fileUrl"
                :href="resolveUrl(att.fileUrl)" target="_blank" download
                class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 transition-all group">
                <div :class="['w-9 h-9 rounded-xl flex items-center justify-center shrink-0', fileIcon(att.fileType).bg]">
                  <i :class="['pi text-sm', fileIcon(att.fileType).icon, fileIcon(att.fileType).color]"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-slate-700 truncate group-hover:text-blue-700 transition-colors">{{ att.fileName }}</p>
                  <p class="text-[9px] text-slate-400 font-bold uppercase">{{ fileIcon(att.fileType).label }}</p>
                </div>
                <i class="pi pi-download text-slate-400 group-hover:text-blue-500 transition-colors text-sm shrink-0"></i>
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-7 py-5 flex justify-between items-center shrink-0 bg-white" style="border-top: 1px solid #EEF1F7;">
            <div class="text-[9px] font-bold uppercase tracking-widest" style="color:#9DAABB;">
              <i class="pi pi-shield mr-1" style="color:#D4739A;"></i>
              SDO Guihulngan City
            </div>
            <button @click="$emit('update:visible', false)"
              class="px-7 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all duration-300 hover:scale-105 active:scale-95 bm-close-btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bulletin-fade-enter-active,
.bulletin-fade-leave-active { transition: opacity 0.3s ease; }
.bulletin-fade-enter-from,
.bulletin-fade-leave-to { opacity: 0; }

.bm-panel {
  animation: bmZoomIn 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes bmZoomIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.bm-close-btn {
  background: linear-gradient(135deg, #D4739A, #B05090, #6B3AA0);
  box-shadow: 0 6px 20px rgba(176, 80, 144, 0.3);
}
.bm-close-btn:hover {
  box-shadow: 0 10px 28px rgba(176, 80, 144, 0.45);
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #EEF1F7; border-radius: 10px; }

/* Rich HTML content from server (IER tables, headings, paragraphs) */
.bm-content :deep(p)    { margin-bottom: 0.75rem; }
.bm-content :deep(h3)   { font-size: 0.95rem; font-weight: 900; margin: 1.25rem 0 0.5rem; }
.bm-content :deep(h4)   { font-size: 0.875rem; font-weight: 800; margin: 1rem 0 0.4rem; }
.bm-content :deep(table){ width: 100%; border-collapse: collapse; font-size: 0.8rem; margin: 0.75rem 0; }
.bm-content :deep(th),
.bm-content :deep(td)   { padding: 8px 10px; border: 1px solid #E2E8F0; text-align: left; }
.bm-content :deep(thead tr) { background: #F8FAFC; }
.bm-content :deep(strong)   { font-weight: 800; }
.bm-content :deep(div[style*="background-color: #eff6ff"]),
.bm-content :deep(div[style*="background-color:#eff6ff"]) { border-radius: 8px; }
</style>
