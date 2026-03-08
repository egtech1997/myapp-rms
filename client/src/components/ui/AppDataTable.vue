<script setup>
/**
 * AppDataTable — Universal enterprise data table
 *
 * Props:
 *   columns  — [{ key, label, sortable?, width?, align? }]
 *   rows     — raw data array
 *   loading  — shows skeleton
 *   pageSize — rows per page (default 10)
 *   searchable — show search bar
 *   searchPlaceholder
 *   emptyTitle / emptySubtitle / emptyIcon
 *
 * Slots:
 *   cell-{key}(row, value)  — custom cell render
 *   actions(row)            — action column content
 *   toolbar                 — left of search bar
 *   after-toolbar           — below toolbar, above table
 *   footer                  — below pagination
 *
 * Exposes: search, page, sort (for parent reads if needed)
 */
import { ref, computed, watch } from 'vue'
import AppSpinner from './AppSpinner.vue'

defineOptions({ name: 'AppDataTable' })

const props = defineProps({
  columns:           { type: Array,   required: true },
  rows:              { type: Array,   default: () => [] },
  loading:           { type: Boolean, default: false },
  pageSize:          { type: Number,  default: 10 },
  searchable:        { type: Boolean, default: true },
  searchPlaceholder: { type: String,  default: 'Search…' },
  searchFields:      { type: Array,   default: () => [] }, // keys to search across
  emptyTitle:        { type: String,  default: 'No results found' },
  emptySubtitle:     { type: String,  default: 'Try adjusting your search or filters.' },
  emptyIcon:         { type: String,  default: 'pi-inbox' },
  rowKey:            { type: String,  default: '_id' },
  hasActions:        { type: Boolean, default: false },
  stickyHeader:      { type: Boolean, default: false },
})

const emit = defineEmits(['row-click'])

// ── Search ─────────────────────────────────────────────────────────────────
const search = ref('')

// ── Sort ───────────────────────────────────────────────────────────────────
const sortKey = ref('')
const sortDir = ref('asc') // 'asc' | 'desc'

const toggleSort = (col) => {
  if (!col.sortable) return
  if (sortKey.value === col.key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = col.key
    sortDir.value  = 'asc'
  }
  page.value = 1
}

// ── Filter & Sort pipeline ─────────────────────────────────────────────────
const filteredRows = computed(() => {
  let data = props.rows
  if (search.value.trim()) {
    const q = search.value.toLowerCase().trim()
    const fields = props.searchFields.length ? props.searchFields : props.columns.map(c => c.key)
    data = data.filter(row =>
      fields.some(f => String(row[f] ?? '').toLowerCase().includes(q))
    )
  }
  if (sortKey.value) {
    const dir = sortDir.value === 'asc' ? 1 : -1
    data = [...data].sort((a, b) => {
      const av = a[sortKey.value] ?? ''
      const bv = b[sortKey.value] ?? ''
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }
  return data
})

// ── Pagination ─────────────────────────────────────────────────────────────
const page     = ref(1)
const total    = computed(() => filteredRows.value.length)
const pages    = computed(() => Math.max(1, Math.ceil(total.value / props.pageSize)))
const pageRows = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return filteredRows.value.slice(start, start + props.pageSize)
})

watch([search, () => props.rows], () => { page.value = 1 })

const pageNumbers = computed(() => {
  const p = pages.value
  if (p <= 7) return Array.from({ length: p }, (_, i) => i + 1)
  if (page.value <= 4) return [1, 2, 3, 4, 5, '…', p]
  if (page.value >= p - 3) return [1, '…', p - 4, p - 3, p - 2, p - 1, p]
  return [1, '…', page.value - 1, page.value, page.value + 1, '…', p]
})

// ── Skeleton ───────────────────────────────────────────────────────────────
const SKELETON_ROWS = 5

// ── Helpers ────────────────────────────────────────────────────────────────
const getCellValue = (row, key) => {
  return key.split('.').reduce((obj, k) => obj?.[k], row)
}

defineExpose({ search, page, sortKey, sortDir })
</script>

