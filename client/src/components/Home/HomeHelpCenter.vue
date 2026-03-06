<script setup>
import { ref, onMounted } from 'vue';

const openFaqIndex = ref(null);

// This logic ensures only ONE FAQ can be open at a time.
const toggleFaq = (index) => {
    openFaqIndex.value = openFaqIndex.value === index ? null : index;
};

const faqs = ref([
    { question: "How do I apply for a position?", answer: "Create an account, complete your profile, and click the 'Apply Now' button on any job vacancy that matches your qualifications." },
    { question: "What are the basic requirements?", answer: "Basic requirements include a valid CSC Eligibility or LET License, Personal Data Sheet (PDS), and relevant Transcript of Records." },
    { question: "How long does the selection process take?", answer: "The duration typically follows the standard PRIME-HRM timeline of 1 to 3 months." }
]);

let mapInstance = null;

const initLeafletMap = () => {
    if (typeof window === 'undefined') return;

    const container = document.getElementById('leaflet-map');
    if (!container) {
        setTimeout(initLeafletMap, 200);
        return;
    }

    if (window.L) {
        const lat = 10.118538;
        const lng = 123.268849;
        
        if (mapInstance !== null) {
            mapInstance.remove();
        }

        mapInstance = window.L.map('leaflet-map', {
            center: [lat, lng],
            zoom: 17,
            zoomControl: true,
            scrollWheelZoom: true 
        });
        
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(mapInstance);

        const customIcon = window.L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        window.L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance)
            .bindPopup('<div style="font-family: Avenir, sans-serif; text-align: left;"><b style="color: #0f172a; font-size: 13px; display:block; margin-bottom:2px;">DepEd Region 7</b><span style="color: #64748b; font-size: 12px;">Guihulngan City Division Office</span></div>')
            .openPopup();

        setTimeout(() => {
            mapInstance.invalidateSize();
        }, 500);

        const resizeObserver = new ResizeObserver(() => {
            if (mapInstance) mapInstance.invalidateSize();
        });
        resizeObserver.observe(container);

    } else {
        setTimeout(initLeafletMap, 200);
    }
};

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
        document.querySelectorAll('#faq .emerge-hidden').forEach((el) => {
            observer.observe(el);
        });
    }, 100);

    if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
    }
    
    if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setTimeout(initLeafletMap, 100);
        document.head.appendChild(script);
    } else {
        setTimeout(initLeafletMap, 300); 
    }
});
</script>

<template>
    <section id="faq" class="py-24 px-8 bg-slate-50 border-t border-slate-200">
        <div class="max-w-[95rem] mx-auto">
            <div class="border-l-4 border-slate-900 pl-6 mb-16 emerge-hidden">
                <span class="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">Support & Location</span>
                <h2 class="text-3xl font-bold text-slate-900 tracking-tight">Help Center & Contact</h2>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch emerge-hidden">
                
                <div class="lg:col-span-5 flex flex-col gap-8 h-full">
                    <div class="w-full bg-white border border-slate-200 rounded p-6 flex flex-col">
                        <h3 class="text-sm font-bold text-slate-900 mb-6 tracking-widest uppercase border-b border-slate-100 pb-4 shrink-0">FAQs</h3>
                        
                        <div class="flex flex-col flex-grow">
                            <div v-for="(faq, index) in faqs" :key="index" class="border-b border-slate-100 last:border-none">
                                <button @click="toggleFaq(index)" class="w-full text-left font-bold text-slate-800 py-4 text-sm hover:text-slate-500 transition-colors bg-transparent flex justify-between items-center outline-none">
                                    {{ faq.question }}
                                    <i class="pi pi-chevron-down text-xs text-slate-400 transition-transform duration-300" :class="{ 'rotate-180': openFaqIndex === index }"></i>
                                </button>
                                
                                <div class="grid transition-all duration-300 ease-in-out" :class="openFaqIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'">
                                    <div class="overflow-hidden">
                                        <div class="text-slate-500 text-sm leading-relaxed pb-4 pt-1 bg-transparent font-medium">
                                            {{ faq.answer }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-4 relative h-full">
                    <div class="bg-white p-8 border border-slate-200 rounded relative z-10 h-full flex flex-col">
                        <h3 class="text-sm font-bold text-slate-900 mb-2 tracking-widest uppercase">Direct Inquiry</h3>
                        <p class="text-slate-500 text-xs mb-8 font-medium border-b border-slate-100 pb-6">Submit your questions directly to our support unit.</p>
                        
                        <div class="space-y-5 flex-grow flex flex-col">
                            <div>
                                <label class="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-2 block">Full Name</label>
                                <input type="text" class="w-full p-3 text-sm rounded-sm border border-slate-300 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-none outline-none" />
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-2 block">Email Address</label>
                                <input type="email" class="w-full p-3 text-sm rounded-sm border border-slate-300 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-none outline-none" />
                            </div>
                            <div class="flex-grow flex flex-col">
                                <label class="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-2 block">Message</label>
                                <textarea class="w-full p-3 text-sm rounded-sm border border-slate-300 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-none resize-none flex-grow outline-none"></textarea>
                            </div>
                            <button class="w-full bg-slate-900 border border-slate-900 py-3 mt-4 rounded-sm font-bold text-white text-sm uppercase tracking-widest hover:bg-slate-800 transition-all duration-200 outline-none">
                                Submit
                            </button>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-3 flex flex-col gap-8">
                    <div class="w-full flex flex-col bg-white border border-slate-200 rounded p-4 h-[250px] shrink-0">
                        <div class="relative w-full h-full bg-slate-50 border border-slate-100 rounded overflow-hidden">
                            <div id="leaflet-map" class="absolute inset-0 w-full h-full z-0"></div>
                        </div>
                    </div>

                    <div class="flex flex-col pl-2">
                        <h3 class="text-xs font-bold uppercase tracking-widest mb-8 text-slate-400">Headquarters</h3>
                        
                        <div class="space-y-8">
                            <div class="flex items-start gap-4 group">
                                <i class="pi pi-building text-slate-900 text-lg mt-0.5"></i>
                                <p class="text-slate-700 font-medium text-sm leading-relaxed">DepEd Region 7 - Guihulngan City Division Office<br/>E Villegas St, City of Guihulngan<br/>Negros Oriental</p>
                            </div>
                            
                            <div class="flex items-center gap-4 group">
                                <i class="pi pi-globe text-slate-900 text-lg"></i>
                                <a href="http://depedguihulngan.ph" target="_blank" class="text-slate-700 hover:text-slate-900 transition-colors font-medium text-sm border-b border-transparent hover:border-slate-900 pb-0.5">depedguihulngan.ph</a>
                            </div>
                            
                            <div class="flex items-center gap-4 group">
                                <i class="pi pi-envelope text-slate-900 text-lg"></i>
                                <a href="mailto:guihulngan.rsp@deped.gov.ph" class="text-slate-700 hover:text-slate-900 transition-colors font-medium text-sm border-b border-transparent hover:border-slate-900 pb-0.5">guihulngan.rsp@deped.gov.ph</a>
                            </div>

                            <div class="flex items-center gap-4 group">
                                <i class="pi pi-phone text-slate-900 text-lg"></i>
                                <p class="text-slate-700 font-medium text-sm">(035) 410-4066</p>
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

.emerge-hidden {
    opacity: 0;
    transform: translateY(50px);
    transition: opacity 1.2s cubic-bezier(0.2, 0.8, 0.2, 1), transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.emerge-visible {
    opacity: 1;
    transform: translateY(0);
}

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