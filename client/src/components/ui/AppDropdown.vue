<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

defineOptions({ name: 'AppDropdown' })

const props = defineProps({
  items:    { type: Array, default: () => [] },
  align:    { type: String, default: 'right', validator: (v) => ['left', 'right'].includes(v) },
  width:    { type: String, default: '180px' },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['select'])

const open = ref(false)
const containerRef = ref(null)

const toggle = () => { if (!props.disabled) open.value = !open.value }
const close  = () => { open.value = false }

const handleItem = (item) => {
  if (item.disabled || item.type === 'divider') return
  item.action?.()
  emit('select', item)
  close()
}

// Close on click outside
const onClickOutside = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) close()
}
// Close on Escape
const onKeyDown = (e) => { if (e.key === 'Escape') close() }

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
  document.addEventListener('keydown', onKeyDown)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
  document.removeEventListener('keydown', onKeyDown)
})

const alignClass = computed(() => props.align === 'right' ? 'right-0' : 'left-0')
</script>

<template>
  <div ref="containerRef" class="relative inline-block">
    <!-- Trigger -->
    <div @click="toggle" class="cursor-pointer">
      <slot name="trigger">
        <button
          type="button"
          class="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-muted)]
                 hover:bg-[var(--surface-2)] hover:text-[var(--text-main)] transition-colors"
          :aria-expanded="open"
          :aria-haspopup="true"
          aria-label="Open menu">
          <i class="pi pi-ellipsis-v text-sm" aria-hidden="true"></i>
        </button>
      </slot>
    </div>

    <!-- Menu -->
    <Transition name="dropdown">
      <div
        v-if="open"
        role="menu"
        :style="{ width: props.width }"
        :class="[
          'absolute top-full mt-1.5 z-[100] bg-[var(--surface)] border border-[var(--border-main)]',
          'rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] overflow-hidden py-1',
          alignClass,
        ]">
        <template v-for="(item, idx) in items" :key="idx">
          <!-- Divider -->
          <div v-if="item.type === 'divider'" class="h-px bg-[var(--border-main)] my-1 mx-2"></div>

          <!-- Item -->
          <button
            v-else
            type="button"
            role="menuitem"
            :disabled="item.disabled"
            :class="[
              'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors text-left',
              item.disabled
                ? 'opacity-40 cursor-not-allowed text-[var(--text-muted)]'
                : item.danger
                  ? 'text-[var(--color-danger)] hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-[var(--text-sub)] hover:bg-[var(--surface-2)] hover:text-[var(--text-main)]',
            ]"
            @click="handleItem(item)">
            <i v-if="item.icon" :class="[
              'pi text-sm shrink-0',
              item.icon,
              item.danger ? 'text-[var(--color-danger)]' : 'text-[var(--text-muted)]',
            ]" aria-hidden="true"></i>
            <span class="flex-1 truncate">{{ item.label }}</span>
            <span v-if="item.badge" class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface-2)]">{{ item.badge }}</span>
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>
