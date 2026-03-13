<script setup>
import { AppInput, AppSelect, AppButton } from '@/components/ui'
import { ELIGIBILITY_GROUPS } from '@/utils/eligibilityOptions'

defineOptions({ name: 'EligibilityTab' })

const props = defineProps({
  modelValue: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue', 'upload', 'preview'])

// Flatten eligibility options for easy lookup
const eligibilityOptions = Object.values(ELIGIBILITY_GROUPS).flat()

const addEntry = () => {
  const newList = [...props.modelValue, {
    type: '', name: '', rating: '', dateOfExam: '', placeOfExam: '', licenseNumber: '', licenseValidity: '', document: ''
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
        <h3 class="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">Eligibility / Civil Service</h3>
        <p class="text-xs text-[var(--text-muted)] mt-1">Include CSC, PRC, and other professional board exams.</p>
      </div>
      <AppButton size="sm" icon="pi-plus" @click="addEntry">Add Eligibility</AppButton>
    </div>

    <div v-if="modelValue.length === 0" class="py-20 flex flex-col items-center gap-4 bg-[var(--surface-2)] rounded-3xl border-2 border-dashed border-[var(--border-main)]">
       <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center text-[var(--text-faint)] shadow-sm">
         <i class="pi pi-verified text-2xl"></i>
       </div>
       <p class="text-sm font-bold text-[var(--text-muted)]">No eligibility records added.</p>
       <AppButton variant="secondary" size="sm" @click="addEntry">Add your first license or exam result</AppButton>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div v-for="(item, i) in modelValue" :key="i" 
        class="bg-white border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
        
        <div class="px-6 py-3 bg-[var(--surface-2)] border-b border-[var(--border-main)] flex items-center justify-between">
           <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Record #{{ i + 1 }}</span>
           <button @click="removeEntry(i)" class="text-[var(--text-faint)] hover:text-rose-500 transition-colors">
              <i class="pi pi-trash text-sm"></i>
           </button>
        </div>

        <div class="p-6 space-y-5 flex-1">
           <AppSelect v-model="item.type" label="Eligibility Type" :options="eligibilityOptions" />
           <AppInput v-model="item.name" label="Specific Title of Eligibility" placeholder="e.g. LET - Secondary Education" />
           
           <div class="grid grid-cols-2 gap-4">
              <AppInput v-model="item.rating" label="Rating (%)" size="sm" />
              <AppInput v-model="item.dateOfExam" type="date" label="Date of Exam" size="sm" />
           </div>

           <AppInput v-model="item.placeOfExam" label="Place of Exam" size="sm" />

           <div class="grid grid-cols-2 gap-4">
              <AppInput v-model="item.licenseNumber" label="License No. (if app.)" size="sm" />
              <AppInput v-model="item.licenseValidity" type="date" label="Validity Date" size="sm" />
           </div>
        </div>

        <!-- Doc Footer -->
        <div class="px-6 py-4 bg-[var(--bg-app)] border-t border-[var(--border-main)] flex items-center justify-between">
           <div v-if="item.document" class="flex items-center gap-2">
              <i class="pi pi-file-pdf text-blue-600"></i>
              <button @click="$emit('preview', item.document, item.name)" class="text-xs font-bold text-blue-600 hover:underline">View Certificate</button>
           </div>
           <p v-else class="text-[10px] font-bold text-amber-600 flex items-center gap-1">
              <i class="pi pi-exclamation-triangle"></i> Missing Proof
           </p>

           <label class="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] hover:underline cursor-pointer">
              {{ item.document ? 'Change' : 'Upload Proof' }}
              <input type="file" class="hidden" accept=".pdf,image/*" @change="$emit('upload', $event, i)" />
           </label>
        </div>
      </div>
    </div>

  </div>
</template>
