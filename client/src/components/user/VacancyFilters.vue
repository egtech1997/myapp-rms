<script setup>
defineOptions({ name: 'VacancyFilters' })

const props = defineProps({
  searchQuery: { type: String, default: '' },
  filterTrack: { type: String, default: '' },
})

const emit = defineEmits(['update:searchQuery', 'update:filterTrack', 'search'])

const tracks = [
  { id: '', label: 'All Positions', color: 'bg-[var(--color-primary)]', hover: 'hover:border-[var(--color-primary-ring)]' },
  { id: 'teaching', label: 'Teaching', color: 'bg-[var(--color-primary)]', hover: 'hover:border-[var(--color-primary-ring)]' },
  { id: 'teaching_related', label: 'T-Related', color: 'bg-purple-600', hover: 'hover:border-purple-300' },
  { id: 'non_teaching', label: 'Non-Teaching', color: 'bg-amber-500', hover: 'hover:border-amber-300' },
]
</script>

<template>
  <div class="bg-white border border-[var(--border-main)] rounded-2xl p-4 flex flex-col sm:flex-row gap-4 shadow-sm">
    <!-- Search -->
    <div class="relative flex-1 group">
      <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] group-focus-within:text-[var(--color-primary)] transition-colors"></i>
      <input 
        :value="searchQuery" 
        @input="e => { $emit('update:searchQuery', e.target.value); $emit('search') }"
        type="text" 
        placeholder="Search position titles, assignment or item numbers..."
        class="w-full h-12 pl-11 pr-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-medium focus:bg-white focus:ring-4 focus:ring-[var(--color-primary-ring)]/10 focus:border-[var(--color-primary)] transition-all outline-none" 
      />
    </div>

    <!-- Track Tabs -->
    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
      <button 
        v-for="t in tracks" :key="t.id"
        @click="$emit('update:filterTrack', t.id)"
        :class="[
          'h-12 px-5 rounded-xl border text-[10px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap',
          filterTrack === t.id 
            ? `${t.color} text-white border-transparent shadow-lg shadow-black/10` 
            : `bg-[var(--bg-app)] text-[var(--text-muted)] border-[var(--border-main)] ${t.hover}`
        ]">
        {{ t.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
