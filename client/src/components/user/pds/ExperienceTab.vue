<script setup>
import { AppInput, AppButton, AppSelect } from '@/components/ui'

defineOptions({ name: 'ExperienceTab' })

const props = defineProps({
  modelValue: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue', 'upload', 'preview'])

const statusOptions = [
  { label: 'Permanent', value: 'Permanent' },
  { label: 'Temporary', value: 'Temporary' },
  { label: 'Coterminous', value: 'Coterminous' },
  { label: 'Contractual', value: 'Contractual' },
  { label: 'Casual', value: 'Casual' },
  { label: 'Job Order', value: 'Job Order' }
]

const serviceTypeOptions = [
  { label: 'Government', value: 'Government' },
  { label: 'Private', value: 'Private' },
  { label: 'Self-Employed', value: 'Self-Employed' }
]

const addEntry = () => {
  const newList = [...props.modelValue, {
    position: '', company: '', monthlySalary: '', salaryGrade: '', statusOfAppointment: 'Permanent', periodFrom: '', periodTo: '', serviceType: 'Private', document: ''
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
        <h3 class="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">Work Experience</h3>
        <p class="text-xs text-[var(--text-muted)] mt-1">Include all relevant full-time and part-time jobs.</p>
      </div>
      <AppButton size="sm" icon="pi-plus" @click="addEntry">Add Experience</AppButton>
    </div>

    <div v-if="modelValue.length === 0" class="py-20 flex flex-col items-center gap-4 bg-[var(--surface-2)] rounded-3xl border-2 border-dashed border-[var(--border-main)]">
       <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center text-[var(--text-faint)] shadow-sm">
         <i class="pi pi-briefcase text-2xl"></i>
       </div>
       <p class="text-sm font-bold text-[var(--text-muted)]">No work experience records added.</p>
       <AppButton variant="secondary" size="sm" @click="addEntry">Add your previous employment</AppButton>
    </div>

    <div v-else class="space-y-6">
      <div v-for="(item, i) in modelValue" :key="i" 
        class="bg-white border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-sm flex flex-col group">
        
        <div class="px-6 py-3 bg-[var(--surface-2)] border-b border-[var(--border-main)] flex items-center justify-between">
           <div class="flex items-center gap-3">
              <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Record #{{ i + 1 }}</span>
              <span v-if="item.serviceType === 'Government'" class="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">Government Service</span>
           </div>
           <button @click="removeEntry(i)" class="text-[var(--text-faint)] hover:text-rose-500 transition-colors">
              <i class="pi pi-trash text-sm"></i>
           </button>
        </div>

        <div class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <div class="md:col-span-2">
              <AppInput v-model="item.position" label="Position Title" placeholder="e.g. Administrative Officer V" />
           </div>
           <div class="md:col-span-2">
              <AppInput v-model="item.company" label="Department / Agency / Office" placeholder="e.g. Department of Education" />
           </div>

           <div class="grid grid-cols-2 gap-3 col-span-1 lg:col-span-2">
              <AppInput v-model="item.periodFrom" type="date" label="From" size="sm" />
              <AppInput v-model="item.periodTo" type="date" label="To" size="sm" />
           </div>

           <AppInput v-model="item.monthlySalary" label="Monthly Salary" placeholder="0.00" size="sm" />
           <AppInput v-model="item.salaryGrade" label="Salary Grade (Step)" placeholder="e.g. 11-1" size="sm" />

           <div class="lg:col-span-2">
              <AppSelect v-model="item.statusOfAppointment" label="Status of Appointment" :options="statusOptions" />
           </div>

           <div class="lg:col-span-2">
              <AppSelect v-model="item.serviceType" label="Service Type" :options="serviceTypeOptions" />
           </div>
        </div>

        <!-- Footer for Documents -->
        <div class="px-6 py-4 bg-[var(--bg-app)] border-t border-[var(--border-main)] flex items-center justify-between">
           <div v-if="item.document" class="flex items-center gap-3">
              <i class="pi pi-file-pdf text-blue-600"></i>
              <button @click="$emit('preview', item.document, `COE - ${item.position}`)" class="text-xs font-bold text-blue-600 hover:underline">View COE / Service Record</button>
           </div>
           <p v-else class="text-[10px] font-bold text-amber-600 flex items-center gap-1.5">
              <i class="pi pi-exclamation-triangle"></i> Attachment missing
           </p>

           <label class="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] hover:underline cursor-pointer">
              {{ item.document ? 'Update Proof' : 'Upload Proof' }}
              <input type="file" class="hidden" accept=".pdf,image/*" @change="$emit('upload', $event, i)" />
           </label>
        </div>
      </div>
    </div>

  </div>
</template>
