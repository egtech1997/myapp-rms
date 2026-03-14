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
  { label: 'Vocational / Trade Course',       value: 'Vocational'            },
  { label: 'Associate Degree',                value: 'Associate'             },
  { label: "Bachelor's Degree",               value: 'Bachelor'              },
  { label: 'Post-Baccalaureate Certificate',  value: 'Post-Baccalaureate'    },
  { label: "Master's Degree",                 value: 'Masteral'              },
  { label: 'Post-Graduate Diploma',           value: 'Post-Graduate Diploma' },
  { label: 'Doctorate Degree',                value: 'Doctorate'             },
]

const STATUS_OPTIONS = [
  { label: 'Graduated',                             value: 'Graduated'    },
  { label: 'CAR – Completed Academic Requirements', value: 'CAR'          },
  { label: 'Units Earned (Did Not Graduate)',        value: 'Units Earned' },
  { label: 'Did Not Graduate / Dropped',            value: 'Dropout'      },
]

// Dynamic document slot labels based on education level
function docSlots(edu) {
  const isVoc = edu.level === 'Vocational'
  return [
    {
      key:        'tor',
      pendingKey: 'torPending',
      label:      isVoc ? 'Grades / Report of Rating' : 'Transcript of Records (TOR)',
      pendingTip: isVoc ? 'Grades not yet released by school' : 'TOR not yet released by school',
    },
    {
      key:        'diploma',
      pendingKey: 'diplomaPending',
      label:      isVoc                  ? 'NC Certificate / Cert. of Completion'
                : edu.level === 'Associate' ? 'Diploma / Certificate of Completion'
                : 'Diploma / Certificate',
      pendingTip: 'Document not yet released — will submit when available',
    },
  ]
}

// Dynamic field visibility
const showYearGraduated = (edu) => edu.status === 'Graduated'
const showUnitsEarned   = (edu) => edu.status === 'Units Earned' || edu.status === 'CAR'

// Show contextual tip for non-graduated or vocational
const showDocTip = (edu) => edu.status !== 'Graduated' || edu.level === 'Vocational' || edu.level === 'Associate'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : null

