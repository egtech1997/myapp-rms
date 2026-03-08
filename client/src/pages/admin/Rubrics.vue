<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import apiClient from '@/api/axios'
import { AppPageHeader } from '@/components/ui'

const loading  = ref(true)
const saving   = ref(false)
const activeTab = ref('teaching')

const tabs = [
  { id: 'teaching',         label: 'Teaching',        icon: 'pi-book'      },
  { id: 'teaching_related', label: 'Teaching-Related', icon: 'pi-sitemap'   },
  { id: 'non_teaching',     label: 'Non-Teaching',     icon: 'pi-briefcase' },
]

const rubrics = reactive({
  teaching:         makeWeights(),
  teaching_related: makeWeights(),
  non_teaching:     makeWeights(),
})
const activeRubric = reactive({ teaching: true, teaching_related: true, non_teaching: true })

function makeWeights() {
  return {
    education: 0, training: 0, experience: 0, performance: 0,
    outstandingAccomplishments: 0, appEducation: 0, appLearning: 0,
    potential: { writtenTest: 0, bei: 0, workSample: 0 },
  }
}

const criteriaFields = [
  { key: 'education',                 label: 'Education',                   desc: 'Max pts for educational qualifications',       icon: 'pi-graduation-cap' },
  { key: 'training',                  label: 'Training (last 5 yrs)',       desc: 'Max pts for relevant training & seminars',     icon: 'pi-star'           },
  { key: 'experience',                label: 'Experience',                  desc: 'Max pts for work experience',                  icon: 'pi-history'        },
  { key: 'performance',               label: 'Performance Rating',          desc: 'Max pts for latest performance rating',        icon: 'pi-chart-bar'      },
  { key: 'outstandingAccomplishments', label: 'Outstanding Accomplishments', desc: 'Max pts for awards & recognition',             icon: 'pi-trophy'         },
  { key: 'appEducation',              label: 'App. Education',              desc: 'Max pts for additional education points',      icon: 'pi-book'           },
  { key: 'appLearning',               label: 'App. Learning',               desc: 'Max pts for additional learning development',  icon: 'pi-lightbulb'      },
]
const potentialFields = [
  { key: 'writtenTest', label: 'Written Examination', desc: 'Max pts for written test'         },
  { key: 'bei',         label: 'BEI',                 desc: 'Behavioral Event Interview'        },
  { key: 'workSample',  label: 'Work Sample',         desc: 'Max pts for work sample demo'      },
]

const currentWeights   = computed(() => rubrics[activeTab.value])
const subtotal         = computed(() => ['education','training','experience','performance','outstandingAccomplishments','appEducation','appLearning'].reduce((s,k) => s + (Number(currentWeights.value[k]) || 0), 0))
const potentialSubtotal = computed(() => ['writtenTest','bei','workSample'].reduce((s,k) => s + (Number(currentWeights.value.potential[k]) || 0), 0))
const grandTotal       = computed(() => subtotal.value + potentialSubtotal.value)

const loadRubrics = async () => {
  loading.value = true
  try {
    const { data } = await apiClient.get('/v1/rubrics')
    for (const r of (data.data || [])) {
      if (!rubrics[r.category]) continue
      activeRubric[r.category] = r.active ?? true
      const w = r.weights || {}
      rubrics[r.category].education                  = w.education                  ?? 0
      rubrics[r.category].training                   = w.training                   ?? 0
      rubrics[r.category].experience                 = w.experience                 ?? 0
      rubrics[r.category].performance                = w.performance                ?? 0
      rubrics[r.category].outstandingAccomplishments = w.outstandingAccomplishments ?? 0
      rubrics[r.category].appEducation               = w.appEducation               ?? 0
      rubrics[r.category].appLearning                = w.appLearning                ?? 0
      rubrics[r.category].potential.writtenTest       = w.potential?.writtenTest     ?? 0
      rubrics[r.category].potential.bei              = w.potential?.bei             ?? 0
      rubrics[r.category].potential.workSample       = w.potential?.workSample      ?? 0
    }
  } catch { showToast('Failed to load rubrics.', 'error') }
  finally { loading.value = false }
}

const save = async () => {
  saving.value = true
  const cat = activeTab.value
  const w   = rubrics[cat]
  try {
    await apiClient.put(`/v1/rubrics/${cat}`, {
      active: activeRubric[cat],
      weights: {
        education: Number(w.education), training: Number(w.training),
        experience: Number(w.experience), performance: Number(w.performance),
        outstandingAccomplishments: Number(w.outstandingAccomplishments),
        appEducation: Number(w.appEducation), appLearning: Number(w.appLearning),
        potential: {
          writtenTest: Number(w.potential.writtenTest),
          bei:         Number(w.potential.bei),
          workSample:  Number(w.potential.workSample),
        },
      },
    })
    showToast(`${tabs.find(t => t.id === cat)?.label} rubric saved.`)
  } catch (err) {
    showToast(err.response?.data?.message || 'Save failed.', 'error')
  } finally { saving.value = false }
}

const toastMsg = ref(''); const toastType = ref('success'); const toastVisible = ref(false); let toastTimer = null
const showToast = (msg, type = 'success') => {
  toastMsg.value = msg; toastType.value = type; toastVisible.value = true
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastVisible.value = false }, 3000)
}

onMounted(loadRubrics)
</script>

