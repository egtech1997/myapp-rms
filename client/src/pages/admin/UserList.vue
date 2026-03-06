<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoleStore } from '@/stores/roles'
import apiClient from '@/api/axios'

const toast = inject('$toast')
const swal = inject('$swal')
const authStore = useAuthStore()
const roleStore = useRoleStore()

// ─── Data ──────────────────────────────────────────────────────────────────
const users = ref([])
const loading = ref(false)

// ─── Filters / Sort ────────────────────────────────────────────────────────
const searchQuery = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const sortBy = ref('createdAt')
const sortDir = ref('desc')

// ─── Modal ─────────────────────────────────────────────────────────────────
const showModal = ref(false)
const selectedUser = ref(null)
const modalTab = ref('info')   // 'info' | 'roles' | 'password'
const modalLoading = ref(false)
const selectedRoles = ref([])
const newPassword = ref('')
const showNewPassword = ref(false)

// ─── Fetch ─────────────────────────────────────────────────────────────────
const fetchUsers = async () => {
    loading.value = true
    try {
        const { data } = await apiClient.get('/v1/users')
        users.value = data.data
    } catch (err) {
        toast.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to load users.' })
    } finally {
        loading.value = false
    }
}

onMounted(async () => {
    await Promise.all([fetchUsers(), roleStore.fetchRoles()])
})

// ─── Computed: filtered + sorted list ──────────────────────────────────────
const filteredUsers = computed(() => {
    let list = [...users.value]

    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        list = list.filter(u =>
            u.username?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
        )
    }

    if (filterRole.value) {
        list = list.filter(u => u.roles?.some(r => r.name === filterRole.value))
    }

    if (filterStatus.value !== '') {
        list = list.filter(u => u.isActive === (filterStatus.value === 'active'))
    }

    list.sort((a, b) => {
        let vA, vB
        if (sortBy.value === 'username') {
            vA = a.username?.toLowerCase() || ''
            vB = b.username?.toLowerCase() || ''
        } else if (sortBy.value === 'email') {
            vA = a.email?.toLowerCase() || ''
            vB = b.email?.toLowerCase() || ''
        } else if (sortBy.value === 'lastLogin') {
            vA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0
            vB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0
        } else {
            vA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            vB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        }
        if (vA < vB) return sortDir.value === 'asc' ? -1 : 1
        if (vA > vB) return sortDir.value === 'asc' ? 1 : -1
        return 0
    })

    return list
})

const canManage = computed(() => authStore.can('user_manage'))

const toggleSort = (field) => {
    if (sortBy.value === field) {
        sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortBy.value = field
        sortDir.value = 'asc'
    }
}

const clearFilters = () => {
    searchQuery.value = ''
    filterRole.value = ''
    filterStatus.value = ''
    sortBy.value = 'createdAt'
    sortDir.value = 'desc'
}

const hasActiveFilters = computed(() =>
    searchQuery.value || filterRole.value || filterStatus.value !== ''
)

// ─── Modal ─────────────────────────────────────────────────────────────────
const openModal = (user) => {
    selectedUser.value = { ...user }
    selectedRoles.value = user.roles?.map(r => r._id) || []
    newPassword.value = ''
    showNewPassword.value = false
    modalTab.value = 'info'
    showModal.value = true
}

const closeModal = () => {
    showModal.value = false
    selectedUser.value = null
}

const toggleRoleSelection = (roleId) => {
    const idx = selectedRoles.value.indexOf(roleId)
    if (idx === -1) selectedRoles.value.push(roleId)
    else selectedRoles.value.splice(idx, 1)
}

// ─── Actions ───────────────────────────────────────────────────────────────
const handleToggleStatus = async () => {
    if (!selectedUser.value) return
    const newStatus = !selectedUser.value.isActive
    modalLoading.value = true
    try {
        await apiClient.patch(`/v1/users/${selectedUser.value._id}/status`, { isActive: newStatus })
        selectedUser.value.isActive = newStatus
        const idx = users.value.findIndex(u => u._id === selectedUser.value._id)
        if (idx !== -1) users.value[idx].isActive = newStatus
        toast.fire({ icon: 'success', title: newStatus ? 'User Activated' : 'User Deactivated' })
    } catch (err) {
        toast.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Action failed.' })
    } finally {
        modalLoading.value = false
    }
}

