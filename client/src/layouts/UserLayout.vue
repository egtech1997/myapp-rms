<script setup>
import { ref, reactive, inject } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const route = useRoute()
const authStore = useAuthStore();


const toast = inject('$toast');

// UI State
const showSettingsModal = ref(false)
const showUserDropdown = ref(false)
const uploading = ref(false)
const isSaving = ref(false)

// Cropping Logic
const fileInput = ref(null);
const selectedImage = ref(null);
const cropperRef = ref(null);

// Password Form
const passwordData = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

const navLinks = [
    { name: 'Dashboard', to: '/user/dashboard', icon: 'pi-home' },
    { name: 'My Applications', to: '/user/applications', icon: 'pi-folder-open' },
    { name: 'Job Vacancies', to: '/vacancies', icon: 'pi-megaphone' },
]

const triggerFileSelect = () => fileInput.value.click()

const onFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
        // --- NEW: SweetAlert Syntax ---
        toast.fire({ icon: 'error', title: 'File Too Large', text: 'Max size is 10MB' })
        return
    }

    if (file.type === 'image/gif') {
        uploadFile(file, false)
    } else {
        selectedImage.value = URL.createObjectURL(file)
    }
}

const uploadFile = async (fileOrBlob, isCropped = false) => {
    const formData = new FormData()
    const fileName = isCropped ? 'avatar.jpg' : fileOrBlob.name
    formData.append('avatar', fileOrBlob, fileName)

    uploading.value = true
    try {
        const { data } = await apiClient.patch('/auth/update-avatar', formData)
        authStore.user = {
            ...data.user,
            avatarUrl: `${data.user.avatarUrl}?t=${Date.now()}`
        }
        // --- NEW: SweetAlert Syntax ---
        toast.fire({ icon: 'success', title: 'Success', text: 'Profile picture updated' })
        selectedImage.value = null
    } catch (err) {
        // --- NEW: SweetAlert Syntax ---
        toast.fire({ icon: 'error', title: 'Upload Failed', text: err.response?.data?.message || 'Server error' })
    } finally {
        uploading.value = false
        if (fileInput.value) fileInput.value.value = ''
    }
}

const uploadCroppedImage = () => {
    const result = cropperRef.value.getResult()
    if (!result?.canvas) return
    result.canvas.toBlob(blob => blob && uploadFile(blob, true), 'image/jpeg', 0.9)
}

