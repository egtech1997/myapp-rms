<script setup>
import { ref } from 'vue'
import { AppButton, AppFileViewer } from '@/components/ui'
import ApplicantCoverPagePdf from '@/components/ApplicantCoverPagePdf.vue'

defineOptions({ name: 'ApplicationModal' })

const props = defineProps({
  modelValue:  { type: Boolean, default: false },
  job:         { type: Object, required: true },
  profile:     { type: Object, default: null },
  applying:    { type: Boolean, default: false },
  applyError:  { type: String,  default: '' },
  // Selections
  selEdu:      { type: Array,   default: () => [] },
  selElig:     { type: Array,   default: () => [] },
  selTrn:      { type: Array,   default: () => [] },
  selExp:      { type: Array,   default: () => [] },
  perfRating:  { type: Object,  default: () => ({ score: '', adjective: '', periodCovered: '' }) },
})

const emit = defineEmits([
  'update:modelValue', 'apply', 'preview',
  'update:selEdu', 'update:selElig', 'update:selTrn', 'update:selExp', 'update:perfRating'
])

const step = ref('detail') // 'detail' | 'success'

const toggle = (list, val, field) => {
  const newList = [...list]
  const idx = newList.indexOf(val)
  if (idx === -1) newList.push(val)
  else newList.splice(idx, 1)
  emit(`update:${field}`, newList)
}

const expandedRows = ref([])
const toggleRow = (id) => {
  const idx = expandedRows.value.indexOf(id)
  if (idx === -1) expandedRows.value.push(id)
  else expandedRows.value.splice(idx, 1)
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }) : 'Present'

const handleApply = async () => {
  const success = await emit('apply')
  if (success) step.value = 'success'
}

