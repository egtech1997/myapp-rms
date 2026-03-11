<script setup>
import { computed, ref } from 'vue'

defineOptions({ name: 'AppSelect', inheritAttrs: false })

const props = defineProps({
  modelValue:  { type: [String, Number, null], default: '' },
  options:     { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Select an option' },
  valueKey:    { type: String, default: 'value' },
  labelKey:    { type: String, default: 'label' },
  size:        { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  error:       { type: String, default: '' },
  hint:        { type: String, default: '' },
  disabled:    { type: Boolean, default: false },
  id:          { type: String, default: () => `sel-${Math.random().toString(36).slice(2, 8)}` },
})
const emit = defineEmits(['update:modelValue'])
const isFocused = ref(false)

const normalizedOptions = computed(() =>
  props.options.map((o) =>
    typeof o === 'string' || typeof o === 'number'
      ? { label: o, value: o }
      : { label: o[props.labelKey], value: o[props.valueKey] }
  )
)

const sizeClasses = { sm: 'h-7 text-xs pl-2.5', md: 'h-9 text-sm pl-3', lg: 'h-11 text-base pl-3.5' }
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">
    <div :class="[
      'relative rounded-[var(--radius-md)] border transition-all duration-150',
      error
        ? 'border-[var(--color-danger)] shadow-[var(--shadow-focus-danger)]'
        : isFocused
          ? 'border-[var(--color-primary)] shadow-[var(--shadow-focus)]'
          : 'border-[var(--border-main)] shadow-[var(--shadow-xs)]',
      disabled ? 'opacity-50 bg-[var(--bg-app)]' : 'bg-[var(--surface)]',
    ]">
      <select
        v-bind="$attrs"
        :id="id"
        :value="modelValue"
        :disabled="disabled"
        :aria-invalid="!!error"
        :class="[
          'w-full appearance-none bg-transparent outline-none border-none',
          'text-[var(--text-main)] font-medium font-[var(--font-sans)]',
          'pr-9 cursor-pointer',
          sizeClasses[size],
          !modelValue ? 'text-[var(--text-faint)]' : '',
        ]"
        @change="emit('update:modelValue', $event.target.value)"
        @focus="isFocused = true"
        @blur="isFocused = false"
      >
        <option value="" disabled :selected="!modelValue">{{ placeholder }}</option>
        <option
          v-for="opt in normalizedOptions"
          :key="opt.value"
          :value="opt.value"
          :selected="opt.value === modelValue"
        >{{ opt.label }}</option>
      </select>

      <!-- Chevron icon -->
      <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        <i class="pi pi-chevron-down text-[11px] text-[var(--text-muted)]" aria-hidden="true"></i>
      </div>
    </div>

    <p v-if="error" role="alert"
      class="text-xs text-[var(--color-danger)] font-medium flex items-center gap-1.5">
      <i class="pi pi-exclamation-circle text-xs" aria-hidden="true"></i>{{ error }}
    </p>
    <p v-else-if="hint" class="text-xs text-[var(--text-muted)]">{{ hint }}</p>
  </div>
</template>
