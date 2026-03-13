<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';

import HomeBulletin from '@/components/home/HomeBulletin.vue';
import HomeJob from '@/components/home/HomeJob.vue';
import HomeJobModal from '@/components/modals/HomeJobModal.vue';
import HomeTeamModal from '@/components/modals/HomeTeamModal.vue';
import HomeBulletinModal from '@/components/modals/HomeBulletinModal.vue';

const router = useRouter();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();

// ── Modal state ──────────────────────────────────────────────────
const isModalOpen = ref(false);
const activeJob = ref(null);
const isTeamModalOpen = ref(false);
const selectedMember = ref(null);
const isBulletinDialogOpen = ref(false);
const selectedAnnouncement = ref(null);

const handleOpenJob = (job) => { activeJob.value = job; isModalOpen.value = true; };
const handleOpenBulletin = (item) => { selectedAnnouncement.value = item; isBulletinDialogOpen.value = true; };

// ── Navbar ───────────────────────────────────────────────────────
const navScrolled = ref(false);
const mobileMenuOpen = ref(false);

const navLinks = [
    { id: 'home',    label: 'Home' },
    { id: 'about',   label: 'About' },
    { id: 'mission', label: 'Vision & Mission' },
    { id: 'bullet',  label: 'Bulletin' },
    { id: 'jobs',    label: 'Vacancies' },
    { id: 'hrmpsb', label: 'HRMPSB' },
    { id: 'team',    label: 'Team' },
    { id: 'faq',     label: 'FAQ' },
];

const scrollTo = (id) => {
    mobileMenuOpen.value = false;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const handleScroll = () => { navScrolled.value = window.scrollY > 60; };

// ── Date / Time / Weather ─────────────────────────────────────────
const currentTime = ref('');
const currentDate = ref('');
const weatherStatus = ref('sunny');
const weatherTemp = ref(null);
let clockInterval = null;

const updateDateTime = () => {
    const now = new Date();
    const timeOpts = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Manila' };
    const dateOpts = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' };
    currentTime.value = new Intl.DateTimeFormat('en-PH', timeOpts).format(now);
    currentDate.value = new Intl.DateTimeFormat('en-PH', dateOpts).format(now);
};

const fetchWeather = async () => {
    try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=10.12&longitude=123.27&current_weather=true&hourly=temperature_2m,precipitation_probability');
        const data = await res.json();
        const code = data.current_weather?.weathercode ?? 0;
        weatherTemp.value = data.current_weather?.temperature ?? null;
        if (code === 0) weatherStatus.value = 'sunny';
        else if (code <= 45) weatherStatus.value = 'cloudy';
        else weatherStatus.value = 'rainy';
    } catch { /* silently fail */ }
};

const weatherIcon = computed(() => {
    if (weatherStatus.value === 'sunny') return 'pi pi-sun';
    if (weatherStatus.value === 'cloudy') return 'pi pi-cloud';
    return 'pi pi-cloud-download';
});

// ── Hero Carousel ─────────────────────────────────────────────────
const activeHeroSlide = ref(0);
let heroInterval = null;

const heroSlides = [
    {
        tag: 'Official Recruitment Portal',
        title: 'Building Careers. Serving Education.',
        desc: 'The official digital recruitment and selection portal of SDO Guihulngan City. Merit-based, transparent, and streamlined for excellence.',
    },
    {
        tag: 'Commitment to Merit',
        title: 'Transparent. Fair. Digital.',
        desc: 'Ensuring equal opportunity through a standardized and auditable recruitment process grounded in merit and fitness.',
    },
    {
        tag: 'Future-Ready Careers',
        title: 'Join the DepEd Family.',
        desc: 'Become part of a dedicated team of educators and professionals shaping the future of public education in Guihulngan City.',
    },
];

const goToSlide = (i) => {
    activeHeroSlide.value = i;
    clearInterval(heroInterval);
    heroInterval = setInterval(() => {
        activeHeroSlide.value = (activeHeroSlide.value + 1) % heroSlides.length;
    }, 8000);
};

// ── Stat counters ─────────────────────────────────────────────────
const statTargets = [12, 847, 3, 100];
const statValues = ref([0, 0, 0, 0]);
let statsAnimated = false;

const animateCounters = () => {
    if (statsAnimated) return;
    statsAnimated = true;
    statTargets.forEach((target, i) => {
        const duration = 1800;
        const step = 16;
        const increment = target / (duration / step);
        let current = 0;
        const timer = setInterval(() => {
            current = Math.min(current + increment, target);
            statValues.value[i] = Math.floor(current);
            if (current >= target) clearInterval(timer);
        }, step);
    });
};

// ── FAQ accordion ─────────────────────────────────────────────────
const activeFaq = ref(null);
const toggleFaq = (i) => { activeFaq.value = activeFaq.value === i ? null : i; };

const faqs = [
    {
        q: 'How do I apply for a teaching position?',
        a: 'Create an account on this portal, complete your Personal Data Sheet (PDS) under the Profile section, then browse available vacancies and click "Apply" on the position you wish to apply for. Make sure your eligibility and qualifications meet the posted requirements.',
    },
    {
        q: 'What documents do I need to prepare?',
        a: 'You will need: a complete Civil Service Form 212 (PDS), eligibility certificate (CSE/LET/PBET), transcript of records, diploma, certificate of employment (if applicable), performance ratings from the last two rating periods, and other supporting documents as specified in the vacancy posting.',
    },
    {
        q: 'How does the qualification screening work?',
        a: 'After submission, the HRMPSB evaluates applications based on education, eligibility, experience, and training. Qualified applicants proceed to comparative assessment. Rankings are generated automatically through the system and are auditable at every step.',
    },
    {
        q: 'Can applicants from other agencies apply?',
        a: 'Yes. Applicants from other government agencies may apply as long as they meet the qualification standards (QS) of the position. They must ensure their current agency issues an endorsement or clearance as required by CSC rules.',
    },
    {
        q: 'What is the HRMPSB?',
        a: 'The Human Resource Merit Promotion and Selection Board (HRMPSB) is a body mandated to ensure that appointments and promotions within SDO Guihulngan City are made based on merit and fitness. It evaluates candidates and recommends appointments to the Division Superintendent.',
    },
    {
        q: 'How will I know if my application was received?',
        a: 'Upon successful submission, you will receive an on-screen confirmation and an email notification. You can also track the status of your application in real time under the "My Applications" section of your dashboard.',
    },
    {
        q: 'Is my personal information secure?',
        a: 'Yes. The portal uses industry-standard encryption (HTTPS/TLS) and stores all data in a secured server. Personal information is handled in compliance with the Data Privacy Act of 2012 (RA 10173) and DepEd data privacy policies.',
    },
    {
        q: 'How do I update my profile after submission?',
        a: 'You may update your profile at any time before the application deadline. Changes made after submission will not automatically update your submitted application. Contact the HR unit if an amendment is needed for a submitted application.',
    },
];

