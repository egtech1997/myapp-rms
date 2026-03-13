<script setup>
import { AppInput, AppButton, AppSelect } from '@/components/ui'

defineOptions({ name: 'EducationTab' })

const props = defineProps({
  modelValue: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue', 'upload', 'preview'])

const levels = [
  { label: 'Elementary', value: 'Elementary' },
  { label: 'Secondary', value: 'Secondary' },
  { label: 'Vocational', value: 'Vocational' },
  { label: 'Bachelor (College)', value: 'Bachelor' },
  { label: 'Masteral', value: 'Masteral' },
  { label: 'Doctorate', value: 'Doctorate' }
]

const statusOptions = [
  { label: 'Graduated', value: 'Graduated' },
  { label: 'CAR (Completed Academic Requirements)', value: 'CAR' },
  { label: 'Units Earned', value: 'Units Earned' },
  { label: 'Associate', value: 'Associate' }
]

const addEntry = () => {
  const newList = [...props.modelValue, {
    level: '', school: '', degree: '', periodFrom: '', periodTo: '',
    status: 'Graduated', unitsEarned: '', yearGraduated: '', honorsReceived: '',
    tor: '', diploma: ''
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
        <h3 class="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">Educational Background</h3>
        <p class="text-xs text-[var(--text-muted)] mt-1">List all schools attended, starting from the most recent.</p>
      </div>
      <AppButton size="sm" icon="pi-plus" @click="addEntry">Add Education</AppButton>
    </div>

    <div v-if="modelValue.length === 0" class="py-20 flex flex-col items-center gap-4 bg-[var(--surface-2)] rounded-3xl border-2 border-dashed border-[var(--border-main)]">
       <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center text-[var(--text-faint)] shadow-sm">
         <i class="pi pi-graduation-cap text-2xl"></i>
       </div>
       <p class="text-sm font-bold text-[var(--text-muted)]">No educational records added yet.</p>
       <AppButton variant="secondary" size="sm" @click="addEntry">Click to add your first record</AppButton>
    </div>

    <div v-else class="space-y-6">
      <div v-for="(edu, i) in modelValue" :key="i" 
        class="bg-white border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-sm hover:border-[var(--border-strong)] transition-all group">
        
        <!-- Entry Header -->
        <div class="px-6 py-3 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold flex items-center justify-center">{{ i + 1 }}</span>
            <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Education Entry</span>
          </div>
          <button @click="removeEntry(i)" class="text-rose-500 hover:text-rose-700 transition-colors">
            <i class="pi pi-trash text-sm"></i>
          </button>
        </div>

        <div class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <AppInput v-model="edu.school" label="Name of School" placeholder="e.g. University of the Philippines" />
          </div>
          <AppSelect v-model="edu.level" label="Level" :options="levels" />

          <AppInput v-model="edu.degree" label="Basic Education / Degree / Course" placeholder="e.g. BS Information Technology" />
          <AppInput v-model="edu.periodFrom" label="Period From" placeholder="Year" />
          <AppInput v-model="edu.periodTo" label="Period To" placeholder="Year / Present" />
          
          <AppSelect v-model="edu.status" label="Current Status" :options="statusOptions" />
          <AppInput v-model="edu.unitsEarned" label="Units Earned (if not graduated)" placeholder="e.g. 36 Units" />
          <AppInput v-model="edu.yearGraduated" label="Year Graduated" />
          <div class="lg:col-span-3">
            <AppInput v-model="edu.honorsReceived" label="Scholarship / Honors Received" placeholder="e.g. Cum Laude" />
          </div>
        </div>

        <!-- Document Attachments -->
        <div class="px-6 py-4 bg-[var(--surface-2)] border-t border-[var(--border-main)] flex flex-wrap gap-4">
          <div v-for="doc in ['tor', 'diploma']" :key="doc" class="flex items-center gap-3 p-2 bg-white rounded-xl border border-[var(--border-main)] shadow-sm">
             <div class="w-8 h-8 rounded-lg bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-muted)]">
               <i class="pi pi-file-pdf"></i>
             </div>
             <div class="flex flex-col">
               <span class="text-[9px] font-black uppercase tracking-widest text-[var(--text-faint)]">{{ doc }}</span>
               <button v-if="edu[doc]" @click="$emit('preview', edu[doc], `${doc.toUpperCase()} - ${edu.school}`)" 
                 class="text-[11px] font-bold text-blue-600 hover:underline text-left">View Uploaded</button>
               <label v-else class="text-[11px] font-bold text-[var(--color-primary)] hover:underline cursor-pointer">
                 Upload Document
                 <input type="file" class="hidden" accept=".pdf,image/*" @change="$emit('upload', $event, i, doc)" />
               </label>
             </div>
             <button v-if="edu[doc]" class="ml-2 text-[var(--text-faint)] hover:text-rose-500 transition-colors">
               <label class="cursor-pointer">
                 <i class="pi pi-sync text-[10px]"></i>
                 <input type="file" class="hidden" accept=".pdf,image/*" @change="$emit('upload', $event, i, doc)" />
               </label>
             </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
