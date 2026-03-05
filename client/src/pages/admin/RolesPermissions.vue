<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useRoleStore } from '@/stores/roles'

const toast = useToast()
const roleStore = useRoleStore()

// UI State
const showCreateModal = ref(false)
const isSaving = ref(false)
const searchQuery = ref('')
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
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch roles.', life: 3000 })
    }
})

// Mock Data: Permission Groups (Keep this hardcoded as it represents your app's actual capabilities)
const permissionGroups = ref([
    {
        module: 'Job Vacancies',
        description: 'Manage job postings and department listings.',
        permissions: [
            { id: 'vac_view', name: 'View Vacancies', desc: 'Can view all job vacancies.' },
            { id: 'vac_create', name: 'Create Vacancies', desc: 'Can post new job vacancies.' },
            { id: 'vac_edit', name: 'Edit Vacancies', desc: 'Can update existing job listings.' },
            { id: 'vac_delete', name: 'Delete Vacancies', desc: 'Can remove job listings.' }
        ]
    },
    {
        module: 'Applications',
        description: 'Manage submitted applications and applicant status.',
        permissions: [
            { id: 'app_view', name: 'View All Applications', desc: 'Can view all submitted applications.' },
            { id: 'app_view_own', name: 'View Own Applications', desc: 'Can view only their own submissions.' },
            { id: 'app_create', name: 'Submit Application', desc: 'Can submit a new job application.' },
            { id: 'app_update', name: 'Update Status', desc: 'Can change application status (e.g., Hired, Rejected).' },
            { id: 'app_comment', name: 'Add Comments', desc: 'Can add internal review notes.' }
        ]
    },
    {
        module: 'System Users',
        description: 'Manage employee accounts and system access.',
        permissions: [
            { id: 'user_view', name: 'View Users', desc: 'Can view user directory.' },
            { id: 'user_manage', name: 'Manage Users', desc: 'Can create, edit, or deactivate users.' },
            { id: 'role_manage', name: 'Manage Roles', desc: 'Can modify roles and permissions.' }
        ]
    }
])

// Computed active role
const activeRole = computed(() => roleStore.roles.find(r => r._id === activeRoleId.value))

// Filter roles based on search
const filteredRoles = computed(() => {
    if (!searchQuery.value) return roleStore.roles
    return roleStore.roles.filter(r => r.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

// Methods
const selectRole = (id) => {
    activeRoleId.value = id
}

const hasPermission = (permId) => {
    if (!activeRole.value?.permissions) return false
    if (activeRole.value.permissions.includes('all')) return true
    return activeRole.value.permissions.includes(permId)
}

const togglePermission = (permId) => {
    // Prevent editing Super Admin logic
    if (activeRole.value.permissions.includes('all')) {
        toast.add({ severity: 'warn', summary: 'Restricted', detail: 'Super Admin permissions cannot be modified.', life: 3000 })
        return
    }

    // Ensure permissions array exists
    if (!activeRole.value.permissions) {
        activeRole.value.permissions = []
    }

    const perms = activeRole.value.permissions
    const index = perms.indexOf(permId)

    if (index === -1) {
        perms.push(permId)
    } else {
        perms.splice(index, 1)
    }
}

// Map to roleStore.upsertRole (Update)
const handleSaveChanges = async () => {
    isSaving.value = true
    try {
        await roleStore.upsertRole({
            _id: activeRole.value._id,
            name: activeRole.value.name,
            description: activeRole.value.description,
            permissions: activeRole.value.permissions
        })
        toast.add({ severity: 'success', summary: 'Saved', detail: 'Role permissions updated successfully.', life: 3000 })
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Failed to update role.', life: 3000 })
    } finally {
        isSaving.value = false
    }
}

// Map to roleStore.upsertRole (Create)
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

        // Refresh the list to get the new DB-generated _id
        await roleStore.fetchRoles()

        // Select the newly created role (assuming your API returns the created object)
        if (response.data && response.data.data) {
            activeRoleId.value = response.data.data._id
        }

        showCreateModal.value = false
        newRoleName.value = ''
        newRoleDesc.value = ''
        toast.add({ severity: 'success', summary: 'Created', detail: 'New role created.', life: 3000 })
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Failed to create role.', life: 3000 })
    } finally {
        isSaving.value = false
    }
}
</script>

<template>
    <button v-for="role in filteredRoles" :key="role._id" @click="selectRole(role._id)"
        class="w-full text-left p-3 rounded-xl transition-all border border-transparent group"
        :class="activeRoleId === role._id ? 'bg-[var(--bg-app)] border-[var(--border-main)] shadow-sm' : 'hover:bg-[var(--bg-app)] hover:border-[var(--border-main)]'">

        <div class="flex items-center justify-between">
            <span class="text-sm font-bold transition-colors"
                :class="activeRoleId === role._id ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'">
                {{ role.name }}
            </span>
            <span
                class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border-main)] text-[var(--text-muted)]">
                {{ role.userCount || 0 }} users
            </span>
        </div>
        <p class="text-xs text-[var(--text-muted)] mt-1.5 line-clamp-1 pr-2">
            {{ role.description }}
        </p>
    </button>

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

/* Custom Scrollbar for fixed panels */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: var(--border-main);
    border-radius: 20px;
}
</style>