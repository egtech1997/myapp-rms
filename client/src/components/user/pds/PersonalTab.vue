<script setup>
import { AppInput, AppSelect, AppRadio, AppCheckbox } from '@/components/ui'

defineOptions({ name: 'PersonalTab' })

const props = defineProps({
  modelValue: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue'])

const religions = [
  'Roman Catholicism', 'Islam', 'Protestantism', 'Iglesia ni Cristo',
  'Philippine Independent Church (Aglipayan Church)', 'Seventh-day Adventist Church',
  'Jehovah’s Witnesses', 'Buddhism', 'Hinduism', 'Judaism', 'Baháʼí Faith', 'Other'
]

const civilStatusOptions = [
  { label: 'Single', value: 'Single' },
  { label: 'Married', value: 'Married' },
  { label: 'Widowed', value: 'Widowed' },
  { label: 'Separated', value: 'Separated' },
  { label: 'Other', value: 'Other' }
]

const sexOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other/LGBTQ+', value: 'LGBTQ+' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' }
]
</script>

<template>
  <div class="flex flex-col gap-10 py-6 animate-fade-in">
    
    <!-- 1. Full Name -->
    <section class="space-y-6">
      <div class="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-2">
         <div class="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
           <i class="pi pi-user text-xs"></i>
         </div>
         <h3 class="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">Legal Full Name</h3>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
        <AppInput v-model="modelValue.name.lastName" label="Surname" placeholder="e.g. DELA CRUZ" />
        <AppInput v-model="modelValue.name.firstName" label="First Name" placeholder="e.g. JUAN" />
        <AppInput v-model="modelValue.name.middleName" label="Middle Name" placeholder="e.g. MERCADO" />
        <AppInput v-model="modelValue.name.suffix" label="Name Suffix" placeholder="e.g. JR., III" />
      </div>
    </section>

    <!-- 2. Demographics -->
    <section class="space-y-6">
      <div class="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-2">
         <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
           <i class="pi pi-id-card text-xs"></i>
         </div>
         <h3 class="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">Demographics & Identity</h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
        <AppInput v-model="modelValue.birthDate" type="date" label="Date of Birth" />
        
        <div class="space-y-2">
          <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] ml-1">Sex</label>
          <div class="flex items-center gap-4 h-9 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--surface-2)]">
            <AppRadio 
              v-model="modelValue.sex" 
              :options="sexOptions" 
              name="user-sex" 
              direction="horizontal"
            />
          </div>
        </div>

        <AppSelect v-model="modelValue.civilStatus" label="Civil Status" :options="civilStatusOptions" />
        <AppSelect v-model="modelValue.religion" label="Religion" :options="religions" />
        <AppInput v-model="modelValue.disability" label="Disability (if any)" placeholder="e.g. Visual Impairment" />
        
        <div class="flex flex-col gap-4">
           <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] ml-1">Special Identities</label>
           <div class="grid grid-cols-2 gap-3">
              <AppCheckbox v-model="modelValue.isIndigenous" label="Indigenous" />
              <AppCheckbox v-model="modelValue.isSoloParent" label="Solo Parent" />
           </div>
        </div>
      </div>
    </section>

    <!-- 3. Government IDs -->
    <section class="space-y-6 bg-[var(--surface-2)] p-6 rounded-2xl border border-[var(--border-main)] shadow-inner">
      <div class="flex items-center gap-3 border-b border-[var(--border-main)] pb-3">
         <div class="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[var(--text-muted)]">
           <i class="pi pi-shield text-xs"></i>
         </div>
         <h3 class="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">Government Issued IDs</h3>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 gap-5">
        <AppInput v-model="modelValue.gsisNo" label="GSIS BP NO." placeholder="—" size="sm" />
        <AppInput v-model="modelValue.pagibigNo" label="PAG-IBIG NO." placeholder="—" size="sm" />
        <AppInput v-model="modelValue.philhealthNo" label="PHILHEALTH NO." placeholder="—" size="sm" />
        <AppInput v-model="modelValue.tinNo" label="TIN NO." placeholder="—" size="sm" />
        <AppInput v-model="modelValue.philSysNo" label="PhilSys NO." placeholder="—" size="sm" />
        <AppInput v-model="modelValue.agencyEmployeeNo" label="Agency Employee NO." placeholder="—" size="sm" />
      </div>
    </section>

    <!-- 4. Contact Information -->
    <section class="space-y-6">
      <div class="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-2">
         <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
           <i class="pi pi-phone text-xs"></i>
         </div>
         <h3 class="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">Contact & Address</h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="space-y-4">
          <AppInput v-model="modelValue.contact.phones[0]" label="Primary Phone" icon="pi-phone" />
          <AppInput v-model="modelValue.contact.emails[0]" label="Primary Email" icon="pi-envelope" />
        </div>
        
        <div class="p-5 rounded-2xl border border-[var(--border-main)] bg-[var(--surface)] flex flex-col gap-4">
           <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Current Residential Address</p>
           <div class="grid grid-cols-2 gap-3">
              <AppInput v-model="modelValue.currentAddress.barangay" label="Barangay" size="sm" />
              <AppInput v-model="modelValue.currentAddress.municipality" label="Municipality" size="sm" />
           </div>
           <div class="grid grid-cols-2 gap-3">
              <AppInput v-model="modelValue.currentAddress.province" label="Province" size="sm" />
              <AppInput v-model="modelValue.currentAddress.zipCode" label="Zip Code" size="sm" />
           </div>
        </div>
      </div>
    </section>

    <!-- 5. COMELEC Address -->
    <section class="space-y-6 bg-[var(--surface-2)] p-6 rounded-2xl border border-[var(--border-main)]">
      <div class="flex items-center gap-3 border-b border-[var(--border-main)] pb-3">
         <div class="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-blue-600">
           <i class="pi pi-map text-xs"></i>
         </div>
         <h3 class="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">COMELEC Registered Address</h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="grid grid-cols-2 gap-3">
           <AppInput v-model="modelValue.comelecAddress.barangay" label="Barangay" size="sm" />
           <AppInput v-model="modelValue.comelecAddress.municipality" label="Municipality" size="sm" />
           <AppInput v-model="modelValue.comelecAddress.province" label="Province" size="sm" />
           <AppInput v-model="modelValue.comelecAddress.zipCode" label="Zip Code" size="sm" />
        </div>
        <div class="flex flex-col justify-center p-4 bg-white rounded-xl border border-[var(--border-main)]">
           <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-2">Voter's Registration / ID Proof</p>
           <div v-if="modelValue.comelecAddress.document" class="flex items-center justify-between">
              <span class="text-xs font-bold text-blue-600">Document Uploaded</span>
              <AppButton size="xs" variant="ghost" @click="$emit('preview', modelValue.comelecAddress.document, 'COMELEC ID')">View</AppButton>
           </div>
           <label v-else class="text-xs font-bold text-[var(--color-primary)] cursor-pointer hover:underline">
              Upload Proof of Registration
              <input type="file" class="hidden" @change="$emit('upload', $event, 'comelecAddress')" />
           </label>
        </div>
      </div>
    </section>

  </div>
</template>
