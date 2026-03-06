<script setup>
import { ref, onMounted, onUnmounted } from 'vue'; 
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

import HomeBulletin from '@/components/Home/HomeBulletin.vue';
import HomeJob from '@/components/Home/HomeJob.vue';
import HomeAboutUs from '@/components/Home/HomeAboutUs.vue';
import HomeTeam from '@/components/Home/HomeTeam.vue';
import HomeHelpCenter from '@/components/Home/HomeHelpCenter.vue';

// 🪄 IMPORT YOUR NEW DISSECTED MODALS HERE
import HomeJobModal from '@/components/Modals/HomeJobModal.vue';
import HomeTeamModal from '@/components/Modals/HomeTeamModal.vue';
import HomeBulletinModal from '@/components/Modals/HomeBulletinModal.vue';

const router = useRouter();
const authStore = useAuthStore();
const loggedOutMessage = ref(false);

const isModalOpen = ref(false);
const activeJob = ref(null);

const isTeamModalOpen = ref(false);
const selectedMember = ref(null);

const isBulletinDialogOpen = ref(false); 
const selectedAnnouncement = ref(null);

// Modal Handlers
const handleOpenJob = (job) => {
    activeJob.value = job;
    isModalOpen.value = true;
};
const handleOpenTeam = (member) => {
    selectedMember.value = member;
    isTeamModalOpen.value = true;
};
const handleOpenBulletin = (item) => {
    selectedAnnouncement.value = item;
    isBulletinDialogOpen.value = true;
};

// --- DATE, TIME, AND WEATHER STATE ---
const currentTime = ref('');
const currentDate = ref('');
const weatherStatus = ref('sunny'); 

const updateDateTime = () => {
    const now = new Date();
    currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentDate.value = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
};

const fetchWeather = async () => {
    try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=10.12&longitude=123.27&current_weather=true');
        const data = await response.json();
        const code = data.current_weather.weathercode;
        weatherStatus.value = (code >= 51) ? 'rainy' : 'sunny';
    } catch (error) {
        console.error("Weather fetch failed:", error);
    }
};

// --- NATIVE HERO CAROUSEL LOGIC ---
const activeHeroSlide = ref(0);
const heroSlides = [1, 2, 3];
let heroInterval;

const startHeroCarousel = () => {
    heroInterval = setInterval(() => {
        activeHeroSlide.value = (activeHeroSlide.value + 1) % heroSlides.length;
    }, 8000);
};

const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

const handleLogout = async () => {
    await authStore.logout();
    loggedOutMessage.value = true;
    setTimeout(() => loggedOutMessage.value = false, 3000);
};

onMounted(() => {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    fetchWeather();
    setInterval(fetchWeather, 600000);
    startHeroCarousel();

    // 🪄 SCROLL ANIMATION OBSERVER
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('emerge-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    setTimeout(() => {
        document.querySelectorAll('.emerge-hidden').forEach((el) => {
            observer.observe(el);
        });
    }, 100);
});

onUnmounted(() => {
    clearInterval(heroInterval);
});
</script>

