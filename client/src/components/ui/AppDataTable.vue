<script setup>
import { computed } from 'vue'

defineOptions({ name: 'AppDataTable' })

const props = defineProps({
  /**
   * Column definitions. Two formats accepted:
   *   String array (simple):  ['Rank', 'Applicant', 'Score', 'Action']
   *   Object array (full):    [{ label, width?, align?, class? }]
   *
   * width defaults to '1fr' (flex grow).
   * align: 'left' | 'center' | 'right'  (default 'left')
   */
  columns: { type: Array, required: true },
  rows:    { type: Array, required: true },
})

const normalizedCols = computed(() =>
  props.columns.map((c) =>
    typeof c === 'string'
      ? { label: c, width: '1fr', align: 'left' }
      : { label: c.label, width: c.width || '1fr', align: c.align || 'left', class: c.class || '' }
  )
)

const gridTemplate = computed(() =>
  normalizedCols.value.map((c) => c.width).join(' ')
)

const headerCellClass = (col) => [
  'text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]',
  col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : '',
  col.class || '',
]
</script>

<template>
  <div class="flex-1 overflow-hidden flex flex-col bg-[var(--surface)] border border-[var(--border-main)] rounded-[var(--radius-xl)] shadow-sm">

    <!-- Header row -->
    <div
      class="grid px-6 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)] flex-shrink-0 gap-4"
      :style="{ gridTemplateColumns: gridTemplate }">
      <div
        v-for="(col, i) in normalizedCols" :key="i"
        :class="headerCellClass(col)">
        {{ col.label }}
      </div>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--border-main)]">
      <div
        v-for="(row, i) in rows" :key="i"
        class="grid px-6 py-4 items-center hover:bg-[var(--bg-app)] transition-colors group gap-4"
        :style="{ gridTemplateColumns: gridTemplate }">
        <slot :item="row" :index="i" />
      </div>
    </div>

  </div>
</template>