const addEntry = () => {
  emit('update:modelValue', [
    {
      level: '', school: '', degree: '', periodFrom: '', periodTo: '',
      status: 'Graduated', unitsEarned: '', yearGraduated: '',
      honorsReceived: '',
      tor: '', torUploadedAt: null, torPending: false,
      diploma: '', diplomaUploadedAt: null, diplomaPending: false,
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
  if (val !== 'Graduated')                     edu.yearGraduated = ''
  if (val !== 'Units Earned' && val !== 'CAR') edu.unitsEarned   = ''
}

const togglePending = (edu, pendingKey) => {
  edu[pendingKey] = !edu[pendingKey]
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
            <span v-if="edu.status && edu.status !== 'Graduated'"
              class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-amber-100 text-amber-700">
              {{ edu.status }}
            </span>
          </div>
          <button @click="removeEntry(i)"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-faint)] hover:text-rose-500 hover:bg-rose-50 transition-colors">
            <i class="pi pi-trash text-xs"></i>
          </button>
        </div>

        <!-- Fields -->
        <div class="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <!-- Level -->
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
              :hint="edu.level === 'Bachelor'   ? 'e.g. Bachelor of Secondary Education major in English'
                   : edu.level === 'Masteral'   ? 'e.g. Master of Arts in Education'
                   : edu.level === 'Doctorate'  ? 'e.g. Doctor of Philosophy in Educational Management'
                   : edu.level === 'Vocational' ? 'e.g. TESDA NC II — Food and Beverage Services'
                   : edu.level === 'Associate'  ? 'e.g. Associate in Computer Technology'
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

          <!-- Contextual tip for fresh grads / vocational / non-graduated -->
          <div v-if="showDocTip(edu)"
            class="flex items-start gap-2 mb-3 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
            <i class="pi pi-info-circle text-amber-500 shrink-0 mt-0.5" style="font-size:11px"></i>
            <p class="text-[10px] text-amber-800 leading-snug">
              <span v-if="edu.level === 'Vocational'">
                <strong>Vocational:</strong> Upload your TESDA NC Rating Sheet or Report of Rating instead of TOR, and your NC Certificate or Certificate of Completion instead of a diploma.
              </span>
              <span v-else-if="edu.status !== 'Graduated'">
                <strong>Documents are optional</strong> for non-graduating records. Upload what you have (e.g. Certificate of Attendance, Certification of Units Earned).
              </span>
              <span v-else>
                If your TOR or Diploma <strong>has not yet been released</strong> by your school, mark it as Pending below — you can upload it later.
              </span>
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <div v-for="slot in docSlots(edu)" :key="slot.key"
              class="flex items-start gap-3 px-3 py-2.5 bg-[var(--surface)] rounded-[var(--radius-lg)] border flex-1 min-w-[220px]"
              :class="edu[slot.key] ? 'border-[var(--color-primary)]/30'
                    : edu[slot.pendingKey] ? 'border-amber-300'
                    : 'border-[var(--border-main)]'">

              <!-- Icon -->
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                :class="edu[slot.key] ? 'bg-[var(--color-primary-light)]'
                      : edu[slot.pendingKey] ? 'bg-amber-100'
                      : 'bg-[var(--bg-app)]'">
                <i :class="[
                  'text-sm',
                  edu[slot.key]
                    ? (docIsPdf(edu[slot.key]) ? 'pi pi-file-pdf text-[var(--color-primary)]' : 'pi pi-image text-[var(--color-primary)]')
                    : edu[slot.pendingKey]
                      ? 'pi pi-clock text-amber-500'
                      : 'pi pi-upload text-[var(--text-faint)]'
                ]"></i>
              </div>

              <div class="flex-1 min-w-0">
                <p class="text-[10px] font-bold text-[var(--text-muted)]">{{ slot.label }}</p>

                <!-- Uploaded -->
                <div v-if="edu[slot.key]" class="mt-0.5">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-[var(--text-faint)] truncate max-w-[120px]" :title="docFilename(edu[slot.key])">
                      {{ docFilename(edu[slot.key]) }}
                    </span>
                    <button @click="$emit('preview', edu[slot.key], `${slot.label} — ${edu.school}`)"
                      class="text-[11px] font-black text-[var(--color-primary)] hover:underline shrink-0">View</button>
                  </div>
                  <p v-if="edu[slot.key === 'tor' ? 'torUploadedAt' : 'diplomaUploadedAt']"
                    class="text-[9px] text-[var(--text-faint)] mt-0.5">
                    <i class="pi pi-clock mr-0.5"></i>{{ fmtDate(edu[slot.key === 'tor' ? 'torUploadedAt' : 'diplomaUploadedAt']) }}
                  </p>
                </div>

                <!-- Pending state -->
                <div v-else-if="edu[slot.pendingKey]" class="mt-0.5">
                  <span class="text-[10px] font-black text-amber-600">Pending — not yet released</span>
                  <p class="text-[9px] text-amber-500 mt-0.5 leading-snug">{{ slot.pendingTip }}</p>
                  <div class="flex items-center gap-3 mt-1.5">
                    <label class="text-[11px] font-bold text-[var(--color-primary)] hover:underline cursor-pointer">
                      Upload now
                      <input type="file" class="sr-only" accept=".pdf,image/*"
                        @change="$emit('upload', $event, i, slot.key)" />
                    </label>
                    <button @click="togglePending(edu, slot.pendingKey)"
                      class="text-[10px] text-[var(--text-faint)] hover:text-rose-500 hover:underline">
                      Clear
                    </button>
                  </div>
                </div>

                <!-- Not uploaded + not pending -->
                <div v-else class="mt-0.5">
                  <label class="text-[11px] font-bold text-[var(--color-primary)] hover:underline cursor-pointer block">
                    Click to upload
                    <input type="file" class="sr-only" accept=".pdf,image/*"
                      @change="$emit('upload', $event, i, slot.key)" />
                  </label>
                  <button @click="togglePending(edu, slot.pendingKey)"
                    class="text-[9px] text-[var(--text-faint)] hover:text-amber-600 hover:underline mt-0.5 block text-left">
                    <i class="pi pi-clock mr-0.5" style="font-size:8px"></i>Not yet received — mark as pending
                  </button>
                </div>
              </div>

              <!-- Replace button (when uploaded) -->
              <label v-if="edu[slot.key]"
                class="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border-main)] bg-[var(--surface)] text-[var(--text-faint)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all cursor-pointer shrink-0"
                title="Replace file">
                <i class="pi pi-sync text-[10px]"></i>
                <input type="file" class="sr-only" accept=".pdf,image/*"
                  @change="$emit('upload', $event, i, slot.key)" />
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
