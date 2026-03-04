<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import apiClient from '@/api/axios'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const authStore = useAuthStore()
const toast = useToast()

const isCollapsed = ref(false)
const isHovered = ref(false)
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

const navGroups = [
    {
        title: 'Human Resource',
        items: [
            { label: 'Dashboard', icon: 'pi pi-chart-line', to: '/admin/dashboard' },
            { label: 'Job Positions', icon: 'pi pi-briefcase', to: '/admin/jobs' },
            { label: 'Applicants', icon: 'pi pi-users', to: '/admin/applicants' },
            { label: 'Rankings (CAL)', icon: 'pi pi-list', to: '/admin/rankings' }
        ]
    }
]

const triggerFileSelect = () => fileInput.value.click()

const onFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
        toast.add({ severity: 'error', summary: 'File too large', detail: 'Max 10MB', life: 3000 })
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
        toast.add({ severity: 'success', summary: 'Updated', detail: 'Avatar updated', life: 3000 })
        selectedImage.value = null
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Upload failed', life: 3000 })
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
        toast.add({ severity: 'success', summary: 'Password Updated', life: 3000 })
        showSettingsModal.value = false
        Object.assign(passwordData, { currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Update Failed', detail: err.response?.data?.message, life: 3000 })
    } finally {
        isSaving.value = false
    }
}
</script>

