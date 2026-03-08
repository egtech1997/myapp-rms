<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

defineOptions({ name: 'AppToast' })

const props = defineProps({
  id:          { type: String, required: true },
  type:        { type: String, default: 'info' },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  duration:    { type: Number, default: 4000 },
  action:      { type: Object, default: null },
  closable:    { type: Boolean, default: true },
})

const emit = defineEmits(['dismiss'])

// Progress bar
const progress = ref(100)
const paused   = ref(false)
let timer      = null
let rafId      = null
let startTime  = null
let remaining  = props.duration

const startTimer = () => {
  if (props.duration === Infinity) return
  startTime = performance.now()
  const tick = (now) => {
    if (paused.value) { startTime = now; rafId = requestAnimationFrame(tick); return }
    const elapsed = now - startTime
    remaining = Math.max(0, remaining - elapsed)
    startTime = now
    progress.value = (remaining / props.duration) * 100
    if (remaining <= 0) { emit('dismiss', props.id); return }
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

onMounted(startTimer)
onBeforeUnmount(() => { cancelAnimationFrame(rafId); clearTimeout(timer) })

const onAction = () => {
  props.action?.onClick?.()
  emit('dismiss', props.id)
}

const config = computed(() => ({
  success: {
    icon:    'pi-check-circle',
    iconBg:  'bg-green-100',
    iconClr: 'text-green-600',
    bar:     'bg-green-500',
    ring:    'ring-green-100',
  },
  error: {
    icon:    'pi-times-circle',
    iconBg:  'bg-red-100',
    iconClr: 'text-red-500',
    bar:     'bg-red-500',
    ring:    'ring-red-100',
  },
  warning: {
    icon:    'pi-exclamation-triangle',
    iconBg:  'bg-amber-100',
    iconClr: 'text-amber-600',
    bar:     'bg-amber-500',
    ring:    'ring-amber-100',
  },
  info: {
    icon:    'pi-info-circle',
    iconBg:  'bg-[var(--color-primary-light)]',
    iconClr: 'text-[var(--color-primary)]',
    bar:     'bg-[var(--color-primary)]',
    ring:    'ring-[var(--color-primary-light)]',
  },
  loading: {
    icon:    'pi-spin pi-spinner',
    iconBg:  'bg-[var(--surface-2)]',
    iconClr: 'text-[var(--text-muted)]',
    bar:     'bg-[var(--color-primary)]',
    ring:    'ring-[var(--border-main)]',
  },
}[props.type] ?? {}))
</script>

<template>
  <div
    role="alert"
    aria-live="polite"
    :aria-atomic="true"
    class="relative flex items-start gap-3 w-full max-w-sm rounded-xl overflow-hidden
           bg-[var(--surface)] select-none cursor-default
           ring-1 transition-all duration-200"
    :class="config.ring"
    style="
      box-shadow:
        0 1px 2px rgba(0,0,0,0.04),
        0 4px 8px rgba(0,0,0,0.06),
        0 16px 28px rgba(0,0,0,0.10);
      padding: 14px 14px 16px 14px;
    "
    @mouseenter="paused = true"
    @mouseleave="paused = false">

    <!-- Icon -->
    <div :class="['w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-px', config.iconBg]">
      <i :class="['pi text-sm', config.icon, config.iconClr]" aria-hidden="true"></i>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0 pt-0.5">
      <p class="text-sm font-semibold text-[var(--text-main)] leading-snug tracking-tight">{{ title }}</p>
      <p v-if="description" class="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{{ description }}</p>

      <!-- Action button -->
      <button
        v-if="action"
        type="button"
        class="mt-2.5 text-xs font-semibold text-[var(--color-primary)] hover:underline"
        @click="onAction">
        {{ action.label }}
      </button>
    </div>

    <!-- Close -->
    <button
      v-if="closable"
      type="button"
      class="shrink-0 w-6 h-6 flex items-center justify-center rounded-md mt-px
             text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--surface-2)]
             transition-colors"
      aria-label="Dismiss notification"
      @click="$emit('dismiss', id)">
      <i class="pi pi-times text-[10px]" aria-hidden="true"></i>
    </button>

    <!-- Progress bar -->
    <div
      v-if="duration !== Infinity"
      class="absolute bottom-0 left-0 h-[2px] rounded-full transition-none"
      :class="config.bar"
      :style="{ width: `${progress}%`, transition: paused ? 'none' : 'width 100ms linear' }"
      aria-hidden="true">
    </div>
  </div>
</template>
