<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/api/axios';

const router = useRouter();
const form = ref({ username: '', email: '', password: '' });
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);

const handleRegister = async () => {
    loading.value = true;
    error.value = '';

    try {
        const targetEmail = form.value.email;
        await apiClient.post('/auth/register', form.value);

        router.push({
            path: '/auth/verify-otp',
            query: { email: targetEmail }
        });
    } catch (err) {
        error.value = err.response?.data?.message || 'Registration failed';
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
                        class="mx-auto mb-5 w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shadow-md shadow-blue-900/20">
                        <i class="pi pi-user-plus text-white text-lg"></i>
                    </div>
                    <h2 class="text-xl font-bold text-[var(--text-main)] tracking-tight">
                        Create an account
                    </h2>
                    <p class="text-sm text-[var(--text-muted)] mt-1.5">
                        Join the DepEd GNC talent pool
                    </p>
                </div>

                <div v-if="error"
                    class="mb-6 flex items-start gap-3 p-3.5 rounded-lg bg-red-50/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 animate-fade-in">
                    <i class="pi pi-exclamation-circle mt-0.5 text-sm"></i>
                    <span class="text-sm font-medium leading-tight">{{ error }}</span>
                </div>

                <form @submit.prevent="handleRegister" class="space-y-5">
                    <div class="space-y-1.5">
                        <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                            Full Name
                        </label>
                        <input v-model="form.username" type="text" placeholder="Juan Dela Cruz"
                            class="w-full h-11 px-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-[var(--text-main)] text-sm placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-shadow"
                            required />
                    </div>

                    <div class="space-y-1.5">
                        <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                            Email
                        </label>
                        <input v-model="form.email" type="email" placeholder="name@example.com"
                            class="w-full h-11 px-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-[var(--text-main)] text-sm placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-shadow"
                            required />
                    </div>

                    <div class="space-y-1.5">
                        <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                            Password
                        </label>
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
                        class="w-full h-11 mt-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-900/20">
                        <i v-if="loading" class="pi pi-spin pi-spinner text-sm"></i>
                        <span>{{ loading ? 'Registering...' : 'Create account' }}</span>
                    </button>
                </form>
            </div>

            <div class="px-8 py-5 bg-[var(--bg-app)] border-t border-[var(--border-main)] text-center">
                <p class="text-sm text-[var(--text-muted)]">
                    Already have an account?
                    <router-link to="/auth/login" class="font-semibold text-[var(--text-main)] hover:underline ml-1">
                        Sign in
                    </router-link>
                </p>
            </div>

        </div>
    </div>
</template>
