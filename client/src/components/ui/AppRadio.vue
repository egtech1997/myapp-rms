<script setup>
defineOptions({ name: 'AppRadio' })

const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: null },
  options: {
    type: Array,   // [{ value, label, hint?, disabled? }]
    required: true,
  },
  name:      { type: String, required: true },
  direction: { type: String, default: 'vertical', validator: (v) => ['vertical', 'horizontal'].includes(v) },
  size:      { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
})
const emit = defineEmits(['update:modelValue'])

const sizeMap  = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' }
const textMap  = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }
const innerMap = { sm: 'w-1.5 h-1.5', md: 'w-2 h-2', lg: 'w-2.5 h-2.5' }
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="name"
    :class="['flex gap-3', direction === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col']">
    <label
      v-for="opt in options"
      :key="opt.value"
      :class="[
        'inline-flex items-start gap-3 cursor-pointer group select-none',
        opt.disabled ? 'opacity-50 cursor-not-allowed' : '',
      ]">
      <!-- Hidden native radio -->
      <input
        type="radio"
        :name="name"
        :value="opt.value"
        :checked="modelValue === opt.value"
        :disabled="opt.disabled"
        class="sr-only"
        @change="emit('update:modelValue', opt.value)"
      />

      <!-- Custom radio ring -->
      <span :class="[
        'shrink-0 rounded-full border-2 flex items-center justify-center transition-all duration-150 mt-px',
        sizeMap[size],
        modelValue === opt.value
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
          : 'border-[var(--border-strong)] bg-[var(--surface)] group-hover:border-[var(--color-primary)]',
      ]" aria-hidden="true">
        <span v-if="modelValue === opt.value"
          :class="['rounded-full bg-white', innerMap[size]]">
        </span>
      </span>

      <!-- Label + hint -->
      <span class="flex flex-col gap-0.5">
        <span :class="['font-medium text-[var(--text-main)] leading-snug', textMap[size]]">
          {{ opt.label }}
        </span>
        <span v-if="opt.hint" class="text-xs text-[var(--text-muted)] leading-snug">
          {{ opt.hint }}
        </span>
      </span>
    </label>
  </div>
</template>
