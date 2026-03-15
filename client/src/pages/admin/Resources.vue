<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import apiClient from '@/api/axios'
import { resolveUrl } from '@/utils/url'
import { AppInput, AppSelect, AppTextarea, AppSwitch, AppModal, AppPageHeader, AppFilterBar } from '@/components/ui'

defineOptions({ name: 'AdminResources' })

const $toast = inject('$toast')
const $swal  = inject('$swal')

const resources   = ref([])
const loading     = ref(false)
const saving      = ref(false)
const search      = ref('')
const filterCat   = ref('all')

// Modal state
const showModal    = ref(false)
const isEditing    = ref(false)
const editId       = ref(null)
const editingResource = ref(null)   // full resource object when editing
const fileRef      = ref(null)
const selectedFile = ref(null)
const dragOver     = ref(false)

const form = ref({
  title:       '',
  description: '',
  category:    'other',
  isPublished: true,
})

const CATEGORIES = [
  { key: 'all',       label: 'All' },
  { key: 'form',      label: 'Forms' },
  { key: 'memo',      label: 'Memos' },
  { key: 'circular',  label: 'Circulars' },
  { key: 'order',     label: 'Orders' },
  { key: 'guideline', label: 'Guidelines' },
  { key: 'other',     label: 'Others' },
]

const FORM_CATEGORIES = CATEGORIES
  .filter(c => c.key !== 'all')
  .map(c => ({ label: c.label, value: c.key }))

const CATEGORY_COLOR = {
  form:      'bg-blue-50 text-blue-700 border-blue-100',
  memo:      'bg-amber-50 text-amber-700 border-amber-100',
  circular:  'bg-purple-50 text-purple-700 border-purple-100',
  order:     'bg-red-50 text-red-700 border-red-100',
  guideline: 'bg-green-50 text-green-700 border-green-100',
  other:     'bg-slate-50 text-slate-600 border-slate-200',
}

const FILE_ICON_MAP = {
  'application/pdf': { icon: 'pi-file-pdf', color: 'text-red-500', bg: 'bg-red-50' },
  'application/msword': { icon: 'pi-file-word', color: 'text-blue-600', bg: 'bg-blue-50' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: 'pi-file-word', color: 'text-blue-600', bg: 'bg-blue-50' },
  'application/vnd.ms-excel': { icon: 'pi-file-excel', color: 'text-green-600', bg: 'bg-green-50' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: 'pi-file-excel', color: 'text-green-600', bg: 'bg-green-50' },
  'application/vnd.ms-powerpoint': { icon: 'pi-file', color: 'text-orange-500', bg: 'bg-orange-50' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: 'pi-file', color: 'text-orange-500', bg: 'bg-orange-50' },
}

function fileIconFor(mimeType) {
  if (!mimeType) return { icon: 'pi-file-o', color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-app)]' }
  if (mimeType.startsWith('image/')) return { icon: 'pi-image', color: 'text-violet-500', bg: 'bg-violet-50' }
  return FILE_ICON_MAP[mimeType] || { icon: 'pi-file-o', color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-app)]' }
}

function mimeLabel(mimeType) {
  if (!mimeType) return 'File'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('word')) return 'Word'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PowerPoint'
  if (mimeType.startsWith('image/')) return 'Image'
  return 'File'
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return resources.value.filter(r => {
    const matchCat = filterCat.value === 'all' || r.category === filterCat.value
    const matchQ   = !q || r.title.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)
    return matchCat && matchQ
  })
})

// ── Fetch ──────────────────────────────────────────────────────────────────────
async function fetchResources() {
  loading.value = true
  try {
    const { data } = await apiClient.get('/v1/resources/admin')
    resources.value = data.data || []
  } catch {
    resources.value = []
  } finally {
    loading.value = false
  }
}

// ── Modal ──────────────────────────────────────────────────────────────────────
function openCreate() {
  isEditing.value       = false
  editId.value          = null
  editingResource.value = null
  selectedFile.value    = null
  form.value = { title: '', description: '', category: 'other', isPublished: true }
  showModal.value = true
}

function openEdit(r) {
  isEditing.value       = true
  editId.value          = r._id
  editingResource.value = r
  selectedFile.value    = null
  form.value = {
    title:       r.title,
    description: r.description || '',
    category:    r.category,
    isPublished: r.isPublished,
  }
  showModal.value = true
}

function closeModal() {
  showModal.value    = false
  selectedFile.value = null
}

// ── File pick / drag ───────────────────────────────────────────────────────────
function triggerFile() { fileRef.value?.click() }

function onFileChange(e) {
  const f = e.target.files[0]
  if (f) {
    selectedFile.value   = f
    e.target.value = ''
  }
}

