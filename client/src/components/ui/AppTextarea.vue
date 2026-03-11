<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'

defineOptions({ name: 'AppTextarea', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: String, default: '' },
  rows:       { type: Number, default: 3 },
  maxlength:  { type: Number, default: null },
  showCount:  { type: Boolean, default: false },
  autoResize: { type: Boolean, default: true },
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
      <textarea
        ref="el"
        v-bind="$attrs"
        :id="id"
        :value="modelValue"
        :rows="rows"
        :maxlength="maxlength"
        :disabled="disabled"
        :readonly="readonly"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
        class="w-full bg-transparent text-[var(--text-main)] placeholder-[var(--text-faint)]
               text-sm font-medium leading-relaxed font-[var(--font-sans)]
               px-3 py-2.5 border-none outline-none resize-none block"
        :style="autoResize ? 'overflow:hidden' : ''"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="isFocused = true; $emit('focus', $event)"
        @blur="isFocused = false; $emit('blur', $event)"
      ></textarea>

      <!-- Character count -->
      <div v-if="showCount && maxlength" class="flex justify-end px-3 pb-2">
        <span :class="[
          'text-[11px] font-medium',
          modelValue.length >= maxlength * 0.9 ? 'text-[var(--color-danger)]' : 'text-[var(--text-faint)]'
        ]">{{ modelValue.length }} / {{ maxlength }}</span>
      </div>
    </div>

    <p v-if="error" :id="`${id}-error`" role="alert"
      class="text-xs text-[var(--color-danger)] font-medium flex items-center gap-1.5">
      <i class="pi pi-exclamation-circle text-xs" aria-hidden="true"></i>{{ error }}
    </p>
    <p v-else-if="hint" :id="`${id}-hint`" class="text-xs text-[var(--text-muted)]">{{ hint }}</p>
  </div>
</template>
