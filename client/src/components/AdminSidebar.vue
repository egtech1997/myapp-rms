<script setup>
import { ref } from 'vue';

const props = defineProps({
    isCollapsed: Boolean,
    isHovered: Boolean
});

const emit = defineEmits(['update:isHovered']);

// Dropdown states
const activeDropdowns = ref({
    accounts: false,
    hiring: false,
    reports: false
});

const toggleDropdown = (key) => {
    activeDropdowns.value[key] = !activeDropdowns.value[key];
};

const navGroups = [
    {
        title: 'Recruitment Flow',
        items: [
            { label: 'Analytics', icon: 'pi pi-chart-line', to: '/admin/dashboard' },
            {
                label: 'Hiring Management',
                icon: 'pi pi-briefcase',
                isDropdown: true,
                key: 'hiring',
                subItems: [
                    { label: 'Job Vacancies', icon: 'pi pi-plus-circle', to: '/admin/vacancies' },
                    { label: 'Applicants List', icon: 'pi pi-users', to: '/admin/applicants' },
                    { label: 'Evaluation', icon: 'pi pi-list', to: '/admin/evaluations' },
                    { label: 'Registry of Qualified', icon: 'pi pi-verified', to: '/admin/rqa' },
                ]
            }
        ]
    },
    {
        title: 'Administration',
        items: [
            {
                label: 'User Accounts',
                icon: 'pi pi-user-plus',
                isDropdown: true,
                key: 'accounts',
                subItems: [
                    { label: 'Users List', icon: 'pi pi-users', to: '/admin/user-list' },
                    { label: 'Roles & Permissions', icon: 'pi pi-shield', to: '/admin/roles-permissions' },
                    { label: 'Audit Logs', icon: 'pi pi-history', to: '/admin/audit-logs' },
                ]
            }
        ]
    }
];
</script>

<template>
    <aside @mouseenter="$emit('update:isHovered', true)" @mouseleave="$emit('update:isHovered', false)"
        :class="[isCollapsed && !isHovered ? 'w-20' : 'w-72']"
        class="flex flex-col shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-30 bg-[#020617] border-r border-slate-800/50">
        <div class="h-16 flex items-center px-6 border-b border-slate-800/50">
            <div class="flex items-center gap-4 overflow-hidden">
                <div
                    class="min-w-8 h-8 rounded-lg bg-[#EAB308] flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                    <i class="pi pi-shield text-[#020617] text-sm font-bold"></i>
                </div>
                <div v-show="!isCollapsed || isHovered" class="flex flex-col transition-opacity duration-300">
                    <span class="text-white font-bold text-sm tracking-tight whitespace-nowrap">PRIME-HR</span>
                    <span
                        class="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em] leading-none">Administration</span>
                </div>
            </div>
        </div>

        <nav class="flex-1 py-8 px-4 space-y-8 overflow-y-auto custom-scrollbar">
            <div v-for="group in navGroups" :key="group.title">
                <p v-show="!isCollapsed || isHovered"
                    class="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-4">
                    {{ group.title }}
                </p>

                <div class="space-y-1">
                    <template v-for="item in group.items" :key="item.label">

                        <router-link v-if="!item.isDropdown" :to="item.to"
                            class="group flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all duration-200 text-slate-400 hover:text-white hover:bg-slate-800/50 aria-[current=page]:text-white aria-[current=page]:bg-slate-800/80 relative">
                            <div
                                class="absolute left-0 w-1 h-5 bg-[#EAB308] rounded-r-full scale-y-0 aria-[current=page]:scale-y-100 transition-transform duration-200">
                            </div>

                            <i :class="item.icon"
                                class="text-lg min-w-[20px] text-center transition-colors group-hover:text-[#EAB308]"></i>
                            <span v-show="!isCollapsed || isHovered"
                                class="truncate text-[13px] font-medium tracking-wide">
                                {{ item.label }}
                            </span>
                        </router-link>

                        <div v-else class="space-y-1">
                            <button @click="toggleDropdown(item.key)"
                                :class="[activeDropdowns[item.key] ? 'text-white bg-slate-800/30' : 'text-slate-400']"
                                class="w-full group flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg transition-all duration-200 hover:text-white hover:bg-slate-800/50">
                                <div class="flex items-center gap-4">
                                    <i :class="item.icon"
                                        class="text-lg min-w-[20px] text-center group-hover:text-[#EAB308] transition-colors"></i>
                                    <span v-show="!isCollapsed || isHovered"
                                        class="truncate text-[13px] font-medium tracking-wide">
                                        {{ item.label }}
                                    </span>
                                </div>
                                <i v-show="!isCollapsed || isHovered"
                                    :class="[activeDropdowns[item.key] ? 'rotate-180 text-[#EAB308]' : 'text-slate-600']"
                                    class="pi pi-chevron-down text-[9px] transition-transform duration-300"></i>
                            </button>

                            <div v-show="activeDropdowns[item.key] && (!isCollapsed || isHovered)"
                                class="mt-1 ml-6 space-y-1 border-l border-slate-800 pl-4 animate-slide-down">
                                <router-link v-for="subItem in item.subItems" :key="subItem.to" :to="subItem.to"
                                    class="flex items-center gap-3 px-3 py-2 rounded-md text-[13px] text-slate-500 hover:text-white transition-all aria-[current=page]:text-[#EAB308] aria-[current=page]:font-bold">
                                    <span class="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-[#EAB308]"></span>
                                    <span>{{ subItem.label }}</span>
                                </router-link>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </nav>

        <div class="p-4 border-t border-slate-800/50">
            <div v-show="!isCollapsed || isHovered"
                class="px-4 py-3 bg-slate-900/50 rounded-xl border border-slate-800">
                <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Storage Usage</p>
                <div class="mt-2 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div class="w-2/3 h-full bg-[#EAB308]"></div>
                </div>
            </div>
        </div>
    </aside>
</template>

<style scoped>
/* Standard CSS for scrollbar refinement */
.custom-scrollbar::-webkit-scrollbar {
    width: 3px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #1e293b;
    /* slate-800 */
    border-radius: 10px;
}

.custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background: #334155;
    /* slate-700 */
}

/* Dropdown Animation */
.animate-slide-down {
    animation: slideDown 0.25s cubic-bezier(0, 0, 0.2, 1);
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Ensure active indicator works with router-link */
.router-link-active .absolute {
    transform: scaleY(1);
}
</style>