<template>
  <div class="flex flex-col gap-0">

    <!-- ── Toolbar ─────────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div class="flex items-center gap-2 flex-wrap">
        <slot name="toolbar" />
      </div>
      <div class="flex items-center gap-2">
        <!-- Search -->
        <div v-if="searchable" class="relative">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--text-faint)] pointer-events-none"></i>
          <input
            v-model="search"
            :placeholder="searchPlaceholder"
            class="h-9 pl-8 pr-9 w-56 bg-[var(--surface)] border border-[var(--border-main)]
                   rounded-lg text-sm text-[var(--text-main)] placeholder-[var(--text-faint)]
                   focus:outline-none focus:border-[var(--color-primary)]
                   focus:ring-2 focus:ring-[var(--color-primary-ring)]/20
                   transition-all font-medium" />
          <button v-if="search" @click="search = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
                   flex items-center justify-center text-[var(--text-faint)]
                   hover:text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors">
            <i class="pi pi-times text-[9px]"></i>
          </button>
        </div>
        <slot name="filters" />
      </div>
    </div>

    <slot name="after-toolbar" />

    <!-- ── Table ───────────────────────────────────────────────────────── -->
    <div class="rounded-xl border border-[var(--border-main)] overflow-hidden bg-[var(--surface)]"
         style="box-shadow: var(--shadow-sm);">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-sm border-collapse">

          <!-- Head -->
          <thead>
            <tr>
              <th
                v-for="col in columns" :key="col.key"
                :class="[
                  'th select-none whitespace-nowrap',
                  col.sortable ? 'cursor-pointer hover:bg-[var(--bg-app)] transition-colors' : '',
                  col.align === 'right'  ? 'text-right' : '',
                  col.align === 'center' ? 'text-center' : '',
                ]"
                :style="col.width ? `width: ${col.width}` : ''"
                @click="toggleSort(col)">
                <span class="inline-flex items-center gap-1.5">
                  {{ col.label }}
                  <span v-if="col.sortable" class="inline-flex flex-col gap-[2px]" aria-hidden="true">
                    <i :class="['pi pi-chevron-up text-[8px]',
                                sortKey === col.key && sortDir === 'asc'
                                  ? 'text-[var(--color-primary)]' : 'text-[var(--text-faint)]']"></i>
                    <i :class="['pi pi-chevron-down text-[8px]',
                                sortKey === col.key && sortDir === 'desc'
                                  ? 'text-[var(--color-primary)]' : 'text-[var(--text-faint)]']"></i>
                  </span>
                </span>
              </th>
              <th v-if="hasActions" class="th text-right" style="width: 80px;">Actions</th>
            </tr>
          </thead>

          <!-- Skeleton -->
          <tbody v-if="loading">
            <tr v-for="i in SKELETON_ROWS" :key="i"
                class="border-b border-[var(--border-subtle)] last:border-0">
              <td v-for="col in columns" :key="col.key" class="td">
                <div class="h-4 rounded animate-shimmer"
                     :style="`width: ${Math.random() * 40 + 50}%`"></div>
              </td>
              <td v-if="hasActions" class="td">
                <div class="h-4 w-16 rounded animate-shimmer ml-auto"></div>
              </td>
            </tr>
          </tbody>

          <!-- Empty -->
          <tbody v-else-if="!loading && pageRows.length === 0">
            <tr>
              <td :colspan="columns.length + (hasActions ? 1 : 0)">
                <div class="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div class="w-12 h-12 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)]
                               flex items-center justify-center text-[var(--text-faint)]">
                    <i :class="['pi text-xl', emptyIcon]"></i>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-[var(--text-main)]">{{ emptyTitle }}</p>
                    <p class="text-xs text-[var(--text-muted)] mt-0.5 max-w-xs">{{ emptySubtitle }}</p>
                  </div>
                  <slot name="empty-action" />
                </div>
              </td>
            </tr>
          </tbody>

          <!-- Data -->
          <tbody v-else>
            <tr
              v-for="(row, ri) in pageRows"
              :key="row[rowKey] ?? ri"
              class="tr-hover border-b border-[var(--border-subtle)] last:border-0 transition-colors"
              @click="emit('row-click', row)">
              <td
                v-for="col in columns" :key="col.key"
                class="td"
                :class="[
                  col.align === 'right'  ? 'text-right' : '',
                  col.align === 'center' ? 'text-center' : '',
                ]">
                <slot :name="`cell-${col.key}`" :row="row" :value="getCellValue(row, col.key)">
                  <span class="text-[var(--text-sub)]">{{ getCellValue(row, col.key) ?? '—' }}</span>
                </slot>
              </td>
              <td v-if="hasActions" class="td text-right">
                <div class="flex items-center justify-end gap-1">
                  <slot name="actions" :row="row" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── Footer: count + pagination ──────────────────────────────── -->
      <div v-if="!loading && total > 0"
           class="flex flex-wrap items-center justify-between gap-3 px-5 py-3
                  border-t border-[var(--border-main)] bg-[var(--surface-2)]">

        <!-- Count summary -->
        <p class="text-xs text-[var(--text-muted)] font-medium">
          Showing
          <span class="font-bold text-[var(--text-main)]">
            {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, total) }}
          </span>
          of
          <span class="font-bold text-[var(--text-main)]">{{ total }}</span>
          <template v-if="search">
            result{{ total !== 1 ? 's' : '' }} for
            <span class="font-bold text-[var(--color-primary)]">"{{ search }}"</span>
          </template>
        </p>

        <!-- Pagination -->
        <nav v-if="pages > 1" class="flex items-center gap-1" aria-label="Pagination">
          <button
            @click="page = Math.max(1, page - 1)"
            :disabled="page === 1"
            class="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border-main)]
                   text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]
                   disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page">
            <i class="pi pi-chevron-left text-[10px]"></i>
          </button>

          <template v-for="(p, i) in pageNumbers" :key="i">
            <span v-if="p === '…'" class="w-7 h-7 flex items-center justify-center text-xs text-[var(--text-faint)]">…</span>
            <button v-else
              @click="page = p"
              :aria-current="page === p ? 'page' : undefined"
              :class="[
                'w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all',
                page === p
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'border border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]'
              ]">
              {{ p }}
            </button>
          </template>

          <button
            @click="page = Math.min(pages, page + 1)"
            :disabled="page === pages"
            class="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border-main)]
                   text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]
                   disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page">
            <i class="pi pi-chevron-right text-[10px]"></i>
          </button>
        </nav>
      </div>
    </div>

    <slot name="footer" />
  </div>
</template>
