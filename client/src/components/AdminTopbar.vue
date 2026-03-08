<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import apiClient from '@/api/axios'
import { AppModal, AppTabs, AppButton, AppInput } from '@/components/ui'

const props = defineProps({ isCollapsed: { type: Boolean, required: true } })
const emit  = defineEmits(['update:isCollapsed'])

const authStore = useAuthStore()
const route     = useRoute()
const toast     = inject('$toast')

const isDark       = ref(false)
const showNotif    = ref(false)
const showDropdown = ref(false)
const showSettings = ref(false)
const settingsTab  = ref('photo')
const uploading    = ref(false)
const isSaving     = ref(false)
const fileInput    = ref(null)

const notifications = ref([
    { id: 1, icon: 'pi-user-plus',    text: 'New applicant registered', time: '2m ago', read: false },
    { id: 2, icon: 'pi-briefcase',    text: 'Job vacancy published',     time: '1h ago', read: false },
    { id: 3, icon: 'pi-check-circle', text: 'Evaluation completed',      time: '3h ago', read: true  },
])
const unreadCount = ref(notifications.value.filter(n => !n.read).length)

const pw = reactive({ current: '', new: '', confirm: '' })

const settingsTabs = [
    { key: 'photo',    label: 'Profile Photo', icon: 'pi-user' },
    { key: 'password', label: 'Password',       icon: 'pi-lock' },
]

onMounted(() => {
    isDark.value = localStorage.getItem('theme') === 'dark'
        || document.documentElement.classList.contains('dark')
})

const toggleTheme = () => {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const markAllRead = () => {
    notifications.value.forEach(n => n.read = true)
    unreadCount.value = 0
}

const triggerFile = () => fileInput.value?.click()

const onFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
        toast.fire({ icon: 'error', title: 'File too large', text: 'Max 10 MB.' })
        return
    }
    const fd = new FormData()
    fd.append('avatar', file, file.name)
    uploading.value = true
    try {
        const { data } = await apiClient.patch('/auth/update-avatar', fd)
        authStore.user = { ...data.user, avatarUrl: `${data.user.avatarUrl}?t=${Date.now()}` }
        toast.fire({ icon: 'success', title: 'Photo updated' })
        showSettings.value = false
    } catch {
        toast.fire({ icon: 'error', title: 'Upload failed' })
    } finally {
        uploading.value = false
        if (fileInput.value) fileInput.value.value = ''
    }
}

const handlePwUpdate = async () => {
    if (pw.new !== pw.confirm) {
        toast.fire({ icon: 'warning', title: 'Passwords do not match' })
        return
    }
    if (pw.new.length < 8) {
        toast.fire({ icon: 'warning', title: 'Min. 8 characters' })
        return
    }
    isSaving.value = true
    try {
        await apiClient.patch('/auth/update-password', { currentPassword: pw.current, newPassword: pw.new })
        toast.fire({ icon: 'success', title: 'Password updated' })
        showSettings.value = false
        Object.assign(pw, { current: '', new: '', confirm: '' })
    } catch (err) {
        toast.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.message || 'Error.' })
    } finally { isSaving.value = false }
}

