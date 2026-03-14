<script setup>
import { useSound } from '@/composables/useSound'

defineOptions({ name: 'AppSwitch' })

const { play } = useSound()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  label:      { type: String, default: '' },
  hint:       { type: String, default: '' },
  disabled:   { type: Boolean, default: false },
  size:       { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  id:         { type: String, default: () => `sw-${Math.random().toString(36).slice(2, 8)}` },
})
const emit = defineEmits(['update:modelValue'])

const toggle = () => {
  if (!props.disabled) {
    play('toggle')
    emit('update:modelValue', !props.modelValue)
  }
}

const trackSizes = { sm: 'w-7 h-4', md: 'w-10 h-5.5', lg: 'w-12 h-7' }
const thumbSizes = { sm: 'w-3 h-3',  md: 'w-4 h-4',    lg: 'w-5.5 h-5.5' }
const thumbMove  = { sm: 'translate-x-3.5', md: 'translate-x-[1.35rem]', lg: 'translate-x-5' }
const textSizes  = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }
</script>

<template>
  <div
    :class="['inline-flex items-center gap-3 cursor-pointer group select-none',
      disabled ? 'opacity-50 cursor-not-allowed' : '']"
    @click="toggle"
    @keydown.space.prevent="toggle"
    @keydown.enter.prevent="toggle"
    tabindex="0"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label || undefined"
    :aria-disabled="disabled">

    <!-- Track -->
    <div :class="[
      'relative rounded-full transition-all duration-200 flex-shrink-0',
      trackSizes[size],
      modelValue
        ? 'bg-[var(--color-primary)]'
        : 'bg-[var(--border-strong)] group-hover:bg-[var(--text-faint)]',
    ]">
      <!-- Thumb -->
      <div :class="[
        'absolute top-0.5 left-0.5 rounded-full bg-white transition-transform duration-200 shadow-sm',
        thumbSizes[size],
        modelValue ? thumbMove[size] : 'translate-x-0',
      ]"></div>
    </div>

    <!-- Label + hint -->
    <span v-if="label || hint" class="flex flex-col gap-0.5">
      <span :class="['font-medium text-[var(--text-main)] leading-snug', textSizes[size]]">{{ label }}</span>
      <span v-if="hint" class="text-xs text-[var(--text-muted)]">{{ hint }}</span>
    </span>
  </div>
</template>
