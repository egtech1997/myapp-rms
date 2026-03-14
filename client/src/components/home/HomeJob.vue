<script setup>
import { ref, computed, onMounted } from 'vue';
import apiClient from '@/api/axios';

const emit = defineEmits(['open-job']);

const searchQuery = ref('');
const selectedTrack = ref('all');
const jobList = ref([]);
const loading = ref(false);

const tracks = [
    { value: 'all',             label: 'All Positions',   icon: 'pi-th-large' },
    { value: 'teaching',        label: 'Teaching',        icon: 'pi-graduation-cap' },
    { value: 'teaching_related',label: 'Teaching-Related',icon: 'pi-book' },
    { value: 'non_teaching',    label: 'Non-Teaching',    icon: 'pi-building' },
];

const TRACK_STYLE = {
    teaching:         { bar: 'bg-blue-500',   pill: 'bg-blue-50 text-blue-700 border-blue-200',   label: 'Teaching',         count_bg: 'bg-blue-500' },
    teaching_related: { bar: 'bg-violet-500', pill: 'bg-violet-50 text-violet-700 border-violet-200', label: 'Teaching-Related', count_bg: 'bg-violet-500' },
    non_teaching:     { bar: 'bg-amber-500',  pill: 'bg-amber-50 text-amber-700 border-amber-200',  label: 'Non-Teaching',     count_bg: 'bg-amber-500' },
};

const trackStyle = (track) => TRACK_STYLE[track] || TRACK_STYLE.non_teaching;

const trackCounts = computed(() => {
    const counts = { all: jobList.value.length, teaching: 0, teaching_related: 0, non_teaching: 0 };
    jobList.value.forEach(j => {
        if (counts[j.hiringTrack] !== undefined) counts[j.hiringTrack]++;
    });
    return counts;
});

const filteredJobs = computed(() => {
    return jobList.value.filter(job => {
        const matchesSearch = !searchQuery.value ||
            job.positionTitle?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            job.placeOfAssignment?.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesTrack = selectedTrack.value === 'all' || job.hiringTrack === selectedTrack.value;
        return matchesSearch && matchesTrack;
    });
});

const daysLeft = (d) => {
    if (!d) return null;
    return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
};

const deadlineInfo = (job) => {
    const days = daysLeft(job.deadline);
    if (days === null) return { label: 'Open', cls: 'text-slate-400', icon: 'pi-clock' };
    if (days < 0)      return { label: 'Closed', cls: 'text-red-400', icon: 'pi-times-circle' };
    if (days === 0)    return { label: 'Ends today', cls: 'text-red-600 font-black', icon: 'pi-exclamation-circle' };
    if (days <= 3)     return { label: `${days}d left`, cls: 'text-red-600 font-bold', icon: 'pi-exclamation-circle' };
    if (days <= 7)     return { label: `${days}d left`, cls: 'text-amber-600 font-semibold', icon: 'pi-clock' };
    return { label: new Date(job.deadline).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }), cls: 'text-emerald-600', icon: 'pi-calendar' };
};

const locationText = (job) => {
    if (!job.placeOfAssignment) return 'Schools Division Office';
    if (Array.isArray(job.placeOfAssignment)) return job.placeOfAssignment.join(', ');
    return job.placeOfAssignment;
};

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
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    setTimeout(() => {
        document.querySelectorAll('#jobs .emerge-hidden').forEach((el) => {
            observer.observe(el);
        });
    }, 100);
});
</script>