const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        // --- NEW: SweetAlert Syntax ---
        toast.fire({ icon: 'warning', title: 'Validation Error', text: 'Passwords do not match' })
        return
    }

    isSaving.value = true
    try {
        await apiClient.patch('/auth/update-password', {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
        })
        // --- NEW: SweetAlert Syntax ---
        toast.fire({ icon: 'success', title: 'Success', text: 'Password updated' })
        showSettingsModal.value = false
        Object.assign(passwordData, { currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
        // --- NEW: SweetAlert Syntax ---
        toast.fire({ icon: 'error', title: 'Update Failed', text: err.response?.data?.message || 'Update failed' })
    } finally {
        isSaving.value = false
    }
}
</script>
<template>
    <div class="min-h-screen flex flex-col font-inter text-sm text-slate-600 antialiased"
        style="background-image: linear-gradient(rgba(248, 250, 252, 0.50), rgba(248, 250, 252, 0.50)), url('https://image2url.com/r2/default/images/1772169455473-54bb76c7-1d32-4152-8411-9e38daab5695.png'); background-size: cover; background-position: center; background-attachment: fixed; background-repeat: no-repeat;">

        <header
            class="sticky top-0 z-30 bg-[var(--surface-0)]/90 backdrop-blur-md shadow-[var(--shadow-sm)] h-[64px] flex items-center px-4 sm:px-6 lg:px-8 justify-between transition-all">
            <div class="flex items-center gap-8">
                <router-link to="/" class="flex items-center gap-3 group">
                    <div
                        class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-[var(--shadow-primary)] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                        <i class="pi pi-file-edit text-white text-lg"></i>
                    </div>
                    <span class="text-[15px] font-bold tracking-tight text-slate-800">
                        RSP <span class="text-sky-600 font-medium">Portal</span>
                    </span>
                </router-link>

                <nav class="hidden md:flex items-center gap-1">
                    <a v-for="link in navLinks" :key="link.name" @click.prevent="handleNavigation(link)"
                        class="cursor-pointer flex items-center gap-2 px-4 h-14 rounded-md text-slate-500 font-semibold text-[13px] transition-all hover:text-sky-600 hover:bg-slate-50"
                        :class="{ 'text-sky-600 bg-sky-50/50': route.path === link.to && link.to }">
                        <i class="pi text-[11px]" :class="link.icon"></i>
                        <span>{{ link.name }}</span>
                    </a>
                </nav>
            </div>

            <div class="flex items-center gap-3">
                <Button icon="pi pi-bell" severity="secondary" variant="text" size="small"
                    class="!w-9 !h-9 rounded-full" />

                <div class="h-8 w-px bg-slate-200"></div>

                <div class="relative group">
                    <button
                        class="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                        <Avatar :image="authStore.user?.avatarUrl" shape="circle"
                            class="!w-8 !h-8 border border-slate-200 shadow-sm" />
                        <i class="pi pi-chevron-down text-[10px] text-slate-400"></i>
                    </button>

                    <div
                        class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1 group-hover:translate-y-0 transition-all duration-200 z-50 overflow-hidden">
                        <div class="p-4 border-b border-slate-50 bg-slate-50/50">
                            <p class="text-[13px] font-bold text-slate-800 truncate capitalize">{{
                                authStore.user?.username }}</p>
                            <p class="text-[11px] text-slate-500 truncate">{{ authStore.user?.email }}</p>
                        </div>

                        <div class="p-1.5">
                            <button @click="showSettingsModal = true"
                                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-sky-600 transition-colors">
                                <i class="pi pi-cog text-[14px]"></i>
                                <span class="text-[12px] font-semibold">Settings</span>
                            </button>

                            <div class="h-px bg-slate-100 my-1"></div>

                            <button @click="authStore.logout"
                                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                                <i class="pi pi-power-off text-[14px]"></i>
                                <span class="text-[12px] font-bold">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <div class="bg-white/80 backdrop-blur-sm border-b border-slate-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
                <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Applicant Workspace</span>
                    <i class="pi pi-angle-right text-[8px]"></i>

                    <span class="text-sky-600">{{ $route.name || 'Overview' }}</span>

                </div>
            </div>
        </div>

        <main class="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
            <slot />
        </main>

        <Dialog v-model:visible="showSettingsModal" modal header="Account Settings" :style="{ width: '30rem' }"
            class="font-inter">
            <div v-if="authStore.user">
                <div v-if="selectedImage" class="space-y-4 pt-2">
                    <div class="border rounded-xl overflow-hidden bg-slate-900 h-64 shadow-inner">
                        <cropper ref="cropperRef" class="h-full" :src="selectedImage"
                            :stencil-props="{ aspectRatio: 1 }" />
                    </div>
                    <div class="flex justify-end gap-2">
                        <Button label="Cancel" severity="secondary" text @click="selectedImage = null"
                            class="!text-xs" />
                        <Button label="Upload Photo" :loading="uploading" severity="primary" @click="uploadCroppedImage"
                            class="!text-xs !bg-sky-600 !border-none px-6" />
                    </div>
                </div>

                <div v-else class="space-y-6 pt-4">
                    <div class="flex flex-col items-center gap-3">
                        <div class="relative group cursor-pointer" @click="triggerFileSelect">
                            <Avatar :image="authStore.user?.avatarUrl" shape="circle"
                                class="!w-20 !h-20 border-2 border-white shadow-md bg-slate-100" />
                            <div
                                class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <i v-if="!uploading" class="pi pi-camera text-white"></i>
                                <i v-else class="pi pi-spin pi-spinner text-white"></i>
                            </div>
                        </div>
                        <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileSelect" />
                        <p class="text-[10px] font-bold text-slate-400 uppercase">
                            {{ uploading ? 'Uploading Animation...' : 'Change Profile Picture' }}
                        </p>
                    </div>

                    <div class="h-px bg-slate-100"></div>

                    <div class="space-y-4">
                        <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Security Settings</p>

                        <div v-if="authStore.user?.googleId"
                            class="p-4 bg-sky-50 rounded-xl border border-sky-100 flex items-start gap-3">
                            <i class="pi pi-google text-sky-600 mt-0.5"></i>
                            <p class="text-[11px] text-sky-700 leading-relaxed">
                                Your account is secured via Google. Passwords are managed in your Google security
                                settings.
                            </p>
                        </div>

                        <div v-else class="space-y-3">
                            <div class="flex flex-col gap-1.5">
                                <label class="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Current
                                    Password</label>
                                <InputText v-model="passwordData.currentPassword" type="password" size="small"
                                    class="!bg-slate-50" />
                            </div>
                            <div class="flex flex-col gap-1.5">
                                <label class="text-[11px] font-bold text-slate-500 uppercase tracking-tight">New
                                    Password</label>
                                <InputText v-model="passwordData.newPassword" type="password" size="small"
                                    class="!bg-slate-50" />
                            </div>
                            <div class="flex flex-col gap-1.5">
                                <label class="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Confirm New
                                    Password</label>
                                <InputText v-model="passwordData.confirmPassword" type="password" size="small"
                                    class="!bg-slate-50" />
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-2 pt-4">
                        <Button label="Close" severity="secondary" text @click="showSettingsModal = false"
                            class="!text-xs" />
                        <Button v-if="!authStore.user?.googleId" label="Update Security" :loading="isSaving"
                            severity="primary" @click="handlePasswordUpdate"
                            class="!text-xs !bg-sky-600 !border-none px-6" />
                    </div>
                </div>
            </div>
        </Dialog>

        <footer class="border-t border-slate-200 bg-white mt-auto">
            <div
                class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <p>© 2026 DepEd Guihulngan Division</p>
                <div class="flex gap-6">
                    <a href="#" class="hover:text-sky-600 transition-colors">Privacy</a>
                    <a href="#" class="hover:text-sky-600 transition-colors">Support</a>
                </div>
            </div>
        </footer>
    </div>
</template>

<style scoped>
@reference "@/assets/main.css";

.font-inter {
    font-family: 'Inter', sans-serif;
}
</style>