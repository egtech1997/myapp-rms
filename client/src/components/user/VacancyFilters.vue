<script setup>
defineOptions({ name: 'VacancyFilters' })

defineProps({
  searchQuery: { type: String, default: '' },
  filterTrack: { type: String, default: '' },
})

const emit = defineEmits(['update:searchQuery', 'update:filterTrack', 'search'])

const tracks = [
  { id: '',                 label: 'All',          icon: 'pi-th-large',    active: 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25' },
  { id: 'teaching',        label: 'Teaching',     icon: 'pi-book',        active: 'bg-blue-600 text-white shadow-lg shadow-blue-200' },
  { id: 'teaching_related',label: 'T-Related',    icon: 'pi-sitemap',     active: 'bg-violet-600 text-white shadow-lg shadow-violet-200' },
  { id: 'non_teaching',    label: 'Non-Teaching', icon: 'pi-briefcase',   active: 'bg-amber-500 text-white shadow-lg shadow-amber-200' },
]
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-3">

    <!-- Search -->
    <div class="relative flex-1 group">
      <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] group-focus-within:text-[var(--color-primary)] transition-colors text-sm pointer-events-none"></i>
      <input
        :value="searchQuery"
        @input="e => { $emit('update:searchQuery', e.target.value); $emit('search') }"
        type="text"
        placeholder="Search position, assignment, item number…"
        class="w-full h-11 pl-10 pr-10 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm font-medium text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all shadow-sm"
      />
      <button v-if="searchQuery"
        @click="$emit('update:searchQuery', ''); $emit('search')"
        class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-main)] transition-colors">
        <i class="pi pi-times text-xs"></i>
      </button>
    </div>

    <!-- Track Tabs -->
    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      <button
        v-for="t in tracks" :key="t.id"
        @click="$emit('update:filterTrack', t.id)"
        :class="[
          'h-11 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 shrink-0',
          filterTrack === t.id
            ? `${t.active} border-transparent`
            : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-[var(--color-primary-ring)] hover:text-[var(--color-primary)] shadow-sm'
        ]">
        <i :class="['pi', t.icon]" style="font-size:11px"></i>
        {{ t.label }}
      </button>
    </div>

  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
