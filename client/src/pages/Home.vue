<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

import HomeBulletin from '@/components/Home/HomeBulletin.vue';
import HomeJob from '@/components/Home/HomeJob.vue';
import HomeAboutUs from '@/components/Home/HomeAboutUs.vue';
import HomeTeam from '@/components/Home/HomeTeam.vue';
import HomeHelpCenter from '@/components/Home/HomeHelpCenter.vue';

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

const getLinkLabel = (link) => {
    const labels = {
        home: 'Home',
        bullet: 'Bulletin',
        jobs: 'Job Vacancies',
        about: 'About Us',
        teams: 'Our Team',
        faq: 'Help Center'
    };
    return labels[link] || link;
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
const heroSlides = [
    { 
        tag: 'Division of Guihulngan City', 
        title: 'RSP Management Portal.', 
        desc: 'Streamlined online recruitment and selection framework designed for human resource efficiency.' 
    },
    { 
        tag: 'Recruitment Excellence', 
        title: 'Commitment to Merit.', 
        desc: 'Ensuring equal opportunity through a standardized and transparent recruitment process.' 
    },
    { 
        tag: 'Modernized Systems', 
        title: 'Future-Ready Careers.', 
        desc: 'Join our dedicated team of educators and administrative professionals in the DepEd community.' 
    }
];
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
    <div class="min-h-screen flex flex-col bg-[var(--surface)] text-[var(--text-main)] font-sans selection:bg-[var(--color-primary-light)] selection:text-[var(--color-primary)]"
        style="font-family: 'Avenir', sans-serif;">

        <div v-if="loggedOutMessage"
            class="fixed top-24 right-8 bg-green-100 border border-green-200 text-green-800 px-4 py-2 rounded shadow-md z-[200]">
            Successfully logged out.
        </div>

        <nav class="flex items-center justify-between px-8 py-5 bg-[var(--surface)] border-b border-[var(--border-main)] sticky top-0 z-[100]">
            <div class="flex items-center gap-4 w-1/4 group cursor-pointer" @click="scrollTo('home')">
                <img src="https://i.ibb.co/7dHhWCpp/images.png" alt="Logo" class="object-contain w-10 h-10" />
                <div class="flex flex-col leading-none">
                    <span class="text-lg font-bold text-[var(--text-main)] tracking-tight">RSP Portal</span>
                    <span class="text-[10px] text-[var(--text-muted)] uppercase font-semibold tracking-widest mt-1">DepEd GNC</span>
                </div>
            </div>

            <div class="hidden md:flex items-center justify-center gap-6 flex-1">
                <button v-for="link in ['home', 'bullet', 'jobs', 'about', 'teams', 'faq']" :key="link"
                    class="text-[var(--text-muted)] font-semibold hover:text-[var(--text-main)] transition-colors duration-200 text-xs uppercase tracking-widest outline-none"
                    @click="scrollTo(link)">
                    {{ getLinkLabel(link) }}
                </button>
            </div>

            <div class="flex items-center justify-end gap-4 w-full md:w-1/4">
                <div class="hidden lg:flex flex-col items-end leading-none border-r border-[var(--border-main)] pr-6 mr-2">
                    <div class="flex items-center gap-2 mb-1">
                        <span v-if="weatherStatus === 'sunny'" class="text-lg animate-pulse-slow">☀️</span>
                        <span v-else class="text-lg animate-bounce">💧</span>
                        <span class="text-sm font-bold text-[var(--text-main)]">{{ currentTime }}</span>
                    </div>
                    <span class="text-[10px] text-[var(--text-muted)] uppercase font-semibold tracking-widest">{{ currentDate }}</span>
                </div>
                <template v-if="authStore.isAuthenticated">
                    <div @click="router.push(authStore.dashboardRoute)" title="Go to User Profile"
                        class="cursor-pointer inline-flex items-center justify-center w-8 h-8 bg-[var(--bg-app)] text-[var(--text-main)] font-bold ring-1 ring-[var(--border-main)] hover:ring-[var(--text-muted)] rounded-md transition-all duration-200 select-none">
                        {{ authStore.user?.username?.charAt(0).toUpperCase() || 'U' }}
                    </div>
                    <button title="Logout" @click="handleLogout"
                        class="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1 outline-none">
                        <i class="pi pi-sign-out text-lg"></i>
                    </button>
                </template>
                <div v-else class="flex items-center gap-3">
                    <button class="text-[var(--text-sub)] font-bold text-[10px] uppercase tracking-widest hover:text-[var(--text-main)] transition-all"
                        @click="router.push('/auth/login')">
                        Sign In
                    </button>
                    <button class="bg-slate-900 px-5 py-2.5 text-white font-bold text-[10px] uppercase tracking-widest rounded hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-200"
                        @click="router.push('/auth/register')">
                        Register
                    </button>
                </div>
            </div>
        </nav>

        <main id="home" class="w-full bg-[var(--bg-app)] relative border-b border-[var(--border-main)] overflow-hidden">
            <div class="flex transition-transform duration-[1200ms] ease-in-out w-full"
                :style="{ transform: `translateX(-${activeHeroSlide * 100}%)` }">
                
                <div v-for="(slide, index) in heroSlides" :key="index" class="w-full shrink-0">
                    <div class="grid grid-cols-1 lg:grid-cols-2 max-w-7xl mx-auto w-full items-center px-8 py-24 lg:py-36 gap-16 text-left">
                        <div class="space-y-8 z-10 pr-12 emerge-hidden" :style="{ transitionDelay: `${index === activeHeroSlide ? 100 : 0}ms` }">
                            <span class="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-[0.2em] border-b border-[var(--border-main)] pb-1 block w-max">
                                {{ slide.tag }}
                            </span>
                            <h1 class="text-5xl lg:text-7xl font-black text-[var(--text-main)] leading-[1.1] tracking-tight">
                                {{ slide.title }}
                            </h1>
                            <p class="text-[var(--text-sub)] text-lg lg:text-xl leading-relaxed font-medium max-w-lg">
                                {{ slide.desc }}
                            </p>
                            
                            <!-- HERO CTAs -->
                            <div class="flex flex-col sm:flex-row items-center gap-4 pt-4">
                                <button @click="router.push('/auth/register')" 
                                    class="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-3">
                                    Start Your Application <i class="pi pi-arrow-right text-[10px]"></i>
                                </button>
                                <button @click="scrollTo('jobs')"
                                    class="w-full sm:w-auto bg-[var(--surface)] border border-[var(--border-main)] text-[var(--text-sub)] px-8 py-4 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-[var(--bg-app)] transition-all flex items-center justify-center">
                                    Browse Open Positions
                                </button>
                            </div>
                        </div>
                        
                        <div class="hidden lg:block relative w-full emerge-hidden" :style="{ transitionDelay: `${index === activeHeroSlide ? 300 : 0}ms`, height: '420px' }">
                            <div class="relative h-full w-full overflow-hidden bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl">
                                <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200"
                                    class="w-full h-full object-cover grayscale-[20%] contrast-125"
                                    alt="Corporate Office" />
                                <div class="absolute inset-0 bg-gradient-to-tr from-slate-900/20 to-transparent"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="absolute bottom-12 left-8 flex items-center gap-3 z-20">
                <button v-for="(slide, index) in heroSlides" :key="index" @click="activeHeroSlide = index"
                    :class="['h-1 rounded-full transition-all duration-500 outline-none', activeHeroSlide === index ? 'bg-slate-900 w-12' : 'bg-slate-300 w-4 hover:bg-slate-400']">
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

.no-scrollbar::-webkit-scrollbar { display: none; }
</style>
