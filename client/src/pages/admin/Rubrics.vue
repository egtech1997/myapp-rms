<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import apiClient from '@/api/axios'
import { AppPageHeader, AppBadge, AppButton } from '@/components/ui'

const toast = inject('$toast')
const loading  = ref(true)
const saving   = ref(false)
const activeTab = ref('teaching')

const tabs = [
  { id: 'teaching',         label: 'Teaching',        icon: 'pi-book'      },
  { id: 'teaching_related', label: 'Teaching-Related', icon: 'pi-sitemap'   },
  { id: 'non_teaching',     label: 'Non-Teaching',     icon: 'pi-briefcase' },
]

const rubrics = ref([])

const loadRubrics = async () => {
  loading.value = true
  try {
    const { data } = await apiClient.get('/v1/rubrics')
    rubrics.value = data.data || []
  } catch {
    toast.fire({ icon: 'error', title: 'Error', text: 'Failed to load rubrics.' })
  } finally { 
    loading.value = false 
  }
}

const activeRubric = computed(() => {
  return rubrics.value.find(r => r.category === activeTab.value)
})

const subtotal = computed(() => {
  if (!activeRubric.value) return 0
  return activeRubric.value.criteria
    .filter(c => !c.isPotential)
    .reduce((s, c) => s + (Number(c.maxPoints) || 0), 0)
})

const potentialSubtotal = computed(() => {
  if (!activeRubric.value) return 0
  return activeRubric.value.criteria
    .filter(c => c.isPotential)
    .reduce((s, c) => s + (Number(c.maxPoints) || 0), 0)
})

const grandTotal = computed(() => subtotal.value + potentialSubtotal.value)

const addCriteria = (isPotential = false) => {
  if (!activeRubric.value) return
  activeRubric.value.criteria.push({
    key: `custom_${Date.now()}`,
    label: 'New Criteria',
    maxPoints: 0,
    isPotential
  })
}

const removeCriteria = (index) => {
  activeRubric.value.criteria.splice(index, 1)
}

const save = async () => {
  saving.value = true
  try {
    await apiClient.put(`/v1/rubrics/${activeTab.value}`, activeRubric.value)
    toast.fire({ icon: 'success', title: 'Rubric Saved', text: `${tabs.find(t => t.id === activeTab.value)?.label} configuration updated.` })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Save Failed', text: err.response?.data?.message || 'Error occurred.' })
  } finally { 
    saving.value = false 
  }
}

onMounted(loadRubrics)
</script>

