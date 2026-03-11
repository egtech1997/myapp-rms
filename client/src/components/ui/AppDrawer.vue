<script setup>
defineOptions({ name: 'AppDrawer' })

const props = defineProps({
  show: Boolean,
  title: String,
  subtitle: String,
  size: { type: String, default: 'md' } // sm | md | lg | xl
})

const emit = defineEmits(['close'])

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="show" class="fixed inset-0 z-[300] flex justify-end">
        
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-[var(--surface-overlay)] backdrop-blur-sm transition-opacity" 
             @click="emit('close')"></div>

        <!-- Panel -->
        <div :class="['relative h-full w-full bg-[var(--surface)] shadow-2xl flex flex-col transform transition-transform duration-300 ease-[var(--ease-out-quart)]', sizeClasses[size]]">
          
            <!-- Header -->
          <div class="flex items-center gap-0 border-b border-[var(--border-main)] shrink-0 sticky top-0 z-10 bg-[var(--surface)]">
            <!-- Left accent strip -->
            <div class="w-1 self-stretch bg-[var(--color-primary)] rounded-none flex-shrink-0"></div>
            <div class="flex-1 flex items-center justify-between px-6 py-4">
              <div>
                <h3 class="text-base font-bold text-[var(--text-main)] tracking-tight">{{ title }}</h3>
                <p v-if="subtitle" class="text-xs text-[var(--text-muted)] mt-0.5">{{ subtitle }}</p>
              </div>
              <button @click="emit('close')"
                class="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)] transition-colors ml-4">
                <i class="pi pi-times text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto custom-scrollbar p-6">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--surface)] sticky bottom-0 z-10 flex justify-end gap-3">
            <slot name="footer" />
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active .absolute,
.drawer-leave-active .absolute { transition: opacity 0.3s ease; }
.drawer-enter-from .absolute,
.drawer-leave-to .absolute { opacity: 0; }

.drawer-enter-active > div:last-child { transition: transform 0.3s var(--ease-out-quart); }
.drawer-leave-active > div:last-child { transition: transform 0.25s var(--ease-in); }
.drawer-enter-from > div:last-child { transform: translateX(100%); }
.drawer-leave-to > div:last-child { transform: translateX(100%); }
</style>
