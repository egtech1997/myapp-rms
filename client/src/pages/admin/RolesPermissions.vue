<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRoleStore } from '@/stores/roles'

// --- Injections & Stores ---
const toast = inject('$toast')
const roleStore = useRoleStore()

// --- UI State ---
const showCreateModal = ref(false)
const isSaving = ref(false)
const newRoleName = ref('')
const newRoleDesc = ref('')
const activeRoleId = ref(null)

onMounted(async () => {
    try {
        await roleStore.fetchRoles()
        if (roleStore.roles.length > 0) {
            activeRoleId.value = roleStore.roles[0]._id
        }
    } catch (error) {
        toast.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch roles.' })
    }
})

// --- Mock Data: Permission Groups ---
const permissionGroups = ref([
    {
        module: 'USER',
        description: 'Manage employee accounts and system access.',
        permissions: [
            { id: 'user_view', name: 'View User' },
            { id: 'user_create', name: 'Create User' },
            { id: 'user_edit', name: 'Edit User' },
            { id: 'user_delete', name: 'Delete User' },
            { id: 'user_reset_pwd', name: 'Reset User Password' }
        ]
    },
    {
        module: 'ROLE',
        description: 'Manage system roles.',
        permissions: [
            { id: 'role_view', name: 'View Role' },
            { id: 'role_create', name: 'Create Role' },
            { id: 'role_edit', name: 'Edit Role' },
            { id: 'role_delete', name: 'Delete Role' }
        ]
    },
    {
        module: 'JOB VACANCIES',
        description: 'Manage job postings.',
        permissions: [
            { id: 'vac_view', name: 'View Vacancy' },
            { id: 'vac_create', name: 'Create Vacancy' },
            { id: 'vac_edit', name: 'Edit Vacancy' },
            { id: 'vac_delete', name: 'Delete Vacancy' }
        ]
    },
    {
        module: 'APPLICATIONS',
        description: 'Manage submitted applications.',
        permissions: [
            { id: 'app_view', name: 'View Application' },
            { id: 'app_create', name: 'Create Application' },
            { id: 'app_edit', name: 'Update Status' },
            { id: 'app_delete', name: 'Delete Application' }
        ]
    }
])

// --- Computed Properties ---
const activeRole = computed(() => roleStore.roles.find(r => r._id === activeRoleId.value))
const isSuperAdmin = computed(() => activeRole.value?.permissions?.includes('all'))

// --- Methods ---
const selectRole = (id) => {
    activeRoleId.value = id
}

const hasPermission = (permId) => {
    if (!activeRole.value?.permissions) return false
    if (isSuperAdmin.value) return true
    return activeRole.value.permissions.includes(permId)
}

const togglePermission = (permId) => {
    if (isSuperAdmin.value) {
        toast.fire({ icon: 'warning', title: 'Restricted', text: 'Super Admin permissions cannot be modified.' })
        return
    }

    if (!activeRole.value.permissions) activeRole.value.permissions = []

    const perms = activeRole.value.permissions
    const index = perms.indexOf(permId)

    if (index === -1) {
        perms.push(permId)
    } else {
        perms.splice(index, 1)
    }
}

// Module-level "Select All" Logic
const isModuleAllSelected = (module) => {
    if (isSuperAdmin.value) return true;
    if (!activeRole.value?.permissions) return false;
    return module.permissions.every(p => activeRole.value.permissions.includes(p.id));
}

const toggleModuleAll = (module) => {
    if (isSuperAdmin.value) {
        toast.fire({ icon: 'warning', title: 'Restricted', text: 'Super Admin permissions cannot be modified.' });
        return;
    }

    if (!activeRole.value.permissions) activeRole.value.permissions = [];

    const allSelected = isModuleAllSelected(module);

    if (allSelected) {
        // Remove all permissions for this module
        module.permissions.forEach(p => {
            const index = activeRole.value.permissions.indexOf(p.id);
            if (index !== -1) activeRole.value.permissions.splice(index, 1);
        });
    } else {
        // Add missing permissions for this module
        module.permissions.forEach(p => {
            if (!activeRole.value.permissions.includes(p.id)) {
                activeRole.value.permissions.push(p.id);
            }
        });
    }
}

// --- API Actions ---
const handleSaveChanges = async () => {
    isSaving.value = true
    try {
        await roleStore.upsertRole({
            _id: activeRole.value._id,
            name: activeRole.value.name,
            description: activeRole.value.description,
            permissions: activeRole.value.permissions
        })
        toast.fire({ icon: 'success', title: 'Saved', text: 'Role updated successfully.' })
    } catch (error) {
        toast.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to update role.' })
    } finally {
        isSaving.value = false
    }
}

const handleCreateRole = async () => {
    if (!newRoleName.value) return
    isSaving.value = true

    try {
        const payload = {
            name: newRoleName.value,
            description: newRoleDesc.value || 'New custom role.',
            permissions: []
        }

        const response = await roleStore.upsertRole(payload)
        await roleStore.fetchRoles()

        if (response.data && response.data.data) {
            activeRoleId.value = response.data.data._id
        }

        showCreateModal.value = false
        newRoleName.value = ''
        newRoleDesc.value = ''

        toast.fire({ icon: 'success', title: 'Created', text: 'New role created.' })
    } catch (error) {
        toast.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to create role.' })
    } finally {
        isSaving.value = false
    }
}
</script>

