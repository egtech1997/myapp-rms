<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import apiClient from '@/api/axios'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const authStore = useAuthStore()
const toast = useToast()

const showSettingsModal = ref(false)
const uploading = ref(false)
const isSaving = ref(false)

const fileInput = ref(null)
const selectedImage = ref(null)
const cropperRef = ref(null)

const passwordData = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

const navLinks = [
    { name: 'Dashboard', to: '/user/dashboard', icon: 'pi-home' },
    { name: 'My Applications', to: '/user/applications', icon: 'pi-folder-open' },
    { name: 'Bulletin Board', to: '/vacancies', icon: 'pi-megaphone' },
]

const triggerFileSelect = () => fileInput.value.click()

const onFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
        toast.add({ severity: 'error', summary: 'File Too Large', detail: 'Max size is 10MB', life: 3000 })
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
        toast.add({ severity: 'success', summary: 'Success', detail: 'Profile picture updated', life: 3000 })
        selectedImage.value = null
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Upload Failed', detail: err.response?.data?.message || 'Server error', life: 3000 })
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
        toast.add({ severity: 'error', detail: 'Passwords do not match', life: 3000 })
        return
    }

    isSaving.value = true
    try {
        await apiClient.patch('/auth/update-password', {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
        })
        toast.add({ severity: 'success', summary: 'Success', detail: 'Password updated', life: 3000 })
        showSettingsModal.value = false
        Object.assign(passwordData, { currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
        toast.add({ severity: 'error', detail: err.response?.data?.message || 'Update failed', life: 4000 })
    } finally {
        isSaving.value = false
    }
}
</script>

<template>
    <div
        class="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-900">
        <Toast />

        <header
            class="sticky top-0 z-30 bg-[var(--surface-0)]/90 backdrop-blur-md shadow-[var(--shadow-sm)] h-[64px] flex items-center px-4 sm:px-6 lg:px-8 justify-between transition-all">
            <div class="flex items-center gap-8">
                <router-link to="/" class="flex items-center gap-3 group">
                    <div
                        class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-[var(--shadow-primary)] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                        <i class="pi pi-file-edit text-white text-lg"></i>
                    </div>
                    <span class="text-lg font-display font-bold tracking-tight text-[var(--text-primary)]">
                        RSP <span class="text-indigo-600">Portal</span>
                    </span>
                </router-link>

                <nav class="hidden md:flex items-center gap-2 h-full">
                    <router-link v-for="link in navLinks" :key="link.to" :to="link.to"
                        class="relative flex items-center gap-2 px-4 h-[64px] text-[var(--text-secondary)] font-medium text-sm transition-colors hover:text-indigo-600 hover:bg-[var(--surface-50)] aria-[current=page]:text-indigo-600 aria-[current=page]:font-semibold overflow-hidden group">
                        <i class="pi text-sm transition-transform group-hover:-translate-y-0.5" :class="link.icon"></i>
                        <span>{{ link.name }}</span>
                        <div
                            class="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full scale-x-0 opacity-0 aria-[current=page]:scale-x-100 aria-[current=page]:opacity-100 transition-all duration-300 origin-center">
                        </div>
                    </router-link>
                </nav>
            </div>

            <div class="flex items-center gap-4">
                <Button icon="pi pi-bell" severity="secondary" variant="text"
                    class="!w-10 !h-10 rounded-full hover:bg-[var(--surface-50)] text-[var(--text-secondary)] transition-colors" />
                <div class="h-6 w-px bg-[var(--border-color)]"></div>

                <div class="relative group">
                    <button
                        class="flex items-center gap-3 p-1 pr-4 rounded-full hover:bg-[var(--surface-50)] transition-colors">
                        <Avatar :image="authStore.user?.avatarUrl" shape="circle"
                            class="!w-9 !h-9 border-2 border-[var(--surface-0)] shadow-sm" />
                        <i
                            class="pi pi-chevron-down text-xs text-[var(--text-secondary)] hidden sm:block transition-transform group-hover:rotate-180 duration-300"></i>
                    </button>

                    <div
                        class="absolute right-0 mt-3 w-60 bg-[var(--surface-0)] rounded-2xl shadow-[var(--shadow-lg)] border border-[var(--border-color)] opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-200 z-50 overflow-hidden">
                        <div class="p-4 border-b border-[var(--border-color)] bg-[var(--surface-50)]">
                            <p class="text-sm font-bold text-[var(--text-primary)] truncate capitalize">{{
                                authStore.user?.username }}</p>
                            <p class="text-xs text-[var(--text-secondary)] truncate mt-0.5">{{ authStore.user?.email }}
                            </p>
                        </div>
                        <div class="p-2 space-y-1">
                            <button @click="showSettingsModal = true"
                                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-50)] hover:text-[var(--text-primary)] transition-colors">
                                <i class="pi pi-cog text-base"></i>
                                <span class="text-sm font-medium">Account Settings</span>
                            </button>
                            <button @click="authStore.logout"
                                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                <i class="pi pi-power-off text-base"></i>
                                <span class="text-sm font-bold">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <div class="bg-[var(--surface-0)] border-b border-[var(--border-color)] shadow-sm relative z-20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div
                    class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)]">
                    <span>Applicant Workspace</span>
                    <i class="pi pi-angle-right text-[10px] opacity-50"></i>
                    <span class="text-indigo-600">{{ $route.name || 'Overview' }}</span>
                </div>
            </div>
        </div>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
            <slot />
        </main>

        <footer class="mt-auto pb-6">
            <div
                class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-[var(--border-color)] flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
                <p>© 2026 DepEd Guihulngan Division SDO</p>
                <div class="flex gap-6">
                    <a href="#" class="hover:text-indigo-600 transition-colors">Privacy Policy</a>
                    <a href="#" class="hover:text-indigo-600 transition-colors">Applicant Support</a>
                </div>
            </div>
        </footer>

        <Dialog v-model:visible="showSettingsModal" modal header="Account Settings" :style="{ width: '28rem' }" :pt="{
            root: 'rounded-2xl border-none shadow-[var(--shadow-lg)] overflow-hidden',
            header: 'px-6 pt-6 pb-4 border-b border-[var(--border-color)] bg-[var(--surface-0)]',
            title: 'font-display font-bold text-lg',
            content: 'p-6 bg-[var(--surface-0)]'
        }">

            <div v-if="authStore.user">
                <div v-if="selectedImage" class="space-y-6 animate-fade-in">
                    <div
                        class="border border-[var(--border-color)] rounded-2xl overflow-hidden bg-slate-900 h-64 shadow-inner">
                        <cropper ref="cropperRef" class="h-full" :src="selectedImage"
                            :stencil-props="{ aspectRatio: 1 }" />
                    </div>
                    <div class="flex justify-end gap-3">
                        <Button label="Cancel" severity="secondary" text @click="selectedImage = null" />
                        <Button label="Upload Photo" :loading="uploading" @click="uploadCroppedImage" />
                    </div>
                </div>

                <div v-else class="space-y-8">
                    <div class="flex flex-col items-center gap-4">
                        <div class="relative group cursor-pointer" @click="triggerFileSelect">
                            <Avatar :image="authStore.user?.avatarUrl" shape="circle"
                                class="!w-24 !h-24 border-4 border-[var(--surface-0)] shadow-[var(--shadow-md)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-lg)]" />
                            <div
                                class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <i v-if="!uploading" class="pi pi-camera text-white text-2xl drop-shadow-md"></i>
                                <i v-else class="pi pi-spin pi-spinner text-white text-2xl"></i>
                            </div>
                        </div>
                        <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileSelect" />
                        <p class="text-xs font-bold text-indigo-500 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                            @click="triggerFileSelect">
                            {{ uploading ? 'Uploading...' : 'Change Profile Picture' }}
                        </p>
                    </div>

                    <div class="h-px bg-[var(--border-color)]"></div>

                    <div class="space-y-5">
                        <p class="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Security
                            Settings</p>

                        <div v-if="authStore.user?.googleId"
                            class="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4 shadow-sm">
                            <div class="bg-white p-2 rounded-xl shadow-sm">
                                <i class="pi pi-google text-indigo-600 text-lg"></i>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-indigo-900">Google Account</p>
                                <p class="text-xs text-indigo-700/80 leading-relaxed mt-1">
                                    Your account is secured via Google. Passwords are managed in your Google security
                                    settings.
                                </p>
                            </div>
                        </div>

                        <div v-else class="space-y-4">
                            <div class="flex flex-col gap-1.5">
                                <label class="text-xs font-semibold text-[var(--text-secondary)]">Current
                                    Password</label>
                                <InputText v-model="passwordData.currentPassword" type="password" class="w-full" />
                            </div>
                            <div class="flex flex-col gap-1.5">
                                <label class="text-xs font-semibold text-[var(--text-secondary)]">New Password</label>
                                <InputText v-model="passwordData.newPassword" type="password" class="w-full" />
                            </div>
                            <div class="flex flex-col gap-1.5">
                                <label class="text-xs font-semibold text-[var(--text-secondary)]">Confirm
                                    Password</label>
                                <InputText v-model="passwordData.confirmPassword" type="password" class="w-full" />
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                        <Button label="Close" severity="secondary" text @click="showSettingsModal = false" />
                        <Button v-if="!authStore.user?.googleId" label="Update Security" :loading="isSaving"
                            @click="handlePasswordUpdate" />
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>