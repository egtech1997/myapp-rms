<script setup>
import { computed, ref } from 'vue'

defineOptions({ name: 'AppSelect', inheritAttrs: false })

const props = defineProps({
  modelValue:  { type: [String, Number, null], default: '' },
  /**
   * Flat options: ['A', 'B'] or [{ label, value }]
   * Grouped options (pass `grouped: true`): [{ label: 'Group', options: [...] }]
   */
  options:     { type: Array, default: () => [] },
  grouped:     { type: Boolean, default: false },
  label:       { type: String, default: '' },
  placeholder: { type: String, default: 'Select an option' },
  valueKey:    { type: String, default: 'value' },
  labelKey:    { type: String, default: 'label' },
  size:        { type: String, default: 'md', validator: (v) => ['xs', 'sm', 'md', 'lg'].includes(v) },
  error:       { type: String, default: '' },
  hint:        { type: String, default: '' },
  disabled:    { type: Boolean, default: false },
  id:          { type: String, default: () => `sel-${Math.random().toString(36).slice(2, 8)}` },
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])
const isFocused = ref(false)

const normalizeFlat = (arr) =>
  arr.map((o) =>
    typeof o === 'string' || typeof o === 'number'
      ? { label: o, value: o }
      : { label: o[props.labelKey], value: o[props.valueKey] }
  )

const normalizedOptions = computed(() =>
  props.grouped ? props.options : normalizeFlat(props.options)
)

// Compact size configs — matches AppInput
const sizeConfigs = {
  xs: { h: 'h-8',  f: 'text-xs'   },
  sm: { h: 'h-9',  f: 'text-sm'   },
  md: { h: 'h-10', f: 'text-sm'   },
  lg: { h: 'h-11', f: 'text-base' },
}

const config = computed(() => sizeConfigs[props.size] || sizeConfigs.md)

const onChange = (e) => emit('update:modelValue', e.target.value)
</script>

<template>
  <div class="flex flex-col gap-1 w-full">

    <div class="relative flex items-center w-full">

      <!-- NATIVE SELECT — pt-3 pushes text below the always-floated label -->
      <select
        v-bind="$attrs"
        :id="id"
        :value="modelValue"
        :disabled="disabled"
        :class="[
          'block w-full appearance-none outline-none transition-all duration-200 font-medium text-[var(--text-main)] rounded-xl pr-8 cursor-pointer px-4 peer border-2',
          config.h,
          config.f,
          error
            ? 'border-rose-400 focus:border-rose-500 bg-rose-50/5'
            : isFocused
              ? 'border-[var(--color-primary)]'
              : 'border-[var(--border-main)] hover:border-[var(--border-main)] focus:ring-0',
          disabled ? 'opacity-50 cursor-not-allowed bg-[var(--bg-app)]' : 'bg-transparent',
        ]"
        @change="onChange"
        @focus="isFocused = true; $emit('focus', $event)"
        @blur="isFocused = false; $emit('blur', $event)">

        <option value="" disabled :selected="!modelValue">{{ placeholder }}</option>

        <template v-if="grouped">
          <optgroup v-for="group in options" :key="group.label" :label="group.label">
            <option
              v-for="opt in normalizeFlat(group.options || [])"
              :key="opt.value" :value="opt.value" :selected="opt.value === modelValue">
              {{ opt.label }}
            </option>
          </optgroup>
        </template>

        <template v-else>
          <option
            v-for="opt in normalizedOptions"
            :key="opt.value" :value="opt.value" :selected="opt.value === modelValue">
            {{ opt.label }}
          </option>
        </template>

      </select>

      <!-- FLOATING LABEL — always on top border (select always has a value/placeholder) -->
      <label
        v-if="label"
        :for="id"
        :class="[
          'absolute inline-flex items-center gap-1.5 duration-200 transform origin-[0]',
          'pointer-events-none select-none start-3 px-1 bg-white/95',
          config.f,
          'top-0 -translate-y-1/2 scale-75 font-semibold z-10 bg-white/95',
          error ? 'text-rose-500' : 'text-[var(--color-primary)]',
          'max-w-[calc(100%-3rem)] overflow-hidden',
        ]">
        <span class="min-w-0 truncate">{{ label }}</span>
      </label>

      <!-- CHEVRON -->
      <div class="absolute right-3 pointer-events-none flex items-center">
        <i class="pi pi-chevron-down text-[10px] text-[var(--text-muted)]"></i>
      </div>

    </div>

    <!-- ERROR / HINT -->
    <div class="px-1 min-h-[1.1rem]">
      <Transition name="slide-up">
        <p v-if="error" class="text-[10px] font-bold text-rose-500 flex items-center gap-1.5 tracking-wide uppercase">
          <i class="pi pi-exclamation-circle text-[10px]"></i> {{ error }}
        </p>
        <p v-else-if="hint && isFocused" class="text-[10px] font-medium text-[var(--text-muted)] animate-fade-in tracking-wide uppercase">
          {{ hint }}
        </p>
      </Transition>
    </div>

  </div>
</template>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.2s var(--ease-out); }
.slide-up-enter-from { opacity: 0; transform: translateY(4px); }
.slide-up-leave-to   { opacity: 0; transform: translateY(-4px); }

select:focus { outline: none; box-shadow: none; }
</style>
