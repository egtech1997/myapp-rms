<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'
import { resolveUrl } from '@/utils/url'
import {
  AppButton, AppModal, AppInput, AppTextarea,
  AppPageHeader, AppSelect, AppFilterBar,
} from '@/components/ui'

const toast = inject('$toast')
const swal  = inject('$swal')
const authStore = useAuthStore()

// ── Type config ──────────────────────────────────────────────────────────────
const TYPE_META = {
  general:            { label: 'General',               icon: 'pi-megaphone',     color: 'bg-slate-100 text-slate-700 border-slate-200' },
  interview_schedule: { label: 'Interview Schedule',    icon: 'pi-calendar-plus', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  results:            { label: 'Results Release',       icon: 'pi-list-check',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  memorandum:         { label: 'Memorandum / DO',       icon: 'pi-file-pdf',      color: 'bg-rose-100 text-rose-700 border-rose-200' },
  event:              { label: 'Event / Activity',      icon: 'pi-star',          color: 'bg-violet-100 text-violet-700 border-violet-200' },
  award:              { label: 'Award / Accreditation', icon: 'pi-trophy',        color: 'bg-amber-100 text-amber-700 border-amber-200' },
  policy:             { label: 'Policy / Guidelines',   icon: 'pi-shield',        color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  training:           { label: 'Training / Seminar',    icon: 'pi-desktop',       color: 'bg-teal-100 text-teal-700 border-teal-200' },
  system:             { label: 'System Update',         icon: 'pi-cog',           color: 'bg-orange-100 text-orange-700 border-orange-200' },
  ier_release:        { label: 'IER Release',           icon: 'pi-verified',      color: 'bg-purple-100 text-purple-700 border-purple-200' },
  rqa_release:        { label: 'RQA Release',           icon: 'pi-chart-bar',     color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
}
const typeMeta = (t) => TYPE_META[t] || TYPE_META.general

const SCHEDULED_TYPES = new Set(['interview_schedule', 'event', 'training', 'results'])

// ── Tag config ───────────────────────────────────────────────────────────────
const TAG_PRESETS = [
  'HRMPSB', 'DepEd Order', 'Division Memo', 'Teaching',
  'Non-Teaching', 'Teaching-Related', 'Elementary', 'Secondary',
  'Urgent', 'For Action', 'FYI', 'Hiring 2025',
]
const TAG_PALETTE = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-sky-50 text-sky-700 border-sky-200',
  'bg-pink-50 text-pink-700 border-pink-200',
]
function tagColor(tag) {
  let h = 0; for (const c of tag) h = (h + c.charCodeAt(0)) % TAG_PALETTE.length
  return TAG_PALETTE[h]
}

// ── File icons ───────────────────────────────────────────────────────────────
const FILE_ICONS = {
  pdf:   { icon: 'pi-file-pdf',   color: 'text-red-500',     bg: 'bg-red-50',     label: 'PDF' },
  word:  { icon: 'pi-file-word',  color: 'text-blue-600',    bg: 'bg-blue-50',    label: 'Word' },
  excel: { icon: 'pi-file-excel', color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Excel' },
  image: { icon: 'pi-image',      color: 'text-violet-500',  bg: 'bg-violet-50',  label: 'Image' },
  other: { icon: 'pi-file',       color: 'text-slate-500',   bg: 'bg-slate-50',   label: 'File' },
}
const fileIcon = (ft) => FILE_ICONS[ft] || FILE_ICONS.other

function guessMimeType(file) {
  const n = file.name?.toLowerCase() || ''
  if (n.endsWith('.pdf'))                         return 'pdf'
  if (n.endsWith('.doc') || n.endsWith('.docx'))  return 'word'
  if (n.endsWith('.xls') || n.endsWith('.xlsx'))  return 'excel'
  if (/\.(jpg|jpeg|png|gif|webp)$/.test(n))       return 'image'
  return 'other'
}

// ── State ────────────────────────────────────────────────────────────────────
const announcements = ref([])
const resources     = ref([])
const jobs          = ref([])
const loading       = ref(true)
const showDrawer    = ref(false)
const isEditing     = ref(false)
const saving        = ref(false)
const editingId     = ref(null)
const filterStatus  = ref('all')
const filterType    = ref('all')
const searchQ       = ref('')

const emptyForm = () => ({
  title: '', content: '', type: 'general', status: 'published',
  expiryDate: '', scheduledDate: '', scheduledTime: '', venue: '',
  tags: [], links: [],
})

const form              = ref(emptyForm())
const imageFile         = ref(null)
const imagePreview      = ref('')
const keepImage         = ref(true)
const newAttachments    = ref([])
const keepAttachments   = ref([])
const tagInput          = ref('')
const newLinkType       = ref('resource')
const newLinkResourceId = ref('')
const newLinkJobId      = ref('')
const newLinkUrl        = ref('')
const newLinkLabel      = ref('')

const showScheduleFields = computed(() => SCHEDULED_TYPES.has(form.value.type))
const canManage = computed(() => authStore.isAdmin || authStore.can('ann_manage'))

// ── Filter options ────────────────────────────────────────────────────────────
const statusFilters = computed(() => [
  { key: 'all',       label: 'All',       count: announcements.value.length },
  { key: 'published', label: 'Published', icon: 'pi-eye',      count: announcements.value.filter(a => a.status === 'published').length },
  { key: 'draft',     label: 'Drafts',    icon: 'pi-pencil',   count: announcements.value.filter(a => a.status === 'draft').length },
])

const typeOptions = computed(() => [
  { label: 'All Types', value: 'all' },
  ...Object.entries(TYPE_META).map(([key, val]) => ({ label: val.label, value: key })),
])

const filteredAnnouncements = computed(() => {
  let list = announcements.value
  if (filterStatus.value !== 'all') list = list.filter(a => a.status === filterStatus.value)
  if (filterType.value   !== 'all') list = list.filter(a => a.type   === filterType.value)
  if (searchQ.value) {
    const q = searchQ.value.toLowerCase()
    list = list.filter(a => a.title.toLowerCase().includes(q) || (a.content || '').toLowerCase().includes(q))
  }
  return list
})

const resourceOptions = computed(() => resources.value.map(r => ({ label: r.title, value: r._id })))
const jobOptions = computed(() =>
  jobs.value.map(j => ({ label: `${j.positionTitle} (${j.positionCode || j.itemNumbers?.[0] || ''})`, value: j._id }))
)

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—'
const formatScheduledDate = (d) => d
  ? new Date(d).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  : ''
const formatBytes = (b) => {
  if (!b) return ''
  if (b < 1024)    return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchAnnouncements() {
  loading.value = true
  try {
    const { data } = await apiClient.get('/v1/announcements/admin')
    announcements.value = data.data
  } catch { toast?.fire({ icon: 'error', title: 'Failed to load announcements' }) }
  finally { loading.value = false }
}
async function fetchResources() {
  try { const { data } = await apiClient.get('/v1/resources/admin'); resources.value = data.data || [] } catch {}
}
async function fetchJobs() {
  try {
    const { data } = await apiClient.get('/v1/jobs')
    jobs.value = (data.data || data.jobs || []).filter(j => j.status === 'published' || j.status === 'draft')
  } catch {}
}

onMounted(() => Promise.all([fetchAnnouncements(), fetchResources(), fetchJobs()]))

// ── Tag management ────────────────────────────────────────────────────────────
function addTag(tag) {
  const t = (tag || tagInput.value).trim()
  if (t && !form.value.tags.includes(t)) form.value.tags.push(t)
  tagInput.value = ''
}
function removeTag(i) { form.value.tags.splice(i, 1) }
function onTagKeydown(e) {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
  if (e.key === 'Backspace' && !tagInput.value && form.value.tags.length) form.value.tags.pop()
}

// ── Link management ───────────────────────────────────────────────────────────
function addLink() {
  if (newLinkType.value === 'resource' && !newLinkResourceId.value) return
  if (newLinkType.value === 'job'      && !newLinkJobId.value)      return
  if (newLinkType.value === 'url'      && !newLinkUrl.value.trim()) return

  const link = { type: newLinkType.value }
  if (newLinkType.value === 'resource') {
    link.resourceId = newLinkResourceId.value
    link.label = newLinkLabel.value.trim() || resources.value.find(r => r._id === newLinkResourceId.value)?.title || 'Resource'
  } else if (newLinkType.value === 'job') {
    link.jobId = newLinkJobId.value
    const j = jobs.value.find(j => j._id === newLinkJobId.value)
    link.label = newLinkLabel.value.trim() || (j ? j.positionTitle : 'Job Vacancy')
  } else {
    link.url   = newLinkUrl.value.trim()
    link.label = newLinkLabel.value.trim() || newLinkUrl.value.trim()
  }
  form.value.links.push(link)
  newLinkResourceId.value = ''; newLinkJobId.value = ''
  newLinkUrl.value = ''; newLinkLabel.value = ''
}
function removeLink(i) { form.value.links.splice(i, 1) }

function linkDisplayLabel(lnk) {
  if (lnk.label) return lnk.label
  if (lnk.type === 'resource' && lnk.resourceId) {
    const r = typeof lnk.resourceId === 'object' ? lnk.resourceId : resources.value.find(r => r._id === lnk.resourceId)
    return r?.title || 'Resource'
  }
  if (lnk.type === 'job' && lnk.jobId) {
    const j = typeof lnk.jobId === 'object' ? lnk.jobId : jobs.value.find(j => j._id === lnk.jobId)
    return j?.positionTitle || 'Job Vacancy'
  }
  return lnk.url || 'Link'
}

const LINK_TYPE_OPTS = [
  { label: 'Resource / Form', value: 'resource' },
  { label: 'Job Vacancy',     value: 'job' },
  { label: 'External URL',    value: 'url' },
]

// ── Image handling ─────────────────────────────────────────────────────────────
const onImagePick = (e) => {
  const file = e.target.files[0]; if (!file) return
  imageFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { imagePreview.value = ev.target.result }
  reader.readAsDataURL(file)
}
const clearImage = () => { imageFile.value = null; imagePreview.value = ''; keepImage.value = false }

// ── Attachment handling ────────────────────────────────────────────────────────
const onAttachmentPick = (e) => {
  newAttachments.value.push(...Array.from(e.target.files || []))
  e.target.value = ''
}
const removeNewAttachment  = (i) => newAttachments.value.splice(i, 1)
const removeKeepAttachment = (i) => keepAttachments.value.splice(i, 1)

// ── CRUD ───────────────────────────────────────────────────────────────────────
function openCreate() {
  form.value = emptyForm(); imageFile.value = null; imagePreview.value = ''
  keepImage.value = true; newAttachments.value = []; keepAttachments.value = []
  tagInput.value = ''; newLinkType.value = 'resource'
  editingId.value = null; isEditing.value = false; showDrawer.value = true
}

function openEdit(item) {
  form.value = {
    title: item.title, content: item.content, type: item.type || 'general',
    status: item.status,
    expiryDate:    item.expiryDate    ? item.expiryDate.slice(0, 10)    : '',
    scheduledDate: item.scheduledDate ? item.scheduledDate.slice(0, 10) : '',
    scheduledTime: item.scheduledTime || '',
    venue:         item.venue         || '',
    tags:  Array.isArray(item.tags) ? [...item.tags] : [],
    links: (item.links || []).map(l => ({
      type:       l.type,
      label:      l.label || '',
      resourceId: l.resourceId?._id || l.resourceId || '',
      jobId:      l.jobId?._id      || l.jobId      || '',
      url:        l.url || '',
    })),
  }
  imageFile.value       = null
  imagePreview.value    = item.image ? resolveUrl(item.image) : ''
  keepImage.value       = !!item.image
  newAttachments.value  = []
  keepAttachments.value = item.attachments ? [...item.attachments] : []
  tagInput.value        = ''
  newLinkType.value     = 'resource'
  editingId.value       = item._id
  isEditing.value       = true
  showDrawer.value      = true
}

async function handleSubmit() {
  if (!form.value.title || !form.value.content) {
    toast?.fire({ icon: 'warning', title: 'Title and content are required.' }); return
  }
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('title',   form.value.title)
    fd.append('content', form.value.content)
    fd.append('type',    form.value.type)
    fd.append('status',  form.value.status)
    if (form.value.expiryDate)    fd.append('expiryDate',    form.value.expiryDate)
    if (form.value.scheduledDate) fd.append('scheduledDate', form.value.scheduledDate)
    if (form.value.scheduledTime) fd.append('scheduledTime', form.value.scheduledTime)
    if (form.value.venue)         fd.append('venue',         form.value.venue)
    fd.append('tags',  JSON.stringify(form.value.tags))
    fd.append('links', JSON.stringify(form.value.links))
    if (imageFile.value) fd.append('image', imageFile.value)
    else if (!keepImage.value) fd.append('removeImage', 'true')
    fd.append('existingAttachments', JSON.stringify(keepAttachments.value))
    for (const f of newAttachments.value) fd.append('attachments', f)

    if (isEditing.value) {
      const { data } = await apiClient.patch(`/v1/announcements/${editingId.value}`, fd)
      const idx = announcements.value.findIndex(a => a._id === editingId.value)
      if (idx !== -1) announcements.value[idx] = data.data
      toast?.fire({ icon: 'success', title: 'Announcement Updated' })
    } else {
      const { data } = await apiClient.post('/v1/announcements', fd)
      announcements.value.unshift(data.data)
      toast?.fire({ icon: 'success', title: 'Announcement Published' })
    }
    showDrawer.value = false
  } catch (err) {
    toast?.fire({ icon: 'error', title: err.response?.data?.message || 'Failed to save.' })
  } finally { saving.value = false }
}

async function handleDelete(id) {
  const result = await swal?.fire({
    title: 'Delete Announcement?', text: 'This cannot be undone.', icon: 'warning',
    showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Delete', reverseButtons: true,
  })
  if (!result?.isConfirmed) return
  try {
    await apiClient.delete(`/v1/announcements/${id}`)
    announcements.value = announcements.value.filter(a => a._id !== id)
    toast?.fire({ icon: 'success', title: 'Deleted' })
  } catch { toast?.fire({ icon: 'error', title: 'Delete failed' }) }
}

async function toggleStatus(item) {
  const newStatus = item.status === 'published' ? 'draft' : 'published'
  try {
    const fd = new FormData(); fd.append('status', newStatus)
    const { data } = await apiClient.patch(`/v1/announcements/${item._id}`, fd)
    const idx = announcements.value.findIndex(a => a._id === item._id)
    if (idx !== -1) announcements.value[idx] = data.data
    toast?.fire({ icon: 'success', title: newStatus === 'published' ? 'Published' : 'Set to Draft' })
  } catch { toast?.fire({ icon: 'error', title: 'Failed to update status' }) }
}
</script>

<template>
  <div class="flex flex-col gap-5 animate-fade-in">

    <AppPageHeader title="Public Bulletin" subtitle="Manage announcements and schedules visible on the home portal." icon="pi-megaphone">
      <template #actions>
        <AppButton v-if="canManage" variant="primary" icon="pi-plus" @click="openCreate">
          New Announcement
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Filter bar -->
    <AppFilterBar
      v-model:search="searchQ"
      v-model:filter="filterStatus"
      :filters="statusFilters"
      :filter-count="Number(filterType !== 'all')"
      placeholder="Search by title or content..."
      @clear="filterStatus = 'all'; filterType = 'all'; searchQ = ''"
    >
      <template #filter-extra>
        <p class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wide px-1">Announcement Type</p>
        <AppSelect
          v-model="filterType"
          :options="typeOptions"
          size="sm"
          label=""
          placeholder="All Types"
        />
      </template>
    </AppFilterBar>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="h-52 rounded-2xl bg-[var(--surface)] border border-[var(--border-main)] animate-pulse"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredAnnouncements.length === 0"
      class="py-24 flex flex-col items-center justify-center text-center bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl">
      <div class="w-16 h-16 rounded-2xl bg-[var(--bg-app)] flex items-center justify-center mb-4">
        <i class="pi pi-megaphone text-3xl text-[var(--text-muted)]"></i>
      </div>
      <p class="text-sm font-bold text-[var(--text-main)]">No announcements found</p>
      <p class="text-xs text-[var(--text-muted)] mt-1">Adjust your filters or create a new announcement.</p>
    </div>

    <!-- Card grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="item in filteredAnnouncements" :key="item._id"
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:border-[var(--color-primary)]/40 hover:shadow-md transition-all duration-200"
      >
        <!-- Banner image -->
        <div v-if="item.image" class="relative h-36 overflow-hidden shrink-0">
          <img :src="resolveUrl(item.image)" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div class="absolute top-3 left-3">
            <span :class="['text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border backdrop-blur-sm bg-white/90', typeMeta(item.type).color]">
              <i :class="['pi text-[9px] mr-1', typeMeta(item.type).icon]"></i>{{ typeMeta(item.type).label }}
            </span>
          </div>
          <div v-if="item.status === 'draft'" class="absolute top-3 right-3">
            <span class="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">Draft</span>
          </div>
        </div>

        <!-- Card body -->
        <div class="flex-1 p-5 flex flex-col gap-2.5">

          <!-- Type badge + status (no banner) -->
          <div v-if="!item.image" class="flex items-center gap-2 flex-wrap">
            <span :class="['text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border', typeMeta(item.type).color]">
              <i :class="['pi text-[9px] mr-1', typeMeta(item.type).icon]"></i>{{ typeMeta(item.type).label }}
            </span>
            <span :class="['text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border',
              item.status === 'published'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-500 border-slate-200']">
              {{ item.status }}
            </span>
          </div>

          <!-- Title -->
          <h3 class="text-sm font-black text-[var(--text-main)] leading-snug line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
            {{ item.title }}
          </h3>

          <!-- Tags -->
          <div v-if="item.tags?.length" class="flex flex-wrap gap-1">
            <span
              v-for="tag in item.tags.slice(0, 4)" :key="tag"
              :class="['text-[9px] font-bold px-2 py-0.5 rounded-full border', tagColor(tag)]"
            ># {{ tag }}</span>
            <span v-if="item.tags.length > 4" class="text-[9px] font-bold text-[var(--text-faint)]">+{{ item.tags.length - 4 }}</span>
          </div>

          <!-- Schedule -->
          <div v-if="item.scheduledDate" class="flex items-center gap-2 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
            <i class="pi pi-calendar text-[9px]"></i>
            {{ formatScheduledDate(item.scheduledDate) }}
            <span v-if="item.scheduledTime" class="text-blue-400">· {{ item.scheduledTime }}</span>
          </div>
          <div v-if="item.venue" class="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)]">
            <i class="pi pi-map-marker text-rose-400 text-[9px]"></i>{{ item.venue }}
          </div>

          <!-- Excerpt -->
          <p class="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed flex-1">
            {{ item.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() }}
          </p>

          <!-- Linked items -->
          <div v-if="item.links?.length" class="flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-primary)]">
            <i class="pi pi-link text-[9px]"></i>
            {{ item.links.length }} linked {{ item.links.length === 1 ? 'item' : 'items' }}
          </div>

          <!-- Attachment chips -->
          <div v-if="item.attachments?.length" class="flex items-center gap-1.5 flex-wrap">
            <div
              v-for="att in item.attachments.slice(0, 3)" :key="att.fileUrl"
              :class="['flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full border', fileIcon(att.fileType).bg]"
            >
              <i :class="['pi text-[9px]', fileIcon(att.fileType).icon, fileIcon(att.fileType).color]"></i>
              <span :class="['truncate max-w-[70px]', fileIcon(att.fileType).color]">{{ att.fileName }}</span>
            </div>
            <span v-if="item.attachments.length > 3" class="text-[9px] text-[var(--text-faint)] font-bold">+{{ item.attachments.length - 3 }}</span>
          </div>

          <!-- Footer: date + author -->
          <div class="flex items-center justify-between pt-2.5 border-t border-[var(--border-main)]">
            <span class="text-[9px] font-bold text-[var(--text-faint)]">{{ formatDate(item.createdAt) }}</span>
            <span v-if="item.postedBy" class="text-[9px] font-bold text-[var(--text-muted)]">by {{ item.postedBy.username }}</span>
          </div>
        </div>

        <!-- Action bar -->
        <div v-if="canManage" class="px-5 py-3 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex items-center justify-between gap-2">
          <button
            @click="toggleStatus(item)"
            :class="['text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all flex items-center gap-1',
              item.status === 'published'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--surface)]']"
          >
            <i :class="['pi text-[9px]', item.status === 'published' ? 'pi-eye' : 'pi-eye-slash']"></i>
            {{ item.status === 'published' ? 'Published' : 'Draft' }}
          </button>
          <div class="flex items-center gap-1">
            <button @click="openEdit(item)"
              class="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--surface)] transition-colors flex items-center gap-1">
              <i class="pi pi-pencil text-[9px]"></i> Edit
            </button>
            <button @click="handleDelete(item._id)"
              class="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-1">
              <i class="pi pi-trash text-[9px]"></i> Delete
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- ── Create / Edit Modal ─────────────────────────────────────────────────── -->
  <AppModal
    v-model="showDrawer"
    :title="isEditing ? 'Edit Announcement' : 'New Announcement'"
    :subtitle="isEditing ? 'Update this bulletin post.' : 'Create a new official bulletin post.'"
    icon="pi-megaphone"
    size="lg"
  >
    <div class="space-y-7">

      <!-- ① Announcement Type ──────────────────────────────────────────────── -->
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-faint)] whitespace-nowrap">Announcement Type</span>
          <div class="flex-1 h-px bg-[var(--border-main)]"></div>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="[key, meta] in Object.entries(TYPE_META)" :key="key"
            type="button" @click="form.type = key"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all"
            :class="form.type === key
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm'
              : `border-[var(--border-main)] ${meta.color} hover:border-[var(--color-primary)]/50`"
          >
            <i :class="['pi text-[9px]', meta.icon]"></i>{{ meta.label }}
          </button>
        </div>
      </div>

      <!-- ② Core Content ───────────────────────────────────────────────────── -->
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-faint)] whitespace-nowrap">Content</span>
          <div class="flex-1 h-px bg-[var(--border-main)]"></div>
        </div>
        <AppInput v-model="form.title" label="Title" placeholder="e.g. Schedule of BEI for Teacher I Position" required />
        <AppTextarea v-model="form.content" label="Content" :rows="6"
          placeholder="Provide the full announcement text, details, and instructions..." />
      </div>

      <!-- ③ Schedule (conditional) ─────────────────────────────────────────── -->
      <div v-if="showScheduleFields" class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-faint)] whitespace-nowrap">Schedule Details</span>
          <div class="flex-1 h-px bg-[var(--border-main)]"></div>
        </div>
        <div class="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
          <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">
            <i class="pi pi-calendar text-blue-500"></i> Fill in date, time, and venue for this event
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AppInput v-model="form.scheduledDate" label="Date" type="date" size="sm" />
            <AppInput v-model="form.scheduledTime" label="Time" placeholder="09:00 AM – 12:00 PM" size="sm" />
          </div>
          <AppInput v-model="form.venue" label="Venue / Location" placeholder="e.g. SDO Conference Room" size="sm" />
        </div>
      </div>

      <!-- ④ Tags ───────────────────────────────────────────────────────────── -->
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-faint)] whitespace-nowrap">Tags</span>
          <div class="flex-1 h-px bg-[var(--border-main)]"></div>
          <span class="text-[10px] text-[var(--text-faint)]">Press Enter or comma to add</span>
        </div>

        <!-- Preset chips -->
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="preset in TAG_PRESETS" :key="preset"
            type="button" @click="addTag(preset)"
            :disabled="form.tags.includes(preset)"
            :class="['text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all',
              form.tags.includes(preset)
                ? 'opacity-30 cursor-not-allowed border-[var(--border-main)] text-[var(--text-faint)]'
                : 'border-[var(--border-main)] text-[var(--text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-pointer']"
          >+ {{ preset }}</button>
        </div>

        <!-- Tag pill input (white bg — it's a composite input) -->
        <div
          class="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--surface)] min-h-[2.75rem] focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary-ring)]/20 transition-all cursor-text"
          @click="$refs.tagInputEl?.focus()"
        >
          <span
            v-for="(tag, i) in form.tags" :key="tag"
            :class="['flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border', tagColor(tag)]"
          >
            # {{ tag }}
            <button type="button" @click.stop="removeTag(i)" class="hover:opacity-60 ml-0.5">
              <i class="pi pi-times text-[8px]"></i>
            </button>
          </span>
          <input
            ref="tagInputEl" v-model="tagInput" @keydown="onTagKeydown"
            placeholder="Type a tag..."
            class="bg-transparent text-xs outline-none flex-1 min-w-[100px] text-[var(--text-main)] placeholder:text-[var(--text-faint)]"
          />
        </div>
      </div>

      <!-- ⑤ Related Links ──────────────────────────────────────────────────── -->
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-faint)] whitespace-nowrap">Related Links</span>
          <div class="flex-1 h-px bg-[var(--border-main)]"></div>
          <span class="text-[10px] text-[var(--text-faint)]">Resources, vacancies, or URLs</span>
        </div>

        <!-- Existing links -->
        <div v-if="form.links.length" class="space-y-2">
          <div
            v-for="(lnk, i) in form.links" :key="i"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--surface)]"
          >
            <div :class="['w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
              lnk.type === 'resource' ? 'bg-red-50 text-red-500' :
              lnk.type === 'job'      ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' :
                                        'bg-sky-50 text-sky-600']">
              <i :class="['pi text-xs',
                lnk.type === 'resource' ? 'pi-file-pdf' :
                lnk.type === 'job'      ? 'pi-briefcase' : 'pi-link']"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold text-[var(--text-main)] truncate">{{ linkDisplayLabel(lnk) }}</p>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">
                {{ lnk.type === 'resource' ? 'Resource / Form' : lnk.type === 'job' ? 'Job Vacancy' : 'External URL' }}
              </p>
            </div>
            <button type="button" @click="removeLink(i)"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0">
              <i class="pi pi-times text-xs"></i>
            </button>
          </div>
        </div>

        <!-- Add link form -->
        <div class="rounded-xl border border-dashed border-[var(--border-main)] p-4 space-y-3">
          <p class="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-faint)]">Add a link</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <AppSelect v-model="newLinkType" label="Type" size="sm" :options="LINK_TYPE_OPTS" />
            <template v-if="newLinkType === 'resource'">
              <div class="sm:col-span-2">
                <AppSelect v-model="newLinkResourceId" label="Select Resource" size="sm" :options="resourceOptions" placeholder="Choose a resource..." />
              </div>
            </template>
            <template v-else-if="newLinkType === 'job'">
              <div class="sm:col-span-2">
                <AppSelect v-model="newLinkJobId" label="Select Job Vacancy" size="sm" :options="jobOptions" placeholder="Choose a vacancy..." />
              </div>
            </template>
            <template v-else>
              <div class="sm:col-span-2">
                <AppInput v-model="newLinkUrl" label="URL" size="sm" placeholder="https://..." />
              </div>
            </template>
          </div>
          <div class="flex gap-3 items-end">
            <AppInput v-model="newLinkLabel" label="Custom label (optional)" size="sm" placeholder="e.g. Download PDS Form" class="flex-1" />
            <button type="button" @click="addLink" class="btn-primary h-9 px-4 text-xs flex items-center gap-1.5 shrink-0">
              <i class="pi pi-plus text-[10px]"></i> Add
            </button>
          </div>
        </div>
      </div>

      <!-- ⑥ Banner Image ───────────────────────────────────────────────────── -->
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-faint)] whitespace-nowrap">Banner Image</span>
          <div class="flex-1 h-px bg-[var(--border-main)]"></div>
          <span class="text-[10px] text-[var(--text-faint)]">Optional</span>
        </div>

        <!-- Preview -->
        <div v-if="imagePreview" class="relative mb-1 rounded-xl overflow-hidden h-36">
          <img :src="imagePreview" class="w-full h-full object-cover" />
          <button type="button" @click="clearImage"
            class="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-rose-600 text-white flex items-center justify-center transition-colors">
            <i class="pi pi-times text-xs"></i>
          </button>
        </div>

        <!-- Upload zone -->
        <label class="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-[var(--border-main)] hover:border-[var(--color-primary)] cursor-pointer transition-colors group">
          <div class="w-10 h-10 rounded-xl border border-[var(--border-main)] group-hover:border-[var(--color-primary)]/40 flex items-center justify-center shrink-0 transition-colors">
            <i class="pi pi-image text-[var(--color-primary)] text-lg"></i>
          </div>
          <div>
            <p class="text-xs font-bold text-[var(--text-main)]">{{ imagePreview ? 'Replace image' : 'Upload banner image' }}</p>
            <p class="text-[10px] text-[var(--text-muted)]">JPG, PNG, WebP — max 20 MB</p>
          </div>
          <input type="file" accept="image/*" class="sr-only" @change="onImagePick" />
        </label>
      </div>

      <!-- ⑦ Attachments ───────────────────────────────────────────────────── -->
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-faint)] whitespace-nowrap">Attachments</span>
          <div class="flex-1 h-px bg-[var(--border-main)]"></div>
          <span class="text-[10px] text-[var(--text-faint)]">PDF, Word, Excel, Images</span>
        </div>

        <!-- Kept attachments (edit) -->
        <div v-if="keepAttachments.length" class="space-y-1.5">
          <div
            v-for="(att, i) in keepAttachments" :key="att.fileUrl"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--surface)]"
          >
            <div :class="['w-7 h-7 rounded-lg flex items-center justify-center shrink-0', fileIcon(att.fileType).bg]">
              <i :class="['pi text-xs', fileIcon(att.fileType).icon, fileIcon(att.fileType).color]"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-bold text-[var(--text-main)] truncate">{{ att.fileName }}</p>
              <p v-if="att.fileSize" class="text-[9px] text-[var(--text-faint)]">{{ formatBytes(att.fileSize) }}</p>
            </div>
            <a :href="resolveUrl(att.fileUrl)" target="_blank"
              class="w-7 h-7 rounded-lg hover:bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors">
              <i class="pi pi-external-link text-[10px]"></i>
            </a>
            <button type="button" @click="removeKeepAttachment(i)"
              class="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-[var(--text-muted)] hover:text-rose-500 transition-colors">
              <i class="pi pi-times text-[10px]"></i>
            </button>
          </div>
        </div>

        <!-- New file queue -->
        <div v-if="newAttachments.length" class="space-y-1.5">
          <div
            v-for="(f, i) in newAttachments" :key="i"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-light)]"
          >
            <div class="w-7 h-7 rounded-lg bg-white border border-[var(--border-main)] flex items-center justify-center shrink-0">
              <i :class="['pi text-xs', fileIcon(guessMimeType(f)).icon, fileIcon(guessMimeType(f)).color]"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-bold text-[var(--text-main)] truncate">{{ f.name }}</p>
              <p class="text-[9px] text-[var(--color-primary)]/70">{{ formatBytes(f.size) }} — pending upload</p>
            </div>
            <button type="button" @click="removeNewAttachment(i)"
              class="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-[var(--text-muted)] hover:text-rose-500 transition-colors">
              <i class="pi pi-times text-[10px]"></i>
            </button>
          </div>
        </div>

        <!-- Drop zone -->
        <label class="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-[var(--border-main)] hover:border-[var(--color-primary)] cursor-pointer transition-colors group">
          <div class="w-10 h-10 rounded-xl border border-[var(--border-main)] group-hover:border-[var(--color-primary)]/40 flex items-center justify-center shrink-0 transition-colors">
            <i class="pi pi-paperclip text-[var(--color-primary)] text-lg"></i>
          </div>
          <div>
            <p class="text-xs font-bold text-[var(--text-main)]">Attach files</p>
            <p class="text-[10px] text-[var(--text-muted)]">PDF, Word, Excel, Images — max 20 MB each</p>
          </div>
          <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" multiple class="sr-only" @change="onAttachmentPick" />
        </label>
      </div>

      <!-- ⑧ Publishing ─────────────────────────────────────────────────────── -->
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-faint)] whitespace-nowrap">Publishing</span>
          <div class="flex-1 h-px bg-[var(--border-main)]"></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            class="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all"
            :class="form.status === 'published'
              ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary-light)]'
              : 'border-[var(--border-main)] bg-[var(--surface)] hover:border-[var(--color-primary)]/30'"
          >
            <input
              type="checkbox" :checked="form.status === 'published'"
              @change="form.status = $event.target.checked ? 'published' : 'draft'"
              class="w-4 h-4 rounded text-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
            />
            <div class="flex-1">
              <p class="text-xs font-black text-[var(--text-main)]">Publish Immediately</p>
              <p class="text-[10px] text-[var(--text-muted)]">Visible to all visitors on the portal</p>
            </div>
          </label>
          <AppInput v-model="form.expiryDate" label="Expiry Date" type="date" size="sm" />
        </div>
      </div>

    </div>

    <template #footer>
      <AppButton variant="ghost" @click="showDrawer = false">Cancel</AppButton>
      <AppButton variant="primary" :loading="saving" @click="handleSubmit">
        {{ isEditing ? 'Update' : 'Publish' }}
      </AppButton>
    </template>
  </AppModal>
</template>
