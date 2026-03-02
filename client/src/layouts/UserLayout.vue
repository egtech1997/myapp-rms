<script setup>
import { ref, reactive } from 'vue'; // FIXED: Added missing 'reactive' import
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'primevue/usetoast';
import { useRouter, useRoute } from 'vue-router'; 
import apiClient from '@/api/axios';

// Cropper Imports
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

const authStore = useAuthStore();
const toast = useToast();
const router = useRouter();
const route = useRoute();

// UI States
const showSettingsModal = ref(false);
const uploading = ref(false);
const isSaving = ref(false);

// Cropping Logic
const fileInput = ref(null);
const selectedImage = ref(null);
const cropperRef = ref(null);

// Password Form
const passwordData = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
});

// Navigation Links
const navLinks = [
    { name: 'Dashboard', to: '/user/dashboard', icon: 'pi-home' },
    { name: 'Applications', to: '/user/applications', icon: 'pi-folder-open' },
    { name: 'Find Jobs', action: 'jobs', icon: 'pi-search' }, 
];

// Navigation Handler
const handleNavigation = async (link) => {
    if (link.to) {
        router.push(link.to);
    } else if (link.action === 'jobs') {
        await router.push('/');
        setTimeout(() => {
            const jobSection = document.getElementById('jobs');
            if (jobSection) {
                jobSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 150); 
    }
};

const triggerFileSelect = () => fileInput.value.click();

const onFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        toast.add({ severity: 'error', summary: 'File Too Large', detail: 'Max size is 10MB', life: 3000 });
        return;
    }

    if (file.type === 'image/gif') {
        uploadOriginalFile(file);
    } else {
        selectedImage.value = URL.createObjectURL(file);
    }
};

const uploadOriginalFile = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file, file.name);

    uploading.value = true;
    try {
        const { data } = await apiClient.patch('/auth/update-avatar', formData);
        if (data.status === 'success') {
            updateUserInStore(data.user);
        }
    } catch (err) {
        console.error("Upload Error:", err.response?.data || err.message);
        toast.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: err.response?.data?.message || 'Server connection error'
        });
    } finally {
        uploading.value = false;
        if (fileInput.value) fileInput.value.value = '';
    }
};

const uploadCroppedImage = async () => {
    const result = cropperRef.value.getResult();
    if (!result || !result.canvas) return;

    result.canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.jpg');

        uploading.value = true;
        try {
            const { data } = await apiClient.patch('/auth/update-avatar', formData);
            if (data.status === 'success') {
                updateUserInStore(data.user);
            }
        } catch (err) {
            toast.add({ severity: 'error', summary: 'Upload Failed', detail: err.response?.data?.message });
        } finally {
            uploading.value = false;
        }
    }, 'image/jpeg', 0.9);
};

// CENTRAL STORE UPDATE
const updateUserInStore = (userData) => {
    const updatedUser = { ...userData };
    updatedUser.avatarUrl = `${updatedUser.avatarUrl}?t=${Date.now()}`;
    authStore.user = updatedUser;

    toast.add({ severity: 'success', summary: 'Success', detail: 'Profile picture updated', life: 3000 });
    selectedImage.value = null;
};

const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.add({ severity: 'error', detail: 'Passwords do not match', life: 3000 });
        return;
    }

    isSaving.value = true;
    try {
        await apiClient.patch('/auth/update-password', {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
        });

        toast.add({ severity: 'success', summary: 'Success', detail: 'Password updated', life: 3000 });
        showSettingsModal.value = false;
        Object.assign(passwordData, { currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
        toast.add({ severity: 'error', detail: err.response?.data?.message || 'Update failed', life: 4000 });
    } finally {
        isSaving.value = false;
    }
};
</script>

<template>
    <div class="min-h-screen flex flex-col font-inter text-sm text-slate-600 antialiased"
         style="background-image: linear-gradient(rgba(248, 250, 252, 0.50), rgba(248, 250, 252, 0.50)), url('https://image2url.com/r2/default/images/1772169455473-54bb76c7-1d32-4152-8411-9e38daab5695.png'); background-size: cover; background-position: center; background-attachment: fixed; background-repeat: no-repeat;">
        
        <Toast></Toast>

        <header class="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 h-14 flex items-center px-4 sm:px-6 lg:px-8 justify-between">
            <div class="flex items-center gap-6">
                <router-link to="/" class="flex items-center gap-2.5 group">
                    <img src="https://i.ibb.co/7dHhWCpp/images.png" alt="Logo" class="w-8 h-8 object-contain transition-transform group-hover:scale-105" />
                    
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

            <div class="flex items-center gap-2.5">
                <Button icon="pi pi-bell" severity="secondary" variant="text" size="small"
                    class="!w-9 !h-9 rounded-full hover:bg-slate-100"></Button>

                <div class="h-5 w-px bg-slate-200 mx-1"></div>

                <div class="relative group">
                    <button class="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition">
                        <div class="hidden sm:block text-right leading-tight">
                            <p class="text-[13px] font-semibold text-slate-800 capitalize">
                                {{ authStore.user?.username || 'Applicant' }}
                            </p>
                            <p class="text-[11px] text-slate-400 uppercase tracking-wide">
                                Candidate
                            </p>
                        </div>

                        <Avatar
                            :image="authStore.user?.avatarUrl || `https://ui-avatars.com/api/?name=${authStore.user?.username}`"
                            shape="circle" class="!w-9 !h-9 border-2 border-white shadow-sm ring-1 ring-slate-200"></Avatar>

                        <i class="pi pi-chevron-down text-[11px] text-slate-400 hidden sm:block"></i>
                    </button>

                    <div class="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50">
                        <div class="grid grid-cols-2 gap-2">
                            <router-link to="/user/profile"
                                class="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-slate-50 transition">
                                <i class="pi pi-user text-sky-600 mb-1 text-lg"></i>
                                <span class="text-[11px] font-bold uppercase text-slate-700">Profile</span>
                            </router-link>

                            <router-link to="/user/applications"
                                class="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-slate-50 transition">
                                <i class="pi pi-copy text-emerald-600 mb-1 text-lg"></i>
                                <span class="text-[11px] font-bold uppercase text-slate-700">Status</span>
                            </router-link>

                            <router-link to="/settings"
                                class="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-slate-50 transition">
                                <i class="pi pi-cog text-slate-500 mb-1 text-lg"></i>
                                <span class="text-[11px] font-bold uppercase text-slate-700">Settings</span>
                            </router-link>

                            <button @click="authStore.logout"
                                class="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-red-50 transition">
                                <i class="pi pi-power-off text-red-600 mb-1 text-lg"></i>
                                <span class="text-[11px] font-bold uppercase text-red-600">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <div class="bg-white/90 backdrop-blur border-b border-slate-200/60">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    <span>Candidate Workspace</span>
                    <i class="pi pi-angle-right text-[8px]"></i>
                    <span class="text-sky-600">{{ route.name || 'Overview' }}</span>
                </div>
            </div>
        </div>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full relative z-10">
            <slot></slot>
        </main>

        <footer class="border-t border-slate-200 bg-white">
            <div
                class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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

:deep(.p-button.p-button-sm) {
    @apply !text-[11px] !py-1.5 !px-3;
}
</style>