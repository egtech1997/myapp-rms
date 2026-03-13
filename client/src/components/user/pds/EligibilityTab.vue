<script setup>
import { AppInput, AppSelect } from '@/components/ui'
import { ELIGIBILITY_GROUPS } from '@/utils/eligibilityOptions'

defineOptions({ name: 'EligibilityTab' })

const props = defineProps({
  modelValue: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue', 'upload', 'preview'])

const addEntry = () => {
  emit('update:modelValue', [
    ...props.modelValue,
    { type: '', name: '', rating: '', dateOfExam: '', placeOfExam: '', licenseNumber: '', licenseValidity: '', document: '' },
  ])
}

const removeEntry = (i) => {
  const list = [...props.modelValue]
  list.splice(i, 1)
  emit('update:modelValue', list)
}
</script>

<template>
  <div class="flex flex-col gap-6">

    <!-- Section header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-black text-[var(--text-main)]">Eligibility &amp; Civil Service</h3>
        <p class="text-xs text-[var(--text-muted)] mt-0.5">Include CSC examinations, PRC board licenses, and other professional eligibilities.</p>
      </div>
      <button @click="addEntry" class="btn-primary h-9 px-4 text-xs flex items-center gap-2 shrink-0">
        <i class="pi pi-plus text-[10px]"></i> Add Eligibility
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="modelValue.length === 0"
      class="py-16 flex flex-col items-center gap-3 border-2 border-dashed border-[var(--border-main)] rounded-[var(--radius-xl)] bg-[var(--bg-app)]">
      <div class="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border-main)] flex items-center justify-center shadow-sm">
        <i class="pi pi-verified text-xl text-[var(--text-faint)]"></i>
      </div>
      <div class="text-center">
        <p class="text-sm font-bold text-[var(--text-main)]">No eligibility records yet</p>
        <p class="text-xs text-[var(--text-muted)] mt-1">Add your CSC exam results, PRC licenses, or other eligibilities.</p>
      </div>
      <button @click="addEntry" class="btn-secondary h-9 px-4 text-xs flex items-center gap-2">
        <i class="pi pi-plus text-[10px]"></i> Add First Record
      </button>
    </div>

    <!-- Entries -->
    <div v-else class="flex flex-col gap-5">
      <div
        v-for="(item, i) in modelValue" :key="i"
        class="border border-[var(--border-main)] rounded-[var(--radius-xl)] overflow-hidden"
        style="box-shadow:var(--shadow-xs)">

        <!-- Entry header -->
        <div class="px-5 py-3 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-black flex items-center justify-center shrink-0">{{ i + 1 }}</span>
            <span class="text-xs font-bold text-[var(--text-muted)]">
              {{ item.name || item.type || 'Eligibility Entry' }}
            </span>
          </div>
          <button @click="removeEntry(i)"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-faint)] hover:text-rose-500 hover:bg-rose-50 transition-colors">
            <i class="pi pi-trash text-xs"></i>
          </button>
        </div>

        <!-- Fields -->
        <div class="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <!-- Eligibility type — grouped select -->
          <div class="sm:col-span-2 lg:col-span-1">
            <AppSelect
              v-model="item.type"
              label="Eligibility Category"
              :options="Object.entries(ELIGIBILITY_GROUPS).map(([label, opts]) => ({ label, options: opts }))"
              :grouped="true" />
          </div>

          <!-- Name -->
          <div class="sm:col-span-2">
            <AppInput v-model="item.name" label="Specific Title of Eligibility / License"
              hint="e.g. LET — Secondary (Major in English), RN, CPA" />
          </div>

          <!-- Rating -->
          <div>
            <AppInput v-model="item.rating" label="Rating (%)"
              hint="e.g. 82.25 — leave blank if not applicable" />
          </div>

          <!-- Date of Exam -->
          <div>
            <AppInput v-model="item.dateOfExam" type="date" label="Date of Exam / Date Issued" />
          </div>

          <!-- Place of Exam -->
          <div>
            <AppInput v-model="item.placeOfExam" label="Place of Examination"
              hint="e.g. Dumaguete City, Negros Oriental" />
          </div>

          <!-- License Number -->
          <div>
            <AppInput v-model="item.licenseNumber" label="License / Certificate No."
              hint="Leave blank for CSC exams" />
          </div>

          <!-- License Validity -->
          <div>
            <AppInput v-model="item.licenseValidity" type="date" label="License Validity / Expiry" />
          </div>
        </div>

        <!-- Document attachment -->
        <div class="px-5 py-3.5 bg-[var(--bg-app)] border-t border-[var(--border-main)]">
          <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-2">Supporting Document</p>
          <div class="flex items-center gap-3 px-3 py-2.5 bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border-main)]">
            <div class="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
              <i class="pi pi-file-pdf text-sm text-[var(--color-primary)]"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] font-bold text-[var(--text-muted)]">Rating Certificate / License / Board Result</p>
              <button v-if="item.document"
                @click="$emit('preview', item.document, item.name || 'Eligibility Document')"
                class="text-[11px] font-bold text-[var(--color-primary)] hover:underline">
                View uploaded
              </button>
              <label v-else class="text-[11px] font-bold text-[var(--color-primary)] hover:underline cursor-pointer">
                Upload
                <input type="file" class="sr-only" accept=".pdf,image/*"
                  @change="$emit('upload', $event, i)" />
              </label>
            </div>
            <label v-if="item.document"
              class="w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-faint)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors cursor-pointer"
              title="Replace file">
              <i class="pi pi-sync text-[10px]"></i>
              <input type="file" class="sr-only" accept=".pdf,image/*"
                @change="$emit('upload', $event, i)" />
            </label>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
