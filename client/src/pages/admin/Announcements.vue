<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'
import { resolveUrl } from '@/utils/url'
import { AppButton, AppBadge, AppModal, AppInput, AppTextarea, AppPageHeader } from '@/components/ui'

const toast = inject('$toast')
const swal  = inject('$swal')
const authStore = useAuthStore()

// ── Announcement type config ──────────────────────────────────────────────────
const TYPE_META = {
  general:            { label: 'General',              icon: 'pi-megaphone',     color: 'bg-slate-100 text-slate-700 border-slate-200' },
  interview_schedule: { label: 'Interview Schedule',   icon: 'pi-calendar-plus', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  results:            { label: 'Results Release',      icon: 'pi-list-check',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  memorandum:         { label: 'Memorandum / DO',      icon: 'pi-file-pdf',      color: 'bg-rose-100 text-rose-700 border-rose-200' },
  event:              { label: 'Event / Activity',     icon: 'pi-star',          color: 'bg-violet-100 text-violet-700 border-violet-200' },
  award:              { label: 'Award / Accreditation',icon: 'pi-trophy',        color: 'bg-amber-100 text-amber-700 border-amber-200' },
  policy:             { label: 'Policy / Guidelines',  icon: 'pi-shield',        color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  training:           { label: 'Training / Seminar',   icon: 'pi-desktop',       color: 'bg-teal-100 text-teal-700 border-teal-200' },
  system:             { label: 'System Update',        icon: 'pi-cog',           color: 'bg-orange-100 text-orange-700 border-orange-200' },
  ier_release:        { label: 'IER Release',          icon: 'pi-verified',      color: 'bg-purple-100 text-purple-700 border-purple-200' },
  rqa_release:        { label: 'RQA Release',          icon: 'pi-chart-bar',     color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
}
const typeMeta = (t) => TYPE_META[t] || TYPE_META.general

// Types that have a schedule (show date/time/venue fields)
const SCHEDULED_TYPES = new Set(['interview_schedule', 'event', 'training', 'results'])

// ── File type helpers ─────────────────────────────────────────────────────────
const FILE_ICONS = {
  pdf:   { icon: 'pi-file-pdf', color: 'text-red-500', bg: 'bg-red-50', label: 'PDF' },
  word:  { icon: 'pi-file-word', color: 'text-blue-600', bg: 'bg-blue-50', label: 'Word' },
  excel: { icon: 'pi-file-excel', color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Excel' },
  image: { icon: 'pi-image', color: 'text-violet-500', bg: 'bg-violet-50', label: 'Image' },
  other: { icon: 'pi-file', color: 'text-slate-500', bg: 'bg-slate-50', label: 'File' },
}
const fileIcon = (ft) => FILE_ICONS[ft] || FILE_ICONS.other

function guessMimeType(file) {
  const name = file.name?.toLowerCase() || ''
  if (name.endsWith('.pdf'))                      return 'pdf'
  if (name.endsWith('.doc') || name.endsWith('.docx')) return 'word'
  if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'excel'
  if (/\.(jpg|jpeg|png|gif|webp)$/.test(name))   return 'image'
  return 'other'
}

// ── Data ─────────────────────────────────────────────────────────────────────
const announcements = ref([])
const loading = ref(true)
const showDrawer = ref(false)
const isEditing  = ref(false)
const saving     = ref(false)
const editingId  = ref(null)
const filterType = ref('all')
const searchQ    = ref('')

const emptyForm = () => ({
  title:         '',
  content:       '',
  type:          'general',
  status:        'published',
  expiryDate:    '',
  scheduledDate: '',
  scheduledTime: '',
  venue:         '',
})

const form     = ref(emptyForm())
const imageFile    = ref(null)       // File object for new image
const imagePreview = ref('')         // Data URL for preview
const keepImage    = ref(true)       // When editing: keep existing image?
const newAttachments  = ref([])      // Array of File objects
const keepAttachments = ref([])      // Existing attachment objects to keep

const showScheduleFields = computed(() => SCHEDULED_TYPES.has(form.value.type))

// ── Computed ──────────────────────────────────────────────────────────────────
// Permission: announcement_manage (or super_admin bypass via authStore.isAdmin)
const canManage = computed(() => authStore.isAdmin || authStore.can('announcement_manage'))

const filteredAnnouncements = computed(() => {
  let list = announcements.value
  if (filterType.value !== 'all') list = list.filter(a => a.type === filterType.value)
  if (searchQ.value) {
    const q = searchQ.value.toLowerCase()
    list = list.filter(a => a.title.toLowerCase().includes(q) || (a.content || '').toLowerCase().includes(q))
  }
  return list
})

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—'

const formatScheduledDate = (d) => d
  ? new Date(d).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  : ''

// ── Fetch ─────────────────────────────────────────────────────────────────────
const fetchAnnouncements = async () => {
  loading.value = true
  try {
    const { data } = await apiClient.get('/v1/announcements/admin')
    announcements.value = data.data
  } catch {
    toast.fire({ icon: 'error', title: 'Failed to load announcements' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchAnnouncements)

// ── Form helpers ──────────────────────────────────────────────────────────────
const onImagePick = (e) => {
  const file = e.target.files[0]
  if (!file) return
  imageFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { imagePreview.value = ev.target.result }
  reader.readAsDataURL(file)
}

const onAttachmentPick = (e) => {
  const files = Array.from(e.target.files || [])
  newAttachments.value.push(...files)
  e.target.value = '' // allow re-picking the same file
}

const removeNewAttachment = (idx) => newAttachments.value.splice(idx, 1)
const removeKeepAttachment = (idx) => keepAttachments.value.splice(idx, 1)

const clearImage = () => {
  imageFile.value    = null
  imagePreview.value = ''
  keepImage.value    = false
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
const openCreate = () => {
  form.value         = emptyForm()
  imageFile.value    = null
  imagePreview.value = ''
  keepImage.value    = true
  newAttachments.value  = []
  keepAttachments.value = []
  editingId.value    = null
  isEditing.value    = false
  showDrawer.value   = true
}

const openEdit = (item) => {
  form.value = {
    title:         item.title,
    content:       item.content,
    type:          item.type || 'general',
    status:        item.status,
    expiryDate:    item.expiryDate ? item.expiryDate.slice(0, 10) : '',
    scheduledDate: item.scheduledDate ? item.scheduledDate.slice(0, 10) : '',
    scheduledTime: item.scheduledTime || '',
    venue:         item.venue || '',
  }
  imageFile.value       = null
  imagePreview.value    = item.image ? resolveUrl(item.image) : ''
  keepImage.value       = !!item.image
  newAttachments.value  = []
  keepAttachments.value = item.attachments ? [...item.attachments] : []
  editingId.value  = item._id
  isEditing.value  = true
  showDrawer.value = true
}

const handleSubmit = async () => {
  if (!form.value.title || !form.value.content) {
    toast.fire({ icon: 'warning', title: 'Title and content are required.' })
    return
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

    // Image handling
    if (imageFile.value) {
      fd.append('image', imageFile.value)
    } else if (!keepImage.value) {
      fd.append('removeImage', 'true')
    }

    // Keep existing attachments (pass as JSON)
    fd.append('existingAttachments', JSON.stringify(keepAttachments.value))

    // New attachment files
    for (const f of newAttachments.value) {
      fd.append('attachments', f)
    }

    let resData
    if (isEditing.value) {
      const { data } = await apiClient.patch(`/v1/announcements/${editingId.value}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      resData = data.data
      const idx = announcements.value.findIndex(a => a._id === editingId.value)
      if (idx !== -1) announcements.value[idx] = resData
      toast.fire({ icon: 'success', title: 'Announcement Updated' })
    } else {
      const { data } = await apiClient.post('/v1/announcements', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      resData = data.data
      announcements.value.unshift(resData)
      toast.fire({ icon: 'success', title: 'Announcement Published' })
    }
    showDrawer.value = false
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to save.' })
  } finally {
    saving.value = false
  }
}

const handleDelete = async (id) => {
  const result = await swal.fire({
    title: 'Delete Announcement?',
    text: 'This cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    confirmButtonText: 'Delete',
    reverseButtons: true,
  })
  if (!result.isConfirmed) return
  try {
    await apiClient.delete(`/v1/announcements/${id}`)
    announcements.value = announcements.value.filter(a => a._id !== id)
    toast.fire({ icon: 'success', title: 'Deleted' })
  } catch {
    toast.fire({ icon: 'error', title: 'Delete failed' })
  }
}

const toggleStatus = async (item) => {
  const newStatus = item.status === 'published' ? 'draft' : 'published'
  try {
    const fd = new FormData()
    fd.append('status', newStatus)
    const { data } = await apiClient.patch(`/v1/announcements/${item._id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const idx = announcements.value.findIndex(a => a._id === item._id)
    if (idx !== -1) announcements.value[idx] = data.data
    toast.fire({ icon: 'success', title: newStatus === 'published' ? 'Published' : 'Set to Draft' })
  } catch {
    toast.fire({ icon: 'error', title: 'Failed to update status' })
  }
}

const formatBytes = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
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

    <!-- ── Toolbar ── -->
    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-3.5 flex flex-col sm:flex-row gap-3 items-center">
      <!-- Search -->
      <div class="relative flex-1">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none"></i>
        <input v-model="searchQ" placeholder="Search announcements..."
          class="w-full h-10 pl-9 pr-4 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-shadow" />
      </div>
      <!-- Type filter -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <button v-for="[key, val] in [['all', {label: 'All', icon: 'pi-th-large'}], ...Object.entries(TYPE_META)]"
          :key="key" @click="filterType = key"
          class="flex items-center gap-1.5 px-3 h-9 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all"
          :class="filterType === key ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-main)]'">
          <i :class="['pi text-[9px]', key === 'all' ? 'pi-th-large' : val.icon]"></i>
          <span class="hidden sm:inline">{{ key === 'all' ? 'All' : val.label }}</span>
        </button>
      </div>
    </div>

    <!-- ── Stats summary ── -->
    <div v-if="!loading" class="flex flex-wrap gap-2">
      <div class="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-faint)] bg-[var(--surface)] border border-[var(--border-main)] rounded-lg px-3 h-8">
        <i class="pi pi-list text-[9px]"></i>
        {{ announcements.length }} total
      </div>
      <div class="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 h-8">
        <i class="pi pi-check-circle text-[9px]"></i>
        {{ announcements.filter(a => a.status === 'published').length }} published
      </div>
      <div class="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-app)] border border-[var(--border-main)] rounded-lg px-3 h-8">
        <i class="pi pi-pencil text-[9px]"></i>
        {{ announcements.filter(a => a.status === 'draft').length }} drafts
      </div>
    </div>

    <!-- ── Loading ── -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="h-48 rounded-2xl bg-[var(--bg-app)] animate-pulse"></div>
    </div>

    <!-- ── Empty state ── -->
    <div v-else-if="filteredAnnouncements.length === 0"
      class="py-24 flex flex-col items-center justify-center text-center bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl">
      <div class="w-16 h-16 rounded-2xl bg-[var(--bg-app)] flex items-center justify-center mb-4">
        <i class="pi pi-megaphone text-3xl text-[var(--text-muted)]"></i>
      </div>
      <p class="text-sm font-bold text-[var(--text-main)] uppercase tracking-widest">No announcements found</p>
      <p class="text-xs text-[var(--text-muted)] mt-1">Try adjusting your filters or create a new announcement.</p>
    </div>

    <!-- ── Cards grid ── -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="item in filteredAnnouncements" :key="item._id"
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:border-[var(--color-primary)]/40 transition-all">

        <!-- Banner image (if present) -->
        <div v-if="item.image" class="relative h-36 overflow-hidden bg-slate-100 shrink-0">
          <img :src="resolveUrl(item.image)" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
          <!-- Type badge overlay -->
          <div class="absolute top-3 left-3">
            <span class="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border backdrop-blur-sm bg-white/90"
              :class="typeMeta(item.type).color">
              <i :class="['pi text-[9px] mr-1', typeMeta(item.type).icon]"></i>{{ typeMeta(item.type).label }}
            </span>
          </div>
        </div>

        <!-- Card body -->
        <div class="flex-1 p-5 flex flex-col gap-3">
          <!-- Type + status badges (shown when no image) -->
          <div v-if="!item.image" class="flex items-center gap-2 flex-wrap">
            <span class="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border"
              :class="typeMeta(item.type).color">
              <i :class="['pi text-[9px] mr-1', typeMeta(item.type).icon]"></i>{{ typeMeta(item.type).label }}
            </span>
            <span :class="['text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
              item.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200']">
              {{ item.status }}
            </span>
          </div>

          <!-- Title -->
          <h3 class="text-sm font-black text-[var(--text-main)] leading-snug uppercase tracking-tight line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
            {{ item.title }}
          </h3>

          <!-- Schedule info -->
          <div v-if="item.scheduledDate" class="flex items-center gap-2 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
            <i class="pi pi-calendar text-[9px]"></i>
            {{ formatScheduledDate(item.scheduledDate) }}
            <span v-if="item.scheduledTime" class="text-blue-500">· {{ item.scheduledTime }}</span>
          </div>
          <div v-if="item.venue" class="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)]">
            <i class="pi pi-map-marker text-rose-400 text-[9px]"></i>{{ item.venue }}
          </div>

          <!-- Content snippet -->
          <p class="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed flex-1">
            {{ item.content.replace(/<[^>]*>/g, ' ') }}
          </p>

          <!-- Attachments indicator -->
          <div v-if="item.attachments?.length" class="flex items-center gap-2 flex-wrap">
            <div v-for="att in item.attachments.slice(0, 3)" :key="att.fileUrl"
              class="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full border"
              :class="fileIcon(att.fileType).bg">
              <i :class="['pi text-[9px]', fileIcon(att.fileType).icon, fileIcon(att.fileType).color]"></i>
              <span class="truncate max-w-[80px]" :class="fileIcon(att.fileType).color">{{ att.fileName }}</span>
            </div>
            <span v-if="item.attachments.length > 3" class="text-[9px] text-[var(--text-faint)] font-bold">+{{ item.attachments.length - 3 }} more</span>
          </div>

          <!-- Footer: date + poster -->
          <div class="flex items-center justify-between pt-3 border-t border-[var(--border-main)]">
            <span class="text-[9px] font-bold text-[var(--text-faint)] uppercase tracking-widest">
              {{ formatDate(item.createdAt) }}
            </span>
            <span v-if="item.postedBy" class="text-[9px] font-bold text-[var(--text-muted)]">
              by {{ item.postedBy.username }}
            </span>
          </div>
        </div>

        <!-- Action bar -->
        <div v-if="canManage" class="px-5 py-3 border-t border-[var(--border-main)] bg-[var(--bg-app)]/50 flex items-center justify-between gap-2">
          <button @click="toggleStatus(item)"
            :class="['text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all',
              item.status === 'published'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100']">
            <i :class="['pi text-[9px] mr-1', item.status === 'published' ? 'pi-eye' : 'pi-eye-slash']"></i>
            {{ item.status === 'published' ? 'Published' : 'Draft' }}
          </button>
          <div class="flex items-center gap-1">
            <button @click="openEdit(item)"
              class="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors flex items-center gap-1">
              <i class="pi pi-pencil text-[9px]"></i> Edit
            </button>
            <button @click="handleDelete(item._id)"
              class="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1">
              <i class="pi pi-trash text-[9px]"></i> Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Create / Edit Modal ── -->
    <AppModal v-model="showDrawer"
      :title="isEditing ? 'Edit Announcement' : 'New Announcement'"
      :subtitle="isEditing ? 'Update this announcement.' : 'Create a new bulletin post.'"
      icon="pi-megaphone" width="max-w-3xl">

      <div class="space-y-5 px-1">

        <!-- ── Type selector ── -->
        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block">Announcement Type</label>
          <div class="flex flex-wrap gap-2">
            <button v-for="[key, meta] in Object.entries(TYPE_META)" :key="key"
              type="button" @click="form.type = key"
              class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all"
              :class="form.type === key
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm'
                : `border-[var(--border-main)] ${meta.color} hover:border-[var(--color-primary)]/50`">
              <i :class="['pi text-[9px]', meta.icon]"></i>
              {{ meta.label }}
            </button>
          </div>
        </div>

        <!-- ── Title ── -->
        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">Title *</label>
          <AppInput v-model="form.title" placeholder="e.g. Schedule of BEI for Teacher I Position" required />
        </div>

        <!-- ── Content ── -->
        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">Content *</label>
          <AppTextarea v-model="form.content" :rows="5"
            placeholder="Provide details, instructions, or full announcement text..." />
        </div>

        <!-- ── Schedule fields (conditional) ── -->
        <div v-if="showScheduleFields" class="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
          <p class="text-[10px] font-black uppercase tracking-widest text-blue-700">Schedule Details</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] font-bold text-blue-600 mb-1 block">Date</label>
              <AppInput v-model="form.scheduledDate" type="date" />
            </div>
            <div>
              <label class="text-[10px] font-bold text-blue-600 mb-1 block">Time (e.g. 9:00 AM – 12:00 PM)</label>
              <AppInput v-model="form.scheduledTime" placeholder="e.g. 09:00 AM – 12:00 PM" />
            </div>
          </div>
          <div>
            <label class="text-[10px] font-bold text-blue-600 mb-1 block">Venue / Location</label>
            <AppInput v-model="form.venue" placeholder="e.g. SDO Conference Room / Google Meet" />
          </div>
        </div>

        <!-- ── Banner Image ── -->
        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block">Banner Image (optional)</label>

          <!-- Preview -->
          <div v-if="imagePreview" class="relative mb-3 rounded-xl overflow-hidden h-36 bg-slate-100 group">
            <img :src="imagePreview" class="w-full h-full object-cover" />
            <button type="button" @click="clearImage"
              class="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-red-600 text-white flex items-center justify-center transition-colors">
              <i class="pi pi-times text-xs"></i>
            </button>
          </div>

          <label class="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-[var(--border-main)] hover:border-[var(--color-primary)] cursor-pointer transition-colors bg-[var(--bg-app)]">
            <i class="pi pi-image text-[var(--color-primary)] text-xl"></i>
            <div>
              <p class="text-xs font-bold text-[var(--text-main)]">{{ imagePreview ? 'Replace image' : 'Upload banner image' }}</p>
              <p class="text-[10px] text-[var(--text-muted)]">JPG, PNG, WebP — max 20MB</p>
            </div>
            <input type="file" accept="image/*" class="sr-only" @change="onImagePick" />
          </label>
        </div>

        <!-- ── File Attachments ── -->
        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block">
            Attachments <span class="font-normal normal-case">(PDF, Word, Excel, Images)</span>
          </label>

          <!-- Existing attachments (edit mode) -->
          <div v-if="keepAttachments.length" class="mb-2 space-y-1.5">
            <div v-for="(att, i) in keepAttachments" :key="att.fileUrl"
              class="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--border-main)] bg-[var(--surface)]">
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
                class="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-colors">
                <i class="pi pi-times text-[10px]"></i>
              </button>
            </div>
          </div>

          <!-- New file queue -->
          <div v-if="newAttachments.length" class="mb-2 space-y-1.5">
            <div v-for="(f, i) in newAttachments" :key="i"
              class="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)]">
              <div class="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0">
                <i :class="['pi text-xs', fileIcon(guessMimeType(f)).icon, fileIcon(guessMimeType(f)).color]"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[11px] font-bold text-[var(--text-main)] truncate">{{ f.name }}</p>
                <p class="text-[9px] text-[var(--text-faint)]">{{ formatBytes(f.size) }} — pending upload</p>
              </div>
              <button type="button" @click="removeNewAttachment(i)"
                class="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-colors">
                <i class="pi pi-times text-[10px]"></i>
              </button>
            </div>
          </div>

          <label class="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-[var(--border-main)] hover:border-[var(--color-primary)] cursor-pointer transition-colors bg-[var(--bg-app)]">
            <i class="pi pi-paperclip text-[var(--color-primary)] text-xl"></i>
            <div>
              <p class="text-xs font-bold text-[var(--text-main)]">Attach files</p>
              <p class="text-[10px] text-[var(--text-muted)]">PDF, Word (.docx), Excel (.xlsx), Images — max 20MB each, up to 8 files</p>
            </div>
            <input type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
              multiple class="sr-only" @change="onAttachmentPick" />
          </label>
        </div>

        <!-- ── Publishing options ── -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex items-center gap-3 p-4 bg-[var(--bg-app)] rounded-xl border border-[var(--border-main)]">
            <input type="checkbox" :id="'pub-chk'" :checked="form.status === 'published'"
              @change="form.status = $event.target.checked ? 'published' : 'draft'"
              class="w-4 h-4 rounded text-[var(--color-primary)] cursor-pointer" />
            <label for="pub-chk" class="cursor-pointer flex-1">
              <p class="text-xs font-black text-[var(--text-main)]">Publish Immediately</p>
              <p class="text-[10px] text-[var(--text-muted)]">Visible to all visitors</p>
            </label>
          </div>
          <div>
            <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">Expiry Date (optional)</label>
            <AppInput v-model="form.expiryDate" type="date" />
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

  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
