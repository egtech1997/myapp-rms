<script setup>
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

defineProps({
    visible: Boolean,
    announcement: Object
});

defineEmits(['update:visible']);
</script>

<template>
    <Dialog :visible="visible" @update:visible="$emit('update:visible', $event)" :focusTrap="false" modal dismissableMask :showHeader="false" contentClass="p-0 rounded-[var(--radius-3xl)] overflow-hidden shadow-[0_32px_80px_-20px_rgba(0,0,0,0.25)]" class="max-w-2xl w-full mx-4" style="font-family: 'Avenir', sans-serif;">
        <div class="bg-white flex flex-col">
            
            <div class="relative w-full h-64 bg-slate-100 group">
                <img :src="announcement?.image" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Announcement Banner" />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                
                <Button icon="pi pi-times" severity="secondary" rounded text class="absolute top-4 right-4 text-white/70 hover:text-rose-500 hover:bg-white/20 transition-all duration-300 hover:rotate-90 z-10" @click="$emit('update:visible', false)" />
                
                <div class="absolute bottom-6 left-8 right-8">
                    <div class="flex items-center gap-3 mb-3">
                        <span :class="[announcement?.bg, announcement?.color, 'w-10 h-10 rounded-[var(--radius-xl)] flex items-center justify-center shadow-inner text-lg']">
                            <i :class="announcement?.icon"></i>
                        </span>
                        <span class="text-xs font-bold text-white uppercase tracking-widest bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-sm">
                            {{ announcement?.category }}
                        </span>
                    </div>
                    <h2 class="text-3xl font-black text-white leading-tight drop-shadow-md tracking-tight">{{ announcement?.title }}</h2>
                </div>
            </div>

            <div class="p-8">
                <div class="flex flex-col sm:flex-row gap-5 sm:gap-8 mb-8 bg-slate-50 p-5 rounded-[var(--radius-2xl)] border border-slate-100 shadow-inner">
                    <div class="flex items-center gap-3">
                        <img :src="announcement?.publisherImage" class="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
                        <div class="flex flex-col leading-tight">
                            <span class="text-sm font-black text-slate-800">{{ announcement?.publisherName || 'DepEd Guihulngan' }}</span>
                            <span class="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-0.5">Publisher</span>
                        </div>
                    </div>
                    
                    <div class="hidden sm:block w-px bg-slate-200"></div>
                    
                    <div class="flex flex-col justify-center gap-2">
                        <div class="flex items-center gap-2 text-xs text-slate-600 font-bold">
                            <i class="pi pi-calendar text-indigo-500"></i> {{ announcement?.date }}
                        </div>
                        <div class="flex items-center gap-2 text-xs text-slate-600 font-bold">
                            <i class="pi pi-clock text-indigo-500"></i> {{ announcement?.time }}
                        </div>
                    </div>
                    
                    <div class="hidden sm:block w-px bg-slate-200"></div>
                    
                    <div class="flex flex-col justify-center">
                        <div class="flex items-start gap-2 text-xs text-slate-600 font-bold">
                            <i class="pi pi-map-marker text-indigo-500 mt-0.5"></i> 
                            <span class="leading-snug">{{ announcement?.location }}</span>
                        </div>
                    </div>
                </div>

                <div class="text-slate-600 font-medium whitespace-pre-line leading-relaxed text-base">
                    {{ announcement?.content }}
                </div>
                
                <div class="mt-10 flex justify-end border-t border-slate-100 pt-6">
                    <Button label="Close" class="bg-indigo-600 border-none px-8 py-3 rounded-[var(--radius-xl)] font-bold text-white shadow-md hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300" @click="$emit('update:visible', false)" />
                </div>
            </div>
            
        </div>
    </Dialog>
</template>