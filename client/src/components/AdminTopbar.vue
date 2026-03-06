<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import apiClient from '@/api/axios'

const props = defineProps({ isCollapsed: { type: Boolean, required: true } })
const emit  = defineEmits(['update:isCollapsed'])

const authStore = useAuthStore()
const route     = useRoute()
const toast     = inject('$toast')

const isDark           = ref(false)
const showNotif        = ref(false)
const showDropdown     = ref(false)
const showSettings     = ref(false)
const settingsTab      = ref('photo')   // 'photo' | 'password'
const uploading        = ref(false)
const isSaving         = ref(false)
const fileInput        = ref(null)
const showCurrentPw    = ref(false)
const showNewPw        = ref(false)
const showConfirmPw    = ref(false)

const notifications = ref([
    { id: 1, icon: 'pi-user-plus',  text: 'New applicant registered',  time: '2m ago',   read: false },
    { id: 2, icon: 'pi-briefcase',  text: 'Job vacancy published',      time: '1h ago',   read: false },
    { id: 3, icon: 'pi-check-circle', text: 'Evaluation completed',     time: '3h ago',   read: true  },
])
const unreadCount = ref(notifications.value.filter(n => !n.read).length)

const pw = reactive({ current: '', new: '', confirm: '' })

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
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'A')}&background=1d4ed8&color=fff&bold=true`
</script>

<template>
    <div>
        <!-- ── Topbar ───────────────────────────────────────── -->
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
                <div class="hidden sm:flex items-center gap-2 text-sm min-w-0" aria-label="Breadcrumb" role="navigation">
                    <span class="text-[var(--text-muted)] font-medium shrink-0">Admin</span>
                    <i class="pi pi-angle-right text-[10px] text-[var(--text-faint)] shrink-0" aria-hidden="true"></i>
                    <span class="font-semibold text-[var(--text-main)] truncate capitalize">{{ route.name || 'Dashboard' }}</span>
                </div>
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
                                    aria-label="Mark all notifications as read">Mark all read</button>
                            </div>
                            <ul role="list" class="max-h-72 overflow-y-auto custom-scrollbar">
                                <li v-for="n in notifications" :key="n.id"
                                    class="flex items-start gap-3 px-4 py-3 border-b border-[var(--border-main)] last:border-0 hover:bg-[var(--surface-2)] transition-colors"
                                    :class="!n.read ? 'bg-[var(--color-primary-light)]/30' : ''">
                                    <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                        :class="!n.read ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'">
                                        <i :class="['pi text-xs', n.icon]" aria-hidden="true"></i>
                                    </div>
                                    <div class="min-w-0">
                                        <p class="text-sm text-[var(--text-main)]" :class="!n.read ? 'font-semibold' : ''">{{ n.text }}</p>
                                        <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ n.time }}</p>
                                    </div>
                                    <span v-if="!n.read"
                                        class="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 mt-2"
                                        aria-label="Unread"></span>
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
                        :aria-expanded="showDropdown"
                        aria-haspopup="menu"
                        aria-label="User menu">
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
                                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
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

        <!-- ── Settings Modal ───────────────────────────────── -->
        <Teleport to="body">
            <div v-if="showSettings"
                class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
                role="dialog" aria-modal="true" aria-labelledby="settings-title"
                @click.self="showSettings = false">

                <div class="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-main)] overflow-hidden animate-zoom-in">
                    <!-- Header -->
                    <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
                        <h2 id="settings-title" class="text-base font-bold text-[var(--text-main)]">Account Settings</h2>
                        <button @click="showSettings = false"
                            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors"
                            aria-label="Close settings">
                            <i class="pi pi-times text-sm" aria-hidden="true"></i>
                        </button>
                    </div>

                    <!-- Tabs -->
                    <div class="flex border-b border-[var(--border-main)]" role="tablist">
                        <button v-for="tab in [{ id:'photo', icon:'pi-user', label:'Profile Photo' }, { id:'password', icon:'pi-lock', label:'Password' }]"
                            :key="tab.id" @click="settingsTab = tab.id"
                            :role="'tab'" :aria-selected="settingsTab === tab.id ? 'true' : 'false'"
                            :class="['flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border-b-2',
                                settingsTab === tab.id
                                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-light)]/30'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-2)]']">
                            <i :class="['pi text-[11px]', tab.icon]" aria-hidden="true"></i>{{ tab.label }}
                        </button>
                    </div>

                    <!-- Photo Tab -->
                    <div v-if="settingsTab === 'photo'" class="p-6 flex flex-col items-center gap-4" role="tabpanel">
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
                        <button @click="triggerFile" :disabled="uploading"
                            class="btn-primary h-9 px-5 text-sm disabled:opacity-50">
                            <i :class="['pi text-xs', uploading ? 'pi-spin pi-spinner' : 'pi-upload']" aria-hidden="true"></i>
                            {{ uploading ? 'Uploading...' : 'Upload Photo' }}
                        </button>
                        <p class="text-xs text-[var(--text-muted)]">JPG, PNG, GIF &bull; Max 10 MB</p>
                    </div>

                    <!-- Password Tab -->
                    <div v-if="settingsTab === 'password'" class="p-6 flex flex-col gap-4" role="tabpanel">
                        <div v-if="authStore.user?.googleId"
                            class="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400"
                            role="alert">
                            <i class="pi pi-info-circle mt-0.5 shrink-0 text-sm" aria-hidden="true"></i>
                            <p class="text-sm">Google account — manage password via Google settings.</p>
                        </div>
                        <template v-else>
                            <div v-for="field in [
                                { model: 'current', show: 'showCurrentPw', label: 'Current Password' },
                                { model: 'new',     show: 'showNewPw',     label: 'New Password'     },
                                { model: 'confirm', show: 'showConfirmPw', label: 'Confirm Password'  },
                            ]" :key="field.model" class="flex flex-col gap-1.5">
                                <label :for="`pw-${field.model}`" class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                    {{ field.label }}
                                </label>
                                <div class="relative">
                                    <input :id="`pw-${field.model}`" v-model="pw[field.model]"
                                        :type="$data[field.show] ? 'text' : 'password'"
                                        :placeholder="field.model === 'new' ? 'Min. 8 characters' : '••••••••'"
                                        class="input pr-10"
                                        :autocomplete="field.model === 'current' ? 'current-password' : 'new-password'" />
                                    <button type="button" @click="$data[field.show] = !$data[field.show]"
                                        class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                        :aria-label="$data[field.show] ? `Hide ${field.label}` : `Show ${field.label}`">
                                        <i :class="['pi text-sm', $data[field.show] ? 'pi-eye-slash' : 'pi-eye']" aria-hidden="true"></i>
                                    </button>
                                </div>
                            </div>
                        </template>
                    </div>

                    <!-- Footer -->
                    <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--surface-2)] flex justify-end gap-3">
                        <button @click="showSettings = false" class="btn-secondary h-9 px-4 text-sm">Cancel</button>
                        <button v-if="settingsTab === 'password' && !authStore.user?.googleId"
                            @click="handlePwUpdate" :disabled="isSaving"
                            class="btn-primary h-9 px-5 text-sm disabled:opacity-50">
                            <i v-if="isSaving" class="pi pi-spin pi-spinner text-xs" aria-hidden="true"></i>
                            {{ isSaving ? 'Saving...' : 'Save Changes' }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
.dropdown-enter-active { transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1); }
.dropdown-leave-active { transition: all 0.12s ease; }
.dropdown-enter-from   { opacity: 0; transform: translateY(-6px) scale(0.97); }
.dropdown-leave-to     { opacity: 0; transform: translateY(-4px); }
</style>
