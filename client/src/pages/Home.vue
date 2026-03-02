<script setup>
import { ref, onMounted, computed, watch } from 'vue'; 
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// PrimeVue Component Imports
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import Chip from 'primevue/chip';
import Message from 'primevue/message';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import Textarea from 'primevue/textarea';

const router = useRouter();
const authStore = useAuthStore();
const loggedOutMessage = ref(false);

const isModalOpen = ref(false);
const activeJob = ref(null);
const bookmarks = ref([false, false, false]);

const logoSize = ref(70); 

// --- DATE, TIME, AND WEATHER STATE ---
const currentTime = ref('');
const currentDate = ref('');
const weatherStatus = ref('sunny'); 

const updateDateTime = () => {
    const now = new Date();
    currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentDate.value = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
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

// --- BULLETIN BOARD STATE ---
const isBulletinDialogOpen = ref(false); // FIXED: Added this state
const selectedAnnouncement = ref(null);   // FIXED: Added this state

const announcements = ref([
    {
        id: 1,
        title: "PRIME-HRM Level 2 Accreditation",
        date: "October 24, 2025",
        category: "Achievement",
        content: "We are proud to announce that the Division of Guihulngan City has successfully achieved PRIME-HRM Level 2 Accreditation. This milestone reflects our commitment to excellence in recruitment, selection, and placement processes. This accreditation ensures that our human resource management systems meet the highest standards of merit and fitness.",
        icon: "pi pi-trophy",
        color: "text-amber-500"
    },
    {
        id: 2,
        title: "Upcoming Teacher Induction Program",
        date: "November 05, 2025",
        category: "Event",
        content: "All newly hired Teacher I personnel are required to attend the virtual induction program. The session will cover professional ethics and portal navigation. This program is designed to support our new educators as they begin their journey with the Division of Guihulngan City.",
        icon: "pi pi-calendar",
        color: "text-blue-500"
    },
    {
        id: 3,
        title: "System Maintenance Notice",
        date: "October 30, 2025",
        category: "System",
        content: "The RSP Portal will undergo scheduled maintenance on Saturday from 10:00 PM to 2:00 AM. Users may experience temporary downtime. We are performing these updates to ensure the stability and security of our online recruitment systems.",
        icon: "pi pi-cog",
        color: "text-slate-500"
    }
]);

// FIXED: Added this function to handle the click
const openBulletinDetail = (item) => {
    selectedAnnouncement.value = item;
    isBulletinDialogOpen.value = true;
};

// --- JOB VACANCIES STATE & FILTER LOGIC ---
const searchQuery = ref('');
const selectedCategory = ref('All');
const categories = ref(['All', 'Teaching Related', 'Non-Teaching']);

watch(selectedCategory, (newVal) => {
    if (newVal === null) {
        selectedCategory.value = 'All';
    }
});

const jobList = ref([
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
        title: 'Teacher I (Senior High - Sports)',
        type: 'Full-Time',
        division: 'DIVISION OFFICE',
        category: 'Teaching Related',
        salary: '₱31,705.00 / month',
        description: 'Lead the Sports track and coach school teams while implementing the PE curriculum.',
        requirements: ['LET Passer', 'Coaching Experience', 'B.S. in Physical Education']
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

// --- TEAM MEMBERS STATE ---
const isTeamModalOpen = ref(false);
const selectedMember = ref(null);
const teamMembers = ref([
    { name: "Dr. Roberto D. Santos", role: "Schools Division Superintendent", image: "https://i.pravatar.cc/300?u=roberto", bio: "Leading the Division of Guihulngan City with 20 years of experience in educational management and PRIME-HRM excellence.", email: "roberto.santos@deped.gov.ph" },
    { name: "Elena G. Reyes", role: "Assistant Schools Division Superintendent", image: "https://i.pravatar.cc/300?u=elena", bio: "Dedicated to improving the quality of basic education through innovative teacher training and merit-based selection.", email: "elena.reyes@deped.gov.ph" },
    { name: "Juan Miguel P. Luna", role: "Human Resource Management Officer", image: "https://i.pravatar.cc/300?u=miguel", bio: "Overseeing the recruitment and placement processes to ensure fairness and transparency.", email: "miguel.luna@deped.gov.ph" }
]);

const openTeamDetail = (member) => {
    selectedMember.value = member;
    isTeamModalOpen.value = true;
};

// FAQ DATA
const faqs = ref([
    { question: "How do I apply for a position?", answer: "Create an account, complete your profile, and click the 'Apply Now' button on any job vacancy that matches your qualifications." },
    { question: "What are the basic requirements?", answer: "Basic requirements include a valid CSC Eligibility or LET License, Personal Data Sheet (PDS), and relevant Transcript of Records." },
    { question: "How long does the selection process take?", answer: "The duration varies depending on the number of applicants, but typically follows the standard PRIME-HRM timeline of 1 to 3 months." }
]);

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

const openModal = (job) => {
    activeJob.value = job;
    isModalOpen.value = true;
};

const currentSlide = ref(0);
const slides = [
    { title: "RSP Management Portal", subtitle: "Division of Guihulngan City", description: "Access the Online Recruitment and Selection system for modern human resource management.", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200" },
    { title: "PRIME-HRM Excellence", subtitle: "Merit-Based Selection", description: "A transparent and standardized process for the recruitment of educators and staff.", image: "https://images.unsplash.com/photo-1523050335392-9bef867a0578?auto=format&fit=crop&q=80&w=1200" }
];

onMounted(() => {
    setInterval(() => currentSlide.value = (currentSlide.value + 1) % slides.length, 8000);
    updateDateTime();
    setInterval(updateDateTime, 1000);
    fetchWeather();
    setInterval(fetchWeather, 600000);
});
</script>

<template>
    <div class="min-h-screen flex flex-col font-sans bg-fixed bg-center bg-cover bg-no-repeat"
         style="background-image: linear-gradient(rgba(248, 250, 252, 0.88), rgba(248, 250, 252, 0.50)), url('https://image2url.com/r2/default/images/1772169455473-54bb76c7-1d32-4152-8411-9e38daab5695.png');">
         
        <nav class="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-[100]">
            <div class="flex items-center gap-3 w-1/4">
                <img src="https://i.ibb.co/7dHhWCpp/images.png" alt="Logo" class="object-contain" :style="{ height: logoSize + 'px', width: logoSize + 'px' }" />
                <div class="flex flex-col leading-tight">
                    <span class="text-sm font-bold text-slate-900">RSP Portal</span>
                    <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">DepEd GNC</span>
                </div>
            </div>

            <div class="flex items-center justify-center gap-6 flex-1">
                <Button v-for="link in ['home', 'bullet', 'jobs', 'about', 'faq', 'contact']" :key="link"
                    :label="link === 'bullet' ? 'BULLETIN BOARD' : link === 'jobs' ? 'JOB VACANCIES' : link.toUpperCase()" variant="text" 
                    class="p-button-sm text-slate-600 font-bold hover:text-blue-600 transition-all"
                    @click="scrollTo(link)" />
            </div>

            <div class="flex items-center justify-end gap-4 w-1/4">
                <div class="hidden lg:flex flex-col items-end leading-none border-r border-slate-200 pr-4 group cursor-help">
                    <div class="flex items-center gap-2 mb-1 relative">
                        <span v-if="weatherStatus === 'sunny'" class="text-sm transition-all duration-500 group-hover:scale-150 group-hover:rotate-[360deg] sun-glow">☀️</span>
                        
                        <div v-else class="relative flex items-center justify-center">
                            <span class="text-sm z-10">💧</span>
                            <div class="rain-container">
                                <div v-for="n in 5" :key="n" class="drop" :style="{ left: (n*4) + 'px', animationDelay: (n*0.2) + 's' }"></div>
                            </div>
                        </div>

                        <span class="text-xs font-black text-slate-900">{{ currentTime }}</span>
                    </div>
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{{ currentDate }}</span>
                </div>
                <template v-if="authStore.isAuthenticated">
                    <Chip :label="authStore.user.username" class="bg-slate-100 font-medium text-sm px-2" />
                    <Button icon="pi pi-sign-out" severity="secondary" rounded text @click="handleLogout" />
                </template>
                <Button v-else label="Sign In" rounded class="bg-blue-600 border-none px-6 text-white font-bold transition-all hover:scale-110 shadow-md" @click="router.push('/auth/login')" />
            </div>
        </nav>

        <main id="home" class="min-h-[80vh] grid grid-cols-1 lg:grid-cols-2 max-w-7xl mx-auto w-full items-center px-6 py-12 gap-12 text-left">
            <div class="space-y-6">
                <span class="text-blue-600 text-xs font-black uppercase tracking-[0.2em]">{{ slides[currentSlide].subtitle }}</span>
                <h1 class="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mt-4 mb-6">{{ slides[currentSlide].title }}</h1>
                <p class="text-slate-600 text-lg max-w-md leading-relaxed">{{ slides[currentSlide].description }}</p>
                <Button v-if="authStore.isAuthenticated" label="Open Profile" icon="pi pi-th-large" rounded class="bg-blue-600 border-none px-8 text-white mt-4" @click="router.push(authStore.dashboardRoute)" />
            </div>
            <div class="hidden lg:block h-[500px] relative group">
                <div class="relative h-full w-full rounded-[40px] overflow-hidden shadow-2xl">
                    <img :src="slides[currentSlide].image" class="w-full h-full object-cover transition-opacity duration-1000" alt="Carousel Slide" />
                </div>
            </div>
        </main>

        <section id="bullet" class="py-24 px-6 md:px-12 bg-transparent">
            <div class="max-w-7xl mx-auto text-left">
                <div class="text-center mb-16">
                    <span class="text-blue-600 text-xs font-black uppercase tracking-widest">Division Announcements</span>
                    <h2 class="text-4xl font-black text-slate-900 mt-2">Bulletin Board</h2>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div v-for="(item, index) in announcements" :key="item.id" @click="openBulletinDetail(item)"
                        class="bg-white/90 border border-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group">
                        <div class="absolute top-0 left-0 right-0 h-2" :class="[index % 3 === 0 ? 'bg-blue-500' : index % 3 === 1 ? 'bg-emerald-500' : 'bg-orange-500']"></div>
                        <div class="mb-6 flex justify-between items-start">
                            <div class="p-3 bg-slate-50 rounded-xl"><i :class="[item.icon, item.color]" class="text-xl"></i></div>
                        </div>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ item.category }}</p>
                        <h3 class="text-xl font-black text-slate-900 mt-2 mb-8 group-hover:text-blue-600 transition-colors">{{ item.title }}</h3>
                        <p class="text-sm text-slate-500 line-clamp-3 mb-6 leading-relaxed">{{ item.content }}</p>
                        <div class="text-xs text-slate-400 font-bold uppercase"><i class="pi pi-calendar mr-1"></i> {{ item.date }}</div>
                    </div>
                </div>
            </div>
        </section>

        <section id="jobs" class="py-24 bg-transparent min-h-[80vh]">
            <div class="max-w-7xl mx-auto px-12">
                <div class="text-center mb-12 space-y-8">
                    <h2 class="text-4xl font-black text-slate-900">Job Vacancies</h2>
                    <div class="flex flex-col md:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
                        <div class="relative w-full group">
                            <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500"></i>
                            <InputText v-model="searchQuery" placeholder="Search position..." class="w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-white/70 backdrop-blur-md shadow-sm" />
                        </div>
                        <SelectButton v-model="selectedCategory" :options="categories" class="custom-selectbutton whitespace-nowrap" />
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div v-for="(job, index) in filteredJobs" :key="index" @click="openModal(job)"
                        class="bg-white/90 border border-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden group flex flex-col h-full">
                        <div class="absolute top-0 left-0 right-0 h-2" :class="job.category === 'Teaching Related' ? 'bg-blue-500' : 'bg-orange-500'"></div>
                        <div class="mb-6 flex justify-between items-start">
                            <div class="p-3 bg-slate-50 rounded-xl text-slate-400"><i class="pi pi-briefcase text-xl"></i></div>
                            <Chip :label="job.category" class="text-[10px] font-black uppercase bg-slate-100" />
                        </div>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ job.division }}</p>
                        <h3 class="text-xl font-black text-slate-900 mt-2 mb-8 group-hover:text-blue-600 transition-colors">{{ job.title }}</h3>
                        
                        <div class="mt-auto flex items-center gap-2 text-sm text-slate-500 font-bold uppercase pt-6">
                            <span class="text-slate-400">Work:</span> {{ job.type }}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="about" class="py-24 px-12 text-center min-h-[50vh]">
            <div class="max-w-7xl mx-auto">
                <h2 class="text-4xl font-black text-slate-900 mb-4">About Us</h2>
                <p class="text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium mb-16">Providing quality education and recruitment excellence to the City of Guihulngan through standardized merit-based systems.</p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div v-for="member in teamMembers" :key="member.name" @click="openTeamDetail(member)"
                        class="bg-white/90 border border-white p-8 rounded-[40px] shadow-sm hover:shadow-2xl transition-all cursor-pointer text-center group">
                        <div class="relative mb-6 mx-auto w-32 h-32 overflow-hidden rounded-full ring-4 ring-slate-50 group-hover:ring-blue-500 transition-all">
                            <img :src="member.image" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Team Member" />
                        </div>
                        <h3 class="text-xl font-black text-slate-900 mb-1">{{ member.name }}</h3>
                        <p class="text-blue-600 text-xs font-black uppercase tracking-widest">{{ member.role }}</p>
                    </div>
                </div>
            </div>
        </section>

        <section id="faq" class="py-24 px-12 bg-transparent min-h-[50vh]">
            <div class="max-w-3xl mx-auto text-center">
                <h2 class="text-4xl font-black text-slate-900 mb-12">FAQ</h2>
                <Accordion :multiple="true">
                    <AccordionPanel v-for="(faq, index) in faqs" :key="index" :value="index">
                        <AccordionHeader class="font-black text-slate-900 py-6 border-b border-slate-100 hover:text-blue-600">{{ faq.question }}</AccordionHeader>
                        <AccordionContent class="text-slate-600 leading-relaxed py-6">{{ faq.answer }}</AccordionContent>
                    </AccordionPanel>
                </Accordion>
            </div>
        </section>

        <section id="contact" class="py-24 px-12 bg-transparent min-h-[60vh]">
            <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
                <div class="space-y-8 text-left">
                    <h2 class="text-4xl font-black text-slate-900">Contact Us</h2>
                    <p class="text-slate-600 text-lg">Our support team is here to help with your recruitment queries.</p>
                    <div class="flex items-center gap-4 p-6 bg-white/60 rounded-[30px] border border-white shadow-sm">
                        <i class="pi pi-envelope text-blue-600 text-2xl"></i>
                        <div><p class="font-black text-slate-900">Email</p><p class="text-slate-500 text-sm">guihulngan.rsp@deped.gov.ph</p></div>
                    </div>
                </div>
                <div class="bg-white/80 backdrop-blur-xl p-10 rounded-[40px] border border-white shadow-xl space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputText placeholder="Full Name" class="w-full p-4 rounded-2xl border-none bg-slate-50" />
                        <InputText placeholder="Email" class="w-full p-4 rounded-2xl border-none bg-slate-50" />
                    </div>
                    <Textarea placeholder="How can we help?" rows="5" class="w-full p-4 rounded-2xl border-none bg-slate-50" />
                    <Button label="Send Message" class="w-full bg-blue-600 border-none py-5 rounded-2xl font-black text-white" />
                </div>
            </div>
        </section>

        <Dialog v-model:visible="isModalOpen" modal dismissableMask :showHeader="false" contentClass="p-0 rounded-[40px] overflow-hidden border-none shadow-2xl" class="max-w-2xl w-full mx-4">
            <div class="bg-white text-left flex flex-col max-h-[85vh]">
                <div class="p-10 overflow-y-auto">
                    <div class="flex justify-between items-start mb-2">
                        <p class="text-[11px] font-black text-blue-600 tracking-widest uppercase">{{ activeJob?.division }}</p>
                        <Button icon="pi pi-times" severity="secondary" rounded text class="-mt-4 -mr-4 hover:bg-red-50 hover:text-red-500" @click="isModalOpen = false" />
                    </div>
                    <h2 class="text-3xl font-black text-slate-900 mb-6 leading-tight">{{ activeJob?.title }}</h2>
                    <div class="flex gap-3 mb-8">
                        <Chip :label="activeJob?.salary" class="bg-blue-50 text-blue-700 font-black text-xs px-4" />
                        <Chip :label="activeJob?.type" class="bg-slate-100 text-slate-600 font-black text-xs px-4" />
                    </div>
                    <div class="space-y-6 border-t border-slate-50 pt-8">
                        <div>
                            <h4 class="font-black text-slate-900 mb-2">Description</h4>
                            <p class="text-slate-500 text-sm leading-relaxed font-medium">{{ activeJob?.description }}</p>
                        </div>
                        <div v-if="activeJob?.requirements">
                            <h4 class="font-black text-slate-900 mb-3">Requirements</h4>
                            <ul class="space-y-2">
                                <li v-for="req in activeJob.requirements" :key="req" class="flex items-center gap-3 text-sm text-slate-600 font-semibold">
                                    <span class="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"></span> {{ req }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="w-full mt-auto">
                    <Button label="Apply Now" class="w-full bg-[#20c997] border-none py-6 rounded-none font-black text-xl hover:bg-[#1bb386] transition-colors text-white" />
                </div>
            </div>
        </Dialog>

        <Dialog v-model:visible="isTeamModalOpen" modal dismissableMask :showHeader="false" contentClass="p-0 rounded-[40px] border-none shadow-2xl" class="max-w-md w-full mx-4">
            <div class="bg-white text-center flex flex-col">
                <div class="h-32 bg-slate-200 relative"><div class="absolute -bottom-12 left-1/2 -translate-x-1/2"><Avatar :image="selectedMember?.image" size="xlarge" shape="circle" class="w-24 h-24 border-4 border-white shadow-xl" /></div></div>
                <div class="px-8 pt-16 pb-10">
                    <h2 class="text-2xl font-black text-slate-900">{{ selectedMember?.name }}</h2>
                    <p class="text-blue-600 font-black text-xs uppercase mb-6">{{ selectedMember?.role }}</p>
                    <p class="text-slate-500 leading-relaxed">{{ selectedMember?.bio }}</p>
                </div>
                <Button label="Close Profile" class="w-full bg-emerald-500 text-white border-none py-5 font-black" @click="isTeamModalOpen = false" />
            </div>
        </Dialog>

        <Dialog v-model:visible="isBulletinDialogOpen" modal dismissableMask :showHeader="false" contentClass="p-0 rounded-[40px] overflow-hidden border-none shadow-2xl" class="max-w-2xl w-full mx-4">
            <div class="bg-white text-left flex flex-col max-h-[85vh]">
                <div class="p-10 overflow-y-auto">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2">
                            <i :class="[selectedAnnouncement?.icon, selectedAnnouncement?.color]" class="text-xl"></i>
                            <p class="text-[11px] font-black text-blue-600 tracking-widest uppercase">{{ selectedAnnouncement?.category }}</p>
                        </div>
                        <Button icon="pi pi-times" severity="secondary" rounded text class="-mt-4 -mr-4 hover:bg-red-50 hover:text-red-500" @click="isBulletinDialogOpen = false" />
                    </div>
                    <h2 class="text-3xl font-black text-slate-900 mb-4 leading-tight">{{ selectedAnnouncement?.title }}</h2>
                    <div class="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase mb-8">
                        <i class="pi pi-calendar"></i> Posted on {{ selectedAnnouncement?.date }}
                    </div>
                    <div class="space-y-6 border-t border-slate-50 pt-8">
                        <p class="text-slate-600 text-base leading-relaxed font-medium whitespace-pre-line">
                            {{ selectedAnnouncement?.content }}
                        </p>
                    </div>
                </div>
                <div class="w-full mt-auto">
                    <Button label="Close Announcement" class="w-full bg-slate-900 border-none py-6 rounded-none font-black text-lg hover:bg-slate-800 transition-colors text-white" @click="isBulletinDialogOpen = false" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
@reference "@/assets/main.css";

/* Weather Interaction Styles */
.sun-glow:hover {
    text-shadow: 0 0 15px rgba(251, 191, 36, 0.8);
}

.rain-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
}

.drop {
    position: absolute;
    background: #3b82f6;
    width: 1.5px;
    height: 4px;
    opacity: 0;
    animation: fall 0.8s linear infinite;
}

@keyframes fall {
    0% { transform: translateY(-10px); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateY(15px); opacity: 0; }
}

.line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
:deep(.custom-selectbutton .p-button) { @apply bg-white/70 border-none shadow-sm font-bold text-slate-500 px-6 py-4 rounded-2xl; }
:deep(.custom-selectbutton .p-button.p-highlight) { @apply bg-blue-600 text-white shadow-md; }
.p-dialog-mask { @apply backdrop-blur-sm bg-slate-900/40; }
</style>