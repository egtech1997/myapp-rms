<script setup>
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Chip from 'primevue/chip';

defineProps({
    visible: Boolean,
    job: Object
});

defineEmits(['update:visible']);
</script>

<template>
    <Dialog :visible="visible" @update:visible="$emit('update:visible', $event)" :focusTrap="false" modal dismissableMask :showHeader="false" contentClass="p-0 rounded-[var(--radius-3xl)] overflow-hidden shadow-[0_24px_60px_-15px_rgba(0,0,0,0.2)]" class="max-w-lg w-full mx-4" style="font-family: 'Avenir', sans-serif;">
        <div class="bg-white text-left flex flex-col">
            <div class="p-8">
                <div class="flex justify-between items-start mb-6">
                    <span class="text-xs font-bold text-violet-700 tracking-widest uppercase bg-violet-100 px-4 py-1.5 rounded-full shadow-sm transition-colors hover:bg-violet-200">{{ job?.division }}</span>
                    <Button icon="pi pi-times" severity="secondary" rounded text class="-mt-2 -mr-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-300 hover:rotate-90" @click="$emit('update:visible', false)" />
                </div>
                <h2 class="text-3xl font-black text-gray-900 mb-5 leading-tight tracking-tight">{{ job?.title }}</h2>
                <div class="flex gap-4 mb-8">
                    <Chip :label="job?.salary" class="bg-white text-violet-900 font-semibold text-sm rounded-full px-5 py-2.5 border border-violet-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300" />
                    <Chip :label="job?.type" class="bg-white text-teal-700 font-semibold text-sm rounded-full px-5 py-2.5 border border-teal-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300" />
                </div>
                <div class="space-y-6 border-t border-gray-100 pt-8">
                    <div>
                        <h4 class="font-bold text-gray-900 text-sm mb-3 uppercase tracking-wider">Description</h4>
                        <p class="text-gray-600 text-base leading-relaxed font-medium">{{ job?.description }}</p>
                    </div>
                    <div v-if="job?.requirements">
                        <h4 class="font-bold text-gray-900 text-sm mb-4 uppercase tracking-wider">Requirements</h4>
                        <ul class="space-y-4">
                            <li v-for="req in job?.requirements" :key="req" class="flex items-start gap-4 text-base text-gray-700 font-medium group hover:text-gray-900 transition-colors duration-300">
                                <i class="pi pi-check text-teal-600 text-sm mt-1 bg-teal-50 p-1.5 rounded-full shadow-sm group-hover:bg-teal-100 group-hover:scale-110 transition-all duration-300"></i> {{ req }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="bg-gray-50/50 p-6 flex gap-4 justify-end items-center border-t border-gray-100">
                <Button label="Cancel" text severity="secondary" class="font-bold px-6 py-3 rounded-[var(--radius-xl)] text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-all duration-300" @click="$emit('update:visible', false)" />
                <Button label="Apply Now" class="bg-violet-600 border-none px-8 py-3 rounded-[var(--radius-xl)] font-bold text-white shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)] hover:bg-violet-500 hover:shadow-[0_12px_25px_-6px_rgba(124,58,237,0.6)] hover:-translate-y-1 transition-all duration-300" />
            </div>
        </div>
    </Dialog>
</template>