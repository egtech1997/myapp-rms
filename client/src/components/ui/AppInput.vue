<script setup>
import { ref, computed } from 'vue'

defineOptions({ name: 'AppInput', inheritAttrs: false })

const props = defineProps({
  modelValue:  { type: [String, Number], default: '' },
  type:        { type: String,  default: 'text' },
  size:        { type: String,  default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
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
const isHovered    = ref(false)

const inputType = computed(() => {
  if (props.toggleable) return showPassword.value ? 'text' : 'password'
  return props.type
})

const hasSuffix = computed(() =>
  props.suffixIcon || props.clearable || props.toggleable || props.loading
)

// Border state machine
const borderState = computed(() => {
  if (props.error)     return 'error'
  if (isFocused.value) return 'focused'
  if (isHovered.value) return 'hovered'
  return 'idle'
})

const wrapperStyle = computed(() => {
  const styles = {
    idle:    { border: '1px solid var(--border-main)',   boxShadow: 'var(--shadow-xs)', background: 'var(--surface)' },
    hovered: { border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-xs)', background: 'var(--surface)' },
    focused: { border: '1px solid var(--color-primary)', boxShadow: 'var(--shadow-focus)', background: 'var(--surface)' },
    error:   { border: '1px solid var(--color-danger)',  boxShadow: isFocused.value ? 'var(--shadow-focus-danger)' : 'var(--shadow-xs)', background: 'var(--surface)' },
  }
  return styles[borderState.value]
})

const sizeHeights = { sm: 'h-7',  md: 'h-9',  lg: 'h-11' }
const sizeText    = { sm: 'text-xs', md: 'text-sm', lg: 'text-[15px]' }

const onInput = (e) => emit('update:modelValue', e.target.value)
const onClear = () => { emit('update:modelValue', ''); emit('clear') }
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">

    <!-- Input wrapper -->
    <div
      :style="{
        ...wrapperStyle,
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        transition: `border-color var(--dur-fast) var(--ease-smooth), box-shadow var(--dur-fast) var(--ease-smooth), background var(--dur-fast) var(--ease-smooth)`,
        opacity: props.disabled ? '0.5' : '1',
        cursor: props.disabled ? 'not-allowed' : '',
      }"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false">

      <!-- Prefix icon -->
      <div v-if="prefixIcon" class="pl-3 pr-0 flex items-center shrink-0 pointer-events-none">
        <i :class="[
          'pi text-sm transition-colors',
          prefixIcon,
          props.error     ? 'text-[var(--color-danger)]' :
          isFocused.value ? 'text-[var(--color-primary)]' :
          'text-[var(--text-faint)]',
        ]" style="transition: color var(--dur-fast) var(--ease-smooth);" aria-hidden="true"></i>
      </div>

      <!-- Input element -->
      <input
        v-bind="$attrs"
        :id="id"
        :type="inputType"
        :value="modelValue"
        :disabled="disabled"
        :readonly="readonly"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
        :class="[
          'flex-1 bg-transparent border-none outline-none w-full',
          'font-medium text-[var(--text-main)] placeholder-[var(--text-faint)]',
          'font-[var(--font-sans)] tracking-[-0.01em]',
          sizeHeights[size],
          sizeText[size],
          prefixIcon ? 'pl-2' : 'pl-3',
          hasSuffix  ? 'pr-2' : 'pr-3',
          disabled   ? 'cursor-not-allowed' : '',
        ]"
        @input="onInput"
        @focus="isFocused = true; $emit('focus', $event)"
        @blur="isFocused = false; $emit('blur', $event)"
      />

      <!-- Suffix area -->
      <div v-if="hasSuffix" class="pr-3 flex items-center gap-1.5 shrink-0">
        <!-- Loading -->
        <svg v-if="loading" :class="['w-3.5 h-3.5 animate-spin text-[var(--text-muted)]']"
          viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="2.5"/>
          <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        </svg>

        <!-- Clear -->
        <button
          v-else-if="clearable && modelValue"
          type="button"
          class="w-4.5 h-4.5 flex items-center justify-center rounded-full
                 text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--surface-2)]
                 transition-all"
          style="transition: all var(--dur-fast) var(--ease-smooth);"
          aria-label="Clear"
          @click="onClear">
          <i class="pi pi-times text-[9px]" aria-hidden="true"></i>
        </button>

        <!-- Password toggle -->
        <button
          v-if="toggleable"
          type="button"
          class="text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"
          style="transition: color var(--dur-fast) var(--ease-smooth);"
          :aria-label="showPassword ? 'Hide password' : 'Show password'"
          @click="showPassword = !showPassword">
          <i :class="['pi text-sm', showPassword ? 'pi-eye-slash' : 'pi-eye']" aria-hidden="true"></i>
        </button>

        <!-- Static suffix icon -->
        <i v-else-if="suffixIcon && !loading"
          :class="['pi text-sm text-[var(--text-faint)]', suffixIcon]"
          aria-hidden="true">
        </i>
      </div>
    </div>

    <!-- Error -->
    <Transition name="fade">
      <p v-if="error" :id="`${id}-error`" role="alert"
        class="text-xs text-[var(--color-danger)] font-medium flex items-center gap-1.5">
        <i class="pi pi-exclamation-circle text-[11px]" aria-hidden="true"></i>
        {{ error }}
      </p>
      <p v-else-if="hint" :id="`${id}-hint`"
        class="text-xs text-[var(--text-muted)] leading-snug">{{ hint }}</p>
    </Transition>
  </div>
</template>
