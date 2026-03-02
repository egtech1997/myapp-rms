<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import apiClient from '@/api/axios'

// 1. Cropper Imports
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const authStore = useAuthStore()
const toast = useToast()

// UI States
const isCollapsed = ref(true)
const isHovered = ref(false)
const showSettingsModal = ref(false)
const uploading = ref(false)
const isSaving = ref(false)

// 2. Cropping Logic States
const fileInput = ref(null)
const selectedImage = ref(null)
const cropperRef = ref(null)

// Forms
const passwordData = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

const navGroups = [
    {
        title: 'Management',
        items: [
            { label: 'Analytics', icon: 'pi pi-chart-line', to: '/admin/dashboard' },
          { label: 'Bulletin', icon: 'pi pi-chart-line', to: '/admin/bulletin' },
            { label: 'Jobs', icon: 'pi pi-briefcase', to: '/admin/jobs' },
            { label: 'Applicants', icon: 'pi pi-users', to: '/admin/applicants' },
            { label: 'Accounts', icon: 'pi pi-chart-line', to: '/admin/accounts' },
        ],
    },
]

const triggerFileSelect = () => fileInput.value.click()

/**
 * STEP 1: SMART SELECTION
 * Detects if the file is a GIF (Direct Upload) or Static Image (Open Cropper)
 */
const onFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Limit set to 10MB to support high-quality animated GIFs
    if (file.size > 10 * 1024 * 1024) {
        toast.add({ severity: 'error', summary: 'File Too Large', detail: 'Max size is 10MB', life: 3000 })
        return
    }

    if (file.type === 'image/gif') {
        // Upload immediately to preserve "moving particles" animation
        uploadFile(file, false)
    } else {
        // Open the cropper for static JPG/PNG/WEBP
        selectedImage.value = URL.createObjectURL(file)
    }
}

/**
 * STEP 2: UPLOAD LOGIC
 * Unified function to handle both raw files (GIFs) and cropped Blobs
 */
const uploadFile = async (fileOrBlob, isCropped = false) => {
    const formData = new FormData()

    // Using the original name for GIFs or 'avatar.jpg' for cropped blobs
    // Adding the filename (3rd param) is key for Multer field identification
    const fileName = isCropped ? 'avatar.jpg' : (fileOrBlob.name || 'avatar.gif')
    formData.append('avatar', fileOrBlob, fileName)

    uploading.value = true
    try {
        // We omit manual Content-Type headers to let the browser set the boundary
        const { data } = await apiClient.patch('/auth/update-avatar', formData)

        if (data.status === 'success') {
            updateUserInStore(data.user)
        } else {
            throw new Error("Server responded with failure")
        }
    } catch (err) {
        console.error("Upload Error:", err.response?.data || err.message)
        toast.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: err.response?.data?.message || 'Check connection or file size',
            life: 3000
        })
    } finally {
        uploading.value = false
        // Reset file input so the same file can be re-selected if necessary
        if (fileInput.value) fileInput.value.value = ''
    }
}

/**
 * TRIGGERED BY BUTTON IN MODAL (Static Images)
 */
const uploadCroppedImage = async () => {
    const result = cropperRef.value.getResult()
    if (!result || !result.canvas) return

    result.canvas.toBlob((blob) => {
        if (blob) uploadFile(blob, true)
    }, 'image/jpeg', 0.9)
}

/**
 * SUCCESS HANDLER
 */
const updateUserInStore = (userData) => {
    const updatedUser = { ...userData }
    // Cache-buster (?t=...) forces the browser to refresh the image
    updatedUser.avatarUrl = `${updatedUser.avatarUrl}?t=${Date.now()}`

    authStore.user = updatedUser

    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Avatar updated successfully',
        life: 3000
    })

    if (selectedImage.value) URL.revokeObjectURL(selectedImage.value)
    selectedImage.value = null
}

