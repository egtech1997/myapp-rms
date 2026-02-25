<script setup>
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
</script>

<template>
    <div class="dashboard-wrapper">
        <aside class="sidebar">
            <div class="sidebar-header">
                <span class="logo">ORAS</span>
            </div>
            <nav class="sidebar-nav">
                <router-link to="/user/dashboard" class="nav-item">Dashboard</router-link>
                <router-link to="/user/applications" class="nav-item">My Applications</router-link>
                <router-link to="/user/profile" class="nav-item">Account Settings</router-link>
            </nav>
            <div class="sidebar-footer">
                <button @click="authStore.logout" class="btn-logout">Sign Out</button>
            </div>
        </aside>

        <main class="main-content">
            <header class="top-bar">
                <div class="breadcrumb">Welcome back, {{ authStore.user?.username }}</div>
                <div class="user-pill">
                    <div class="user-text">
                        <p class="name">{{ authStore.user?.username }}</p>
                        <p class="role">{{ authStore.user?.role?.name }}</p>
                    </div>
                    <img :src="authStore.user?.avatar || `https://ui-avatars.com/api/?name=${authStore.user?.username}`"
                        class="top-avatar" />
                </div>
            </header>

            <section class="page-body">
                <slot />
            </section>
        </main>
    </div>
</template>

<style scoped>
.dashboard-wrapper {
    display: flex;
    height: 100vh;
    background: #f8fafc;
}

.sidebar {
    width: 260px;
    background: #1e293b;
    color: white;
    display: flex;
    flex-direction: column;
}

.sidebar-header {
    padding: 2rem;
    font-size: 1.5rem;
    font-weight: 800;
    color: #38bdf8;
}

.sidebar-nav {
    flex: 1;
    padding: 0 1rem;
}

.nav-item {
    display: block;
    padding: 12px 1rem;
    color: #cbd5e1;
    text-decoration: none;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    transition: 0.3s;
}

.nav-item:hover,
.router-link-active {
    background: #334155;
    color: white;
}

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.top-bar {
    height: 70px;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
}

.user-pill {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-text {
    text-align: right;
}

.name {
    font-weight: 600;
    font-size: 0.9rem;
    margin: 0;
}

.role {
    font-size: 0.7rem;
    color: #64748b;
    text-transform: uppercase;
    margin: 0;
}

.top-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}

.page-body {
    padding: 2rem;
}
</style>