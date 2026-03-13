<script setup>
import { AppInput, AppTextarea } from '@/components/ui'

defineOptions({ name: 'OthersTab' })

const props = defineProps({
  modelValue: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue'])

// ── Voluntary Work ──────────────────────────────────────────────
const addVoluntary = () => {
  const voluntaryWork = [...(props.modelValue.voluntaryWork || []),
    { organization: '', periodFrom: '', periodTo: '', hours: '', position: '' }]
  emit('update:modelValue', { ...props.modelValue, voluntaryWork })
}
const removeVoluntary = (i) => {
  const voluntaryWork = [...(props.modelValue.voluntaryWork || [])]
  voluntaryWork.splice(i, 1)
  emit('update:modelValue', { ...props.modelValue, voluntaryWork })
}

// ── Simple string list (skills / distinctions / memberships) ────
const addListItem = (field) => {
  const list = [...(props.modelValue[field] || []), '']
  emit('update:modelValue', { ...props.modelValue, [field]: list })
}
const removeListItem = (field, i) => {
  const list = [...(props.modelValue[field] || [])]
  list.splice(i, 1)
  emit('update:modelValue', { ...props.modelValue, [field]: list })
}
const updateListItem = (field, i, val) => {
  const list = [...(props.modelValue[field] || [])]
  list[i] = val
  emit('update:modelValue', { ...props.modelValue, [field]: list })
}

// ── PDS Questions ───────────────────────────────────────────────
const updateQ = (key, val) => {
  emit('update:modelValue', {
    ...props.modelValue,
    pdsQuestions: { ...props.modelValue.pdsQuestions, [key]: val },
  })
}

const PDS_QUESTIONS = [
  {
    group: '34',
    label: 'Relationship to Appointing Authority',
    parts: [
      { key: 'q34a', text: 'Are you related within the 3rd degree (by consanguinity or affinity) to the appointing or recommending authority, or to the chief of bureau/office, or to the person with immediate supervision over you?' },
      { key: 'q34b', text: 'Are you related within the 4th degree to the above? (for LGU Career Employees)' },
    ],
    detailKey: 'q34_details',
    detailHint: 'If yes, state name and relationship',
  },
  {
    group: '35',
    label: 'Administrative Offense',
    parts: [
      { key: 'q35a', text: 'Have you ever been found guilty of any administrative offense?' },
      { key: 'q35b', text: 'Have you ever been criminally charged before any court?' },
    ],
    detailKey: 'q35_details',
    detailHint: 'If yes, give details: date, case number, nature of offense, and status',
  },
  {
    group: '36',
    label: 'Criminal Conviction',
    parts: [
      { key: 'q36', text: 'Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?' },
    ],
    detailKey: 'q36_details',
    detailHint: 'If yes, provide details of the conviction',
  },
  {
    group: '37',
    label: 'Separation from Service',
    parts: [
      { key: 'q37', text: 'Have you ever been separated from the service in connection with an administrative case?' },
    ],
    detailKey: 'q37_details',
    detailHint: 'If yes, state the nature of the case and date',
  },
  {
    group: '38',
    label: 'Candidacy / Resignation',
    parts: [
      { key: 'q38a', text: 'Have you ever been a candidate in any national or local election held within the last year (except Barangay election)?' },
      { key: 'q38b', text: 'Have you resigned from the government service during the three (3)-month period before the last election to promote or actively campaign for a national or local candidate?' },
    ],
    detailKey: 'q38_details',
    detailHint: 'If yes, state the position ran for and date of election',
  },
  {
    group: '39',
    label: 'Immigrant / Permanent Resident Status',
    parts: [
      { key: 'q39', text: 'Have you acquired the status of an immigrant or permanent resident of another country?' },
    ],
    detailKey: 'q39_details',
    detailHint: 'If yes, state country and basis',
  },
  {
    group: '40',
    label: 'Indigenous People / Disability / Solo Parent',
    parts: [
      { key: 'q40a', text: 'Are you a member of any indigenous group? (RA 8371 — Indigenous People\'s Act)' },
      { key: 'q40b', text: 'Are you a person with disability? (RA 7277 — Magna Carta for Disabled Persons)' },
      { key: 'q40c', text: 'Are you a solo parent? (RA 8972 — Solo Parents\' Welfare Act)' },
    ],
    detailKey: 'q40_details',
    detailHint: 'If yes, provide details and any supporting document reference',
  },
]

const anyYes = (q) =>
  q.parts.some((p) => props.modelValue.pdsQuestions?.[p.key])
</script>

<template>
  <div class="flex flex-col gap-8 animate-fade-in">

    <!-- ── 1. Voluntary Work ────────────────────────────── -->
    <div>
      <div class="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border-main)]">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
            <i class="pi pi-heart-fill text-xs text-[var(--color-primary)]"></i>
          </div>
          <div>
            <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Voluntary Work</h3>
            <p class="text-[10px] text-[var(--text-muted)] mt-0.5">Include community, NGO, and church-based volunteer activities</p>
          </div>
        </div>
        <button @click="addVoluntary" class="btn-primary h-8 px-3 text-xs flex items-center gap-1.5 shrink-0">
          <i class="pi pi-plus text-[9px]"></i> Add
        </button>
      </div>

      <div v-if="!modelValue.voluntaryWork?.length"
        class="py-10 flex flex-col items-center gap-2 border-2 border-dashed border-[var(--border-main)] rounded-[var(--radius-xl)] bg-[var(--bg-app)]">
        <i class="pi pi-heart text-xl text-[var(--text-faint)]"></i>
        <p class="text-xs text-[var(--text-muted)]">No voluntary work listed</p>
      </div>

      <div v-else class="flex flex-col gap-3">
        <div v-for="(v, i) in modelValue.voluntaryWork" :key="i"
          class="border border-[var(--border-main)] rounded-[var(--radius-xl)] overflow-hidden"
          style="box-shadow:var(--shadow-xs)">
          <div class="px-4 py-2.5 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center justify-between">
            <span class="text-xs font-bold text-[var(--text-muted)]">{{ v.organization || `Voluntary Work ${i + 1}` }}</span>
            <button @click="removeVoluntary(i)"
              class="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-faint)] hover:text-rose-500 hover:bg-rose-50 transition-colors">
              <i class="pi pi-trash text-xs"></i>
            </button>
          </div>
          <div class="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div class="col-span-2">
              <AppInput v-model="v.organization" label="Organization / Institution" size="sm" />
            </div>
            <AppInput v-model="v.position" label="Position / Nature of Work" size="sm" />
            <AppInput v-model="v.periodFrom" type="date" label="From" size="sm" />
            <AppInput v-model="v.periodTo"   type="date" label="To"   size="sm" />
            <AppInput v-model="v.hours" type="number" label="No. of Hours" size="sm" />
          </div>
        </div>
      </div>
    </div>

    <!-- ── 2. Special Skills ─────────────────────────────── -->
    <div>
      <div class="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border-main)]">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
            <i class="pi pi-star text-xs text-[var(--color-primary)]"></i>
          </div>
          <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Special Skills &amp; Hobbies</h3>
        </div>
        <button @click="addListItem('specialSkills')" class="text-[10px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
          <i class="pi pi-plus text-[9px]"></i> Add
        </button>
      </div>
      <div v-if="!modelValue.specialSkills?.length" class="py-6 text-center border border-dashed border-[var(--border-main)] rounded-xl bg-[var(--bg-app)]">
        <p class="text-[11px] text-[var(--text-faint)]">e.g. Computer Programming, Public Speaking, Guitar Playing</p>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <div v-for="(item, i) in modelValue.specialSkills" :key="i" class="flex items-center gap-2">
          <AppInput
            :modelValue="item"
            @update:modelValue="v => updateListItem('specialSkills', i, v)"
            :label="`Skill / Hobby ${i + 1}`" size="sm" class="flex-1" />
          <button @click="removeListItem('specialSkills', i)"
            class="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-[var(--text-faint)] hover:text-rose-500 hover:bg-rose-50 transition-colors">
            <i class="pi pi-trash text-xs"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ── 3. Non-Academic Distinctions ─────────────────── -->
    <div>
      <div class="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border-main)]">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
            <i class="pi pi-award text-xs text-[var(--color-primary)]"></i>
          </div>
          <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Non-Academic Distinctions / Recognition</h3>
        </div>
        <button @click="addListItem('nonAcademicDistinctions')" class="text-[10px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
          <i class="pi pi-plus text-[9px]"></i> Add
        </button>
      </div>
      <div v-if="!modelValue.nonAcademicDistinctions?.length" class="py-6 text-center border border-dashed border-[var(--border-main)] rounded-xl bg-[var(--bg-app)]">
        <p class="text-[11px] text-[var(--text-faint)]">e.g. Best Teacher Award, Gawad Patnugot, Regional Winner</p>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div v-for="(item, i) in modelValue.nonAcademicDistinctions" :key="i" class="flex items-center gap-2">
          <AppInput
            :modelValue="item"
            @update:modelValue="v => updateListItem('nonAcademicDistinctions', i, v)"
            :label="`Distinction / Award ${i + 1}`" size="sm" class="flex-1" />
          <button @click="removeListItem('nonAcademicDistinctions', i)"
            class="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-[var(--text-faint)] hover:text-rose-500 hover:bg-rose-50 transition-colors">
            <i class="pi pi-trash text-xs"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ── 4. Memberships in Associations ───────────────── -->
    <div>
      <div class="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border-main)]">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
            <i class="pi pi-users text-xs text-[var(--color-primary)]"></i>
          </div>
          <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Memberships in Associations / Organizations</h3>
        </div>
        <button @click="addListItem('memberships')" class="text-[10px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
          <i class="pi pi-plus text-[9px]"></i> Add
        </button>
      </div>
      <div v-if="!modelValue.memberships?.length" class="py-6 text-center border border-dashed border-[var(--border-main)] rounded-xl bg-[var(--bg-app)]">
        <p class="text-[11px] text-[var(--text-faint)]">e.g. Philippine Association of Teachers, DepEd Teachers Club</p>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div v-for="(item, i) in modelValue.memberships" :key="i" class="flex items-center gap-2">
          <AppInput
            :modelValue="item"
            @update:modelValue="v => updateListItem('memberships', i, v)"
            :label="`Organization / Association ${i + 1}`" size="sm" class="flex-1" />
          <button @click="removeListItem('memberships', i)"
            class="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-[var(--text-faint)] hover:text-rose-500 hover:bg-rose-50 transition-colors">
            <i class="pi pi-trash text-xs"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ── 5. PDS Questions (Q34–Q40) ───────────────────── -->
    <div>
      <div class="flex items-center gap-2.5 mb-4 pb-2 border-b border-[var(--border-main)]">
        <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
          <i class="pi pi-list-check text-xs text-[var(--color-primary)]"></i>
        </div>
        <div>
          <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">CS Form 212 — Questions (34–40)</h3>
          <p class="text-[10px] text-[var(--text-muted)] mt-0.5">Answer all questions truthfully. False statements are grounds for disqualification.</p>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <div v-for="q in PDS_QUESTIONS" :key="q.group"
          class="border border-[var(--border-main)] rounded-[var(--radius-xl)] overflow-hidden"
          style="box-shadow:var(--shadow-xs)">

          <div class="px-4 py-2.5 bg-[var(--bg-app)] border-b border-[var(--border-main)]">
            <p class="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Question {{ q.group }} — {{ q.label }}</p>
          </div>

          <div class="p-4 flex flex-col gap-3">
            <div v-for="part in q.parts" :key="part.key" class="flex items-start gap-3">
              <!-- Yes/No toggle -->
              <div class="flex items-center gap-2 shrink-0 pt-0.5">
                <label class="flex items-center gap-1 cursor-pointer select-none">
                  <input type="radio" :name="part.key" :value="true"
                    :checked="modelValue.pdsQuestions?.[part.key] === true"
                    @change="updateQ(part.key, true)"
                    class="accent-[var(--color-primary)]" />
                  <span class="text-xs font-bold text-green-600">Yes</span>
                </label>
                <label class="flex items-center gap-1 cursor-pointer select-none">
                  <input type="radio" :name="part.key" :value="false"
                    :checked="modelValue.pdsQuestions?.[part.key] === false || modelValue.pdsQuestions?.[part.key] == null"
                    @change="updateQ(part.key, false)"
                    class="accent-[var(--color-primary)]" />
                  <span class="text-xs font-bold text-[var(--text-muted)]">No</span>
                </label>
              </div>
              <p class="text-xs text-[var(--text-sub)] flex-1">{{ part.text }}</p>
            </div>

            <!-- Details field — shown if any part is Yes -->
            <Transition name="field-slide">
              <div v-if="anyYes(q)" class="mt-1">
                <AppTextarea
                  :modelValue="modelValue.pdsQuestions?.[q.detailKey]"
                  @update:modelValue="v => updateQ(q.detailKey, v)"
                  label="Please provide details"
                  :hint="q.detailHint"
                  :rows="2"
                  :autoResize="true" />
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.field-slide-enter-active { transition: all 0.2s var(--ease-out); }
.field-slide-leave-active { transition: all 0.15s var(--ease-in); }
.field-slide-enter-from, .field-slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
