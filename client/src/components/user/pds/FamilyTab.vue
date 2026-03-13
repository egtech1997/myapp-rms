<script setup>
import { AppInput } from '@/components/ui'

defineOptions({ name: 'FamilyTab' })

const props = defineProps({
  modelValue: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue'])

const addChild = () => {
  const children = [
    { firstName: '', middleName: '', lastName: '', suffix: '', birthDate: '' },
    ...props.modelValue.children,
  ]
  emit('update:modelValue', { ...props.modelValue, children })
}

const removeChild = (i) => {
  const children = [...props.modelValue.children]
  children.splice(i, 1)
  emit('update:modelValue', { ...props.modelValue, children })
}
</script>

<template>
  <div class="flex flex-col gap-8 animate-fade-in">

    <!-- ── 1. Spouse ────────────────────────────────────── -->
    <div>
      <div class="flex items-center gap-2.5 mb-4 pb-2 border-b border-[var(--border-main)]">
        <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
          <i class="pi pi-heart text-xs text-[var(--color-primary)]"></i>
        </div>
        <div>
          <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Spouse Information</h3>
          <p class="text-[10px] text-[var(--text-muted)] mt-0.5">Leave blank if single, widowed, or separated</p>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <AppInput v-model="modelValue.spouse.lastName"   label="Surname"    />
        <AppInput v-model="modelValue.spouse.firstName"  label="First Name" />
        <AppInput v-model="modelValue.spouse.middleName" label="Middle Name" />
        <AppInput v-model="modelValue.spouse.suffix"     label="Suffix" hint="e.g. JR., III" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AppInput v-model="modelValue.spouse.occupation"       label="Occupation" />
        <AppInput v-model="modelValue.spouse.employer"         label="Employer / Business Name" />
        <AppInput v-model="modelValue.spouse.businessAddress"  label="Business Address" />
        <AppInput v-model="modelValue.spouse.phone"            label="Telephone / Mobile No." />
      </div>
    </div>

    <!-- ── 2. Parents ───────────────────────────────────── -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

      <!-- Father -->
      <div class="border border-[var(--border-main)] rounded-[var(--radius-xl)] overflow-hidden">
        <div class="px-4 py-2.5 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center gap-2">
          <i class="pi pi-user text-xs text-[var(--color-primary)]"></i>
          <h4 class="text-[11px] font-black uppercase tracking-widest text-[var(--text-main)]">Father's Name</h4>
        </div>
        <div class="p-4 grid grid-cols-2 gap-3">
          <AppInput v-model="modelValue.father.lastName"   label="Surname"    size="sm" />
          <AppInput v-model="modelValue.father.firstName"  label="First Name" size="sm" />
          <AppInput v-model="modelValue.father.middleName" label="Middle Name" size="sm" />
          <AppInput v-model="modelValue.father.suffix"     label="Suffix"     size="sm" />
        </div>
      </div>

      <!-- Mother -->
      <div class="border border-[var(--border-main)] rounded-[var(--radius-xl)] overflow-hidden">
        <div class="px-4 py-2.5 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center gap-2">
          <i class="pi pi-user text-xs text-[var(--color-primary)]"></i>
          <h4 class="text-[11px] font-black uppercase tracking-widest text-[var(--text-main)]">Mother's Maiden Name</h4>
        </div>
        <div class="p-4 grid grid-cols-2 gap-3">
          <AppInput v-model="modelValue.mother.lastName"   label="Surname"    size="sm" />
          <AppInput v-model="modelValue.mother.firstName"  label="First Name" size="sm" />
          <AppInput v-model="modelValue.mother.middleName" label="Middle Name" size="sm" />
          <AppInput v-model="modelValue.mother.suffix"     label="Suffix"     size="sm" />
        </div>
      </div>
    </div>

    <!-- ── 3. Children ──────────────────────────────────── -->
    <div>
      <div class="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border-main)]">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
            <i class="pi pi-users text-xs text-[var(--color-primary)]"></i>
          </div>
          <div>
            <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Children</h3>
            <p class="text-[10px] text-[var(--text-muted)] mt-0.5">List all children in chronological order</p>
          </div>
        </div>
        <button @click="addChild" class="btn-primary h-8 px-3 text-xs flex items-center gap-1.5 shrink-0">
          <i class="pi pi-plus text-[9px]"></i> Add Child
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="!modelValue.children.length"
        class="py-12 flex flex-col items-center gap-3 border-2 border-dashed border-[var(--border-main)] rounded-[var(--radius-xl)] bg-[var(--bg-app)]">
        <i class="pi pi-users text-2xl text-[var(--text-faint)]"></i>
        <p class="text-xs text-[var(--text-muted)]">No children records listed</p>
        <button @click="addChild" class="btn-secondary h-8 px-3 text-xs flex items-center gap-1.5">
          <i class="pi pi-plus text-[9px]"></i> Add First Child
        </button>
      </div>

      <!-- Children list -->
      <div v-else class="flex flex-col gap-3">
        <div v-for="(child, i) in modelValue.children" :key="i"
          class="border border-[var(--border-main)] rounded-[var(--radius-xl)] overflow-hidden"
          style="box-shadow:var(--shadow-xs)">

          <!-- Header -->
          <div class="px-4 py-2.5 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-[9px] font-black flex items-center justify-center shrink-0">{{ i + 1 }}</span>
              <span class="text-xs font-bold text-[var(--text-muted)]">
                {{ [child.firstName, child.lastName].filter(Boolean).join(' ') || 'Child Entry' }}
              </span>
            </div>
            <button @click="removeChild(i)"
              class="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-faint)] hover:text-rose-500 hover:bg-rose-50 transition-colors">
              <i class="pi pi-trash text-xs"></i>
            </button>
          </div>

          <!-- Fields -->
          <div class="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <AppInput v-model="child.firstName"  label="First Name"  size="sm" />
            <AppInput v-model="child.middleName" label="Middle Name" size="sm" />
            <AppInput v-model="child.lastName"   label="Surname"     size="sm" />
            <AppInput v-model="child.suffix"     label="Suffix"      size="sm" hint="e.g. JR." />
            <AppInput v-model="child.birthDate"  type="date" label="Date of Birth" size="sm" />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
