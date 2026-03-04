<script setup>
import UserLayout from '@/layouts/UserLayout.vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>

<template>
    <UserLayout>
        <div
            class="bg-[var(--surface-0)] border border-[var(--border-color)] rounded-2xl p-8 shadow-[var(--shadow-sm)] mb-8 relative overflow-hidden">
            <div
                class="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-3xl transition-all duration-700">
            </div>
            <div
                class="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl transition-all duration-700">
            </div>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div class="flex items-center gap-6">
                    <div class="relative group cursor-pointer">
                        <img :src="authStore.user?.avatarUrl || `https://ui-avatars.com/api/?name=${authStore.user?.username}&background=4f46e5&color=fff`"
                            class="w-20 h-20 rounded-full border-4 border-[var(--surface-0)] shadow-[var(--shadow-md)] transition-transform duration-300 group-hover:scale-105" />
                        <div
                            class="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-[var(--surface-0)] rounded-full flex items-center justify-center shadow-sm">
                            <i class="pi pi-check text-white text-[8px] font-bold"></i>
                        </div>
                    </div>

                    <div class="space-y-1.5">
                        <h1 class="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">
                            Welcome back, {{ authStore.user?.username || 'Applicant' }}!
                        </h1>
                        <p class="text-sm text-[var(--text-secondary)] flex items-center gap-2">
                            <i class="pi pi-envelope opacity-70"></i>
                            {{ authStore.user?.email || 'applicant@deped.gov.ph' }}
                        </p>
                        <div class="flex flex-wrap items-center gap-3 pt-2">
                            <span
                                class="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wide rounded-md border border-emerald-200/60 flex items-center gap-1.5">
                                <i class="pi pi-shield"></i> Verified
                            </span>
                            <span
                                class="text-xs text-[var(--text-secondary)] font-medium bg-[var(--surface-50)] px-2.5 py-1 rounded-md border border-[var(--border-color)]">
                                Member since 2026
                            </span>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3">
                    <Button label="Edit Profile" icon="pi pi-user-edit" outlined severity="secondary"
                        class="px-6 py-2.5 gap-2 font-semibold !text-[var(--text-primary)]" />
                    <Button label="View Vacancies" icon="pi pi-search"
                        class="px-6 py-2.5 gap-2 font-semibold !text-[var(--text-primary)]" />
                </div>
            </div>
        </div>

        <h2 class="text-lg font-display font-bold text-[var(--text-primary)] mb-4 px-1">Your Dashboard</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div
                class="bg-[var(--surface-0)] p-6 border border-[var(--border-color)] rounded-2xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-300 group">
                <div class="flex items-center gap-4 mb-4">
                    <div
                        class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                        <i class="pi pi-file-edit text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-[var(--text-primary)]">Application Status</h3>
                        <p class="text-xs text-[var(--text-secondary)]">Teacher I (Elementary)</p>
                    </div>
                </div>
                <div
                    class="bg-[var(--surface-50)] rounded-xl p-3 border border-[var(--border-color)] flex items-center justify-between">
                    <span class="text-sm font-semibold text-indigo-700">Under Review</span>
                    <i class="pi pi-spin pi-spinner text-indigo-500"></i>
                </div>
                <p class="text-[11px] text-[var(--text-secondary)] mt-3 text-right">Last updated 2 hours ago</p>
            </div>

            <div
                class="bg-[var(--surface-0)] p-6 border border-[var(--border-color)] rounded-2xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-300 group">
                <div class="flex items-center gap-4 mb-4">
                    <div
                        class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                        <i class="pi pi-verified text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-[var(--text-primary)]">PRIME-HRM Level</h3>
                        <p class="text-xs text-[var(--text-secondary)]">Current Standing</p>
                    </div>
                </div>
                <div class="bg-[var(--surface-50)] rounded-xl p-3 border border-[var(--border-color)]">
                    <p class="text-sm font-semibold text-purple-700 flex items-center gap-2">
                        <i class="pi pi-star-fill text-purple-500 text-xs"></i>
                        Level 2 Compliant
                    </p>
                </div>
                <p class="text-[11px] text-[var(--text-secondary)] mt-3 text-right">Division Office Certification</p>
            </div>

            <div
                class="bg-[var(--surface-0)] p-6 border border-[var(--border-color)] rounded-2xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-300 flex flex-col justify-between group">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-4">
                            <div
                                class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                                <i class="pi pi-chart-pie text-xl"></i>
                            </div>
                            <h3 class="text-sm font-bold text-[var(--text-primary)]">Profile Strength</h3>
                        </div>
                        <span class="text-xl font-display font-black text-amber-500">85%</span>
                    </div>

                    <div class="w-full bg-[var(--surface-100)] h-2.5 rounded-full overflow-hidden mt-2">
                        <div class="bg-gradient-to-r from-amber-400 to-amber-500 h-full w-[85%] rounded-full relative">
                            <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div class="mt-4 flex items-center justify-between">
                    <p class="text-xs text-[var(--text-secondary)]">Add work experience to reach 100%</p>
                    <button
                        class="text-xs font-bold text-amber-600 hover:text-amber-700 underline decoration-amber-300/50 hover:decoration-amber-400 underline-offset-4 transition-colors">
                        Update
                    </button>
                </div>
            </div>

        </div>
    </UserLayout>
</template>