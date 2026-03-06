<script setup>
import { ref, reactive, onMounted, inject } from 'vue' // <-- Added inject
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import apiClient from '@/api/axios'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const props = defineProps({
    isCollapsed: {
        type: Boolean,
        required: true
    }
})

// Removed 'show-toast' from emits
const emit = defineEmits(['update:isCollapsed'])

const authStore = useAuthStore()
const route = useRoute()

// --- NEW: Inject global SweetAlert2 Toast ---
const toast = inject('$toast')

// Local UI State
const isDark = ref(false)
const showNotifications = ref(false)
const showUserDropdown = ref(false)
const showSettingsModal = ref(false)

// Data State
const uploading = ref(false)
const isSaving = ref(false)
const fileInput = ref(null)
const selectedImage = ref(null)
const cropperRef = ref(null)

const notifications = ref([
    { id: 1, title: 'New Application', time: '2 mins ago', type: 'info' },
    { id: 2, title: 'System Update', time: '1 hour ago', type: 'warning' }
])

const passwordData = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

onMounted(() => {
    isDark.value = localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark')
})

const toggleTheme = () => {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

/* --- LOGIC: AVATAR & PASSWORD --- */
const triggerFileSelect = () => {
    if (fileInput.value) fileInput.value.click()
}

const onFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.type === 'image/gif') {
        uploadFile(file, false)
        return
    }
    selectedImage.value = URL.createObjectURL(file)
}

const uploadFile = async (fileOrBlob, isCropped = false) => {
    const formData = new FormData()
    formData.append('avatar', fileOrBlob, isCropped ? 'avatar.jpg' : fileOrBlob.name)
    uploading.value = true
    try {
        const { data } = await apiClient.patch('/auth/update-avatar', formData)
        authStore.user = { ...data.user, avatarUrl: `${data.user.avatarUrl}?t=${Date.now()}` }

        // --- NEW: Using SweetAlert ---
        toast.fire({
            icon: 'success',
            title: 'Profile Updated',
            text: 'Your photo was saved successfully.'
        })

        selectedImage.value = null
    } catch (err) {
        // --- NEW: Using SweetAlert ---
        toast.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: 'Could not update your profile photo.'
        })
    } finally {
        uploading.value = false
        if (fileInput.value) fileInput.value.value = '' // Reset input
    }
}

const uploadCroppedImage = () => {
    const result = cropperRef.value.getResult()
    if (result?.canvas) result.canvas.toBlob(b => b && uploadFile(b, true), 'image/jpeg', 0.9)
}

