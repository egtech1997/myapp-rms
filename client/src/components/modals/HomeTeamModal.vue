<script setup>
import { reactive } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

defineProps({
    visible: Boolean,
    member: Object
});

defineEmits(['update:visible']);

// ==============================================
// 🛠️ MODAL LAYOUT ADJUSTMENT KNOBS
// ==============================================
const modalAdjustment = reactive({
    profilePicSize: 170,      
    profilePicRounding: 9999, // 9999 for circle
    headerHeight: 144,        
    
    // X Button Positioning
    closeButtonTop: 24,       
    closeButtonRight: 24,     
});
</script>

<template>
    <Dialog 
        :visible="visible" 
        @update:visible="$emit('update:visible', $event)" 
        :focusTrap="false" 
        modal 
        dismissableMask 
        :showHeader="false" 
        contentClass="p-0 rounded-[var(--radius-2xl)] overflow-hidden shadow-[0_32px_100px_-20px_rgba(0,0,0,0.6)] border border-slate-800" 
        class="max-w-sm w-full mx-4" 
        style="font-family: 'Avenir', sans-serif;"
    >
        <div class="bg-slate-900 text-slate-100 text-center flex flex-col rounded-[var(--radius-2xl)]">
            <div 
                class="w-full flex items-end justify-center relative bg-gradient-to-b from-slate-800/50 to-transparent"
                :style="{ height: modalAdjustment.headerHeight + 'px' }"
            >
                <Button 
                    icon="pi pi-times" 
                    severity="secondary" 
                    text 
                    class="absolute text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-300 z-10 rounded-none" 
                    :style="{ 
                        top: modalAdjustment.closeButtonTop + 'px', 
                        right: modalAdjustment.closeButtonRight + 'px' 
                    }"
                    @click="$emit('update:visible', false)" 
                />
                
                <div class="relative translate-y-1/2 group">
                    <div 
                        class="absolute inset-0 bg-violet-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                        :style="{ borderRadius: modalAdjustment.profilePicRounding + 'px' }"
                    ></div>
                    
                    <img 
                        :src="member?.image" 
                        class="relative object-cover shadow-2xl transition-transform duration-500 group-hover:scale-105" 
                        :style="{ 
                            width: modalAdjustment.profilePicSize + 'px', 
                            height: modalAdjustment.profilePicSize + 'px',
                            borderRadius: modalAdjustment.profilePicRounding + 'px'
                        }"
                        alt="Team Member" 
                    />
                </div>
            </div>

            <div class="pt-28 p-8 pb-10">
                <h2 class="text-2xl font-black text-white tracking-tight">{{ member?.name }}</h2>
                
                <div class="inline-block mt-2 mb-6">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-teal-300 bg-teal-900/30 px-4 py-1.5 rounded-none">
                        {{ member?.role }}
                    </span>
                </div>

                <p class="text-slate-300 text-base leading-relaxed font-medium mb-8">
                    {{ member?.bio }}
                </p>

                <a 
                    :href="`mailto:${member?.email}`" 
                    class="inline-flex items-center justify-center gap-3 py-3 px-6 rounded-none bg-violet-600 text-white text-sm font-bold shadow-[0_4px_14px_0_rgba(124,58,237,0.39)] hover:bg-violet-500 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(124,58,237,0.23)] transition-all duration-300 group"
                >
                    <i class="pi pi-envelope text-violet-200 group-hover:text-white transition-colors"></i> 
                    {{ member?.email }}
                </a>
            </div>
        </div>
    </Dialog>
</template>