<template>
    <div class="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-slate-200 selection:text-slate-900" style="font-family: 'Avenir', sans-serif;">
         
        <nav class="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200 sticky top-0 z-[100]">
            <div class="flex items-center gap-4 w-1/4 group cursor-pointer" @click="scrollTo('home')">
                <img src="https://i.ibb.co/7dHhWCpp/images.png" alt="Logo" class="object-contain w-10 h-10" />
                <div class="flex flex-col leading-none">
                    <span class="text-lg font-bold text-slate-900 tracking-tight">RSP Portal</span>
                    <span class="text-[10px] text-slate-500 uppercase font-semibold tracking-widest mt-1">DepEd GNC</span>
                </div>
            </div>

            <div class="flex items-center justify-center gap-6 flex-1">
                <button v-for="link in ['home', 'bullet', 'jobs', 'about', 'teams', 'faq']" :key="link"
                    class="text-slate-500 font-semibold hover:text-slate-900 transition-colors duration-200 text-xs uppercase tracking-widest outline-none"
                    @click="scrollTo(link)">
                    {{ link === 'bullet' ? 'Bulletin' : (link === 'jobs' ? 'Job Vacancies' : (link === 'faq' ? 'Help Center' : link)) }}
                </button>
            </div>

            <div class="flex items-center justify-end gap-6 w-1/4">
                <div class="hidden lg:flex flex-col items-end leading-none border-r border-slate-200 pr-6">
                    <div class="flex items-center gap-2 mb-1">
                        <span v-if="weatherStatus === 'sunny'" class="text-lg animate-pulse-slow">☀️</span>
                        <span v-else class="text-lg animate-bounce">💧</span>
                        <span class="text-sm font-bold text-slate-900">{{ currentTime }}</span>
                    </div>
                    <span class="text-[10px] text-slate-500 uppercase font-semibold tracking-widest">{{ currentDate }}</span>
                </div>
                <template v-if="authStore.isAuthenticated">
                    <div @click="router.push(authStore.dashboardRoute)" title="Go to User Profile" class="cursor-pointer inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-900 font-bold ring-1 ring-slate-200 hover:ring-slate-400 rounded-md transition-all duration-200 select-none">
                        {{ authStore.user?.username?.charAt(0).toUpperCase() || 'U' }}
                    </div>
                    <button title="Logout" @click="handleLogout" class="text-slate-500 hover:text-slate-900 transition-colors p-1 outline-none">
                        <i class="pi pi-sign-out text-lg"></i>
                    </button>
                </template>
                <button v-else class="bg-slate-900 border border-slate-900 px-6 py-2.5 text-white font-bold text-xs uppercase tracking-widest rounded hover:bg-slate-800 transition-all duration-200 outline-none" @click="router.push('/auth/login')">
                    Sign In
                </button>
            </div>
        </nav>

        <main id="home" class="w-full bg-slate-50 relative border-b border-slate-200 overflow-hidden">
            <div class="flex transition-transform duration-[1200ms] ease-in-out w-full" :style="{ transform: `translateX(-${activeHeroSlide * 100}%)` }">
                <div class="w-full shrink-0">
                    <div class="grid grid-cols-1 lg:grid-cols-2 max-w-7xl mx-auto w-full items-center px-8 py-32 gap-16 text-left">
                        <div class="space-y-8 z-10 pr-12 emerge-hidden" style="transition-delay: 100ms;">
                            <span class="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-300 pb-1 block w-max">Division of Guihulngan City</span>
                            <h1 class="text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">RSP Management Portal.</h1>
                            <p class="text-slate-600 text-lg leading-relaxed font-medium max-w-lg">Streamlined online recruitment and selection framework designed for human resource efficiency.</p>
                        </div>
                        <div class="hidden lg:block relative w-full emerge-hidden" style="transition-delay: 300ms; height: 360px;">
                            <div class="relative h-full w-full overflow-hidden bg-white border border-slate-200 rounded-md">
                                <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200" class="w-full h-full object-cover grayscale-[20%] contrast-125" alt="Corporate Office" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="w-full shrink-0">
                    <div class="grid grid-cols-1 lg:grid-cols-2 max-w-7xl mx-auto w-full items-center px-8 py-32 gap-16 text-left">
                        <div class="space-y-8 z-10 pr-12">
                            <span class="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-300 pb-1 block w-max">Division of Guihulngan City</span>
                            <h1 class="text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">Commitment to Excellence.</h1>
                            <p class="text-slate-600 text-lg leading-relaxed font-medium max-w-lg">Streamlined online recruitment and selection framework designed for human resource efficiency.</p>
                        </div>
                        <div class="hidden lg:block relative w-full" style="height: 360px;">
                            <div class="relative h-full w-full overflow-hidden bg-white border border-slate-200 rounded-md">
                                <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200" class="w-full h-full object-cover grayscale-[20%] contrast-125" alt="Corporate Office" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="w-full shrink-0">
                    <div class="grid grid-cols-1 lg:grid-cols-2 max-w-7xl mx-auto w-full items-center px-8 py-32 gap-16 text-left">
                        <div class="space-y-8 z-10 pr-12">
                            <span class="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-300 pb-1 block w-max">Division of Guihulngan City</span>
                            <h1 class="text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">Standardized Merit System.</h1>
                            <p class="text-slate-600 text-lg leading-relaxed font-medium max-w-lg">Streamlined online recruitment and selection framework designed for human resource efficiency.</p>
                        </div>
                        <div class="hidden lg:block relative w-full" style="height: 360px;">
                            <div class="relative h-full w-full overflow-hidden bg-white border border-slate-200 rounded-md">
                                <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200" class="w-full h-full object-cover grayscale-[20%] contrast-125" alt="Corporate Office" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
                <button v-for="(slide, index) in heroSlides" :key="index" @click="activeHeroSlide = index" 
                    :class="['h-2 rounded-sm transition-all duration-300 outline-none', activeHeroSlide === index ? 'bg-slate-900 w-6' : 'bg-slate-300 w-2 hover:bg-slate-400']">
                </button>
            </div>
        </main>

        <HomeBulletin @open-bulletin="handleOpenBulletin" />
        <HomeJob @open-job="handleOpenJob" />
        <HomeAboutUs />
        <HomeTeam @open-team="handleOpenTeam" />
        <HomeHelpCenter />

        <HomeJobModal v-model:visible="isModalOpen" :job="activeJob" />
        <HomeTeamModal v-model:visible="isTeamModalOpen" :member="selectedMember" />
        <HomeBulletinModal v-model:visible="isBulletinDialogOpen" :announcement="selectedAnnouncement" />

    </div>
</template>

<style>
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