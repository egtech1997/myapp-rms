<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
    isCollapsed: Boolean,
    isHovered:   Boolean,
})
const emit = defineEmits(['update:isHovered'])

const route  = useRoute()
const active = ref(null)

const navGroups = [
    {
        title: 'Recruitment',
        items: [
            { label: 'Dashboard',     icon: 'pi-chart-line',  to: '/admin/dashboard' },
            {
                label: 'Hiring',      icon: 'pi-briefcase',   key: 'hiring',
                sub: [
                    { label: 'Job Vacancies',      icon: 'pi-file-plus',  to: '/admin/vacancies'   },
                    { label: 'Applicants',         icon: 'pi-users',      to: '/admin/applicants'  },
                    { label: 'Evaluations',        icon: 'pi-list-check', to: '/admin/evaluations' },
                    { label: 'Qualified Registry', icon: 'pi-verified',   to: '/admin/rqa'         },
                ],
            },
        ],
    },
    {
        title: 'Administration',
        items: [
            {
                label: 'Accounts',    icon: 'pi-user-plus',   key: 'accounts',
                sub: [
                    { label: 'User List',           icon: 'pi-users',     to: '/admin/user-list'         },
                    { label: 'Roles & Permissions', icon: 'pi-shield',    to: '/admin/roles-permissions' },
                    { label: 'Audit Logs',          icon: 'pi-history',   to: '/admin/audit-logs'        },
                ],
            },
            { label: 'Announcements', icon: 'pi-megaphone',  to: '/admin/announcements' },
            { label: 'Settings',      icon: 'pi-cog',        to: '/admin/settings'      },
        ],
    },
]

// Auto-open the group whose child matches current route
watch(() => route.path, (path) => {
    for (const g of navGroups) {
        for (const item of g.items) {
            if (item.sub?.some(s => s.to === path)) {
                active.value = item.key
                return
            }
        }
    }
}, { immediate: true })

const toggle = (key) => { active.value = active.value === key ? null : key }
const isExpanded = () => !props.isCollapsed || props.isHovered
</script>

