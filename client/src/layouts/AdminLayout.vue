<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import apiClient from '@/api/axios'
import { Cropper } from 'vue-advanced-cropper'
import AdminSidebar from '@/components/AdminSidebar.vue'
import 'vue-advanced-cropper/dist/style.css'

const authStore = useAuthStore()
const toast = useToast()

// UI State
const isDark = ref(false)
const isCollapsed = ref(false)
const isHovered = ref(false)
const showSettingsModal = ref(false)
const showNotifications = ref(false)
const showUserDropdown = ref(false) // Added state for user dropdown

// Data State
const uploading = ref(false)
const isSaving = ref(false)
const fileInput = ref(null)
const selectedImage = ref(null)
const cropperRef = ref(null)

const notifications = ref([
    { id: 1, title: 'New Application', time: '2 mins ago', icon: 'pi-file-import', color: 'text-blue-500 bg-blue-50' },
    { id: 2, title: 'System Update', time: '1 hour ago', icon: 'pi-server', color: 'text-amber-500 bg-amber-50' }
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
const triggerFileSelect = () => fileInput.value.click()
const onFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    selectedImage.value = URL.createObjectURL(file)
}

const uploadFile = async (fileOrBlob, isCropped = false) => {
    const formData = new FormData()
    formData.append('avatar', fileOrBlob, isCropped ? 'avatar.jpg' : fileOrBlob.name)
    uploading.value = true
    try {
        const { data } = await apiClient.patch('/auth/update-avatar', formData)
        authStore.user = { ...data.user, avatarUrl: `${data.user.avatarUrl}?t=${Date.now()}` }
        toast.add({ severity: 'success', summary: 'Profile Updated', detail: 'Your photo was saved successfully.', life: 3000 })
        selectedImage.value = null
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Upload Failed', detail: 'Could not update your profile photo.', life: 3000 })
    } finally { uploading.value = false }
}

const uploadCroppedImage = () => {
    const result = cropperRef.value.getResult()
    if (result?.canvas) result.canvas.toBlob(b => b && uploadFile(b, true), 'image/jpeg', 0.9)
}

const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Passwords do not match.', life: 3000 })
        return
    }
    isSaving.value = true
    try {
        await apiClient.patch('/auth/update-password', passwordData)
        toast.add({ severity: 'success', summary: 'Security Updated', detail: 'Your password was changed successfully.', life: 3000 })
        showSettingsModal.value = false
        Object.assign(passwordData, { currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Update Failed', detail: err.response?.data?.message || 'An error occurred.', life: 3000 })
    } finally { isSaving.value = false }
}
</script>

<template>
    <div
        class="flex h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-300 font-sans selection:bg-[var(--color-solar)] selection:text-black">
        <Toast />

        <AdminSidebar v-model:isHovered="isHovered" :isCollapsed="isCollapsed" />

        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
            <header
                class="h-16 bg-[var(--surface)] border-b border-[var(--border-main)] flex items-center justify-between px-6 z-30 shadow-sm">
                <div class="flex items-center gap-4">
                    <button @click="isCollapsed = !isCollapsed"
                        class="p-2 hover:bg-[var(--bg-app)] rounded-lg text-[var(--text-muted)] transition-colors">
                        <i class="pi pi-bars text-lg"></i>
                    </button>

                    <div class="h-5 w-[1px] bg-[var(--border-main)] hidden sm:block"></div>

                    <nav class="hidden sm:flex items-center gap-2 text-sm">
                        <span class="text-[var(--text-muted)] font-medium">Dashboard</span>
                        <i class="pi pi-angle-right text-[10px] text-[var(--border-main)]"></i>
                        <span class="font-semibold text-[var(--text-main)] capitalize">{{ $route.name || 'Overview'
                            }}</span>
                    </nav>
                </div>

                <div class="flex items-center gap-2">
                    <div class="relative">
                        <button @click="showNotifications = !showNotifications"
                            @blur="setTimeout(() => showNotifications = false, 200)"
                            class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors relative">
                            <i class="pi pi-bell"></i>
                            <span
                                class="absolute top-2.5 right-2.5 w-2 h-2 bg-[var(--color-solar)] rounded-full border-2 border-[var(--surface)]"></span>
                        </button>

                        <div v-if="showNotifications"
                            class="absolute right-0 mt-2 w-80 bg-[var(--surface)] border border-[var(--border-main)] shadow-xl rounded-xl overflow-hidden animate-zoom-in z-50">
                            <div
                                class="px-4 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)]/30 flex justify-between items-center">
                                <span class="text-sm font-semibold">Notifications</span>
                                <button class="text-xs text-[var(--color-solar)] font-semibold hover:underline">Mark all
                                    as read</button>
                            </div>
                            <div class="max-h-64 overflow-y-auto custom-scrollbar">
                                <div v-for="n in notifications" :key="n.id"
                                    class="p-4 hover:bg-[var(--bg-app)] border-b border-[var(--border-main)] last:border-0 flex gap-4 cursor-pointer transition-colors">
                                    <div
                                        :class="['w-10 h-10 rounded-full flex items-center justify-center shrink-0 dark:bg-slate-800 dark:text-slate-300', n.color]">
                                        <i :class="['pi text-sm', n.icon]"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm font-semibold text-[var(--text-main)]">{{ n.title }}</p>
                                        <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ n.time }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button @click="toggleTheme"
                        class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors">
                        <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'"></i>
                    </button>

                    <div class="h-5 w-[1px] bg-[var(--border-main)] mx-1"></div>

                    <div class="relative" @mouseenter="showUserDropdown = true" @mouseleave="showUserDropdown = false">

                        <button @click="showUserDropdown = !showUserDropdown"
                            @blur="setTimeout(() => showUserDropdown = false, 200)"
                            class="flex items-center gap-3 p-1.5 rounded-lg hover:bg-[var(--bg-app)] transition-colors border border-transparent hover:border-[var(--border-main)] focus:outline-none focus:border-[var(--border-main)]">
                            <img :src="authStore.user?.avatarUrl"
                                class="w-8 h-8 rounded-full bg-[var(--bg-app)] object-cover border border-[var(--border-main)]" />
                            <div class="hidden md:flex flex-col items-start text-left mr-2">
                                <span class="text-xs font-semibold leading-none">{{ authStore.user?.username }}</span>
                                <span
                                    class="text-[10px] text-[var(--text-muted)] mt-1 leading-none">Administrator</span>
                            </div>
                            <i class="pi pi-chevron-down text-[10px] text-[var(--text-muted)] hidden md:block"
                                :class="{ 'rotate-180': showUserDropdown, 'transition-transform': true }"></i>
                        </button>

                        <div :class="[
                            'absolute right-0 mt-2 w-56 bg-[var(--surface)] border border-[var(--border-main)] shadow-xl rounded-xl transition-all overflow-hidden z-50',
                            showUserDropdown ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
                        ]">
                            <div class="p-4 border-b border-[var(--border-main)]">
                                <p class="text-xs text-[var(--text-muted)]">Signed in as</p>
                                <p class="text-sm font-semibold truncate mt-0.5">{{ authStore.user?.username }}</p>
                            </div>
                            <div class="p-2">
                                <button @click="showSettingsModal = true"
                                    class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--bg-app)] flex items-center gap-3 transition-colors">
                                    <i class="pi pi-user text-[var(--text-muted)]"></i> Account Settings
                                </button>
                                <button @click="authStore.logout"
                                    class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-3 transition-colors mt-1">
                                    <i class="pi pi-sign-out"></i> Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main class="flex-1 overflow-y-auto p-6 lg:p-8 bg-[var(--bg-app)] custom-scrollbar">
                <router-view v-slot="{ Component }">
                    <transition name="page-fade" mode="out-in">
                        <div class="max-w-7xl mx-auto">
                            <component :is="Component" />
                        </div>
                    </transition>
                </router-view>
            </main>
        </div>

        <div v-if="showSettingsModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div @click="showSettingsModal = false"
                class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"></div>

            <div
                class="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border-main)] shadow-2xl rounded-2xl overflow-hidden animate-zoom-in">
                <div
                    class="px-6 py-4 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--surface)]">
                    <div>
                        <h3 class="text-base font-bold">Profile & Security</h3>
                        <p class="text-xs text-[var(--text-muted)] mt-0.5">Manage your personal details and password.
                        </p>
                    </div>
                    <button @click="showSettingsModal = false"
                        class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors">
                        <i class="pi pi-times text-sm"></i>
                    </button>
                </div>

                <div class="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">

                    <div>
                        <h4 class="text-sm font-semibold mb-4">Profile Picture</h4>
                        <div class="flex items-center gap-5">
                            <div class="relative group cursor-pointer w-20 h-20 shrink-0" @click="triggerFileSelect">
                                <img :src="authStore.user?.avatarUrl"
                                    class="w-full h-full rounded-full border-2 border-[var(--border-main)] object-cover shadow-sm" />
                                <div
                                    class="absolute inset-0 bg-slate-900/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white">
                                    <i class="pi pi-camera text-xl"></i>
                                </div>
                            </div>
                            <div>
                                <button @click="triggerFileSelect"
                                    class="px-4 py-2 text-sm font-semibold bg-[var(--bg-app)] border border-[var(--border-main)] hover:bg-[var(--border-main)] rounded-lg transition-colors">
                                    Upload new photo
                                </button>
                                <p class="text-xs text-[var(--text-muted)] mt-2">Recommended: Square JPG, PNG. Max 10MB.
                                </p>
                            </div>
                            <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileSelect" />
                        </div>
                    </div>

                    <div v-if="selectedImage"
                        class="p-4 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl animate-fade-in">
                        <p class="text-xs font-semibold mb-2">Adjust Image</p>
                        <cropper ref="cropperRef" class="h-48 rounded-lg" :src="selectedImage"
                            :stencil-props="{ aspectRatio: 1 }" />
                        <div class="flex gap-3 mt-4">
                            <button @click="uploadCroppedImage"
                                class="flex-1 py-2 bg-[#0F172A] dark:bg-[var(--color-solar)] dark:text-black text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all shadow-sm">
                                Apply Crop
                            </button>
                            <button @click="selectedImage = null"
                                class="flex-1 py-2 border border-[var(--border-main)] bg-[var(--surface)] text-[var(--text-main)] text-sm font-semibold rounded-lg hover:bg-[var(--bg-app)] transition-all">
                                Cancel
                            </button>
                        </div>
                    </div>

                    <div v-if="!authStore.user?.googleId" class="pt-4 border-t border-[var(--border-main)]">
                        <h4 class="text-sm font-semibold mb-4">Change Password</h4>
                        <div class="space-y-4">
                            <div class="space-y-1.5">
                                <label class="text-xs font-medium text-[var(--text-muted)]">Current Password</label>
                                <input v-model="passwordData.currentPassword" type="password"
                                    class="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:border-[var(--color-solar)] focus:ring-2 focus:ring-[var(--color-solar)]/20 outline-none transition-all"
                                    placeholder="Enter your active password" />
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div class="space-y-1.5">
                                    <label class="text-xs font-medium text-[var(--text-muted)]">New Password</label>
                                    <input v-model="passwordData.newPassword" type="password"
                                        class="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:border-[var(--color-solar)] focus:ring-2 focus:ring-[var(--color-solar)]/20 outline-none transition-all" />
                                </div>
                                <div class="space-y-1.5">
                                    <label class="text-xs font-medium text-[var(--text-muted)]">Confirm Password</label>
                                    <input v-model="passwordData.confirmPassword" type="password"
                                        class="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:border-[var(--color-solar)] focus:ring-2 focus:ring-[var(--color-solar)]/20 outline-none transition-all" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="px-6 py-4 bg-[var(--bg-app)] border-t border-[var(--border-main)] flex justify-end gap-3">
                    <button @click="showSettingsModal = false"
                        class="px-5 py-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                        Cancel
                    </button>
                    <button v-if="!authStore.user?.googleId" @click="handlePasswordUpdate" :disabled="isSaving"
                        class="px-5 py-2 bg-[#0F172A] dark:bg-[var(--color-solar)] dark:text-black text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-px transition-all disabled:opacity-50 flex items-center gap-2">
                        <i v-if="isSaving" class="pi pi-spin pi-spinner text-xs"></i>
                        {{ isSaving ? 'Saving...' : 'Save Changes' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
    transition: all 0.2s ease;
}

.page-fade-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.page-fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.animate-fade-in {
    animation: fadeIn 0.2s ease-out;
}

.animate-zoom-in {
    animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes zoomIn {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
    }

    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}
</style>