// ── Team members ──────────────────────────────────────────────────
const teamMembers = [
    {
        name: 'Kenneth J. Montejo',
        role: 'ICT Coordinator / Systems Architect',
        unit: 'ICT Unit · SDO Guihulngan City',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
        bio: 'Oversees the ICT infrastructure of SDO Guihulngan City and leads the architectural design of the Guih-Ranking recruitment portal.',
        email: 'kenneth.montejo@deped.gov.ph',
    },
    {
        name: 'Maria Liza B. Tan',
        role: 'Web Developer / Frontend Engineer',
        unit: 'ICT Unit · SDO Guihulngan City',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
        bio: 'Responsible for the user interface and experience of the recruitment portal, ensuring accessibility and visual excellence across all devices.',
        email: 'marializa.tan@deped.gov.ph',
    },
    {
        name: 'Rodel C. Vergara',
        role: 'Database Administrator',
        unit: 'ICT Unit · SDO Guihulngan City',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
        bio: 'Manages and maintains the MongoDB database powering the portal, ensuring data integrity, backup reliability, and system performance.',
        email: 'rodel.vergara@deped.gov.ph',
    },
    {
        name: 'Sheila Mae O. Castillo',
        role: 'Systems Analyst / UX Designer',
        unit: 'ICT Unit · SDO Guihulngan City',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=300',
        bio: 'Conducts user research and system analysis to align portal features with the needs of HR practitioners and applicants across the division.',
        email: 'sheilamae.castillo@deped.gov.ph',
    },
];

const openTeamMember = (member) => { selectedMember.value = member; isTeamModalOpen.value = true; };

// ── Intersection Observer ─────────────────────────────────────────
const initObserver = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('emerge-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.emerge-hidden').forEach(el => observer.observe(el));

    // stats counter trigger
    const statsEl = document.getElementById('stats-strip');
    if (statsEl) {
        const statsObs = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { animateCounters(); statsObs.unobserve(e.target); } });
        }, { threshold: 0.3 });
        statsObs.observe(statsEl);
    }
};

// ── Lifecycle ─────────────────────────────────────────────────────
onMounted(async () => {
    updateDateTime();
    clockInterval = setInterval(updateDateTime, 1000);
    fetchWeather();
    setInterval(fetchWeather, 600000);

    heroInterval = setInterval(() => {
        activeHeroSlide.value = (activeHeroSlide.value + 1) % heroSlides.length;
    }, 8000);

    window.addEventListener('scroll', handleScroll, { passive: true });

    await nextTick();
    setTimeout(initObserver, 120);
});

