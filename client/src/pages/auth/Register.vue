<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/api/axios';

const router = useRouter();
const form = ref({ username: '', email: '', password: '' });
const loading = ref(false);
const error = ref(''); // 👈 FIX 1: We must define the error variable!

const handleRegister = async () => {
    loading.value = true;
    error.value = ''; // 👈 Reset the error on a new attempt

    try {
        await apiClient.post('/auth/register', form.value);

        console.log("OTP Sent to email");

        router.push({
            path: '/auth/verify-otp',
            query: { email: form.value.email }
        });
    } catch (err) {
        // 👈 FIX 2: Safely extract the error message from the backend
        error.value = err.response?.data?.message || 'Registration failed. Please try again.';
        console.error("Registration Error:", err);
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="auth-container">
        <div class="auth-card">
            <h2>Create Account</h2>
            <p>Join the DepEd Guihulngan City talent pool.</p>

            <form @submit.prevent="handleRegister">
                <div class="form-group">
                    <label>Full Name</label>
                    <input v-model="form.username" type="text" placeholder="Juan Dela Cruz" required />
                </div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input v-model="form.email" type="email" placeholder="juan@example.com" required />
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input v-model="form.password" type="password" placeholder="Min. 8 characters" required />
                </div>

                <p v-if="error" class="error-text">{{ error }}</p>

                <button type="submit" class="btn-submit" :disabled="loading">
                    {{ loading ? 'Sending OTP...' : 'Register' }}
                </button>
            </form>
        </div>
    </div>
</template>

<style scoped>
/* Standard Auth Styles */
.auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    padding: 2rem;
}

.auth-card {
    background: white;
    padding: 2.5rem;
    border-radius: 16px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

h2 {
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 0.5rem;
}

p {
    color: #64748b;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
}

.form-group {
    margin-bottom: 1rem;
    text-align: left;
}

label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 0.4rem;
    color: #475569;
}

input {
    width: 100%;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    transition: 0.2s;
}

input:focus {
    border-color: #38bdf8;
    outline: none;
    box-shadow: 0 0 0 2px #e0f2fe;
    /* Updated for cross-browser standard */
}

.btn-submit {
    width: 100%;
    background: #0f172a;
    color: white;
    padding: 12px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    margin-top: 1rem;
}

.btn-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.error-text {
    color: #dc2626;
    font-size: 0.85rem;
    margin-top: 0.5rem;
    text-align: center;
    font-weight: 500;
}
</style>