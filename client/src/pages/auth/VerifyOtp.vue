<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth'; // 👈 Import your store

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore(); // 👈 Initialize store

const otp = ref('');
const email = route.query.email;

const verify = async () => {
    try {
        // Use the store action we looked at earlier
        const data = await authStore.verifyOtp(email, otp.value);

        // Check if user is admin or regular user to decide where to send them
        const role = data.user.role?.name === 'admin' ? 'admin' : 'user';

        alert('Account verified successfully!');

        // Go directly to dashboard
        router.push(`/${role}/dashboard`);
    } catch (err) {
        alert(authStore.error || 'Invalid or expired OTP');
    }
};
</script>

<template>
    <div class="auth-container">
        <div class="auth-card">
            <h2>Verify Email</h2>
            <p>We've sent a code to <strong>{{ email }}</strong></p>

            <div class="form-group">
                <input v-model="otp" type="text" maxlength="6" class="otp-input" placeholder="000000" />
            </div>

            <button @click="verify" class="btn-submit">Verify Account</button>
            <p class="resend">Didn't get a code? <a href="#">Resend</a></p>
        </div>
    </div>
</template>

<style scoped>
.otp-input {
    text-align: center;
    font-size: 2rem;
    letter-spacing: 0.5rem;
    font-weight: 800;
    border: 2px solid #e2e8f0;
}

.resend {
    margin-top: 1rem;
    font-size: 0.8rem;
}
</style>