<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();

const email = route.query.email || 'your email';
const loading = ref(false);
const resending = ref(false);
const resendTimer = ref(0);

// Custom OTP Input Logic
const otpDigits = ref(['', '', '', '', '', '']);
const otpInputRefs = ref([]);

const currentOtp = computed(() => otpDigits.value.join(''));

onMounted(() => {
    // Auto-focus first input on mount
    setTimeout(() => focusInput(0), 500);
});

const focusInput = (index) => {
    if (otpInputRefs.value[index]) {
        otpInputRefs.value[index].focus();
    }
};

const handleInput = (e, index) => {
    const value = e.target.value;
    
    // Only take the last character if multiple characters are somehow entered
    const digit = value.slice(-1);

    // Ensure only numeric values
    if (!/^\d*$/.test(digit)) {
        otpDigits.value[index] = '';
        return;
    }

    otpDigits.value[index] = digit;

    // Move to next input if a digit was entered
    if (digit && index < 5) {
        focusInput(index + 1);
    }

    // Auto verify if all fields filled
    if (currentOtp.value.length === 6) {
        verify();
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

    // Update refs values manually to ensure UI sync before focus
    if (pastedData.length > 0) {
        const nextIndex = Math.min(pastedData.length, 5);
        focusInput(nextIndex);
    }

    if (pastedData.length === 6) {
        verify();
    }
};

const startResendTimer = () => {
    resendTimer.value = 60;
    const interval = setInterval(() => {
        resendTimer.value--;
        if (resendTimer.value <= 0) clearInterval(interval);
    }, 1000);
};

const handleResend = async () => {
    if (resendTimer.value > 0 || resending.value) return;
    
    resending.value = true;
    try {
        await authStore.register({ email });
        startResendTimer();
    } catch (err) {
        // Error handled in store
    } finally {
        resending.value = false;
    }
};

const verify = async () => {
    if (currentOtp.value.length < 6 || loading.value) return;

    loading.value = true;
    try {
        await authStore.verifyOtp(email, currentOtp.value);
        router.push(authStore.dashboardRoute);
    } catch (err) {
        // Clear OTP on error to let user try again
        otpDigits.value = ['', '', '', '', '', ''];
        focusInput(0);
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
                        <i v-else class="pi pi-shield text-white text-lg"></i>
                    </div>
                    <h2 class="text-xl font-bold text-[var(--text-main)] tracking-tight uppercase tracking-widest">
                        Verification
                    </h2>
                    <p class="text-[10px] font-bold text-[var(--text-muted)] mt-2 uppercase tracking-[0.2em]">
                        {{ settingsStore.systemName }} &bull; {{ settingsStore.systemSubName }}
                    </p>
                </div>

                <div v-if="authStore.error"
                    class="mb-6 flex items-start gap-3 p-3.5 rounded-lg bg-red-50/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 animate-fade-in">
                    <i class="pi pi-exclamation-circle mt-0.5 text-sm"></i>
                    <span class="text-sm font-medium leading-tight">{{ authStore.error }}</span>
                </div>

                <div class="mb-8 text-center">
                    <p class="text-sm text-[var(--text-muted)] leading-relaxed">
                        We've sent a code to <br/>
                        <span class="font-semibold text-[var(--text-main)]">{{ email }}</span>
                    </p>
                </div>

                <form @submit.prevent="verify" class="space-y-6">
                    <div class="space-y-4">
                        <label
                            class="block text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                            Enter 6-Digit Code
                        </label>

                        <div class="grid grid-cols-6 gap-2 sm:gap-3">
                            <input v-for="(digit, i) in otpDigits" :key="i"
                                :ref="el => { if (el) otpInputRefs[i] = el }" 
                                v-model="otpDigits[i]"
                                @input="handleInput($event, i)" 
                                @keydown="handleKeydown($event, i)" 
                                @paste="handlePaste"
                                type="text" 
                                inputmode="numeric" 
                                maxlength="1"
                                class="w-full h-12 sm:h-14 text-center text-lg font-bold rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-all"
                                :class="{'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/10': otpDigits[i]}"
                                required />
                        </div>
                    </div>

                    <button type="submit" :disabled="loading || currentOtp.length < 6"
                        class="w-full h-11 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                        <i v-if="loading" class="pi pi-spin pi-spinner text-sm"></i>
                        <span>{{ loading ? 'Verifying...' : 'Verify account' }}</span>
                    </button>
                </form>
            </div>

            <div class="px-8 py-5 bg-[var(--bg-app)] border-t border-[var(--border-main)] text-center">
                <p class="text-sm text-[var(--text-muted)]">
                    Didn't receive the code?
                    <button @click="handleResend" type="button" :disabled="resendTimer > 0 || resending"
                        class="font-semibold text-[var(--text-main)] hover:underline ml-1 focus:outline-none disabled:opacity-50">
                        <span v-if="resending">Sending...</span>
                        <span v-else-if="resendTimer > 0">Resend in {{ resendTimer }}s</span>
                        <span v-else>Resend code</span>
                    </button>
                </p>
                <router-link to="/auth/login"
                    class="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                    <i class="pi pi-arrow-left text-[10px]"></i>
                    Back to login
                </router-link>
            </div>

        </div>
    </div>
</template>

<style scoped>
/* Optional: remove up/down arrows from number inputs */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
