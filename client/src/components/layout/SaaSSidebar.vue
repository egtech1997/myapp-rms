<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps({
    isCollapsed: Boolean,
    isHovered: Boolean
})

const emit = defineEmits(['update:isHovered'])

const route = useRoute()
const authStore     = useAuthStore()
const settingsStore = useSettingsStore()

// ── Navigation Groups ────────────────────────────────────────────────────
const navigationGroups = [
    {
        title: 'Overview',
        items: [
            { label: 'Dashboard',       icon: 'pi-home',         to: '/admin/dashboard',  perm: 'dash_view' },
        ]
    },
    {
        title: 'Recruitment',
        items: [
            { label: 'Job Vacancies',   icon: 'pi-briefcase',    to: '/admin/vacancies',    perm: 'vac_view'  },
            { label: 'Applicants',      icon: 'pi-users',        to: '/admin/applicants',   perm: 'app_view'  },
            { label: 'Evaluations',     icon: 'pi-list-check',   to: '/admin/evaluations',  perm: 'eval_view' },
            { label: 'Rubrics',         icon: 'pi-sliders-h',    to: '/admin/rubrics',      perm: 'vac_view'  },
            { label: 'Qualified Registry', icon: 'pi-verified',  to: '/admin/rqa',          perm: 'rqa_view'  },
            { label: 'Appointments',    icon: 'pi-star',         to: '/admin/appointments', perm: 'appt_view' },
        ]
    },
    {
        title: 'Administration',
        items: [
            { label: 'Announcements',   icon: 'pi-megaphone',    to: '/admin/announcements',     perm: 'ann_manage' },
            { label: 'User Accounts',   icon: 'pi-user-plus',    to: '/admin/user-list',         perm: 'user_manage' },
            { label: 'Roles & Perms',   icon: 'pi-shield',       to: '/admin/roles-permissions', perm: 'role_manage' },
            { label: 'Audit Logs',      icon: 'pi-history',      to: '/admin/audit-logs',        perm: 'audit_view' },
            { label: 'Settings',        icon: 'pi-cog',          to: '/admin/settings',          perm: 'set_manage' },
        ]
    },
]

// Filter by permissions — null perm means always show
const filteredGroups = computed(() => {
    return navigationGroups.map(group => ({
        ...group,
        items: group.items.filter(item => item.perm === null || authStore.can(item.perm))
    })).filter(group => group.items.length > 0)
})

const isActive = (path) => route.path.startsWith(path)
</script>

<template>
    <aside
        class="fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 ease-[var(--ease-spring)]"
        :class="isCollapsed && !isHovered ? 'w-20' : 'w-64'"
        style="background: #001F3F; border-right: 1px solid rgba(255,255,255,0.06);"
        @mouseenter="emit('update:isHovered', true)"
        @mouseleave="emit('update:isHovered', false)">

        <!-- Brand Header -->
        <div class="h-16 flex items-center px-4 shrink-0 gap-3"
             style="border-bottom: 1px solid rgba(255,255,255,0.07);">
            <div class="w-9 h-9 rounded-[var(--radius-xl)] shrink-0 flex items-center justify-center shadow-lg overflow-hidden"
                 :style="settingsStore.resolvedLogoUrl ? '' : 'background: linear-gradient(135deg, #5B84BA 0%, #4A4D8F 100%); box-shadow: 0 4px 12px rgba(91,132,186,0.35);'">
                <img v-if="settingsStore.resolvedLogoUrl"
                     :src="settingsStore.resolvedLogoUrl"
                     class="w-full h-full object-cover" />
                <i v-else class="pi pi-shield text-white text-sm"></i>
            </div>
            <transition name="fade">
                <div v-if="!isCollapsed || isHovered" class="overflow-hidden whitespace-nowrap">
                    <h1 class="text-sm font-black leading-none tracking-tight" style="color: #ffffff;">{{ settingsStore.systemName }}</h1>
                    <p class="text-[10px] font-semibold uppercase tracking-[0.18em] mt-0.5" style="color: rgba(255,255,255,0.35);">{{ settingsStore.systemSubName }}</p>
                </div>
            </transition>
        </div>

        <!-- Navigation -->
        <div class="flex-1 overflow-y-auto custom-scrollbar py-5 px-3 flex flex-col gap-6">
            <div v-for="group in filteredGroups" :key="group.title">
                <transition name="fade">
                    <p v-if="!isCollapsed || isHovered"
                       class="px-2.5 mb-1.5 text-[9px] font-black uppercase tracking-[0.22em] select-none"
                       style="color: rgba(255,255,255,0.25);">
                        {{ group.title }}
                    </p>
                </transition>
                <div v-if="isCollapsed && !isHovered" class="h-px mb-3 mx-2" style="background: rgba(255,255,255,0.06);"></div>

                <div class="flex flex-col gap-0.5">
                    <router-link
                        v-for="item in group.items" :key="item.to" :to="item.to"
                        :title="isCollapsed && !isHovered ? item.label : undefined"
                        class="group relative flex items-center gap-3 px-2.5 py-2.5 rounded-[var(--radius-xl)] transition-all duration-200"
                        :style="isActive(item.to)
                            ? 'background: rgba(91,132,186,0.18); color: #7AADDA;'
                            : 'color: rgba(255,255,255,0.45);'">

                        <!-- Hover bg (CSS can't do this cleanly in inline, handled via group class) -->
                        <div v-if="!isActive(item.to)"
                             class="absolute inset-0 rounded-[var(--radius-xl)] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                             style="background: rgba(255,255,255,0.05);"></div>

                        <i :class="['pi text-[14px] shrink-0 relative z-[1]', item.icon]"
                           :style="isActive(item.to) ? 'color: #5B84BA;' : ''"></i>

                        <transition name="fade">
                            <span v-if="!isCollapsed || isHovered"
                                  class="text-[12.5px] font-semibold tracking-tight whitespace-nowrap relative z-[1]">
                                {{ item.label }}
                            </span>
                        </transition>

                        <!-- Active left rail -->
                        <div v-if="isActive(item.to)"
                             class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                             style="background: #EFBF04;"></div>

                        <!-- Collapsed active dot -->
                        <span v-if="(isCollapsed && !isHovered) && isActive(item.to)"
                              class="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                              style="background: #EFBF04;"></span>
                    </router-link>
                </div>
            </div>
        </div>

        <!-- Footer — User identity -->
        <div class="p-3 shrink-0" style="border-top: 1px solid rgba(255,255,255,0.07);">
            <div class="flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-xl)] cursor-default
                        hover:bg-white/5 transition-colors duration-150">
                <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                     style="background: linear-gradient(135deg, #4A4D8F, #3B3E75);">
                    {{ authStore.user?.username?.charAt(0).toUpperCase() }}
                </div>
                <transition name="fade">
                    <div v-if="!isCollapsed || isHovered" class="flex-1 min-w-0">
                        <p class="text-[12px] font-semibold truncate capitalize" style="color: rgba(255,255,255,0.75);">
                            {{ authStore.user?.username }}
                        </p>
                        <p class="text-[10px] truncate" style="color: rgba(255,255,255,0.30);">Administrator</p>
                    </div>
                </transition>
                <transition name="fade">
                    <span v-if="!isCollapsed || isHovered"
                          class="w-1.5 h-1.5 rounded-full shrink-0"
                          style="background: #22c55e;"></span>
                </transition>
            </div>
        </div>
    </aside>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
