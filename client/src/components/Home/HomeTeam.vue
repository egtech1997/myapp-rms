<script setup>
import { ref, onMounted, reactive } from 'vue';

const emit = defineEmits(['open-team']);

// ==============================================
// 🛠️ MANUAL LAYOUT ADJUSTMENT KNOBS
// ==============================================
const layoutAdjustment = reactive({
    profilePicSize: 100,       // Change this number to resize the circular photo
    profilePicRounding: 9999, // 9999 for circle, 8 for slightly rounded square
    cardHeight: 260,          // Total height of the card
});

const teamMembers = ref([
    { 
        name: "Mr. Mel E. Gactho", 
        role: "PROJECT MANAGER", 
        image: "https://image2url.com/r2/default/images/1772521300308-f915594c-e1f5-4592-9dde-fe3f5da915ff.jpg", 
        bgImage: "https://image2url.com/r2/default/images/1772700654001-b42d82e5-20db-425a-8509-28356fed1bdd.webp",
        bio: "Leading the Division of Guihulngan City with 20 years of experience in educational management and PRIME-HRM excellence.", 
        email: "roberto.santos@deped.gov.ph" 
    },
    { 
        name: "Joh Dave Kenneth Ricablanca", 
        role: "TEAM LEADER", 
        image: "https://image2url.com/r2/default/images/1772523743407-e8223bfc-27bc-4748-8ca4-09366908dada.jpg", 
        bgImage: "https://image2url.com/r2/default/images/1772700654001-b42d82e5-20db-425a-8509-28356fed1bdd.webp",
        bio: "Dedicated to improving the quality of basic education through innovative teacher training and merit-based selection.", 
        email: "elena.reyes@deped.gov.ph" 
    },
    { 
        name: "Eric Ganaganag", 
        role: "TEAM LEADER ASSISTANT", 
        image: "https://image2url.com/r2/default/images/1772699628545-a2689054-c3f1-43b1-aa79-66a273c82347.jpg", 
        bgImage: "https://image2url.com/r2/default/images/1772700654001-b42d82e5-20db-425a-8509-28356fed1bdd.webp",
        bio: "Overseeing the recruitment and placement processes to ensure fairness and transparency.", 
        email: "miguel.luna@deped.gov.ph" 
    },
    { 
        name: "John Rico Ganaganag", 
        role: "FRONT END DEV.", 
        image: "https://image2url.com/r2/default/images/1772524048864-95b568c6-6734-4333-9be8-ad7c2e7be086.jpg", 
        bgImage: "https://image2url.com/r2/default/images/1772700654001-b42d82e5-20db-425a-8509-28356fed1bdd.webp",
        bio: "Overseeing the recruitment and placement processes to ensure fairness and transparency.", 
        email: "miguel.luna@deped.gov.ph" 
    },
    { 
        name: "DHUSTINE YRAD", 
        role: "USER INTERFACE PROFESSIONAL", 
        image: "https://image2url.com/r2/default/images/1772701165670-800193db-6a11-4a0d-9fa6-1164d83d0563.jpg", 
        bgImage: "https://image2url.com/r2/default/images/1772700654001-b42d82e5-20db-425a-8509-28356fed1bdd.webp",
        bio: "Overseeing the recruitment and placement processes to ensure fairness and transparency.", 
        email: "miguel.luna@deped.gov.ph" 
    },
]);

onMounted(() => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('emerge-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    setTimeout(() => {
        document.querySelectorAll('#teams .emerge-hidden').forEach((el) => {
            observer.observe(el);
        });
    }, 100);
});
</script>

<template>
    <section id="teams" class="py-24 px-8 max-w-7xl mx-auto w-full text-left border-b border-slate-200 relative">
        <div class="border-l-4 border-slate-900 pl-6 mb-12 emerge-hidden">
            <span class="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">Faces Behind The Portal</span>
            <h2 class="text-3xl font-bold text-slate-900 tracking-tight">Our Team</h2>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div v-for="member in teamMembers" :key="member.name" @click="emit('open-team', member)"
                class="emerge-hidden relative overflow-hidden bg-slate-900 rounded-lg p-6 flex flex-col items-start justify-end cursor-pointer group transition-all duration-300 hover:shadow-xl"
                :style="{ height: layoutAdjustment.cardHeight + 'px' }">
                
                <div class="absolute inset-0 z-0">
                    <img :src="member.bgImage" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-40 group-hover:opacity-60" />
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
                </div>

                <div class="relative z-10 w-full">
                    <img :src="member.image" 
                         :style="{ 
                            width: layoutAdjustment.profilePicSize + 'px', 
                            height: layoutAdjustment.profilePicSize + 'px',
                            borderRadius: layoutAdjustment.profilePicRounding + 'px'
                         }"
                         class="border-2 border-white/20 object-cover mb-4 transition-all duration-300 group-hover:border-white/50" 
                         alt="Team Member" />
                    
                    <h3 class="text-sm font-bold text-white mb-1 tracking-tight">{{ member.name }}</h3>
                    <p class="text-slate-300 text-[10px] font-bold uppercase tracking-widest">{{ member.role }}</p>
                </div>

                <div class="absolute top-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <i class="pi pi-arrow-up-right text-xs"></i>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
@reference "@/assets/main.css";

.emerge-hidden {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 1.2s cubic-bezier(0.2, 0.8, 0.2, 1), transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.emerge-visible {
    opacity: 1;
    transform: translateY(0);
}
</style>