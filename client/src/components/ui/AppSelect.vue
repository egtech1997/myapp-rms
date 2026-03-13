<script setup>
import { computed, ref } from 'vue'

defineOptions({ name: 'AppSelect', inheritAttrs: false })

const props = defineProps({
  modelValue:  { type: [String, Number, null], default: '' },
  options:     { type: Array, default: () => [] },
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

const normalizedOptions = computed(() =>
  props.options.map((o) =>
    typeof o === 'string' || typeof o === 'number'
      ? { label: o, value: o }
      : { label: o[props.labelKey], value: o[props.valueKey] }
  )
)

const hasValue = computed(() => 
  props.modelValue !== null && props.modelValue !== undefined && props.modelValue.toString().length > 0
)

const isFloating = computed(() => isFocused.value || hasValue.value)

// Sizing Maps
const containerClasses = {
  xs: 'min-h-[40px] px-3',
  sm: 'min-h-[46px] px-3.5',
  md: 'min-h-[52px] px-4',
  lg: 'min-h-[60px] px-5',
}

const selectClasses = {
  xs: 'text-xs pt-1',
  sm: 'text-sm pt-1',
  md: 'text-sm pt-1',
  lg: 'text-base pt-1.5',
}

const labelClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
}

// Floating offsets
const floatingOffsets = {
  xs: '-translate-y-5 scale-75',
  sm: '-translate-y-5.5 scale-75',
  md: '-translate-y-6.5 scale-75',
  lg: '-translate-y-8 scale-75',
}

const onChange = (e) => emit('update:modelValue', e.target.value)
</script>

<template>
  <div class="flex flex-col gap-1 w-full group">
    
    <div class="relative flex items-center w-full">
      
      <!-- NATIVE SELECT -->
      <select
        v-bind="$attrs"
        :id="id"
        :value="modelValue"
        :disabled="disabled"
        :class="[
          'block w-full appearance-none bg-transparent outline-none transition-all duration-200 border peer',
          containerClasses[size],
          selectClasses[size],
          'font-bold text-[var(--text-main)] rounded-xl pr-10 cursor-pointer',
          error 
            ? 'border-rose-400 focus:border-rose-500 bg-rose-50/5' 
            : 'border-[var(--border-main)] hover:border-[var(--border-strong)] focus:border-[var(--color-primary)] focus:ring-0',
          disabled ? 'opacity-50 cursor-not-allowed bg-[var(--bg-app)]' : 'bg-[var(--surface)]',
          isFocused ? 'border-2' : 'border-1'
        ]"
        @change="onChange"
        @focus="isFocused = true; $emit('focus', $event)"
        @blur="isFocused = false; $emit('blur', $event)"
      >
        <option value="" disabled :selected="!modelValue">{{ placeholder }}</option>
        <option
          v-for="opt in normalizedOptions"
          :key="opt.value"
          :value="opt.value"
          :selected="opt.value === modelValue"
        >{{ opt.label }}</option>
      </select>

      <!-- FLOATING LABEL -->
      <label 
        v-if="label"
        :for="id"
        :class="[
          'absolute flex items-center gap-2 transition-all duration-300 pointer-events-none select-none origin-[0] start-4 px-1 bg-[var(--surface)]',
          labelClasses[size],
          'text-[var(--text-faint)] font-medium',
          /* Floating State (Focus or Has Value) */
          'peer-focus:px-1 peer-focus:font-black peer-focus:text-[var(--color-primary)]',
          isFloating ? floatingOffsets[size] : 'top-1/2 -translate-y-1/2',
          /* Match behavior of placeholder-shown for select (empty string check) */
          !isFloating ? 'top-1/2 -translate-y-1/2 scale-100' : '',
          error && isFloating ? '!text-rose-500' : ''
        ]"
      >
        {{ label }}
      </label>

      <!-- CHEVRON ICON -->
      <div class="absolute right-4 pointer-events-none flex items-center">
        <i class="pi pi-chevron-down text-[11px] text-[var(--text-muted)]"></i>
      </div>

    </div>

    <!-- ERROR / HINT -->
    <div class="px-1 min-h-[1.25rem]">
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
.slide-up-leave-to { opacity: 0; transform: translateY(-4px); }

select:focus {
  outline: none;
  box-shadow: none;
}
</style>
