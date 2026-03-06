<script setup>
import { ref, onMounted, computed, watch, reactive, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Swal from 'sweetalert2'; // Assuming standard import, or use inject if provided globally

// 🪄 IMPORT MODALS
import HomeJobModal from '@/components/Modals/HomeJobModal.vue';
import HomeTeamModal from '@/components/Modals/HomeTeamModal.vue';
import HomeBulletinModal from '@/components/Modals/HomeBulletinModal.vue';

const router = useRouter();
const authStore = useAuthStore();
const toast = inject('$toast', Swal); // Falls back to Swal if $toast isn't injected

// UI STATE
const isModalOpen = ref(false);
const activeJob = ref(null);
const bookmarks = ref([false, false, false]);
const logoSize = ref(40);

// ==============================================
// 🛠️ MANUAL LAYOUT ADJUSTMENT KNOBS
// ==============================================
const layoutAdjustment = reactive({
    bulletinMinHeight: 150,
    bulletinPicWidth: 42,
    bulletinRounding: 8,
    jobCardMinHeight: 180,
    jobCardRounding: 8,
    jobCardPadding: 28,
    imageFitMode: 'cover'
});

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

// --- BULLETIN BOARD DATA ---
const isBulletinDialogOpen = ref(false);
const selectedAnnouncement = ref(null);

const announcements = ref([
    {
        id: 1,
        title: "PRIME-HRM Level 2 Accreditation",
        date: "October 24, 2025",
        category: "Achievement",
        content: "Division of Guihulngan City has successfully achieved PRIME-HRM Level 2 Accreditation.",
        image: "https://images.unsplash.com/photo-1523050335392-9bef867a0578?auto=format&fit=crop&q=80&w=800",
        publisherName: "HRMO Guihulngan"
    },
    {
        id: 2,
        title: "Upcoming Teacher Induction Program",
        date: "November 05, 2025",
        category: "Event",
        content: "Mandatory orientation session for all newly hired Teacher I personnel.",
        image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800",
        publisherName: "Personnel Unit"
    }
]);

const openBulletinDetail = (item) => {
    selectedAnnouncement.value = item;
    isBulletinDialogOpen.value = true;
};

// 🪄 PAGE FLIP LOGIC
const expandedId = ref(null);
const currentSpreadIndex = ref(0);
const isFlipping = ref(false);

const spreads = computed(() => {
    const arr = [];
    for (let i = 0; i < announcements.value.length; i += 2) {
        arr.push({
            left: announcements.value[i],
            right: announcements.value[i + 1] || null
        });
    }
    return arr;
});

const turnPage = (direction) => {
    if (isFlipping.value) return;
    if (direction === 'next' && currentSpreadIndex.value >= spreads.value.length - 1) return;
    if (direction === 'prev' && currentSpreadIndex.value <= 0) return;

    isFlipping.value = true;
    setTimeout(() => {
        direction === 'next' ? currentSpreadIndex.value++ : currentSpreadIndex.value--;
        isFlipping.value = false;
    }, 600);
};

// --- JOB VACANCIES ---
const searchQuery = ref('');
const selectedCategory = ref('All');
const categories = ref(['All', 'Teaching', 'Teaching Related', 'Non-Teaching']);

const jobList = ref([
    { title: 'Teacher I (Elementary)', type: 'Full-Time', division: 'DIVISION OFFICE', category: 'Teaching' },
    { title: 'Administrative Support', type: 'Contract', division: 'DIVISION OFFICE', category: 'Non-Teaching' }
]);

const filteredJobs = computed(() => {
    return jobList.value.filter(job => {
        const matchesSearch = !searchQuery.value || job.title.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesCategory = selectedCategory.value === 'All' || job.category === selectedCategory.value;
        return matchesSearch && matchesCategory;
    });
});

// --- TEAM & BOARD ---
const isTeamModalOpen = ref(false);
const selectedMember = ref(null);
const teamMembers = ref([
    { name: "Mr. Mel E. Gactho", role: "ITO II", email: "mel.gactho@deped.gov.ph" },
    { name: "Joh Dave Kenneth Ricablanca", role: "TEAM LEADER" }
]);

const openTeamDetail = (member) => {
    selectedMember.value = member;
    isTeamModalOpen.value = true;
};

// --- AUTH ACTIONS & NAVIGATION ---
const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const handleLogout = async () => {
    try {
        await authStore.logout();
        toast.fire({
            icon: 'success',
            title: 'Logged out successfully',
            timer: 3000,
            toast: true,
            position: 'top-end',
            showConfirmButton: false
        });
    } catch (error) {
        toast.fire({ icon: 'error', title: 'Logout failed' });
    }
};

const openModal = (job) => {
    activeJob.value = job;
    isModalOpen.value = true;
};

// 🪄 LEAFLET MAP INITIALIZATION
let mapInstance = null;

const initLeafletMap = () => {
    if (typeof window === 'undefined' || !window.L) return;
    const container = document.getElementById('leaflet-map');
    if (!container) return;

    if (mapInstance) mapInstance.remove();

    mapInstance = window.L.map('leaflet-map', {
        center: [10.118538, 123.268849],
        zoom: 17,
        scrollWheelZoom: false
    });

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
    window.L.marker([10.118538, 123.268849]).addTo(mapInstance)
        .bindPopup('<b>DepEd Guihulngan City Division Office</b>').openPopup();
};

onMounted(() => {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    fetchWeather();

    // Dynamically load Leaflet if not present
    if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initLeafletMap();
        document.head.appendChild(script);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
    } else {
        initLeafletMap();
    }
});
</script>

