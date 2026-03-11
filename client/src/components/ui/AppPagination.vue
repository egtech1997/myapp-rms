<script setup>
import { computed } from 'vue'

defineOptions({ name: 'AppPagination' })

const props = defineProps({
  modelValue: { type: Number, default: 1 },
  total:      { type: Number, required: true },
  perPage:    { type: Number, default: 10 },
  siblings:   { type: Number, default: 1 },  // pages on each side of current
  simple:     { type: Boolean, default: false }, // prev/next only
})
const emit = defineEmits(['update:modelValue'])

const totalPages = computed(() => Math.ceil(props.total / props.perPage))
const canPrev    = computed(() => props.modelValue > 1)
const canNext    = computed(() => props.modelValue < totalPages.value)

const go = (page) => {
  if (page < 1 || page > totalPages.value) return
  emit('update:modelValue', page)
}

// Generate page numbers with ellipsis
const pages = computed(() => {
  const cur = props.modelValue
  const total = totalPages.value
  const sib = props.siblings
  const result = []

  if (total <= sib * 2 + 5) {
    for (let i = 1; i <= total; i++) result.push(i)
    return result
  }

  const left  = Math.max(cur - sib, 2)
  const right = Math.min(cur + sib, total - 1)

  result.push(1)
  if (left > 2)       result.push('...')
  for (let i = left; i <= right; i++) result.push(i)
  if (right < total - 1) result.push('...')
  result.push(total)

  return result
})

const rangeStart = computed(() => (props.modelValue - 1) * props.perPage + 1)
const rangeEnd   = computed(() => Math.min(props.modelValue * props.perPage, props.total))

const btnClass = (active, disabled) => [
  'min-w-[2rem] h-8 flex items-center justify-center rounded-[var(--radius-md)] text-sm font-semibold transition-all duration-150',
  active   ? 'bg-[var(--color-primary)] text-white shadow-sm' : '',
  !active && !disabled ? 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-main)]' : '',
  disabled ? 'text-[var(--text-faint)] cursor-not-allowed' : 'cursor-pointer',
]
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-3">

    <!-- Range label -->
    <p class="text-sm text-[var(--text-muted)] shrink-0">
      Showing
      <span class="font-semibold text-[var(--text-main)]">{{ rangeStart }}–{{ rangeEnd }}</span>
      of
      <span class="font-semibold text-[var(--text-main)]">{{ total }}</span>
    </p>

    <nav aria-label="Pagination" class="flex items-center gap-1">
      <!-- Previous -->
      <button
        type="button"
        :class="btnClass(false, !canPrev)"
        :disabled="!canPrev"
        aria-label="Previous page"
        @click="go(modelValue - 1)">
        <i class="pi pi-chevron-left text-xs" aria-hidden="true"></i>
      </button>

      <!-- Simple mode: just prev/page/next -->
      <template v-if="simple">
        <span class="px-3 text-sm font-semibold text-[var(--text-main)]">
          {{ modelValue }} / {{ totalPages }}
        </span>
      </template>

      <!-- Full page numbers -->
      <template v-else>
        <template v-for="page in pages" :key="page">
          <span v-if="page === '...'" class="w-8 h-8 flex items-center justify-center text-[var(--text-faint)] text-sm select-none">…</span>
          <button
            v-else
            type="button"
            :class="btnClass(page === modelValue, false)"
            :aria-label="`Page ${page}`"
            :aria-current="page === modelValue ? 'page' : undefined"
            :style="page === modelValue ? '' : 'padding: 0 0.5rem'"
            @click="go(page)">
            {{ page }}
          </button>
        </template>
      </template>

      <!-- Next -->
      <button
        type="button"
        :class="btnClass(false, !canNext)"
        :disabled="!canNext"
        aria-label="Next page"
        @click="go(modelValue + 1)">
        <i class="pi pi-chevron-right text-xs" aria-hidden="true"></i>
      </button>
    </nav>
  </div>
</template>