const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        // --- NEW: Using SweetAlert ---
        toast.fire({
            icon: 'warning', // Used warning icon here instead of error
            title: 'Validation Error',
            text: 'Passwords do not match.'
        })
        return
    }
    isSaving.value = true
    try {
        await apiClient.patch('/auth/update-password', passwordData)

        // --- NEW: Using SweetAlert ---
        toast.fire({
            icon: 'success',
            title: 'Security Updated',
            text: 'Your password was changed successfully.'
        })

        showSettingsModal.value = false
        Object.assign(passwordData, { currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
        // --- NEW: Using SweetAlert ---
        toast.fire({
            icon: 'error',
            title: 'Update Failed',
            text: err.response?.data?.message || 'An error occurred.'
        })
    } finally { isSaving.value = false }
}
</script>

<template>
    <div>
        <header
            class="h-16 bg-[var(--surface)] border-b border-[var(--border-main)] flex items-center justify-between px-6 z-30 flex-shrink-0">
            <div class="flex items-center gap-4">
                <button @click="emit('update:isCollapsed', !isCollapsed)"
                    class="p-2 -ml-2 rounded-md hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-solar)]/50">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <div class="h-4 w-px bg-[var(--border-main)] hidden sm:block"></div>

                <nav class="hidden sm:flex items-center gap-2 text-sm">
                    <span class="text-[var(--text-muted)] font-medium">Dashboard</span>
                    <svg class="w-3 h-3 text-[var(--text-muted)] opacity-50" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span class="font-bold text-[var(--text-main)] capitalize">{{ route.name || 'Overview' }}</span>
                </nav>
            </div>

            <div class="flex items-center gap-2 sm:gap-4">
                <div class="relative">
                    <button @click="showNotifications = !showNotifications"
                        @blur="setTimeout(() => showNotifications = false, 200)"
                        class="w-9 h-9 flex items-center justify-center rounded-md hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors relative">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span
                            class="absolute top-2 right-2.5 w-2 h-2 bg-[var(--color-solar)] rounded-full border-2 border-[var(--surface)]"></span>
                    </button>

                    <div :class="[
                        'absolute right-0 mt-2 w-80 bg-[var(--surface)] shadow-xl border border-[var(--border-main)] rounded-xl transition-all duration-200 z-50 origin-top-right overflow-hidden',
                        showNotifications ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                    ]">
                        <div
                            class="px-4 py-3 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-app)]/50">
                            <span class="text-sm font-bold">Notifications</span>
                            <button
                                class="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium hover:underline">Mark
                                read</button>
                        </div>
                        <div class="max-h-64 overflow-y-auto custom-scrollbar">
                            <div v-for="n in notifications" :key="n.id"
                                class="p-4 border-b border-[var(--border-main)] last:border-0 flex gap-3 cursor-pointer hover:bg-[var(--bg-app)] transition-colors">
                                <div
                                    class="w-8 h-8 rounded-full bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center shrink-0 text-[var(--text-main)]">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p class="text-sm font-semibold">{{ n.title }}</p>
                                    <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ n.time }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button @click="toggleTheme"
                    class="w-9 h-9 flex items-center justify-center rounded-md hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors">
                    <svg v-if="!isDark" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </button>

                <div class="h-4 w-px bg-[var(--border-main)] mx-1"></div>

                <div class="relative">
                    <button @click="showUserDropdown = !showUserDropdown"
                        @blur="setTimeout(() => showUserDropdown = false, 200)"
                        class="flex items-center justify-center p-1 rounded-full hover:bg-[var(--bg-app)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-solar)]/50">
                        <img :src="authStore.user?.avatarUrl"
                            class="w-9 h-9 rounded-full bg-[var(--bg-app)] object-cover border border-[var(--border-main)] shadow-sm" />
                    </button>

                    <div :class="[
                        'absolute right-0 mt-2 w-48 rounded-xl bg-[var(--surface)] shadow-xl border border-[var(--border-main)] transition-all duration-200 z-50 origin-top-right overflow-hidden',
                        showUserDropdown ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                    ]">
                        <div class="px-4 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)]/30">
                            <p class="text-xs font-bold truncate">{{ authStore.user?.username }}</p>
                            <p class="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{{ authStore.user?.email }}
                            </p>
                        </div>
                        <div class="p-1.5">
                            <button @click="showSettingsModal = true; showUserDropdown = false"
                                class="w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-[var(--bg-app)] flex items-center gap-2.5 transition-colors">
                                <svg class="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Account Settings
                            </button>
                            <button @click="authStore.logout"
                                class="w-full text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-rose-500/10 text-rose-500 flex items-center gap-2.5 transition-colors mt-0.5">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <Teleport to="body">
            <div v-if="showSettingsModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <div @click="showSettingsModal = false"
                    class="absolute inset-0 bg-[#020617]/70 backdrop-blur-sm transition-opacity"></div>

                <div
                    class="relative w-full max-w-xl bg-[var(--surface)] shadow-2xl rounded-2xl border border-[var(--border-main)] overflow-hidden animate-slide-up flex flex-col max-h-full">
                    <div class="px-6 py-4 border-b border-[var(--border-main)] flex justify-between items-center z-10">
                        <div>
                            <h3 class="text-lg font-bold text-[var(--text-main)]">Profile & Security</h3>
                            <p class="text-sm text-[var(--text-muted)] mt-0.5">Manage your personal information and
                                preferences.</p>
                        </div>
                        <button @click="showSettingsModal = false"
                            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div class="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8 text-[var(--text-main)]">
                        <div class="flex flex-col items-center">
                            <h4
                                class="text-sm font-bold mb-4 self-start w-full border-b border-[var(--border-main)] pb-2">
                                Profile Photo</h4>

                            <div class="relative group cursor-pointer transition-transform active:scale-95 mt-2"
                                @click="triggerFileSelect">
                                <img :src="authStore.user?.avatarUrl"
                                    class="w-28 h-28 rounded-full border-4 border-[var(--border-main)] object-cover shadow-lg bg-[var(--bg-app)] transition-opacity duration-300 group-hover:opacity-75" />

                                <div
                                    class="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </div>

                            <p class="text-xs text-[var(--text-muted)] mt-3">Click to update. GIFs upload instantly.</p>
                            <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileSelect" />
                        </div>

                        <div v-if="selectedImage"
                            class="p-5 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl">
                            <p class="text-sm font-bold mb-3">Adjust Image</p>
                            <cropper ref="cropperRef" class="h-48 rounded-lg bg-black/5" :src="selectedImage"
                                :stencil-props="{ aspectRatio: 1 }" />
                            <div class="flex gap-3 mt-4">
                                <button @click="uploadCroppedImage"
                                    class="flex-1 py-2 bg-[var(--text-main)] text-[var(--surface)] text-sm font-bold rounded-lg transition-colors shadow-sm hover:opacity-90">
                                    Apply & Save
                                </button>
                                <button @click="selectedImage = null"
                                    class="flex-1 py-2 border border-[var(--border-main)] text-[var(--text-main)] text-sm font-bold rounded-lg hover:bg-[var(--surface)] transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>

                        <div v-if="!authStore.user?.googleId" class="pt-2">
                            <h4 class="text-sm font-bold mb-4 border-b border-[var(--border-main)] pb-2">Security</h4>
                            <div class="space-y-4">
                                <div>
                                    <label
                                        class="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Current
                                        Password</label>
                                    <input v-model="passwordData.currentPassword" type="password"
                                        class="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:border-[var(--color-solar)] focus:ring-2 focus:ring-[var(--color-solar)]/20 outline-none transition-all placeholder:text-[var(--text-muted)]"
                                        placeholder="Enter current password" />
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            class="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">New
                                            Password</label>
                                        <input v-model="passwordData.newPassword" type="password"
                                            class="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:border-[var(--color-solar)] focus:ring-2 focus:ring-[var(--color-solar)]/20 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label
                                            class="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Confirm
                                            Password</label>
                                        <input v-model="passwordData.confirmPassword" type="password"
                                            class="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:border-[var(--color-solar)] focus:ring-2 focus:ring-[var(--color-solar)]/20 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-end gap-3 rounded-b-2xl">
                        <button @click="showSettingsModal = false"
                            class="px-5 py-2.5 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                            Close
                        </button>
                        <button v-if="!authStore.user?.googleId" @click="handlePasswordUpdate" :disabled="isSaving"
                            class="px-5 py-2.5 bg-[var(--text-main)] text-[var(--surface)] text-sm font-bold rounded-lg shadow-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                            <svg v-if="isSaving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                    stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                </path>
                            </svg>
                            {{ isSaving ? 'Saving...' : 'Save Changes' }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
.animate-slide-up {
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.98);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
</style>