onUnmounted(() => {
    clearInterval(heroInterval);
    clearInterval(clockInterval);
    window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
    <div
        class="min-h-screen flex flex-col bg-[var(--surface)] text-[var(--text-main)]"
        style="font-family: 'Avenir', 'Segoe UI', sans-serif;"
    >

        <!-- ══════════════════════════════════════════════════════════
             1. STICKY NAVBAR
        ══════════════════════════════════════════════════════════ -->
        <nav
            class="fixed top-0 left-0 right-0 z-[200] transition-all duration-300"
            :class="navScrolled
                ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-[var(--border-main)]'
                : 'bg-[var(--color-navy)]/95 backdrop-blur-sm border-b border-white/10'"
        >
            <div class="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-16 gap-4">

                <!-- Left: Logo + Name -->
                <button
                    class="flex items-center gap-3 shrink-0 group outline-none"
                    @click="scrollTo('home')"
                >
                    <div class="w-9 h-9 rounded-lg overflow-hidden border-2 border-white/20 group-hover:border-[var(--color-gold)] transition-all duration-300 shadow-lg">
                        <img
                            v-if="settingsStore.resolvedLogoUrl"
                            :src="settingsStore.resolvedLogoUrl"
                            alt="SDO Logo"
                            class="w-full h-full object-contain"
                        />
                        <img
                            v-else
                            src="https://i.ibb.co/7dHhWCpp/images.png"
                            alt="SDO Logo"
                            class="w-full h-full object-contain"
                        />
                    </div>
                    <div class="flex flex-col leading-none">
                        <span
                            class="text-sm font-black tracking-tight transition-colors duration-300"
                            :class="navScrolled ? 'text-[var(--color-navy)]' : 'text-white'"
                        >
                            {{ settingsStore.systemName || 'Guih-Ranking' }}
                        </span>
                        <span
                            class="text-[9px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
                            :class="navScrolled ? 'text-[var(--text-muted)]' : 'text-white/60'"
                        >
                            SDO Guihulngan City
                        </span>
                    </div>
                </button>

                <!-- Center: Nav links (desktop) -->
                <div class="hidden lg:flex items-center gap-1 flex-1 justify-center">
                    <button
                        v-for="link in navLinks"
                        :key="link.id"
                        @click="scrollTo(link.id)"
                        class="px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] rounded-md transition-all duration-200 outline-none"
                        :class="navScrolled
                            ? 'text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]'
                            : 'text-white/70 hover:text-white hover:bg-white/10'"
                    >
                        {{ link.label }}
                    </button>
                </div>

                <!-- Right: Weather + Clock + Auth -->
                <div class="flex items-center gap-4 shrink-0">
                    <!-- Weather + Time (desktop) -->
                    <div
                        class="hidden xl:flex flex-col items-end leading-none gap-1 pr-4 border-r transition-colors duration-300"
                        :class="navScrolled ? 'border-[var(--border-main)]' : 'border-white/15'"
                    >
                        <div class="flex items-center gap-2">
                            <i
                                :class="[weatherIcon, 'text-sm transition-colors duration-300',
                                    navScrolled ? 'text-[var(--color-gold)]' : 'text-[var(--color-gold)]']"
                            ></i>
                            <span
                                v-if="weatherTemp !== null"
                                class="text-xs font-bold transition-colors duration-300"
                                :class="navScrolled ? 'text-[var(--text-sub)]' : 'text-white/80'"
                            >
                                {{ weatherTemp }}&deg;C
                            </span>
                            <span
                                class="text-xs font-black tabular-nums transition-colors duration-300"
                                :class="navScrolled ? 'text-[var(--text-main)]' : 'text-white'"
                            >
                                {{ currentTime }}
                            </span>
                        </div>
                        <span
                            class="text-[9px] font-semibold uppercase tracking-widest transition-colors duration-300"
                            :class="navScrolled ? 'text-[var(--text-faint)]' : 'text-white/45'"
                        >
                            {{ currentDate }}
                        </span>
                    </div>

                    <!-- Auth buttons -->
                    <template v-if="authStore.isAuthenticated">
                        <button
                            @click="router.push(authStore.dashboardRoute)"
                            class="w-8 h-8 rounded-lg font-black text-sm flex items-center justify-center transition-all duration-200 ring-2 ring-offset-1"
                            :class="navScrolled
                                ? 'bg-[var(--color-primary)] text-white ring-[var(--color-primary)] ring-offset-white'
                                : 'bg-white/15 text-white ring-white/30 ring-offset-transparent hover:bg-white/25'"
                        >
                            {{ authStore.user?.username?.charAt(0).toUpperCase() || 'U' }}
                        </button>
                        <button
                            @click="authStore.logout()"
                            class="transition-colors duration-200 p-1.5 rounded-md outline-none"
                            :class="navScrolled ? 'text-[var(--text-muted)] hover:text-[var(--text-main)]' : 'text-white/60 hover:text-white'"
                            title="Sign out"
                        >
                            <i class="pi pi-sign-out text-sm"></i>
                        </button>
                    </template>
                    <template v-else>
                        <button
                            @click="router.push('/auth/login')"
                            class="text-[10px] font-black uppercase tracking-wider transition-colors duration-200 outline-none"
                            :class="navScrolled ? 'text-[var(--text-sub)] hover:text-[var(--color-primary)]' : 'text-white/70 hover:text-white'"
                        >
                            Sign In
                        </button>
                        <button
                            @click="router.push('/auth/register')"
                            class="px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-200 shadow-lg outline-none"
                            :class="navScrolled
                                ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-indigo-200'
                                : 'bg-[var(--color-gold)] text-[var(--color-navy)] hover:brightness-110 shadow-yellow-900/30'"
                        >
                            Register
                        </button>
                    </template>

                    <!-- Mobile menu toggle -->
                    <button
                        @click="mobileMenuOpen = !mobileMenuOpen"
                        class="lg:hidden p-1.5 rounded-md outline-none transition-colors"
                        :class="navScrolled ? 'text-[var(--text-main)]' : 'text-white'"
                    >
                        <i :class="mobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'" class="text-lg"></i>
                    </button>
                </div>
            </div>

            <!-- Mobile menu drawer -->
            <Transition name="slide-down">
                <div
                    v-if="mobileMenuOpen"
                    class="lg:hidden bg-[var(--color-navy)] border-t border-white/10 px-6 py-4 flex flex-col gap-1"
                >
                    <button
                        v-for="link in navLinks"
                        :key="link.id"
                        @click="scrollTo(link.id)"
                        class="w-full text-left px-3 py-2.5 text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-all outline-none"
                    >
                        {{ link.label }}
                    </button>
                </div>
            </Transition>
        </nav>

        <!-- ══════════════════════════════════════════════════════════
             2. HERO SECTION
        ══════════════════════════════════════════════════════════ -->
        <section id="home" class="relative w-full min-h-screen flex flex-col overflow-hidden" style="background-color: var(--color-navy);">

            <!-- Animated background blobs -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="blob blob-1"></div>
                <div class="blob blob-2"></div>
                <div class="blob blob-3"></div>
                <div class="blob blob-4"></div>
                <!-- Particle dots grid -->
                <div class="particle-grid"></div>
            </div>

            <!-- Gold accent left rail -->
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-transparent via-[var(--color-gold)] to-transparent opacity-80 z-10"></div>

            <!-- Hero content area -->
            <div class="relative z-10 flex-1 flex items-center pt-20 pb-12">
                <div class="max-w-[1400px] mx-auto w-full px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    <!-- Slide text panel -->
                    <div class="space-y-7">
                        <div class="flex items-center gap-3">
                            <div class="h-px w-10 bg-[var(--color-gold)]"></div>
                            <span class="text-[var(--color-gold)] text-[10px] font-black uppercase tracking-[0.25em]">
                                {{ heroSlides[activeHeroSlide].tag }}
                            </span>
                        </div>

                        <Transition name="hero-text" mode="out-in">
                            <h1
                                :key="activeHeroSlide"
                                class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight"
                            >
                                {{ heroSlides[activeHeroSlide].title }}
                            </h1>
                        </Transition>

                        <Transition name="hero-sub" mode="out-in">
                            <p
                                :key="activeHeroSlide + '-sub'"
                                class="text-white/65 text-lg leading-relaxed font-medium max-w-lg"
                            >
                                {{ heroSlides[activeHeroSlide].desc }}
                            </p>
                        </Transition>

                        <div class="flex flex-wrap gap-4 pt-2">
                            <button
                                @click="scrollTo('jobs')"
                                class="flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95"
                                style="background: var(--color-gold); color: var(--color-navy); box-shadow: 0 8px 32px rgba(239,191,4,0.35);"
                            >
                                <i class="pi pi-briefcase text-sm"></i>
                                Browse Open Positions
                            </button>
                            <button
                                @click="router.push('/auth/register')"
                                class="flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/60 transition-all duration-300"
                            >
                                <i class="pi pi-user-plus text-sm"></i>
                                Create Account
                            </button>
                        </div>

                        <!-- Slide dots -->
                        <div class="flex items-center gap-3 pt-4">
                            <button
                                v-for="(_, i) in heroSlides"
                                :key="i"
                                @click="goToSlide(i)"
                                class="rounded-full transition-all duration-500 outline-none"
                                :class="activeHeroSlide === i
                                    ? 'w-8 h-2.5 bg-[var(--color-gold)]'
                                    : 'w-2.5 h-2.5 bg-white/25 hover:bg-white/50'"
                            ></button>
                        </div>
                    </div>

                    <!-- Floating stats card -->
                    <div class="hidden lg:flex justify-center items-center">
                        <div class="relative w-full max-w-md">

                            <!-- Main card -->
                            <div class="rounded-2xl border border-white/15 p-8 space-y-6 hero-glass">
                                <div class="flex items-center gap-3 mb-2">
                                    <div class="w-10 h-10 rounded-xl bg-[var(--color-gold)] flex items-center justify-center shadow-lg">
                                        <i class="pi pi-chart-bar text-[var(--color-navy)] text-lg font-black"></i>
                                    </div>
                                    <div>
                                        <p class="text-white font-black text-sm">Live Recruitment Stats</p>
                                        <p class="text-white/50 text-[10px] font-semibold uppercase tracking-widest">As of today</p>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div class="stat-glass rounded-xl p-4 text-center">
                                        <p class="text-3xl font-black text-[var(--color-gold)]">12</p>
                                        <p class="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Active Positions</p>
                                    </div>
                                    <div class="stat-glass rounded-xl p-4 text-center">
                                        <p class="text-3xl font-black text-white">847</p>
                                        <p class="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Registered Users</p>
                                    </div>
                                    <div class="stat-glass rounded-xl p-4 text-center">
                                        <p class="text-3xl font-black text-white">3</p>
                                        <p class="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Hiring Tracks</p>
                                    </div>
                                    <div class="stat-glass rounded-xl p-4 text-center">
                                        <p class="text-3xl font-black text-[var(--color-gold)]">98%</p>
                                        <p class="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Satisfaction Rate</p>
                                    </div>
                                </div>

                                <div class="border-t border-white/10 pt-4">
                                    <div class="flex items-center gap-2 text-white/50 text-xs font-semibold">
                                        <i class="pi pi-map-marker text-[var(--color-gold)]"></i>
                                        Poblacion, Guihulngan City, Negros Oriental 6214
                                    </div>
                                </div>
                            </div>

                            <!-- Floating badge -->
                            <div class="absolute -top-4 -right-4 hero-badge rounded-xl px-4 py-2 flex items-center gap-2 shadow-xl">
                                <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                <span class="text-[10px] font-black uppercase tracking-widest text-white">Portal Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Scroll indicator -->
            <div class="relative z-10 flex flex-col items-center pb-8 gap-2">
                <span class="text-white/35 text-[10px] font-bold uppercase tracking-[0.2em]">Scroll to explore</span>
                <div class="scroll-bounce">
                    <i class="pi pi-angle-down text-white/50 text-lg"></i>
                </div>
            </div>

            <!-- Wave bottom -->
            <svg class="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="height: 60px;">
                <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="var(--bg-app)" />
            </svg>
        </section>

        <!-- ══════════════════════════════════════════════════════════
             3. QUICK STATS STRIP
        ══════════════════════════════════════════════════════════ -->
        <section id="stats-strip" class="bg-[var(--bg-app)] py-12 px-8 border-b border-[var(--border-main)]">
            <div class="max-w-[1400px] mx-auto">
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">

                    <div class="emerge-hidden bg-[var(--surface)] rounded-2xl border border-[var(--border-main)] p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-300 group">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style="background: var(--color-primary-light);">
                            <i class="pi pi-briefcase text-xl text-[var(--color-primary)]"></i>
                        </div>
                        <div>
                            <p class="text-3xl font-black text-[var(--text-main)] tabular-nums">{{ statValues[0] }}</p>
                            <p class="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-0.5">Active Positions</p>
                        </div>
                    </div>

                    <div class="emerge-hidden bg-[var(--surface)] rounded-2xl border border-[var(--border-main)] p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-300 group" style="transition-delay: 80ms;">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style="background: #e7f9f0;">
                            <i class="pi pi-users text-xl text-emerald-600"></i>
                        </div>
                        <div>
                            <p class="text-3xl font-black text-[var(--text-main)] tabular-nums">{{ statValues[1] }}</p>
                            <p class="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-0.5">Applicants</p>
                        </div>
                    </div>

                    <div class="emerge-hidden bg-[var(--surface)] rounded-2xl border border-[var(--border-main)] p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-300 group" style="transition-delay: 160ms;">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style="background: #fff8e1;">
                            <i class="pi pi-sitemap text-xl text-[var(--color-gold)]" style="color: #b8930a;"></i>
                        </div>
                        <div>
                            <p class="text-3xl font-black text-[var(--text-main)] tabular-nums">{{ statValues[2] }}</p>
                            <p class="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-0.5">Hiring Tracks</p>
                        </div>
                    </div>

                    <div class="emerge-hidden bg-[var(--surface)] rounded-2xl border border-[var(--border-main)] p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-300 group" style="transition-delay: 240ms;">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style="background: #f0f0ff;">
                            <i class="pi pi-verified text-xl" style="color: var(--color-primary);"></i>
                        </div>
                        <div>
                            <p class="text-3xl font-black text-[var(--text-main)] tabular-nums">{{ statValues[3] }}%</p>
                            <p class="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-0.5">100% Digital</p>
                        </div>
                    </div>

                </div>
            </div>
        </section>

        <!-- ══════════════════════════════════════════════════════════
             4. ABOUT SDO GUIHULNGAN CITY
        ══════════════════════════════════════════════════════════ -->
        <section id="about" class="py-24 px-8 bg-[var(--surface)]">
            <div class="max-w-[1400px] mx-auto">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    <!-- Text left -->
                    <div class="space-y-7 emerge-hidden">
                        <div>
                            <div class="flex items-center gap-3 mb-4">
                                <div class="h-px w-8 bg-[var(--color-gold)]"></div>
                                <span class="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-primary)]">About the Division</span>
                            </div>
                            <h2 class="text-4xl lg:text-5xl font-black text-[var(--text-main)] leading-tight tracking-tight">
                                Schools Division of<br/>
                                <span style="color: var(--color-primary);">Guihulngan City</span>
                            </h2>
                        </div>

                        <p class="text-[var(--text-sub)] text-base leading-relaxed">
                            The Schools Division of Guihulngan City, led by the Schools Division Superintendent, oversees the administration of public elementary and secondary schools in Guihulngan City, Negros Oriental. As part of DepEd Region VII (Central Visayas) — Negros Island Region (NIR), the Division is committed to upholding the highest standards of basic education, human resource development, and public service.
                        </p>

                        <div class="flex items-start gap-3 p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)]">
                            <div class="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
                                <i class="pi pi-map-marker text-sm text-[var(--color-primary)]"></i>
                            </div>
                            <div>
                                <p class="text-[var(--text-main)] font-bold text-sm">Poblacion, Guihulngan City</p>
                                <p class="text-[var(--text-muted)] text-xs font-medium">Negros Oriental, Negros Island Region (NIR), 6214</p>
                            </div>
                        </div>

                        <!-- Info chips -->
                        <div class="flex flex-wrap gap-3 pt-1">
                            <span v-for="chip in ['Region VII (NIR)', 'Negros Oriental', 'Established 2020', 'SDS Office']" :key="chip"
                                class="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-main)] bg-[var(--bg-app)] text-[11px] font-bold text-[var(--text-sub)] tracking-wider hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-all duration-200 cursor-default"
                            >
                                <i class="pi pi-check-circle text-[var(--color-primary)] text-xs"></i>
                                {{ chip }}
                            </span>
                        </div>
                    </div>

                    <!-- Image right -->
                    <div class="relative emerge-hidden" style="transition-delay: 200ms;">
                        <div class="rounded-2xl overflow-hidden shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800"
                                alt="School building"
                                class="w-full h-80 lg:h-96 object-cover"
                            />
                            <div class="absolute inset-0 bg-gradient-to-t from-[var(--color-navy)]/50 to-transparent rounded-2xl"></div>
                        </div>

                        <!-- Floating badge on image -->
                        <div class="absolute bottom-6 left-6 bg-[var(--color-navy)]/90 backdrop-blur-sm border border-white/15 text-white rounded-xl px-4 py-3 flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-[var(--color-gold)] flex items-center justify-center">
                                <i class="pi pi-building text-[var(--color-navy)] text-sm"></i>
                            </div>
                            <div>
                                <p class="text-xs font-black">SDO Guihulngan City</p>
                                <p class="text-[9px] text-white/55 font-semibold uppercase tracking-widest">DepEd Region VII · NIR</p>
                            </div>
                        </div>

                        <!-- Gold corner accent -->
                        <div class="absolute -top-3 -right-3 w-16 h-16 rounded-2xl border-4 border-[var(--color-gold)] opacity-40 pointer-events-none"></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ══════════════════════════════════════════════════════════
             5. DEPED VISION & MISSION
        ══════════════════════════════════════════════════════════ -->
        <section id="mission" class="py-24 px-8" style="background: var(--color-navy);">
            <div class="max-w-[1400px] mx-auto">

                <div class="text-center mb-14 emerge-hidden">
                    <div class="inline-flex items-center gap-3 mb-4">
                        <div class="h-px w-12 bg-[var(--color-gold)]"></div>
                        <span class="text-[var(--color-gold)] text-[10px] font-black uppercase tracking-[0.22em]">DepEd Philippines</span>
                        <div class="h-px w-12 bg-[var(--color-gold)]"></div>
                    </div>
                    <h2 class="text-4xl lg:text-5xl font-black text-white leading-tight">Vision &amp; Mission</h2>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-14">

                    <!-- Vision -->
                    <div class="emerge-hidden rounded-2xl p-8 border border-white/10 mission-card relative overflow-hidden" style="transition-delay: 100ms;">
                        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-gold)] to-transparent"></div>
                        <div class="flex items-center gap-3 mb-5">
                            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: rgba(239,191,4,0.15);">
                                <i class="pi pi-eye text-[var(--color-gold)] text-lg"></i>
                            </div>
                            <h3 class="text-white font-black text-xl tracking-tight">Vision</h3>
                        </div>
                        <p class="text-white/70 leading-relaxed text-sm font-medium">
                            We dream of Filipinos who passionately love their country and whose values and competencies enable them to realize their full potential and contribute meaningfully to building the nation. As a learner-centered public institution, the Department of Education continuously improves itself to better serve its stakeholders.
                        </p>
                    </div>

                    <!-- Mission -->
                    <div class="emerge-hidden rounded-2xl p-8 border border-white/10 mission-card relative overflow-hidden" style="transition-delay: 200ms;">
                        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-primary-ring)] to-transparent"></div>
                        <div class="flex items-center gap-3 mb-5">
                            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: rgba(91,132,186,0.15);">
                                <i class="pi pi-heart text-[var(--color-primary-ring)] text-lg"></i>
                            </div>
                            <h3 class="text-white font-black text-xl tracking-tight">Mission</h3>
                        </div>
                        <p class="text-white/70 leading-relaxed text-sm font-medium">
                            To protect and promote the right of every Filipino to quality, equitable, culture-based, and complete basic education where: Students learn in a child-friendly, gender-sensitive, safe, and motivating environment; Teachers facilitate learning and constantly nurture every learner; Administrators and staff, as stewards of the institution, ensure an enabling and supportive environment; Family, community, and other stakeholders are actively engaged and share responsibility for developing life-long learners.
                        </p>
                    </div>
                </div>

                <!-- Core Values -->
                <div class="emerge-hidden" style="transition-delay: 300ms;">
                    <p class="text-center text-white/45 text-[10px] font-black uppercase tracking-[0.22em] mb-6">DepEd Core Values</p>
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div v-for="val in [
                            { icon: 'pi pi-star', label: 'Maka-Diyos', desc: 'Fear of God, Honesty & Integrity' },
                            { icon: 'pi pi-users', label: 'Makatao', desc: 'Respect, Empathy & Solidarity' },
                            { icon: 'pi pi-globe', label: 'Makakalikasan', desc: 'Care for the Environment' },
                            { icon: 'pi pi-flag', label: 'Makabansa', desc: 'Love of Country & People' },
                        ]" :key="val.label"
                            class="rounded-xl p-5 border border-white/10 text-center flex flex-col items-center gap-3 core-value-card transition-all duration-300 cursor-default"
                        >
                            <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: rgba(239,191,4,0.15);">
                                <i :class="val.icon" class="text-[var(--color-gold)] text-base"></i>
                            </div>
                            <div>
                                <p class="text-white font-black text-sm">{{ val.label }}</p>
                                <p class="text-white/45 text-[10px] font-medium mt-1 leading-relaxed">{{ val.desc }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ══════════════════════════════════════════════════════════
             6. HRMPSB & SYSTEM OBJECTIVES
        ══════════════════════════════════════════════════════════ -->
        <section id="hrmpsb" class="py-24 px-8 bg-[var(--bg-app)]">
            <div class="max-w-[1400px] mx-auto">

                <div class="text-center mb-14 emerge-hidden">
                    <div class="flex items-center justify-center gap-3 mb-4">
                        <div class="h-px w-10 bg-[var(--color-primary)]"></div>
                        <span class="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-primary)]">Governance</span>
                        <div class="h-px w-10 bg-[var(--color-primary)]"></div>
                    </div>
                    <h2 class="text-4xl lg:text-5xl font-black text-[var(--text-main)] leading-tight">HRMPSB &amp; System Goals</h2>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">

                    <!-- HRMPSB info -->
                    <div class="emerge-hidden bg-[var(--surface)] rounded-2xl border border-[var(--border-main)] p-8 shadow-sm">
                        <div class="flex items-center gap-3 mb-6 pb-5 border-b border-[var(--border-main)]">
                            <div class="w-11 h-11 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
                                <i class="pi pi-shield text-[var(--color-primary)] text-lg"></i>
                            </div>
                            <div>
                                <h3 class="text-[var(--text-main)] font-black text-lg leading-tight">HRMPSB</h3>
                                <p class="text-[var(--text-muted)] text-[11px] font-semibold">Human Resource Merit Promotion &amp; Selection Board</p>
                            </div>
                        </div>

                        <p class="text-[var(--text-sub)] text-sm leading-relaxed mb-7">
                            The HRMPSB ensures that appointments to vacant positions in DepEd SDO Guihulngan City are made in accordance with the principle of merit and fitness, consistent with CSC rules and DepEd guidelines.
                        </p>

                        <h4 class="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] mb-4">Board Composition</h4>
                        <div class="space-y-3">
                            <div v-for="member in [
                                { role: 'Chairperson', name: 'Schools Division Superintendent', icon: 'pi pi-crown' },
                                { role: 'Vice Chairperson', name: 'Asst. Schools Division Superintendent', icon: 'pi pi-star' },
                                { role: 'Member', name: 'Division HR Officer', icon: 'pi pi-id-card' },
                                { role: 'Member', name: 'Representative Employee', icon: 'pi pi-user' },
                                { role: 'Member', name: 'Division Planning Officer', icon: 'pi pi-chart-line' },
                            ]" :key="member.name"
                                class="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)]"
                            >
                                <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
                                    <i :class="member.icon" class="text-[var(--color-primary)] text-xs"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-[var(--text-main)] font-bold text-xs leading-none">{{ member.name }}</p>
                                    <p class="text-[var(--text-faint)] text-[10px] font-semibold uppercase tracking-wider mt-1">{{ member.role }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- System objectives -->
                    <div class="emerge-hidden space-y-4" style="transition-delay: 150ms;">
                        <h3 class="text-[var(--text-main)] font-black text-xl mb-6 flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                                <i class="pi pi-bullseye text-white text-sm"></i>
                            </div>
                            System Objectives
                        </h3>
                        <div
                            v-for="(obj, i) in [
                                'Digitize the end-to-end recruitment process for SDO Guihulngan City',
                                'Ensure merit-based, transparent, and auditable selection',
                                'Streamline applicant document submission and verification',
                                'Generate automated Comparative Assessment rankings',
                                'Preserve complete digital records of all recruitment activities',
                            ]"
                            :key="i"
                            class="flex items-start gap-4 p-5 bg-[var(--surface)] rounded-xl border border-[var(--border-main)] shadow-sm hover:border-[var(--color-primary)] hover:shadow-md transition-all duration-300 group cursor-default"
                        >
                            <div class="w-9 h-9 rounded-xl bg-[var(--color-primary)] text-white font-black text-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                {{ i + 1 }}
                            </div>
                            <p class="text-[var(--text-sub)] text-sm font-semibold leading-relaxed pt-1.5">{{ obj }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ══════════════════════════════════════════════════════════
             7. ANNOUNCEMENTS / BULLETIN
        ══════════════════════════════════════════════════════════ -->
        <section class="bg-[var(--surface)]">
            <div class="max-w-[1400px] mx-auto px-8 pt-14 pb-0">
                <div class="flex items-center gap-4 mb-0 emerge-hidden">
                    <div class="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center">
                        <i class="pi pi-megaphone text-[var(--color-primary)] text-base"></i>
                    </div>
                    <div>
                        <span class="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-primary)] block mb-0.5">Corporate Updates</span>
                        <h2 class="text-3xl font-black text-[var(--text-main)] leading-none">Bulletin Board</h2>
                    </div>
                </div>
            </div>
            <HomeBulletin @open-bulletin="handleOpenBulletin" />
        </section>

        <!-- ══════════════════════════════════════════════════════════
             8. OPEN POSITIONS
        ══════════════════════════════════════════════════════════ -->
        <HomeJob @open-job="handleOpenJob" />

        <!-- ══════════════════════════════════════════════════════════
             9. ORGANIZATIONAL CHART
        ══════════════════════════════════════════════════════════ -->
        <section id="org" class="py-24 px-8 bg-[var(--surface)]">
            <div class="max-w-[1400px] mx-auto">
                <div class="text-center mb-14 emerge-hidden">
                    <div class="flex items-center justify-center gap-3 mb-4">
                        <div class="h-px w-10 bg-[var(--color-gold)]"></div>
                        <span class="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-muted)]">Leadership</span>
                        <div class="h-px w-10 bg-[var(--color-gold)]"></div>
                    </div>
                    <h2 class="text-4xl lg:text-5xl font-black text-[var(--text-main)] leading-tight">Organizational Structure</h2>
                    <p class="text-[var(--text-muted)] text-sm font-medium mt-3">SDO Guihulngan City</p>
                </div>

                <!-- Org chart tree -->
                <div class="org-tree emerge-hidden" style="transition-delay: 100ms;">

                    <!-- Level 1: SDS -->
                    <div class="flex justify-center mb-0">
                        <div class="org-node org-node-top">
                            <div class="w-14 h-14 rounded-full bg-[var(--color-navy)] flex items-center justify-center mx-auto mb-3 ring-4 ring-[var(--color-gold)] ring-offset-2">
                                <i class="pi pi-crown text-[var(--color-gold)] text-xl"></i>
                            </div>
                            <p class="text-white font-black text-sm leading-tight">Dr. Maria C. Santos</p>
                            <p class="text-white/55 text-[10px] font-bold uppercase tracking-wider mt-1">CESO V</p>
                            <div class="mt-2 inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest" style="background: rgba(239,191,4,0.2); color: var(--color-gold);">Schools Division Superintendent</div>
                        </div>
                    </div>

                    <!-- Connector line -->
                    <div class="flex justify-center">
                        <div class="w-0.5 h-8 bg-[var(--border-main)]"></div>
                    </div>

                    <!-- Level 2 -->
                    <div class="flex flex-col lg:flex-row justify-center gap-4 lg:gap-6 mb-0">
                        <div class="flex justify-center">
                            <div class="org-node org-node-l2">
                                <div class="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center mx-auto mb-2">
                                    <i class="pi pi-user text-white text-sm"></i>
                                </div>
                                <p class="text-[var(--text-main)] font-black text-xs leading-tight">Dr. Jose R. Dela Cruz</p>
                                <p class="text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider mt-1">Asst. SDS</p>
                            </div>
                        </div>
                        <div class="flex justify-center">
                            <div class="org-node org-node-l2">
                                <div class="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center mx-auto mb-2">
                                    <i class="pi pi-book text-white text-sm"></i>
                                </div>
                                <p class="text-[var(--text-main)] font-black text-xs leading-tight">Dr. Lourdes B. Enriquez</p>
                                <p class="text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider mt-1">CID Chief</p>
                            </div>
                        </div>
                        <div class="flex justify-center">
                            <div class="org-node org-node-l2">
                                <div class="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center mx-auto mb-2">
                                    <i class="pi pi-building text-white text-sm"></i>
                                </div>
                                <p class="text-[var(--text-main)] font-black text-xs leading-tight">Dr. Fernando A. Lim</p>
                                <p class="text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider mt-1">SGOD Chief</p>
                            </div>
                        </div>
                    </div>

                    <!-- Connector lines -->
                    <div class="flex justify-center">
                        <div class="w-0.5 h-8 bg-[var(--border-main)]"></div>
                    </div>

                    <!-- Level 3 -->
                    <div class="flex flex-wrap justify-center gap-3">
                        <div v-for="member in [
                            { name: 'Ms. Ana P. Reyes', title: 'Division HR Officer', icon: 'pi pi-id-card' },
                            { name: 'Mr. Ramon T. Flores', title: 'Div. Planning Officer', icon: 'pi pi-chart-line' },
                            { name: 'Mr. Kenneth J. Montejo', title: 'ICT Coordinator', icon: 'pi pi-desktop' },
                        ]" :key="member.name"
                            class="org-node org-node-l3"
                        >
                            <div class="w-9 h-9 rounded-full bg-[var(--bg-app)] border-2 border-[var(--border-main)] flex items-center justify-center mx-auto mb-2">
                                <i :class="member.icon" class="text-[var(--color-primary)] text-sm"></i>
                            </div>
                            <p class="text-[var(--text-main)] font-bold text-[11px] leading-tight">{{ member.name }}</p>
                            <p class="text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider mt-1">{{ member.title }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ══════════════════════════════════════════════════════════
             10. ICT TEAM
        ══════════════════════════════════════════════════════════ -->
        <section id="team" class="py-24 px-8" style="background: var(--bg-app);">
            <div class="max-w-[1400px] mx-auto">

                <div class="text-center mb-14 emerge-hidden">
                    <div class="flex items-center justify-center gap-3 mb-4">
                        <div class="h-px w-10 bg-[var(--color-primary)]"></div>
                        <span class="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-primary)]">ICT Unit</span>
                        <div class="h-px w-10 bg-[var(--color-primary)]"></div>
                    </div>
                    <h2 class="text-4xl lg:text-5xl font-black text-[var(--text-main)] leading-tight">People Behind the System</h2>
                    <p class="text-[var(--text-muted)] text-sm font-medium mt-3 max-w-lg mx-auto">The dedicated ICT professionals who designed, built, and maintain the Guih-Ranking recruitment portal.</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div
                        v-for="(member, i) in teamMembers"
                        :key="member.name"
                        @click="openTeamMember(member)"
                        class="emerge-hidden bg-[var(--surface)] rounded-2xl border border-[var(--border-main)] overflow-hidden shadow-sm cursor-pointer team-card group"
                        :style="{ transitionDelay: (i * 80) + 'ms' }"
                    >
                        <!-- Photo -->
                        <div class="relative overflow-hidden" style="height: 200px;">
                            <img
                                :src="member.image"
                                :alt="member.name"
                                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div class="absolute inset-0 bg-gradient-to-t from-[var(--color-navy)]/80 via-transparent to-transparent"></div>
                            <div class="absolute bottom-3 left-3 right-3">
                                <div class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider" style="background: rgba(239,191,4,0.9); color: var(--color-navy);">
                                    <i class="pi pi-desktop text-[var(--color-navy)] text-[9px]"></i>
                                    ICT Unit
                                </div>
                            </div>
                        </div>

                        <!-- Info -->
                        <div class="p-5">
                            <h3 class="text-[var(--text-main)] font-black text-base leading-tight">{{ member.name }}</h3>
                            <p class="text-[var(--color-primary)] text-xs font-bold mt-1 leading-snug">{{ member.role }}</p>
                            <p class="text-[var(--text-faint)] text-[10px] font-semibold uppercase tracking-wider mt-2">{{ member.unit }}</p>

                            <div class="mt-4 flex items-center gap-2 text-[var(--color-primary)] text-xs font-black opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                                <i class="pi pi-arrow-up-right text-[10px]"></i>
                                View Profile
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ══════════════════════════════════════════════════════════
             11. FAQ
        ══════════════════════════════════════════════════════════ -->
        <section id="faq" class="py-24 px-8 bg-[var(--surface)]">
            <div class="max-w-[900px] mx-auto">

                <div class="text-center mb-14 emerge-hidden">
                    <div class="flex items-center justify-center gap-3 mb-4">
                        <div class="h-px w-10 bg-[var(--color-gold)]"></div>
                        <span class="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-muted)]">Help Center</span>
                        <div class="h-px w-10 bg-[var(--color-gold)]"></div>
                    </div>
                    <h2 class="text-4xl lg:text-5xl font-black text-[var(--text-main)] leading-tight">Frequently Asked Questions</h2>
                    <p class="text-[var(--text-muted)] text-sm font-medium mt-3">Everything you need to know about the recruitment process.</p>
                </div>

                <div class="space-y-3">
                    <div
                        v-for="(faq, i) in faqs"
                        :key="i"
                        class="emerge-hidden rounded-xl border border-[var(--border-main)] overflow-hidden transition-all duration-200"
                        :class="activeFaq === i ? 'border-[var(--color-primary)] shadow-md' : 'hover:border-[var(--text-faint)]'"
                        :style="{ transitionDelay: (i * 40) + 'ms' }"
                    >
                        <button
                            @click="toggleFaq(i)"
                            class="w-full flex items-center justify-between gap-4 px-6 py-5 text-left outline-none transition-colors duration-200"
                            :class="activeFaq === i ? 'bg-[var(--color-primary-light)]' : 'bg-[var(--surface)] hover:bg-[var(--bg-app)]'"
                        >
                            <div class="flex items-center gap-4">
                                <span
                                    class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors duration-200"
                                    :class="activeFaq === i ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--bg-app)] text-[var(--text-muted)]'"
                                >
                                    {{ i + 1 }}
                                </span>
                                <span
                                    class="text-sm font-bold leading-snug transition-colors duration-200"
                                    :class="activeFaq === i ? 'text-[var(--color-primary)]' : 'text-[var(--text-main)]'"
                                >
                                    {{ faq.q }}
                                </span>
                            </div>
                            <i
                                class="pi text-lg shrink-0 transition-all duration-300"
                                :class="activeFaq === i ? 'pi-angle-up text-[var(--color-primary)]' : 'pi-angle-down text-[var(--text-faint)]'"
                            ></i>
                        </button>
                        <Transition name="faq-expand">
                            <div v-if="activeFaq === i" class="px-6 pb-5 pt-1">
                                <div class="pl-11">
                                    <p class="text-[var(--text-sub)] text-sm leading-relaxed font-medium">{{ faq.a }}</p>
                                </div>
                            </div>
                        </Transition>
                    </div>
                </div>

                <!-- CTA below FAQ -->
                <div class="mt-12 text-center emerge-hidden">
                    <p class="text-[var(--text-muted)] text-sm mb-5">Still have questions? Contact the Division HR Unit directly.</p>
                    <a
                        href="mailto:guihulngancity@deped.gov.ph"
                        class="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95"
                        style="background: var(--color-primary); color: white; box-shadow: 0 8px 24px rgba(74,77,143,0.25);"
                    >
                        <i class="pi pi-envelope text-sm"></i>
                        Contact HR Unit
                    </a>
                </div>
            </div>
        </section>

        <!-- ══════════════════════════════════════════════════════════
             12. FOOTER
        ══════════════════════════════════════════════════════════ -->
        <footer style="background: var(--color-navy);">

            <!-- Gold top strip -->
            <div class="h-1 w-full bg-gradient-to-r from-[var(--color-gold)] via-[var(--color-gold)]/50 to-transparent"></div>

            <div class="max-w-[1400px] mx-auto px-8 py-16">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

                    <!-- Brand column -->
                    <div class="lg:col-span-2 space-y-5">
                        <div class="flex items-center gap-3">
                            <div class="w-11 h-11 rounded-xl overflow-hidden border-2 border-white/15 shadow-lg">
                                <img
                                    v-if="settingsStore.resolvedLogoUrl"
                                    :src="settingsStore.resolvedLogoUrl"
                                    alt="SDO Logo"
                                    class="w-full h-full object-contain"
                                />
                                <div v-else class="w-full h-full bg-[var(--color-primary)] flex items-center justify-center">
                                    <i class="pi pi-shield text-white text-lg"></i>
                                </div>
                            </div>
                            <div>
                                <p class="text-white font-black text-base leading-none">{{ settingsStore.systemName || 'Guih-Ranking' }}</p>
                                <p class="text-white/45 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">SDO Guihulngan City</p>
                            </div>
                        </div>
                        <p class="text-white/55 text-sm leading-relaxed font-medium max-w-sm">
                            The official digital recruitment and selection portal of the Schools Division of Guihulngan City. Ensuring merit-based, transparent, and streamlined career opportunities for all.
                        </p>
                        <div class="flex items-start gap-2 text-white/45 text-xs font-medium">
                            <i class="pi pi-map-marker text-[var(--color-gold)] mt-0.5"></i>
                            <span>Poblacion, Guihulngan City, Negros Oriental, Negros Island Region (NIR), 6214</span>
                        </div>

                        <!-- Social links placeholder -->
                        <div class="flex items-center gap-3 pt-1">
                            <a v-for="soc in [
                                { icon: 'pi pi-facebook', label: 'Facebook' },
                                { icon: 'pi pi-twitter', label: 'Twitter' },
                                { icon: 'pi pi-youtube', label: 'YouTube' },
                            ]" :key="soc.label" href="#"
                                class="w-9 h-9 rounded-xl border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all duration-200"
                                :title="soc.label"
                            >
                                <i :class="soc.icon" class="text-sm"></i>
                            </a>
                        </div>
                    </div>

                    <!-- Navigation column -->
                    <div class="space-y-4">
                        <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Navigation</h4>
                        <ul class="space-y-2">
                            <li v-for="link in navLinks.slice(0, 5)" :key="link.id">
                                <button
                                    @click="scrollTo(link.id)"
                                    class="text-xs font-bold text-white/55 hover:text-white transition-colors duration-200 flex items-center gap-2 uppercase tracking-wider outline-none"
                                >
                                    <i class="pi pi-angle-right text-[var(--color-gold)] text-[10px]"></i>
                                    {{ link.label }}
                                </button>
                            </li>
                        </ul>
                    </div>

                    <!-- Resources column -->
                    <div class="space-y-4">
                        <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Portal</h4>
                        <ul class="space-y-2">
                            <li v-for="link in navLinks.slice(5)" :key="link.id">
                                <button
                                    @click="scrollTo(link.id)"
                                    class="text-xs font-bold text-white/55 hover:text-white transition-colors duration-200 flex items-center gap-2 uppercase tracking-wider outline-none"
                                >
                                    <i class="pi pi-angle-right text-[var(--color-gold)] text-[10px]"></i>
                                    {{ link.label }}
                                </button>
                            </li>
                        </ul>
                        <ul class="space-y-2 pt-2 border-t border-white/10">
                            <li>
                                <button
                                    @click="router.push('/auth/login')"
                                    class="text-xs font-bold text-white/55 hover:text-white transition-colors duration-200 flex items-center gap-2 uppercase tracking-wider outline-none"
                                >
                                    <i class="pi pi-sign-in text-[var(--color-gold)] text-[10px]"></i>
                                    Sign In
                                </button>
                            </li>
                            <li>
                                <button
                                    @click="router.push('/auth/register')"
                                    class="text-xs font-bold text-white/55 hover:text-white transition-colors duration-200 flex items-center gap-2 uppercase tracking-wider outline-none"
                                >
                                    <i class="pi pi-user-plus text-[var(--color-gold)] text-[10px]"></i>
                                    Register
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Bottom bar -->
                <div class="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p class="text-[11px] font-bold text-white/30 uppercase tracking-widest">
                        &copy; 2025 Schools Division of Guihulngan City. All rights reserved.
                    </p>
                    <div class="flex items-center gap-3">
                        <i class="pi pi-desktop text-[var(--color-gold)] text-xs"></i>
                        <p class="text-[11px] font-bold text-white/30 uppercase tracking-widest">
                            Powered by DepEd ICT Unit &mdash; SDO Guihulngan City
                        </p>
                    </div>
                </div>
            </div>
        </footer>

        <!-- ── Modals ──────────────────────────────────────────────── -->
        <HomeJobModal v-model:visible="isModalOpen" :job="activeJob" />
        <HomeTeamModal v-model:visible="isTeamModalOpen" :member="selectedMember" />
        <HomeBulletinModal v-model:visible="isBulletinDialogOpen" :announcement="selectedAnnouncement" />

    </div>