<template>
    <div class="flex flex-col h-full gap-6">

        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-[var(--text-main)]">Roles & Permissions</h1>
                <p class="text-sm text-[var(--text-muted)]">Manage system access and modular permissions.</p>
            </div>
            <button @click="showCreateModal = true"
                class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Role
            </button>
        </div>

        <div class="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
            <button v-for="role in roleStore.roles" :key="role._id" @click="selectRole(role._id)"
                class="min-w-[140px] px-4 py-3 rounded-xl border transition-all text-left flex flex-col gap-1" :class="activeRoleId === role._id
                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                    : 'bg-[var(--surface)] border-[var(--border-main)] hover:border-gray-300'">
                <span class="text-sm font-semibold truncate"
                    :class="activeRoleId === role._id ? 'text-blue-700' : 'text-[var(--text-main)]'">
                    {{ role.name }}
                </span>
                <span class="text-xs text-[var(--text-muted)] truncate">{{ role.description || 'Custom Role' }}</span>
            </button>
        </div>

        <div v-if="activeRole"
            class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden animate-fade-in">

            <div
                class="p-6 border-b border-[var(--border-main)] bg-gray-50/50 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div class="flex-1 w-full flex flex-col md:flex-row items-center gap-4">
                    <label class="text-sm font-semibold text-[var(--text-main)] whitespace-nowrap">Role Name</label>
                    <input v-model="activeRole.name" type="text" :disabled="isSuperAdmin"
                        class="w-full md:max-w-md border border-[var(--border-main)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
                </div>
            </div>

            <div class="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div v-for="(group, idx) in permissionGroups" :key="idx"
                        class="border border-[var(--border-main)] rounded-xl overflow-hidden shadow-sm">

                        <div
                            class="bg-[var(--bg-app)] border-b border-[var(--border-main)] px-4 py-3 flex justify-between items-center">
                            <span class="text-sm font-bold text-[var(--text-main)] tracking-wide">{{ group.module }}
                                <span class="text-xs font-normal text-[var(--text-muted)] ml-1">Permission</span></span>

                            <label
                                class="flex items-center gap-2 text-sm text-[var(--text-main)] cursor-pointer select-none">
                                <input type="checkbox" :checked="isModuleAllSelected(group)"
                                    @change="toggleModuleAll(group)" :disabled="isSuperAdmin"
                                    class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer" />
                                Select All
                            </label>
                        </div>

                        <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 bg-[var(--surface)]">
                            <label v-for="perm in group.permissions" :key="perm.id"
                                class="flex items-center gap-2.5 text-sm text-[var(--text-main)] cursor-pointer group">
                                <input type="checkbox" :checked="hasPermission(perm.id)"
                                    @change="togglePermission(perm.id)" :disabled="isSuperAdmin"
                                    class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer" />
                                <span class="group-hover:text-black transition-colors">{{ perm.name }}</span>
                            </label>
                        </div>

                    </div>
                </div>
            </div>

            <div class="p-4 border-t border-[var(--border-main)] bg-gray-50/50 flex justify-end gap-3">
                <button
                    class="px-5 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                    Discard
                </button>
                <button @click="handleSaveChanges" :disabled="isSaving || isSuperAdmin"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                    <svg v-if="isSaving" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                        fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                    </svg>
                    {{ isSaving ? 'Updating...' : 'Update Role' }}
                </button>
            </div>
        </div>

        <div v-else
            class="flex-1 flex items-center justify-center bg-[var(--surface)] border border-[var(--border-main)] rounded-xl">
            <div class="text-center text-[var(--text-muted)]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p>No roles found. Create a role to get started.</p>
            </div>
        </div>

    </div>

    <div v-if="showCreateModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
        <div
            class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-zoom-in">
            <div class="px-6 py-4 border-b border-[var(--border-main)] flex justify-between items-center">
                <h3 class="text-lg font-bold text-[var(--text-main)]">Create New Role</h3>
                <button @click="showCreateModal = false" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="p-6 flex flex-col gap-4">
                <div>
                    <label class="block text-sm font-medium text-[var(--text-main)] mb-1.5">Role Name</label>
                    <input v-model="newRoleName" type="text" placeholder="e.g. HR Manager"
                        class="w-full border border-[var(--border-main)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-[var(--text-main)] mb-1.5">Description
                        (Optional)</label>
                    <textarea v-model="newRoleDesc" rows="3" placeholder="Brief description of this role..."
                        class="w-full border border-[var(--border-main)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"></textarea>
                </div>
            </div>

            <div class="px-6 py-4 bg-gray-50/50 border-t border-[var(--border-main)] flex justify-end gap-3">
                <button @click="showCreateModal = false"
                    class="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">Cancel</button>
                <button @click="handleCreateRole" :disabled="!newRoleName || isSaving"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ isSaving ? 'Creating...' : 'Create Role' }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.2s ease-out;
}

.animate-zoom-in {
    animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes zoomIn {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
    }

    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

/* Horizontal Scrollbar for Roles List */
.custom-scrollbar::-webkit-scrollbar {
    height: 6px;
    /* Horizontal scrollbar thickness */
    width: 6px;
    /* Vertical scrollbar thickness */
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: var(--border-main);
    border-radius: 20px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #cbd5e1;
    /* Tailwind slate-300 */
}
</style>