function onDrop(e) {
  dragOver.value = false
  const f = e.dataTransfer.files[0]
  if (f) selectedFile.value = f
}

function clearFile() {
  selectedFile.value = null
}

// ── Save ───────────────────────────────────────────────────────────────────────
async function save() {
  if (!form.value.title.trim()) {
    $toast?.fire({ icon: 'warning', title: 'Title is required.' })
    return
  }
  if (!isEditing.value && !selectedFile.value) {
    $toast?.fire({ icon: 'warning', title: 'Please select a file to upload.' })
    return
  }

  saving.value = true
  try {
    const fd = new FormData()
    fd.append('title',       form.value.title.trim())
    fd.append('description', form.value.description.trim())
    fd.append('category',    form.value.category)
    fd.append('isPublished', String(form.value.isPublished))
    if (selectedFile.value) fd.append('file', selectedFile.value)

    if (isEditing.value) {
      const { data } = await apiClient.patch(`/v1/resources/${editId.value}`, fd)
      const idx = resources.value.findIndex(r => r._id === editId.value)
      if (idx !== -1) resources.value[idx] = data.data
    } else {
      const { data } = await apiClient.post('/v1/resources', fd)
      resources.value.unshift(data.data)
    }

    $toast?.fire({ icon: 'success', title: isEditing.value ? 'Resource updated!' : 'Resource uploaded!' })
    closeModal()
  } catch (err) {
    $toast?.fire({ icon: 'error', title: err.response?.data?.message || 'Save failed.' })
  } finally {
    saving.value = false
  }
}

// ── Toggle publish ─────────────────────────────────────────────────────────────
async function togglePublish(r) {
  try {
    const { data } = await apiClient.patch(`/v1/resources/${r._id}/toggle`)
    const idx = resources.value.findIndex(x => x._id === r._id)
    if (idx !== -1) resources.value[idx] = data.data
    $toast?.fire({ icon: 'success', title: data.data.isPublished ? 'Published!' : 'Unpublished.' })
  } catch (err) {
    $toast?.fire({ icon: 'error', title: err.response?.data?.message || 'Failed.' })
  }
}