<template>
    <section id="jobs" class="py-20 px-8 relative overflow-hidden" style="background: linear-gradient(135deg, #fff1f2 0%, #fce7f3 30%, #eff6ff 70%, #dbeafe 100%);">

        <!-- Subtle background decoration -->
        <div class="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none" style="background: radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%); transform: translate(30%, -30%);"></div>
        <div class="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none" style="background: radial-gradient(circle, rgba(251,113,133,0.12) 0%, transparent 70%); transform: translate(-30%, 30%);"></div>

        <div class="max-w-[1400px] mx-auto w-full relative z-10">

            <!-- Hero header strip -->
            <div class="text-center mb-10 emerge-hidden">
                <div class="inline-flex items-center gap-3 mb-4">
                    <div class="h-px w-10 bg-blue-300"></div>
                    <span class="text-[10px] font-black uppercase tracking-[0.22em] text-blue-500">Join Our Team</span>
                    <div class="h-px w-10 bg-blue-300"></div>
                </div>
                <h2 class="text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-3">Open Positions</h2>
                <p class="text-slate-500 text-sm font-medium max-w-lg mx-auto mb-6">Discover career opportunities at SDO Guihulngan City. Merit-based, transparent, and open to all qualified applicants.</p>

                <!-- Track count pills -->
                <div class="flex flex-wrap items-center justify-center gap-3">
                    <div v-for="t in tracks.slice(1)" :key="t.value"
                        class="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-slate-200 shadow-sm backdrop-blur-sm"
                    >
                        <span :class="['w-2 h-2 rounded-full', trackStyle(t.value).count_bg]"></span>
                        <span class="text-xs font-bold text-slate-600">{{ trackCounts[t.value] }}</span>
                        <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{{ t.label }}</span>
                    </div>
                    <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 shadow-sm">
                        <span class="text-xs font-black text-white">{{ trackCounts.all }}</span>
                        <span class="text-[10px] font-bold text-white/60 uppercase tracking-wider">Total</span>
                    </div>
                </div>
            </div>

            <!-- Search + Filter row -->
            <div class="flex flex-col sm:flex-row items-center gap-4 mb-8 emerge-hidden" style="transition-delay: 80ms;">

                <!-- Search input -->
                <div class="relative w-full sm:w-80">
                    <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none z-10"></i>
                    <input
                        type="text"
                        v-model="searchQuery"
                        placeholder="Search position or location..."
                        class="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-white/80 bg-white/90 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
                    />
                </div>

                <!-- Track filter tabs -->
                <div class="flex items-center gap-1 p-1 rounded-xl bg-white/80 border border-white shadow-sm backdrop-blur-sm overflow-x-auto no-scrollbar w-full sm:w-auto">
                    <button
                        v-for="t in tracks"
                        :key="t.value"
                        @click="selectedTrack = t.value"
                        class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 outline-none"
                        :class="selectedTrack === t.value
                            ? 'text-white shadow-md job-tab-active'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-pink-50/60'"
                    >
                        <i :class="['pi text-[10px]', t.icon]"></i>
                        {{ t.label }}
                    </button>
                </div>
            </div>

            <!-- Loading skeletons -->
            <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div v-for="i in 6" :key="i" class="rounded-2xl bg-white/70 overflow-hidden border border-slate-100 shadow-sm">
                    <div class="h-1.5 bg-slate-200 animate-pulse"></div>
                    <div class="p-5 space-y-3">
                        <div class="h-4 w-20 bg-slate-100 rounded-full animate-pulse"></div>
                        <div class="h-6 w-3/4 bg-slate-200 rounded-lg animate-pulse"></div>
                        <div class="h-4 w-1/2 bg-slate-100 rounded animate-pulse"></div>
                        <div class="h-4 w-2/3 bg-slate-100 rounded animate-pulse"></div>
                        <div class="h-px bg-slate-100 my-2"></div>
                        <div class="flex justify-between items-center">
                            <div class="h-4 w-32 bg-slate-100 rounded animate-pulse"></div>
                            <div class="h-8 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Job cards grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 emerge-hidden" style="transition-delay: 120ms;">

                <div
                    v-for="job in filteredJobs"
                    :key="job._id"
                    @click="emit('open-job', job)"
                    class="job-card bg-white/95 backdrop-blur-sm rounded-2xl border border-white/80 shadow-sm cursor-pointer flex flex-col overflow-hidden group"
                >
                    <!-- Colored accent bar at top -->
                    <div :class="['h-1.5 w-full shrink-0', trackStyle(job.hiringTrack).bar]"></div>

                    <div class="flex flex-col flex-1 p-5">

                        <!-- Track badge + Position code -->
                        <div class="flex items-center justify-between mb-3">
                            <span :class="[
                                'text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border',
                                trackStyle(job.hiringTrack).pill
                            ]">{{ trackStyle(job.hiringTrack).label }}</span>
                            <span v-if="job.positionCode" class="text-[9px] font-mono text-slate-400">{{ job.positionCode }}</span>
                        </div>

                        <!-- Position title -->
                        <h3 class="text-slate-900 font-black text-lg leading-snug mb-2 transition-colors duration-200 job-card-title">
                            {{ job.positionTitle }}
                        </h3>

                        <!-- Location -->
                        <div class="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-3">
                            <i class="pi pi-map-marker text-rose-400 text-[10px]"></i>
                            <span class="line-clamp-1">{{ locationText(job) }}</span>
                        </div>

                        <!-- Salary Grade + Pay -->
                        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 mb-3">
                            <i class="pi pi-briefcase text-slate-400 text-xs"></i>
                            <span class="text-xs font-black text-slate-700">SG-{{ job.salaryGrade || '—' }}</span>
                            <span class="text-slate-300 text-xs">·</span>
                            <span class="text-xs font-bold text-slate-600">&#8369;{{ Number(job.salary || 0).toLocaleString() }}/mo</span>
                        </div>

                        <!-- QS preview (if qualificationStandards exists) -->
                        <div v-if="job.qualificationStandards" class="space-y-1 mb-3">
                            <div v-if="job.qualificationStandards.education" class="flex items-start gap-1.5 text-[10px] text-slate-500">
                                <i class="pi pi-graduation-cap text-[9px] mt-0.5 shrink-0 text-slate-400"></i>
                                <span class="line-clamp-1"><strong class="text-slate-600">Educ:</strong> {{ job.qualificationStandards.education }}</span>
                            </div>
                            <div v-if="job.qualificationStandards.eligibility" class="flex items-start gap-1.5 text-[10px] text-slate-500">
                                <i class="pi pi-verified text-[9px] mt-0.5 shrink-0 text-slate-400"></i>
                                <span class="line-clamp-1"><strong class="text-slate-600">Eligibility:</strong> {{ job.qualificationStandards.eligibility }}</span>
                            </div>
                        </div>

                        <!-- Footer row: Vacancy count + Deadline + CTA -->
                        <div class="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div class="flex items-center gap-3">
                                <!-- Vacancy count -->
                                <div v-if="!job.hideVacancyCount" class="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                                    <i class="pi pi-users text-[9px]"></i>
                                    <span>{{ job.noOfVacancy || 1 }} slot{{ (job.noOfVacancy || 1) > 1 ? 's' : '' }}</span>
                                </div>
                                <!-- Deadline -->
                                <div class="flex items-center gap-1 text-[10px]" :class="deadlineInfo(job).cls">
                                    <i :class="['pi text-[9px]', deadlineInfo(job).icon]"></i>
                                    <span>{{ deadlineInfo(job).label }}</span>
                                </div>
                            </div>

                            <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 shrink-0 outline-none job-view-btn">
                                View Details
                                <i class="pi pi-arrow-right text-[9px]"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Empty state -->
                <div v-if="filteredJobs.length === 0" class="col-span-full py-16 flex flex-col items-center justify-center text-slate-400">
                    <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                        <i class="pi pi-search text-2xl text-slate-300"></i>
                    </div>
                    <p class="text-base font-bold text-slate-500 mb-1">No positions found</p>
                    <p class="text-sm text-slate-400">Try adjusting your search or filter criteria.</p>
                </div>
            </div>

            <!-- View all vacancies CTA -->
            <div v-if="!loading && filteredJobs.length > 0" class="flex justify-center mt-10 emerge-hidden" style="transition-delay: 200ms;">
                <button
                    @click="emit('open-job', null)"
                    class="flex items-center gap-2.5 px-8 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-600 font-black text-xs uppercase tracking-widest hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 outline-none shadow-sm"
                >
                    <i class="pi pi-briefcase text-sm"></i>
                    View All Vacancies
                </button>
            </div>

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

.job-card {
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
}
.job-card:hover {
    transform: translateY(-6px) scale(1.01);
    box-shadow: 0 20px 56px rgba(180, 80, 140, 0.13), 0 4px 16px rgba(96, 165, 250, 0.08);
    border-color: #F9C8D8;
}
.job-card:hover .job-card-title {
    color: #D4739A;
}
.job-tab-active {
    background: linear-gradient(135deg, #D4739A, #7EA9D7);
    box-shadow: 0 4px 16px rgba(180, 100, 150, 0.3);
}
.job-view-btn {
    color: #D4739A;
    background: #FDF0F6;
    border: 1px solid #F9C8D8;
}
.group:hover .job-view-btn {
    background: linear-gradient(135deg, #D4739A, #7EA9D7);
    color: white;
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(180, 100, 150, 0.3);
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