<template>
  <div class="flex flex-col gap-6">

    <Transition name="slide-down">
      <div v-if="toastVisible" :class="['fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border',
        toastType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700']">
        <i :class="['pi', toastType === 'success' ? 'pi-check-circle' : 'pi-times-circle']"></i>
        {{ toastMsg }}
      </div>
    </Transition>

    <div class="flex flex-col gap-6">
        <AppPageHeader title="Scoring Rubrics" subtitle="Configure DepEd MSP maximum point weights per hiring track." icon="pi-sliders-h">
          <template #actions>
            <button @click="loadRubrics"
              class="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--border-main)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-app)] transition-colors"
              title="Reload">
              <i class="pi pi-refresh text-sm"></i>
            </button>
          </template>
        </AppPageHeader>

        <div v-if="loading" class="flex flex-col gap-4">
        <div v-for="n in 6" :key="n" class="h-14 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] animate-pulse"></div>
        </div>

        <template v-else>
        <div class="flex gap-1 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-1">
            <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
            :class="['flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                activeTab === tab.id ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)]']">
            <i :class="['pi text-xs', tab.icon]"></i>{{ tab.label }}
            </button>
        </div>

        <Transition name="tab-slide" mode="out-in">
        <div :key="activeTab" class="flex flex-col gap-4">

        <div class="grid grid-cols-3 gap-4">
            <div class="bg-[var(--color-primary-light)] border border-blue-200 rounded-xl px-5 py-4 flex flex-col gap-1">
            <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">Criteria Total</p>
            <p class="text-2xl font-bold text-[var(--color-primary)]">{{ subtotal }}</p>
            <p class="text-[10px] text-[var(--color-primary)]">pts (excl. potential)</p>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex flex-col gap-1">
            <p class="text-[10px] font-bold uppercase tracking-wider text-amber-700">Potential Total</p>
            <p class="text-2xl font-bold text-amber-700">{{ potentialSubtotal }}</p>
            <p class="text-[10px] text-amber-400">pts (assessment phase)</p>
            </div>
            <div class="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex flex-col gap-1">
            <p class="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Grand Total</p>
            <p class="text-2xl font-bold text-emerald-700">{{ grandTotal }}</p>
            <p class="text-[10px] text-emerald-400">max possible points</p>
            </div>
        </div>

        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl px-5 py-3.5 flex items-center justify-between">
            <div>
            <p class="text-sm font-semibold text-[var(--text-main)]">Rubric Active</p>
            <p class="text-xs text-[var(--text-muted)] mt-0.5">Inactive rubrics won't be used for scoring.</p>
            </div>
            <button @click="activeRubric[activeTab] = !activeRubric[activeTab]"
            :class="['relative w-11 h-6 rounded-full transition-colors flex-shrink-0', activeRubric[activeTab] ? 'bg-[var(--color-primary)]' : 'bg-[var(--border-main)]']"
            role="switch" :aria-checked="activeRubric[activeTab]">
            <span :class="['absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', activeRubric[activeTab] ? 'translate-x-5' : 'translate-x-0']"></span>
            </button>
        </div>

        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl overflow-hidden">
            <div class="px-5 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)]">
            <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Criteria Maximum Points</p>
            </div>
            <div class="divide-y divide-[var(--border-main)]">
            <div v-for="field in criteriaFields" :key="field.key" class="flex items-center gap-4 px-5 py-4">
                <div class="w-9 h-9 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center flex-shrink-0">
                <i :class="['pi text-sm text-[var(--color-primary)]', field.icon]"></i>
                </div>
                <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-[var(--text-main)]">{{ field.label }}</p>
                <p class="text-xs text-[var(--text-muted)]">{{ field.desc }}</p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                <input v-model.number="currentWeights[field.key]" type="number" min="0" max="100" step="0.5"
                    class="w-24 h-9 px-3 text-center rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-bold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] transition-shadow" />
                <span class="text-xs text-[var(--text-muted)] w-6">pts</span>
                </div>
            </div>
            </div>
        </div>

        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl overflow-hidden">
            <div class="px-5 py-3 border-b border-[var(--border-main)] bg-amber-50">
            <div class="flex items-center gap-2">
                <i class="pi pi-bolt text-amber-600 text-xs"></i>
                <p class="text-xs font-bold uppercase tracking-wider text-amber-700">Potential Points (Assessment Phase)</p>
            </div>
            </div>
            <div class="divide-y divide-[var(--border-main)]">
            <div v-for="field in potentialFields" :key="field.key" class="flex items-center gap-4 px-5 py-4">
                <div class="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                <i class="pi pi-star-fill text-sm text-amber-500"></i>
                </div>
                <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-[var(--text-main)]">{{ field.label }}</p>
                <p class="text-xs text-[var(--text-muted)]">{{ field.desc }}</p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                <input v-model.number="currentWeights.potential[field.key]" type="number" min="0" max="100" step="0.5"
                    class="w-24 h-9 px-3 text-center rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-bold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] transition-shadow" />
                <span class="text-xs text-[var(--text-muted)] w-6">pts</span>
                </div>
            </div>
            </div>
        </div>

        <div class="flex justify-end">
            <button @click="save" :disabled="saving"
            class="btn-primary h-10 px-6 text-sm disabled:opacity-50 flex items-center gap-2">
            <i v-if="saving" class="pi pi-spin pi-spinner text-xs"></i>
            <i v-else class="pi pi-save text-xs"></i>
            {{ saving ? 'Saving...' : `Save ${tabs.find(t => t.id === activeTab)?.label} Rubric` }}
            </button>
        </div>

        </div>
        </Transition>
        </template>
    </div>
  </div>
</template>
