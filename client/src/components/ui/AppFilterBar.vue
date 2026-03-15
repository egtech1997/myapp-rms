<script setup>
import { ref, computed, useSlots } from 'vue'

defineOptions({ name: 'AppFilterBar' })

const props = defineProps({
  search:      { type: String,  default: '' },
  filter:      { type: String,  default: '' },
  filters:     { type: Array,   default: () => [] }, // [{ key, label, icon?, count? }]
  placeholder: { type: String,  default: 'Search...' },
  filterCount: { type: Number,  default: 0 }, // additional active filter count from parent
})

const emit  = defineEmits(['update:search', 'update:filter', 'clear'])
const slots = useSlots()

const filterOpen  = ref(false)
const actionsOpen = ref(false)

const activeCount = computed(() => {
  const firstKey   = props.filters[0]?.key ?? ''
  const pillActive = props.filter && props.filter !== 'all' && props.filter !== firstKey ? 1 : 0
  return pillActive + props.filterCount
})

const toggleFilter  = () => { filterOpen.value  = !filterOpen.value;  actionsOpen.value = false }
const toggleActions = () => { actionsOpen.value = !actionsOpen.value; filterOpen.value  = false }

const selectFilter = (key) => {
  emit('update:filter', key)
  filterOpen.value = false
}

const handleClear = () => {
  emit('update:filter', props.filters[0]?.key ?? '')
  emit('clear')
  filterOpen.value = false
}
</script>

<template>
  <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 flex items-center gap-2">

    <!-- Search -->
    <div class="relative flex-1 min-w-0">
      <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-xs pointer-events-none z-10"></i>
      <input
        :value="search"
        @input="emit('update:search', $event.target.value)"
        :placeholder="placeholder"
        class="w-full h-8 pl-8 pr-3 rounded-lg border border-[var(--border-main)] bg-transparent text-sm text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/25 focus:border-[var(--color-primary)] transition-all"
      />
    </div>

    <div class="h-5 w-px bg-[var(--border-main)] shrink-0"></div>

    <!-- Filter button (funnel) -->
    <div
      v-if="filters.length || slots['filter-extra']"
      class="relative shrink-0"
      v-click-outside="() => filterOpen = false"
    >
      <button
        type="button"
        @click="toggleFilter"
        :class="[
          'relative h-8 w-8 flex items-center justify-center rounded-lg border transition-all duration-150',
          filterOpen || activeCount > 0
            ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)]/40 text-[var(--color-primary)]'
            : 'border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary-light)]'
        ]"
        title="Filters"
      >
        <i class="pi pi-filter text-xs"></i>
        <span
          v-if="activeCount > 0"
          class="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-primary)] text-white text-[9px] font-black flex items-center justify-center leading-none pointer-events-none"
        >{{ activeCount }}</span>
      </button>

      <Transition name="fb-drop">
        <div
          v-if="filterOpen"
          class="absolute top-full right-0 mt-1.5 z-[200] bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-xl min-w-[210px] overflow-hidden"
        >
          <!-- Quick-select pills -->
          <div v-if="filters.length" class="p-2 space-y-0.5">
            <button
              v-for="f in filters" :key="f.key"
              type="button"
              @click="selectFilter(f.key)"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left"
              :class="filter === f.key
                ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold'
                : 'text-[var(--text-sub)] hover:bg-[var(--bg-app)]'"
            >
              <i v-if="f.icon" :class="['pi text-xs', f.icon]"></i>
              <i v-else-if="filter === f.key" class="pi pi-check text-xs opacity-60"></i>
              <span v-else class="w-3.5 shrink-0"></span>
              <span class="flex-1 text-[13px]">{{ f.label }}</span>
              <span
                v-if="f.count !== undefined"
                class="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                :class="filter === f.key
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                  : 'bg-[var(--bg-app)] text-[var(--text-faint)]'"
              >{{ f.count }}</span>
            </button>
          </div>

          <!-- Extra filter content (selects, etc.) -->
          <div
            v-if="slots['filter-extra']"
            :class="filters.length ? 'border-t border-[var(--border-main)]' : ''"
            class="p-3 space-y-3"
          >
            <slot name="filter-extra" />
          </div>

          <!-- Clear button -->
          <div v-if="activeCount > 0" class="border-t border-[var(--border-main)] p-2">
            <button
              type="button"
              @click="handleClear"
              class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-50 transition-colors font-semibold"
            >
              <i class="pi pi-times text-[10px]"></i>
              Clear filters
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Actions button (3-dots) -->
    <div
      v-if="slots.actions"
      class="relative shrink-0"
      v-click-outside="() => actionsOpen = false"
    >
      <button
        type="button"
        @click="toggleActions"
        :class="[
          'h-8 w-8 flex items-center justify-center rounded-lg border transition-all duration-150',
          actionsOpen
            ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)]/40 text-[var(--color-primary)]'
            : 'border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary-light)]'
        ]"
        title="More actions"
      >
        <i class="pi pi-ellipsis-v text-xs"></i>
      </button>

      <Transition name="fb-drop">
        <div
          v-if="actionsOpen"
          class="absolute top-full right-0 mt-1.5 z-[200] bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-xl min-w-[180px] overflow-hidden p-2"
          @click="actionsOpen = false"
        >
          <slot name="actions" />
        </div>
      </Transition>
    </div>

  </div>
</template>

<style scoped>
.fb-drop-enter-active, .fb-drop-leave-active { transition: all 0.15s ease-out; }
.fb-drop-enter-from, .fb-drop-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }
</style>
