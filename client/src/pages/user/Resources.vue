<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import apiClient from '@/api/axios'
import { resolveUrl } from '@/utils/url'
import { AppFilterBar } from '@/components/ui'

defineOptions({ name: 'UserResources' })

const resources  = ref([])
const loading    = ref(false)
const search     = ref('')
const activeCategory = ref('all')

const CATEGORIES = [
  { key: 'all',       label: 'All' },
  { key: 'form',      label: 'Forms' },
  { key: 'memo',      label: 'Memos' },
  { key: 'circular',  label: 'Circulars' },
  { key: 'order',     label: 'Orders' },
  { key: 'guideline', label: 'Guidelines' },
  { key: 'other',     label: 'Others' },
]

const CATEGORY_META = {
  form:      { label: 'Form',      color: 'bg-blue-50 text-blue-700 border-blue-200',        icon: 'pi-file' },
  memo:      { label: 'Memo',      color: 'bg-amber-50 text-amber-700 border-amber-200',     icon: 'pi-envelope' },
  circular:  { label: 'Circular',  color: 'bg-purple-50 text-purple-700 border-purple-200',  icon: 'pi-sync' },
  order:     { label: 'Order',     color: 'bg-red-50 text-red-700 border-red-200',           icon: 'pi-sort-alt' },
  guideline: { label: 'Guideline', color: 'bg-green-50 text-green-700 border-green-200',     icon: 'pi-book' },
  other:     { label: 'Other',     color: 'bg-slate-50 text-slate-700 border-slate-200',     icon: 'pi-file-o' },
}

const FILE_ICON = {
  'application/pdf': { icon: 'pi-file-pdf', color: 'text-red-500' },
  'application/msword': { icon: 'pi-file-word', color: 'text-blue-600' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: 'pi-file-word', color: 'text-blue-600' },
  'application/vnd.ms-excel': { icon: 'pi-file-excel', color: 'text-green-600' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: 'pi-file-excel', color: 'text-green-600' },
}

function fileIconFor(mimeType) {
  return FILE_ICON[mimeType] || { icon: 'pi-file-o', color: 'text-[var(--text-muted)]' }
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
    const matchCat = activeCategory.value === 'all' || r.category === activeCategory.value
    const matchQ   = !q || r.title.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)
    return matchCat && matchQ
  })
})

async function fetchResources() {
  loading.value = true
  try {
    const { data } = await apiClient.get('/v1/resources')
    resources.value = data.data || []
  } catch {
    resources.value = []
  } finally {
    loading.value = false
  }
}

function downloadResource(r) {
  const a = document.createElement('a')
  a.href = resolveUrl(r.filePath)
  a.download = r.originalName
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

onMounted(fetchResources)
onActivated(fetchResources)
</script>

<template>
  <div class="space-y-6 animate-fade-in">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-4">
      <div class="flex-1">
        <h1 class="text-xl font-black text-[var(--text-main)]">Resources</h1>
        <p class="text-sm text-[var(--text-muted)] mt-0.5">Download official forms, memos, circulars, and related documents.</p>
      </div>
    </div>

    <!-- Search + Category filters -->
    <AppFilterBar
      v-model:search="search"
      v-model:filter="activeCategory"
      :filters="CATEGORIES.map(c => ({ key: c.key, label: c.label }))"
      placeholder="Search by title or description..."
    />

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid sm:grid-cols-2 gap-4">
      <div v-for="i in 6" :key="i"
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-5 animate-pulse space-y-3">
        <div class="h-4 bg-[var(--bg-app)] rounded w-3/4"></div>
        <div class="h-3 bg-[var(--bg-app)] rounded w-full"></div>
        <div class="h-3 bg-[var(--bg-app)] rounded w-1/2"></div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!filtered.length"
      class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-12 text-center">
      <i class="pi pi-folder-open text-4xl text-[var(--text-faint)] mb-3 block"></i>
      <p class="text-sm font-semibold text-[var(--text-muted)]">No resources found</p>
      <p class="text-xs text-[var(--text-faint)] mt-1">Try a different search or category filter.</p>
    </div>

    <!-- Resource grid -->
    <div v-else class="grid sm:grid-cols-2 gap-4">
      <div
        v-for="r in filtered" :key="r._id"
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">

        <!-- Top row: file icon + category badge -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center shrink-0">
              <i :class="['pi text-lg', fileIconFor(r.mimeType).icon, fileIconFor(r.mimeType).color]"></i>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-[var(--text-main)] leading-snug line-clamp-2">{{ r.title }}</p>
              <p v-if="r.description" class="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{{ r.description }}</p>
            </div>
          </div>
          <span :class="['shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide', (CATEGORY_META[r.category] || CATEGORY_META.other).color]">
            {{ (CATEGORY_META[r.category] || CATEGORY_META.other).label }}
          </span>
        </div>

        <!-- Meta row -->
        <div class="flex items-center gap-3 text-[11px] text-[var(--text-faint)]">
          <span class="flex items-center gap-1">
            <i class="pi pi-calendar text-[10px]"></i>
            {{ formatDate(r.createdAt) }}
          </span>
          <span v-if="r.fileSize" class="flex items-center gap-1">
            <i class="pi pi-database text-[10px]"></i>
            {{ formatSize(r.fileSize) }}
          </span>
          <span v-if="r.originalName" class="truncate max-w-[140px]">{{ r.originalName }}</span>
        </div>

        <!-- Download button -->
        <button
          @click="downloadResource(r)"
          class="btn-primary h-9 px-4 text-xs flex items-center gap-2 self-start">
          <i class="pi pi-download text-xs"></i>
          Download
        </button>
      </div>
    </div>

    <!-- Count summary -->
    <p v-if="!loading && filtered.length" class="text-xs text-[var(--text-faint)] text-center">
      Showing {{ filtered.length }} of {{ resources.length }} resource{{ resources.length !== 1 ? 's' : '' }}
    </p>

  </div>
</template>
