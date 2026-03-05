<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useRoleStore } from '@/stores/roleStore';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

// Composable & Stores
const { can } = useAuth();
const roleStore = useRoleStore();
const toast = useToast();
const confirm = useConfirm();

// State
const roles = ref([]);
const loading = ref(false);
const isSaving = ref(false);
const roleDialog = ref(false);
const role = ref({ name: '', permissions: [] });

// Static list of permissions (In a pro app, you might fetch this from backend)
const availablePermissions = [
    'view:roles', 'manage:roles',
    'view:users', 'manage:users',
    'view:jobs', 'manage:jobs',
    'verify:applications', 'audit:logs'
];

const loadRoles = async () => {
    loading.value = true;
    try {
        const data = await roleStore.getRoles();
        roles.value = data;
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch roles' });
    } finally {
        loading.value = false;
    }
};

const openNew = () => {
    role.value = { name: '', permissions: [] };
    roleDialog.value = true;
};

const editRole = (data) => {
    role.value = { ...data };
    roleDialog.value = true;
};

const saveRole = async () => {
    isSaving.value = true;
    try {
        await roleStore.upsertRole(role.value);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Role saved successfully' });
        roleDialog.value = false;
        loadRoles();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Save failed' });
    } finally {
        isSaving.value = false;
    }
};

const confirmDelete = (data) => {
    confirm.require({
        message: `Delete the ${data.name} role? This cannot be undone.`,
        header: 'Danger Zone',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            await roleStore.deleteRole(data._id);
            loadRoles();
        }
    });
};

onMounted(loadRoles);
</script>
<template>
    <div class="p-6">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-800">System Roles & Permissions</h1>
            <Button label="Create New Role" icon="pi pi-plus" severity="primary" @click="openNew"
                v-if="can('manage:roles')" />
        </div>

        <DataTable :value="roles" :loading="loading" stripedRows responsiveLayout="stack" breakpoint="960px">
            <template #empty> No roles found. </template>

            <Column field="name" header="Role Name" sortable>
                <template #body="{ data }">
                    <span class="font-semibold uppercase text-primary">{{ data.name }}</span>
                </template>
            </Column>

            <Column field="permissions" header="Permissions">
                <template #body="{ data }">
                    <div class="flex flex-wrap gap-2">
                        <Tag v-for="perm in data.permissions" :key="perm" :value="perm" severity="info" rounded />
                    </div>
                </template>
            </Column>

            <Column header="Actions" alignFrozen="right" frozen>
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" rounded text severity="warn" @click="editRole(data)" />
                        <Button v-if="data.name !== 'super_admin'" icon="pi pi-trash" rounded text severity="danger"
                            @click="confirmDelete(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="roleDialog" :header="role._id ? 'Edit Role' : 'New Role'" modal
            class="w-full max-w-lg">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="name" class="block font-medium mb-1">Role Name</label>
                    <InputText id="name" v-model="role.name" class="w-full" placeholder="e.g. hr_officer" />
                </div>

                <div>
                    <label class="block font-medium mb-1">Assigned Permissions</label>
                    <MultiSelect v-model="role.permissions" :options="availablePermissions"
                        placeholder="Select Permissions" display="chip" class="w-full" />
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" text severity="secondary" @click="roleDialog = false" />
                <Button label="Save Changes" icon="pi pi-check" @click="saveRole" :loading="isSaving" />
            </template>
        </Dialog>

        <ConfirmDialog />
    </div>
</template>