const avatarSrc = () => authStore.user?.avatarUrl
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'A')}&background=4A4D8F&color=fff&bold=true`
</script>

<template>
    <div>
        <!-- ── Topbar ─────────────────────────────────────────────── -->
        <header class="h-16 bg-[var(--surface)] border-b border-[var(--border-main)] flex items-center justify-between px-4 sm:px-6 z-20 shrink-0 gap-4"
            role="banner">

            <!-- Left: toggle + breadcrumb -->
            <div class="flex items-center gap-3 min-w-0">
                <button @click="emit('update:isCollapsed', !isCollapsed)"
                    class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors shrink-0"
                    :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
                    :aria-expanded="!isCollapsed">
                    <i class="pi pi-bars text-sm" aria-hidden="true"></i>
                </button>
                <nav class="hidden sm:flex items-center gap-2 text-sm min-w-0" aria-label="Breadcrumb">
                    <span class="text-[var(--text-muted)] font-medium shrink-0">Admin</span>
                    <i class="pi pi-angle-right text-[10px] text-[var(--text-faint)] shrink-0" aria-hidden="true"></i>
                    <span class="font-semibold text-[var(--text-main)] truncate capitalize">{{ route.name || 'Dashboard' }}</span>
                </nav>
            </div>

            <!-- Right: actions -->
            <div class="flex items-center gap-1 shrink-0">

                <!-- Theme toggle -->
                <button @click="toggleTheme"
                    class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors"
                    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
                    :aria-pressed="isDark">
                    <i :class="['pi text-sm', isDark ? 'pi-sun' : 'pi-moon']" aria-hidden="true"></i>
                </button>

                <!-- Notifications -->
                <div class="relative">
                    <button @click="showNotif = !showNotif; showDropdown = false"
                        class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors relative"
                        :aria-label="`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`"
                        :aria-expanded="showNotif">
                        <i class="pi pi-bell text-sm" aria-hidden="true"></i>
                        <span v-if="unreadCount > 0"
                            class="absolute top-1.5 right-1.5 w-4 h-4 bg-[var(--color-primary)] text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                            aria-hidden="true">{{ unreadCount }}</span>
                    </button>
                    <Transition name="dropdown">
                        <div v-if="showNotif"
                            v-click-outside="() => showNotif = false"
                            class="absolute right-0 mt-2 w-80 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-xl z-50 overflow-hidden"
                            role="dialog" aria-label="Notifications">
                            <div class="px-4 py-3 border-b border-[var(--border-main)] flex items-center justify-between">
                                <p class="text-sm font-bold text-[var(--text-main)]">Notifications</p>
                                <button @click="markAllRead"
                                    class="text-xs text-[var(--color-primary)] hover:underline font-medium"
                                    aria-label="Mark all as read">Mark all read</button>
                            </div>
                            <ul role="list" class="max-h-72 overflow-y-auto custom-scrollbar">
                                <li v-for="n in notifications" :key="n.id"
                                    :class="['flex items-start gap-3 px-4 py-3 border-b border-[var(--border-main)] last:border-0 transition-colors',
                                        !n.read ? 'bg-[var(--color-primary-light)]/30 hover:bg-[var(--color-primary-light)]/50' : 'hover:bg-[var(--surface-2)]']">
                                    <div :class="['w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                                        !n.read ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : 'bg-[var(--surface-2)] text-[var(--text-muted)]']">
                                        <i :class="['pi text-xs', n.icon]" aria-hidden="true"></i>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <p :class="['text-sm text-[var(--text-main)]', !n.read ? 'font-semibold' : '']">{{ n.text }}</p>
                                        <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ n.time }}</p>
                                    </div>
                                    <span v-if="!n.read" class="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 mt-2" aria-label="Unread"></span>
                                </li>
                            </ul>
                        </div>
                    </Transition>
                </div>

                <div class="w-px h-5 bg-[var(--border-main)] mx-1" role="separator" aria-hidden="true"></div>

                <!-- User menu -->
                <div class="relative">
                    <button @click="showDropdown = !showDropdown; showNotif = false"
                        class="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                        :aria-expanded="showDropdown" aria-haspopup="menu" aria-label="User menu">
                        <img :src="avatarSrc()" :alt="authStore.user?.username"
                            class="w-8 h-8 rounded-full object-cover border-2 border-[var(--color-primary-light)]" />
                        <div class="hidden md:flex flex-col items-start leading-tight">
                            <span class="text-xs font-bold text-[var(--text-main)] capitalize max-w-[100px] truncate">{{ authStore.user?.username }}</span>
                            <span class="text-[10px] text-[var(--text-muted)] capitalize">Administrator</span>
                        </div>
                        <i class="pi pi-chevron-down text-[9px] text-[var(--text-faint)] hidden md:block" aria-hidden="true"></i>
                    </button>
                    <Transition name="dropdown">
                        <div v-if="showDropdown"
                            v-click-outside="() => showDropdown = false"
                            class="absolute right-0 mt-2 w-56 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-xl z-50 overflow-hidden"
                            role="menu">
                            <div class="px-4 py-3 border-b border-[var(--border-main)] bg-[var(--surface-2)]">
                                <p class="text-sm font-bold text-[var(--text-main)] capitalize truncate">{{ authStore.user?.username }}</p>
                                <p class="text-xs text-[var(--text-muted)] truncate mt-0.5">{{ authStore.user?.email }}</p>
                            </div>
                            <div class="p-1.5 flex flex-col gap-0.5" role="none">
                                <button @click="showSettings = true; settingsTab = 'photo'; showDropdown = false"
                                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--surface-2)] transition-colors text-left"
                                    role="menuitem">
                                    <i class="pi pi-user text-[var(--text-muted)] text-sm" aria-hidden="true"></i>
                                    Account Settings
                                </button>
                                <button @click="showSettings = true; settingsTab = 'password'; showDropdown = false"
                                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--surface-2)] transition-colors text-left"
                                    role="menuitem">
                                    <i class="pi pi-lock text-[var(--text-muted)] text-sm" aria-hidden="true"></i>
                                    Change Password
                                </button>
                                <div class="h-px bg-[var(--border-main)] my-1" role="separator"></div>
                                <button @click="authStore.logout()"
                                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                                    role="menuitem">
                                    <i class="pi pi-sign-out text-sm" aria-hidden="true"></i>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </Transition>
                </div>
            </div>
        </header>

        <!-- ── Settings Modal ─────────────────────────────────────── -->
        <AppModal v-model="showSettings" title="Account Settings" size="sm">

            <!-- Tabs strip — flush against modal body top -->
            <div class="-mx-6 -mt-5 mb-5 border-b border-[var(--border-main)] px-6">
                <AppTabs v-model="settingsTab" :tabs="settingsTabs" variant="underline" size="sm" />
            </div>

            <!-- Photo Tab -->
            <div v-if="settingsTab === 'photo'" class="flex flex-col items-center gap-4">
                <div class="relative group cursor-pointer" @click="triggerFile" tabindex="0"
                    @keydown.enter="triggerFile" @keydown.space.prevent="triggerFile"
                    role="button" aria-label="Change profile photo">
                    <img :src="avatarSrc()" :alt="authStore.user?.username"
                        class="w-24 h-24 rounded-full object-cover border-4 border-[var(--color-primary-light)]" />
                    <div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
                        <i :class="['pi text-white text-xl', uploading ? 'pi-spin pi-spinner' : 'pi-camera']"></i>
                    </div>
                </div>
                <input ref="fileInput" type="file" class="sr-only" accept="image/*" @change="onFileSelect" aria-label="Upload photo" />
                <AppButton :loading="uploading" icon="pi-upload" @click="triggerFile">
                    {{ uploading ? 'Uploading...' : 'Upload Photo' }}
                </AppButton>
                <p class="text-xs text-[var(--text-muted)]">JPG, PNG, GIF &bull; Max 10 MB</p>
            </div>

            <!-- Password Tab -->
            <div v-if="settingsTab === 'password'" class="flex flex-col gap-4">
                <div v-if="authStore.user?.googleId"
                    class="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-primary-light)] border border-[var(--border-main)] text-[var(--color-primary)]"
                    role="alert">
                    <i class="pi pi-info-circle mt-0.5 shrink-0 text-sm" aria-hidden="true"></i>
                    <p class="text-sm">Google account — manage password via Google settings.</p>
                </div>
                <template v-else>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Current Password</label>
                        <AppInput v-model="pw.current" toggleable placeholder="••••••••" autocomplete="current-password" />
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">New Password</label>
                        <AppInput v-model="pw.new" toggleable placeholder="Min. 8 characters" autocomplete="new-password" />
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Confirm Password</label>
                        <AppInput v-model="pw.confirm" toggleable placeholder="••••••••" autocomplete="new-password" />
                    </div>
                </template>
            </div>

            <template #footer>
                <AppButton variant="secondary" @click="showSettings = false">Cancel</AppButton>
                <AppButton v-if="settingsTab === 'password' && !authStore.user?.googleId"
                    :loading="isSaving" @click="handlePwUpdate">
                    {{ isSaving ? 'Saving...' : 'Save Changes' }}
                </AppButton>
            </template>
        </AppModal>
    </div>
</template>
