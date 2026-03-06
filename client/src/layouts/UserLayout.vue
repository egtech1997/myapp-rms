<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

// ── UI state ────────────────────────────────────────────────────
const showMobileMenu  = ref(false)
const showDropdown    = ref(false)
const showSettings    = ref(false)
const settingsTab     = ref('photo')
const uploading       = ref(false)
const isSaving        = ref(false)
const fileInput       = ref(null)
const showCurrPw      = ref(false)
const showNewPw       = ref(false)
const showConfirmPw   = ref(false)

const pw = reactive({ current: '', new: '', confirm: '' })

const navLinks = [
    { label: 'Dashboard',       to: '/user/dashboard',    icon: 'pi-home'        },
    { label: 'My Applications', to: '/user/applications', icon: 'pi-folder-open' },
    { label: 'Job Vacancies',   to: '/vacancies',         icon: 'pi-briefcase'   },
]

const avatarSrc = computed(() =>
    authStore.user?.avatarUrl
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'U')}&background=1d4ed8&color=fff&bold=true`
)

// ── Avatar upload ────────────────────────────────────────────────
const triggerFile = () => fileInput.value?.click()

const onFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
        alert('File too large. Max 10 MB.')
        return
    }
    const fd = new FormData()
    fd.append('avatar', file, file.name)
    uploading.value = true
    try {
        const { data } = await apiClient.patch('/auth/update-avatar', fd)
        authStore.user = { ...data.user, avatarUrl: `${data.user.avatarUrl}?t=${Date.now()}` }
        showSettings.value = false
    } catch {
        alert('Upload failed.')
    } finally {
        uploading.value = false
        if (fileInput.value) fileInput.value.value = ''
    }
}

// ── Password change ──────────────────────────────────────────────
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

const closeMenu = () => { showMobileMenu.value = false }
</script>

<template>
    <div class="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-main)] font-sans antialiased">

        <!-- Skip to content (accessibility) -->
        <a href="#main-content" class="skip-link">Skip to main content</a>

        <!-- ── Header ────────────────────────────────────────── -->
        <header class="sticky top-0 z-30 bg-white dark:bg-[var(--surface)] border-b border-[var(--border-main)] shadow-sm"
            role="banner">
            <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

                <!-- Logo -->
                <router-link to="/" class="flex items-center gap-3 shrink-0 group" aria-label="DepEd RSP Portal home">
                    <div class="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shadow-md shadow-blue-200 group-hover:shadow-blue-300 transition-shadow">
                        <i class="pi pi-shield text-white text-base" aria-hidden="true"></i>
                    </div>
                    <div class="hidden sm:flex flex-col leading-tight">
                        <span class="text-sm font-bold text-[var(--text-main)] tracking-tight">DepEd GNC</span>
                        <span class="text-[10px] font-medium text-[var(--text-muted)] tracking-wider uppercase">RSP Portal</span>
                    </div>
                </router-link>

                <!-- Desktop nav -->
                <nav class="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
                    <router-link v-for="link in navLinks" :key="link.to" :to="link.to"
                        class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
                        :class="route.path === link.to
                            ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-2)]'"
                        :aria-current="route.path === link.to ? 'page' : undefined">
                        <i :class="['pi text-xs', link.icon]" aria-hidden="true"></i>
                        {{ link.label }}
                    </router-link>
                </nav>

                <!-- Right: user + mobile toggle -->
                <div class="flex items-center gap-2">

                    <!-- Mobile menu button -->
                    <button @click="showMobileMenu = !showMobileMenu"
                        class="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors"
                        :aria-expanded="showMobileMenu" aria-controls="mobile-menu"
                        :aria-label="showMobileMenu ? 'Close menu' : 'Open menu'">
                        <i :class="['pi text-sm', showMobileMenu ? 'pi-times' : 'pi-bars']" aria-hidden="true"></i>
                    </button>

                    <!-- User dropdown -->
                    <div class="relative">
                        <button @click="showDropdown = !showDropdown"
                            class="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[var(--surface-2)] border border-transparent hover:border-[var(--border-main)] transition-all"
                            :aria-expanded="showDropdown" aria-haspopup="menu" aria-label="User account menu">
                            <img :src="avatarSrc" :alt="authStore.user?.username"
                                class="w-8 h-8 rounded-full object-cover border-2 border-[var(--color-primary-light)]" />
                            <div class="hidden sm:flex flex-col items-start leading-tight">
                                <span class="text-xs font-bold text-[var(--text-main)] capitalize max-w-[80px] truncate">{{ authStore.user?.username }}</span>
                                <span class="text-[10px] text-[var(--text-muted)]">Applicant</span>
                            </div>
                            <i class="pi pi-chevron-down text-[9px] text-[var(--text-faint)] hidden sm:block" aria-hidden="true"></i>
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
                                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--surface-2)] transition-colors text-left"
                                        role="menuitem">
                                        <i class="pi pi-user text-[var(--text-muted)] text-sm" aria-hidden="true"></i> Profile Settings
                                    </button>
                                    <button @click="showSettings = true; settingsTab = 'password'; showDropdown = false"
                                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--surface-2)] transition-colors text-left"
                                        role="menuitem">
                                        <i class="pi pi-lock text-[var(--text-muted)] text-sm" aria-hidden="true"></i> Change Password
                                    </button>
                                    <div class="h-px bg-[var(--border-main)] my-1" role="separator"></div>
                                    <button @click="authStore.logout()"
                                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
                                        role="menuitem">
                                        <i class="pi pi-sign-out text-sm" aria-hidden="true"></i> Logout
                                    </button>
                                </div>
                            </div>
                        </Transition>
                    </div>
                </div>
            </div>

            <!-- Mobile nav -->
            <Transition name="slide-down">
                <div v-if="showMobileMenu" id="mobile-menu"
                    class="md:hidden border-t border-[var(--border-main)] bg-[var(--surface)] px-4 py-3 flex flex-col gap-1">
                    <router-link v-for="link in navLinks" :key="link.to" :to="link.to"
                        @click="closeMenu"
                        class="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors"
                        :class="route.path === link.to
                            ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-2)]'"
                        :aria-current="route.path === link.to ? 'page' : undefined">
                        <i :class="['pi text-sm', link.icon]" aria-hidden="true"></i>
                        {{ link.label }}
                    </router-link>
                </div>
            </Transition>
        </header>

        <!-- ── Page content ──────────────────────────────────── -->
        <main id="main-content" class="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
            <RouterView v-slot="{ Component }">
                <transition name="page-fade" mode="out-in">
                    <KeepAlive>
                        <component :is="Component" :key="$route.name" />
                    </KeepAlive>
                </transition>
            </RouterView>
        </main>

        <!-- ── Footer ────────────────────────────────────────── -->
        <footer class="border-t border-[var(--border-main)] bg-[var(--surface)]" role="contentinfo">
            <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-[var(--color-primary)] flex items-center justify-center">
                        <i class="pi pi-shield text-white text-[9px]" aria-hidden="true"></i>
                    </div>
                    <p class="text-xs text-[var(--text-muted)]">
                        &copy; {{ new Date().getFullYear() }} DepEd Division of Guihulngan City
                    </p>
                </div>
                <div class="flex gap-5 text-xs text-[var(--text-muted)]">
                    <a href="#" class="hover:text-[var(--text-main)] transition-colors">Privacy Policy</a>
                    <a href="#" class="hover:text-[var(--text-main)] transition-colors">Support</a>
                </div>
            </div>
        </footer>
    </div>

    <!-- ── Settings Modal ────────────────────────────────────── -->
    <Teleport to="body">
        <div v-if="showSettings"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            role="dialog" aria-modal="true" aria-labelledby="user-settings-title"
            @click.self="showSettings = false">

            <div class="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-main)] overflow-hidden animate-zoom-in">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
                    <h2 id="user-settings-title" class="text-base font-bold text-[var(--text-main)]">Account Settings</h2>
                    <button @click="showSettings = false"
                        class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-2)] text-[var(--text-muted)]"
                        aria-label="Close settings">
                        <i class="pi pi-times text-sm" aria-hidden="true"></i>
                    </button>
                </div>

                <!-- Tabs -->
                <div class="flex border-b border-[var(--border-main)]" role="tablist">
                    <button v-for="tab in [{id:'photo',icon:'pi-user',label:'Profile Photo'},{id:'password',icon:'pi-lock',label:'Password'}]"
                        :key="tab.id" @click="settingsTab = tab.id"
                        :aria-selected="settingsTab === tab.id ? 'true' : 'false'" role="tab"
                        :class="['flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border-b-2',
                            settingsTab === tab.id
                                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-light)]/30'
                                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-2)]']">
                        <i :class="['pi text-[11px]', tab.icon]" aria-hidden="true"></i>{{ tab.label }}
                    </button>
                </div>

                <!-- Photo Tab -->
                <div v-if="settingsTab === 'photo'" class="p-6 flex flex-col items-center gap-4" role="tabpanel">
                    <div class="relative group cursor-pointer" @click="triggerFile"
                        role="button" tabindex="0" @keydown.enter="triggerFile" @keydown.space.prevent="triggerFile"
                        aria-label="Click to change profile photo">
                        <img :src="avatarSrc" :alt="authStore.user?.username"
                            class="w-24 h-24 rounded-full object-cover border-4 border-[var(--color-primary-light)]" />
                        <div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
                            <i :class="['pi text-white text-xl', uploading ? 'pi-spin pi-spinner' : 'pi-camera']"></i>
                        </div>
                    </div>
                    <input ref="fileInput" type="file" class="sr-only" accept="image/*" @change="onFileSelect" aria-label="Upload profile photo" />
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
                        class="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700"
                        role="alert">
                        <i class="pi pi-info-circle mt-0.5 shrink-0 text-sm" aria-hidden="true"></i>
                        <p class="text-sm">Google account — manage password through Google settings.</p>
                    </div>
                    <template v-else>
                        <div v-for="field in [
                            { key:'current', show: showCurrPw,  setShow: (v) => showCurrPw = v,  label:'Current Password', ac:'current-password' },
                            { key:'new',     show: showNewPw,   setShow: (v) => showNewPw = v,   label:'New Password',     ac:'new-password', hint:'Min. 8 characters' },
                            { key:'confirm', show: showConfirmPw, setShow: (v) => showConfirmPw = v, label:'Confirm Password', ac:'new-password' },
                        ]" :key="field.key" class="flex flex-col gap-1.5">
                            <label :for="`upw-${field.key}`" class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                {{ field.label }}
                            </label>
                            <div class="relative">
                                <input :id="`upw-${field.key}`" v-model="pw[field.key]"
                                    :type="field.show ? 'text' : 'password'"
                                    :placeholder="field.hint || '••••••••'"
                                    :autocomplete="field.ac"
                                    class="input pr-10" />
                                <button type="button" @click="field.setShow(!field.show)"
                                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                    :aria-label="field.show ? `Hide ${field.label}` : `Show ${field.label}`">
                                    <i :class="['pi text-sm', field.show ? 'pi-eye-slash' : 'pi-eye']" aria-hidden="true"></i>
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
</template>

<style scoped>
.dropdown-enter-active { transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1); }
.dropdown-leave-active { transition: all 0.12s ease; }
.dropdown-enter-from   { opacity: 0; transform: translateY(-6px) scale(0.97); }
.dropdown-leave-to     { opacity: 0; transform: translateY(-4px); }

.slide-down-enter-active { transition: all 0.2s ease; }
.slide-down-leave-active { transition: all 0.15s ease; }
.slide-down-enter-from   { opacity: 0; transform: translateY(-8px); }
.slide-down-leave-to     { opacity: 0; transform: translateY(-4px); }
</style>
