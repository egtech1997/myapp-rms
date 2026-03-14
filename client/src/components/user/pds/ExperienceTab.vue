<script setup>
import { AppInput, AppSelect, AppTextarea } from '@/components/ui'
import { docFilename, docIsPdf } from '@/composables/useDocUpload'

defineOptions({ name: 'ExperienceTab' })

const props = defineProps({
  modelValue: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue', 'upload', 'preview'])

const statusOptions = [
  { label: 'Permanent',   value: 'Permanent'   },
  { label: 'Temporary',   value: 'Temporary'   },
  { label: 'Coterminous', value: 'Coterminous' },
  { label: 'Contractual', value: 'Contractual' },
  { label: 'Casual',      value: 'Casual'      },
  { label: 'Job Order',   value: 'Job Order'   },
]

const serviceTypeOptions = [
  { label: 'Government',    value: 'Government'    },
  { label: 'Private',       value: 'Private'       },
  { label: 'Self-Employed', value: 'Self-Employed' },
]

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : null

const addEntry = () => {
  emit('update:modelValue', [
    {
      position: '', company: '', monthlySalary: '', salaryGrade: '',
      statusOfAppointment: 'Permanent', periodFrom: '', periodTo: '',
      serviceType: 'Government', keyResponsibilities: [], document: '', documentUploadedAt: null,
    },
    ...props.modelValue,
  ])
}

const removeEntry = (i) => {
  const list = [...props.modelValue]
  list.splice(i, 1)
  emit('update:modelValue', list)
}

const addResponsibility = (exp) => exp.keyResponsibilities.push('')
const removeResponsibility = (exp, i) => exp.keyResponsibilities.splice(i, 1)

const isPresent = (exp) => exp.periodTo === null
const togglePresent = (exp) => {
  exp.periodTo = isPresent(exp) ? '' : null
}
</script>

<template>
  <div class="flex flex-col gap-6">

    <!-- Section header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-black text-[var(--text-main)]">Work Experience</h3>
        <p class="text-xs text-[var(--text-muted)] mt-0.5">List all government and private employment, most recent first. Include part-time and contractual.</p>
      </div>
      <button @click="addEntry" class="btn-primary h-9 px-4 text-xs flex items-center gap-2 shrink-0">
        <i class="pi pi-plus text-[10px]"></i> Add Experience
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="modelValue.length === 0"
      class="py-16 flex flex-col items-center gap-3 border-2 border-dashed border-[var(--border-main)] rounded-[var(--radius-xl)] bg-[var(--bg-app)]">
      <div class="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border-main)] flex items-center justify-center shadow-sm">
        <i class="pi pi-briefcase text-xl text-[var(--text-faint)]"></i>
      </div>
      <div class="text-center">
        <p class="text-sm font-bold text-[var(--text-main)]">No work experience records yet</p>
        <p class="text-xs text-[var(--text-muted)] mt-1">Add your previous or current employment records.</p>
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
              {{ item.position || 'Experience Entry' }}
              <span v-if="item.company" class="font-normal"> — {{ item.company }}</span>
            </span>
            <span v-if="item.serviceType === 'Government'"
              class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              Gov't
            </span>
          </div>
          <button @click="removeEntry(i)"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-faint)] hover:text-rose-500 hover:bg-rose-50 transition-colors">
            <i class="pi pi-trash text-xs"></i>
          </button>
        </div>

        <!-- Fields -->
        <div class="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <!-- Position -->
          <div class="sm:col-span-2">
            <AppInput v-model="item.position" label="Position / Job Title"
              hint="e.g. Teacher I, Administrative Officer V" />
          </div>

          <!-- Service Type -->
          <div>
            <AppSelect v-model="item.serviceType" label="Service Type" :options="serviceTypeOptions" />
          </div>

          <!-- Agency / Company -->
          <div class="sm:col-span-2 lg:col-span-2">
            <AppInput v-model="item.company" label="Department / Agency / Company"
              hint="e.g. Department of Education — SDO Guihulngan City" />
          </div>

          <!-- Status of Appointment -->
          <div>
            <AppSelect v-model="item.statusOfAppointment" label="Status of Appointment" :options="statusOptions" />
          </div>

          <!-- Period From -->
          <div>
            <AppInput v-model="item.periodFrom" type="date" label="Date From" />
          </div>

          <!-- Period To + Present toggle -->
          <div>
            <AppInput v-model="item.periodTo" type="date" label="Date To"
              :disabled="isPresent(item)"
              :hint="isPresent(item) ? 'Currently employed here' : ''" />
            <label class="flex items-center gap-1.5 mt-1.5 cursor-pointer select-none">
              <input type="checkbox" :checked="isPresent(item)" @change="togglePresent(item)"
                class="rounded border-[var(--border-main)] accent-[var(--color-primary)]" />
              <span class="text-[10px] font-bold text-[var(--text-muted)]">Present / Currently Employed</span>
            </label>
          </div>

          <!-- Monthly Salary -->
          <div>
            <AppInput v-model="item.monthlySalary" type="number" label="Monthly Salary (PHP)"
              hint="Gross monthly salary" />
          </div>

          <!-- Salary Grade -->
          <div>
            <AppInput v-model="item.salaryGrade" label="Salary Grade / Step"
              hint="e.g. SG-11 Step 1" />
          </div>
        </div>

        <!-- Key Responsibilities -->
        <div class="px-5 pb-5">
          <div class="flex items-center justify-between mb-2">
            <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Key Responsibilities <span class="font-medium normal-case tracking-normal">(optional)</span></p>
            <button @click="addResponsibility(item)"
              class="text-[10px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
              <i class="pi pi-plus text-[9px]"></i> Add
            </button>
          </div>
          <div v-if="item.keyResponsibilities.length" class="flex flex-col gap-1">
            <div v-for="(_, ri) in item.keyResponsibilities" :key="ri" class="flex items-start gap-1.5">
              <AppInput v-model="item.keyResponsibilities[ri]"
                :label="`Responsibility ${ri + 1}`" size="sm" class="flex-1" />
              <button @click="removeResponsibility(item, ri)"
                class="w-8 h-8 shrink-0 self-start mt-1 flex items-center justify-center rounded-lg text-[var(--text-faint)] hover:text-rose-500 hover:bg-rose-50 transition-colors">
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
          </div>
          <p v-else class="text-[11px] text-[var(--text-faint)] italic">Optional — describe your main duties for this role.</p>
        </div>

        <!-- Document attachment -->
        <div class="px-5 py-3.5 bg-[var(--bg-app)] border-t border-[var(--border-main)]">
          <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-2">Supporting Document</p>
          <div class="flex items-center gap-3 px-3 py-2.5 bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border-main)]">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              :class="item.document ? 'bg-[var(--color-primary-light)]' : 'bg-[var(--bg-app)]'">
              <i :class="[
                'text-sm',
                item.document
                  ? (docIsPdf(item.document) ? 'pi pi-file-pdf text-[var(--color-primary)]' : 'pi pi-image text-[var(--color-primary)]')
                  : 'pi pi-upload text-[var(--text-faint)]'
              ]"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] font-bold text-[var(--text-muted)]">Certificate of Employment (COE) / Service Record</p>
              <div v-if="item.document" class="mt-0.5">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-[var(--text-faint)] truncate max-w-[140px]" :title="docFilename(item.document)">
                    {{ docFilename(item.document) }}
                  </span>
                  <button @click="$emit('preview', item.document, `COE — ${item.position}`)"
                    class="text-[11px] font-black text-[var(--color-primary)] hover:underline shrink-0">View</button>
                </div>
                <p v-if="item.documentUploadedAt" class="text-[9px] text-[var(--text-faint)] mt-0.5">
                  <i class="pi pi-clock mr-0.5"></i>{{ fmtDate(item.documentUploadedAt) }}
                </p>
              </div>
              <label v-else class="text-[11px] font-bold text-[var(--color-primary)] hover:underline cursor-pointer mt-0.5 block">
                Click to upload
                <input type="file" class="sr-only" accept=".pdf,image/*" @change="$emit('upload', $event, i)" />
              </label>
            </div>
            <label v-if="item.document"
              class="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border-main)] bg-[var(--surface)] text-[var(--text-faint)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all cursor-pointer shrink-0"
              title="Replace file">
              <i class="pi pi-sync text-[10px]"></i>
              <input type="file" class="sr-only" accept=".pdf,image/*" @change="$emit('upload', $event, i)" />
            </label>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
