<script setup>
defineOptions({ name: 'AppPageHeader' })

defineProps({
  title:    { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon:     { type: String, default: '' },
  // 'icon' shows a left icon badge; 'actions' slot for right-side buttons
})
</script>

<template>
  <div class="flex items-start justify-between gap-4 mb-6">
    <div class="flex items-center gap-3.5 min-w-0">
      <div v-if="icon"
        class="w-10 h-10 rounded-[var(--radius-xl)] bg-[var(--color-primary-light)] text-[var(--color-primary)]
               flex items-center justify-center shrink-0 shadow-sm">
        <i :class="['pi text-[15px]', icon]" aria-hidden="true"></i>
      </div>
      <div class="min-w-0">
        <h1 class="text-xl font-bold text-[var(--text-main)] tracking-tight leading-snug truncate">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="text-sm text-[var(--text-muted)] mt-0.5 leading-snug">
          {{ subtitle }}
        </p>
      </div>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0 pt-0.5">
      <slot name="actions" />
    </div>
  </div>
</template>
