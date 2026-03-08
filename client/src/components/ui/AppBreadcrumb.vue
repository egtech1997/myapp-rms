<script setup>
defineOptions({ name: 'AppBreadcrumb' })

const props = defineProps({
  items:     { type: Array, required: true },  // [{ label, to?, icon? }]
  separator: { type: String, default: 'chevron' }, // 'chevron' | 'slash' | 'dot'
})
</script>

<template>
  <nav aria-label="Breadcrumb">
    <ol class="flex items-center gap-1 flex-wrap" role="list">
      <li
        v-for="(item, idx) in items"
        :key="idx"
        class="flex items-center gap-1">

        <!-- Separator (not before first item) -->
        <span v-if="idx > 0" aria-hidden="true" class="text-[var(--text-faint)] flex items-center">
          <i v-if="separator === 'chevron'" class="pi pi-chevron-right text-[9px]"></i>
          <span v-else-if="separator === 'slash'" class="text-sm font-light">/</span>
          <span v-else class="w-1 h-1 rounded-full bg-[var(--text-faint)] mx-0.5"></span>
        </span>

        <!-- Last item (current page) -->
        <span
          v-if="idx === items.length - 1"
          class="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-main)] max-w-[200px] truncate"
          :aria-current="'page'">
          <i v-if="item.icon" :class="['pi text-xs text-[var(--text-muted)]', item.icon]" aria-hidden="true"></i>
          {{ item.label }}
        </span>

        <!-- Link items -->
        <router-link
          v-else
          :to="item.to || '#'"
          class="flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)]
                 hover:text-[var(--text-main)] transition-colors max-w-[180px] truncate">
          <i v-if="item.icon" :class="['pi text-xs', item.icon]" aria-hidden="true"></i>
          {{ item.label }}
        </router-link>
      </li>
    </ol>
  </nav>
</template>
