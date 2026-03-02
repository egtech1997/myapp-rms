<script setup>
import UserLayout from '@/layouts/UserLayout.vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router'; 

const authStore = useAuthStore();
const router = useRouter(); 

// Updated function to navigate to the home page and scroll down to the #jobs section
const goToJobs = () => {
    router.push({ path: '/', hash: '#jobs' });
};
</script>

<template>
    <UserLayout class="profile-bg">
        <div class="bg-white border border-corp-border rounded-sm p-6 shadow-sm mb-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div class="flex items-center gap-5">
                    <div class="relative">
                        <img :src="authStore.user?.avatarUrl || `https://ui-avatars.com/api/?name=${authStore.user?.username}`"
                            class="w-16 h-16 rounded-full border-2 border-sky-100 shadow-sm" />
                        <div
                            class="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full">
                        </div>
                    </div>

                    <div class="space-y-1">
                        <h1 class="text-xl font-bold text-slate-800 tracking-tight">
                            Welcome back, {{ authStore.user?.username }}
                        </h1>
                        <p class="text-sm text-slate-500 font-inter">{{ authStore.user?.email }}</p>
                        <div class="flex items-center gap-2 mt-2">
                            <span
                                class="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-100">
                                Verified Applicant
                            </span>
                            <span class="text-[11px] text-slate-400 font-medium">Member since 2026</span>
                        </div>
                    </div>
                </div>

                <div class="flex gap-2">
                    <Button label="Edit Profile" icon="pi pi-user-edit" size="small" variant="outlined"
                        severity="secondary" class="!text-xs" />
                    
                    <Button 
                        label="View Vacancies" 
                        icon="pi pi-briefcase" 
                        size="small" 
                        class="!text-xs" 
                        @click="goToJobs" 
                    />
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="stat-card">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-8 h-8 rounded bg-sky-50 text-sky-600 flex items-center justify-center">
                        <i class="pi pi-clock text-sm"></i>
                    </div>
                    <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Application Status</h3>
                </div>
                <p class="text-lg font-bold text-slate-800 font-roboto">Under Review</p>
                <p class="text-xs text-slate-400 mt-1">Last updated 2 hours ago</p>
            </div>

            <div class="stat-card">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-8 h-8 rounded bg-purple-50 text-purple-600 flex items-center justify-center">
                        <i class="pi pi-verified text-sm"></i>
                    </div>
                    <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">PRIME-HRM Level</h3>
                </div>
                <p class="text-lg font-bold text-slate-800 font-roboto">Level 2 Compliant</p>
                <p class="text-xs text-slate-400 mt-1">Division Office Certification</p>
            </div>

            <div class="stat-card">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
                            <i class="pi pi-chart-bar text-sm"></i>
                        </div>
                        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Profile Strength</h3>
                    </div>
                    <span class="text-xs font-bold text-amber-600">85%</span>
                </div>
                <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-amber-500 h-full w-[85%] rounded-full"></div>
                </div>
                <p class="text-xs text-slate-400 mt-2">Add work experience to reach 100%</p>
            </div>
        </div>
    </UserLayout>
</template>

<style scoped>
@reference "@/assets/main.css";

.profile-bg {
    background-image: linear-gradient(rgba(248, 250, 252, 0.9), rgba(248, 250, 252, 0.9)), 
                      url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2070');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    min-height: 100vh;
}

.font-inter {
    font-family: 'Inter', sans-serif;
}

.font-roboto {
    font-family: 'Roboto', sans-serif;
}

.stat-card {
    @apply bg-white p-5 border border-corp-border rounded-sm shadow-sm hover:shadow-md transition-shadow;
}

:deep(.p-button) {
    @apply !py-1.5 !px-3;
}
</style>