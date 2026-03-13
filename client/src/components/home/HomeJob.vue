<script setup>
import { ref, computed, onMounted } from 'vue';
import apiClient from '@/api/axios';

const emit = defineEmits(['open-job']);

const searchQuery = ref('');
const selectedTrack = ref(null);
const jobList = ref([]);
const loading = ref(false);

const tracks = [
    { value: 'teaching', label: 'Teaching' },
    { value: 'teaching_related', label: 'Teaching-Related' },
    { value: 'non_teaching', label: 'Non-Teaching' },
];

const toggleTrack = (val) => {
    selectedTrack.value = selectedTrack.value === val ? null : val;
};

const filteredJobs = computed(() => {
    return jobList.value.filter(job => {
        const matchesSearch = !searchQuery.value ||
            job.positionTitle?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            job.placeOfAssignment?.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesTrack = !selectedTrack.value || job.hiringTrack === selectedTrack.value;
        return matchesSearch && matchesTrack;
    });
});

onMounted(async () => {
    loading.value = true;
    try {
        const { data } = await apiClient.get('/v1/jobs', { params: { status: 'published' } });
        jobList.value = data.data || [];
    } catch {
        // silently fail on homepage
    } finally {
        loading.value = false;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('emerge-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    setTimeout(() => {
        document.querySelectorAll('#jobs .emerge-hidden').forEach((el) => {
            observer.observe(el);
        });
    }, 100);
});
</script>

<template>
    <section id="jobs" class="py-24 px-8 bg-slate-50 border-y border-slate-200 relative">
        <div class="max-w-[95rem] mx-auto w-full">

            <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 emerge-hidden">
                <div class="border-l-4 border-slate-900 pl-6">
                    <span class="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">Join Our Team</span>
                    <h2 class="text-3xl font-bold text-slate-900 tracking-tight">Active Vacancies</h2>
                </div>

                <div class="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div class="relative w-full sm:w-72">
                        <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none text-xs"></i>
                        <input type="text" v-model="searchQuery" placeholder="Search position..."
                            class="w-full pl-10 pr-4 py-2.5 text-sm rounded border border-slate-300 bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm outline-none" />
                    </div>

                    <div class="flex bg-white p-1 rounded border border-slate-300 whitespace-nowrap overflow-x-auto w-full sm:w-auto">
                        <button v-for="t in tracks" :key="t.value"
                            @click="toggleTrack(t.value)"
                            :class="['px-5 py-2 text-xs rounded-sm font-bold transition-all duration-200 outline-none',
                                selectedTrack === t.value ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900']">
                            {{ t.label }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Loading skeletons -->
            <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div v-for="i in 3" :key="i" class="h-48 rounded-md bg-slate-200 animate-pulse"></div>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 emerge-hidden">
                <div v-for="job in filteredJobs" :key="job._id" @click="emit('open-job', job)"
                    class="bg-white rounded-md border border-slate-200 hover:border-slate-400 transition-colors duration-200 cursor-pointer flex flex-col h-full relative group"
                    style="min-height: 180px; padding: 28px;">

                    <div class="flex justify-between items-start mb-6">
                        <span class="text-[10px] font-bold text-slate-900 uppercase tracking-widest">
                            {{ job.placeOfAssignment || 'DIVISION OFFICE' }}
                        </span>
                        <span class="text-[10px] font-semibold border border-slate-200 text-slate-600 rounded px-2.5 py-1 capitalize">
                            {{ job.hiringTrack?.replace('_', '-') || 'General' }}
                        </span>
                    </div>

                    <h3 class="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-slate-600 transition-colors">
                        {{ job.positionTitle }}
                    </h3>
                    <p class="text-sm text-slate-500 line-clamp-2 mb-8 flex-grow leading-relaxed">
                        {{ job.description }}
                    </p>

                    <div class="mt-auto border-t border-slate-100 pt-5 flex items-center justify-between text-sm">
                        <div class="flex items-center gap-2 text-slate-600 font-semibold">
                            <i class="pi pi-briefcase text-xs"></i>
                            SG-{{ job.salaryGrade }} &middot; &#8369;{{ Number(job.salary).toLocaleString() }}/mo
                        </div>
                        <span class="text-[10px] text-slate-400 group-hover:text-slate-900 font-bold uppercase tracking-widest transition-colors flex items-center gap-1">
                            Details <i class="pi pi-arrow-right text-[8px] mt-[1px]"></i>
                        </span>
                    </div>
                </div>

                <div v-if="!loading && filteredJobs.length === 0" class="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                    <i class="pi pi-search text-3xl mb-4 opacity-50"></i>
                    <p class="text-sm font-medium">No vacancies found matching your criteria.</p>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
@reference "@/assets/main.css";

.emerge-hidden {
    opacity: 0;
    transform: translateY(50px);
    transition: opacity 1.2s cubic-bezier(0.2, 0.8, 0.2, 1), transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.emerge-visible {
    opacity: 1;
    transform: translateY(0);
}
</style>
