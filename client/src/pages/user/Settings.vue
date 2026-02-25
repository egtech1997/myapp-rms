<script setup>
import { ref } from 'vue';
import UserLayout from '@/layouts/UserLayout.vue';
import { useAuthStore } from '@/stores/auth';
import apiClient from '@/api/axios';

const authStore = useAuthStore();

// Form States
const profileForm = ref({
    username: authStore.user?.username || '',
    email: authStore.user?.email || ''
});

const passwordForm = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const statusMsg = ref({ type: '', text: '' });
const loading = ref(false);

const updateProfile = async () => {
    loading.value = true;
    statusMsg.value = { type: '', text: '' };
    try {
        const { data } = await apiClient.patch('/auth/update-me', profileForm.value);
        authStore.user = data.user; // Update Pinia store
        statusMsg.value = { type: 'success', text: 'Profile updated successfully!' };
    } catch (err) {
        statusMsg.value = { type: 'error', text: err.response?.data?.message || 'Update failed' };
    } finally {
        loading.value = false;
    }
};

const updatePassword = async () => {
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
        return statusMsg.value = { type: 'error', text: 'Passwords do not match' };
    }

    loading.value = true;
    try {
        await apiClient.patch('/auth/update-password', passwordForm.value);
        statusMsg.value = { type: 'success', text: 'Password changed successfully!' };
        passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
    } catch (err) {
        statusMsg.value = { type: 'error', text: err.response?.data?.message || 'Password update failed' };
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <UserLayout>
        <div class="settings-container">
            <header class="section-header">
                <h1>Account Settings</h1>
                <p>Manage your PRIME-HRM profile and security.</p>
            </header>

            <div v-if="statusMsg.text" :class="['alert', statusMsg.type]">
                {{ statusMsg.text }}
            </div>

            <div class="settings-grid">
                <section class="settings-card">
                    <h3>Profile Information</h3>
                    <form @submit.prevent="updateProfile">
                        <div class="form-group">
                            <label>Username</label>
                            <input v-model="profileForm.username" type="text" />
                        </div>
                        <div class="form-group">
                            <label>Email Address</label>
                            <input v-model="profileForm.email" type="email" disabled title="Email cannot be changed" />
                            <small>Contact HR to change your official email.</small>
                        </div>
                        <button type="submit" class="btn-save" :disabled="loading">Save Changes</button>
                    </form>
                </section>

                <section class="settings-card">
                    <h3>Security & Password</h3>
                    <form @submit.prevent="updatePassword">
                        <div class="form-group">
                            <label>Current Password</label>
                            <input v-model="passwordForm.currentPassword" type="password" required />
                        </div>
                        <div class="form-group">
                            <label>New Password</label>
                            <input v-model="passwordForm.newPassword" type="password" required />
                        </div>
                        <div class="form-group">
                            <label>Confirm New Password</label>
                            <input v-model="passwordForm.confirmPassword" type="password" required />
                        </div>
                        <button type="submit" class="btn-outline" :disabled="loading">Update Password</button>
                    </form>
                </section>
            </div>
        </div>
    </UserLayout>
</template>

<style scoped>
.settings-container {
    max-width: 900px;
    margin: 0 auto;
}

.section-header {
    margin-bottom: 2rem;
}

.settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
}

.settings-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-group {
    margin-bottom: 1.2rem;
}

label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
    margin-bottom: 0.5rem;
}

input {
    width: 100%;
    padding: 10px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
}

input:disabled {
    background: #f8fafc;
    cursor: not-allowed;
}

.btn-save {
    width: 100%;
    padding: 10px;
    background: #0f172a;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
}

.btn-outline {
    width: 100%;
    padding: 10px;
    background: transparent;
    border: 2px solid #0f172a;
    color: #0f172a;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
}

.alert {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
}

.success {
    background: #dcfce7;
    color: #166534;
}

.error {
    background: #fee2e2;
    color: #991b1b;
}
</style>