<template>
    <div class="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-slate-200 selection:text-slate-900"
        style="font-family: 'Avenir', sans-serif;">

        <nav
            class="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200 sticky top-0 z-[100]">
            <div class="flex items-center gap-4 w-1/4 group cursor-pointer" @click="scrollTo('home')">
                <img src="https://i.ibb.co/7dHhWCpp/images.png" alt="Logo" class="object-contain w-10 h-10" />
                <div class="flex flex-col leading-none">
                    <span class="text-lg font-bold text-slate-900 tracking-tight">RSP Portal</span>
                    <span class="text-[10px] text-slate-500 uppercase font-semibold tracking-widest mt-1">DepEd
                        GNC</span>
                </div>
            </div>

            <div class="flex items-center justify-center gap-6 flex-1">
                <button v-for="link in ['home', 'bullet', 'jobs', 'about', 'teams', 'faq']" :key="link"
                    class="text-slate-500 font-semibold hover:text-slate-900 transition-colors duration-200 text-xs uppercase tracking-widest outline-none"
                    @click="scrollTo(link)">
                    {{ link === 'bullet' ? 'Bulletin' : (link === 'jobs' ? 'Vacancies' : (link === 'faq' ? 'Help Center'
                    : link)) }}
                </button>
            </div>

            <div class="flex items-center justify-end gap-6 w-1/4">
                <div class="hidden lg:flex flex-col items-end leading-none border-r border-slate-200 pr-6">
                    <div class="flex items-center gap-2 mb-1">
                        <span v-if="weatherStatus === 'sunny'" class="text-lg animate-pulse-slow">☀️</span>
                        <span v-else class="text-lg animate-bounce">💧</span>
                        <span class="text-sm font-bold text-slate-900">{{ currentTime }}</span>
                    </div>
                    <span class="text-[10px] text-slate-500 uppercase font-semibold tracking-widest">{{ currentDate
                        }}</span>
                </div>
                <template v-if="authStore.isAuthenticated">
                    <div @click="router.push(authStore.dashboardRoute)" title="Go to User Profile"
                        class="cursor-pointer inline-flex items-center ring-1 ring-slate-200 hover:ring-slate-400 rounded-md transition-all duration-200">
                        <Avatar :label="authStore.user?.username?.charAt(0).toUpperCase() || 'U'" shape="square"
                            class="bg-slate-100 text-slate-900 font-bold rounded-md" />
                    </div>
                    <Button icon="pi pi-sign-out" severity="secondary" text title="Logout" @click="handleLogout"
                        class="text-slate-500 hover:text-slate-900 transition-colors" />
                </template>
                <button v-else
                    class="bg-slate-900 border border-slate-900 px-6 py-2.5 text-white font-bold text-xs uppercase tracking-widest rounded hover:bg-slate-800 transition-all duration-200"
                    @click="router.push('/auth/login')">
                    Sign In
                </button>
            </div>
        </nav>

        <main id="home" class="w-full bg-slate-50 relative border-b border-slate-200">
            <Carousel :value="[1, 2, 3]" :numVisible="1" :numScroll="1" :circular="true" :autoplayInterval="8000"
                :showNavigators="false" class="material-carousel relative z-10">
                <template #item="slotProps">
                    <div
                        class="grid grid-cols-1 lg:grid-cols-2 max-w-7xl mx-auto w-full items-center px-8 py-32 gap-16 text-left">
                        <div class="space-y-8 z-10 pr-12">
                            <span
                                class="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-300 pb-1">Division
                                of Guihulngan City</span>
                            <h1 v-if="slotProps.data === 1"
                                class="text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">RSP
                                Management Portal.</h1>
                            <h1 v-else-if="slotProps.data === 2"
                                class="text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                                Commitment to Excellence.</h1>
                            <h1 v-else
                                class="text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                                Standardized Merit System.</h1>
                            <p class="text-slate-600 text-lg leading-relaxed font-medium max-w-lg">Streamlined online
                                recruitment and selection framework designed for human resource efficiency.</p>
                        </div>
                        <div class="hidden lg:block relative w-full"
                            :style="{ height: layoutAdjustment.carouselPicHeight + 'px' }">
                            <div class="relative h-full w-full overflow-hidden bg-white border border-slate-200"
                                :style="{ borderRadius: layoutAdjustment.carouselRounding + 'px' }">
                                <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200"
                                    class="w-full h-full object-cover grayscale-[20%] contrast-125"
                                    alt="Corporate Office" />
                            </div>
                        </div>
                    </div>
                </template>
            </Carousel>
        </main>

        <section id="bullet" class="py-32 px-8 max-w-[95rem] mx-auto w-full relative">
            <div class="mb-16 flex flex-col items-start border-l-4 border-slate-900 pl-6">
                <span class="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Corporate
                    Updates</span>
                <h2 class="text-3xl font-bold text-slate-900 tracking-tight">Bulletin Board</h2>
            </div>

            <div class="relative w-full max-w-6xl h-[650px] mx-auto perspective-book">
                <div
                    class="relative w-full h-full transform-3d border border-slate-200 shadow-sm rounded-md bg-white flex overflow-visible">

                    <div class="w-1/2 h-full border-r border-slate-200 p-12 bg-white rounded-l-md overflow-hidden relative z-10 cursor-pointer hover:bg-slate-50/50 transition-colors duration-300"
                        @click="turnPage('prev')" @mouseleave="expandedId = null">
                        <div v-if="renderedLeft" class="flex flex-col h-full relative">
                            <div class="flex items-center gap-3 mb-8">
                                <div
                                    class="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex items-center justify-center">
                                    <i :class="[renderedLeft.icon, 'text-slate-700 text-lg']"></i>
                                </div>
                                <span class="text-xs font-semibold text-slate-500 uppercase tracking-widest">{{
                                    renderedLeft.date }}</span>
                            </div>

                            <h3 @mouseenter="expandedId = renderedLeft.id" @click.stop
                                class="text-2xl font-bold text-slate-900 mb-4 leading-tight cursor-default group flex items-start justify-between hover:text-slate-600 transition-colors">
                                <span class="pr-4">{{ renderedLeft.title }}</span>
                                <div
                                    class="w-8 h-8 rounded border border-slate-200 bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                    <i class="pi pi-arrow-up-right text-slate-700 text-xs"></i>
                                </div>
                            </h3>
                            <p class="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium">{{
                                renderedLeft.overview
                                }}</p>

                            <div class="mt-auto">
                                <img :src="renderedLeft.image"
                                    class="w-full h-64 object-cover rounded border border-slate-200 mb-2 grayscale-[10%]" />
                            </div>

                            <div @click.stop
                                class="absolute inset-x-0 bottom-0 h-[96%] bg-white/95 backdrop-blur-md p-10 border-t border-slate-200 transition-all duration-700 ease-[cubic-bezier(0.645,0.045,0.355,1)] flex flex-col z-20 cursor-auto"
                                :class="expandedId === renderedLeft.id ? 'translate-y-0 opacity-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]' : 'translate-y-[120%] opacity-0 shadow-none'">

                                <div class="flex justify-between items-start mb-8 pb-4 border-b border-slate-200">
                                    <h4 class="font-bold text-slate-900 text-lg tracking-tight">Announcement Details
                                    </h4>
                                    <Button icon="pi pi-times" rounded text @click.stop="expandedId = null"
                                        class="text-slate-400 hover:text-slate-900 hover:bg-slate-100 -mt-2 -mr-2 transition-colors" />
                                </div>

                                <div class="flex flex-col gap-4 mb-8">
                                    <div class="flex items-center gap-3">
                                        <img :src="renderedLeft.publisherImage"
                                            class="w-8 h-8 rounded border border-slate-200 object-cover" />
                                        <div class="flex flex-col leading-none">
                                            <span class="text-xs font-bold text-slate-900">{{ renderedLeft.publisherName
                                                }}</span>
                                            <span
                                                class="text-[9px] text-slate-500 font-semibold uppercase tracking-widest mt-1">Publisher</span>
                                        </div>
                                    </div>
                                    <div
                                        class="grid grid-cols-2 gap-4 text-xs text-slate-600 font-medium bg-slate-50 p-4 rounded border border-slate-200">
                                        <div class="flex items-center gap-2"><i
                                                class="pi pi-calendar text-slate-400"></i> {{
                                            renderedLeft.date }}</div>
                                        <div class="flex items-center gap-2"><i class="pi pi-clock text-slate-400"></i>
                                            {{
                                            renderedLeft.time }}</div>
                                        <div class="flex items-center gap-2 col-span-2"><i
                                                class="pi pi-map-marker text-slate-400"></i> {{ renderedLeft.location }}
                                        </div>
                                    </div>
                                </div>

                                <div class="overflow-y-auto pr-2 custom-scrollbar pb-6 flex-grow">
                                    <p class="text-slate-600 leading-relaxed font-medium whitespace-pre-line text-sm">{{
                                        renderedLeft.content }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="w-1/2 h-full p-12 bg-white rounded-r-md overflow-hidden relative z-10 cursor-pointer hover:bg-slate-50/50 transition-colors duration-300"
                        @click="turnPage('next')" @mouseleave="expandedId = null">
                        <div v-if="renderedRight" class="flex flex-col h-full relative">
                            <div class="flex items-center gap-3 mb-8">
                                <div
                                    class="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex items-center justify-center">
                                    <i :class="[renderedRight.icon, 'text-slate-700 text-lg']"></i>
                                </div>
                                <span class="text-xs font-semibold text-slate-500 uppercase tracking-widest">{{
                                    renderedRight.date }}</span>
                            </div>

                            <h3 @mouseenter="expandedId = renderedRight.id" @click.stop
                                class="text-2xl font-bold text-slate-900 mb-4 leading-tight cursor-default group flex items-start justify-between hover:text-slate-600 transition-colors">
                                <span class="pr-4">{{ renderedRight.title }}</span>
                                <div
                                    class="w-8 h-8 rounded border border-slate-200 bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                    <i class="pi pi-arrow-up-right text-slate-700 text-xs"></i>
                                </div>
                            </h3>
                            <p class="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium">{{
                                renderedRight.overview
                                }}</p>

                            <div class="mt-auto">
                                <img :src="renderedRight.image"
                                    class="w-full h-64 object-cover rounded border border-slate-200 mb-2 grayscale-[10%]" />
                            </div>

                            <div @click.stop
                                class="absolute inset-x-0 bottom-0 h-[96%] bg-white/95 backdrop-blur-md p-10 border-t border-slate-200 transition-all duration-700 ease-[cubic-bezier(0.645,0.045,0.355,1)] flex flex-col z-20 cursor-auto"
                                :class="expandedId === renderedRight.id ? 'translate-y-0 opacity-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]' : 'translate-y-[120%] opacity-0 shadow-none'">

                                <div class="flex justify-between items-start mb-8 pb-4 border-b border-slate-200">
                                    <h4 class="font-bold text-slate-900 text-lg tracking-tight">Announcement Details
                                    </h4>
                                    <Button icon="pi pi-times" rounded text @click.stop="expandedId = null"
                                        class="text-slate-400 hover:text-slate-900 hover:bg-slate-100 -mt-2 -mr-2 transition-colors" />
                                </div>

                                <div class="flex flex-col gap-4 mb-8">
                                    <div class="flex items-center gap-3">
                                        <img :src="renderedRight.publisherImage"
                                            class="w-8 h-8 rounded border border-slate-200 object-cover" />
                                        <div class="flex flex-col leading-none">
                                            <span class="text-xs font-bold text-slate-900">{{
                                                renderedRight.publisherName
                                                }}</span>
                                            <span
                                                class="text-[9px] text-slate-500 font-semibold uppercase tracking-widest mt-1">Publisher</span>
                                        </div>
                                    </div>
                                    <div
                                        class="grid grid-cols-2 gap-4 text-xs text-slate-600 font-medium bg-slate-50 p-4 rounded border border-slate-200">
                                        <div class="flex items-center gap-2"><i
                                                class="pi pi-calendar text-slate-400"></i> {{
                                            renderedRight.date }}</div>
                                        <div class="flex items-center gap-2"><i class="pi pi-clock text-slate-400"></i>
                                            {{
                                            renderedRight.time }}</div>
                                        <div class="flex items-center gap-2 col-span-2"><i
                                                class="pi pi-map-marker text-slate-400"></i> {{ renderedRight.location
                                            }}</div>
                                    </div>
                                </div>

                                <div class="overflow-y-auto pr-2 custom-scrollbar pb-6 flex-grow">
                                    <p class="text-slate-600 leading-relaxed font-medium whitespace-pre-line text-sm">{{
                                        renderedRight.content }}</p>
                                </div>
                            </div>
                        </div>
                        <div v-else class="flex flex-col items-center justify-center h-full space-y-4">
                            <i class="pi pi-stop text-4xl text-slate-200"></i>
                            <p class="text-sm font-semibold text-slate-400 uppercase tracking-widest">End of Entries</p>
                        </div>
                    </div>

                    <div v-if="isFlipping && flipDirection === 'next'" class="flipper-next transform-3d z-50">
                        <div
                            class="absolute inset-0 bg-white backface-hidden p-12 overflow-hidden rounded-r-md border-y border-r border-slate-200 shadow-[-5px_0_15px_rgba(0,0,0,0.05)]">
                            <div v-if="flipperFrontItem" class="flex flex-col h-full relative">
                                <div class="flex items-center gap-3 mb-8">
                                    <div
                                        class="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex items-center justify-center">
                                        <i :class="[flipperFrontItem.icon, 'text-slate-700 text-lg']"></i>
                                    </div>
                                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-widest">{{
                                        flipperFrontItem.date }}</span>
                                </div>
                                <h3 class="text-2xl font-bold text-slate-900 mb-4 leading-tight flex justify-between">
                                    <span class="pr-4">{{ flipperFrontItem.title }}</span>
                                    <div
                                        class="w-8 h-8 rounded bg-transparent flex items-center justify-center opacity-0 shrink-0">
                                    </div>
                                </h3>
                                <p class="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium">{{
                                    flipperFrontItem.overview }}</p>
                                <div class="mt-auto">
                                    <img :src="flipperFrontItem.image"
                                        class="w-full h-64 object-cover rounded border border-slate-200 mb-2 grayscale-[10%]" />
                                </div>
                            </div>
                        </div>
                        <div
                            class="absolute inset-0 bg-white backface-hidden p-12 overflow-hidden rounded-l-md border-y border-l border-slate-200 rotate-y-180 shadow-[5px_0_15px_rgba(0,0,0,0.05)]">
                            <div v-if="flipperBackItem" class="flex flex-col h-full relative">
                                <div class="flex items-center gap-3 mb-8">
                                    <div
                                        class="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex items-center justify-center">
                                        <i :class="[flipperBackItem.icon, 'text-slate-700 text-lg']"></i>
                                    </div>
                                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-widest">{{
                                        flipperBackItem.date }}</span>
                                </div>
                                <h3 class="text-2xl font-bold text-slate-900 mb-4 leading-tight flex justify-between">
                                    <span class="pr-4">{{ flipperBackItem.title }}</span>
                                    <div
                                        class="w-8 h-8 rounded bg-transparent flex items-center justify-center opacity-0 shrink-0">
                                    </div>
                                </h3>
                                <p class="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium">{{
                                    flipperBackItem.overview }}</p>
                                <div class="mt-auto">
                                    <img :src="flipperBackItem.image"
                                        class="w-full h-64 object-cover rounded border border-slate-200 mb-2 grayscale-[10%]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="isFlipping && flipDirection === 'prev'" class="flipper-prev transform-3d z-50">
                        <div
                            class="absolute inset-0 bg-white backface-hidden p-12 overflow-hidden rounded-l-md border-y border-l border-slate-200 shadow-[5px_0_15px_rgba(0,0,0,0.05)]">
                            <div v-if="flipperFrontItem" class="flex flex-col h-full relative">
                                <div class="flex items-center gap-3 mb-8">
                                    <div
                                        class="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex items-center justify-center">
                                        <i :class="[flipperFrontItem.icon, 'text-slate-700 text-lg']"></i>
                                    </div>
                                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-widest">{{
                                        flipperFrontItem.date }}</span>
                                </div>
                                <h3 class="text-2xl font-bold text-slate-900 mb-4 leading-tight flex justify-between">
                                    <span class="pr-4">{{ flipperFrontItem.title }}</span>
                                    <div
                                        class="w-8 h-8 rounded bg-transparent flex items-center justify-center opacity-0 shrink-0">
                                    </div>
                                </h3>
                                <p class="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium">{{
                                    flipperFrontItem.overview }}</p>
                                <div class="mt-auto">
                                    <img :src="flipperFrontItem.image"
                                        class="w-full h-64 object-cover rounded border border-slate-200 mb-2 grayscale-[10%]" />
                                </div>
                            </div>
                        </div>
                        <div
                            class="absolute inset-0 bg-white backface-hidden p-12 overflow-hidden rounded-r-md border-y border-r border-slate-200 rotate-y-180 shadow-[-5px_0_15px_rgba(0,0,0,0.05)]">
                            <div v-if="flipperBackItem" class="flex flex-col h-full relative">
                                <div class="flex items-center gap-3 mb-8">
                                    <div
                                        class="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex items-center justify-center">
                                        <i :class="[flipperBackItem.icon, 'text-slate-700 text-lg']"></i>
                                    </div>
                                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-widest">{{
                                        flipperBackItem.date }}</span>
                                </div>
                                <h3 class="text-2xl font-bold text-slate-900 mb-4 leading-tight flex justify-between">
                                    <span class="pr-4">{{ flipperBackItem.title }}</span>
                                    <div
                                        class="w-8 h-8 rounded bg-transparent flex items-center justify-center opacity-0 shrink-0">
                                    </div>
                                </h3>
                                <p class="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium">{{
                                    flipperBackItem.overview }}</p>
                                <div class="mt-auto">
                                    <img :src="flipperBackItem.image"
                                        class="w-full h-64 object-cover rounded border border-slate-200 mb-2 grayscale-[10%]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-200 z-[60] pointer-events-none"></div>
                </div>

                <div class="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <button
                        class="w-10 h-10 rounded border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-30 flex items-center justify-center"
                        @click="turnPage('prev')" :disabled="currentSpreadIndex === 0 || isFlipping">
                        <i class="pi pi-chevron-left text-xs"></i>
                    </button>
                    <button
                        class="w-10 h-10 rounded border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-30 flex items-center justify-center"
                        @click="turnPage('next')" :disabled="currentSpreadIndex === spreads.length - 1 || isFlipping">
                        <i class="pi pi-chevron-right text-xs"></i>
                    </button>
                </div>
            </div>
        </section>

        <section id="jobs" class="py-24 px-8 bg-slate-50 border-y border-slate-200 relative">
            <div class="max-w-[95rem] mx-auto w-full">

                <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div class="border-l-4 border-slate-900 pl-6">
                        <span class="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">Join
                            Our
                            Team</span>
                        <h2 class="text-3xl font-bold text-slate-900 tracking-tight">Active Vacancies</h2>
                    </div>

                    <div class="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div class="relative w-full sm:w-72">
                            <i
                                class="pi pi-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 z-10 pointer-events-none text-xs"></i>
                            <InputText v-model="searchQuery" placeholder="Search position..."
                                class="w-full pl-10 pr-4 py-2.5 text-sm rounded border border-slate-300 bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm" />
                        </div>

                        <SelectButton v-model="selectedCategory" :options="categories"
                            class="corporate-selectbutton whitespace-nowrap overflow-x-auto w-full sm:w-auto" />
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div v-for="(job, index) in filteredJobs" :key="index" @click="openModal(job)"
                        class="bg-white rounded-md border border-slate-200 hover:border-slate-400 transition-colors duration-200 cursor-pointer flex flex-col h-full relative group"
                        :style="{ minHeight: layoutAdjustment.jobCardMinHeight + 'px', padding: layoutAdjustment.jobCardPadding + 'px' }">

                        <div class="flex justify-between items-start mb-6">
                            <span class="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{{ job.division
                                }}</span>
                            <span
                                class="text-[10px] font-semibold border border-slate-200 text-slate-600 rounded px-2.5 py-1">{{
                                job.category }}</span>
                        </div>

                        <h3
                            class="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-slate-600 transition-colors">
                            {{ job.title }}</h3>
                        <p class="text-sm text-slate-500 line-clamp-2 mb-8 flex-grow leading-relaxed">{{ job.description
                            }}</p>

                        <div class="mt-auto border-t border-slate-100 pt-5 flex items-center justify-between text-sm">
                            <div class="flex items-center gap-2 text-slate-600 font-semibold">
                                <i class="pi pi-briefcase text-xs"></i> {{ job.type }}
                            </div>
                            <span
                                class="text-[10px] text-slate-400 group-hover:text-slate-900 font-bold uppercase tracking-widest transition-colors flex items-center gap-1">Details
                                <i class="pi pi-arrow-right text-[8px] mt-[1px]"></i></span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="about" class="py-32 px-8 bg-slate-900 text-left relative overflow-hidden">
            <div class="max-w-5xl mx-auto relative z-10">
                <div class="border-l-4 border-slate-400 pl-6 mb-12">
                    <span class="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">Our
                        Mission</span>
                    <h2 class="text-3xl font-bold text-white tracking-tight">About Us</h2>
                </div>
                <p class="text-slate-300 text-lg leading-relaxed font-medium mb-16 max-w-3xl">
                    Providing quality education and recruitment excellence to the City of Guihulngan through
                    standardized
                    merit-based systems. The RSP Portal is a digital platform designed to streamline the hiring and
                    placement
                    processes for teaching and non-teaching personnel adhering strictly to <span
                        class="text-white font-bold">PRIME-HRM</span> standards.
                </p>

                <div class="mt-16 w-full">
                    <Accordion :multiple="true" class="corporate-accordion-dark">
                        <AccordionPanel value="hierarchy" class="border border-slate-700 rounded bg-slate-800/50">
                            <AccordionHeader
                                class="font-bold text-white py-5 px-6 hover:bg-slate-800 transition-colors text-sm tracking-widest uppercase">
                                Human Resources Management Placement Selection Board
                            </AccordionHeader>
                            <AccordionContent
                                class="py-12 flex justify-center bg-transparent overflow-x-auto w-full px-6">

                                <div class="flex flex-col items-center w-full">

                                    <div
                                        class="bg-slate-900 border border-slate-700 p-6 rounded shadow-lg flex flex-col sm:flex-row gap-6 items-center sm:items-start text-left max-w-2xl w-full relative z-10">
                                        <img :src="boardMembers.chairperson.image"
                                            class="w-24 h-24 rounded object-cover grayscale-[20%] shrink-0"
                                            alt="Chairperson" />
                                        <div>
                                            <h4 class="text-white font-bold text-lg">{{ boardMembers.chairperson.name }}
                                            </h4>
                                            <span
                                                class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{{
                                                boardMembers.chairperson.role }}</span>
                                            <p class="text-slate-300 text-sm mt-3 leading-relaxed">{{
                                                boardMembers.chairperson.bio }}</p>
                                        </div>
                                    </div>

                                    <div class="w-px h-8 bg-slate-700 hidden md:block"></div>
                                    <div class="w-full max-w-3xl border-t border-slate-700 hidden md:block relative">
                                        <div class="absolute top-0 left-[25%] w-px h-8 bg-slate-700"></div>
                                        <div class="absolute top-0 right-[25%] w-px h-8 bg-slate-700"></div>
                                    </div>

                                    <div
                                        class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mt-8 md:mt-0 z-10">
                                        <div v-for="(member, index) in boardMembers.members" :key="index"
                                            class="bg-slate-900 border border-slate-700 p-6 rounded shadow-md flex flex-col sm:flex-row gap-5 items-center sm:items-start text-left relative">
                                            <img :src="member.image"
                                                class="w-20 h-20 rounded object-cover grayscale-[20%] shrink-0"
                                                alt="Board Member" />
                                            <div>
                                                <h4 class="text-white font-bold text-base">{{ member.name }}</h4>
                                                <span
                                                    class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{{
                                                    member.role }}</span>
                                                <p class="text-slate-300 text-sm mt-3 leading-relaxed">{{ member.bio }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                            </AccordionContent>
                        </AccordionPanel>
                    </Accordion>
                </div>
            </div>
        </section>

        <section id="teams" class="py-24 px-8 max-w-7xl mx-auto w-full text-left border-b border-slate-200">
            <div class="border-l-4 border-slate-900 pl-6 mb-12">
                <span class="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">Faces Behind
                    The
                    Portal</span>
                <h2 class="text-3xl font-bold text-slate-900 tracking-tight">Our Team</h2>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div v-for="member in teamMembers" :key="member.name" @click="openTeamDetail(member)"
                    class="bg-white border border-slate-200 p-6 rounded hover:border-slate-400 transition-colors duration-200 cursor-pointer group flex flex-col items-start">
                    <img :src="member.image" class="w-16 h-16 rounded object-cover mb-6 grayscale-[20%]"
                        alt="Team Member" />
                    <h3 class="text-sm font-bold text-slate-900 mb-1 group-hover:text-slate-600 transition-colors">{{
                        member.name }}</h3>
                    <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{{ member.role }}</p>
                </div>
            </div>
        </section>

        <section id="faq" class="py-24 px-8 bg-slate-50">
            <div class="max-w-[95rem] mx-auto">
                <div class="border-l-4 border-slate-900 pl-6 mb-16">
                    <span class="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">Support &
                        Location</span>
                    <h2 class="text-3xl font-bold text-slate-900 tracking-tight">Help Center & Contact</h2>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

                    <div class="lg:col-span-5 flex flex-col gap-8 h-full">
                        <div class="w-full bg-white border border-slate-200 rounded p-6">
                            <h3
                                class="text-sm font-bold text-slate-900 mb-6 tracking-widest uppercase border-b border-slate-100 pb-4">
                                FAQs</h3>
                            <Accordion :multiple="true" class="corporate-accordion">
                                <AccordionPanel v-for="(faq, index) in faqs" :key="index" :value="index"
                                    class="border-b border-slate-100 last:border-none">
                                    <AccordionHeader
                                        class="font-bold text-slate-800 py-4 text-sm hover:text-slate-500 transition-colors bg-transparent">
                                        {{ faq.question }}</AccordionHeader>
                                    <AccordionContent
                                        class="text-slate-500 text-sm leading-relaxed pb-4 pt-1 bg-transparent font-medium">
                                        {{
                                        faq.answer }}</AccordionContent>
                                </AccordionPanel>
                            </Accordion>
                        </div>

                        <div class="w-full flex flex-col flex-grow bg-white border border-slate-200 rounded p-6">
                            <h3
                                class="text-sm font-bold text-slate-900 mb-6 tracking-widest uppercase border-b border-slate-100 pb-4">
                                Our Location</h3>
                            <div
                                class="relative w-full flex-grow min-h-[250px] bg-slate-50 border border-slate-200 rounded z-10 overflow-hidden">
                                <div id="leaflet-map" class="absolute inset-0 w-full h-full z-0"></div>
                            </div>
                        </div>
                    </div>

                    <div class="lg:col-span-4 relative h-full">
                        <div class="bg-white p-8 border border-slate-200 rounded relative z-10 h-full flex flex-col">
                            <h3 class="text-sm font-bold text-slate-900 mb-2 tracking-widest uppercase">Direct Inquiry
                            </h3>
                            <p class="text-slate-500 text-xs mb-8 font-medium border-b border-slate-100 pb-6">Submit
                                your
                                questions directly to our support unit.</p>

                            <div class="space-y-5 flex-grow flex flex-col">
                                <div>
                                    <label
                                        class="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-2 block">Full
                                        Name</label>
                                    <InputText
                                        class="w-full p-3 text-sm rounded-sm border border-slate-300 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-none" />
                                </div>
                                <div>
                                    <label
                                        class="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-2 block">Email
                                        Address</label>
                                    <InputText
                                        class="w-full p-3 text-sm rounded-sm border border-slate-300 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-none" />
                                </div>
                                <div class="flex-grow flex flex-col">
                                    <label
                                        class="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-2 block">Message</label>
                                    <Textarea
                                        class="w-full p-3 text-sm rounded-sm border border-slate-300 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-none resize-none flex-grow" />
                                </div>
                                <button
                                    class="w-full bg-slate-900 border border-slate-900 py-3 mt-4 rounded-sm font-bold text-white text-sm uppercase tracking-widest hover:bg-slate-800 transition-all duration-200">
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="lg:col-span-3 flex flex-col justify-center pl-0 lg:pl-8 mt-8 lg:mt-0">
                        <h3 class="text-xs font-bold uppercase tracking-widest mb-8 text-slate-400">Headquarters</h3>

                        <div class="space-y-8">
                            <div class="flex items-start gap-4 group">
                                <i class="pi pi-building text-slate-900 text-lg mt-0.5"></i>
                                <p class="text-slate-700 font-medium text-sm leading-relaxed">DepEd Region 7 -
                                    Guihulngan City
                                    Division Office<br />E Villegas St, City of Guihulngan<br />Negros Oriental</p>
                            </div>

                            <div class="flex items-center gap-4 group">
                                <i class="pi pi-globe text-slate-900 text-lg"></i>
                                <a href="http://depedguihulngan.ph" target="_blank"
                                    class="text-slate-700 hover:text-slate-900 transition-colors font-medium text-sm border-b border-transparent hover:border-slate-900 pb-0.5">depedguihulngan.ph</a>
                            </div>

                            <div class="flex items-center gap-4 group">
                                <i class="pi pi-envelope text-slate-900 text-lg"></i>
                                <a href="mailto:guihulngan.rsp@deped.gov.ph"
                                    class="text-slate-700 hover:text-slate-900 transition-colors font-medium text-sm border-b border-transparent hover:border-slate-900 pb-0.5">guihulngan.rsp@deped.gov.ph</a>
                            </div>

                            <div class="flex items-center gap-4 group">
                                <i class="pi pi-phone text-slate-900 text-lg"></i>
                                <p class="text-slate-700 font-medium text-sm">(035) 410-4066</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>

        <HomeJobModal v-model:visible="isModalOpen" :job="activeJob" />
        <HomeTeamModal v-model:visible="isTeamModalOpen" :member="selectedMember" />
        <HomeBulletinModal v-model:visible="isBulletinDialogOpen" :announcement="selectedAnnouncement" />

    </div>
</template>

<style scoped>
@reference "@/assets/main.css";

/* 🪄 CSS 3D PHYSICS FOR BULLETIN BOARD FLIP (Adjusted for Flat Corners) */
.perspective-book {
    perspective: 2500px;
}

.transform-3d {
    transform-style: preserve-3d;
}

.backface-hidden {
    backface-visibility: hidden;
}

.rotate-y-180 {
    transform: rotateY(180deg);
}

/* Next Page Flip Animation (Right to Left) */
.flipper-next {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 50%;
    transform-origin: left center;
    animation: flipNextAnim 1s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;
    will-change: transform;
}

@keyframes flipNextAnim {
    0% {
        transform: rotateY(0deg);
    }

    100% {
        transform: rotateY(-180deg);
    }
}

/* Prev Page Flip Animation (Left to Right) */
.flipper-prev {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 50%;
    transform-origin: right center;
    animation: flipPrevAnim 1s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;
    will-change: transform;
}

@keyframes flipPrevAnim {
    0% {
        transform: rotateY(0deg);
    }

    100% {
        transform: rotateY(180deg);
    }
}

/* Custom Scrollbar for Info Drawer */
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 4px;
}

.custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background-color: #94a3b8;
}

/* Corporate Segmented Button Overrides */
:deep(.corporate-selectbutton) {
    @apply flex bg-white p-1 rounded border border-slate-300;
}

:deep(.corporate-selectbutton .p-button) {
    @apply bg-transparent border-none font-bold text-slate-500 px-5 py-2 text-xs rounded-sm hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 m-0;
}

:deep(.corporate-selectbutton .p-button.p-highlight) {
    @apply bg-slate-900 text-white shadow-none hover:bg-slate-800;
}

/* Material Carousel Overrides */
:deep(.material-carousel .p-carousel-indicator button) {
    @apply bg-slate-300 w-2 h-2 rounded-sm mx-1.5 transition-all duration-300;
}

:deep(.material-carousel .p-carousel-indicator.p-highlight button) {
    @apply bg-slate-900 w-6;
}

/* Corporate Accordion */
:deep(.corporate-accordion .p-accordion-header-link) {
    @apply bg-transparent border-none px-0 outline-none shadow-none text-slate-800 focus:ring-0;
}

:deep(.corporate-accordion .p-accordion-content) {
    @apply px-0 border-none bg-transparent;
}

/* Corporate Dark Accordion */
:deep(.corporate-accordion-dark .p-accordion-header-link) {
    @apply bg-transparent border-none outline-none shadow-none text-white focus:ring-0;
}

:deep(.corporate-accordion-dark .p-accordion-content) {
    @apply px-0 border-none bg-transparent;
}

/* Leaflet Map Specific Styling */
:deep(.leaflet-popup-content-wrapper) {
    @apply rounded shadow-md border border-slate-200;
}

:deep(.leaflet-popup-content) {
    @apply text-sm text-slate-700 m-4;
}

:deep(.leaflet-container) {
    @apply font-sans z-0;
}
</style>