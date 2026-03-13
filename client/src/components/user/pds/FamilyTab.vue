<script setup>
import { AppInput, AppButton } from '@/components/ui'

defineOptions({ name: 'FamilyTab' })

const props = defineProps({
  modelValue: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue'])

const addChild = () => {
  const newList = [...props.modelValue.children, { name: '', birthDate: '' }]
  emit('update:modelValue', { ...props.modelValue, children: newList })
}

const removeChild = (index) => {
  const newList = [...props.modelValue.children]
  newList.splice(index, 1)
  emit('update:modelValue', { ...props.modelValue, children: newList })
}
</script>

<template>
  <div class="flex flex-col gap-10 py-6 animate-fade-in">
    
    <!-- 1. Spouse -->
    <section class="space-y-6">
      <div class="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-2">
         <div class="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
           <i class="pi pi-heart text-xs"></i>
         </div>
         <h3 class="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">Spouse's Information</h3>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
        <AppInput v-model="modelValue.spouse.lastName" label="Surname" />
        <AppInput v-model="modelValue.spouse.firstName" label="First Name" />
        <AppInput v-model="modelValue.spouse.middleName" label="Middle Name" />
        <AppInput v-model="modelValue.spouse.suffix" label="Suffix" />
        
        <AppInput v-model="modelValue.spouse.occupation" label="Occupation" />
        <AppInput v-model="modelValue.spouse.employer" label="Employer / Business Name" />
        <AppInput v-model="modelValue.spouse.businessAddress" label="Business Address" />
        <AppInput v-model="modelValue.spouse.phone" label="Telephone No." />
      </div>
    </section>

    <!-- 2. Parents -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
      <!-- Father -->
      <section class="space-y-6">
        <div class="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-2">
           <h3 class="text-[11px] font-black uppercase tracking-widest text-[var(--text-main)]">Father's Name</h3>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="modelValue.father.lastName" label="Surname" size="sm" />
          <AppInput v-model="modelValue.father.firstName" label="First Name" size="sm" />
          <AppInput v-model="modelValue.father.middleName" label="Middle Name" size="sm" />
          <AppInput v-model="modelValue.father.suffix" label="Suffix" size="sm" />
        </div>
      </section>

      <!-- Mother -->
      <section class="space-y-6">
        <div class="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-2">
           <h3 class="text-[11px] font-black uppercase tracking-widest text-[var(--text-main)]">Mother's Maiden Name</h3>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="modelValue.mother.lastName" label="Surname" size="sm" />
          <AppInput v-model="modelValue.mother.firstName" label="First Name" size="sm" />
          <AppInput v-model="modelValue.mother.middleName" label="Middle Name" size="sm" />
          <AppInput v-model="modelValue.mother.suffix" label="Suffix" size="sm" />
        </div>
      </section>
    </div>

    <!-- 3. Children -->
    <section class="space-y-6">
      <div class="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
         <div class="flex items-center gap-3">
           <div class="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
             <i class="pi pi-users text-xs"></i>
           </div>
           <h3 class="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">Children</h3>
         </div>
         <AppButton size="xs" icon="pi-plus" @click="addChild">Add Child</AppButton>
      </div>

      <div v-if="modelValue.children.length === 0" class="p-6 text-center bg-[var(--surface-2)] rounded-xl border border-[var(--border-main)] border-dashed">
         <p class="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest">No children records listed</p>
      </div>
      
      <div v-else class="space-y-3">
         <div v-for="(child, i) in modelValue.children" :key="i" 
           class="flex items-center gap-4 p-3 bg-white border border-[var(--border-main)] rounded-xl shadow-sm">
           <span class="text-[10px] font-black text-[var(--text-faint)]">{{ i + 1 }}</span>
           <div class="flex-1 grid grid-cols-2 gap-4">
              <AppInput v-model="child.name" placeholder="Full Name of Child" size="sm" />
              <AppInput v-model="child.birthDate" type="date" size="sm" />
           </div>
           <button @click="removeChild(i)" class="text-rose-400 hover:text-rose-600 transition-colors">
              <i class="pi pi-times-circle"></i>
           </button>
         </div>
      </div>
    </section>

  </div>
</template>
