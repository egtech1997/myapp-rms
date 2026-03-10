<script setup>
defineOptions({ name: 'AppDataTable' })

const props = defineProps({
  columns: { type: Array, required: true }, // ['Rank', 'Applicant', ...]
  rows:    { type: Array, required: true },
})
</script>

<template>
  <div class="flex-1 overflow-hidden flex flex-col bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-sm">
    <!-- Header -->
    <div class="grid grid-cols-12 px-6 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)] text-[10px] font-black uppercase text-[var(--text-faint)] tracking-widest flex-shrink-0">
      <div v-for="(col, i) in columns" :key="i" 
        :class="[
          i === 0 ? 'col-span-1' : i === 1 ? 'col-span-5' : 'col-span-2 text-center'
        ]">
        {{ col }}
      </div>
      <div class="col-span-2 text-right">Action</div>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--border-main)]">
      <div v-for="(row, i) in rows" :key="i" class="grid grid-cols-12 px-6 py-4 items-center hover:bg-[var(--bg-app)] transition-colors group">
        <slot :item="row" :index="i" />
      </div>
    </div>
  </div>
</template>
