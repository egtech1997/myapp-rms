<script setup>
import UserLayout from '@/layouts/UserLayout.vue';
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
</script>

<template>
    <UserLayout>
        <div class="welcome-card">
            <div class="profile-header">
                <img :src="authStore.user?.avatar || `https://ui-avatars.com/api/?name=${authStore.user?.username}`"
                    class="large-avatar" />
                <div class="profile-meta">
                    <h1>{{ authStore.user?.username }}</h1>
                    <p class="email-text">{{ authStore.user?.email }}</p>
                    <span class="status-badge">Active Account</span>
                </div>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-box">
                <h3>Application Status</h3>
                <p class="stat-value">Under Review</p>
            </div>
            <div class="stat-box">
                <h3>PRIME-HRM Level</h3>
                <p class="stat-value">Level 2 Compliant</p>
            </div>
        </div>
    </UserLayout>
</template>

<style scoped>
.welcome-card {
    background: white;
    padding: 3rem;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #f1f5f9;
}

.profile-header {
    display: flex;
    align-items: center;
    gap: 2rem;
}

.large-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 4px solid #38bdf8;
}

.profile-meta h1 {
    font-size: 2rem;
    margin: 0;
    color: #0f172a;
}

.email-text {
    font-size: 1.1rem;
    color: #64748b;
    margin: 0.5rem 0;
}

.status-badge {
    background: #dcfce7;
    color: #166534;
    padding: 4px 12px;
    border-radius: 99px;
    font-size: 0.8rem;
    font-weight: 600;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
}

.stat-box {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    border-left: 5px solid #38bdf8;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-box h3 {
    font-size: 0.9rem;
    color: #64748b;
    margin-bottom: 0.5rem;
}

.stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
}
</style>