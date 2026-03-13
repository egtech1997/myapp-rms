<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import apiClient from '@/api/axios'
import NotificationCenter from '@/components/NotificationCenter.vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

// ── UI state ────────────────────────────────────────────────────
const showMobileMenu = ref(false)
const showDropdown = ref(false)
const showSettings = ref(false)
const settingsTab = ref('profile')
const uploading = ref(false)
const isSaving = ref(false)
const fileInput = ref(null)
const showCurrPw = ref(false)
const showNewPw = ref(false)
const showConfirmPw = ref(false)

// ── Cropper State ──────────────────────────────────────────────
const showCropper = ref(false)
const cropperImg = ref(null)
const cropperRef = ref(null)
const cropperFileType = ref('image/jpeg')

const pw = reactive({ current: '', new: '', confirm: '' })

// ── Account profile form ────────────────────────────────────────
const profileForm = reactive({ username: '', bio: '', links: { facebook: '', linkedin: '', twitter: '' } })

const openSettings = (tab = 'profile') => {
    // Pre-populate from authStore
    profileForm.username = authStore.user?.username || ''
    profileForm.bio = authStore.user?.bio || ''
    profileForm.links.facebook = authStore.user?.links?.facebook || ''
    profileForm.links.linkedin = authStore.user?.links?.linkedin || ''
    profileForm.links.twitter = authStore.user?.links?.twitter || ''
    settingsTab.value = tab
    showDropdown.value = false
    showSettings.value = true
}

const saveProfileInfo = async () => {
    isSaving.value = true
    try {
        const { data } = await apiClient.patch('/auth/update-me', {
            username: profileForm.username.trim(),
            bio: profileForm.bio,
            links: profileForm.links,
        })
        authStore.user = { ...authStore.user, ...data.user }
        showSettings.value = false
    } catch (err) {
        alert(err.response?.data?.message || 'Update failed.')
    } finally { isSaving.value = false }
}

// ── Avatar upload ────────────────────────────────────────────────
const triggerFile = () => fileInput.value?.click()

const onFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('File too large. Max 10 MB.'); return }

    // If it's a GIF, upload directly
    if (file.type === 'image/gif') {
        uploadAvatar(file)
        return
    }

    // Otherwise, open cropper
    cropperFileType.value = file.type
    const reader = new FileReader()
    reader.onload = (event) => {
        cropperImg.value = event.target.result
        showCropper.value = true
    }
    reader.readAsDataURL(file)
}

const handleCrop = async () => {
    const { canvas } = cropperRef.value.getResult()
    if (!canvas) return

    canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], `avatar.${cropperFileType.value.split('/')[1]}`, { type: cropperFileType.value })
        await uploadAvatar(file)
        showCropper.value = false
        cropperImg.value = null
    }, cropperFileType.value)
}

