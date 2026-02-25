<script setup>
import AdminLayout from '@/layouts/AdminLayout.vue';
import { ref } from 'vue';

// Mock data for the dashboard
const stats = ref([
    { label: 'Total Applicants', value: '1,248', color: '#38bdf8' },
    { label: 'Pending Reviews', value: '42', color: '#fbbf24' },
    { label: 'Active Job Posts', value: '15', color: '#22c55e' },
    { label: 'Reports Generated', value: '89', color: '#818cf8' }
]);
</script>

<template>
    <AdminLayout>
        <div class="dashboard-header">
            <h1>Administrative Overview</h1>
            <p>PRIME-HRM Compliance Monitoring & Recruitment Stats</p>
        </div>

        <div class="stats-grid">
            <div v-for="stat in stats" :key="stat.label" class="stat-card" :style="{ borderTopColor: stat.color }">
                <span class="stat-label">{{ stat.label }}</span>
                <h2 class="stat-value">{{ stat.value }}</h2>
            </div>
        </div>

        <div class="table-container">
            <div class="table-header">
                <h3>Recent Applications</h3>
                <button class="btn-view-all">Export Report</button>
            </div>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Applicant Name</th>
                        <th>Position Applied</th>
                        <th>Date Submitted</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Juan Dela Cruz</td>
                        <td>Teacher I (Elementary)</td>
                        <td>Feb 24, 2026</td>
                        <td><span class="status-pill pending">Pending</span></td>
                        <td><button class="btn-action">Review</button></td>
                    </tr>
                    <tr>
                        <td>Maria Clara</td>
                        <td>Master Teacher II</td>
                        <td>Feb 23, 2026</td>
                        <td><span class="status-pill active">Shortlisted</span></td>
                        <td><button class="btn-action">Review</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </AdminLayout>
</template>

<style scoped>
.dashboard-header {
    margin-bottom: 2rem;
}

.dashboard-header h1 {
    font-size: 1.8rem;
    color: #1e293b;
    margin-bottom: 0.2rem;
}

.dashboard-header p {
    color: #64748b;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2.5rem;
}

.stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    border-top: 4px solid;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.stat-label {
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
}

.stat-value {
    font-size: 2rem;
    color: #0f172a;
    margin-top: 0.5rem;
}

.table-container {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.admin-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
}

.admin-table th {
    padding: 12px;
    border-bottom: 2px solid #f1f5f9;
    color: #64748b;
    font-size: 0.85rem;
}

.admin-table td {
    padding: 16px 12px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.9rem;
}

.status-pill {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
}

.status-pill.pending {
    background: #fef3c7;
    color: #92400e;
}

.status-pill.active {
    background: #dcfce7;
    color: #166534;
}

.btn-action {
    background: #f1f5f9;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    color: #475569;
}

.btn-action:hover {
    background: #e2e8f0;
}

.btn-view-all {
    background: #0f172a;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
}
</style>