const handleUpdateRoles = async () => {
    if (!selectedUser.value) return
    modalLoading.value = true
    try {
        const { data } = await apiClient.patch(`/v1/users/${selectedUser.value._id}/roles`, { roles: selectedRoles.value })
        const updatedRoles = data.data.roles
        selectedUser.value.roles = updatedRoles
        const idx = users.value.findIndex(u => u._id === selectedUser.value._id)
        if (idx !== -1) users.value[idx].roles = updatedRoles
        toast.fire({ icon: 'success', title: 'Roles Updated' })
    } catch (err) {
        toast.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to update roles.' })
    } finally {
        modalLoading.value = false
    }
}

const handleResetPassword = async () => {
    if (!selectedUser.value || !newPassword.value) return
    modalLoading.value = true
    try {
        await apiClient.patch(`/v1/users/${selectedUser.value._id}/reset-password`, { newPassword: newPassword.value })
        newPassword.value = ''
        toast.fire({ icon: 'success', title: 'Password Reset', text: `Password for ${selectedUser.value.username} has been updated.` })
    } catch (err) {
        toast.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to reset password.' })
    } finally {
        modalLoading.value = false
    }
}

const handleDelete = async () => {
    if (!selectedUser.value) return
    const result = await swal.fire({
        title: 'Delete User?',
        html: `This will permanently delete <strong>${selectedUser.value.username}</strong>. This cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
    })
    if (!result.isConfirmed) return

    modalLoading.value = true
    try {
        await apiClient.delete(`/v1/users/${selectedUser.value._id}`)
        users.value = users.value.filter(u => u._id !== selectedUser.value._id)
        closeModal()
        toast.fire({ icon: 'success', title: 'User Deleted' })
    } catch (err) {
        toast.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to delete user.' })
    } finally {
        modalLoading.value = false
    }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

const roleBadgeClass = (name) => {
    const map = {
        super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
        admin: 'bg-blue-100 text-blue-700 border-blue-200',
        user: 'bg-slate-100 text-slate-600 border-slate-200',
        applicant: 'bg-green-100 text-green-700 border-green-200',
    }
    return map[name?.toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200'
}

const isSuperAdmin = (user) => user?.username === 'super_admin'
</script>

<template>
    <div class="flex flex-col gap-6">

        <!-- ── Header ──────────────────────────────────────────────────── -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
                <h1 class="text-2xl font-bold text-[var(--text-main)]">User Management</h1>
                <p class="text-sm text-[var(--text-muted)]">
                    Manage user accounts, roles, and access.
                </p>
            </div>
            <div class="flex items-center gap-2">
                <span class="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm font-medium text-[var(--text-muted)]">
                    <i class="pi pi-users mr-1.5"></i>{{ filteredUsers.length }} users
                </span>
                <button @click="fetchUsers"
                    class="p-2 rounded-lg border border-[var(--border-main)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors"
                    title="Refresh">
                    <i :class="['pi pi-refresh text-sm', { 'animate-spin': loading }]"></i>
                </button>
            </div>
        </div>

        <!-- ── Toolbar ─────────────────────────────────────────────────── -->
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
            <!-- Search -->
            <div class="relative flex-1">
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none"></i>
                <input v-model="searchQuery" type="text" placeholder="Search by name or email..."
                    class="w-full h-9 pl-9 pr-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-shadow" />
            </div>

            <div class="flex gap-2 flex-wrap">
                <!-- Filter: Role -->
                <select v-model="filterRole"
                    class="h-9 px-3 pr-8 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-shadow appearance-none cursor-pointer">
                    <option value="">All Roles</option>
                    <option v-for="role in roleStore.roles" :key="role._id" :value="role.name">{{ role.name }}</option>
                </select>

                <!-- Filter: Status -->
                <select v-model="filterStatus"
                    class="h-9 px-3 pr-8 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-shadow appearance-none cursor-pointer">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>

                <!-- Sort -->
                <select v-model="sortBy"
                    class="h-9 px-3 pr-8 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-shadow appearance-none cursor-pointer">
                    <option value="createdAt">Sort: Date Joined</option>
                    <option value="username">Sort: Name</option>
                    <option value="email">Sort: Email</option>
                    <option value="lastLogin">Sort: Last Login</option>
                </select>

                <!-- Sort direction -->
                <button @click="sortDir = sortDir === 'asc' ? 'desc' : 'asc'"
                    class="h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    :title="sortDir === 'asc' ? 'Ascending' : 'Descending'">
                    <i :class="sortDir === 'asc' ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down'" class="text-sm"></i>
                </button>

                <!-- Clear filters -->
                <button v-if="hasActiveFilters" @click="clearFilters"
                    class="h-9 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-xs font-medium text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors flex items-center gap-1.5">
                    <i class="pi pi-times text-[10px]"></i> Clear
                </button>
            </div>
        </div>

        <!-- ── Table ───────────────────────────────────────────────────── -->
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-sm overflow-hidden">

            <!-- Loading skeleton -->
            <div v-if="loading" class="p-8 flex flex-col gap-3">
                <div v-for="i in 5" :key="i" class="h-14 rounded-lg bg-[var(--bg-app)] animate-pulse"></div>
            </div>

            <!-- Empty state -->
            <div v-else-if="filteredUsers.length === 0" class="py-20 flex flex-col items-center gap-3 text-[var(--text-muted)]">
                <i class="pi pi-users text-4xl text-slate-300"></i>
                <p class="text-sm font-medium">No users found</p>
                <button v-if="hasActiveFilters" @click="clearFilters" class="text-xs text-[var(--color-primary)] hover:underline">Clear filters</button>
            </div>

            <!-- Table -->
            <div v-else class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-[var(--border-main)] bg-[var(--bg-app)]">
                            <th class="px-4 py-3 text-left">
                                <button @click="toggleSort('username')"
                                    class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                    User
                                    <i :class="sortBy === 'username' ? (sortDir === 'asc' ? 'pi-sort-up' : 'pi-sort-down') : 'pi-sort'" class="pi text-[10px]"></i>
                                </button>
                            </th>
                            <th class="px-4 py-3 text-left">
                                <button @click="toggleSort('email')"
                                    class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                    Email
                                    <i :class="sortBy === 'email' ? (sortDir === 'asc' ? 'pi-sort-up' : 'pi-sort-down') : 'pi-sort'" class="pi text-[10px]"></i>
                                </button>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Roles</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                            <th class="px-4 py-3 text-left">
                                <button @click="toggleSort('lastLogin')"
                                    class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                    Last Login
                                    <i :class="sortBy === 'lastLogin' ? (sortDir === 'asc' ? 'pi-sort-up' : 'pi-sort-down') : 'pi-sort'" class="pi text-[10px]"></i>
                                </button>
                            </th>
                            <th class="px-4 py-3 text-left">
                                <button @click="toggleSort('createdAt')"
                                    class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                    Joined
                                    <i :class="sortBy === 'createdAt' ? (sortDir === 'asc' ? 'pi-sort-up' : 'pi-sort-down') : 'pi-sort'" class="pi text-[10px]"></i>
                                </button>
                            </th>
                            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[var(--border-main)]">
                        <tr v-for="user in filteredUsers" :key="user._id"
                            @click="openModal(user)"
                            class="hover:bg-[var(--bg-app)] transition-colors cursor-pointer group">

                            <!-- User -->
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-3">
                                    <img :src="user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=E2E8F0&color=334155&bold=true`"
                                        :alt="user.username"
                                        class="w-8 h-8 rounded-full object-cover border border-[var(--border-main)] flex-shrink-0" />
                                    <div class="min-w-0">
                                        <p class="font-medium text-[var(--text-main)] truncate">{{ user.username }}</p>
                                        <p v-if="user.googleId" class="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                                            <svg class="w-3 h-3" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                            Google
                                        </p>
                                    </div>
                                </div>
                            </td>

                            <!-- Email -->
                            <td class="px-4 py-3 text-[var(--text-muted)] truncate max-w-[200px]">{{ user.email }}</td>

                            <!-- Roles -->
                            <td class="px-4 py-3">
                                <div class="flex flex-wrap gap-1">
                                    <span v-for="role in user.roles" :key="role._id"
                                        :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full border', roleBadgeClass(role.name)]">
                                        {{ role.name }}
                                    </span>
                                    <span v-if="!user.roles?.length" class="text-xs text-[var(--text-muted)]">—</span>
                                </div>
                            </td>

                            <!-- Status -->
                            <td class="px-4 py-3">
                                <span :class="[
                                    'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border',
                                    user.isActive
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-red-50 text-red-600 border-red-200'
                                ]">
                                    <span :class="['w-1.5 h-1.5 rounded-full', user.isActive ? 'bg-green-500' : 'bg-red-400']"></span>
                                    {{ user.isActive ? 'Active' : 'Inactive' }}
                                </span>
                            </td>

                            <!-- Last Login -->
                            <td class="px-4 py-3 text-sm text-[var(--text-muted)]">{{ formatDate(user.lastLogin) }}</td>

                            <!-- Joined -->
                            <td class="px-4 py-3 text-sm text-[var(--text-muted)]">{{ formatDate(user.createdAt) }}</td>

                            <!-- Actions -->
                            <td class="px-4 py-3 text-right" @click.stop>
                                <button @click="openModal(user)"
                                    class="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-main)] px-3 py-1.5 rounded-lg hover:bg-[var(--bg-app)] transition-colors opacity-0 group-hover:opacity-100">
                                    Manage
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>


        <!-- ── User Management Modal ──────────────────────────────────────────── -->
        <Teleport to="body">
        <div v-if="showModal && selectedUser"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
            @click.self="closeModal">

            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-zoom-in max-h-[90vh]">

                <!-- Modal Header -->
                <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center gap-4">
                    <img :src="selectedUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.username)}&background=E2E8F0&color=334155&bold=true`"
                        :alt="selectedUser.username"
                        class="w-12 h-12 rounded-full object-cover border-2 border-[var(--border-main)] flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <h3 class="text-base font-bold text-[var(--text-main)] truncate">{{ selectedUser.username }}</h3>
                            <span v-if="isSuperAdmin(selectedUser)"
                                class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex-shrink-0">
                                PROTECTED
                            </span>
                        </div>
                        <p class="text-sm text-[var(--text-muted)] truncate">{{ selectedUser.email }}</p>
                    </div>
                    <button @click="closeModal" class="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors flex-shrink-0">
                        <i class="pi pi-times text-lg"></i>
                    </button>
                </div>

                <!-- Tab Bar -->
                <div class="flex border-b border-[var(--border-main)] bg-[var(--bg-app)]">
                    <button v-for="tab in ['info', 'roles', 'password']" :key="tab"
                        @click="modalTab = tab"
                        :class="[
                            'flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors',
                            modalTab === tab
                                ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-[var(--surface)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        ]">
                        <i :class="['pi mr-1.5', tab === 'info' ? 'pi-user' : tab === 'roles' ? 'pi-shield' : 'pi-key']" class="text-[11px]"></i>
                        {{ tab === 'info' ? 'Account' : tab === 'roles' ? 'Roles' : 'Password' }}
                    </button>
                </div>

                <!-- Tab: Account Info ─────────────────────────────────── -->
                <div v-if="modalTab === 'info'" class="p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar">

                    <!-- Info grid -->
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-[var(--bg-app)] rounded-xl p-4 border border-[var(--border-main)]">
                            <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Status</p>
                            <span :class="[
                                'inline-flex items-center gap-1.5 text-sm font-semibold',
                                selectedUser.isActive ? 'text-green-600' : 'text-red-500'
                            ]">
                                <span :class="['w-2 h-2 rounded-full', selectedUser.isActive ? 'bg-green-500' : 'bg-red-400']"></span>
                                {{ selectedUser.isActive ? 'Active' : 'Inactive' }}
                            </span>
                        </div>
                        <div class="bg-[var(--bg-app)] rounded-xl p-4 border border-[var(--border-main)]">
                            <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Verified</p>
                            <span :class="['text-sm font-semibold', selectedUser.isVerified ? 'text-green-600' : 'text-amber-500']">
                                {{ selectedUser.isVerified ? 'Verified' : 'Unverified' }}
                            </span>
                        </div>
                        <div class="bg-[var(--bg-app)] rounded-xl p-4 border border-[var(--border-main)]">
                            <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Last Login</p>
                            <p class="text-sm font-medium text-[var(--text-main)]">{{ formatDate(selectedUser.lastLogin) }}</p>
                        </div>
                        <div class="bg-[var(--bg-app)] rounded-xl p-4 border border-[var(--border-main)]">
                            <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Date Joined</p>
                            <p class="text-sm font-medium text-[var(--text-main)]">{{ formatDate(selectedUser.createdAt) }}</p>
                        </div>
                        <div class="col-span-2 bg-[var(--bg-app)] rounded-xl p-4 border border-[var(--border-main)]">
                            <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Auth Method</p>
                            <p class="text-sm font-medium text-[var(--text-main)] flex items-center gap-2">
                                <template v-if="selectedUser.googleId">
                                    <svg class="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                    Google OAuth
                                </template>
                                <template v-else>
                                    <i class="pi pi-lock text-[var(--text-muted)] text-sm"></i>
                                    Email / Password
                                </template>
                            </p>
                        </div>
                    </div>

                    <!-- Actions: Status + Delete -->
                    <div v-if="canManage && !isSuperAdmin(selectedUser)" class="flex flex-col gap-3 pt-2 border-t border-[var(--border-main)]">
                        <p class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Actions</p>
                        <div class="flex gap-3">
                            <button @click="handleToggleStatus" :disabled="modalLoading"
                                :class="[
                                    'flex-1 h-10 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50',
                                    selectedUser.isActive
                                        ? 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                                        : 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
                                ]">
                                <i v-if="modalLoading" class="pi pi-spin pi-spinner text-sm"></i>
                                <i v-else :class="selectedUser.isActive ? 'pi pi-ban' : 'pi pi-check-circle'" class="text-sm"></i>
                                {{ selectedUser.isActive ? 'Deactivate' : 'Activate' }}
                            </button>
                            <button @click="handleDelete" :disabled="modalLoading"
                                class="flex-1 h-10 rounded-lg text-sm font-semibold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                <i class="pi pi-trash text-sm"></i>
                                Delete User
                            </button>
                        </div>
                    </div>

                    <div v-if="isSuperAdmin(selectedUser)"
                        class="flex items-center gap-3 p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-700">
                        <i class="pi pi-lock text-lg flex-shrink-0"></i>
                        <p class="text-sm font-medium">This is a protected system account. Administrative actions are restricted.</p>
                    </div>
                </div>

                <!-- Tab: Roles ──────────────────────────────────────────── -->
                <div v-if="modalTab === 'roles'" class="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                    <p class="text-sm text-[var(--text-muted)]">
                        Select the roles to assign to this user. Changes take effect immediately after saving.
                    </p>

                    <div v-if="roleStore.loading" class="flex flex-col gap-2">
                        <div v-for="i in 4" :key="i" class="h-12 rounded-lg bg-[var(--bg-app)] animate-pulse"></div>
                    </div>

                    <div v-else class="flex flex-col gap-2">
                        <label v-for="role in roleStore.roles" :key="role._id"
                            :class="[
                                'flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all select-none',
                                selectedRoles.includes(role._id)
                                    ? 'bg-[var(--color-primary-light)] border-[var(--color-primary-ring)]'
                                    : 'bg-[var(--bg-app)] border-[var(--border-main)] hover:border-gray-300',
                                (!canManage || isSuperAdmin(selectedUser)) ? 'opacity-60 cursor-not-allowed' : ''
                            ]">
                            <input type="checkbox"
                                :checked="selectedRoles.includes(role._id)"
                                @change="toggleRoleSelection(role._id)"
                                :disabled="!canManage || isSuperAdmin(selectedUser)"
                                class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed" />
                            <div class="flex-1">
                                <p :class="['text-sm font-semibold', selectedRoles.includes(role._id) ? 'text-[var(--color-primary)]' : 'text-[var(--text-main)]']">
                                    {{ role.name }}
                                </p>
                                <p class="text-xs text-[var(--text-muted)]">
                                    {{ role.permissions?.length || 0 }} permission{{ role.permissions?.length !== 1 ? 's' : '' }}
                                </p>
                            </div>
                            <span v-if="selectedRoles.includes(role._id)"
                                :class="['text-[10px] font-bold px-2 py-0.5 rounded-full border', roleBadgeClass(role.name)]">
                                Assigned
                            </span>
                        </label>
                    </div>

                    <div v-if="canManage && !isSuperAdmin(selectedUser)" class="pt-2 border-t border-[var(--border-main)]">
                        <button @click="handleUpdateRoles" :disabled="modalLoading"
                            class="w-full h-10 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                            <i v-if="modalLoading" class="pi pi-spin pi-spinner text-sm"></i>
                            <i v-else class="pi pi-save text-sm"></i>
                            Save Role Changes
                        </button>
                    </div>
                </div>

                <!-- Tab: Password ───────────────────────────────────────── -->
                <div v-if="modalTab === 'password'" class="p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar">

                    <div v-if="isSuperAdmin(selectedUser)"
                        class="flex items-center gap-3 p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-700">
                        <i class="pi pi-lock text-lg flex-shrink-0"></i>
                        <p class="text-sm font-medium">Super admin password cannot be reset from this panel.</p>
                    </div>

                    <template v-else-if="canManage">
                        <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-start gap-3">
                            <i class="pi pi-exclamation-triangle mt-0.5 flex-shrink-0"></i>
                            <p class="text-sm">
                                This will immediately overwrite the user's current password. The user will need to use the new password on their next login.
                            </p>
                        </div>

                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">New Password</label>
                            <div class="relative">
                                <input v-model="newPassword" :type="showNewPassword ? 'text' : 'password'"
                                    placeholder="Minimum 8 characters"
                                    class="w-full h-10 pl-3.5 pr-10 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-shadow" />
                                <button type="button" @click="showNewPassword = !showNewPassword"
                                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                    <i :class="['pi text-sm', showNewPassword ? 'pi-eye-slash' : 'pi-eye']"></i>
                                </button>
                            </div>
                        </div>

                        <button @click="handleResetPassword" :disabled="modalLoading || newPassword.length < 8"
                            class="w-full h-10 bg-[var(--text-main)] text-[var(--surface)] text-sm font-semibold rounded-lg transition-all hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                            <i v-if="modalLoading" class="pi pi-spin pi-spinner text-sm"></i>
                            <i v-else class="pi pi-key text-sm"></i>
                            Reset Password
                        </button>
                    </template>

                    <div v-else class="text-center py-8 text-[var(--text-muted)]">
                        <i class="pi pi-lock text-3xl mb-2 block text-slate-300"></i>
                        <p class="text-sm">You don't have permission to reset passwords.</p>
                    </div>
                </div>

            </div>
        </div>
        </Teleport>
    </div>
</template>

