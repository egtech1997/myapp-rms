<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['open-job']);

const searchQuery = ref('');
const selectedCategory = ref('All');
const categories = ref(['All', 'Teaching', 'Teaching Related', 'Non-Teaching']);

const jobList = ref([
    {
        title: 'Teacher I (Elementary)',
        type: 'Full-Time',
        division: 'DIVISION OFFICE',
        category: 'Teaching',
        salary: '₱27,000.00 / month',
        description: 'Provide basic education instruction for elementary students following the K-12 curriculum.',
        requirements: ['LET Passer', 'B.E.Ed Graduate']
    },
    {
        title: 'Teacher I (Senior High - TVL)',
        type: 'Full-Time',
        division: 'DIVISION OFFICE',
        category: 'Teaching Related',
        salary: '₱31,705.00 / month',
        description: 'Provide high-quality instruction and hands-on training for the TVL track in Senior High School.',
        requirements: ['LET Passer', 'NC II Certified', 'Relevant Bachelor’s Degree']
    },
    {
        title: 'Administrative Support',
        type: 'Contract',
        division: 'DIVISION OFFICE',
        category: 'Non-Teaching',
        salary: '₱18,500.00 / month',
        description: 'Provide general administrative support, record-keeping, and office coordination.',
        requirements: ['College Graduate', 'Proficient in MS Office', '1 Year Experience']
    }
]);

const filteredJobs = computed(() => {
    return jobList.value.filter(job => {
        const matchesSearch = !searchQuery.value || 
            job.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            job.division.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesCategory = selectedCategory.value === 'All' || job.category === selectedCategory.value;
        return matchesSearch && matchesCategory;
    });
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
                        <i class="pi pi-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 z-10 pointer-events-none text-xs"></i>
                        <input type="text" v-model="searchQuery" placeholder="Search position..." class="w-full pl-10 pr-4 py-2.5 text-sm rounded border border-slate-300 bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm outline-none" />
                    </div>
                    
                    <div class="flex bg-white p-1 rounded border border-slate-300 whitespace-nowrap overflow-x-auto w-full sm:w-auto">
                        <button v-for="category in categories" :key="category"
                            @click="selectedCategory = category"
                            :class="['px-5 py-2 text-xs rounded-sm font-bold transition-all duration-200 outline-none', selectedCategory === category ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900']">
                            {{ category }}
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 emerge-hidden">
                <div v-for="(job, index) in filteredJobs" :key="index" @click="emit('open-job', job)"
                    class="bg-white rounded-md border border-slate-200 hover:border-slate-400 transition-colors duration-200 cursor-pointer flex flex-col h-full relative group"
                    style="min-height: 180px; padding: 28px;">
                    
                    <div class="flex justify-between items-start mb-6">
                        <span class="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{{ job.division }}</span>
                        <span class="text-[10px] font-semibold border border-slate-200 text-slate-600 rounded px-2.5 py-1">{{ job.category }}</span>
                    </div>
                    
                    <h3 class="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-slate-600 transition-colors">{{ job.title }}</h3>
                    <p class="text-sm text-slate-500 line-clamp-2 mb-8 flex-grow leading-relaxed">{{ job.description }}</p>
                    
                    <div class="mt-auto border-t border-slate-100 pt-5 flex items-center justify-between text-sm">
                        <div class="flex items-center gap-2 text-slate-600 font-semibold">
                            <i class="pi pi-briefcase text-xs"></i> {{ job.type }}
                        </div>
                        <span class="text-[10px] text-slate-400 group-hover:text-slate-900 font-bold uppercase tracking-widest transition-colors flex items-center gap-1">Details <i class="pi pi-arrow-right text-[8px] mt-[1px]"></i></span>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>