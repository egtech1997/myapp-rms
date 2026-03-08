<script setup>
defineOptions({ name: 'AppSpinner' })

const props = defineProps({
  size:   { type: String, default: 'md', validator: (v) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v) },
  color:  { type: String, default: 'primary' }, // 'primary' | 'white' | 'muted' | hex
  label:  { type: String, default: '' },
  center: { type: Boolean, default: false },
})

const sizeMap = {
  xs: 'w-3 h-3 border-[1.5px]',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-9 h-9 border-[3px]',
  xl: 'w-12 h-12 border-4',
}
const textSizeMap = { xs: 'text-[10px]', sm: 'text-xs', md: 'text-sm', lg: 'text-base', xl: 'text-lg' }

const colorMap = {
  primary: 'border-[var(--color-primary-300)] border-t-[var(--color-primary)]',
  white:   'border-white/30 border-t-white',
  muted:   'border-[var(--border-main)] border-t-[var(--text-muted)]',
  danger:  'border-red-200 border-t-[var(--color-danger)]',
}

const spinColor = (c) => colorMap[c] || `border-gray-200 border-t-[${c}]`
</script>

<template>
  <div
    :class="['flex items-center gap-3', center ? 'justify-center' : '']"
    role="status"
    :aria-label="label || 'Loading'">
    <div
      :class="[
        'rounded-full animate-spin',
        sizeMap[size],
        spinColor(color),
      ]"
      aria-hidden="true">
    </div>
    <span v-if="label" :class="['font-medium text-[var(--text-muted)]', textSizeMap[size]]">
      {{ label }}
    </span>
    <span v-else class="sr-only">Loading...</span>
  </div>
</template>
