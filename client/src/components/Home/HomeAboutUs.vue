<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const isOrgChartOpen = ref(true);

// 🪄 Smart Scroll Detection: Closes when scrolling UP or DOWN away from the section
const handleScroll = () => {
    if (!isOrgChartOpen.value) return;
    
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
        const rect = aboutSection.getBoundingClientRect();
        
        // Closes if the bottom of the section goes too high (scrolling down to Our Team)
        // OR if the top of the section goes too low (scrolling up to Vacancies)
        if (rect.bottom < window.innerHeight * 0.3 || rect.top > window.innerHeight * 0.7) {
            isOrgChartOpen.value = false;
        }
    }
};

onMounted(() => {
    // 1. Listen for scroll to close the dropdown
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 2. Scroll Observer for Emerge Animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('emerge-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    setTimeout(() => {
        document.querySelectorAll('#about .emerge-hidden').forEach((el) => {
            observer.observe(el);
        });
    }, 100);
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});

const boardMembers = ref({
    chairperson: {
        name: "Dr. Roberto Santos",
        role: "System Admin / Chairperson",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200",
        bio: "Leads the Selection Board, ensuring all recruitment processes strictly adhere to PRIME-HRM standards and DepEd policies."
    },
    members: [
        {
            name: "Juan Miguel Luna",
            role: "HRMO",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
            bio: "Head of the Human Resource Management Office. Oversees the initial screening of all incoming applications."
        },
        {
            name: "Elena G. Reyes",
            role: "Evaluation Committee",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
            bio: "Lead evaluator for teaching and non-teaching personnel, focusing on competency-based assessments."
        }
    ]
});
</script>

<template>
    <section id="about" class="py-32 px-8 bg-slate-900 text-left relative overflow-hidden">
        <div class="max-w-5xl mx-auto relative z-10 emerge-hidden">
            <div class="border-l-4 border-slate-400 pl-6 mb-12">
                <span class="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">Our Mission</span>
                <h2 class="text-3xl font-bold text-white tracking-tight">About Us</h2>
            </div>
            <p class="text-slate-300 text-lg leading-relaxed font-medium mb-16 max-w-3xl">
                Providing quality education and recruitment excellence to the City of Guihulngan through standardized merit-based systems. The RSP Portal is a digital platform designed to streamline the hiring and placement processes for teaching and non-teaching personnel adhering strictly to <span class="text-white font-bold">PRIME-HRM</span> standards.
            </p>

            <div class="mt-16 w-full emerge-hidden">
                <div class="border border-slate-700 rounded bg-slate-800/50 overflow-hidden">
                    <button @click="isOrgChartOpen = !isOrgChartOpen" class="w-full text-left font-bold text-white py-5 px-6 hover:bg-slate-800 transition-colors text-sm tracking-widest uppercase flex justify-between items-center outline-none">
                        Human Resources Management Placement Selection Board
                        <i :class="isOrgChartOpen ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="text-slate-400 chevron-slow"></i>
                    </button>
                    
                    <div class="grid dropdown-slow" :class="isOrgChartOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'">
                        <div class="overflow-hidden">
                            <div class="py-12 flex justify-center bg-transparent overflow-x-auto w-full px-6 border-t border-slate-700">
                                
                                <div class="flex flex-col items-center w-full">
                                    
                                    <div class="bg-slate-900 border border-slate-700 p-6 rounded shadow-lg flex flex-col sm:flex-row gap-6 items-center sm:items-start text-left max-w-2xl w-full relative z-10">
                                        <img :src="boardMembers.chairperson.image" class="w-24 h-24 rounded object-cover grayscale-[20%] shrink-0" alt="Chairperson" />
                                        <div>
                                            <h4 class="text-white font-bold text-lg">{{ boardMembers.chairperson.name }}</h4>
                                            <span class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{{ boardMembers.chairperson.role }}</span>
                                            <p class="text-slate-300 text-sm mt-3 leading-relaxed">{{ boardMembers.chairperson.bio }}</p>
                                        </div>
                                    </div>

                                    <div class="w-px h-8 bg-slate-700 hidden md:block"></div>
                                    <div class="w-full max-w-3xl border-t border-slate-700 hidden md:block relative">
                                        <div class="absolute top-0 left-[25%] w-px h-8 bg-slate-700"></div>
                                        <div class="absolute top-0 right-[25%] w-px h-8 bg-slate-700"></div>
                                    </div>

                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mt-8 md:mt-0 z-10">
                                        <div v-for="(member, index) in boardMembers.members" :key="index" class="bg-slate-900 border border-slate-700 p-6 rounded shadow-md flex flex-col sm:flex-row gap-5 items-center sm:items-start text-left relative">
                                            <img :src="member.image" class="w-20 h-20 rounded object-cover grayscale-[20%] shrink-0" alt="Board Member" />
                                            <div>
                                                <h4 class="text-white font-bold text-base">{{ member.name }}</h4>
                                                <span class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{{ member.role }}</span>
                                                <p class="text-slate-300 text-sm mt-3 leading-relaxed">{{ member.bio }}</p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
@reference "@/assets/main.css";

/* 🪄 STRICT CUSTOM PHYSICS FOR THE DROPDOWN */
.dropdown-slow {
    /* ease-in-out ensures it starts slow, and ends slow */
    transition: grid-template-rows 1.8s ease-in-out, opacity 1.8s ease-in-out;
}

.chevron-slow {
    transition: transform 1.8s ease-in-out;
}

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