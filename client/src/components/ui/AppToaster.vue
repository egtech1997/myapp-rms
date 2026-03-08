<script setup>
import { ref, computed } from 'vue'
import AppToast from './AppToast.vue'
import { useToast } from '@/composables/useToast'

defineOptions({ name: 'AppToaster' })

const props = defineProps({
  position: {
    type: String,
    default: 'bottom-right',
    validator: (v) => ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'bottom-center', 'top-center'].includes(v),
  },
  expand: { type: Boolean, default: false },  // always show expanded
})

const { toasts, dismiss } = useToast()
const hovered = ref(false)

const MAX_STACK = 3

// Toasts ordered newest-first for rendering (last item = front)
const visible = computed(() => [...toasts].reverse().slice(0, MAX_STACK))

// Position classes
const positionClass = computed(() => ({
  'bottom-right':  'bottom-5 right-5 items-end',
  'bottom-left':   'bottom-5 left-5  items-start',
  'top-right':     'top-5   right-5  items-end',
  'top-left':      'top-5   left-5   items-start',
  'bottom-center': 'bottom-5 left-1/2 -translate-x-1/2 items-center',
  'top-center':    'top-5   left-1/2 -translate-x-1/2 items-center',
}[props.position]))

// When stacked (not hovered), apply offset+scale to create depth
const isExpanded = computed(() => props.expand || hovered.value || toasts.length <= 1)

const toastStyle = (idx, total) => {
  if (isExpanded.value) {
    // Expanded — stacked list with gaps
    return {
      position: 'relative',
      transform: 'translateY(0) scale(1)',
      opacity: '1',
      zIndex: total - idx,
      transition: 'all 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      marginBottom: idx < total - 1 ? '8px' : '0',
    }
  }

  // Collapsed — stack with shrink + fade for background toasts
  const offset = idx * 6      // px vertical push
  const scale  = 1 - idx * 0.04  // shrink behind
  const opacity = idx === 0 ? 1 : idx === 1 ? 0.85 : 0.7

  return {
    position: idx === 0 ? 'relative' : 'absolute',
    bottom: '0',
    left:   '0',
    right:  '0',
    transform: `translateY(-${offset}px) scale(${scale})`,
    transformOrigin: 'bottom center',
    opacity: String(opacity),
    zIndex: MAX_STACK - idx,
    transition: 'all 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    marginBottom: '0',
    pointerEvents: idx === 0 ? 'auto' : 'none',
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      :class="['fixed z-[500] flex flex-col pointer-events-none', positionClass]"
      style="width: 380px; max-width: calc(100vw - 2.5rem);"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
      role="region"
      aria-label="Notifications"
      aria-live="polite">

      <!-- Toast stack wrapper — handles the 3D stacking -->
      <div
        :class="['relative w-full pointer-events-auto', isExpanded ? 'flex flex-col-reverse' : '']"
        :style="!isExpanded && visible.length > 1 ? { height: `${56 + (visible.length - 1) * 6}px` } : {}">

        <TransitionGroup name="toast" tag="div" class="contents">
          <div
            v-for="(toast, idx) in visible"
            :key="toast.id"
            :style="toastStyle(idx, visible.length)">
            <AppToast
              v-bind="toast"
              @dismiss="dismiss" />
          </div>
        </TransitionGroup>
      </div>
    </div>
  </Teleport>
</template>
