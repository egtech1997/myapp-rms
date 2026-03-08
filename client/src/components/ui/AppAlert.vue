<script setup>
import { ref } from 'vue'

defineOptions({ name: 'AppAlert' })

const props = defineProps({
  variant:    { type: String, default: 'info',
    validator: (v) => ['info', 'success', 'warning', 'error'].includes(v) },
  title:      { type: String, default: '' },
  dismissible:{ type: Boolean, default: false },
  icon:       { type: String, default: '' },   // override default icon
  bordered:   { type: Boolean, default: true },
})
const emit = defineEmits(['dismiss'])
const visible = ref(true)

const dismiss = () => { visible.value = false; emit('dismiss') }

const config = {
  info:    { icon: 'pi-info-circle',     bg: 'bg-[var(--color-primary-light)]', border: 'border-[var(--color-primary-200)]', text: 'text-[var(--color-primary-800)]', icon_cls: 'text-[var(--color-primary)]' },
  success: { icon: 'pi-check-circle',   bg: 'bg-[var(--color-success-light)]',  border: 'border-green-200',                 text: 'text-green-800',                   icon_cls: 'text-[var(--color-success)]' },
  warning: { icon: 'pi-exclamation-triangle', bg: 'bg-[var(--color-warning-light)]', border: 'border-amber-200',            text: 'text-amber-800',                   icon_cls: 'text-amber-500' },
  error:   { icon: 'pi-times-circle',   bg: 'bg-[var(--color-danger-light)]',   border: 'border-red-200',                  text: 'text-red-800',                     icon_cls: 'text-[var(--color-danger)]' },
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="visible"
      role="alert"
      :class="[
        'flex items-start gap-3 px-4 py-3.5 rounded-xl text-sm',
        config[variant].bg,
        config[variant].text,
        bordered ? `border ${config[variant].border}` : '',
      ]">

      <!-- Icon -->
      <i :class="['pi shrink-0 text-base mt-px', props.icon || config[variant].icon, config[variant].icon_cls]" aria-hidden="true"></i>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <p v-if="title" class="font-semibold leading-snug mb-0.5">{{ title }}</p>
        <div class="leading-relaxed font-medium opacity-90"><slot /></div>
      </div>

      <!-- Dismiss -->
      <button
        v-if="dismissible"
        type="button"
        class="shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/5 transition-colors"
        aria-label="Dismiss alert"
        @click="dismiss">
        <i class="pi pi-times text-xs" aria-hidden="true"></i>
      </button>
    </div>
  </Transition>
</template>