<template>
  <div class="flex flex-col gap-6 animate-fade-in-up">
    
    <AppPageHeader title="Scoring Rubrics" subtitle="Configure official DepEd point weights per hiring track." icon="pi-sliders-h">
      <template #actions>
        <button @click="loadRubrics"
          class="h-9 w-9 flex items-center justify-center rounded-xl border border-[var(--border-main)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-app)] transition-all shadow-sm"
          title="Reload">
          <i :class="['pi pi-refresh text-sm', { 'animate-spin': loading }]"></i>
        </button>
      </template>
    </AppPageHeader>

    <div v-if="loading" class="flex flex-col gap-4">
      <div v-for="n in 6" :key="n" class="h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border-main)] animate-pulse"></div>
    </div>

    <template v-else>
      <!-- HIRING TRACK TABS -->
      <div class="flex gap-1.5 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-1.5 shadow-sm">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
          :class="['flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
            activeTab === tab.id 
              ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary-ring)]/20' 
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)]']">
          <i :class="['pi text-[10px]', tab.icon]"></i>
          {{ tab.label }}
        </button>
      </div>

      <Transition name="tab-slide" mode="out-in">
        <div :key="activeTab" class="flex flex-col gap-6" v-if="activeRubric">

          <!-- TOTALS OVERVIEW -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-[var(--color-primary-light)] border border-[var(--color-primary-ring)]/20 rounded-2xl p-5 flex flex-col gap-1.5 relative overflow-hidden shadow-sm">
              <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] opacity-60">Part A: Credentials</p>
              <p class="text-3xl font-black text-[var(--color-primary)] tabular-nums">{{ subtotal }}</p>
              <div class="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4"><i class="pi pi-file text-6xl"></i></div>
            </div>
            
            <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col gap-1.5 relative overflow-hidden shadow-sm">
              <p class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 opacity-60">Part B: Potential</p>
              <p class="text-3xl font-black text-amber-700 tabular-nums">{{ potentialSubtotal }}</p>
              <div class="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4"><i class="pi pi-bolt text-6xl"></i></div>
            </div>

            <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col gap-1.5 relative overflow-hidden shadow-sm">
              <p class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 opacity-60">Total Maximum Points</p>
              <p class="text-3xl font-black text-emerald-700 tabular-nums">{{ grandTotal }}</p>
              <div class="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4"><i class="pi pi-verified text-6xl"></i></div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- PART A WEIGHTS -->
            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-3xl overflow-hidden shadow-sm">
              <div class="px-6 py-4 border-b border-[var(--border-main)] bg-[var(--bg-app)] flex items-center justify-between">
                <h3 class="text-xs font-black text-[var(--text-main)] uppercase tracking-[0.2em]">Part A: Credentials</h3>
                <button @click="addCriteria(false)" class="text-[10px] font-bold text-[var(--color-primary)] hover:underline uppercase tracking-widest">+ Add Field</button>
              </div>
              <div class="divide-y divide-[var(--border-main)]">
                <div v-for="(field, i) in activeRubric.criteria.filter(c => !c.isPotential)" :key="field.key" class="px-6 py-5 flex items-center gap-5 group hover:bg-[var(--bg-app)] transition-colors">
                  <div class="flex-1 min-w-0 flex flex-col gap-1">
                    <input v-model="field.label" class="text-sm font-bold text-[var(--text-main)] uppercase tracking-tight bg-transparent border-none p-0 focus:ring-0 outline-none w-full" />
                    <input v-model="field.key" class="text-[9px] text-[var(--text-muted)] font-mono bg-transparent border-none p-0 focus:ring-0 outline-none w-full" placeholder="database_key" />
                  </div>
                  <div class="flex items-center gap-3">
                    <input v-model.number="field.maxPoints" type="number" min="0" max="100" step="0.5"
                      class="w-20 h-10 text-center rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-black text-[var(--text-main)] focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] outline-none transition-all tabular-nums" />
                    <button @click="removeCriteria(activeRubric.criteria.indexOf(field))" class="text-red-400 hover:text-red-600 transition-colors"><i class="pi pi-trash text-xs"></i></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- PART B WEIGHTS -->
            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-3xl overflow-hidden shadow-sm flex flex-col">
              <div class="px-6 py-4 border-b border-[var(--border-main)] bg-amber-50 flex items-center justify-between">
                <h3 class="text-xs font-black text-amber-800 uppercase tracking-[0.2em]">Part B: Potential</h3>
                <button @click="addCriteria(true)" class="text-[10px] font-bold text-amber-600 hover:underline uppercase tracking-widest">+ Add Field</button>
              </div>
              <div class="divide-y divide-[var(--border-main)] flex-1">
                <div v-for="(field, i) in activeRubric.criteria.filter(c => c.isPotential)" :key="field.key" class="px-6 py-5 flex items-center gap-5 group hover:bg-amber-50/30 transition-colors">
                  <div class="flex-1 min-w-0 flex flex-col gap-1">
                    <input v-model="field.label" class="text-sm font-bold text-[var(--text-main)] uppercase tracking-tight bg-transparent border-none p-0 focus:ring-0 outline-none w-full" />
                    <input v-model="field.key" class="text-[9px] text-[var(--text-muted)] font-mono bg-transparent border-none p-0 focus:ring-0 outline-none w-full" placeholder="database_key" />
                  </div>
                  <div class="flex items-center gap-3">
                    <input v-model.number="field.maxPoints" type="number" min="0" max="100" step="0.5"
                      class="w-20 h-10 text-center rounded-xl bg-[var(--bg-app)] border border-amber-100 text-sm font-black text-[var(--text-main)] focus:ring-2 focus:ring-amber-200/50 focus:border-amber-400 outline-none transition-all tabular-nums" />
                    <button @click="removeCriteria(activeRubric.criteria.indexOf(field))" class="text-red-400 hover:text-red-600 transition-colors"><i class="pi pi-trash text-xs"></i></button>
                  </div>
                </div>
              </div>
              
              <div class="p-6 bg-[var(--bg-app)] border-t border-[var(--border-main)] mt-auto">
                <AppButton variant="primary" class="w-full h-12 rounded-2xl shadow-primary font-black uppercase tracking-[0.2em] text-xs" 
                  @click="save" :loading="saving">
                  <i class="pi pi-save mr-2"></i> Save Rubric
                </AppButton>
              </div>
            </div>

          </div>

        </div>
      </Transition>
    </template>
  </div>
</template>

<style scoped>
.tab-slide-enter-active, .tab-slide-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.tab-slide-enter-from { opacity: 0; transform: translateX(10px); }
.tab-slide-leave-to { opacity: 0; transform: translateX(-10px); }
</style>
