<script setup>
import { ref, computed } from 'vue';

const faqGroups = ref([
    {
        title: 'Application Process',
        icon: 'pi-file-edit',
        items: [
            {
                q: 'How do I start my application?',
                a: 'First, create an account using your email or Google account. Then, complete your Personal Data Sheet (PDS) in the Profile section. Once your profile is ready, you can browse vacancies and click "Apply".'
            },
            {
                q: 'What are the required documents?',
                a: 'Under DO 007, s. 2023, you need to provide your PDS, Transcript of Records (TOR), PRC License/Eligibility, Service Records, and Performance Ratings. All data is entered directly into the system—no file uploads are required.'
            },
            {
                q: 'Can I apply for multiple positions?',
                a: 'Yes, you can apply for multiple vacancies as long as you meet the minimum Qualification Standards (QS) for each position.'
            }
        ]
    },
    {
        title: 'Ranking & Selection',
        icon: 'pi-chart-bar',
        items: [
            {
                q: 'How is the ranking calculated?',
                a: 'We use the standardized DepEd Point System. Your total score is a combination of your Credentials (Education, Training, Experience) and your Potential (BEI, Written Exam, Work Sample).'
            },
            {
                q: 'What is the RQA?',
                a: 'The Registry of Qualified Applicants (RQA) is the official ranked list of candidates who passed the evaluation. The SDS selects appointees from the Top 5 candidates in this list.'
            }
        ]
    },
    {
        title: 'Technical Support',
        icon: 'pi-desktop',
        items: [
            {
                q: 'I forgot my password, what should I do?',
                a: 'Use the "Forgot Password" link on the login page to receive an OTP (One-Time Password) via your registered email to reset your credentials.'
            },
            {
                q: 'Is my data secure?',
                a: 'Yes, all PDS records are encrypted and access is strictly restricted to authorized HR personnel and the Selection Board through our Role-Based Access Control (RBAC) system.'
            }
        ]
    }
]);

const activeGroup = ref(0);
const expandedItems = ref([]);

const toggleItem = (groupIndex, itemIndex) => {
    const key = `${groupIndex}-${itemIndex}`;
    const idx = expandedItems.value.indexOf(key);
    if (idx === -1) expandedItems.value.push(key);
    else expandedItems.value.splice(idx, 1);
};

const isExpanded = (groupIndex, itemIndex) => {
    return expandedItems.value.includes(`${groupIndex}-${itemIndex}`);
};
</script>

<template>
    <section id="faq" class="w-full py-24 bg-slate-50 border-t border-slate-200">
        <div class="max-w-7xl mx-auto px-8">
            
            <!-- Section Header -->
            <div class="flex flex-col items-center text-center mb-16 emerge-hidden">
                <span class="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Support</span>
                <h2 class="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Help Center & FAQ</h2>
                <p class="text-slate-500 mt-4 max-w-xl text-lg font-medium">Everything you need to know about the RSP recruitment process.</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                
                <!-- FAQ Categories -->
                <div class="flex flex-col gap-3 emerge-hidden" style="transition-delay: 100ms;">
                    <button v-for="(group, idx) in faqGroups" :key="idx"
                        @click="activeGroup = idx"
                        :class="['flex items-center gap-4 p-5 rounded-2xl border transition-all text-left group',
                            activeGroup === idx 
                                ? 'bg-white border-blue-200 shadow-xl shadow-blue-500/5' 
                                : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200']">
                        <div :class="['w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                            activeGroup === idx ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400 group-hover:text-blue-600']">
                            <i :class="['pi text-lg', group.icon]"></i>
                        </div>
                        <div>
                            <p :class="['text-sm font-black uppercase tracking-wider', activeGroup === idx ? 'text-slate-900' : 'text-slate-500']">{{ group.title }}</p>
                            <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">{{ group.items.length }} Articles</p>
                        </div>
                    </button>

                    <div class="mt-8 p-8 rounded-3xl bg-slate-900 text-white space-y-6 relative overflow-hidden shadow-2xl">
                        <div class="relative z-10">
                            <h4 class="text-lg font-black leading-tight">Still have questions?</h4>
                            <p class="text-xs text-slate-400 mt-2 font-medium leading-relaxed">Our HR team is available during office hours to assist with your concerns.</p>
                            <button class="mt-6 w-full py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all">
                                Contact HR Office
                            </button>
                        </div>
                        <!-- Decorative glow -->
                        <div class="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full"></div>
                    </div>
                </div>

                <!-- Questions List -->
                <div class="lg:col-span-2 space-y-4 emerge-hidden" style="transition-delay: 300ms;">
                    <div v-for="(item, idx) in faqGroups[activeGroup].items" :key="idx"
                        class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-300">
                        <button @click="toggleItem(activeGroup, idx)"
                            class="w-full p-6 flex items-center justify-between text-left group">
                            <span class="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{{ item.q }}</span>
                            <div :class="['w-8 h-8 rounded-lg flex items-center justify-center border border-slate-100 text-slate-400 transition-all',
                                isExpanded(activeGroup, idx) ? 'bg-slate-900 text-white border-slate-900 rotate-180' : 'bg-slate-50 group-hover:bg-blue-50 group-hover:text-blue-600']">
                                <i class="pi pi-chevron-down text-[10px]"></i>
                            </div>
                        </button>
                        
                        <div v-show="isExpanded(activeGroup, idx)" 
                            class="px-6 pb-6 animate-fade-in">
                            <div class="pt-2 border-t border-slate-50">
                                <p class="text-sm text-slate-600 leading-relaxed font-medium">{{ item.a }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Help center search secondary -->
                    <div class="mt-12 p-8 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <i class="pi pi-search text-lg"></i>
                            </div>
                            <div>
                                <p class="text-sm font-black text-slate-800 uppercase tracking-widest">Search Documentation</p>
                                <p class="text-xs text-slate-500 font-medium">Find specific rules and regulations.</p>
                            </div>
                        </div>
                        <div class="relative w-full sm:w-64">
                            <input type="text" placeholder="Search topics..."
                                class="w-full h-11 pl-4 pr-10 rounded-xl bg-slate-100 border-none text-xs focus:ring-2 focus:ring-blue-500/20" />
                            <i class="pi pi-arrow-right absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>
</template>

<style>
/* No @apply here, using Tailwind classes directly. 
   Keeping z-index and basic structure for animations if needed. */
#faq {
    position: relative;
    z-index: 0;
}
</style>
