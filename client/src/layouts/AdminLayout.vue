<script setup>
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
</script>

<template>
    <div class="admin-wrapper">
        <aside class="sidebar">
            <div class="sidebar-header">
                <span class="logo">ORAS <small>ADMIN</small></span>
            </div>
            <nav class="sidebar-nav">
                <router-link to="/admin/dashboard" class="nav-item">📊 Statistics</router-link>
                <router-link to="/admin/jobs" class="nav-item">📝 Manage Jobs</router-link>
                <router-link to="/admin/applicants" class="nav-item">👥 Applicants</router-link>
                <router-link to="/admin/users" class="nav-item">🔐 User Roles</router-link>
            </nav>
            <div class="sidebar-footer">
                <button @click="authStore.logout" class="btn-logout">Logout Admin</button>
            </div>
        </aside>

        <main class="main-content">
            <header class="top-bar">
                <div class="brand-context">Recruitment Management Console</div>
                <div class="admin-profile">
                    <div class="admin-info">
                        <p class="name">{{ authStore.user?.username }}</p>
                        <span class="badge">SYSTEM ADMIN</span>
                    </div>
                    <img :src="authStore.user?.avatar || `https://ui-avatars.com/api/?name=${authStore.user?.username}`"
                        class="avatar" />
                </div>
            </header>

            <section class="view-port">
                <slot />
            </section>
        </main>
    </div>
</template>

<style scoped>
.admin-wrapper {
    display: flex;
    height: 100vh;
    background: #f1f5f9;
}

.sidebar {
    width: 280px;
    background: #0f172a;
    color: #f8fafc;
    display: flex;
    flex-direction: column;
}

.sidebar-header {
    padding: 2rem;
    border-bottom: 1px solid #1e293b;
}

.logo {
    font-size: 1.5rem;
    font-weight: 800;
    color: #38bdf8;
}

.logo small {
    font-size: 0.7rem;
    color: #94a3b8;
    display: block;
    letter-spacing: 2px;
}

.sidebar-nav {
    flex: 1;
    padding: 1.5rem 1rem;
}

.nav-item {
    display: block;
    padding: 14px 1rem;
    color: #94a3b8;
    text-decoration: none;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    transition: 0.2s;
}

.nav-item:hover,
.router-link-active {
    background: #38bdf8;
    color: #0f172a;
    font-weight: 600;
}

.top-bar {
    height: 70px;
    background: white;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.admin-info {
    text-align: right;
    margin-right: 12px;
}

.name {
    font-weight: 700;
    font-size: 0.9rem;
    margin: 0;
}

.badge {
    font-size: 0.65rem;
    background: #fee2e2;
    color: #991b1b;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 800;
}

.avatar {
    width: 42px;
    height: 42px;
    border-radius: 8px;
}

.view-port {
    padding: 2rem;
    overflow-y: auto;
    flex: 1;
}
</style>