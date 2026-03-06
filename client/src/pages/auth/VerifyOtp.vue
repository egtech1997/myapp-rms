<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const email = route.query.email || 'your email';
const loading = ref(false);

// Custom OTP Input Logic
const otpDigits = ref(['', '', '', '', '', '']);
const otpInputRefs = ref([]);

const currentOtp = computed(() => otpDigits.value.join(''));

const focusInput = (index) => {
    if (otpInputRefs.value[index]) {
        otpInputRefs.value[index].focus();
    }
};

const handleInput = (e, index) => {
    const value = e.target.value;

    // Ensure only numeric values
    if (!/^\d*$/.test(value)) {
        otpDigits.value[index] = '';
        return;
    }

    // Move to next input if a digit was entered
    if (value && index < 5) {
        focusInput(index + 1);
    }
};

const handleKeydown = (e, index) => {
    // Move to previous input on Backspace if current input is empty
    if (e.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
        focusInput(index - 1);
    }
};

const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    for (let i = 0; i < pastedData.length; i++) {
        otpDigits.value[i] = pastedData[i];
    }

    // Auto-focus the last filled box or the end
    if (pastedData.length > 0) {
        focusInput(Math.min(pastedData.length, 5));
    }
};

const verify = async () => {
    if (currentOtp.value.length < 6) return;

    loading.value = true;
    try {
        await authStore.verifyOtp(email, currentOtp.value);
        router.push(authStore.dashboardRoute);
    } catch (err) {
        // Error is handled and populated within the store
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
                        <i class="pi pi-shield text-white text-lg"></i>
                    </div>
                    <h2 class="text-xl font-bold text-[var(--text-main)] tracking-tight">
                        Verify your identity
                    </h2>
                    <p class="text-sm text-[var(--text-muted)] mt-1.5 leading-relaxed">
                        We've sent a 6-digit code to <br />
                        <span class="font-semibold text-[var(--text-main)]">{{ email }}</span>
                    </p>
                </div>

                <div v-if="authStore.error"
                    class="mb-6 flex items-start gap-3 p-3.5 rounded-lg bg-red-50/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 animate-fade-in">
                    <i class="pi pi-exclamation-circle mt-0.5 text-sm"></i>
                    <span class="text-sm font-medium leading-tight">{{ authStore.error }}</span>
                </div>

                <form @submit.prevent="verify" class="space-y-6">
                    <div class="space-y-3">
                        <label
                            class="block text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                            Verification Code
                        </label>

                        <div class="flex justify-between gap-2 sm:gap-3">
                            <input v-for="(digit, i) in otpDigits" :key="i"
                                :ref="el => { if (el) otpInputRefs[i] = el }" v-model="otpDigits[i]"
                                @input="handleInput($event, i)" @keydown="handleKeydown($event, i)" @paste="handlePaste"
                                type="text" inputmode="numeric" maxlength="1"
                                class="w-11 sm:w-12 h-12 sm:h-14 text-center text-lg font-bold rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-shadow"
                                required />
                        </div>
                    </div>

                    <button type="submit" :disabled="loading || currentOtp.length < 6"
                        class="w-full h-11 mt-4 bg-[var(--text-main)] text-[var(--surface)] text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                        <i v-if="loading" class="pi pi-spin pi-spinner text-sm"></i>
                        <span>{{ loading ? 'Verifying...' : 'Verify account' }}</span>
                    </button>
                </form>
            </div>

            <div class="px-8 py-5 bg-[var(--bg-app)] border-t border-[var(--border-main)]">
                <div class="flex flex-col items-center justify-center gap-4">
                    <p class="text-sm text-[var(--text-muted)] text-center">
                        Didn't receive the code?
                        <button type="button"
                            class="font-semibold text-[var(--text-main)] hover:underline ml-1 focus:outline-none">
                            Resend code
                        </button>
                    </p>

                    <router-link to="/auth/login"
                        class="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors flex items-center gap-1.5">
                        <i class="pi pi-arrow-left text-[10px]"></i>
                        Back to login
                    </router-link>
                </div>
            </div>

        </div>
    </div>
</template>
