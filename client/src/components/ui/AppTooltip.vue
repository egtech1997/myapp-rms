<script setup>
import { ref } from 'vue'

defineOptions({ name: 'AppTooltip' })

const props = defineProps({
  content:    { type: String, required: true },
  placement:  { type: String, default: 'top',
    validator: (v) => ['top', 'bottom', 'left', 'right'].includes(v) },
  delay:      { type: Number, default: 400 },  // ms before showing
  maxWidth:   { type: String, default: '200px' },
  disabled:   { type: Boolean, default: false },
})

const visible = ref(false)
let timer = null

const show = () => {
  if (props.disabled) return
  timer = setTimeout(() => { visible.value = true }, props.delay)
}
const hide = () => { clearTimeout(timer); visible.value = false }

const positionClass = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  right:  'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrowClass = {
  top:    'top-full left-1/2 -translate-x-1/2 border-t-[var(--text-main)] border-l-transparent border-r-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--text-main)] border-l-transparent border-r-transparent border-t-transparent',
  left:   'left-full top-1/2 -translate-y-1/2 border-l-[var(--text-main)] border-t-transparent border-b-transparent border-r-transparent',
  right:  'right-full top-1/2 -translate-y-1/2 border-r-[var(--text-main)] border-t-transparent border-b-transparent border-l-transparent',
}
</script>

<template>
  <div
    class="relative inline-flex"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide">
    <slot />

    <Transition name="tooltip">
      <div
        v-if="visible && content"
        role="tooltip"
        :style="{ maxWidth: props.maxWidth }"
        :class="[
          'absolute z-[600] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white',
          'bg-[var(--text-main)] shadow-lg whitespace-normal text-center leading-snug',
          'pointer-events-none',
          positionClass[placement],
        ]">
        {{ content }}
        <!-- Arrow -->
        <span
          :class="[
            'absolute w-0 h-0 border-4',
            arrowClass[placement],
          ]"
          aria-hidden="true">
        </span>
      </div>
    </Transition>
  </div>
</template>
