<script setup>
import { computed } from 'vue'

defineOptions({ name: 'AppAvatar' })

const props = defineProps({
  src:      { type: String, default: '' },
  name:     { type: String, default: '' },
  size:     { type: String, default: 'md',
    validator: (v) => ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'].includes(v) },
  shape:    { type: String, default: 'circle', validator: (v) => ['circle', 'square'].includes(v) },
  variant:  { type: String, default: 'auto' },  // 'auto' derives color from name
  online:   { type: Boolean, default: false },
  offline:  { type: Boolean, default: false },
  busy:     { type: Boolean, default: false },
  bordered: { type: Boolean, default: false },
  alt:      { type: String, default: '' },
})

const initials = computed(() => {
  if (!props.name) return '?'
  const parts = props.name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

// Deterministic color from name string
const PALETTE = [
  ['#4A4D8F', '#EDEDF8'],  // purple navy
  ['#7c3aed', '#ede9fe'],  // violet
  ['#059669', '#ecfdf5'],  // green
  ['#EFBF04', '#FFFDE7'],  // soft gold
  ['#dc2626', '#fff1f2'],  // red
  ['#0891b2', '#ecfeff'],  // cyan
  ['#db2777', '#fdf2f8'],  // pink
  ['#65a30d', '#f7fee7'],  // lime
]

const colorPair = computed(() => {
  if (!props.name) return PALETTE[0]
  const code = [...props.name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return PALETTE[code % PALETTE.length]
})

const bgColor   = computed(() => colorPair.value[1])
const textColor = computed(() => colorPair.value[0])

const sizeMap = {
  '2xs': { box: 'w-5 h-5',    text: 'text-[8px]',  dot: 'w-1.5 h-1.5', border: '-right-px -bottom-px' },
  xs:    { box: 'w-6 h-6',    text: 'text-[9px]',  dot: 'w-2 h-2',     border: 'right-0 bottom-0' },
  sm:    { box: 'w-7 h-7',    text: 'text-[10px]', dot: 'w-2 h-2',     border: 'right-0 bottom-0' },
  md:    { box: 'w-9 h-9',    text: 'text-xs',     dot: 'w-2.5 h-2.5', border: 'right-0 bottom-0' },
  lg:    { box: 'w-11 h-11',  text: 'text-sm',     dot: 'w-3 h-3',     border: 'right-0 bottom-0' },
  xl:    { box: 'w-14 h-14',  text: 'text-base',   dot: 'w-3.5 h-3.5', border: 'right-px bottom-px' },
  '2xl': { box: 'w-20 h-20',  text: 'text-xl',     dot: 'w-4 h-4',     border: 'right-1 bottom-1' },
}

const presenceColor = computed(() => {
  if (props.online)  return 'bg-green-500'
  if (props.busy)    return 'bg-amber-500'
  if (props.offline) return 'bg-[var(--text-faint)]'
  return ''
})

const shapeClass = computed(() =>
  props.shape === 'square' ? 'rounded-[var(--radius-xl)]' : 'rounded-full'
)
</script>

<template>
  <div :class="['relative inline-flex shrink-0', sizeMap[size].box]">
    <!-- Image -->
    <img
      v-if="src"
      :src="src"
      :alt="alt || name || 'Avatar'"
      :class="[
        'w-full h-full object-cover',
        shapeClass,
        bordered ? 'ring-2 ring-[var(--surface)] ring-offset-0' : '',
      ]"
    />

    <!-- Initials fallback -->
    <div
      v-else
      :class="[
        'w-full h-full flex items-center justify-center font-bold select-none',
        shapeClass,
        bordered ? 'ring-2 ring-[var(--surface)]' : '',
        sizeMap[size].text,
      ]"
      :style="{ backgroundColor: bgColor, color: textColor }"
      :aria-label="name || 'User avatar'">
      {{ initials }}
    </div>

    <!-- Presence indicator -->
    <span
      v-if="presenceColor"
      :class="[
        'absolute border-2 border-[var(--surface)] rounded-full',
        presenceColor,
        sizeMap[size].dot,
        sizeMap[size].border,
      ]"
      aria-hidden="true">
    </span>
  </div>
</template>
