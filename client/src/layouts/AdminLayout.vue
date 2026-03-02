<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isCollapsed = ref(true)
const isHovered = ref(false)

const navGroups = [
    {
        title: 'Management',
        items: [
            { label: 'Analytics', icon: 'pi pi-chart-line', to: '/admin/dashboard' },
          { label: 'Bulletin', icon: 'pi pi-chart-line', to: '/admin/bulletin' },
            { label: 'Jobs', icon: 'pi pi-briefcase', to: '/admin/jobs' },
            { label: 'Applicants', icon: 'pi pi-users', to: '/admin/applicants' },
            { label: 'Accounts', icon: 'pi pi-chart-line', to: '/admin/accounts' },
        ],
    },
]
</script>

<template>
    <div class="flex h-screen bg-corp-bg font-inter text-[13px] antialiased text-slate-600">

        <!-- Sidebar -->
        <aside @mouseenter="isHovered = true" @mouseleave="isHovered = false"
            :class="[isCollapsed && !isHovered ? 'w-[68px]' : 'w-64']"
            class="bg-corp-sidebar flex flex-col shrink-0 transition-all duration-300 ease-out z-30 shadow-2xl">
            <!-- Logo -->
            <div class="h-14 flex items-center px-4 border-b border-white/5 bg-black/20">
                <div class="flex items-center gap-3 overflow-hidden">
                    <div
                        class="min-w-9 h-9 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-lg flex items-center justify-center shadow">
                        <i class="pi pi-prime text-white"></i>
                    </div>
                    <span v-show="!isCollapsed || isHovered"
                        class="text-white font-bold uppercase tracking-wide text-xs whitespace-nowrap">
                        ORAS Portal
                    </span>
                </div>
            </div>

            <!-- Nav -->
            <nav class="flex-1 py-4 px-3 space-y-6 overflow-y-auto scrollbar-hide">
                <div v-for="group in navGroups" :key="group.title">
                    <p v-show="!isCollapsed || isHovered"
                        class="px-3 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-3">
                        {{ group.title }}
                    </p>

                    <div class="space-y-1">
                        <router-link v-for="item in group.items" :key="item.to" :to="item.to" class="group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                     text-white/60 hover:text-white hover:bg-white/10
                     aria-[current=page]:bg-gradient-to-r aria-[current=page]:from-sky-600/20 aria-[current=page]:to-indigo-600/20
                     aria-[current=page]:text-sky-400 aria-[current=page]:font-semibold">
                            <i :class="item.icon"
                                class="text-base min-w-[22px] text-center group-hover:scale-110 transition-transform"></i>
                            <span v-show="!isCollapsed || isHovered" class="truncate">
                                {{ item.label }}
                            </span>
                        </router-link>
                    </div>
                </div>
            </nav>
        </aside>

        <!-- Main -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

            <!-- Header -->
            <header
                class="h-14 bg-white border-b border-corp-border flex items-center justify-between px-4 sticky top-0 z-20 backdrop-blur">
                <div class="flex items-center gap-3">
                    <button @click="isCollapsed = !isCollapsed"
                        class="w-9 h-9 grid place-items-center rounded-lg hover:bg-slate-100 text-slate-500 transition">
                        <i class="pi pi-bars"></i>
                    </button>

                    <!-- Breadcrumb -->
                    <div
                        class="hidden sm:flex items-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <span class="hover:text-sky-600 cursor-pointer">Admin</span>
                        <i class="pi pi-angle-right mx-2 text-[8px]"></i>
                        <span class="text-slate-700 font-extrabold">
                            {{ $route.name || 'Overview' }}
                        </span>
                    </div>
                </div>

                <!-- Right -->
                <div class="flex items-center gap-3">
                    <Button icon="pi pi-bell" variant="text" severity="secondary" size="small"
                        class="!w-9 !h-9 rounded-full hover:bg-slate-100" />

                    <div class="h-5 w-px bg-slate-200"></div>

                    <!-- User -->
                    <div class="relative group">
                        <button class="flex items-center gap-2 rounded-full hover:bg-slate-50 p-1 transition">
                            <Avatar
                                :image="authStore.user?.avatar || `https://ui-avatars.com/api/?name=${authStore.user?.username}&background=E2E8F0&color=334155`"
                                shape="circle" class="!w-8 !h-8 border border-slate-200" />
                            <i class="pi pi-chevron-down text-[10px] text-slate-400 hidden sm:block"></i>
                        </button>

                        <!-- Dropdown -->
                        <div class="absolute right-0 mt-2 w-44 rounded-xl bg-white shadow-xl border border-slate-100
                     opacity-0 invisible group-hover:opacity-100 group-hover:visible
                     translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50">
                            <div class="px-3 py-2 border-b border-slate-100">
                                <p class="text-xs font-semibold text-slate-800 truncate">
                                    {{ authStore.user?.username }}
                                </p>
                                <p class="text-[10px] text-slate-400 truncate">
                                    {{ authStore.user?.email }}
                                </p>
                            </div>

                            <button class="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50">
                                <i class="pi pi-user text-sky-600"></i> Profile
                            </button>

                            <button class="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50">
                                <i class="pi pi-cog"></i> Settings
                            </button>

                            <div class="h-px bg-slate-100 my-1"></div>

                            <button @click="authStore.logout"
                                class="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                                <i class="pi pi-power-off"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Content -->
            <main class="flex-1 overflow-y-auto bg-corp-bg p-6">
                <div class="max-w-7xl mx-auto">
                    <slot />
                </div>
            </main>
        </div>
    </div>
</template>

<style scoped>
@reference "@/assets/main.css";

.font-inter {
    font-family: Inter, system-ui, sans-serif;
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
</style>