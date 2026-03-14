<script setup>
import { ref, watch } from 'vue'
import { useSound } from '@/composables/useSound'

defineOptions({ name: 'AppCheckbox' })

const { play } = useSound()

const props = defineProps({
  modelValue:    { type: [Boolean, Array], default: false },
  value:         { type: [String, Number, Object], default: undefined },
  label:         { type: String, default: '' },
  hint:          { type: String, default: '' },
  disabled:      { type: Boolean, default: false },
  indeterminate: { type: Boolean, default: false },
  size:          { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  id:            { type: String, default: () => `chk-${Math.random().toString(36).slice(2, 8)}` },
})
const emit = defineEmits(['update:modelValue'])
const inputRef = ref(null)

const isChecked = () => {
  if (Array.isArray(props.modelValue)) {
    return props.value !== undefined
      ? props.modelValue.includes(props.value)
      : false
  }
  return !!props.modelValue
}

const toggle = () => {
  if (props.disabled) return
  play('toggle')
  if (Array.isArray(props.modelValue) && props.value !== undefined) {
    const next = [...props.modelValue]
    const idx  = next.indexOf(props.value)
    idx === -1 ? next.push(props.value) : next.splice(idx, 1)
    emit('update:modelValue', next)
  } else {
    emit('update:modelValue', !props.modelValue)
  }
}

watch(() => props.indeterminate, (v) => {
  if (inputRef.value) inputRef.value.indeterminate = v
}, { immediate: true })

const sizeMap = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' }
const textMap = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }
</script>

<template>
  <label
    :for="id"
    :class="[
      'inline-flex items-start gap-2.5 cursor-pointer group select-none',
      disabled ? 'opacity-50 cursor-not-allowed' : '',
    ]">
    <!-- Hidden native checkbox (for form submission + accessibility) -->
    <input
      ref="inputRef"
      :id="id"
      type="checkbox"
      :checked="isChecked()"
      :disabled="disabled"
      class="sr-only"
      @change="toggle"
    />

    <!-- Visual checkbox -->
    <span
      :class="[
        'shrink-0 rounded flex items-center justify-center border-2 transition-all duration-150 mt-px',
        sizeMap[size],
        isChecked() || indeterminate
          ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
          : 'bg-[var(--surface)] border-[var(--border-strong)] group-hover:border-[var(--color-primary)]',
      ]"
      :style="isChecked() || indeterminate ? 'box-shadow: var(--shadow-xs)' : ''"
      aria-hidden="true">
      <i v-if="indeterminate" class="pi pi-minus text-[9px] text-white font-bold"></i>
      <i v-else-if="isChecked()" class="pi pi-check text-[9px] text-white font-bold"></i>
    </span>

    <!-- Label + hint -->
    <span v-if="label || hint" class="flex flex-col gap-0.5">
      <span :class="['font-medium text-[var(--text-main)] leading-snug', textMap[size]]">{{ label }}</span>
      <span v-if="hint" class="text-xs text-[var(--text-muted)] leading-snug">{{ hint }}</span>
    </span>
  </label>
</template>
