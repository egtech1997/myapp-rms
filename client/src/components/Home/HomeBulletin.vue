<script setup>
import { ref, computed } from 'vue'; 

const emit = defineEmits(['open-bulletin']);

const expandedId = ref(null); 

const toggleExpand = (id) => {
    expandedId.value = expandedId.value === id ? null : id;
};

const announcements = ref([
    {
        id: 1,
        title: "PRIME-HRM Level 2 Accreditation",
        date: "October 24, 2025",
        time: "09:00 AM - 11:30 AM",
        location: "Division Office Main Hall",
        category: "Achievement",
        overview: "A milestone achievement reflecting our commitment to recruitment excellence and standardized systems.",
        content: "We are proud to announce that the Division of Guihulngan City has successfully achieved PRIME-HRM Level 2 Accreditation.\n\nThis milestone reflects our commitment to excellence in recruitment, selection, and placement processes. This accreditation ensures that our human resource management systems meet the highest standards of merit and fitness.\n\nAll division personnel are invited to attend the ceremonial awarding and Thanksgiving event.",
        icon: "pi pi-trophy",
        color: "text-slate-700",
        bg: "bg-slate-100",
        image: "https://images.unsplash.com/photo-1523050335392-9bef867a0578?auto=format&fit=crop&q=80&w=800",
        publisherImage: "https://i.ibb.co/7dHhWCpp/images.png",
        publisherName: "HRMO Guihulngan"
    },
    {
        id: 2,
        title: "Upcoming Teacher Induction Program",
        date: "November 05, 2025",
        time: "08:00 AM - 05:00 PM",
        location: "Virtual Meeting (Zoom)",
        category: "Event",
        overview: "A mandatory orientation session for all newly hired Teacher I personnel.",
        content: "All newly hired Teacher I personnel are required to attend the virtual induction program. The session will cover professional ethics, DepEd core values, and RSP portal navigation.\n\nThis program is designed to support our new educators as they begin their journey with the Division of Guihulngan City. Please ensure you have stable internet connection and are dressed in appropriate business attire.",
        icon: "pi pi-calendar",
        color: "text-slate-700",
        bg: "bg-slate-100",
        image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800",
        publisherImage: "https://i.ibb.co/7dHhWCpp/images.png",
        publisherName: "Personnel Unit"
    },
    {
        id: 3,
        title: "System Maintenance Notice",
        date: "October 30, 2025",
        time: "10:00 PM - 02:00 AM",
        location: "Online RSP Portal",
        category: "System",
        overview: "Scheduled downtime to upgrade our server capabilities and security protocols.",
        content: "The RSP Portal will undergo scheduled maintenance on Saturday from 10:00 PM to 2:00 AM. Users may experience temporary downtime.\n\nWe are performing these updates to ensure the stability, speed, and security of our online recruitment systems. Please ensure you have saved all draft applications before the maintenance window begins.",
        icon: "pi pi-cog",
        color: "text-slate-700",
        bg: "bg-slate-100",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
        publisherImage: "https://i.ibb.co/7dHhWCpp/images.png",
        publisherName: "IT Support Staff"
    },
    {
        id: 4,
        title: "Quarterly Performance Review",
        date: "November 15, 2025",
        time: "08:00 AM - 04:00 PM",
        location: "SDO Conference Room",
        category: "Review",
        overview: "Mandatory performance evaluation and target setting for all department heads.",
        content: "The 3rd quarter performance review will commence for all SDO unit heads and supervisors. This review will focus on the alignment of departmental outputs with our annual strategic goals.\n\nPlease ensure all your RPMS (Results-Based Performance Management System) portfolios are updated and ready for presentation during your scheduled timeslot.",
        icon: "pi pi-chart-line",
        color: "text-slate-700",
        bg: "bg-slate-100",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
        publisherImage: "https://i.ibb.co/7dHhWCpp/images.png",
        publisherName: "Office of the SDS"
    },
    {
        id: 5,
        title: "Regional Sports Meet Preparation",
        date: "December 01, 2025",
        time: "01:00 PM - 05:00 PM",
        location: "City Sports Complex",
        category: "Event",
        overview: "Planning and delegation of tasks for the upcoming CVIRAA regional sports meet.",
        content: "All district sports coordinators and assigned tournament managers are required to attend the final coordination meeting for the upcoming Central Visayas Regional Athletic Association (CVIRAA) meet.\n\nAgenda includes budget allocation, athlete screening procedures, and transportation logistics.",
        icon: "pi pi-flag",
        color: "text-slate-700",
        bg: "bg-slate-100",
        image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=800",
        publisherImage: "https://i.ibb.co/7dHhWCpp/images.png",
        publisherName: "Sports & Development"
    },
    {
        id: 6,
        title: "New Policy: Digital Records",
        date: "December 10, 2025",
        time: "09:00 AM",
        location: "Division Wide",
        category: "Policy",
        overview: "Implementation of the new paperless policy for all internal communications.",
        content: "In our continuous effort to modernize the SDO and promote environmentally sustainable practices, we are officially rolling out the 'Digital First' records policy.\n\nEffective immediately, all memorandums, division letters, and internal routing forms must be processed through the central Document Tracking System. Physical copies will only be required for final archival.",
        icon: "pi pi-file-pdf",
        color: "text-slate-700",
        bg: "bg-slate-100",
        image: "https://images.unsplash.com/photo-1568051243851-f9b15330ce11?auto=format&fit=crop&q=80&w=800",
        publisherImage: "https://i.ibb.co/7dHhWCpp/images.png",
        publisherName: "Records Section"
    },
    {
        id: 7,
        title: "Digital Literacy Training",
        date: "January 10, 2026",
        time: "08:30 AM - 04:30 PM",
        location: "IT Lab, Main SDO",
        category: "Training",
        overview: "Upskilling workshop focusing on modern educational tools and portal usage.",
        content: "As part of our commitment to continuous learning, the ICT Unit will be conducting a 2-day Digital Literacy Workshop for selected school administrators.\n\nThis hands-on training will cover advanced usage of the Google Workspace for Education, LIS data management, and securing online credentials.",
        icon: "pi pi-desktop",
        color: "text-slate-700",
        bg: "bg-slate-100",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800",
        publisherImage: "https://i.ibb.co/7dHhWCpp/images.png",
        publisherName: "ICT Unit"
    },
    {
        id: 8,
        title: "Annual Yearend Gala",
        date: "December 20, 2025",
        time: "06:00 PM - 11:00 PM",
        location: "Guihulngan City Gym",
        category: "Event",
        overview: "Annual gathering to celebrate the division's achievements and honor awardees.",
        content: "Join us for a night of celebration, camaraderie, and Thanksgiving at the Annual DepEd Guihulngan Yearend Gala.\n\nWe will be recognizing outstanding teachers, highly effective schools, and dedicated non-teaching personnel who have shown exemplary service throughout the year. Formal attire is required.",
        icon: "pi pi-star",
        color: "text-slate-700",
        bg: "bg-slate-100",
        image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
        publisherImage: "https://i.ibb.co/7dHhWCpp/images.png",
        publisherName: "Social Committee"
    }
]);

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