</template>

<style>
/* ── Hero animated blobs ────────────────────────────────────────── */
.blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.18;
    pointer-events: none;
}
.blob-1 {
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, #4A4D8F 0%, transparent 70%);
    top: -150px;
    right: -100px;
    animation: blobFloat1 18s ease-in-out infinite;
}
.blob-2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, #EFBF04 0%, transparent 70%);
    bottom: 80px;
    left: 5%;
    animation: blobFloat2 22s ease-in-out infinite;
}
.blob-3 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, #5B84BA 0%, transparent 70%);
    top: 30%;
    left: 45%;
    animation: blobFloat3 16s ease-in-out infinite;
}
.blob-4 {
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, #EFBF04 0%, transparent 70%);
    top: 15%;
    left: 25%;
    animation: blobFloat4 20s ease-in-out infinite;
    opacity: 0.1;
}

@keyframes blobFloat1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(-40px, 60px) scale(1.1); }
    66%       { transform: translate(30px, -40px) scale(0.9); }
}
@keyframes blobFloat2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    40%       { transform: translate(60px, -50px) scale(1.15); }
    70%       { transform: translate(-30px, 30px) scale(0.9); }
}
@keyframes blobFloat3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%       { transform: translate(-50px, -60px) scale(1.2); }
}
@keyframes blobFloat4 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    30%       { transform: translate(40px, 50px) scale(0.85); }
    70%       { transform: translate(-20px, -30px) scale(1.1); }
}

