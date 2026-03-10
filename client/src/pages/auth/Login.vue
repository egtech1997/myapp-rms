<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';


const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();

const form = ref({ email: '', password: '' });
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);

const logoSize = ref(100); 

const handleLogin = async () => {
    loading.value = true;
    error.value = '';
    try {
        await authStore.login(form.value);
        const defaultDash = authStore.dashboardRoute;
        const redirectPath = route.query.redirect || defaultDash;
        router.push(redirectPath);
    } catch (err) {
        error.value = typeof err === 'string' ? err : (err.response?.data?.message || 'The email or password you entered is incorrect.');
    } finally {
        loading.value = false;
    }
};

const handleGoogleLogin = () => {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/$/, "");
    const finalUrl = `${baseUrl}/auth/google`;
    window.location.href = finalUrl;
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
                        <i v-else class="pi pi-shield text-white text-lg"></i>
                    </div>
                    <h2 class="text-xl font-bold text-[var(--text-main)] tracking-tight uppercase tracking-widest">
                        Sign In
                    </h2>
                    <p class="text-[10px] font-bold text-[var(--text-muted)] mt-2 uppercase tracking-[0.2em]">
                        {{ settingsStore.systemName }} &bull; {{ settingsStore.systemSubName }}
                    </p>
                </div>

                <div v-if="error"
                    class="mb-6 flex items-start gap-3 p-3.5 rounded-lg bg-red-50/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 animate-fade-in">
                    <i class="pi pi-exclamation-circle mt-0.5 text-sm"></i>
                    <span class="text-sm font-medium leading-tight">{{ error }}</span>
                </div>

                <form @submit.prevent="handleLogin" class="space-y-5">
                    <div class="space-y-1.5">
                        <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                            Email
                        </label>
                        <input v-model="form.email" type="email" name="email" id="email" autocomplete="email" placeholder="name@deped.gov.ph"
                            class="w-full h-11 px-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-[var(--text-main)] text-sm placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-shadow"
                            required />
                    </div>

                    <div class="space-y-1.5">
                        <div class="flex justify-between items-center">
                            <label
                                class="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Password
                            </label>
                            <router-link to="/auth/forgot-password"
                                class="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                Forgot password?
                            </router-link>
                        </div>
                        <div class="relative">
                            <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                                placeholder="••••••••"
                                class="w-full h-11 pl-3.5 pr-10 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-[var(--text-main)] text-sm placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-shadow"
                                required />
                            <button type="button" @click="showPassword = !showPassword"
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] focus:outline-none transition-colors">
                                <i :class="['pi', showPassword ? 'pi-eye-slash' : 'pi-eye']" class="text-sm"></i>
                            </button>
                        </div>
                    </div>

                    <button type="submit" :disabled="loading"
                        class="w-full h-11 mt-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                        <i v-if="loading" class="pi pi-spin pi-spinner text-sm"></i>
                        <span>{{ loading ? 'Signing in...' : 'Sign In' }}</span>
                    </button>
                </form>

                <div class="flex items-center gap-4 my-6">
                    <div class="h-px bg-[var(--border-main)] flex-1"></div>
                    <span class="text-xs font-medium text-[var(--text-muted)]">or continue with</span>
                    <div class="h-px bg-[var(--border-main)] flex-1"></div>
                </div>

                <button @click="handleGoogleLogin" type="button"
                    class="w-full h-11 bg-[var(--surface)] border border-[var(--border-main)] hover:bg-[var(--bg-app)] text-[var(--text-main)] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2.5 active:scale-[0.98]">
                    <svg class="w-4 h-4" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4" />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853" />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05" />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335" />
                    </svg>
                    <span>Google</span>
                </button>
            </div>

            <div class="px-8 py-5 bg-[var(--bg-app)] border-t border-[var(--border-main)] text-center">
                <p class="text-sm text-[var(--text-muted)]">
                    Don't have an account?
                    <router-link to="/auth/register" class="font-semibold text-[var(--text-main)] hover:underline ml-1">
                        Sign up
                    </router-link>
                </p>
            </div>

        </div>
    </div>
</template>