// --- Password Logic ---
const handlePasswordUpdate = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
        toast.add({ severity: 'warn', detail: 'Please fill in all fields', life: 3000 })
        return
    }

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

        toast.add({ severity: 'success', summary: 'Security Updated', detail: 'Password changed successfully', life: 3000 })
        showSettingsModal.value = false
        Object.assign(passwordData, { currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
        const message = err.response?.data?.message || 'Check your current password'
        toast.add({ severity: 'error', summary: 'Update Failed', detail: message, life: 4000 })
    } finally {
        isSaving.value = false
    }
}
</script>

<template>
    <div class="flex h-screen bg-corp-bg font-inter text-[13px] antialiased text-slate-600">
        <Toast />

        <aside @mouseenter="isHovered = true" @mouseleave="isHovered = false"
            :class="[isCollapsed && !isHovered ? 'w-[68px]' : 'w-64']"
            class="bg-corp-sidebar flex flex-col shrink-0 transition-all duration-300 ease-out z-30 shadow-2xl">

            <div class="h-14 flex items-center px-4 border-b border-white/5 bg-black/20">
                <div class="flex items-center gap-3 overflow-hidden">
                    <div
                        class="min-w-9 h-9 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-lg flex items-center justify-center shadow">
                        <i class="pi pi-prime text-white"></i>
                    </div>
                    <span v-show="!isCollapsed || isHovered"
                        class="text-white font-bold uppercase tracking-wide text-xs whitespace-nowrap">
                        RMS Portal
                    </span>
                </div>
            </div>

            <nav class="flex-1 py-4 px-3 space-y-6 overflow-y-auto scrollbar-hide">
                <div v-for="group in navGroups" :key="group.title">
                    <p v-show="!isCollapsed || isHovered"
                        class="px-3 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-3">
                        {{ group.title }}
                    </p>
                    <div class="space-y-1">
                        <router-link v-for="item in group.items" :key="item.to" :to="item.to"
                            class="group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/10 aria-[current=page]:bg-gradient-to-r aria-[current=page]:from-sky-600/20 aria-[current=page]:to-indigo-600/20 aria-[current=page]:text-sky-400 aria-[current=page]:font-semibold">
                            <i :class="item.icon"
                                class="text-base min-w-[22px] text-center group-hover:scale-110 transition-transform"></i>
                            <span v-show="!isCollapsed || isHovered" class="truncate">{{ item.label }}</span>
                        </router-link>
                    </div>
                </div>
            </nav>
        </aside>

        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
            <header
                class="h-14 bg-white border-b border-corp-border flex items-center justify-between px-4 sticky top-0 z-20 backdrop-blur">
                <div class="flex items-center gap-3">
                    <button @click="isCollapsed = !isCollapsed"
                        class="w-9 h-9 grid place-items-center rounded-lg hover:bg-slate-100 text-slate-500 transition">
                        <i class="pi pi-bars"></i>
                    </button>
                    <div
                        class="hidden sm:flex items-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <span class="hover:text-sky-600 cursor-pointer">Admin</span>
                        <i class="pi pi-angle-right mx-2 text-[8px]"></i>
                        <span class="text-slate-700 font-extrabold">{{ $route.name || 'Overview' }}</span>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <Button icon="pi pi-bell" variant="text" severity="secondary" size="small"
                        class="!w-9 !h-9 rounded-full hover:bg-slate-100" />
                    <div class="h-5 w-px bg-slate-200"></div>

                    <div class="relative group">
                        <button class="flex items-center gap-2 rounded-full hover:bg-slate-50 p-1 transition">
                            <Avatar :image="authStore.user?.avatarUrl" shape="circle"
                                class="!w-8 !h-8 border border-slate-200" />
                            <i class="pi pi-chevron-down text-[10px] text-slate-400 hidden sm:block"></i>
                        </button>

                        <div
                            class="absolute right-0 mt-2 w-44 rounded-xl bg-white shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50">
                            <div class="px-3 py-2 border-b border-slate-100">
                                <p class="text-xs font-semibold text-slate-800 truncate">{{ authStore.user?.username }}
                                </p>
                                <p class="text-[10px] text-slate-400 truncate">{{ authStore.user?.email }}</p>
                            </div>
                            <button @click="showSettingsModal = true"
                                class="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 text-slate-600">
                                <i class="pi pi-cog"></i> Settings
                            </button>
                            <div class="h-px bg-slate-100 my-1"></div>
                            <button @click="authStore.logout"
                                class="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                                <i class="pi pi-power-off"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main class="flex-1 overflow-y-auto bg-corp-bg p-6">
                <div class="max-w-7xl mx-auto">
                    <slot />
                </div>
            </main>
        </div>

        <Dialog v-model:visible="showSettingsModal" modal header="Account Settings" :style="{ width: '32rem' }"
            class="font-inter" :pt="{ header: 'border-b border-slate-100 pb-4', content: 'pt-6' }">

            <div v-if="selectedImage" class="space-y-6">
                <div class="flex flex-col gap-2">
                    <p class="text-xs font-semibold text-slate-700">Adjust your profile picture</p>
                    <div class="border rounded-xl overflow-hidden bg-slate-900 h-64 shadow-inner">
                        <cropper ref="cropperRef" class="h-full" :src="selectedImage" :stencil-props="{
                            aspectRatio: 1,
                            previewClass: 'cropper-preview'
                        }" />
                    </div>
                </div>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" severity="secondary" text @click="selectedImage = null" class="!text-xs" />
                    <Button label="Apply & Upload" :loading="uploading" severity="primary" @click="uploadCroppedImage"
                        class="!text-xs !bg-sky-600 !border-none px-6" />
                </div>
            </div>

            <div v-else class="space-y-8">
                <div class="flex flex-col items-center gap-4">
                    <div class="relative group cursor-pointer" @click="triggerFileSelect">
                        <Avatar :image="authStore.user?.avatarUrl" shape="circle"
                            class="!w-24 !h-24 border-2 border-slate-100 shadow-sm bg-slate-50" />
                        <div
                            class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <i v-if="!uploading" class="pi pi-camera text-white text-xl"></i>
                            <i v-else class="pi pi-spin pi-spinner text-white text-xl"></i>
                        </div>
                    </div>
                    <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileSelect" />
                    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        {{ uploading ? 'Uploading Animation...' : 'Click to change photo' }}
                    </p>
                </div>

                <div class="h-px bg-slate-100"></div>

                <div class="space-y-4">
                    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Security</p>

                    <div v-if="authStore.user?.googleId"
                        class="p-4 bg-sky-50 rounded-xl border border-sky-100 flex items-start gap-3">
                        <i class="pi pi-google text-sky-600 mt-0.5"></i>
                        <div>
                            <p class="text-[12px] font-bold text-sky-900 leading-none">Google Account</p>
                            <p class="text-[11px] text-sky-700 leading-relaxed mt-2">
                                Your account is secured via Google. Manage your password in your Google security
                                settings.
                            </p>
                        </div>
                    </div>

                    <div v-else class="space-y-3">
                        <div class="flex flex-col gap-1">
                            <label class="text-[11px] font-semibold text-slate-500">Current Password</label>
                            <InputText v-model="passwordData.currentPassword" type="password" size="small"
                                class="!bg-slate-50" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[11px] font-semibold text-slate-500">New Password</label>
                            <InputText v-model="passwordData.newPassword" type="password" size="small"
                                class="!bg-slate-50" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[11px] font-semibold text-slate-500">Confirm New Password</label>
                            <InputText v-model="passwordData.confirmPassword" type="password" size="small"
                                class="!bg-slate-50" />
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-2 pt-2">
                    <Button label="Cancel" severity="secondary" text @click="showSettingsModal = false"
                        class="!text-xs" />
                    <Button v-if="!authStore.user?.googleId" label="Save Changes" :loading="isSaving" severity="primary"
                        @click="handlePasswordUpdate" class="!text-xs !bg-sky-600 !border-none px-6" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
@reference "@/assets/main.css";

.font-inter {
    font-family: Inter, system-ui, sans-serif;
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
</style>