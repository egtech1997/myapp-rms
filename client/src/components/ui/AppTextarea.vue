<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'

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
const el        = ref(null)
const isFocused = ref(false)

const resize = () => {
  if (!props.autoResize || !el.value) return
  el.value.style.height = 'auto'
  el.value.style.height = `${el.value.scrollHeight}px`
}

onMounted(() => { nextTick(resize) })
watch(() => props.modelValue, () => nextTick(resize))

const sizeConfigs = {
  xs: { f: 'text-xs'   },
  sm: { f: 'text-sm'   },
  md: { f: 'text-sm'   },
  lg: { f: 'text-base' },
}
</script>

<template>
  <div class="flex flex-col gap-1 w-full">

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
          'block w-full appearance-none outline-none transition-all duration-200 font-medium text-[var(--text-main)] rounded-xl px-4 pt-6 pb-2.5 min-h-[72px] peer border-2',
          sizeConfigs[size]?.f || 'text-sm',
          error
            ? 'border-rose-400'
            : isFocused
              ? 'border-[var(--color-primary)]'
              : 'border-[var(--border-main)]',
          disabled ? 'opacity-50 cursor-not-allowed bg-[var(--bg-app)]' : 'bg-[var(--surface)]',
        ]"
        :style="autoResize ? 'overflow:hidden' : ''"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="isFocused = true; $emit('focus', $event)"
        @blur="isFocused = false; $emit('blur', $event)"
      ></textarea>

      <!-- FLOATING LABEL — Flowbite outlined approach -->
      <label
        v-if="label"
        :for="id"
        :class="[
          'absolute inline-flex items-center gap-1.5 duration-300 transform origin-[0]',
          'pointer-events-none select-none start-3 px-1 bg-white/95',
          sizeConfigs[size]?.f || 'text-sm',

          // ── Floated: label center sits on top border ────────
          'top-0 -translate-y-1/2 scale-75 font-semibold z-10',

          // ── Resting (empty + unfocused via CSS peer) ────────
          'peer-placeholder-shown:top-5 peer-placeholder-shown:translate-y-0',
          'peer-placeholder-shown:scale-100 peer-placeholder-shown:font-normal peer-placeholder-shown:z-0',

          // ── Re-float on focus ───────────────────────────────
          'peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-75',
          'peer-focus:font-semibold peer-focus:z-10',

          // ── Colors ─────────────────────────────────────────
          error
            ? 'text-rose-500 peer-placeholder-shown:text-[var(--text-faint)] peer-focus:text-rose-500'
            : 'text-[var(--color-primary)] peer-placeholder-shown:text-[var(--text-faint)] peer-focus:text-[var(--color-primary)]',
          'max-w-[calc(100%-2.5rem)] overflow-hidden',
        ]"
      >
        <span class="min-w-0 truncate">{{ label }}</span>
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

textarea:focus { outline: none; box-shadow: none; }
</style>
