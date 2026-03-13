<script setup>
import { AppInput, AppButton, AppSelect } from '@/components/ui'

defineOptions({ name: 'TrainingTab' })

const props = defineProps({
  modelValue: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue', 'upload', 'preview'])

const ldOptions = [
  { label: 'Technical', value: 'Technical' },
  { label: 'Managerial', value: 'Managerial' },
  { label: 'Supervisory', value: 'Supervisory' },
  { label: 'Academic', value: 'Academic' },
  { label: 'Foundation', value: 'Foundation' },
  { label: 'Other', value: 'Other' }
]

const addEntry = () => {
  const newList = [...props.modelValue, {
    title: '', dateIssued: '', hours: '', typeOfLD: 'Technical', provider: '', document: ''
  }]
  emit('update:modelValue', newList)
}

const removeEntry = (index) => {
  const newList = [...props.modelValue]
  newList.splice(index, 1)
  emit('update:modelValue', newList)
}
</script>

<template>
  <div class="flex flex-col gap-8 py-6 animate-fade-in">
    
    <div class="flex items-center justify-between border-b border-[var(--border-main)] pb-4">
      <div>
        <h3 class="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">Learning & Development</h3>
        <p class="text-xs text-[var(--text-muted)] mt-1">List all relevant training and seminars attended.</p>
      </div>
      <AppButton size="sm" icon="pi-plus" @click="addEntry">Add Training</AppButton>
    </div>

    <div v-if="modelValue.length === 0" class="py-20 flex flex-col items-center gap-4 bg-[var(--surface-2)] rounded-3xl border-2 border-dashed border-[var(--border-main)]">
       <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center text-[var(--text-faint)] shadow-sm">
         <i class="pi pi-book text-2xl"></i>
       </div>
       <p class="text-sm font-bold text-[var(--text-muted)]">No training records added yet.</p>
       <AppButton variant="secondary" size="sm" @click="addEntry">Click to add a training/seminar</AppButton>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="(item, i) in modelValue" :key="i" 
        class="bg-white border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-sm hover:border-[var(--border-strong)] transition-all flex flex-col group">
        
        <div class="px-6 py-3 bg-[var(--surface-2)] border-b border-[var(--border-main)] flex items-center justify-between">
           <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Record #{{ i + 1 }}</span>
           <button @click="removeEntry(i)" class="text-[var(--text-faint)] hover:text-rose-500 transition-colors">
              <i class="pi pi-trash text-sm"></i>
           </button>
        </div>

        <div class="p-6 space-y-5 flex-1">
           <AppInput v-model="item.title" label="Title of Training / Seminar" placeholder="e.g. Strategic Planning Workshop" />
           <AppInput v-model="item.provider" label="Conducted / Sponsored By" placeholder="e.g. CSC, DepEd" />
           
           <div class="grid grid-cols-2 gap-4">
              <AppInput v-model="item.dateIssued" type="date" label="Date Issued" size="sm" />
              <AppInput v-model="item.hours" type="number" label="Number of Hours" size="sm" />
           </div>

           <AppSelect v-model="item.typeOfLD" label="Type of L&D" :options="ldOptions" size="sm" />
        </div>

        <div class="px-6 py-4 bg-[var(--bg-app)] border-t border-[var(--border-main)] flex items-center justify-between">
           <div v-if="item.document" class="flex items-center gap-2">
              <i class="pi pi-file-pdf text-blue-600"></i>
              <button @click="$emit('preview', item.document, item.title)" class="text-xs font-bold text-blue-600 hover:underline">View Certificate</button>
           </div>
           <p v-else class="text-[10px] font-bold text-amber-600 flex items-center gap-1.5">
              <i class="pi pi-exclamation-triangle"></i> Attachment missing
           </p>

           <label class="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] hover:underline cursor-pointer">
              {{ item.document ? 'Update' : 'Upload' }}
              <input type="file" class="hidden" accept=".pdf,image/*" @change="$emit('upload', $event, i)" />
           </label>
        </div>
      </div>
    </div>

  </div>
</template>