const currentSpreadIndex = ref(0);
const isFlipping = ref(false);
const flipDirection = ref('next');

const baseLeftItem = ref(null);
const baseRightItem = ref(null);
const flipperFrontItem = ref(null);
const flipperBackItem = ref(null);

const renderedLeft = computed(() => isFlipping.value ? baseLeftItem.value : spreads.value[currentSpreadIndex.value].left);
const renderedRight = computed(() => isFlipping.value ? baseRightItem.value : spreads.value[currentSpreadIndex.value].right);

const turnPage = (direction) => {
    if (isFlipping.value) return;
    if (direction === 'next' && currentSpreadIndex.value >= spreads.value.length - 1) return;
    if (direction === 'prev' && currentSpreadIndex.value <= 0) return;

    expandedId.value = null; 
    flipDirection.value = direction;

    if (direction === 'next') {
        baseLeftItem.value = spreads.value[currentSpreadIndex.value].left;
        baseRightItem.value = spreads.value[currentSpreadIndex.value + 1].right;
        flipperFrontItem.value = spreads.value[currentSpreadIndex.value].right;
        flipperBackItem.value = spreads.value[currentSpreadIndex.value + 1].left;
    } else {
        baseLeftItem.value = spreads.value[currentSpreadIndex.value - 1].left;
        baseRightItem.value = spreads.value[currentSpreadIndex.value].right;
        flipperFrontItem.value = spreads.value[currentSpreadIndex.value].left;
        flipperBackItem.value = spreads.value[currentSpreadIndex.value - 1].right;
    }

    isFlipping.value = true;

    setTimeout(() => {
        if (direction === 'next') currentSpreadIndex.value++;
        else currentSpreadIndex.value--;
        isFlipping.value = false;
    }, 1000); 
};
</script>

