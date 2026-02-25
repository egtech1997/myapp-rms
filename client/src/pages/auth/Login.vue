<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = ref({ email: '', password: '' });
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
    loading.value = true;
    error.value = '';
    try {
        await authStore.login(form.value);

        // Check if role is an object or a string
        const roleData = authStore.user?.role;
        const roleName = typeof roleData === 'object' ? roleData.name : roleData;

        const defaultDash = roleName === 'admin' ? '/admin/dashboard' : '/user/dashboard';
        const redirectPath = route.query.redirect || defaultDash;

        router.push(redirectPath);
    } catch (err) {
        // Handle cases where err.response might be undefined
        error.value = typeof err === 'string' ? err : (err.response?.data?.message || 'Login failed');
    } finally {
        loading.value = false;
    }
};

const handleGoogleLogin = () => {
    // It's good practice to pass the current redirect path to the backend 
    // so the backend can return the user to the same spot after Google auth
    const redirect = route.query.redirect ? `?returnTo=${route.query.redirect}` : '';
    window.location.href = `http://localhost:4000/api/auth/google${redirect}`;
};
</script>

<template>
    <div class="auth-container">
        <div class="auth-card">
            <header>
                <h2>Sign In</h2>
                <p>Access the DepEd GNC Recruitment Portal</p>
            </header>

            <form @submit.prevent="handleLogin" class="auth-form">
                <div class="form-group">
                    <label>Email Address</label>
                    <input v-model="form.email" type="email" placeholder="name@example.com" required />
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input v-model="form.password" type="password" placeholder="••••••••" required />
                </div>

                <p v-if="error" class="error-text">{{ error }}</p>

                <button type="submit" class="btn-submit" :disabled="loading">
                    {{ loading ? 'Authenticating...' : 'Sign In' }}
                </button>
            </form>

            <div class="divider"><span>OR</span></div>

            <button @click="handleGoogleLogin" class="btn-google">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Logo.svg" alt="G" />
                Continue with Google
            </button>

            <footer class="auth-footer">
                <span>New to ORAS?</span>
                <router-link to="/auth/register">Create an Account</router-link>
            </footer>
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
    ring: 2px solid #38bdf8;
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

.btn-google {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: white;
    border: 1px solid #e2e8f0;
    padding: 11px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    margin-bottom: 1.5rem;
}

.divider {
    margin: 1.5rem 0;
    position: relative;
    text-align: center;
    font-size: 0.75rem;
    color: #94a3b8;
}

.divider::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 1px;
    background: #e2e8f0;
}

.divider span {
    position: relative;
    background: white;
    padding: 0 10px;
}

.auth-footer {
    margin-top: 1.5rem;
    font-size: 0.9rem;
    text-align: center;
}

.auth-footer a {
    color: #38bdf8;
    font-weight: 700;
    text-decoration: none;
    margin-left: 5px;
}

.error-text {
    color: #dc2626;
    font-size: 0.8rem;
    margin-top: 0.5rem;
}
</style>