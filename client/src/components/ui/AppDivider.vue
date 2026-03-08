<script setup>
defineOptions({ name: 'AppDivider' })

const props = defineProps({
  label:       { type: String, default: '' },
  orientation: { type: String, default: 'horizontal', validator: (v) => ['horizontal', 'vertical'].includes(v) },
  color:       { type: String, default: 'var(--border-main)' },
  spacing:     { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
})

const spaceClass = { sm: 'my-2', md: 'my-4', lg: 'my-6' }
</script>

<template>
  <!-- Vertical -->
  <div v-if="orientation === 'vertical'"
    class="w-px self-stretch"
    :style="{ backgroundColor: props.color }"
    role="separator"
    aria-orientation="vertical">
  </div>

  <!-- Horizontal with label -->
  <div v-else-if="label"
    :class="['flex items-center gap-4', spaceClass[spacing]]"
    role="separator">
    <div class="flex-1 h-px" :style="{ backgroundColor: props.color }"></div>
    <span class="text-xs font-semibold text-[var(--text-muted)] whitespace-nowrap uppercase tracking-widest">{{ label }}</span>
    <div class="flex-1 h-px" :style="{ backgroundColor: props.color }"></div>
  </div>

  <!-- Plain horizontal -->
  <hr v-else
    :class="['border-0 h-px', spaceClass[spacing]]"
    :style="{ backgroundColor: props.color }"
    role="separator" />
</template>