<template>
    <section id="bullet" class="py-32 px-8 max-w-[95rem] mx-auto w-full relative">
        <div class="mb-16 flex flex-col items-start border-l-4 border-slate-900 pl-6 emerge-hidden">
            <span class="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Corporate Updates</span>
            <h2 class="text-3xl font-bold text-slate-900 tracking-tight">Bulletin Board</h2>
        </div>

        <div class="relative w-full max-w-6xl h-[650px] mx-auto perspective-book emerge-hidden" style="transition-delay: 200ms;">
            <div class="relative w-full h-full transform-3d border border-slate-200 shadow-sm rounded-md bg-white flex overflow-visible"
                 :class="{ 'pointer-events-none': isFlipping }">
                
                <div class="w-1/2 h-full border-r border-slate-200 p-12 bg-white rounded-l-md overflow-hidden relative z-10 cursor-pointer hover:bg-slate-50/50 transition-colors duration-300" @click="turnPage('prev')" @mouseleave="expandedId = null">
                    <div v-if="renderedLeft" class="flex flex-col h-full relative">
                        <div class="flex items-center gap-3 mb-8">
                            <div class="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex items-center justify-center">
                                <i :class="[renderedLeft.icon, 'text-slate-700 text-lg']"></i>
                            </div>
                            <span class="text-xs font-semibold text-slate-500 uppercase tracking-widest">{{ renderedLeft.date }}</span>
                        </div>
                        
                        <h3 @mouseenter="!isFlipping && (expandedId = renderedLeft.id)" @click.stop class="text-2xl font-bold text-slate-900 mb-4 leading-tight cursor-default group flex items-start justify-between hover:text-slate-600 transition-colors">
                            <span class="pr-4">{{ renderedLeft.title }}</span>
                            <div class="w-8 h-8 rounded border border-slate-200 bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                <i class="pi pi-arrow-up-right text-slate-700 text-xs"></i>
                            </div>
                        </h3>
                        <p class="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium">{{ renderedLeft.overview }}</p>
                        
                        <div class="mt-auto">
                            <img :src="renderedLeft.image" class="w-full h-64 object-cover rounded border border-slate-200 mb-2 grayscale-[10%]" />
                        </div>

                        <div @click.stop class="bulletin-drawer" :class="{ 'is-open': expandedId === renderedLeft.id }">
                            <div class="mb-8 pb-4 border-b border-slate-200">
                                <h4 class="font-bold text-slate-900 text-lg tracking-tight">Announcement Details</h4>
                            </div>

                            <div class="flex flex-col gap-4 mb-8">
                                <div class="flex items-center gap-3">
                                    <img :src="renderedLeft.publisherImage" class="w-8 h-8 rounded border border-slate-200 object-cover" />
                                    <div class="flex flex-col leading-none">
                                        <span class="text-xs font-bold text-slate-900">{{ renderedLeft.publisherName }}</span>
                                        <span class="text-[9px] text-slate-500 font-semibold uppercase tracking-widest mt-1">Publisher</span>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-4 text-xs text-slate-600 font-medium bg-slate-50 p-4 rounded border border-slate-200">
                                    <div class="flex items-center gap-2"><i class="pi pi-calendar text-slate-400"></i> {{ renderedLeft.date }}</div>
                                    <div class="flex items-center gap-2"><i class="pi pi-clock text-slate-400"></i> {{ renderedLeft.time }}</div>
                                    <div class="flex items-center gap-2 col-span-2"><i class="pi pi-map-marker text-slate-400"></i> {{ renderedLeft.location }}</div>
                                </div>
                            </div>

                            <div class="overflow-y-auto pr-2 custom-scrollbar pb-6 flex-grow">
                                <p class="text-slate-600 leading-relaxed font-medium whitespace-pre-line text-sm">{{ renderedLeft.content }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="w-1/2 h-full p-12 bg-white rounded-r-md overflow-hidden relative z-10 cursor-pointer hover:bg-slate-50/50 transition-colors duration-300" @click="turnPage('next')" @mouseleave="expandedId = null">
                    <div v-if="renderedRight" class="flex flex-col h-full relative">
                        <div class="flex items-center gap-3 mb-8">
                            <div class="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex items-center justify-center">
                                <i :class="[renderedRight.icon, 'text-slate-700 text-lg']"></i>
                            </div>
                            <span class="text-xs font-semibold text-slate-500 uppercase tracking-widest">{{ renderedRight.date }}</span>
                        </div>
                        
                        <h3 @mouseenter="!isFlipping && (expandedId = renderedRight.id)" @click.stop class="text-2xl font-bold text-slate-900 mb-4 leading-tight cursor-default group flex items-start justify-between hover:text-slate-600 transition-colors">
                            <span class="pr-4">{{ renderedRight.title }}</span>
                            <div class="w-8 h-8 rounded border border-slate-200 bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                <i class="pi pi-arrow-up-right text-slate-700 text-xs"></i>
                            </div>
                        </h3>
                        <p class="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium">{{ renderedRight.overview }}</p>
                        
                        <div class="mt-auto">
                            <img :src="renderedRight.image" class="w-full h-64 object-cover rounded border border-slate-200 mb-2 grayscale-[10%]" />
                        </div>

                        <div @click.stop class="bulletin-drawer" :class="{ 'is-open': expandedId === renderedRight.id }">
                            <div class="mb-8 pb-4 border-b border-slate-200">
                                <h4 class="font-bold text-slate-900 text-lg tracking-tight">Announcement Details</h4>
                            </div>

                            <div class="flex flex-col gap-4 mb-8">
                                <div class="flex items-center gap-3">
                                    <img :src="renderedRight.publisherImage" class="w-8 h-8 rounded border border-slate-200 object-cover" />
                                    <div class="flex flex-col leading-none">
                                        <span class="text-xs font-bold text-slate-900">{{ renderedRight.publisherName }}</span>
                                        <span class="text-[9px] text-slate-500 font-semibold uppercase tracking-widest mt-1">Publisher</span>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-4 text-xs text-slate-600 font-medium bg-slate-50 p-4 rounded border border-slate-200">
                                    <div class="flex items-center gap-2"><i class="pi pi-calendar text-slate-400"></i> {{ renderedRight.date }}</div>
                                    <div class="flex items-center gap-2"><i class="pi pi-clock text-slate-400"></i> {{ renderedRight.time }}</div>
                                    <div class="flex items-center gap-2 col-span-2"><i class="pi pi-map-marker text-slate-400"></i> {{ renderedRight.location }}</div>
                                </div>
                            </div>

                            <div class="overflow-y-auto pr-2 custom-scrollbar pb-6 flex-grow">
                                <p class="text-slate-600 leading-relaxed font-medium whitespace-pre-line text-sm">{{ renderedRight.content }}</p>
                            </div>
                        </div>
                    </div>
                    <div v-else class="flex flex-col items-center justify-center h-full space-y-4">
                        <i class="pi pi-stop text-4xl text-slate-200"></i>
                        <p class="text-sm font-semibold text-slate-400 uppercase tracking-widest">End of Entries</p>
                    </div>
                </div>

                <div v-if="isFlipping && flipDirection === 'next'" class="flipper-next transform-3d z-50">
                    <div class="absolute inset-0 bg-white backface-hidden p-12 overflow-hidden rounded-r-md border-y border-r border-slate-200 shadow-[-5px_0_15px_rgba(0,0,0,0.05)]">
                        <div v-if="flipperFrontItem" class="flex flex-col h-full relative">
                            <div class="flex items-center gap-3 mb-8">
                                <div class="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex items-center justify-center">
                                    <i :class="[flipperFrontItem.icon, 'text-slate-700 text-lg']"></i>
                                </div>
                                <span class="text-xs font-semibold text-slate-500 uppercase tracking-widest">{{ flipperFrontItem.date }}</span>
                            </div>
                            <h3 class="text-2xl font-bold text-slate-900 mb-4 leading-tight flex justify-between">
                                <span class="pr-4">{{ flipperFrontItem.title }}</span>
                                <div class="w-8 h-8 rounded bg-transparent flex items-center justify-center opacity-0 shrink-0"></div>
                            </h3>
                            <p class="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium">{{ flipperFrontItem.overview }}</p>
                            <div class="mt-auto">
                                <img :src="flipperFrontItem.image" class="w-full h-64 object-cover rounded border border-slate-200 mb-2 grayscale-[10%]" />
                            </div>
                        </div>
                    </div>
                    <div class="absolute inset-0 bg-white backface-hidden p-12 overflow-hidden rounded-l-md border-y border-l border-slate-200 rotate-y-180 shadow-[5px_0_15px_rgba(0,0,0,0.05)]">
                        <div v-if="flipperBackItem" class="flex flex-col h-full relative">
                            <div class="flex items-center gap-3 mb-8">
                                <div class="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex items-center justify-center">
                                    <i :class="[flipperBackItem.icon, 'text-slate-700 text-lg']"></i>
                                </div>
                                <span class="text-xs font-semibold text-slate-500 uppercase tracking-widest">{{ flipperBackItem.date }}</span>
                            </div>
                            <h3 class="text-2xl font-bold text-slate-900 mb-4 leading-tight flex justify-between">
                                <span class="pr-4">{{ flipperBackItem.title }}</span>
                                <div class="w-8 h-8 rounded bg-transparent flex items-center justify-center opacity-0 shrink-0"></div>
                            </h3>
                            <p class="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium">{{ flipperBackItem.overview }}</p>
                            <div class="mt-auto">
                                <img :src="flipperBackItem.image" class="w-full h-64 object-cover rounded border border-slate-200 mb-2 grayscale-[10%]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="isFlipping && flipDirection === 'prev'" class="flipper-prev transform-3d z-50">
                    <div class="absolute inset-0 bg-white backface-hidden p-12 overflow-hidden rounded-l-md border-y border-l border-slate-200 shadow-[5px_0_15px_rgba(0,0,0,0.05)]">
                        <div v-if="flipperFrontItem" class="flex flex-col h-full relative">
                            <div class="flex items-center gap-3 mb-8">
                                <div class="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex items-center justify-center">
                                    <i :class="[flipperFrontItem.icon, 'text-slate-700 text-lg']"></i>
                                </div>
                                <span class="text-xs font-semibold text-slate-500 uppercase tracking-widest">{{ flipperFrontItem.date }}</span>
                            </div>
                            <h3 class="text-2xl font-bold text-slate-900 mb-4 leading-tight flex justify-between">
                                <span class="pr-4">{{ flipperFrontItem.title }}</span>
                                <div class="w-8 h-8 rounded bg-transparent flex items-center justify-center opacity-0 shrink-0"></div>
                            </h3>
                            <p class="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium">{{ flipperFrontItem.overview }}</p>
                            <div class="mt-auto">
                                <img :src="flipperFrontItem.image" class="w-full h-64 object-cover rounded border border-slate-200 mb-2 grayscale-[10%]" />
                            </div>
                        </div>
                    </div>
                    <div class="absolute inset-0 bg-white backface-hidden p-12 overflow-hidden rounded-r-md border-y border-r border-slate-200 rotate-y-180 shadow-[-5px_0_15px_rgba(0,0,0,0.05)]">
                        <div v-if="flipperBackItem" class="flex flex-col h-full relative">
                            <div class="flex items-center gap-3 mb-8">
                                <div class="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex items-center justify-center">
                                    <i :class="[flipperBackItem.icon, 'text-slate-700 text-lg']"></i>
                                </div>
                                <span class="text-xs font-semibold text-slate-500 uppercase tracking-widest">{{ flipperBackItem.date }}</span>
                            </div>
                            <h3 class="text-2xl font-bold text-slate-900 mb-4 leading-tight flex justify-between">
                                <span class="pr-4">{{ flipperBackItem.title }}</span>
                                <div class="w-8 h-8 rounded bg-transparent flex items-center justify-center opacity-0 shrink-0"></div>
                            </h3>
                            <p class="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium">{{ flipperBackItem.overview }}</p>
                            <div class="mt-auto">
                                <img :src="flipperBackItem.image" class="w-full h-64 object-cover rounded border border-slate-200 mb-2 grayscale-[10%]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-200 z-[60] pointer-events-none"></div>
            </div>

            <div class="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <button class="w-10 h-10 rounded border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-30 flex items-center justify-center outline-none" @click="turnPage('prev')" :disabled="currentSpreadIndex === 0 || isFlipping">
                    <i class="pi pi-chevron-left text-xs"></i>
                </button>
                <button class="w-10 h-10 rounded border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-30 flex items-center justify-center outline-none" @click="turnPage('next')" :disabled="currentSpreadIndex === spreads.length - 1 || isFlipping">
                    <i class="pi pi-chevron-right text-xs"></i>
                </button>
            </div>
        </div>
    </section>
</template>

<style scoped>
/* 🪄 BULLETPROOF CUSTOM CSS FOR SMOOTH EMERGE AND FADE */
.bulletin-drawer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 96%;
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    padding: 2.5rem;
    border-top: 1px solid #e2e8f0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    cursor: auto;
    
    /* The core physics for emerging */
    opacity: 0;
    transform: translateY(60px);
    pointer-events: none;
    visibility: hidden;
    transition: opacity 1.5s cubic-bezier(0.2, 0.8, 0.2, 1), transform 1.5s cubic-bezier(0.2, 0.8, 0.2, 1), visibility 1.5s;
}

.bulletin-drawer.is-open {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
    visibility: visible;
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.08);
}

/* 3D PHYSICS FOR BULLETIN BOARD FLIP */
.perspective-book { perspective: 2500px; }
.transform-3d { transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }
.rotate-y-180 { transform: rotateY(180deg); }

.flipper-next {
    position: absolute;
    top: 0; right: 0; bottom: 0; width: 50%;
    transform-origin: left center;
    animation: flipNextAnim 1s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;
    will-change: transform;
}
@keyframes flipNextAnim {
    0% { transform: rotateY(0deg); }
    100% { transform: rotateY(-180deg); }
}

.flipper-prev {
    position: absolute;
    top: 0; left: 0; bottom: 0; width: 50%;
    transform-origin: right center;
    animation: flipPrevAnim 1s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;
    will-change: transform;
}
@keyframes flipPrevAnim {
    0% { transform: rotateY(0deg); }
    100% { transform: rotateY(180deg); }
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
</style>