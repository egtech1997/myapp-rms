<script setup>
import { ref } from 'vue'
import AdminSidebar from '@/components/AdminSidebar.vue'
import AdminTopbar from '@/components/AdminTopbar.vue'

// Global UI State
const isCollapsed = ref(false)
const isHovered = ref(false)
</script>

<template>
    <div
        class="flex h-screen bg-[var(--bg-app)] text-[var(--text-main)] font-sans selection:bg-[var(--color-solar)] selection:text-black">

        <AdminSidebar v-model:isHovered="isHovered" :isCollapsed="isCollapsed" />

        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
            <AdminTopbar v-model:isCollapsed="isCollapsed" />

            <main class="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
                <router-view v-slot="{ Component }">
                    <transition name="page-fade" mode="out-in">
                        <div class="max-w-7xl mx-auto w-full">
                            <component :is="Component" />
                        </div>
                    </transition>
                </router-view>
            </main>
        </div>
    </div>
</template>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-fade-enter-from {
    opacity: 0;
    transform: translateY(8px);
}

.page-fade-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>