const closeModal = () => {
  emit('update:modelValue', false)
  setTimeout(() => step.value = 'detail', 300)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" 
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      @click.self="closeModal">
      
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-[var(--color-navy)]/60 backdrop-blur-md animate-fade-in"></div>

      <!-- Modal Card -->
      <div class="relative bg-white border border-[var(--border-main)] rounded-[2rem] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-zoom-in max-h-[92vh]">
        
        <!-- STEP 1: Details & Selection -->
        <template v-if="step === 'detail'">
          <!-- Header -->
          <div class="px-8 py-6 border-b border-[var(--border-main)] flex justify-between items-start bg-[var(--surface-2)]">
            <div class="flex-1 min-w-0">
               <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] mb-2">Job Application</p>
               <h2 class="text-xl font-black text-[var(--text-main)] tracking-tight leading-tight uppercase">{{ job.positionTitle }}</h2>
               <p class="text-xs text-[var(--text-muted)] font-medium mt-1 flex items-center gap-2">
                 <i class="pi pi-map-marker text-[10px]"></i>
                 {{ Array.isArray(job.placeOfAssignment) ? job.placeOfAssignment.join(', ') : job.placeOfAssignment }}
               </p>
            </div>
            <button @click="closeModal" class="w-10 h-10 rounded-xl bg-white border border-[var(--border-main)] flex items-center justify-center text-[var(--text-faint)] hover:text-rose-500 transition-all shadow-sm">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="overflow-y-auto custom-scrollbar flex-1 p-8 space-y-8">
             <!-- Key Specs -->
             <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div v-for="spec in [
                  { label: 'Grade', val: `SG-${job.salaryGrade || '—'}` },
                  { label: 'Salary', val: `₱${Number(job.salary || 0).toLocaleString()}` },
                  { label: 'Slots', val: job.noOfVacancy || 1 },
                  { label: 'Nature', val: job.employmentType || 'Permanent' },
                ]" :key="spec.label" class="p-3 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] text-center">
                   <p class="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-1">{{ spec.label }}</p>
                   <p class="text-xs font-black text-[var(--text-main)]">{{ spec.val }}</p>
                </div>
             </div>

             <!-- Record Selection Section -->
             <div class="space-y-4">
                <div class="flex items-center justify-between">
                   <h3 class="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em]">PDS Record Selection</h3>
                   <span class="text-[9px] font-bold text-[var(--text-faint)] italic">Select relevant proofs for this position</span>
                </div>

                <div class="space-y-3">
                   <div v-for="row in [
                     { id: 'education',   label: 'Education',    icon: 'pi-graduation-cap', val: selEdu,   data: profile?.education },
                     { id: 'experience',  label: 'Experience',   icon: 'pi-briefcase',      val: selExp,   data: profile?.experience },
                     { id: 'eligibility', label: 'Eligibility',  icon: 'pi-verified',       val: selElig,  data: profile?.eligibility },
                     { id: 'training',    label: 'Training',     icon: 'pi-book',           val: selTrn,   data: profile?.training },
                   ]" :key="row.id" class="border border-[var(--border-main)] rounded-2xl overflow-hidden bg-[var(--bg-app)] transition-all">
                      
                      <!-- Toggle Header -->
                      <div @click="toggleRow(row.id)" class="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-white transition-colors">
                         <div class="flex items-center gap-4">
                            <div class="w-8 h-8 rounded-lg bg-white border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)]">
                               <i :class="['pi text-xs', row.icon]"></i>
                            </div>
                            <div>
                               <p class="text-xs font-bold text-[var(--text-main)]">{{ row.label }}</p>
                               <p class="text-[10px] font-medium text-[var(--text-faint)] uppercase tracking-wide">
                                 {{ row.val.length }} selected / {{ row.data?.length || 0 }} on file
                               </p>
                            </div>
                         </div>
                         <i :class="['pi text-[10px] transition-transform', expandedRows.includes(row.id) ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
                      </div>

                      <!-- Selection List -->
                      <div v-if="expandedRows.includes(row.id)" class="border-t border-[var(--border-main)] bg-white p-2 animate-fade-in">
                         <div v-if="!row.data?.length" class="p-4 text-center text-[10px] text-[var(--text-faint)] italic uppercase tracking-widest">
                            No records found in PDS
                         </div>
                         <div v-else class="space-y-1">
                            <div v-for="(item, i) in row.data" :key="i"
                              @click="toggle(row.val, i, `sel${row.id === 'education' ? 'Edu' : row.id === 'experience' ? 'Exp' : row.id === 'eligibility' ? 'Elig' : 'Trn'}`)"
                              class="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--bg-app)] transition-colors cursor-pointer group">                               <div :class="['w-5 h-5 rounded-md border flex items-center justify-center transition-all', row.val.includes(i) ? 'bg-[var(--color-primary)] border-transparent text-white' : 'bg-white border-[var(--border-main)]']">
                                  <i v-if="row.val.includes(i)" class="pi pi-check text-[10px]"></i>
                               </div>
                               <div class="flex-1 min-w-0">
                                  <p class="text-xs font-bold text-[var(--text-main)] truncate">{{ item.schoolName || item.positionTitle || item.name || item.title }}</p>
                                  <p class="text-[10px] text-[var(--text-faint)] truncate font-medium uppercase tracking-tight">{{ item.degree || item.department || item.type || item.conductedBy }}</p>
                               </div>
                               <div class="flex items-center gap-2">
                                  <button v-if="item.tor || item.diploma || item.document" 
                                     @click.stop="$emit('preview', item.tor || item.diploma || item.document, item.schoolName || item.positionTitle || item.name || item.title)"
                                     class="w-8 h-8 rounded-lg bg-white border border-[var(--border-main)] flex items-center justify-center text-[var(--text-faint)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all shadow-sm">
                                     <i class="pi pi-eye text-[10px]"></i>
                                  </button>
                                  <div v-if="item.tor || item.diploma || item.document" class="text-[var(--text-faint)]">
                                     <i class="pi pi-file-pdf text-xs"></i>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <!-- Performance Rating -->
             <div class="p-6 rounded-2xl border border-[var(--border-main)] bg-amber-50/30 space-y-4">
                <div class="flex items-center gap-3">
                   <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                      <i class="pi pi-chart-bar text-xs"></i>
                   </div>
                   <h3 class="text-[10px] font-black text-amber-900 uppercase tracking-[0.2em]">Latest Performance Rating</h3>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div class="space-y-1">
                      <label class="text-[9px] font-black uppercase tracking-widest text-amber-700 ml-1">Rating Score</label>
                      <input v-model="perfRating.score" type="text" placeholder="e.g. 4.85" class="w-full h-10 px-3 rounded-lg border border-amber-200 bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20" />
                   </div>
                   <div class="space-y-1">
                      <label class="text-[9px] font-black uppercase tracking-widest text-amber-700 ml-1">Adjective</label>
                      <input v-model="perfRating.adjective" type="text" placeholder="e.g. Outstanding" class="w-full h-10 px-3 rounded-lg border border-amber-200 bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20" />
                   </div>
                   <div class="space-y-1">
                      <label class="text-[9px] font-black uppercase tracking-widest text-amber-700 ml-1">Period</label>
                      <input v-model="perfRating.periodCovered" type="text" placeholder="e.g. 2024" class="w-full h-10 px-3 rounded-lg border border-amber-200 bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20" />
                   </div>
                </div>
             </div>

             <!-- Final Check -->
             <div class="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                <i class="pi pi-info-circle text-blue-600 mt-0.5"></i>
                <p class="text-[11px] text-blue-800 leading-relaxed font-medium">
                   By submitting this application, you authorize DepEd Guihulngan City to verify the authenticity of your PDS records and attached documents.
                </p>
             </div>
          </div>

          <!-- Footer -->
          <div class="px-8 py-5 border-t border-[var(--border-main)] bg-[var(--surface-2)] flex items-center justify-between flex-shrink-0">
             <div v-if="applyError" class="text-[10px] font-bold text-rose-500 flex items-center gap-2">
                <i class="pi pi-exclamation-circle"></i> {{ applyError }}
             </div>
             <div v-else class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">
                Ready to submit
             </div>
             <div class="flex items-center gap-3">
                <AppButton variant="secondary" @click="closeModal">Cancel</AppButton>
                <AppButton @click="handleApply" :loading="applying" icon="pi-send" class="px-8 shadow-lg shadow-[var(--color-primary)]/20">
                   Submit Application
                </AppButton>
             </div>
          </div>
        </template>

        <!-- STEP 2: Success -->
        <template v-else>
           <div class="p-12 flex flex-col items-center text-center gap-6">
              <div class="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
                 <i class="pi pi-check text-4xl"></i>
              </div>
              <div>
                 <h2 class="text-2xl font-black text-[var(--text-main)] tracking-tight">Application Submitted!</h2>
                 <p class="text-sm text-[var(--text-muted)] mt-2 max-w-sm mx-auto leading-relaxed">
                   Your application for <strong>{{ job.positionTitle }}</strong> has been successfully recorded. 
                   You can track your progress in the "My Applications" section.
                 </p>
              </div>
              <div class="flex flex-col gap-3 w-full max-w-xs">
                 <router-link to="/user/applications" custom v-slot="{ navigate }">
                    <AppButton @click="navigate" block class="!rounded-2xl">Track My Progress</AppButton>
                 </router-link>
                 <AppButton variant="secondary" @click="closeModal" block class="!rounded-2xl">Browse Other Vacancies</AppButton>
              </div>
           </div>
        </template>

      </div>
    </div>
  </Teleport>
</template>
