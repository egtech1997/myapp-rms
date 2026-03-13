<script setup>
import { AppInput, AppButton } from '@/components/ui'

defineOptions({ name: 'OthersTab' })

const props = defineProps({
  modelValue: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue'])

const addListItem = (field) => {
  const newList = [...(props.modelValue[field] || []), '']
  emit('update:modelValue', { ...props.modelValue, [field]: newList })
}

const removeListItem = (field, index) => {
  const newList = [...(props.modelValue[field] || [])]
  newList.splice(index, 1)
  emit('update:modelValue', { ...props.modelValue, [field]: newList })
}

const addVoluntary = () => {
  const newList = [...(props.modelValue.voluntaryWork || []), { organization: '', periodFrom: '', periodTo: '', hours: '', position: '' }]
  emit('update:modelValue', { ...props.modelValue, voluntaryWork: newList })
}

const removeVoluntary = (index) => {
  const newList = [...(props.modelValue.voluntaryWork || [])]
  newList.splice(index, 1)
  emit('update:modelValue', { ...props.modelValue, voluntaryWork: newList })
}

const sections = [
  { id: 'skills', field: 'specialSkills', label: 'Special Skills & Hobbies', icon: 'pi-star' },
  { id: 'distinctions', field: 'nonAcademicDistinctions', label: 'Distinctions / Recognition', icon: 'pi-award' },
  { id: 'memberships', field: 'memberships', label: 'Memberships in Associations', icon: 'pi-users' }
]
</script>

<template>
  <div class="flex flex-col gap-12 py-6 animate-fade-in">
    
    <!-- 1. Voluntary Work -->
    <section class="space-y-6">
      <div class="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
         <div class="flex items-center gap-3">
           <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
             <i class="pi pi-heart-fill text-xs"></i>
           </div>
           <h3 class="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">Voluntary Work</h3>
         </div>
         <AppButton size="xs" variant="ghost" icon="pi-plus" @click="addVoluntary">Add Voluntary Work</AppButton>
      </div>

      <div v-if="!(modelValue.voluntaryWork?.length)" class="p-6 text-center bg-[var(--surface-2)] rounded-xl border border-[var(--border-main)] border-dashed">
         <p class="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest">No voluntary work listed</p>
      </div>

      <div v-else class="space-y-4">
         <div v-for="(v, i) in modelValue.voluntaryWork" :key="i" class="p-5 bg-white border border-[var(--border-main)] rounded-2xl relative group shadow-sm">
            <button @click="removeVoluntary(i)" class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-10">
               <i class="pi pi-times text-[10px]"></i>
            </button>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
               <AppInput v-model="v.organization" label="Organization Name" size="sm" />
               <AppInput v-model="v.position" label="Position / Nature of Work" size="sm" />
               <div class="grid grid-cols-2 gap-3">
                  <AppInput v-model="v.periodFrom" type="date" label="From" size="sm" />
                  <AppInput v-model="v.periodTo" type="date" label="To" size="sm" />
               </div>
               <AppInput v-model="v.hours" type="number" label="Number of Hours" size="sm" />
            </div>
         </div>
      </div>
    </section>

    <!-- 2. Other Info (Skills, Distinctions, Memberships) -->
    <div v-for="section in sections" :key="section.id" class="space-y-6">
      <div class="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
         <div class="flex items-center gap-3">
           <div class="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)]">
             <i :class="['pi text-xs', section.icon]"></i>
           </div>
           <h3 class="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">{{ section.label }}</h3>
         </div>
         <AppButton size="xs" variant="ghost" icon="pi-plus" @click="addListItem(section.field)">Add Row</AppButton>
      </div>

      <div v-if="!(modelValue[section.field]?.length)" class="p-4 text-center bg-[var(--surface-2)] rounded-xl border border-[var(--border-main)] border-dashed">
         <p class="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest">No records listed</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div v-for="(item, i) in modelValue[section.field]" :key="i" class="relative">
            <AppInput 
              :modelValue="item"
              @update:modelValue="v => {
                const newList = [...modelValue[section.field]];
                newList[i] = v;
                $emit('update:modelValue', { ...modelValue, [section.field]: newList })
              }"
              :label="`${section.label.split(' ')[0]} #${i+1}`"
              size="sm"
              class="pr-10"
            />
            <button @click="removeListItem(section.field, i)" 
              class="absolute right-3 top-1/2 -translate-y-1/2 text-rose-300 hover:text-rose-500 transition-all p-2">
              <i class="pi pi-trash text-xs"></i>
            </button>
         </div>
      </div>
    </div>

  </div>
</template>
