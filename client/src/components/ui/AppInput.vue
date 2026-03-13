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

// Size configurations
const sizeConfigs = {
  xs: { h: 'h-8',  f: 'text-xs'  },
  sm: { h: 'h-10', f: 'text-sm'  },
  md: { h: 'h-11', f: 'text-sm'  },
  lg: { h: 'h-12', f: 'text-base' },
}

const config = computed(() => sizeConfigs[props.size] || sizeConfigs.md)

const onInput = (e) => emit('update:modelValue', e.target.value)
const onClear = () => { emit('update:modelValue', ''); emit('clear') }
</script>

<template>
  <div class="flex flex-col gap-1 w-full">

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
          'block w-full appearance-none bg-transparent outline-none transition-all duration-200 font-bold text-[var(--text-main)] rounded-xl px-4 peer',
          config.h,
          config.f,
          error
            ? 'border-rose-400 focus:border-rose-500 bg-rose-50/5'
            : 'border-[var(--border-main)] hover:border-[var(--border-strong)] focus:border-[var(--color-primary)] focus:ring-0',
          disabled ? 'opacity-50 cursor-not-allowed bg-[var(--bg-app)]' : 'bg-[var(--surface)]',
          isFocused ? 'border-2' : 'border',
        ]"
        @input="onInput"
        @focus="isFocused = true; $emit('focus', $event)"
        @blur="isFocused = false; $emit('blur', $event)"
      />

      <!-- FLOATING LABEL — Flowbite outlined approach -->
      <label
        v-if="label"
        :for="id"
        :class="[
          'absolute inline-flex items-center gap-1.5 duration-300 transform origin-[0]',
          'pointer-events-none select-none',
          'start-4 px-1 bg-[var(--surface)]',
          config.f,

          // ── Floated (default — input has value) ───────────
          'top-1.5 -translate-y-3.5 scale-75 font-black z-10',

          // ── Resting (empty + unfocused via CSS peer) ───────
          'peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2',
          'peer-placeholder-shown:top-1/2 peer-placeholder-shown:font-medium peer-placeholder-shown:z-0',

          // ── Re-float on focus (via CSS peer) ───────────────
          'peer-focus:top-1.5 peer-focus:-translate-y-3.5 peer-focus:scale-75',
          'peer-focus:font-black peer-focus:z-10',

          // ── Colors ─────────────────────────────────────────
          error
            ? 'text-rose-500 peer-placeholder-shown:text-[var(--text-faint)] peer-focus:text-rose-500'
            : 'text-[var(--color-primary)] peer-placeholder-shown:text-[var(--text-faint)] peer-focus:text-[var(--color-primary)]',
          'max-w-[calc(100%-2.5rem)] overflow-hidden',
        ]"
      >
        <i v-if="prefixIcon" :class="['pi text-[10px] shrink-0', prefixIcon]"></i>
        <span class="min-w-0 truncate">{{ label }}</span>
      </label>

      <!-- SUFFIX ICONS -->
      <div class="absolute right-4 flex items-center gap-2 pointer-events-none">
        <i v-if="loading" class="pi pi-spin pi-spinner text-[var(--text-faint)] text-xs"></i>

        <div class="flex items-center gap-2 pointer-events-auto">
          <button v-if="clearable && hasValue" @click="onClear" type="button"
            class="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--bg-app)] text-[var(--text-faint)] hover:text-[var(--text-main)] transition-all">
            <i class="pi pi-times text-[10px]"></i>
          </button>
          <button v-if="toggleable" @click="showPassword = !showPassword" type="button"
            class="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-faint)] hover:text-[var(--color-primary)] transition-colors">
            <i :class="['pi text-sm', showPassword ? 'pi-eye-slash' : 'pi-eye']"></i>
          </button>
          <i v-else-if="suffixIcon && !loading" :class="['pi text-[var(--text-faint)] text-sm', suffixIcon]"></i>
        </div>
      </div>

    </div>

    <!-- FEEDBACK -->
    <div class="px-1 min-h-[1.25rem]">
      <Transition name="slide-up">
        <p v-if="error" class="text-[10px] font-bold text-rose-500 flex items-center gap-1.5 tracking-wide uppercase">
          <i class="pi pi-exclamation-circle text-[10px]"></i> {{ error }}
        </p>
        <p v-else-if="hint && isFocused" class="text-[10px] font-medium text-[var(--text-muted)] animate-fade-in tracking-wide">
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