<template>
    <div class="flex h-screen bg-[var(--bg-app)] text-[var(--text-primary)] antialiased overflow-hidden">
        <Toast />

        <aside @mouseenter="isHovered = true" @mouseleave="isHovered = false"
            :class="[isCollapsed && !isHovered ? 'w-[72px]' : 'w-64']"
            class="flex flex-col shrink-0 transition-all duration-300 ease-in-out z-30 shadow-[var(--shadow-lg)] bg-[#0f172a]">

            <div class="h-[60px] flex items-center px-4 border-b border-white/5 bg-black/10">
                <div class="flex items-center gap-3 overflow-hidden">
                    <div
                        class="min-w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-[var(--shadow-primary)] flex items-center justify-center transition-transform hover:scale-105 cursor-pointer">
                        <i class="pi pi-shield text-white text-lg"></i>
                    </div>
                    <span v-show="!isCollapsed || isHovered"
                        class="text-white font-bold uppercase tracking-wider text-xs whitespace-nowrap">
                        HRMS Admin
                    </span>
                </div>
            </div>

            <nav
                class="flex-1 py-6 px-3 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div v-for="group in navGroups" :key="group.title">
                    <p v-show="!isCollapsed || isHovered"
                        class="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">
                        {{ group.title }}
                    </p>
                    <div class="space-y-1">
                        <router-link v-for="item in group.items" :key="item.to" :to="item.to"
                            class="group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5 aria-[current=page]:bg-indigo-500/15 aria-[current=page]:text-indigo-400 aria-[current=page]:font-semibold relative overflow-hidden">
                            <i :class="item.icon"
                                class="text-lg min-w-[24px] text-center transition-transform group-hover:scale-110"></i>
                            <span v-show="!isCollapsed || isHovered" class="truncate text-sm tracking-wide">{{
                                item.label }}</span>
                            <div
                                class="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-r-full opacity-0 aria-[current=page]:opacity-100 transition-opacity">
                            </div>
                        </router-link>
                    </div>
                </div>
            </nav>
        </aside>

        <div class="flex-1 flex flex-col min-w-0">

            <header
                class="h-[60px] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] flex items-center justify-between px-6 sticky top-0 z-20">
                <div class="flex items-center gap-4">
                    <button @click="isCollapsed = !isCollapsed"
                        class="w-10 h-10 grid place-items-center rounded-xl hover:bg-[var(--surface-50)] text-[var(--text-secondary)] transition-colors">
                        <i class="pi pi-bars text-lg"></i>
                    </button>
                    <div
                        class="hidden sm:flex items-center text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        <span class="hover:text-indigo-600 transition-colors cursor-pointer">Admin</span>
                        <i class="pi pi-angle-right mx-2 text-[10px] opacity-50"></i>
                        <span class="text-[var(--text-primary)] font-extrabold">{{ $route.name || 'Overview' }}</span>
                    </div>
                </div>

                <div class="flex items-center gap-4">
                    <Button icon="pi pi-bell" variant="text" severity="secondary"
                        class="!w-10 !h-10 rounded-full hover:bg-[var(--surface-50)] text-[var(--text-secondary)]" />
                    <div class="h-6 w-px bg-[var(--border-color)]"></div>

                    <div class="relative group">
                        <button
                            class="flex items-center gap-3 rounded-full hover:bg-[var(--surface-50)] py-1 pl-1 pr-3 transition-colors">
                            <Avatar :image="authStore.user?.avatarUrl" shape="circle" class="!w-9 !h-9 shadow-sm" />
                            <i class="pi pi-chevron-down text-xs text-[var(--text-secondary)] hidden sm:block"></i>
                        </button>

                        <div
                            class="absolute right-0 mt-3 w-56 rounded-2xl bg-[var(--surface-0)] shadow-[var(--shadow-lg)] border border-[var(--border-color)] opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-200 z-50">
                            <div
                                class="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--surface-50)] rounded-t-2xl">
                                <p class="text-sm font-bold text-[var(--text-primary)] truncate">{{
                                    authStore.user?.username }}</p>
                                <p class="text-xs text-[var(--text-secondary)] truncate mt-0.5">{{ authStore.user?.email
                                    }}</p>
                            </div>
                            <div class="p-2 space-y-1">
                                <button @click="showSettingsModal = true"
                                    class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl hover:bg-[var(--surface-50)] text-[var(--text-primary)] transition-colors">
                                    <i class="pi pi-cog text-[var(--text-secondary)]"></i> Settings
                                </button>
                                <button @click="authStore.logout"
                                    class="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-xl text-rose-600 hover:bg-rose-50 transition-colors">
                                    <i class="pi pi-power-off"></i> Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main class="flex-1 overflow-y-auto p-6 md:p-8">
                <div class="max-w-7xl mx-auto">
                    <slot />
                </div>
            </main>
        </div>

        <Dialog v-model:visible="showSettingsModal" modal header="Account Settings" :style="{ width: '28rem' }" :pt="{
            root: 'rounded-2xl border-none shadow-[var(--shadow-lg)] overflow-hidden',
            header: 'px-6 pt-6 pb-4 border-b border-[var(--border-color)] bg-[var(--surface-0)]',
            title: 'font-display font-bold text-lg',
            content: 'p-6 bg-[var(--surface-0)]'
        }">

            <div v-if="selectedImage" class="space-y-6 animate-fade-in">
                <div class="flex flex-col gap-2">
                    <p class="text-sm font-medium text-[var(--text-secondary)]">Adjust your profile picture</p>
                    <div
                        class="border border-[var(--border-color)] rounded-2xl overflow-hidden bg-slate-900 h-64 shadow-inner">
                        <cropper ref="cropperRef" class="h-full" :src="selectedImage"
                            :stencil-props="{ aspectRatio: 1 }" />
                    </div>
                </div>
                <div class="flex justify-end gap-3 pt-2">
                    <Button label="Cancel" severity="secondary" text @click="selectedImage = null" />
                    <Button label="Apply & Upload" :loading="uploading" @click="uploadCroppedImage" />
                </div>
            </div>

            <div v-else class="space-y-8">
                <div class="flex flex-col items-center gap-4">
                    <div class="relative group cursor-pointer" @click="triggerFileSelect">
                        <Avatar :image="authStore.user?.avatarUrl" shape="circle"
                            class="!w-28 !h-28 border-4 border-[var(--surface-0)] shadow-[var(--shadow-md)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-lg)]" />
                        <div
                            class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                            <i v-if="!uploading" class="pi pi-camera text-white text-2xl drop-shadow-md"></i>
                            <i v-else class="pi pi-spin pi-spinner text-white text-2xl"></i>
                        </div>
                    </div>
                    <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileSelect" />
                    <p class="text-xs font-bold text-indigo-500 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                        @click="triggerFileSelect">
                        {{ uploading ? 'Uploading...' : 'Change Photo' }}
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
                                Your account is secured via Google. Manage your password in your Google security
                                settings.
                            </p>
                        </div>
                    </div>

                    <div v-else class="space-y-4">
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-semibold text-[var(--text-secondary)]">Current Password</label>
                            <InputText v-model="passwordData.currentPassword" type="password" class="w-full" />
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-semibold text-[var(--text-secondary)]">New Password</label>
                            <InputText v-model="passwordData.newPassword" type="password" class="w-full" />
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-semibold text-[var(--text-secondary)]">Confirm Password</label>
                            <InputText v-model="passwordData.confirmPassword" type="password" class="w-full" />
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                    <Button label="Cancel" severity="secondary" text @click="showSettingsModal = false" />
                    <Button v-if="!authStore.user?.googleId" label="Save Changes" :loading="isSaving"
                        @click="handlePasswordUpdate" />
                </div>
            </div>
        </Dialog>
    </div>
</template>