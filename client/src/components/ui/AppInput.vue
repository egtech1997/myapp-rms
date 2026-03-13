<script setup>
import { ref, computed } from 'vue'

defineOptions({ name: 'AppInput', inheritAttrs: false })

const props = defineProps({
  modelValue:  { type: [String, Number], default: '' },
  label:       { type: String,  default: '' },
  type:        { type: String,  default: 'text' },
  size:        { type: String,  default: 'md', validator: (v) => ['xs', 'sm', 'md', 'lg'].includes(v) },
  prefixIcon:  { type: String,  default: '' },
  suffixIcon:  { type: String,  default: '' },
  error:       { type: String,  default: '' },
  hint:        { type: String,  default: '' },
  loading:     { type: Boolean, default: false },
  clearable:   { type: Boolean, default: false },
  toggleable:  { type: Boolean, default: false },
  disabled:    { type: Boolean, default: false },
  readonly:    { type: Boolean, default: false },
  id:          { type: String,  default: () => `inp-${Math.random().toString(36).slice(2, 8)}` },
})

const emit = defineEmits(['update:modelValue', 'clear', 'focus', 'blur'])

const showPassword = ref(false)
const isFocused    = ref(false)

const inputType = computed(() => {
  if (props.toggleable) return showPassword.value ? 'text' : 'password'
  return props.type
})

const formattedValue = computed(() => {
  if (props.type === 'date' && typeof props.modelValue === 'string' && props.modelValue.includes('T')) {
    return props.modelValue.split('T')[0]
  }
  return props.modelValue
})

const hasValue = computed(() => 
  props.modelValue !== null && props.modelValue !== undefined && props.modelValue.toString().length > 0
)

const isFloating = computed(() => isFocused.value || hasValue.value || props.type === 'date')
const hasSuffix = computed(() => props.suffixIcon || props.clearable || props.toggleable || props.loading)

// Sizing Maps
const containerClasses = {
  xs: 'min-h-[40px] px-3',
  sm: 'min-h-[46px] px-3.5',
  md: 'min-h-[52px] px-4',
  lg: 'min-h-[60px] px-5',
}

const inputClasses = {
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

const onInput = (e) => emit('update:modelValue', e.target.value)
const onClear = () => { emit('update:modelValue', ''); emit('clear') }
</script>

<template>
  <div class="flex flex-col gap-1 w-full group">
    
    <div class="relative flex items-center w-full">
      
      <!-- NATIVE INPUT -->
      <input
        v-bind="$attrs"
        :id="id"
        :type="inputType"
        :value="formattedValue"
        :disabled="disabled"
        :readonly="readonly"
        placeholder=" "
        :class="[
          'block w-full appearance-none bg-transparent outline-none transition-all duration-200 border peer',
          containerClasses[size],
          inputClasses[size],
          'font-bold text-[var(--text-main)] rounded-xl',
          error 
            ? 'border-rose-400 focus:border-rose-500 bg-rose-50/5' 
            : 'border-[var(--border-main)] hover:border-[var(--border-strong)] focus:border-[var(--color-primary)] focus:ring-0',
          disabled ? 'opacity-50 cursor-not-allowed bg-[var(--bg-app)]' : 'cursor-text',
          isFocused ? 'border-2' : 'border-1'
        ]"
        @input="onInput"
        @focus="isFocused = true; $emit('focus', $event)"
        @blur="isFocused = false; $emit('blur', $event)"
      />

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
          /* Placeholder shown state */
          'peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2',
          /* Transition to Floating */
          'peer-focus:top-1/2 peer-focus:scale-75',
          floatingOffsets[size].split(' ')[0].replace('-', 'peer-focus:-'), // Match the offset
          error ? 'peer-focus:text-rose-500' : ''
        ]"
      >
        <i v-if="prefixIcon" :class="['pi', prefixIcon, isFloating ? 'hidden' : '']"></i>
        {{ label }}
      </label>

      <!-- ICONS & SUFFIX (Absolute overlay to keep input clean) -->
      <div class="absolute right-4 flex items-center gap-2 pointer-events-none">
        <i v-if="loading" class="pi pi-spin pi-spinner text-[var(--text-faint)] text-xs"></i>
        
        <div class="flex items-center gap-2 pointer-events-auto">
          <button v-if="clearable && hasValue" @click="onClear" 
            class="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--bg-app)] text-[var(--text-faint)] hover:text-[var(--text-main)] transition-all">
            <i class="pi pi-times text-[10px]"></i>
          </button>
          <button v-if="toggleable" @click="showPassword = !showPassword"
            class="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-faint)] hover:text-[var(--color-primary)] transition-colors">
            <i :class="['pi text-sm', showPassword ? 'pi-eye-slash' : 'pi-eye']"></i>
          </button>
          <i v-else-if="suffixIcon && !loading" :class="['pi text-[var(--text-faint)] text-sm', suffixIcon]"></i>
        </div>
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

/* Remove default webkit ring */
input:focus {
  outline: none;
  box-shadow: none;
}

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--text-main);
  -webkit-box-shadow: 0 0 0px 1000px transparent inset;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
