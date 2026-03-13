<script setup>
import { AppInput, AppSelect } from '@/components/ui'

defineOptions({ name: 'TrainingTab' })

const props = defineProps({
  modelValue: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue', 'upload', 'preview'])

const ldTypeOptions = [
  { label: 'Technical',   value: 'Technical'   },
  { label: 'Managerial',  value: 'Managerial'  },
  { label: 'Supervisory', value: 'Supervisory' },
  { label: 'Academic',    value: 'Academic'    },
  { label: 'Foundation',  value: 'Foundation'  },
  { label: 'Other',       value: 'Other'       },
]

const addEntry = () => {
  emit('update:modelValue', [
    ...props.modelValue,
    { title: '', dateIssued: '', hours: '', typeOfLD: 'Technical', provider: '', document: '' },
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
        <h3 class="text-sm font-black text-[var(--text-main)]">Learning &amp; Development (Training)</h3>
        <p class="text-xs text-[var(--text-muted)] mt-0.5">List all relevant training, seminars, and workshops attended. Most recent first.</p>
      </div>
      <button @click="addEntry" class="btn-primary h-9 px-4 text-xs flex items-center gap-2 shrink-0">
        <i class="pi pi-plus text-[10px]"></i> Add Training
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="modelValue.length === 0"
      class="py-16 flex flex-col items-center gap-3 border-2 border-dashed border-[var(--border-main)] rounded-[var(--radius-xl)] bg-[var(--bg-app)]">
      <div class="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border-main)] flex items-center justify-center shadow-sm">
        <i class="pi pi-book text-xl text-[var(--text-faint)]"></i>
      </div>
      <div class="text-center">
        <p class="text-sm font-bold text-[var(--text-main)]">No training records yet</p>
        <p class="text-xs text-[var(--text-muted)] mt-1">Add seminars, workshops, and L&amp;D programs attended.</p>
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
              {{ item.title || 'Training Entry' }}
              <span v-if="item.typeOfLD" class="font-normal"> — {{ item.typeOfLD }}</span>
            </span>
          </div>
          <button @click="removeEntry(i)"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-faint)] hover:text-rose-500 hover:bg-rose-50 transition-colors">
            <i class="pi pi-trash text-xs"></i>
          </button>
        </div>

        <!-- Fields -->
        <div class="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <!-- Title -->
          <div class="sm:col-span-2 lg:col-span-3">
            <AppInput v-model="item.title" label="Title of Training / Seminar / Workshop"
              hint="e.g. School-Based Training on Classroom Management (STAR)" />
          </div>

          <!-- Provider -->
          <div class="sm:col-span-2">
            <AppInput v-model="item.provider" label="Conducted / Sponsored By"
              hint="e.g. DepEd SDO Guihulngan City, CSC, TESDA, PhilIRI" />
          </div>

          <!-- Type of L&D -->
          <div>
            <AppSelect v-model="item.typeOfLD" label="Type of L&amp;D" :options="ldTypeOptions" />
          </div>

          <!-- Date Issued -->
          <div>
            <AppInput v-model="item.dateIssued" type="date" label="Date / Date Issued" />
          </div>

          <!-- Number of Hours -->
          <div>
            <AppInput v-model="item.hours" type="number" label="No. of Hours"
              hint="Total training hours" />
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
              <p class="text-[10px] font-bold text-[var(--text-muted)]">Training Certificate / Certificate of Participation</p>
              <button v-if="item.document"
                @click="$emit('preview', item.document, item.title || 'Training Certificate')"
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
