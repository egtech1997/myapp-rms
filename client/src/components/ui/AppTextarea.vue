<script setup>
import { ref, watch, nextTick, onMounted, computed } from 'vue'

defineOptions({ name: 'AppTextarea', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: String, default: '' },
  label:      { type: String, default: '' },
  rows:       { type: Number, default: 3 },
  maxlength:  { type: Number, default: null },
  showCount:  { type: Boolean, default: false },
  autoResize: { type: Boolean, default: true },
  size:       { type: String, default: 'md', validator: (v) => ['xs', 'sm', 'md', 'lg'].includes(v) },
  error:      { type: String, default: '' },
  hint:       { type: String, default: '' },
  disabled:   { type: Boolean, default: false },
  readonly:   { type: Boolean, default: false },
  id:         { type: String, default: () => `ta-${Math.random().toString(36).slice(2, 8)}` },
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])
const el   = ref(null)
const isFocused = ref(false)

const resize = () => {
  if (!props.autoResize || !el.value) return
  el.value.style.height = 'auto'
  el.value.style.height = `${el.value.scrollHeight}px`
}

onMounted(() => { nextTick(resize) })
watch(() => props.modelValue, () => nextTick(resize))

const hasValue = computed(() => 
  props.modelValue !== null && props.modelValue !== undefined && props.modelValue.toString().length > 0
)

const isFloating = computed(() => isFocused.value || hasValue.value)

const labelClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
}

const floatingOffsets = {
  xs: '-translate-y-5 scale-75',
  sm: '-translate-y-5.5 scale-75',
  md: '-translate-y-6.5 scale-75',
  lg: '-translate-y-8 scale-75',
}
</script>

<template>
  <div class="flex flex-col gap-1 w-full group">
    
    <div class="relative flex w-full">
      
      <!-- NATIVE TEXTAREA -->
      <textarea
        ref="el"
        v-bind="$attrs"
        :id="id"
        :value="modelValue"
        :rows="rows"
        :maxlength="maxlength"
        :disabled="disabled"
        :readonly="readonly"
        placeholder=" "
        :class="[
          'block w-full appearance-none bg-transparent outline-none transition-all duration-200 border peer',
          'px-4 pt-5 pb-2.5 font-bold text-[var(--text-main)] rounded-xl min-h-[80px]',
          error 
            ? 'border-rose-400 focus:border-rose-500 bg-rose-50/5' 
            : 'border-[var(--border-main)] hover:border-[var(--border-strong)] focus:border-[var(--color-primary)] focus:ring-0',
          disabled ? 'opacity-50 cursor-not-allowed bg-[var(--bg-app)]' : 'bg-[var(--surface)]',
          isFocused ? 'border-2' : 'border-1'
        ]"
        :style="autoResize ? 'overflow:hidden' : ''"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="isFocused = true; $emit('focus', $event)"
        @blur="isFocused = false; $emit('blur', $event)"
      ></textarea>

      <!-- FLOATING LABEL -->
      <label 
        v-if="label"
        :for="id"
        :class="[
          'absolute flex items-center gap-2 transition-all duration-300 pointer-events-none select-none origin-[0] start-4 px-1 bg-[var(--surface)]',
          labelClasses[size],
          'text-[var(--text-faint)] font-medium',
          /* Floating State */
          'peer-focus:px-1 peer-focus:font-black peer-focus:text-[var(--color-primary)]',
          isFloating ? floatingOffsets[size] : 'top-4 translate-y-0',
          /* Match placeholder-shown behavior */
          'peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:top-4',
          /* Transition */
          'peer-focus:top-4 peer-focus:scale-75',
          floatingOffsets[size].split(' ')[0].replace('-', 'peer-focus:-'),
          error && isFloating ? '!text-rose-500' : ''
        ]"
      >
        {{ label }}
      </label>

      <!-- CHAR COUNT -->
      <div v-if="showCount && maxlength" class="absolute right-3 bottom-2 pointer-events-none">
        <span :class="[
          'text-[9px] font-black uppercase tracking-widest',
          modelValue.length >= maxlength * 0.9 ? 'text-rose-500' : 'text-[var(--text-faint)]'
        ]">{{ modelValue.length }} / {{ maxlength }}</span>
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

textarea:focus {
  outline: none;
  box-shadow: none;
}
</style>