const uploadAvatar = async (file) => {
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

// ── Password change ──────────────────────────────────────────────
const handlePwUpdate = async () => {
    if (pw.new !== pw.confirm) { alert('Passwords do not match.'); return }
    if (pw.new.length < 8) { alert('Min. 8 characters.'); return }
    isSaving.value = true
    try {
        await apiClient.patch('/auth/update-password', { currentPassword: pw.current, newPassword: pw.new })
        showSettings.value = false
        Object.assign(pw, { current: '', new: '', confirm: '' })
    } catch (err) {
        alert(err.response?.data?.message || 'Update failed.')
    } finally { isSaving.value = false }
}

import { AppInput, AppTextarea, AppButton } from '@/components/ui'

const navLinks = [
    { label: 'Dashboard', to: '/user/dashboard', icon: 'pi-home' },
    { label: 'Job Vacancies', to: '/user/vacancies', icon: 'pi-briefcase' },
    { label: 'My Applications', to: '/user/applications', icon: 'pi-folder-open' },
    { label: 'My Profile', to: '/user/profile', icon: 'pi-id-card' },
]

const avatarSrc = computed(() =>
    authStore.user?.avatarUrl
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'U')}&background=4A4D8F&color=fff&bold=true`
)

const closeMenu = () => { showMobileMenu.value = false }
</script>

<template>
    <div class="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-main)] font-sans antialiased">

        <!-- Skip to content (accessibility) -->
        <a href="#main-content" class="skip-link">Skip to main content</a>

        <!-- ── Header ────────────────────────────────────────── -->
        <header
            class="sticky top-0 z-30 bg-white dark:bg-[var(--surface)] border-b border-[var(--border-main)] shadow-sm"
            role="banner">
            <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

                <!-- Logo -->
                <router-link to="/" class="flex items-center gap-3 shrink-0 group" aria-label="RSP Portal home">
                    <div class="w-9 h-9 rounded-xl overflow-hidden shadow-md group-hover:shadow-blue-300 transition-shadow"
                        :class="settingsStore.resolvedLogoUrl ? '' : 'bg-[var(--color-primary)] flex items-center justify-center'">
                        <img v-if="settingsStore.resolvedLogoUrl" :src="settingsStore.resolvedLogoUrl" alt="System Logo"
                            class="w-full h-full object-cover" />
                        <i v-else class="pi pi-shield text-white text-base" aria-hidden="true"></i>
                    </div>
                    <div class="hidden sm:flex flex-col leading-tight">
                        <span class="text-sm font-bold text-[var(--text-main)] tracking-tight">{{
                            settingsStore.systemName }}</span>
                        <span class="text-[10px] font-medium text-[var(--text-muted)] tracking-wider uppercase">{{
                            settingsStore.systemSubName }}</span>
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

                    <!-- Notifications -->
                    <NotificationCenter />

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
                                <span
                                    class="text-xs font-bold text-[var(--text-main)] capitalize max-w-[80px] truncate">{{
                                    authStore.user?.username }}</span>
                                <span class="text-[10px] text-[var(--text-muted)]">Applicant</span>
                            </div>
                            <i class="pi pi-chevron-down text-[9px] text-[var(--text-faint)] hidden sm:block"
                                aria-hidden="true"></i>
                        </button>

                        <Transition name="dropdown">
                            <div v-if="showDropdown" v-click-outside="() => showDropdown = false"
                                class="absolute right-0 mt-2 w-52 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-xl z-50 overflow-hidden"
                                role="menu">
                                <div
                                    class="px-4 py-3 border-b border-[var(--border-main)] bg-[var(--color-primary-light)]/30">
                                    <p class="text-sm font-bold text-[var(--text-main)] capitalize truncate">{{
                                        authStore.user?.username }}</p>
                                    <p class="text-xs text-[var(--text-muted)] truncate mt-0.5">{{ authStore.user?.email
                                        }}</p>
                                </div>
                                <div class="p-1.5 flex flex-col gap-0.5" role="none">
                                    <button @click="openSettings('profile')"
                                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors text-left"
                                        role="menuitem">
                                        <i class="pi pi-user-edit text-[var(--text-muted)] text-sm"
                                            aria-hidden="true"></i>
                                        <div class="leading-tight">
                                            <p class="text-xs font-semibold">Account Settings</p>
                                            <p class="text-[10px] text-[var(--text-muted)]">Username, bio, social links
                                            </p>
                                        </div>
                                    </button>
                                    <button @click="openSettings('avatar')"
                                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors text-left"
                                        role="menuitem">
                                        <i class="pi pi-camera text-[var(--text-muted)] text-sm" aria-hidden="true"></i>
                                        <div class="leading-tight">
                                            <p class="text-xs font-semibold">Change Photo</p>
                                            <p class="text-[10px] text-[var(--text-muted)]">Upload avatar or GIF</p>
                                        </div>
                                    </button>
                                    <button @click="openSettings('password')"
                                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors text-left"
                                        role="menuitem">
                                        <i class="pi pi-lock text-[var(--text-muted)] text-sm" aria-hidden="true"></i>
                                        <div class="leading-tight">
                                            <p class="text-xs font-semibold">Change Password</p>
                                            <p class="text-[10px] text-[var(--text-muted)]">Update login credentials</p>
                                        </div>
                                    </button>
                                    <div class="h-px bg-[var(--border-main)] my-1" role="separator"></div>
                                    <button @click="authStore.logout()"
                                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                                        role="menuitem">
                                        <i class="pi pi-sign-out text-sm" aria-hidden="true"></i> Sign Out
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
                    <router-link v-for="link in navLinks" :key="link.to" :to="link.to" @click="closeMenu"
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
            <div
                class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div class="flex items-center gap-2">
                    <div
                        class="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center border border-[var(--border-main)]">
                        <img v-if="settingsStore.resolvedLogoUrl" :src="settingsStore.resolvedLogoUrl" alt="Logo"
                            class="w-full h-full object-contain p-0.5" />
                        <div v-else class="w-full h-full bg-[var(--color-primary)] flex items-center justify-center">
                            <i class="pi pi-shield text-white text-[10px]" aria-hidden="true"></i>
                        </div>
                    </div>
                    <p class="text-[11px] font-medium text-[var(--text-muted)]">
                        &copy; {{ new Date().getFullYear() }} {{ settingsStore.copyrightText }}
                    </p>
                </div>
                <div class="flex gap-5 text-[11px] font-medium text-[var(--text-muted)]">
                    <a href="#" class="hover:text-[var(--text-main)] transition-colors">Privacy Policy</a>
                    <a href="#" class="hover:text-[var(--text-main)] transition-colors">Support Center</a>
                </div>
            </div>
        </footer>

        <!-- ── Image Cropper Modal ────────────────────────────── -->
        <Teleport to="body">
            <div v-if="showCropper"
                class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                <div
                    class="w-full max-w-lg bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-main)] overflow-hidden flex flex-col">
                    <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
                        <h2 class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Adjust Avatar
                        </h2>
                        <button @click="showCropper = false"
                            class="text-[var(--text-muted)] hover:text-red-500 transition-colors">
                            <i class="pi pi-times text-sm"></i>
                        </button>
                    </div>

                    <div class="p-6 bg-slate-900 flex items-center justify-center min-h-[320px]">
                        <Cropper ref="cropperRef" class="max-h-[400px] w-full" :src="cropperImg"
                            :stencil-props="{ aspectRatio: 1, previewClass: 'rounded-full border-4 border-white/20' }"
                            image-class="max-w-full" />
                    </div>

                    <div
                        class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-between items-center">
                        <p class="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Drag to
                            reposition &bull; Pinch to zoom</p>
                        <div class="flex gap-3">
                            <button @click="showCropper = false"
                                class="btn-secondary h-10 px-6 text-xs uppercase font-black">Cancel</button>
                            <button @click="handleCrop" :disabled="uploading"
                                class="btn-primary h-10 px-8 text-xs uppercase font-black flex items-center gap-2">
                                <i v-if="uploading" class="pi pi-spin pi-spinner"></i>
                                {{ uploading ? 'Uploading...' : 'Save' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- ── Account Settings Modal ────────────────────────────── -->
        <Teleport to="body">
            <div v-if="showSettings"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
                role="dialog" aria-modal="true" aria-labelledby="user-settings-title"
                @click.self="showSettings = false">

                <div
                    class="w-full max-w-lg bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-main)] overflow-hidden animate-zoom-in">

                    <!-- Modal Header -->
                    <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <img :src="avatarSrc" :alt="authStore.user?.username"
                                class="w-9 h-9 rounded-full object-cover border-2 border-[var(--color-primary-light)]" />
                            <div>
                                <h2 id="user-settings-title" class="text-sm font-black text-[var(--text-main)]">Account
                                    Settings</h2>
                                <p class="text-[10px] text-[var(--text-muted)] capitalize">{{ authStore.user?.username
                                    }}</p>
                            </div>
                        </div>
                        <button @click="showSettings = false"
                            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors"
                            aria-label="Close settings">
                            <i class="pi pi-times text-sm" aria-hidden="true"></i>
                        </button>
                    </div>

                    <!-- Tabs -->
                    <div class="flex border-b border-[var(--border-main)]" role="tablist">
                        <button v-for="tab in [
                            { id: 'profile', icon: 'pi-user-edit', label: 'Profile' },
                            { id: 'avatar', icon: 'pi-camera', label: 'Photo' },
                            { id: 'password', icon: 'pi-lock', label: 'Password' },
                        ]" :key="tab.id" @click="settingsTab = tab.id"
                            :aria-selected="settingsTab === tab.id ? 'true' : 'false'" role="tab"
                            :class="['flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2',
                                settingsTab === tab.id
                                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-light)]/30'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)]']">
                            <i :class="['pi text-[11px]', tab.icon]" aria-hidden="true"></i>{{ tab.label }}
                        </button>
                    </div>

                    <!-- TAB: Profile Info -->
                    <div v-if="settingsTab === 'profile'" class="p-6 flex flex-col gap-5" role="tabpanel">
                        <AppInput 
                            v-model="profileForm.username" 
                            label="Username" 
                            hint="Lowercase, no spaces. Used for login and display." 
                            size="sm"
                        />
                        <AppTextarea 
                            v-model="profileForm.bio" 
                            label="Bio" 
                            :maxlength="240" 
                            show-count 
                            placeholder="A short bio about yourself — your role, school, advocacies..."
                            size="sm"
                        />
                        <div>
                            <p class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">
                                Social Links</p>
                            <div class="space-y-3">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                                        <i class="pi pi-facebook text-blue-600 text-sm"></i>
                                    </div>
                                    <AppInput v-model="profileForm.links.facebook" label="Facebook URL" size="sm" class="flex-1" />
                                </div>
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                                        <i class="pi pi-linkedin text-sky-700 text-sm"></i>
                                    </div>
                                    <AppInput v-model="profileForm.links.linkedin" label="LinkedIn URL" size="sm" class="flex-1" />
                                </div>
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                                        <i class="pi pi-twitter text-slate-600 text-sm"></i>
                                    </div>
                                    <AppInput v-model="profileForm.links.twitter" label="Twitter URL" size="sm" class="flex-1" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB: Avatar -->
                    <div v-if="settingsTab === 'avatar'" class="p-6 flex flex-col items-center gap-5" role="tabpanel">
                        <div class="relative group cursor-pointer" @click="triggerFile" role="button" tabindex="0"
                            @keydown.enter="triggerFile" @keydown.space.prevent="triggerFile"
                            aria-label="Click to change profile photo">
                            <img :src="avatarSrc" :alt="authStore.user?.username"
                                class="w-28 h-28 rounded-2xl object-cover border-4 border-[var(--color-primary-light)] shadow-lg" />
                            <div class="absolute inset-0 rounded-2xl bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-hidden="true">
                                <i
                                    :class="['pi text-white text-2xl mb-1', uploading ? 'pi-spin pi-spinner' : 'pi-camera']"></i>
                                <span class="text-white text-[10px] font-bold uppercase tracking-widest">Change</span>
                            </div>
                        </div>
                        <input ref="fileInput" type="file" class="sr-only"
                            accept="image/jpeg,image/png,image/webp,image/gif" @change="onFileSelect"
                            aria-label="Upload profile photo" />
                        <div class="text-center">
                            <button @click="triggerFile" :disabled="uploading"
                                class="btn-primary h-10 px-6 text-sm disabled:opacity-50 flex items-center gap-2 mx-auto">
                                <i :class="['pi text-xs', uploading ? 'pi-spin pi-spinner' : 'pi-upload']"
                                    aria-hidden="true"></i>
                                {{ uploading ? 'Uploading...' : 'Upload New Photo' }}
                            </button>
                            <p class="text-[11px] text-[var(--text-muted)] mt-3">JPG, PNG, WebP &bull; Max 10 MB</p>
                            <p class="text-[11px] text-[var(--text-muted)]">GIF files are accepted and will animate
                                as-is.</p>
                        </div>
                        <div
                            class="w-full p-3 bg-[var(--color-primary-light)]/40 rounded-xl border border-[var(--border-main)] text-center">
                            <p class="text-[10px] text-[var(--color-primary)] font-bold">Your avatar is visible to
                                admins on job applications.</p>
                        </div>
                    </div>

                    <!-- TAB: Password -->
                    <div v-if="settingsTab === 'password'" class="p-6 flex flex-col gap-4" role="tabpanel">
                        <div v-if="authStore.user?.googleId"
                            class="flex items-start gap-3 p-4 rounded-xl bg-[var(--color-primary-light)] border border-[var(--border-main)] text-[var(--color-primary)]"
                            role="alert">
                            <i class="pi pi-info-circle mt-0.5 shrink-0" aria-hidden="true"></i>
                            <div>
                                <p class="text-sm font-bold">Google Account</p>
                                <p class="text-xs mt-0.5">Your account uses Google sign-in. Manage your password through
                                    Google account settings.</p>
                            </div>
                        </div>
                        <template v-else>
                            <div class="flex flex-col gap-4">
                                <AppInput 
                                    v-for="field in [
                                        { key: 'current', show: showCurrPw, toggle: () => showCurrPw = !showCurrPw, label: 'Current Password', ac: 'current-password' },
                                        { key: 'new', show: showNewPw, toggle: () => showNewPw = !showNewPw, label: 'New Password', ac: 'new-password', hint: 'Minimum 8 characters' },
                                        { key: 'confirm', show: showConfirmPw, toggle: () => showConfirmPw = !showConfirmPw, label: 'Confirm New Password', ac: 'new-password' },
                                    ]" 
                                    :key="field.key"
                                    v-model="pw[field.key]"
                                    :type="field.show ? 'text' : 'password'"
                                    :label="field.label"
                                    :hint="field.hint"
                                    :autocomplete="field.ac"
                                    toggleable
                                    size="sm"
                                />
                            </div>
                        </template>
                    </div>

                    <!-- Footer Actions -->
                    <div
                        class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-end gap-3">
                        <button @click="showSettings = false" class="btn-secondary h-10 px-5 text-sm">Cancel</button>
                        <button v-if="settingsTab === 'profile'" @click="saveProfileInfo" :disabled="isSaving"
                            class="btn-primary h-10 px-5 text-sm disabled:opacity-50 flex items-center gap-2">
                            <i v-if="isSaving" class="pi pi-spin pi-spinner text-xs" aria-hidden="true"></i>
                            {{ isSaving ? 'Saving...' : 'Save Profile' }}
                        </button>
                        <button v-if="settingsTab === 'password' && !authStore.user?.googleId" @click="handlePwUpdate"
                            :disabled="isSaving"
                            class="btn-primary h-10 px-5 text-sm disabled:opacity-50 flex items-center gap-2">
                            <i v-if="isSaving" class="pi pi-spin pi-spinner text-xs" aria-hidden="true"></i>
                            {{ isSaving ? 'Updating...' : 'Update Password' }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>
