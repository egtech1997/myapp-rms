<script setup>
import { AppInput, AppSelect } from '@/components/ui'
import { docFilename, docIsPdf } from '@/composables/useDocUpload'

defineOptions({ name: 'EducationTab' })

const props = defineProps({
  modelValue: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue', 'upload', 'preview'])

// DepEd QS-relevant education levels (no Elementary/Secondary)
const DEGREE_LEVELS = [
  { label: 'Vocational / Trade Course',       value: 'Vocational'          },
  { label: 'Associate Degree',                value: 'Associate'           },
  { label: "Bachelor's Degree",               value: 'Bachelor'            },
  { label: 'Post-Baccalaureate Certificate',  value: 'Post-Baccalaureate'  },
  { label: "Master's Degree",                 value: 'Masteral'            },
  { label: 'Post-Graduate Diploma',           value: 'Post-Graduate Diploma' },
  { label: 'Doctorate Degree',                value: 'Doctorate'           },
]

const STATUS_OPTIONS = [
  { label: 'Graduated',                                    value: 'Graduated'    },
  { label: 'CAR – Completed Academic Requirements',        value: 'CAR'          },
  { label: 'Units Earned (Did Not Graduate)',              value: 'Units Earned' },
  { label: 'Did Not Graduate / Dropped',                   value: 'Dropout'      },
]

// Dynamic field visibility
const showYearGraduated = (edu) => edu.status === 'Graduated'
const showUnitsEarned   = (edu) => edu.status === 'Units Earned' || edu.status === 'CAR'

const addEntry = () => {
  emit('update:modelValue', [
    {
      level: '', school: '', degree: '', periodFrom: '', periodTo: '',
      status: 'Graduated', unitsEarned: '', yearGraduated: '',
      honorsReceived: '', tor: '', diploma: '',
    },
    ...props.modelValue,
  ])
}

const removeEntry = (i) => {
  const list = [...props.modelValue]
  list.splice(i, 1)
  emit('update:modelValue', list)
}

const onStatusChange = (edu, val) => {
  edu.status = val
  // Clear fields that are no longer applicable
  if (val !== 'Graduated')                             edu.yearGraduated = ''
  if (val !== 'Units Earned' && val !== 'CAR')         edu.unitsEarned   = ''
}
</script>

<template>
  <div class="flex flex-col gap-6">

    <!-- Section header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-black text-[var(--text-main)]">Educational Background</h3>
        <p class="text-xs text-[var(--text-muted)] mt-0.5">List all schools attended from most recent. Elementary and Secondary records are not required.</p>
      </div>
      <button @click="addEntry" class="btn-primary h-9 px-4 text-xs flex items-center gap-2 shrink-0">
        <i class="pi pi-plus text-[10px]"></i> Add Education
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="modelValue.length === 0"
      class="py-16 flex flex-col items-center gap-3 border-2 border-dashed border-[var(--border-main)] rounded-[var(--radius-xl)] bg-[var(--bg-app)]">
      <div class="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border-main)] flex items-center justify-center shadow-sm">
        <i class="pi pi-graduation-cap text-xl text-[var(--text-faint)]"></i>
      </div>
      <div class="text-center">
        <p class="text-sm font-bold text-[var(--text-main)]">No educational records yet</p>
        <p class="text-xs text-[var(--text-muted)] mt-1">Add your college, post-grad, or vocational education.</p>
      </div>
      <button @click="addEntry" class="btn-secondary h-9 px-4 text-xs flex items-center gap-2">
        <i class="pi pi-plus text-[10px]"></i> Add First Record
      </button>
    </div>

    <!-- Education entries -->
    <div v-else class="flex flex-col gap-5">
      <div
        v-for="(edu, i) in modelValue" :key="i"
        class="border border-[var(--border-main)] rounded-[var(--radius-xl)] overflow-hidden"
        style="box-shadow:var(--shadow-xs)">

        <!-- Entry header -->
        <div class="px-5 py-3 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-black flex items-center justify-center shrink-0">
              {{ i + 1 }}
            </span>
            <span class="text-xs font-bold text-[var(--text-muted)]">
              {{ edu.level || 'Education Entry' }}
              <span v-if="edu.school" class="font-normal"> — {{ edu.school }}</span>
            </span>
          </div>
          <button @click="removeEntry(i)"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-faint)] hover:text-rose-500 hover:bg-rose-50 transition-colors">
            <i class="pi pi-trash text-xs"></i>
          </button>
        </div>

        <!-- Fields -->
        <div class="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <!-- Level (full width on its own row) -->
          <div class="sm:col-span-2 lg:col-span-1">
            <AppSelect
              v-model="edu.level"
              label="Education Level"
              :options="DEGREE_LEVELS" />
          </div>

          <!-- School name -->
          <div class="sm:col-span-2">
            <AppInput v-model="edu.school" label="Name of School / University" />
          </div>

          <!-- Degree / Course -->
          <div class="sm:col-span-2 lg:col-span-2">
            <AppInput v-model="edu.degree" label="Degree / Course Title"
              :hint="edu.level === 'Bachelor' ? 'e.g. Bachelor of Secondary Education major in English'
                   : edu.level === 'Masteral'  ? 'e.g. Master of Arts in Education'
                   : edu.level === 'Doctorate' ? 'e.g. Doctor of Philosophy in Educational Management'
                   : edu.level === 'Vocational' ? 'e.g. Technical-Vocational Teacher Education'
                   : 'Enter the full degree or course title'" />
          </div>

          <!-- Status -->
          <div>
            <AppSelect
              v-model="edu.status"
              label="Completion Status"
              :options="STATUS_OPTIONS"
              @update:modelValue="(v) => onStatusChange(edu, v)" />
          </div>

          <!-- Period From / To -->
          <div>
            <AppInput v-model="edu.periodFrom" label="Year Started" type="number"
              hint="4-digit year e.g. 2018" />
          </div>
          <div>
            <AppInput v-model="edu.periodTo" label="Year Ended / Present" type="number"
              hint="4-digit year or leave blank if ongoing" />
          </div>

          <!-- Year Graduated — only when Graduated -->
          <Transition name="field-slide">
            <div v-if="showYearGraduated(edu)">
              <AppInput v-model="edu.yearGraduated" label="Year Graduated" type="number"
                hint="4-digit year e.g. 2022" />
            </div>
          </Transition>

          <!-- Units Earned — only when Units Earned or CAR -->
          <Transition name="field-slide">
            <div v-if="showUnitsEarned(edu)">
              <AppInput v-model="edu.unitsEarned" label="Units Earned"
                :hint="edu.status === 'CAR' ? 'All academic units completed' : 'e.g. 36 units'" />
            </div>
          </Transition>

          <!-- Honors -->
          <div class="sm:col-span-2 lg:col-span-3">
            <AppInput v-model="edu.honorsReceived" label="Scholarship / Academic Honors Received"
              hint="e.g. Cum Laude, Dean's List, CHED Scholar — leave blank if none" />
          </div>

        </div>

        <!-- Document attachments -->
        <div class="px-5 py-3.5 bg-[var(--bg-app)] border-t border-[var(--border-main)]">
          <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] mb-2">Supporting Documents</p>
          <div class="flex flex-wrap gap-3">
            <div v-for="doc in [
              { key: 'tor',     label: 'Transcript of Records (TOR)' },
              { key: 'diploma', label: 'Diploma / Certificate'       },
            ]" :key="doc.key"
              class="flex items-center gap-3 px-3 py-2.5 bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border-main)] flex-1 min-w-[220px]">

              <!-- Icon: PDF or image -->
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                :class="edu[doc.key] ? 'bg-[var(--color-primary-light)]' : 'bg-[var(--bg-app)]'">
                <i :class="[
                  'text-sm',
                  edu[doc.key]
                    ? (docIsPdf(edu[doc.key]) ? 'pi pi-file-pdf text-[var(--color-primary)]' : 'pi pi-image text-[var(--color-primary)]')
                    : 'pi pi-upload text-[var(--text-faint)]'
                ]"></i>
              </div>

              <div class="flex-1 min-w-0">
                <p class="text-[10px] font-bold text-[var(--text-muted)]">{{ doc.label }}</p>
                <!-- Uploaded: filename + view link -->
                <div v-if="edu[doc.key]" class="flex items-center gap-2 mt-0.5">
                  <span class="text-[10px] text-[var(--text-faint)] truncate max-w-[120px]" :title="docFilename(edu[doc.key])">
                    {{ docFilename(edu[doc.key]) }}
                  </span>
                  <button @click="$emit('preview', edu[doc.key], `${doc.label} — ${edu.school}`)"
                    class="text-[11px] font-black text-[var(--color-primary)] hover:underline shrink-0">
                    View
                  </button>
                </div>
                <!-- Not uploaded -->
                <label v-else class="text-[11px] font-bold text-[var(--color-primary)] hover:underline cursor-pointer mt-0.5 block">
                  Click to upload
                  <input type="file" class="sr-only" accept=".pdf,image/*"
                    @change="$emit('upload', $event, i, doc.key)" />
                </label>
              </div>

              <!-- Replace button -->
              <label v-if="edu[doc.key]"
                class="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border-main)] bg-[var(--surface)] text-[var(--text-faint)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all cursor-pointer shrink-0"
                title="Replace file">
                <i class="pi pi-sync text-[10px]"></i>
                <input type="file" class="sr-only" accept=".pdf,image/*"
                  @change="$emit('upload', $event, i, doc.key)" />
              </label>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.field-slide-enter-active { transition: all 0.2s var(--ease-out); }
.field-slide-leave-active { transition: all 0.15s var(--ease-in); }
.field-slide-enter-from, .field-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