/* ── Particle dot grid ──────────────────────────────────────────── */
.particle-grid {
    position: absolute;
    inset: 0;
    background-image:
        radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
}

/* ── Hero glassmorphism cards ───────────────────────────────────── */
.hero-glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
}
.stat-glass {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
.hero-badge {
    background: rgba(74, 77, 143, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

/* ── Mission cards ──────────────────────────────────────────────── */
.mission-card {
    background: rgba(255, 255, 255, 0.04);
    transition: background 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
}
.mission-card:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
}

/* ── Core value cards ───────────────────────────────────────────── */
.core-value-card {
    background: rgba(255, 255, 255, 0.04);
    transition: background 0.3s ease, transform 0.3s ease;
}
.core-value-card:hover {
    background: rgba(255, 255, 255, 0.09);
    transform: translateY(-3px);
}

/* ── Org tree ───────────────────────────────────────────────────── */
.org-tree {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
}
.org-node-top {
    background: var(--color-navy);
    border: 2px solid var(--color-gold);
    border-radius: 16px;
    padding: 20px 28px;
    text-align: center;
    min-width: 220px;
    box-shadow: 0 8px 32px rgba(0,31,63,0.15);
    transition: transform 0.3s ease;
}
.org-node-top:hover { transform: translateY(-3px); }
.org-node-l2 {
    background: var(--surface);
    border: 1.5px solid var(--border-main);
    border-radius: 14px;
    padding: 16px 20px;
    text-align: center;
    min-width: 160px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    transition: transform 0.3s ease, border-color 0.3s ease;
}
.org-node-l2:hover {
    transform: translateY(-2px);
    border-color: var(--color-primary);
}
.org-node-l3 {
    background: var(--bg-app);
    border: 1.5px solid var(--border-main);
    border-radius: 12px;
    padding: 14px 18px;
    text-align: center;
    min-width: 150px;
    transition: transform 0.25s ease, border-color 0.25s ease;
}
.org-node-l3:hover {
    transform: translateY(-2px);
    border-color: var(--color-primary);
}

/* ── Team cards ─────────────────────────────────────────────────── */
.team-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}
.team-card:hover {
    transform: translateY(-6px) scale(1.01);
    box-shadow: 0 16px 48px rgba(74,77,143,0.15);
    border-color: var(--color-primary);
}

/* ── Scroll bounce indicator ────────────────────────────────────── */
.scroll-bounce {
    animation: scrollBounce 2s ease-in-out infinite;
}
@keyframes scrollBounce {
    0%, 100% { transform: translateY(0); opacity: 0.5; }
    50%       { transform: translateY(6px); opacity: 1; }
}

/* ── Hero text transitions ──────────────────────────────────────── */
.hero-text-enter-active,
.hero-text-leave-active {
    transition: opacity 0.5s ease, transform 0.5s ease;
}
.hero-text-enter-from {
    opacity: 0;
    transform: translateY(16px);
}
.hero-text-leave-to {
    opacity: 0;
    transform: translateY(-12px);
}
.hero-sub-enter-active,
.hero-sub-leave-active {
    transition: opacity 0.45s ease 0.08s, transform 0.45s ease 0.08s;
}
.hero-sub-enter-from {
    opacity: 0;
    transform: translateY(10px);
}
.hero-sub-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

/* ── FAQ expand transition ──────────────────────────────────────── */
.faq-expand-enter-active {
    transition: max-height 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease;
    max-height: 400px;
    overflow: hidden;
}
.faq-expand-leave-active {
    transition: max-height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.25s ease;
    max-height: 400px;
    overflow: hidden;
}
.faq-expand-enter-from,
.faq-expand-leave-to {
    max-height: 0;
    opacity: 0;
}

/* ── Mobile menu slide ──────────────────────────────────────────── */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

/* ── Scroll reveal (emerge) ─────────────────────────────────────── */
.emerge-hidden {
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 1s cubic-bezier(0.2, 0.8, 0.2, 1), transform 1s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.emerge-visible {
    opacity: 1;
    transform: translateY(0);
}

/* ── Scrollbar utility ──────────────────────────────────────────── */
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>