<template>
    <aside
        @mouseenter="$emit('update:isHovered', true)"
        @mouseleave="$emit('update:isHovered', false)"
        :class="[isCollapsed && !isHovered ? 'w-[4.5rem]' : 'w-64']"
        class="flex flex-col shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-30 bg-[#0c1a3a] border-r border-white/5"
        role="navigation"
        aria-label="Admin navigation">

        <!-- ── Brand ──────────────────────────────────────────── -->
        <div class="h-16 flex items-center px-4 border-b border-white/5 shrink-0 gap-3 overflow-hidden">
            <div class="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/40">
                <i class="pi pi-shield text-white text-base" aria-hidden="true"></i>
            </div>
            <Transition name="label-fade">
                <div v-if="isExpanded()" class="flex flex-col leading-tight overflow-hidden">
                    <span class="text-white font-bold text-sm tracking-tight whitespace-nowrap">DepEd GNC</span>
                    <span class="text-white/40 text-[10px] font-medium tracking-widest uppercase whitespace-nowrap">RSP Portal</span>
                </div>
            </Transition>
        </div>

        <!-- ── Nav ───────────────────────────────────────────── -->
        <nav class="flex-1 overflow-y-auto custom-scrollbar py-4 px-2 flex flex-col gap-6">
            <div v-for="group in navGroups" :key="group.title">

                <!-- Group label -->
                <Transition name="label-fade">
                    <p v-if="isExpanded()"
                        class="text-[9px] font-bold text-white/30 uppercase tracking-[0.18em] mb-2 px-3 select-none">
                        {{ group.title }}
                    </p>
                </Transition>
                <div v-if="!isExpanded()" class="h-px bg-white/10 mb-3 mx-2"></div>

                <ul class="flex flex-col gap-0.5" role="list">
                    <li v-for="item in group.items" :key="item.label">

                        <!-- Direct link -->
                        <router-link v-if="!item.sub" :to="item.to"
                            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative"
                            :class="route.path === item.to
                                ? 'bg-[var(--color-primary)] text-white shadow-md shadow-blue-900/30'
                                : 'text-white/50 hover:text-white hover:bg-white/8'"
                            :aria-current="route.path === item.to ? 'page' : undefined"
                            :title="!isExpanded() ? item.label : undefined">

                            <i :class="['pi shrink-0 text-[15px]', item.icon]" aria-hidden="true"></i>
                            <Transition name="label-fade">
                                <span v-if="isExpanded()" class="text-[13px] font-medium truncate">{{ item.label }}</span>
                            </Transition>

                            <!-- Active dot when collapsed -->
                            <span v-if="!isExpanded() && route.path === item.to"
                                class="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]"
                                aria-hidden="true"></span>
                        </router-link>

                        <!-- Dropdown -->
                        <div v-else>
                            <button @click="toggle(item.key)"
                                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group"
                                :class="active === item.key ? 'text-white bg-white/8' : 'text-white/50 hover:text-white hover:bg-white/8'"
                                :aria-expanded="active === item.key ? 'true' : 'false'"
                                :title="!isExpanded() ? item.label : undefined">

                                <i :class="['pi shrink-0 text-[15px]', item.icon]" aria-hidden="true"></i>
                                <Transition name="label-fade">
                                    <span v-if="isExpanded()" class="text-[13px] font-medium truncate flex-1 text-left">{{ item.label }}</span>
                                </Transition>
                                <Transition name="label-fade">
                                    <i v-if="isExpanded()"
                                        :class="['pi pi-chevron-down text-[9px] transition-transform duration-200 shrink-0 text-white/30',
                                            active === item.key ? 'rotate-180 text-white/60' : '']"
                                        aria-hidden="true"></i>
                                </Transition>
                            </button>

                            <!-- Sub-items -->
                            <Transition name="slide-down">
                                <ul v-if="active === item.key && isExpanded()"
                                    class="mt-1 ml-4 pl-4 border-l border-white/10 flex flex-col gap-0.5"
                                    role="list">
                                    <li v-for="sub in item.sub" :key="sub.to">
                                        <router-link :to="sub.to"
                                            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] transition-colors"
                                            :class="route.path === sub.to
                                                ? 'text-[var(--color-gold)] font-semibold bg-white/5'
                                                : 'text-white/40 hover:text-white hover:bg-white/5'"
                                            :aria-current="route.path === sub.to ? 'page' : undefined">
                                            <i :class="['pi text-[11px]', sub.icon]" aria-hidden="true"></i>
                                            {{ sub.label }}
                                        </router-link>
                                    </li>
                                </ul>
                            </Transition>
                        </div>
                    </li>
                </ul>
            </div>
        </nav>

        <!-- ── Footer ─────────────────────────────────────────── -->
        <div class="p-3 border-t border-white/5 shrink-0">
            <Transition name="label-fade">
                <div v-if="isExpanded()"
                    class="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                    <i class="pi pi-info-circle text-white/30 text-xs shrink-0" aria-hidden="true"></i>
                    <div class="min-w-0">
                        <p class="text-[10px] text-white/25 font-medium leading-none">DepEd Division of</p>
                        <p class="text-[11px] text-white/50 font-semibold truncate mt-0.5">Guihulngan City</p>
                    </div>
                </div>
            </Transition>
            <div v-if="!isExpanded()"
                class="flex justify-center py-1">
                <i class="pi pi-info-circle text-white/20 text-sm" aria-hidden="true"></i>
            </div>
        </div>
    </aside>
</template>

<style scoped>
.label-fade-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.label-fade-leave-active { transition: opacity 0.1s ease; position: absolute; }
.label-fade-enter-from   { opacity: 0; transform: translateX(-6px); }
.label-fade-leave-to     { opacity: 0; }

.slide-down-enter-active { transition: all 0.22s cubic-bezier(0, 0, 0.2, 1); }
.slide-down-leave-active { transition: all 0.15s ease; }
.slide-down-enter-from   { opacity: 0; transform: translateY(-8px); }
.slide-down-leave-to     { opacity: 0; transform: translateY(-4px); }

.custom-scrollbar::-webkit-scrollbar        { width: 3px; }
.custom-scrollbar::-webkit-scrollbar-track  { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb  { background: rgba(255,255,255,0.1); border-radius: 10px; }
</style>
