<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import apiClient from '@/api/axios'
import SaaSSidebar from '@/components/layout/SaaSSidebar.vue'
import AppToaster from '@/components/ui/AppToaster.vue'
import NotificationCenter from '@/components/NotificationCenter.vue'

const authStore     = useAuthStore()
const settingsStore = useSettingsStore()

const isCollapsed = ref(false)
const isHovered   = ref(false)

// ── Account settings ──────────────────────────────────────────
const showDropdown  = ref(false)
const showSettings  = ref(false)
const settingsTab   = ref('photo')
const uploading     = ref(false)
const isSaving      = ref(false)
const fileInput     = ref(null)
const showCurrPw    = ref(false)
const showNewPw     = ref(false)
const showConfirmPw = ref(false)
const pw = reactive({ current: '', new: '', confirm: '' })

const avatarSrc = computed(() =>
    authStore.user?.avatarUrl
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'A')}&background=4A4D8F&color=fff&bold=true`
)

const triggerFile = () => fileInput.value?.click()

const onFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('File too large. Max 10 MB.'); return }
    const fd = new FormData()
    fd.append('avatar', file, file.name)
    uploading.value = true
    try {
        const { data } = await apiClient.patch('/auth/update-avatar', fd)
        authStore.user = { ...data.user, avatarUrl: `${data.user.avatarUrl}?t=${Date.now()}` }
        showSettings.value = false
    } catch { alert('Upload failed.') }
    finally {
        uploading.value = false
        if (fileInput.value) fileInput.value.value = ''
    }
}

const handlePwUpdate = async () => {
    if (pw.new !== pw.confirm) { alert('Passwords do not match.'); return }
    if (pw.new.length < 8)     { alert('Min. 8 characters.'); return }
    isSaving.value = true
    try {
        await apiClient.patch('/auth/update-password', { currentPassword: pw.current, newPassword: pw.new })
        showSettings.value = false
        Object.assign(pw, { current: '', new: '', confirm: '' })
    } catch (err) {
        alert(err.response?.data?.message || 'Update failed.')
    } finally { isSaving.value = false }
}

// Global Shortcut: Ctrl+K for Search
onMounted(() => {
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault()
            document.getElementById('global-search')?.focus()
        }
    })
})
</script>

<template>
    <div class="flex h-screen bg-[var(--bg-app)] text-[var(--text-main)] font-sans antialiased overflow-hidden">

        <!-- Fixed SaaS Sidebar -->
        <SaaSSidebar
            :is-collapsed="isCollapsed"
            :is-hovered="isHovered"
            @update:is-hovered="val => isHovered = val"
        />

        <!-- Main Workspace -->
        <div class="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
             :style="{ marginLeft: isCollapsed && !isHovered ? '5rem' : '16rem' }">

            <!-- Sticky Topbar -->
            <header class="h-14 border-b border-[var(--border-main)] bg-[var(--surface)]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
                <div class="flex items-center gap-4 flex-1">
                    <button @click="isCollapsed = !isCollapsed"
                        class="w-8 h-8 rounded-lg hover:bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-muted)] transition-colors">
                        <i :class="['pi text-[10px]', isCollapsed ? 'pi-align-left' : 'pi-align-right']"></i>
                    </button>

                    <div class="relative max-w-md w-full group hidden sm:block">
                        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors"></i>
                        <input id="global-search"
                            placeholder="Search applicants, jobs, or commands... (Ctrl+K)"
                            class="w-full h-9 pl-9 pr-20 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] focus:bg-[var(--surface)] transition-all outline-none" />
                        <div class="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                            <kbd class="h-5 px-1.5 rounded border border-[var(--border-main)] bg-[var(--surface)] text-[9px] font-black text-[var(--text-muted)] shadow-sm">Ctrl</kbd>
                            <kbd class="h-5 px-1.5 rounded border border-[var(--border-main)] bg-[var(--surface)] text-[9px] font-black text-[var(--text-muted)] shadow-sm">K</kbd>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <!-- Notifications -->
                    <NotificationCenter />

                    <div class="h-6 w-px bg-[var(--border-main)] mx-1"></div>

                    <!-- User Dropdown -->
                    <div class="relative">
                        <button @click="showDropdown = !showDropdown"
                            class="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[var(--bg-app)] border border-transparent hover:border-[var(--border-main)] transition-all"
                            :aria-expanded="showDropdown" aria-haspopup="menu">
                            <img :src="avatarSrc" :alt="authStore.user?.username"
                                class="w-8 h-8 rounded-full object-cover border-2 border-[var(--color-primary-light)]" />
                            <div class="hidden lg:flex flex-col items-start leading-none">
                                <p class="text-[11px] font-bold text-[var(--text-main)] tracking-tight capitalize">{{ authStore.user?.username || 'Admin' }}</p>
                                <p class="text-[9px] text-[var(--text-muted)] font-medium uppercase mt-0.5">Admin Console</p>
                            </div>
                            <i class="pi pi-chevron-down text-[9px] text-[var(--text-faint)] hidden lg:block"></i>
                        </button>

                        <Transition name="dropdown">
                            <div v-if="showDropdown"
                                v-click-outside="() => showDropdown = false"
                                class="absolute right-0 mt-2 w-52 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-xl z-50 overflow-hidden"
                                role="menu">
                                <div class="px-4 py-3 border-b border-[var(--border-main)] bg-[var(--color-primary-light)]/30">
                                    <p class="text-sm font-bold text-[var(--text-main)] capitalize truncate">{{ authStore.user?.username }}</p>
                                    <p class="text-xs text-[var(--text-muted)] truncate mt-0.5">{{ authStore.user?.email }}</p>
                                </div>
                                <div class="p-1.5 flex flex-col gap-0.5" role="none">
                                    <button @click="showSettings = true; settingsTab = 'photo'; showDropdown = false"
                                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors text-left"
                                        role="menuitem">
                                        <i class="pi pi-user text-[var(--text-muted)] text-sm"></i> Profile Settings
                                    </button>
                                    <button @click="showSettings = true; settingsTab = 'password'; showDropdown = false"
                                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors text-left"
                                        role="menuitem">
                                        <i class="pi pi-lock text-[var(--text-muted)] text-sm"></i> Change Password
                                    </button>
                                    <div class="h-px bg-[var(--border-main)] my-1"></div>
                                    <button @click="authStore.logout()"
                                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                                        role="menuitem">
                                        <i class="pi pi-sign-out text-sm"></i> Logout
                                    </button>
                                </div>
                            </div>
                        </Transition>
                    </div>
                </div>
            </header>

            <!-- Scrollable Content Area -->
            <main class="flex-1 overflow-y-auto bg-[var(--bg-app)] custom-scrollbar">
                <div class="p-6 lg:p-8 max-w-[90rem] mx-auto">
                    <router-view v-slot="{ Component, route }">
                        <transition name="page-fade" mode="out-in">
                            <component :is="Component" :key="route.path" />
                        </transition>
                    </router-view>
                </div>
            </main>
        </div>

        <AppToaster position="bottom-right" />

        <!-- ── Account Settings Modal ──────────────────────────────────── -->
        <Teleport to="body">
        <div v-if="showSettings"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            role="dialog" aria-modal="true" aria-labelledby="admin-settings-title"
            @click.self="showSettings = false">
            <div class="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-main)] overflow-hidden animate-zoom-in">

                <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
                    <h2 id="admin-settings-title" class="text-base font-bold text-[var(--text-main)]">Account Settings</h2>
                    <button @click="showSettings = false"
                        class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-app)] text-[var(--text-muted)]"
                        aria-label="Close settings">
                        <i class="pi pi-times text-sm"></i>
                    </button>
                </div>

                <div class="flex border-b border-[var(--border-main)]" role="tablist">
                    <button v-for="tab in [{id:'photo',icon:'pi-user',label:'Profile Photo'},{id:'password',icon:'pi-lock',label:'Password'}]"
                        :key="tab.id" @click="settingsTab = tab.id"
                        :aria-selected="settingsTab === tab.id" role="tab"
                        :class="['flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border-b-2',
                            settingsTab === tab.id
                                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-light)]/30'
                                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)]']">
                        <i :class="['pi text-[11px]', tab.icon]"></i>{{ tab.label }}
                    </button>
                </div>

                <div v-if="settingsTab === 'photo'" class="p-6 flex flex-col items-center gap-4" role="tabpanel">
                    <div class="relative group cursor-pointer" @click="triggerFile">
                        <img :src="avatarSrc" :alt="authStore.user?.username"
                            class="w-24 h-24 rounded-full object-cover border-4 border-[var(--color-primary-light)]" />
                        <div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <i :class="['pi text-white text-xl', uploading ? 'pi-spin pi-spinner' : 'pi-camera']"></i>
                        </div>
                    </div>
                    <input ref="fileInput" type="file" class="sr-only" accept="image/*" @change="onFileSelect" aria-label="Upload profile photo" />
                    <button @click="triggerFile" :disabled="uploading" class="btn-primary h-9 px-5 text-sm disabled:opacity-50 flex items-center gap-2">
                        <i :class="['pi text-xs', uploading ? 'pi-spin pi-spinner' : 'pi-upload']"></i>
                        {{ uploading ? 'Uploading...' : 'Upload Photo' }}
                    </button>
                    <p class="text-xs text-[var(--text-muted)]">JPG, PNG, GIF &bull; Max 10 MB</p>
                </div>

                <div v-if="settingsTab === 'password'" class="p-6 flex flex-col gap-4" role="tabpanel">
                    <div v-if="authStore.user?.googleId"
                        class="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-primary-light)] border border-[var(--border-main)] text-[var(--color-primary)]">
                        <i class="pi pi-info-circle mt-0.5 shrink-0 text-sm"></i>
                        <p class="text-sm">Google account — manage password through Google settings.</p>
                    </div>
                    <template v-else>
                        <div v-for="field in [
                            { key:'current', show: showCurrPw,    toggle: () => showCurrPw = !showCurrPw,       label:'Current Password', ac:'current-password' },
                            { key:'new',     show: showNewPw,     toggle: () => showNewPw = !showNewPw,         label:'New Password',     ac:'new-password', hint:'Min. 8 characters' },
                            { key:'confirm', show: showConfirmPw, toggle: () => showConfirmPw = !showConfirmPw, label:'Confirm Password',  ac:'new-password' },
                        ]" :key="field.key" class="flex flex-col gap-1.5">
                            <label :for="`apw-${field.key}`" class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{{ field.label }}</label>
                            <div class="relative">
                                <input :id="`apw-${field.key}`" v-model="pw[field.key]"
                                    :type="field.show ? 'text' : 'password'"
                                    :placeholder="field.hint || '••••••••'"
                                    :autocomplete="field.ac"
                                    class="input pr-10" />
                                <button type="button" @click="field.toggle"
                                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]">
                                    <i :class="['pi text-sm', field.show ? 'pi-eye-slash' : 'pi-eye']"></i>
                                </button>
                            </div>
                        </div>
                    </template>
                </div>

                <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-end gap-3">
                    <button @click="showSettings = false" class="btn-secondary h-9 px-4 text-sm">Cancel</button>
                    <button v-if="settingsTab === 'password' && !authStore.user?.googleId"
                        @click="handlePwUpdate" :disabled="isSaving"
                        class="btn-primary h-9 px-5 text-sm disabled:opacity-50 flex items-center gap-2">
                        <i v-if="isSaving" class="pi pi-spin pi-spinner text-xs"></i>
                        {{ isSaving ? 'Saving...' : 'Save Changes' }}
                    </button>
                </div>
            </div>
        </div>
        </Teleport>
    </div>
</template>
