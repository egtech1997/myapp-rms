<script setup>
import { ref, computed, onMounted } from 'vue'
import apiClient from '@/api/axios'
import { resolveUrl } from '@/utils/url'

const emit = defineEmits(['open-bulletin'])

const showAll      = ref(false)
const activeType   = ref('all')
const announcements = ref([])
const loading      = ref(true)

// ── Type metadata — mirrors server enum ──────────────────────────────────────
const TYPE_META = {
  general:            { label: 'General',           icon: 'pi-bell',         badge: 'bg-slate-100 text-slate-600 border-slate-200',         grad: 'from-slate-500 to-slate-700' },
  interview_schedule: { label: 'Interview',         icon: 'pi-calendar',     badge: 'bg-sky-100 text-sky-700 border-sky-200',               grad: 'from-sky-500 to-sky-700' },
  results:            { label: 'Results',           icon: 'pi-check-circle', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',   grad: 'from-emerald-500 to-emerald-700' },
  memorandum:         { label: 'Memorandum',        icon: 'pi-file',         badge: 'bg-rose-100 text-rose-700 border-rose-200',            grad: 'from-rose-400 to-rose-600' },
  event:              { label: 'Event',             icon: 'pi-star',         badge: 'bg-violet-100 text-violet-700 border-violet-200',      grad: 'from-violet-500 to-violet-700' },
  award:              { label: 'Award',             icon: 'pi-trophy',       badge: 'bg-amber-100 text-amber-700 border-amber-200',         grad: 'from-amber-400 to-amber-600' },
  policy:             { label: 'Policy',            icon: 'pi-book',         badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',      grad: 'from-indigo-500 to-indigo-700' },
  training:           { label: 'Training',          icon: 'pi-desktop',      badge: 'bg-teal-100 text-teal-700 border-teal-200',            grad: 'from-teal-500 to-teal-700' },
  system:             { label: 'System Update',     icon: 'pi-cog',          badge: 'bg-orange-100 text-orange-700 border-orange-200',      grad: 'from-orange-400 to-orange-600' },
  ier_release:        { label: 'IER Release',       icon: 'pi-list',         badge: 'bg-purple-100 text-purple-700 border-purple-200',      grad: 'from-purple-500 to-purple-700' },
  rqa_release:        { label: 'RQA Release',       icon: 'pi-chart-bar',    badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',            grad: 'from-cyan-500 to-cyan-700' },
}

const typeMeta = (type) => TYPE_META[type] || TYPE_META.general

// Filter pills: only types that appear in the fetched data
const availableTypes = computed(() => {
  const seen = new Set(announcements.value.map(a => a.type))
  return ['all', ...Object.keys(TYPE_META).filter(t => seen.has(t))]
})

const filteredAnnouncements = computed(() => {
  if (activeType.value === 'all') return announcements.value
  return announcements.value.filter(a => a.type === activeType.value)
})

const displayedAnnouncements = computed(() =>
  showAll.value ? filteredAnnouncements.value : filteredAnnouncements.value.slice(0, 6)
)

const typeCount = (type) => {
  if (type === 'all') return announcements.value.length
  return announcements.value.filter(a => a.type === type).length
}

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const excerpt = (content) => {
  if (!content) return ''
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 110)
}

async function fetchAnnouncements() {
  try {
    const { data } = await apiClient.get('/v1/announcements')
    announcements.value = data.data || []
  } catch (e) {
    console.error('Failed to load announcements', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchAnnouncements()

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('emerge-visible')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })

  setTimeout(() => {
    document.querySelectorAll('#announcements .emerge-hidden').forEach(el => {
      observer.observe(el)
    })
  }, 150)
})
</script>

<template>
  <section id="announcements" class="py-20 px-8" style="background: #FAFAFA;">
    <div class="max-w-[1400px] mx-auto w-full">

      <!-- Section header -->
      <div class="text-center mb-12 emerge-hidden">
        <div class="inline-flex items-center gap-3 mb-4">
          <div class="h-px w-10" style="background:#D6A5B0;"></div>
          <span class="text-[10px] font-black uppercase tracking-[0.22em]" style="color:#B07080;">DepEd Updates</span>
          <div class="h-px w-10" style="background:#D6A5B0;"></div>
        </div>
        <h2 class="text-4xl lg:text-5xl font-black leading-tight" style="color:#2D3748;">DepEd Announcements</h2>
        <p class="text-sm font-medium mt-3 max-w-md mx-auto" style="color:#607080;">
          Stay informed with the latest official news, events, and updates from DepEd SDO Guihulngan City.
        </p>
      </div>

      <!-- Skeleton loader -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <div v-for="i in 6" :key="i" class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="h-44 bg-slate-100 animate-pulse"></div>
          <div class="p-5 space-y-3">
            <div class="h-3 bg-slate-100 rounded animate-pulse w-1/3"></div>
            <div class="h-4 bg-slate-100 rounded animate-pulse w-3/4"></div>
            <div class="h-3 bg-slate-100 rounded animate-pulse w-full"></div>
            <div class="h-3 bg-slate-100 rounded animate-pulse w-2/3"></div>
          </div>
        </div>
      </div>

      <template v-else>
        <!-- Category filter pills -->
        <div
          v-if="availableTypes.length > 1"
          class="flex flex-wrap items-center justify-center gap-2 mb-10 emerge-hidden"
          style="transition-delay: 80ms;"
        >
          <button
            v-for="type in availableTypes"
            :key="type"
            @click="activeType = type; showAll = false"
            class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 outline-none"
            :style="activeType === type
              ? 'background:#2D3748; color:#fff; border-color:#2D3748; box-shadow:0 2px 8px rgba(45,55,72,0.25);'
              : 'background:#fff; color:#607080; border-color:#DDE1EC;'"
          >
            <i v-if="type !== 'all'" :class="['pi text-[10px]', typeMeta(type).icon]"></i>
            <i v-else class="pi pi-th-large text-[10px]"></i>
            {{ type === 'all' ? 'All' : typeMeta(type).label }}
            <span
              class="ml-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full"
              :style="activeType === type ? 'background:rgba(255,255,255,0.2); color:#fff;' : 'background:#EEF1F7; color:#9DAABB;'"
            >{{ typeCount(type) }}</span>
          </button>
        </div>

        <!-- Cards grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 emerge-hidden" style="transition-delay: 120ms;">

          <div
            v-for="item in displayedAnnouncements"
            :key="item._id"
            class="rounded-2xl border shadow-sm flex flex-col overflow-hidden bulletin-card"
            style="background:#fff; border-color:#E8EBF3;"
          >
            <!-- Thumbnail or gradient placeholder -->
            <div class="relative overflow-hidden shrink-0" style="height:176px;">
              <img
                v-if="item.image"
                :src="resolveUrl(item.image)"
                :alt="item.title"
                class="w-full h-full object-cover bulletin-img"
              />
              <div
                v-else
                :class="['w-full h-full bg-gradient-to-br flex items-center justify-center', typeMeta(item.type).grad]"
              >
                <i :class="['pi text-5xl text-white/40', typeMeta(item.type).icon]"></i>
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

              <!-- Type badge -->
              <div class="absolute top-3 left-3">
                <span :class="['flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border', typeMeta(item.type).badge]">
                  <i :class="['pi text-[8px]', typeMeta(item.type).icon]"></i>
                  {{ typeMeta(item.type).label }}
                </span>
              </div>

              <!-- Attachment count badge -->
              <div v-if="item.attachments?.length" class="absolute top-3 right-3">
                <span class="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black bg-black/40 text-white backdrop-blur-sm border border-white/20">
                  <i class="pi pi-paperclip text-[8px]"></i>
                  {{ item.attachments.length }}
                </span>
              </div>
            </div>

            <!-- Card body -->
            <div class="flex flex-col flex-1 p-5">
              <!-- Date + venue meta -->
              <div class="flex items-center gap-2 text-[10px] font-semibold mb-3" style="color:#9DAABB;">
                <template v-if="item.scheduledDate">
                  <i class="pi pi-calendar text-[10px]"></i>
                  <span>{{ formatDate(item.scheduledDate) }}</span>
                  <span v-if="item.scheduledTime" class="opacity-60">· {{ item.scheduledTime }}</span>
                </template>
                <template v-else>
                  <i class="pi pi-clock text-[10px]"></i>
                  <span>{{ formatDate(item.createdAt) }}</span>
                </template>
                <template v-if="item.venue">
                  <span class="mx-1" style="color:#DDE1EC;">|</span>
                  <i class="pi pi-map-marker text-[10px]"></i>
                  <span class="truncate max-w-[100px]">{{ item.venue }}</span>
                </template>
              </div>

              <!-- Title -->
              <h3 class="font-black text-base leading-snug mb-2 line-clamp-2" style="color:#2D3748;">{{ item.title }}</h3>

              <!-- Excerpt -->
              <p class="text-sm leading-relaxed line-clamp-2 flex-grow mb-4" style="color:#607080;">
                {{ excerpt(item.content) }}
              </p>

              <!-- Footer -->
              <div class="flex items-center justify-between pt-4 mt-auto" style="border-top:1px solid #EEF1F7;">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0" style="background:#7EA9D7; font-size:9px; font-weight:900;">
                    {{ (item.postedBy?.username || 'D')[0].toUpperCase() }}
                  </div>
                  <span class="text-[10px] font-bold" style="color:#9DAABB;">
                    {{ item.postedBy?.username || 'DepEd SDO' }}
                  </span>
                </div>
                <button
                  @click="emit('open-bulletin', item)"
                  class="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all duration-200 outline-none bulletin-link"
                  style="color:#7EA9D7;"
                >
                  Read More
                  <i class="pi pi-arrow-right text-[9px]"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-if="displayedAnnouncements.length === 0"
            class="col-span-full py-16 flex flex-col items-center justify-center"
            style="color:#9DAABB;"
          >
            <i class="pi pi-inbox text-4xl mb-4 opacity-40"></i>
            <p class="text-sm font-semibold">No announcements in this category.</p>
          </div>
        </div>

        <!-- See All / Show Less -->
        <div v-if="filteredAnnouncements.length > 6" class="flex justify-center mt-10 emerge-hidden" style="transition-delay: 200ms;">
          <button
            @click="showAll = !showAll"
            class="flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 outline-none bulletin-see-all"
            style="border:2px solid #DDE1EC; color:#607080; background:#fff;"
          >
            <i :class="['pi text-sm', showAll ? 'pi-angle-up' : 'pi-angle-down']"></i>
            {{ showAll ? 'Show Less' : 'See All Announcements' }}
          </button>
        </div>
      </template>

    </div>
  </section>
</template>

<style scoped>
.emerge-hidden {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 1s cubic-bezier(0.2, 0.8, 0.2, 1), transform 1s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.emerge-visible {
  opacity: 1;
  transform: translateY(0);
}

.bulletin-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}
.bulletin-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(45, 55, 72, 0.08);
  border-color: #C7D8EE;
}
.bulletin-card:hover .bulletin-img {
  transform: scale(1.05);
}
.bulletin-img {
  transition: transform 0.5s ease;
}

.bulletin-link:hover {
  color: #5B84BA;
}

.bulletin-see-all:hover {
  border-color: #7EA9D7;
  color: #2D3748;
}
</style>