// ── Delete ─────────────────────────────────────────────────────────────────────
async function deleteResource(r) {
  const confirmed = await $swal?.fire({
    title: 'Delete Resource?',
    text: `"${r.title}" will be permanently removed.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    confirmButtonColor: '#ef4444',
  })
  if (!confirmed?.isConfirmed) return

  try {
    await apiClient.delete(`/v1/resources/${r._id}`)
    resources.value = resources.value.filter(x => x._id !== r._id)
    $toast?.fire({ icon: 'success', title: 'Resource deleted.' })
  } catch (err) {
    $toast?.fire({ icon: 'error', title: err.response?.data?.message || 'Delete failed.' })
  }
}

onMounted(fetchResources)
</script>

<template>
  <div class="space-y-6 animate-fade-in">

    <AppPageHeader
      title="Resources"
      subtitle="Upload and manage downloadable forms, memos, and documents."
      icon="pi-folder-open">
      <template #actions>
        <button @click="openCreate" class="btn-primary h-10 px-5 text-sm flex items-center gap-2">
          <i class="pi pi-upload text-xs"></i>
          Upload Resource
        </button>
      </template>
    </AppPageHeader>

    <!-- Filters -->
    <AppFilterBar
      v-model:search="search"
      v-model:filter="filterCat"
      :filters="CATEGORIES.map(c => ({ key: c.key, label: c.label }))"
      placeholder="Search by title or description..."
    />

    <!-- Loading skeletons -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 5" :key="i"
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-4 animate-pulse flex gap-4 items-center">
        <div class="w-10 h-10 bg-[var(--bg-app)] rounded-xl shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3.5 bg-[var(--bg-app)] rounded w-2/5"></div>
          <div class="h-3 bg-[var(--bg-app)] rounded w-3/5"></div>
        </div>
        <div class="w-16 h-6 bg-[var(--bg-app)] rounded-full"></div>
        <div class="w-24 h-8 bg-[var(--bg-app)] rounded-lg"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!filtered.length"
      class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl py-16 text-center">
      <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center mx-auto mb-4">
        <i class="pi pi-folder-open text-2xl text-[var(--text-faint)]"></i>
      </div>
      <p class="text-sm font-semibold text-[var(--text-muted)]">No resources found</p>
      <p class="text-xs text-[var(--text-faint)] mt-1 mb-5">
        {{ resources.length ? 'Try a different search or category.' : 'Get started by uploading your first resource.' }}
      </p>
      <button v-if="!resources.length" @click="openCreate" class="btn-primary h-9 px-5 text-sm flex items-center gap-2 mx-auto">
        <i class="pi pi-upload text-xs"></i> Upload Resource
      </button>
    </div>

    <!-- Table -->
    <div v-else class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-[var(--border-main)] bg-[var(--bg-app)]">
            <th class="th text-left py-3 px-4">File / Title</th>
            <th class="th text-left py-3 px-4 hidden md:table-cell">Category</th>
            <th class="th text-left py-3 px-4 hidden lg:table-cell">Uploaded</th>
            <th class="th text-left py-3 px-4 hidden lg:table-cell">Size</th>
            <th class="th text-center py-3 px-4">Status</th>
            <th class="th text-right py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filtered" :key="r._id"
            class="tr-hover border-b border-[var(--border-main)] last:border-0">

            <!-- File / Title -->
            <td class="td py-3.5 px-4">
              <div class="flex items-center gap-3">
                <div :class="['w-9 h-9 rounded-xl border border-[var(--border-main)] flex items-center justify-center shrink-0', fileIconFor(r.mimeType).bg]">
                  <i :class="['pi text-base', fileIconFor(r.mimeType).icon, fileIconFor(r.mimeType).color]"></i>
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-[var(--text-main)] truncate max-w-[220px]">{{ r.title }}</p>
                  <p v-if="r.description" class="text-xs text-[var(--text-muted)] truncate max-w-[220px]">{{ r.description }}</p>
                  <p class="text-[11px] text-[var(--text-faint)] truncate max-w-[200px] mt-0.5 font-mono">{{ r.originalName }}</p>
                </div>
              </div>
            </td>

            <!-- Category -->
            <td class="td py-3.5 px-4 hidden md:table-cell">
              <span :class="['px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide', CATEGORY_COLOR[r.category] || CATEGORY_COLOR.other]">
                {{ r.category }}
              </span>
            </td>

            <!-- Uploaded -->
            <td class="td py-3.5 px-4 text-xs text-[var(--text-muted)] hidden lg:table-cell whitespace-nowrap">
              <div>{{ formatDate(r.createdAt) }}</div>
              <div class="text-[var(--text-faint)] mt-0.5">by {{ r.uploadedBy?.username }}</div>
            </td>

            <!-- Size -->
            <td class="td py-3.5 px-4 text-xs text-[var(--text-muted)] hidden lg:table-cell whitespace-nowrap">
              {{ formatSize(r.fileSize) }}
            </td>

            <!-- Status toggle -->
            <td class="td py-3.5 px-4 text-center">
              <button @click="togglePublish(r)"
                :class="[
                  'px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide transition-colors',
                  r.isPublished
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                ]"
                :title="r.isPublished ? 'Click to unpublish' : 'Click to publish'">
                <i :class="['pi text-[9px] mr-1', r.isPublished ? 'pi-eye' : 'pi-eye-slash']"></i>
                {{ r.isPublished ? 'Published' : 'Draft' }}
              </button>
            </td>

            <!-- Actions -->
            <td class="td py-3.5 px-4">
              <div class="flex items-center justify-end gap-1">
                <a :href="resolveUrl(r.filePath)" target="_blank"
                  class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
                  title="Preview / Download">
                  <i class="pi pi-download text-sm"></i>
                </a>
                <button @click="openEdit(r)"
                  class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
                  title="Edit details">
                  <i class="pi pi-pencil text-sm"></i>
                </button>
                <button @click="deleteResource(r)"
                  class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete">
                  <i class="pi pi-trash text-sm"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Count -->
    <p v-if="!loading && filtered.length" class="text-xs text-[var(--text-faint)] text-center pb-2">
      Showing {{ filtered.length }} of {{ resources.length }} resource{{ resources.length !== 1 ? 's' : '' }}
    </p>

  </div>

  <!-- ── Upload / Edit Modal ────────────────────────────────────────────── -->
  <AppModal
    v-model="showModal"
    :title="isEditing ? 'Edit Resource' : 'Upload Resource'"
    :subtitle="isEditing ? 'Update metadata or replace the file.' : 'Add a downloadable document for applicants.'"
    :icon="isEditing ? 'pi-pencil' : 'pi-upload'"
    size="md"
    @close="closeModal">

    <div class="flex flex-col gap-5">

      <!-- ── File zone ───────────────────────────────────────────────── -->

      <!-- NEW FILE selected (both create and replace) -->
      <div v-if="selectedFile"
        class="flex items-center gap-4 p-4 rounded-xl border border-green-200 bg-green-50">
        <div :class="['w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border', fileIconFor(selectedFile.type).bg, 'border-[var(--border-main)]']">
          <i :class="['pi text-xl', fileIconFor(selectedFile.type).icon, fileIconFor(selectedFile.type).color]"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold text-[var(--text-main)] truncate">{{ selectedFile.name }}</p>
          <p class="text-xs text-[var(--text-muted)] mt-0.5">
            {{ mimeLabel(selectedFile.type) }} &bull; {{ formatSize(selectedFile.size) }}
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full border border-green-200">
            <i class="pi pi-check text-[10px]"></i> Ready
          </span>
          <button @click="clearFile"
            class="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Remove selected file">
            <i class="pi pi-times text-xs"></i>
          </button>
        </div>
      </div>

      <!-- EDIT MODE — current file info (no new file chosen yet) -->
      <div v-else-if="isEditing && editingResource"
        class="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-main)] bg-[var(--surface)]">
        <div :class="['w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-[var(--border-main)]', fileIconFor(editingResource.mimeType).bg]">
          <i :class="['pi text-xl', fileIconFor(editingResource.mimeType).icon, fileIconFor(editingResource.mimeType).color]"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-0.5">Current file</p>
          <p class="text-sm font-semibold text-[var(--text-main)] truncate font-mono">{{ editingResource.originalName }}</p>
          <p class="text-xs text-[var(--text-faint)] mt-0.5">
            {{ mimeLabel(editingResource.mimeType) }} &bull; {{ formatSize(editingResource.fileSize) }}
          </p>
        </div>
        <button @click="triggerFile"
          class="btn-secondary h-8 px-3 text-xs flex items-center gap-1.5 shrink-0">
          <i class="pi pi-refresh text-[10px]"></i>
          Replace
        </button>
      </div>

      <!-- CREATE MODE — drop zone (no file chosen yet) -->
      <div v-else
        class="relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer"
        :class="dragOver
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
          : 'border-[var(--border-main)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/30'"
        @click="triggerFile"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="onDrop">

        <div class="flex flex-col items-center justify-center py-8 px-6 gap-3 pointer-events-none select-none">
          <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center transition-colors', dragOver ? 'bg-[var(--color-primary)]' : 'bg-[var(--surface)] border border-[var(--border-main)]']">
            <i :class="['pi pi-upload text-2xl transition-colors', dragOver ? 'text-white' : 'text-[var(--color-primary)]']"></i>
          </div>
          <div class="text-center">
            <p class="text-sm font-bold text-[var(--text-main)]">
              {{ dragOver ? 'Drop to upload' : 'Click or drag a file here' }}
            </p>
            <p class="text-xs text-[var(--text-muted)] mt-1">PDF &bull; Word &bull; Excel &bull; PowerPoint &bull; Image</p>
            <p class="text-[11px] text-[var(--text-faint)] mt-0.5">Maximum file size: 25 MB</p>
          </div>
        </div>
      </div>

      <!-- Hidden file input (used by both drop zone and Replace button) -->
      <input
        ref="fileRef" type="file" class="sr-only"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
        @change="onFileChange" />

      <!-- ── Metadata fields ─────────────────────────────────────────── -->
      <AppInput
        v-model="form.title"
        label="Title"
        size="sm"
        placeholder="e.g. Personal Data Sheet (CS Form 212)" />

      <AppTextarea
        v-model="form.description"
        label="Description"
        size="sm"
        :maxlength="300"
        show-count
        placeholder="Brief description of this document (optional)..." />

      <AppSelect
        v-model="form.category"
        label="Category"
        size="sm"
        :options="FORM_CATEGORIES" />

      <!-- Publish toggle -->
      <div class="flex items-center justify-between p-4 rounded-xl border border-[var(--border-main)] bg-[var(--surface)]">
        <div>
          <p class="text-sm font-semibold text-[var(--text-main)]">Publish immediately</p>
          <p class="text-xs text-[var(--text-muted)] mt-0.5">Visible to all applicants when enabled</p>
        </div>
        <AppSwitch v-model="form.isPublished" />
      </div>

    </div>

    <!-- Footer -->
    <template #footer>
      <button @click="closeModal" class="btn-secondary h-10 px-5 text-sm">Cancel</button>
      <button @click="save" :disabled="saving"
        class="btn-primary h-10 px-6 text-sm flex items-center gap-2 disabled:opacity-50">
        <i v-if="saving" class="pi pi-spin pi-spinner text-xs"></i>
        <i v-else :class="['pi text-xs', isEditing ? 'pi-check' : 'pi-upload']"></i>
        {{ saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Upload') }}
      </button>
    </template>

  </AppModal>
</template>
