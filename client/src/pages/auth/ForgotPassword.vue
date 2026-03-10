<script setup>
import { ref } from 'vue';
import apiClient from '@/api/axios';
import { useSettingsStore } from '@/stores/settings';

const email = ref('');
const loading = ref(false);
const error = ref('');
const sent = ref(false);
const settingsStore = useSettingsStore();

const handleSubmit = async () => {
    loading.value = true;
    error.value = '';
    try {
        await apiClient.post('/auth/forgot-password', { email: email.value });
        sent.value = true;
    } catch (err) {
        error.value = err.response?.data?.message || 'Something went wrong. Please try again.';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div
        class="min-h-screen flex items-center justify-center bg-[var(--bg-app)] text-[var(--text-main)] px-4 font-sans antialiased selection:bg-[var(--color-primary-light)] selection:text-[var(--color-primary-dark)]">

        <div
            class="w-full max-w-[400px] bg-[var(--surface)] rounded-xl border border-[var(--border-main)] shadow-sm animate-fade-in-up">

            <div class="p-8 sm:p-10">
                <div class="mb-8 text-center">
                    <div
                        class="mx-auto mb-5 w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-md"
                        :class="settingsStore.resolvedLogoUrl ? '' : 'bg-[var(--color-primary)]'">
                        <img v-if="settingsStore.resolvedLogoUrl" :src="settingsStore.resolvedLogoUrl" class="w-full h-full object-cover" />
                        <i v-else class="pi pi-lock text-white text-lg"></i>
                    </div>
                    <h2 class="text-xl font-bold text-[var(--text-main)] tracking-tight uppercase tracking-widest">
                        Reset Password
                    </h2>
                    <p class="text-[10px] font-bold text-[var(--text-muted)] mt-2 uppercase tracking-[0.2em]">
                        {{ settingsStore.systemName }} &bull; {{ settingsStore.systemSubName }}
                    </p>
                </div>

                <!-- Success state -->
                <div v-if="sent"
                    class="flex flex-col items-center gap-4 py-4 text-center animate-fade-in">
                    <div class="w-12 h-12 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 flex items-center justify-center">
                        <i class="pi pi-check text-green-600 dark:text-green-400 text-lg"></i>
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-[var(--text-main)]">Check your inbox</p>
                        <p class="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
                            A reset link has been sent to<br />
                            <span class="font-semibold text-[var(--text-main)]">{{ email }}</span>
                        </p>
                    </div>
                    <p class="text-xs text-[var(--text-muted)]">The link expires in 10 minutes.</p>
                </div>

                <!-- Form state -->
                <template v-else>
                    <div v-if="error"
                        class="mb-6 flex items-start gap-3 p-3.5 rounded-lg bg-red-50/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 animate-fade-in">
                        <i class="pi pi-exclamation-circle mt-0.5 text-sm"></i>
                        <span class="text-sm font-medium leading-tight">{{ error }}</span>
                    </div>

                    <form @submit.prevent="handleSubmit" class="space-y-5">
                        <div class="space-y-1.5">
                            <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Email address
                            </label>
                            <input v-model="email" type="email" name="email" id="email" autocomplete="email" placeholder="name@deped.gov.ph"
                                class="w-full h-11 px-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-[var(--text-main)] text-sm placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-shadow"
                                required />
                        </div>

                        <button type="submit" :disabled="loading"
                            class="w-full h-11 mt-2 bg-[var(--text-main)] text-[var(--surface)] text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                            <i v-if="loading" class="pi pi-spin pi-spinner text-sm"></i>
                            <span>{{ loading ? 'Sending...' : 'Send Reset Link' }}</span>
                        </button>
                    </form>
                </template>
            </div>

            <div class="px-8 py-5 bg-[var(--bg-app)] border-t border-[var(--border-main)] text-center">
                <router-link to="/auth/login"
                    class="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors flex items-center justify-center gap-1.5">
                    <i class="pi pi-arrow-left text-[10px]"></i>
                    Back to login
                </router-link>
            </div>

        </div>
    </div>
</template>
