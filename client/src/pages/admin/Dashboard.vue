<script setup>
import AdminLayout from '@/layouts/AdminLayout.vue';
import { ref } from 'vue';

const stats = ref([
    { label: 'Total Applicants', value: '1,248', icon: 'pi-users', color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+12% this week', trendColor: 'text-emerald-500', trendIcon: 'pi-arrow-up' },
    { label: 'Pending Reviews', value: '42', icon: 'pi-clock', color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Needs attention', trendColor: 'text-amber-500', trendIcon: 'pi-exclamation-circle' },
    { label: 'Active Job Posts', value: '15', icon: 'pi-briefcase', color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '3 closing soon', trendColor: 'text-emerald-500', trendIcon: 'pi-info-circle' },
    { label: 'Reports Sync', value: 'Online', icon: 'pi-sync', color: 'text-purple-600', bg: 'bg-purple-50', trend: 'Updated just now', trendColor: 'text-purple-500', trendIcon: 'pi-check-circle' }
]);

const applications = ref([
    { id: 1, name: 'Juan Dela Cruz', position: 'Teacher I (Elementary)', date: '2026-02-24', status: 'Pending', avatar: 'JC' },
    { id: 2, name: 'Maria Clara', position: 'Master Teacher II', date: '2026-02-23', status: 'Shortlisted', avatar: 'MC' },
    { id: 3, name: 'Crisostomo Ibarra', position: 'Principal I', date: '2026-02-22', status: 'Pending', avatar: 'CI' },
]);

const getStatusSeverity = (status) => {
    switch (status) {
        case 'Shortlisted': return 'success';
        case 'Pending': return 'warn';
        default: return 'info';
    }
};
</script>

<template>
    <AdminLayout>
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
                <h1 class="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">Administrative
                    Overview</h1>
                <p class="text-sm text-[var(--text-secondary)] mt-1">PRIME-HRM Compliance Monitoring & Recruitment
                    Statistics</p>
            </div>
            <div class="flex gap-3">
                <Button label="Generate Report" icon="pi pi-file-pdf" severity="secondary" outlined />
                <Button label="New Job" icon="pi pi-plus" />
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div v-for="stat in stats" :key="stat.label"
                class="bg-[var(--surface-0)] p-6 rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-300 hover:-translate-y-1 group">
                <div class="flex items-start justify-between">
                    <div>
                        <span class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{{
                            stat.label }}</span>
                        <h2 class="text-3xl font-display font-bold text-[var(--text-primary)] mt-2">{{ stat.value }}
                        </h2>
                    </div>
                    <div :class="[stat.bg, stat.color]"
                        class="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                        <i :class="['pi', stat.icon]" class="text-xl"></i>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-[var(--border-color)] text-xs font-medium flex items-center gap-1.5"
                    :class="stat.trendColor">
                    <i :class="['pi', stat.trendIcon]" class="text-[10px]"></i>
                    {{ stat.trend }}
                </div>
            </div>
        </div>

        <div
            class="bg-[var(--surface-0)] rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div
                class="px-6 py-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--surface-0)]">
                <div>
                    <h3 class="text-base font-display font-bold text-[var(--text-primary)]">Recent Applications</h3>
                    <p class="text-xs text-[var(--text-secondary)] mt-0.5">Showing the latest applicant submissions</p>
                </div>
                <Button label="Export CSV" icon="pi pi-download" size="small" variant="text" severity="secondary"
                    class="!text-xs font-semibold" />
            </div>

            <DataTable :value="applications" responsiveLayout="scroll" class="p-datatable-modern">
                <Column field="name" header="Applicant Details" class="py-4">
                    <template #body="slotProps">
                        <div class="flex items-center gap-3 pl-2">
                            <div
                                class="w-9 h-9 rounded-full bg-[var(--surface-100)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                                {{ slotProps.data.avatar }}
                            </div>
                            <div>
                                <div class="text-sm font-semibold text-[var(--text-primary)]">{{ slotProps.data.name }}
                                </div>
                                <div class="text-xs text-[var(--text-secondary)]">{{ slotProps.data.position }}</div>
                            </div>
                        </div>
                    </template>
                </Column>

                <Column field="date" header="Date Submitted">
                    <template #body="slotProps">
                        <div class="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <i class="pi pi-calendar opacity-70 text-xs"></i>
                            {{ slotProps.data.date }}
                        </div>
                    </template>
                </Column>

                <Column field="status" header="Status">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)"
                            class="!px-3 !py-1 !text-[11px] !font-bold !rounded-lg !uppercase !tracking-wider" />
                    </template>
                </Column>

                <Column header="" headerStyle="width: 4rem; text-align: right" bodyStyle="text-align: right">
                    <template #body>
                        <Button icon="pi pi-chevron-right" variant="text" severity="secondary" rounded
                            class="!w-8 !h-8 hover:bg-[var(--surface-50)] transition-colors" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </AdminLayout>
</template>

<style scoped>
/* Modern PrimeVue DataTable Overrides using CSS Variables */
@reference '../../assets/main.css';

:deep(.p-datatable-modern .p-datatable-thead > tr > th) {
    @apply bg-[var(--surface-50)] text-[var(--text-secondary)] text-xs uppercase tracking-wider py-4 px-6 border-y border-[var(--border-color)] font-semibold;
}

:deep(.p-datatable-modern .p-datatable-tbody > tr > td) {
    @apply py-3 px-6 border-b border-[var(--border-color)] bg-[var(--surface-0)] transition-colors duration-200;
}

:deep(.p-datatable-modern .p-datatable-tbody > tr:hover > td) {
    @apply bg-[var(--surface-50)];
}
</style>