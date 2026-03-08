<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { statusConfig } from '@/utils/statusColors'
import { useNotificationStore } from '@/stores/notifications'
import apiClient from '@/api/axios'

const router    = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const applications  = ref([])
const loadingApps   = ref(false)
const profile       = ref(null)
const loadingProfile = ref(false)

const totalApps   = computed(() => applications.value.length)
const pendingApps = computed(() => applications.value.filter(a => a.status === 'applied').length)
const activeApps  = computed(() => applications.value.filter(a => ['verifying', 'comparative_assessment'].includes(a.status)).length)
const recentApps  = computed(() => [...applications.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5))

const profileComplete = computed(() => {
    if (!profile.value) return 0
    const p = profile.value
    const checks = [
        !!(p.name?.firstName && p.name?.lastName),
        (p.education?.length || 0) > 0,
        (p.eligibility?.length || 0) > 0,
        (p.experience?.length || 0) > 0,
        (p.training?.length || 0) > 0,
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
})

const loadApplications = async () => {
    loadingApps.value = true
    try {
        const { data } = await apiClient.get('/v1/applications/my-applications')
        applications.value = data.data || []
    } catch (err) {
        console.error('Failed to load applications', err)
    } finally {
        loadingApps.value = false
    }
}

const loadProfile = async () => {
    loadingProfile.value = true
    try {
        const { data } = await apiClient.get('/v1/profile/me')
        profile.value = data.data || null
    } catch (err) {
        console.error('Failed to load profile', err)
    } finally {
        loadingProfile.value = false
    }
}

onMounted(() => {
    loadApplications()
    loadProfile()
    notificationStore.fetchNotifications()
})
onActivated(() => {
    loadApplications()
    loadProfile()
    notificationStore.fetchNotifications()
})


const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const memberSince = computed(() => {
    if (!authStore.user?.lastLogin) return '—'
    return new Date(authStore.user.lastLogin).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
})
</script>

<template>
    <div class="flex flex-col gap-8">

        <!-- ── Welcome Banner ─────────────────────────────────────────── -->
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div class="absolute -top-12 -right-12 w-48 h-48 bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-12 -left-12 w-48 h-48 bg-[var(--text-muted)]/5 rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div class="flex items-center gap-5">
                    <div class="relative flex-shrink-0">
                        <img :src="authStore.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'U')}&background=E2E8F0&color=334155&bold=true`"
                            class="w-16 h-16 rounded-full object-cover border-2 border-[var(--border-main)] shadow-sm" />
                        <span class="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 border-2 border-[var(--surface)] rounded-full"></span>
                    </div>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Welcome back</p>
                        <h1 class="text-xl font-bold text-[var(--text-main)] tracking-tight capitalize">
                            {{ authStore.user?.username || 'Applicant' }}
                        </h1>
                        <div class="flex flex-wrap items-center gap-2 mt-2">
                            <span class="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-green-50 text-green-700 border-green-200">
                                <i class="pi pi-shield text-[10px]"></i> Verified
                            </span>
                            <span class="text-xs text-[var(--text-muted)] border border-[var(--border-main)] px-2.5 py-1 rounded-full bg-[var(--bg-app)]">
                                {{ authStore.user?.email }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="flex gap-3">
                    <router-link to="/user/vacancies"
                        class="h-10 px-5 rounded-lg bg-[var(--text-main)] text-[var(--surface)] text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                        <i class="pi pi-briefcase text-xs"></i> Browse Jobs
                    </router-link>
                    <router-link to="/user/applications"
                        class="h-10 px-5 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-[var(--text-main)] text-sm font-semibold hover:bg-[var(--surface)] transition-colors flex items-center gap-2">
                        <i class="pi pi-folder-open text-xs"></i> Applications
                    </router-link>
                </div>
            </div>
        </div>

        <!-- ── Stats ───────────────────────────────────────────────────── -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex flex-col gap-3">
                <div class="w-10 h-10 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center">
                    <i class="pi pi-file-edit text-[var(--text-muted)]"></i>
                </div>
                <div>
                    <p class="text-2xl font-bold text-[var(--text-main)]">{{ loadingApps ? '—' : totalApps }}</p>
                    <p class="text-xs font-medium text-[var(--text-muted)] mt-0.5">Total Applications</p>
                </div>
            </div>

            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex flex-col gap-3">
                <div class="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <i class="pi pi-clock text-amber-600"></i>
                </div>
                <div>
                    <p class="text-2xl font-bold text-[var(--text-main)]">{{ loadingApps ? '—' : pendingApps }}</p>
                    <p class="text-xs font-medium text-[var(--text-muted)] mt-0.5">Awaiting Review</p>
                </div>
            </div>

            <div class="col-span-2 sm:col-span-1 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex flex-col gap-3">
                <div class="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] border border-[var(--border-main)] flex items-center justify-center">
                    <i class="pi pi-search text-[var(--color-primary)]"></i>
                </div>
                <div>
                    <p class="text-2xl font-bold text-[var(--text-main)]">{{ loadingApps ? '—' : activeApps }}</p>
                    <p class="text-xs font-medium text-[var(--text-muted)] mt-0.5">Verifying / For Assessment</p>
                </div>
            </div>
        </div>

        <!-- ── Recent Applications ────────────────────────────────────── -->
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden">
            <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
                <h2 class="text-sm font-bold text-[var(--text-main)]">Recent Applications</h2>
                <router-link to="/user/applications" class="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors flex items-center gap-1">
                    View all <i class="pi pi-arrow-right text-[10px]"></i>
                </router-link>
            </div>

            <div v-if="loadingApps" class="p-6 flex flex-col gap-3">
                <div v-for="i in 3" :key="i" class="h-14 rounded-lg bg-[var(--bg-app)] animate-pulse"></div>
            </div>

            <div v-else-if="recentApps.length === 0" class="py-14 flex flex-col items-center gap-3 text-[var(--text-muted)]">
                <i class="pi pi-folder-open text-3xl text-[var(--text-faint)]"></i>
                <p class="text-sm font-medium">No applications yet</p>
                <router-link to="/user/vacancies"
                    class="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                    Browse open vacancies <i class="pi pi-arrow-right text-[10px]"></i>
                </router-link>
            </div>

            <div v-else class="divide-y divide-[var(--border-main)]">
                <div v-for="app in recentApps" :key="app._id" class="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[var(--bg-app)] transition-colors">
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-[var(--text-main)] truncate">
                            {{ app.job?.positionTitle || 'Position' }}
                        </p>
                        <p class="text-xs text-[var(--text-muted)] mt-0.5">Applied {{ formatDate(app.createdAt) }}</p>
                    </div>
                    <span :class="['text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0', statusConfig[app.status]?.class || 'bg-[var(--bg-app)] text-[var(--text-sub)] border-[var(--border-main)]']">
                        {{ statusConfig[app.status]?.label || app.status }}
                    </span>
                </div>
            </div>
        </div>

        <!-- ── Notifications & Tasks ───────────────────────────────────── -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Notifications -->
            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl overflow-hidden flex flex-col">
                <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-app)]">
                    <h2 class="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                        <i class="pi pi-bell text-[var(--color-primary)] text-xs"></i> Recent Notifications
                    </h2>
                    <router-link to="/user/notifications" class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)] hover:text-[var(--color-primary)] transition-colors">
                        View all
                    </router-link>
                </div>
                <div class="flex-1 overflow-y-auto max-h-[320px] custom-scrollbar">
                    <div v-if="notificationStore.loading && !notificationStore.notifications.length" class="p-8 text-center">
                        <i class="pi pi-spin pi-spinner text-[var(--text-faint)]"></i>
                    </div>
                    <div v-else-if="!notificationStore.notifications.length" class="py-16 flex flex-col items-center gap-3 text-[var(--text-faint)]">
                        <i class="pi pi-inbox text-3xl"></i>
                        <p class="text-xs font-bold uppercase tracking-widest">No notifications</p>
                    </div>
                    <div v-else class="divide-y divide-[var(--border-main)]">
                        <div v-for="n in notificationStore.notifications.slice(0, 5)" :key="n._id"
                            class="px-6 py-4 flex items-start gap-4 hover:bg-[var(--bg-app)] transition-colors group cursor-pointer"
                            @click="notificationStore.markAsRead(n._id)">
                            <div :class="['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border', n.status === 'unread' ? 'bg-[var(--color-primary-light)] border-[var(--border-main)] text-[var(--color-primary)]' : 'bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-faint)]']">
                                <i :class="['pi text-[10px]', n.type === 'status_update' ? 'pi-info-circle' : 'pi-bell']"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex justify-between items-start mb-0.5">
                                    <p :class="['text-xs truncate transition-all', n.status === 'unread' ? 'font-black text-[var(--text-main)]' : 'font-semibold text-[var(--text-muted)]']">{{ n.title }}</p>
                                    <span class="text-[9px] font-bold text-[var(--text-faint)] uppercase whitespace-nowrap ml-2">{{ n.createdAt.split('T')[0] }}</span>
                                </div>
                                <p class="text-[11px] text-[var(--text-muted)] line-clamp-1 leading-relaxed">{{ n.message }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Profile Checklist -->
            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-6 flex flex-col gap-6">
                <h2 class="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                    <i class="pi pi-list-check text-green-600 text-xs"></i> Profile Readiness
                </h2>
                <div class="space-y-3">
                    <div v-for="step in [
                        { label: 'Basic Information', done: profile?.name?.firstName },
                        { label: 'Educational History', done: profile?.education?.length },
                        { label: 'Eligibility / Licenses', done: profile?.eligibility?.length },
                        { label: 'Service Records (Experience)', done: profile?.experience?.length },
                        { label: 'Training Certificates', done: profile?.training?.length },
                    ]" :key="step.label" class="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)]">
                        <span class="text-xs font-semibold text-[var(--text-sub)]">{{ step.label }}</span>
                        <i :class="['pi text-xs', step.done ? 'pi-check-circle text-green-500' : 'pi-circle text-[var(--border-main)]']"></i>
                    </div>
                </div>
                <router-link to="/user/profile" class="mt-auto h-11 rounded-xl bg-[var(--text-main)] text-[var(--surface)] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg">
                    <i class="pi pi-user-edit"></i> Complete Profile
                </router-link>
            </div>
        </div>

        <!-- ── Quick Links ─────────────────────────────────────────────── -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <router-link to="/user/vacancies"
                class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex items-center gap-4 hover:border-[var(--color-primary-ring)] hover:shadow-sm transition-all group">
                <div class="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] border border-[var(--border-main)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <i class="pi pi-briefcase text-[var(--color-primary)]"></i>
                </div>
                <div>
                    <p class="text-sm font-bold text-[var(--text-main)]">Browse Vacancies</p>
                    <p class="text-xs text-[var(--text-muted)]">Explore open positions</p>
                </div>
                <i class="pi pi-arrow-right text-[var(--text-muted)] ml-auto text-sm"></i>
            </router-link>

            <router-link to="/user/applications"
                class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex items-center gap-4 hover:border-green-300 hover:shadow-sm transition-all group">
                <div class="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <i class="pi pi-folder-open text-green-600"></i>
                </div>
                <div>
                    <p class="text-sm font-bold text-[var(--text-main)]">My Applications</p>
                    <p class="text-xs text-[var(--text-muted)]">Track your submissions</p>
                </div>
                <i class="pi pi-arrow-right text-[var(--text-muted)] ml-auto text-sm"></i>
            </router-link>
        </div>

        <!-- ── Application Profile ────────────────────────────────────── -->
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl overflow-hidden">
            <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
                <h2 class="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                    <i class="pi pi-id-card text-[var(--text-muted)] text-xs"></i> My Application Profile
                </h2>
                <router-link to="/user/profile"
                    class="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                    <i class="pi pi-pencil text-[10px]"></i> Edit Profile
                </router-link>
            </div>

            <!-- Loading -->
            <div v-if="loadingProfile" class="p-6 flex flex-col gap-3">
                <div class="h-4 w-48 rounded bg-[var(--bg-app)] animate-pulse"></div>
                <div class="h-3 w-full rounded bg-[var(--bg-app)] animate-pulse"></div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-[var(--bg-app)] animate-pulse"></div>
                </div>
            </div>

            <!-- No Profile Yet -->
            <div v-else-if="!profile" class="p-8 flex flex-col items-center gap-4 text-center">
                <div class="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <i class="pi pi-exclamation-triangle text-amber-500 text-xl"></i>
                </div>
                <div>
                    <p class="text-sm font-semibold text-[var(--text-main)]">Profile not set up yet</p>
                    <p class="text-xs text-[var(--text-muted)] mt-1">Complete your application profile before applying to any vacancy.</p>
                </div>
                <router-link to="/user/profile" class="btn-primary h-9 px-5 text-sm flex items-center gap-2">
                    <i class="pi pi-user-edit text-xs"></i> Complete My Profile
                </router-link>
            </div>

            <!-- Profile Summary -->
            <div v-else class="p-6 flex flex-col gap-5">
                <!-- Name & contact -->
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-full bg-[var(--color-primary-light)] border border-[var(--border-main)] flex items-center justify-center flex-shrink-0">
                        <i class="pi pi-user text-[var(--color-primary)]"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm font-bold text-[var(--text-main)] capitalize">
                            {{ [profile.name?.firstName, profile.name?.middleName, profile.name?.lastName].filter(Boolean).join(' ') || 'Name not set' }}
                        </p>
                        <p class="text-xs text-[var(--text-muted)] mt-0.5">
                            {{ profile.contact?.phone || profile.contact?.email || 'No contact info' }}
                        </p>
                        <p v-if="profile.address?.barangay" class="text-xs text-[var(--text-muted)]">
                            {{ [profile.address.barangay, profile.address.municipality, profile.address.province].filter(Boolean).join(', ') }}
                        </p>
                    </div>
                </div>

                <!-- Completeness bar -->
                <div class="flex flex-col gap-1.5">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-[var(--text-muted)]">Profile Completeness</span>
                        <span :class="['text-xs font-bold', profileComplete >= 80 ? 'text-green-600' : profileComplete >= 50 ? 'text-amber-600' : 'text-red-500']">
                            {{ profileComplete }}%
                        </span>
                    </div>
                    <div class="h-2 rounded-full bg-[var(--bg-app)] overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500"
                            :class="profileComplete >= 80 ? 'bg-green-500' : profileComplete >= 50 ? 'bg-amber-400' : 'bg-red-400'"
                            :style="{ width: profileComplete + '%' }">
                        </div>
                    </div>
                </div>

                <!-- Counts grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div v-for="item in [
                        { label: 'Education',    count: profile.education?.length   || 0, icon: 'pi-graduation-cap', color: 'bg-[var(--color-primary-light)] border-[var(--border-main)] text-[var(--color-primary)]' },
                        { label: 'Eligibility',  count: profile.eligibility?.length || 0, icon: 'pi-verified',       color: 'bg-purple-50 border-purple-200 text-purple-600' },
                        { label: 'Trainings',    count: profile.training?.length    || 0, icon: 'pi-book',           color: 'bg-amber-50 border-amber-200 text-amber-600' },
                        { label: 'Experience',   count: profile.experience?.length  || 0, icon: 'pi-briefcase',      color: 'bg-green-50 border-green-200 text-green-600' },
                    ]" :key="item.label"
                        class="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border bg-[var(--bg-app)]">
                        <div :class="['w-8 h-8 rounded-lg border flex items-center justify-center', item.color]">
                            <i :class="['pi text-sm', item.icon]"></i>
                        </div>
                        <p class="text-lg font-bold text-[var(--text-main)] leading-none">{{ item.count }}</p>
                        <p class="text-[10px] font-medium text-[var(--text-muted)]">{{ item.label }}</p>
                    </div>
                </div>

                <!-- Incomplete nudge -->
                <div v-if="profileComplete < 100"
                    class="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                    <i class="pi pi-info-circle flex-shrink-0"></i>
                    <p class="text-xs">Your profile is incomplete. A complete profile improves your application.</p>
                    <router-link to="/user/profile" class="ml-auto text-xs font-bold underline whitespace-nowrap">Update now</router-link>
                </div>
            </div>
        </div>

    </div>
</template>
