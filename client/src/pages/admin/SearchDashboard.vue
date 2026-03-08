<script setup>
import { ref, watch, onMounted } from 'vue'
import apiClient from '@/api/axios'
import { AppCard, AppBadge, AppButton, AppAvatar, AppInput } from '@/components/ui'
import PDSExport from '@/components/admin/PDSExport.vue'
import { debounce } from 'lodash-es'

const results = ref([])
const loading = ref(false)
const total = ref(0)
const q = ref('')
const page = ref(1)

const filters = ref({
  educationLevel: '',
  status: '',
  jobId: ''
})

const fetchResults = async () => {
  loading.value = true
  try {
    const { data } = await apiClient.get('/v1/search', {
      params: { 
        q: q.value, 
        page: page.value,
        ...filters.value 
      }
    })
    results.value = data.data
    total.value = data.total
  } catch (err) {
    console.error('Search failed', err)
  } finally {
    loading.value = false
  }
}

const debouncedSearch = debounce(fetchResults, 500)

watch([q, filters], () => {
  page.value = 1
  debouncedSearch()
}, { deep: true })

const getEduBadge = (level) => {
  switch (level) {
    case 'Masteral': return 'success'
    case 'Doctorate': return 'primary'
    default: return 'secondary'
  }
}

const highlight = (text, query) => {
  if (!query) return text
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded text-black font-bold">$1</mark>')
}

onMounted(fetchResults)
</script>

<template>
  <div class="flex flex-col gap-6 animate-fade-in">
    <!-- Search Bar & Statistics -->
    <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
      <div class="w-full md:max-w-2xl relative">
        <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"></i>
        <input 
          v-model="q" 
          type="text" 
          placeholder="Search by name, degree, position, or application code..." 
          class="w-full h-14 pl-12 pr-4 bg-[var(--surface)] border-2 border-[var(--border-main)] rounded-2xl text-base font-medium focus:border-[var(--color-primary)] outline-none shadow-sm transition-all"
        />
      </div>
      <div class="flex gap-3">
        <div class="text-right hidden md:block">
          <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Records Indexed</p>
          <p class="text-2xl font-black text-[var(--text-main)] tracking-tighter">{{ total }} Applicants</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Filters Sidebar -->
      <div class="lg:col-span-1 space-y-6">
        <div class="p-6 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-sm space-y-6 sticky top-24">
          <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Advanced Filters</h3>
          
          <div class="space-y-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-black text-[var(--text-faint)] uppercase">Education Level</label>
              <select v-model="filters.educationLevel" class="input text-xs">
                <option value="">Any Level</option>
                <option value="Bachelor">Bachelor's Degree</option>
                <option value="Masteral">Master's Degree</option>
                <option value="Doctorate">Doctorate Degree</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-black text-[var(--text-faint)] uppercase">Application Status</label>
              <select v-model="filters.status" class="input text-xs">
                <option value="">Any Status</option>
                <option value="ranked">Ranked (RQA)</option>
                <option value="comparative_assessment">Under Assessment</option>
                <option value="appointed">Appointed</option>
              </select>
            </div>
          </div>

          <AppButton variant="secondary" class="w-full" size="sm" @click="q = ''; Object.keys(filters).forEach(k => filters[k] = '')">
            Clear All
          </AppButton>
        </div>
      </div>

      <!-- Results Grid -->
      <div class="lg:col-span-3 space-y-4">
        <div v-if="loading" v-for="i in 3" :key="i" class="h-32 bg-white rounded-2xl border border-[var(--border-main)] animate-pulse"></div>
        
        <div v-else-if="results.length === 0" class="p-20 text-center bg-[var(--surface)] rounded-2xl border-2 border-dashed border-[var(--border-main)]">
          <i class="pi pi-search text-4xl text-[var(--text-faint)] mb-4"></i>
          <p class="text-sm font-black text-[var(--text-main)]">No results found for "{{ q }}"</p>
          <p class="text-xs text-[var(--text-muted)] mt-1">Try adjusting your filters or keywords.</p>
        </div>

        <div v-else v-for="app in results" :key="app._id" 
          class="p-6 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-sm hover:border-[var(--color-primary-ring)] transition-all group cursor-pointer">
          
          <div class="flex items-start gap-4">
            <AppAvatar :src="app.applicant?.avatarUrl" :name="app.applicantData.personalInfo.lastName" size="lg" />
            
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="text-base font-black text-[var(--text-main)] leading-tight group-hover:text-[var(--color-primary)] transition-colors"
                    v-html="highlight(`${app.applicantData.personalInfo.firstName} ${app.applicantData.personalInfo.lastName}`, q)">
                  </h4>
                  <p class="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-tighter">{{ app.applicationCode }}</p>
                </div>
                <AppBadge :variant="app.status === 'ranked' ? 'success' : 'gold'" size="xs">{{ app.status }}</AppBadge>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <div v-for="edu in app.applicantData.education.slice(0, 1)" :key="edu._id" 
                  class="flex items-center gap-2 px-3 py-1 bg-[var(--surface-2)] rounded-lg border border-[var(--border-main)]">
                  <i class="pi pi-graduation-cap text-[10px]"></i>
                  <span class="text-[10px] font-black text-[var(--text-muted)] uppercase" v-html="highlight(edu.degree || edu.level, q)"></span>
                </div>
                
                <div v-for="exp in app.applicantData.experience.slice(0, 1)" :key="exp._id"
                  class="flex items-center gap-2 px-3 py-1 bg-[var(--surface-2)] rounded-lg border border-[var(--border-main)]">
                  <i class="pi pi-briefcase text-[10px]"></i>
                  <span class="text-[10px] font-black text-[var(--text-muted)] uppercase" v-html="highlight(exp.position, q)"></span>
                </div>
              </div>
            </div>

            <div class="text-right border-l border-[var(--border-main)] pl-6 ml-4 hidden sm:block">
              <p class="text-2xl font-black text-[var(--text-main)] tracking-tighter">{{ app.totalScore.toFixed(2) }}</p>
              <p class="text-[9px] font-bold text-[var(--text-faint)] uppercase">Total Points</p>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="total > 20" class="flex justify-center pt-6">
          <AppButton variant="secondary" size="sm" @click="page++" :loading="loading">Load More</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
