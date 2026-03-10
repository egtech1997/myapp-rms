<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'

defineOptions({ name: 'AppModal' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title:      { type: String, default: '' },
  subtitle:   { type: String, default: '' },
  icon:       { type: String, default: '' },
  size:       { type: String, default: 'md',
    validator: (v) => ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full'].includes(v) },
  width:      { type: String, default: '' },
  persistent: { type: Boolean, default: false },
  hideHeader: { type: Boolean, default: false },
  scrollable: { type: Boolean, default: true },
  align:      { type: String, default: 'center', validator: (v) => ['center', 'top'].includes(v) },
  bodyClass:  { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'close'])

const panelRef   = ref(null)
const previousEl = ref(null)

const close = () => {
  if (props.persistent) {
    // Shake panel to signal "can't close"
    panelRef.value?.classList.add('shake')
    setTimeout(() => panelRef.value?.classList.remove('shake'), 400)
    return
  }
  emit('update:modelValue', false)
  emit('close')
}

// Focus trap
const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
  'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',')

const trapFocus = (e) => {
  if (!panelRef.value) return
  const nodes    = [...panelRef.value.querySelectorAll(FOCUSABLE)]
  const first    = nodes[0]
  const last     = nodes[nodes.length - 1]
  if (e.key === 'Tab') {
    if (e.shiftKey) { if (document.activeElement === first) { last?.focus(); e.preventDefault() } }
    else            { if (document.activeElement === last)  { first?.focus(); e.preventDefault() } }
  }
  if (e.key === 'Escape') close()
}

watch(() => props.modelValue, async (open) => {
  if (open) {
    previousEl.value = document.activeElement
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', trapFocus)
    await nextTick()
    // Focus first focusable, fall back to panel itself
    const first = panelRef.value?.querySelector(FOCUSABLE)
    ;(first || panelRef.value)?.focus()
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', trapFocus)
    nextTick(() => previousEl.value?.focus())
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', trapFocus)
})

const sizeMap = {
  xs:   'max-w-xs',
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  '2xl':'max-w-6xl',
  full: 'max-w-[calc(100vw-3rem)]',
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[400] flex p-4"
        :class="align === 'top' ? 'items-start pt-[8vh]' : 'items-center'"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? 'modal-title' : undefined">

        <!-- Backdrop — separate from panel so it can animate independently -->
        <div
          class="absolute inset-0"
          style="background: rgba(15,23,42,0.55); backdrop-filter: blur(3px) saturate(0.8); -webkit-backdrop-filter: blur(3px) saturate(0.8);"
          @click="close"
          aria-hidden="true">
        </div>

        <!-- Panel -->
        <div
          ref="panelRef"
          tabindex="-1"
          :class="[
            'modal-panel relative w-full flex flex-col overflow-hidden outline-none',
            'bg-[var(--surface)] rounded-2xl',
            sizeMap[size],
            scrollable ? 'max-h-[90vh]' : '',
          ]"
          :style="{
            border: '1px solid var(--border-main)',
            boxShadow: '0 0 0 0.5px rgba(0,0,0,0.05), 0 2px 6px rgba(0,0,0,0.04), 0 12px 28px rgba(0,0,0,0.08), 0 40px 72px rgba(0,0,0,0.12)',
            margin: 'auto',
            width: width || undefined,
            maxWidth: width ? '95vw' : undefined
          }">

          <!-- Blue accent strip -->
          <div style="height: 3px; background: var(--color-primary); border-radius: 1rem 1rem 0 0; flex-shrink: 0;"></div>

          <!-- Header -->
          <slot name="header">
            <div v-if="!hideHeader"
              class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-main)] shrink-0 bg-[var(--surface)]">
              <div class="flex items-center gap-3 min-w-0">
                <div v-if="icon" class="w-9 h-9 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                  <i :class="['pi text-sm', icon]" aria-hidden="true"></i>
                </div>
                <div class="min-w-0">
                  <h2 v-if="title" id="modal-title"
                    class="text-base font-bold text-[var(--text-main)] tracking-tight leading-snug">
                    {{ title }}
                  </h2>
                  <p v-if="subtitle" class="text-xs text-[var(--text-muted)] mt-0.5 leading-snug">{{ subtitle }}</p>
                </div>
              </div>
              <button
                type="button"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)]
                       hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]
                       transition-colors flex-shrink-0 ml-4"
                aria-label="Close dialog"
                @click="close">
                <i class="pi pi-times text-sm" aria-hidden="true"></i>
              </button>
            </div>
          </slot>

          <!-- Body -->
          <div :class="[
            'flex-1 px-6 py-5 text-sm text-[var(--text-sub)] leading-relaxed',
            scrollable ? 'overflow-y-auto custom-scrollbar' : '',
            bodyClass
          ]">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer"
            class="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] shrink-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Spring entrance for panel — separate from backdrop transition */
.modal-enter-active .modal-panel {
  animation: modalEnter 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.modal-leave-active .modal-panel {
  animation: modalLeave 180ms cubic-bezier(0.7, 0, 0.84, 0) both;
}
@keyframes modalEnter {
  from { opacity: 0; transform: scale(0.93) translateY(16px); }
  to   { opacity: 1; transform: scale(1)    translateY(0); }
}
@keyframes modalLeave {
  from { opacity: 1; transform: scale(1)    translateY(0); }
  to   { opacity: 0; transform: scale(0.96) translateY(8px); }
}

/* Backdrop */
.modal-enter-active { transition: opacity 220ms ease-out; }
.modal-leave-active { transition: opacity 180ms ease-in; }
.modal-enter-from   { opacity: 0; }
.modal-leave-to     { opacity: 0; }

/* Persistent shake — tells user "this is required" without jarring them */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%  { transform: translateX(-6px); }
  40%  { transform: translateX(6px); }
  60%  { transform: translateX(-4px); }
  80%  { transform: translateX(4px); }
}
.shake { animation: shake 0.35s var(--ease-crisp) both !important; }
</style>
