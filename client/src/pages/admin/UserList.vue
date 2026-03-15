<script setup>
import { ref, computed, watch, onMounted, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoleStore } from '@/stores/roles'
import apiClient from '@/api/axios'
import { AppModal, AppTableReport, AppPageHeader, AppInput, AppSelect, AppFilterBar } from '@/components/ui'

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

// ─── Export ────────────────────────────────────────────────────────────────
const showReport = ref(false)
const reportCols = [
  { label: 'Username',   key: 'username' },
  { label: 'Email',      key: 'email' },
  { label: 'Roles',      value: (u) => u.roles?.map(r => r.name).join(', ') || '—' },
  { label: 'Status',     value: (u) => u.isActive ? 'Active' : 'Inactive' },
  { label: 'Verified',   value: (u) => u.isVerified ? 'Yes' : 'No' },
  { label: 'Auth',       value: (u) => u.googleId ? 'Google' : 'Email/Password' },
  { label: 'Last Login', value: (u) => formatDate(u.lastLogin) },
  { label: 'Joined',     value: (u) => formatDate(u.createdAt) },
]

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
    setTimeout(() => { selectedUser.value = null }, 350)
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

// ─── Pagination ────────────────────────────────────────────────────────────
const currentPage = ref(1)
const pageSize    = ref(15)

watch([searchQuery, filterRole, filterStatus], () => { currentPage.value = 1 })

const pagedUsers = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredUsers.value.slice(start, start + pageSize.value)
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize.value)))

const pageNumbers = computed(() => {
    const p = totalPages.value
    if (p <= 7) return Array.from({ length: p }, (_, i) => i + 1)
    if (currentPage.value <= 4) return [1, 2, 3, 4, 5, '…', p]
    if (currentPage.value >= p - 3) return [1, '…', p - 4, p - 3, p - 2, p - 1, p]
    return [1, '…', currentPage.value - 1, currentPage.value, currentPage.value + 1, '…', p]
})

// ─── Helpers ───────────────────────────────────────────────────────────────
const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

const roleBadgeClass = (name) => {
    const map = {
        super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
        admin:       'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary-ring)]',
        user:        'bg-[var(--bg-app)] text-[var(--text-muted)] border-[var(--border-main)]',
        applicant:   'bg-green-50 text-green-700 border-green-200',
    }
    return map[name?.toLowerCase()] || 'bg-[var(--bg-app)] text-[var(--text-muted)] border-[var(--border-main)]'
}

const isSuperAdmin = (user) => user?.username === 'super_admin'
</script>

<template>
    <div class="flex flex-col gap-6">

        <AppPageHeader title="User Management" subtitle="Manage accounts, roles, and system access." icon="pi-users">
          <template #actions>
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-xs font-medium text-[var(--text-muted)]">
              <i class="pi pi-users text-[11px]"></i>
              <span>{{ filteredUsers.length }} user{{ filteredUsers.length !== 1 ? 's' : '' }}</span>
            </div>
            <button @click="fetchUsers"
              class="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--border-main)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors"
              title="Refresh">
              <i :class="['pi pi-refresh text-sm', { 'animate-spin': loading }]"></i>
            </button>
          </template>
        </AppPageHeader>

        <!-- ── Toolbar ─────────────────────────────────────────────── -->
        <AppFilterBar
            v-model:search="searchQuery"
            placeholder="Search by name or email..."
            :filter-count="Number(!!filterRole) + Number(filterStatus !== '')"
            @clear="clearFilters"
        >
            <template #filter-extra>
                <p class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wide px-1">Role</p>
                <AppSelect
                    v-model="filterRole"
                    :options="[{ label: 'All Roles', value: '' }, ...roleStore.roles.map(r => ({ label: r.name, value: r.name }))]"
                    size="sm" label="" placeholder="All Roles"
                />
                <p class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wide px-1">Status</p>
                <AppSelect
                    v-model="filterStatus"
                    :options="[{ label: 'All Status', value: '' }, { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]"
                    size="sm" label="" placeholder="All Status"
                />
                <p class="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wide px-1">Sort by</p>
                <div class="flex gap-2 items-end">
                    <div class="flex-1">
                        <AppSelect
                            v-model="sortBy"
                            :options="[
                                { label: 'Date Joined', value: 'createdAt' },
                                { label: 'Name', value: 'username' },
                                { label: 'Email', value: 'email' },
                                { label: 'Last Login', value: 'lastLogin' },
                            ]"
                            size="sm" label="" placeholder="Sort by"
                        />
                    </div>
                    <button @click="sortDir = sortDir === 'asc' ? 'desc' : 'asc'"
                        class="h-9 w-9 flex items-center justify-center rounded-xl border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary-light)] transition-all shrink-0"
                        :title="sortDir === 'asc' ? 'Ascending' : 'Descending'">
                        <i :class="sortDir === 'asc' ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down'" class="text-sm"></i>
                    </button>
                </div>
            </template>
            <template #actions>
                <button @click="showReport = true"
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--text-sub)] hover:bg-[var(--bg-app)] transition-colors text-left">
                    <i class="pi pi-download text-xs text-[var(--text-muted)]"></i>
                    Export / Print
                </button>
            </template>
        </AppFilterBar>

        <!-- ── Table ───────────────────────────────────────────────── -->
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden">

            <!-- Loading skeleton -->
            <div v-if="loading" class="p-6 flex flex-col gap-3">
                <div v-for="i in 5" :key="i"
                    class="h-14 rounded-xl bg-[var(--bg-app)] animate-pulse"
                    :style="{ animationDelay: `${i * 60}ms` }"></div>
            </div>

            <!-- Empty state -->
            <div v-else-if="filteredUsers.length === 0" class="py-20 flex flex-col items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center">
                    <i class="pi pi-users text-2xl text-[var(--text-muted)]"></i>
                </div>
                <div class="text-center">
                    <p class="text-sm font-semibold text-[var(--text-main)]">No users found</p>
                    <p class="text-xs text-[var(--text-muted)] mt-0.5">Try adjusting your search or filters</p>
                </div>
                <button v-if="hasActiveFilters" @click="clearFilters"
                    class="text-xs font-semibold text-[var(--color-primary)] hover:underline">
                    Clear filters
                </button>
            </div>

            <!-- Table -->
            <div v-else class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-[var(--border-main)] bg-[var(--bg-app)]">
                            <th class="px-5 py-3 text-left">
                                <button @click="toggleSort('username')"
                                    class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                    User
                                    <i :class="['pi text-[9px]', sortBy === 'username' ? (sortDir === 'asc' ? 'pi-sort-up text-[var(--color-primary)]' : 'pi-sort-down text-[var(--color-primary)]') : 'pi-sort opacity-50']"></i>
                                </button>
                            </th>
                            <th class="px-5 py-3 text-left">
                                <button @click="toggleSort('email')"
                                    class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                    Email
                                    <i :class="['pi text-[9px]', sortBy === 'email' ? (sortDir === 'asc' ? 'pi-sort-up text-[var(--color-primary)]' : 'pi-sort-down text-[var(--color-primary)]') : 'pi-sort opacity-50']"></i>
                                </button>
                            </th>
                            <th class="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Roles</th>
                            <th class="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                            <th class="px-5 py-3 text-left">
                                <button @click="toggleSort('lastLogin')"
                                    class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                    Last Login
                                    <i :class="['pi text-[9px]', sortBy === 'lastLogin' ? (sortDir === 'asc' ? 'pi-sort-up text-[var(--color-primary)]' : 'pi-sort-down text-[var(--color-primary)]') : 'pi-sort opacity-50']"></i>
                                </button>
                            </th>
                            <th class="px-5 py-3 text-left">
                                <button @click="toggleSort('createdAt')"
                                    class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                    Joined
                                    <i :class="['pi text-[9px]', sortBy === 'createdAt' ? (sortDir === 'asc' ? 'pi-sort-up text-[var(--color-primary)]' : 'pi-sort-down text-[var(--color-primary)]') : 'pi-sort opacity-50']"></i>
                                </button>
                            </th>
                            <th class="px-5 py-3 w-20"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[var(--border-main)]">
                        <tr v-for="user in pagedUsers" :key="user._id"
                            @click="openModal(user)"
                            class="hover:bg-[var(--bg-app)] transition-colors cursor-pointer group">

                            <!-- User -->
                            <td class="px-5 py-3.5">
                                <div class="flex items-center gap-3">
                                    <div class="relative flex-shrink-0">
                                        <img :src="user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=4A4D8F&color=fff&bold=true&size=64`"
                                            :alt="user.username"
                                            class="w-8 h-8 rounded-full object-cover border border-[var(--border-main)]" />
                                        <span v-if="isSuperAdmin(user)"
                                            class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-[var(--surface)] flex items-center justify-center"
                                            title="Super Admin">
                                        </span>
                                    </div>
                                    <div class="min-w-0">
                                        <p class="font-semibold text-[var(--text-main)] truncate text-sm leading-tight">{{ user.username }}</p>
                                        <p v-if="user.googleId" class="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                                            <svg class="w-2.5 h-2.5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                            Google
                                        </p>
                                    </div>
                                </div>
                            </td>

                            <!-- Email -->
                            <td class="px-5 py-3.5 text-sm text-[var(--text-muted)] max-w-[200px]">
                                <p class="truncate">{{ user.email }}</p>
                            </td>

                            <!-- Roles -->
                            <td class="px-5 py-3.5">
                                <div class="flex flex-wrap gap-1">
                                    <span v-for="role in user.roles" :key="role._id"
                                        :class="['text-[10px] font-semibold px-2 py-[2px] rounded-full border', roleBadgeClass(role.name)]">
                                        {{ role.name }}
                                    </span>
                                    <span v-if="!user.roles?.length" class="text-xs text-[var(--text-faint)]">—</span>
                                </div>
                            </td>

                            <!-- Status -->
                            <td class="px-5 py-3.5">
                                <span :class="[
                                    'inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-[3px] rounded-full border',
                                    user.isActive
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-red-50 text-red-600 border-red-200'
                                ]">
                                    <span :class="['w-1.5 h-1.5 rounded-full', user.isActive ? 'bg-green-500' : 'bg-red-400']"></span>
                                    {{ user.isActive ? 'Active' : 'Inactive' }}
                                </span>
                            </td>

                            <!-- Last Login -->
                            <td class="px-5 py-3.5 text-xs text-[var(--text-muted)]">{{ formatDate(user.lastLogin) }}</td>

                            <!-- Joined -->
                            <td class="px-5 py-3.5 text-xs text-[var(--text-muted)]">{{ formatDate(user.createdAt) }}</td>

                            <!-- Actions — always visible -->
                            <td class="px-5 py-3.5 text-right" @click.stop>
                                <button @click="openModal(user)"
                                    class="text-xs font-semibold text-[var(--color-primary)] border border-[var(--color-primary-ring)] px-3 py-1.5 rounded-lg hover:bg-[var(--color-primary-light)] transition-colors">
                                    Manage
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        <!-- ── Pagination ─────────────────────────────────────────── -->
        <div v-if="!loading && filteredUsers.length > pageSize"
            class="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-[var(--border-main)] bg-[var(--surface)]">
            <p class="text-xs text-[var(--text-muted)] font-medium">
                Showing
                <span class="font-bold text-[var(--text-main)]">{{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredUsers.length) }}</span>
                of
                <span class="font-bold text-[var(--text-main)]">{{ filteredUsers.length }}</span>
                users
            </p>
            <nav class="flex items-center gap-1">
                <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
                    class="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <i class="pi pi-chevron-left text-[10px]"></i>
                </button>
                <template v-for="(p, i) in pageNumbers" :key="i">
                    <span v-if="p === '…'" class="w-7 h-7 flex items-center justify-center text-xs text-[var(--text-faint)]">…</span>
                    <button v-else @click="currentPage = p"
                        :class="['w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all',
                            currentPage === p
                                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                                : 'border border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]']">
                        {{ p }}
                    </button>
                </template>
                <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages"
                    class="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <i class="pi pi-chevron-right text-[10px]"></i>
                </button>
            </nav>
        </div>
        </div>


        <!-- ── Export Report ──────────────────────────────────────── -->
        <AppTableReport
            v-model="showReport"
            title="User Registry"
            subtitle="System Accounts"
            :columns="reportCols"
            :rows="filteredUsers"
            filename="UserRegistry" />

        <!-- ── User Management Modal ────────────────────────────────── -->
        <AppModal v-model="showModal" hide-header size="md" @close="closeModal">

            <!-- Custom Header: Avatar + Tabs -->
            <template #header>
                <!-- Blue accent strip is provided by AppModal -->
                <!-- Avatar row -->
                <div class="flex items-center gap-4 px-6 py-4 border-b border-[var(--border-main)] shrink-0">
                    <img v-if="selectedUser"
                        :src="selectedUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.username)}&background=4A4D8F&color=fff&bold=true&size=96`"
                        :alt="selectedUser?.username"
                        class="w-11 h-11 rounded-full object-cover border-2 border-[var(--border-main)] flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <h3 class="text-sm font-bold text-[var(--text-main)] truncate">{{ selectedUser?.username }}</h3>
                            <span v-if="selectedUser && isSuperAdmin(selectedUser)"
                                class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex-shrink-0">
                                PROTECTED
                            </span>
                        </div>
                        <p class="text-xs text-[var(--text-muted)] truncate mt-0.5">{{ selectedUser?.email }}</p>
                    </div>
                    <button @click="closeModal"
                        class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors flex-shrink-0">
                        <i class="pi pi-times text-sm"></i>
                    </button>
                </div>
                <!-- Tab Bar -->
                <div class="flex border-b border-[var(--border-main)] bg-[var(--bg-app)] shrink-0">
                    <button v-for="tab in [
                        { id: 'info',     label: 'Account',  icon: 'pi-user'   },
                        { id: 'roles',    label: 'Roles',    icon: 'pi-shield' },
                        { id: 'password', label: 'Password', icon: 'pi-key'    },
                    ]" :key="tab.id"
                        @click="modalTab = tab.id"
                        :class="[
                            'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2',
                            modalTab === tab.id
                                ? 'text-[var(--color-primary)] border-[var(--color-primary)] bg-[var(--surface)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] border-transparent'
                        ]">
                        <i :class="['pi text-[10px]', tab.icon]"></i>
                        {{ tab.label }}
                    </button>
                </div>
            </template>

            <!-- Tab Content with smooth transition -->
            <Transition name="tab-slide" mode="out-in">

                <!-- Tab: Account Info -->
                <div v-if="modalTab === 'info'" key="info" class="flex flex-col gap-5">
                    <div v-if="selectedUser" class="grid grid-cols-2 gap-3">
                        <div class="bg-[var(--bg-app)] rounded-xl p-4 border border-[var(--border-main)]">
                            <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Status</p>
                            <span :class="['inline-flex items-center gap-1.5 text-sm font-semibold', selectedUser.isActive ? 'text-green-600' : 'text-red-500']">
                                <span :class="['w-2 h-2 rounded-full', selectedUser.isActive ? 'bg-green-500' : 'bg-red-400']"></span>
                                {{ selectedUser.isActive ? 'Active' : 'Inactive' }}
                            </span>
                        </div>
                        <div class="bg-[var(--bg-app)] rounded-xl p-4 border border-[var(--border-main)]">
                            <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Verified</p>
                            <span :class="['text-sm font-semibold', selectedUser.isVerified ? 'text-green-600' : 'text-amber-500']">
                                {{ selectedUser.isVerified ? 'Verified' : 'Unverified' }}
                            </span>
                        </div>
                        <div class="bg-[var(--bg-app)] rounded-xl p-4 border border-[var(--border-main)]">
                            <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Last Login</p>
                            <p class="text-sm font-medium text-[var(--text-main)]">{{ formatDate(selectedUser.lastLogin) }}</p>
                        </div>
                        <div class="bg-[var(--bg-app)] rounded-xl p-4 border border-[var(--border-main)]">
                            <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Date Joined</p>
                            <p class="text-sm font-medium text-[var(--text-main)]">{{ formatDate(selectedUser.createdAt) }}</p>
                        </div>
                        <div class="col-span-2 bg-[var(--bg-app)] rounded-xl p-4 border border-[var(--border-main)]">
                            <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Auth Method</p>
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

                    <div v-if="selectedUser && canManage && !isSuperAdmin(selectedUser)" class="flex flex-col gap-2 pt-1 border-t border-[var(--border-main)]">
                        <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] pt-1">Account Actions</p>
                        <div class="flex gap-2">
                            <button @click="handleToggleStatus" :disabled="modalLoading"
                                :class="[
                                    'flex-1 h-10 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 border',
                                    selectedUser.isActive
                                        ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                        : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                ]">
                                <i v-if="modalLoading" class="pi pi-spin pi-spinner text-sm"></i>
                                <i v-else :class="selectedUser.isActive ? 'pi pi-ban' : 'pi pi-check-circle'" class="text-sm"></i>
                                {{ selectedUser.isActive ? 'Deactivate' : 'Activate' }}
                            </button>
                            <button @click="handleDelete" :disabled="modalLoading"
                                class="flex-1 h-10 rounded-xl text-sm font-semibold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                <i class="pi pi-trash text-sm"></i>
                                Delete User
                            </button>
                        </div>
                    </div>
                    <div v-if="selectedUser && isSuperAdmin(selectedUser)"
                        class="flex items-start gap-3 p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-700">
                        <i class="pi pi-lock text-base flex-shrink-0 mt-0.5"></i>
                        <p class="text-sm">This is a protected system account. Administrative actions are restricted.</p>
                    </div>
                </div>

                <!-- Tab: Roles -->
                <div v-else-if="modalTab === 'roles'" key="roles" class="flex flex-col gap-4">
                    <p class="text-sm text-[var(--text-muted)]">Assign roles to control access. Changes apply after saving.</p>

                    <div v-if="roleStore.loading" class="flex flex-col gap-2">
                        <div v-for="i in 4" :key="i" class="h-14 rounded-xl bg-[var(--bg-app)] animate-pulse"></div>
                    </div>
                    <div v-else class="flex flex-col gap-2">
                        <label v-for="role in roleStore.roles" :key="role._id"
                            :class="[
                                'flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all select-none',
                                selectedRoles.includes(role._id)
                                    ? 'bg-[var(--color-primary-light)] border-[var(--color-primary-ring)]'
                                    : 'bg-[var(--bg-app)] border-[var(--border-main)] hover:border-[var(--border-strong)]',
                                (!canManage || (selectedUser && isSuperAdmin(selectedUser))) ? 'opacity-60 cursor-not-allowed' : ''
                            ]">
                            <input type="checkbox"
                                :checked="selectedRoles.includes(role._id)"
                                @change="toggleRoleSelection(role._id)"
                                :disabled="!canManage || (selectedUser && isSuperAdmin(selectedUser))"
                                class="w-4 h-4 rounded text-[var(--color-primary)] border-[var(--border-main)] focus:ring-[var(--color-primary-ring)] cursor-pointer disabled:cursor-not-allowed" />
                            <div class="flex-1 min-w-0">
                                <p :class="['text-sm font-semibold leading-tight', selectedRoles.includes(role._id) ? 'text-[var(--color-primary)]' : 'text-[var(--text-main)]']">
                                    {{ role.name }}
                                </p>
                                <p class="text-[10px] text-[var(--text-muted)] mt-0.5">
                                    {{ role.permissions?.length || 0 }} permission{{ role.permissions?.length !== 1 ? 's' : '' }}
                                </p>
                            </div>
                            <span v-if="selectedRoles.includes(role._id)"
                                class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-white flex-shrink-0">
                                Assigned
                            </span>
                        </label>
                    </div>
                    <div v-if="canManage && selectedUser && !isSuperAdmin(selectedUser)" class="pt-1 border-t border-[var(--border-main)]">
                        <button @click="handleUpdateRoles" :disabled="modalLoading"
                            class="btn-primary w-full h-10 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                            <i v-if="modalLoading" class="pi pi-spin pi-spinner text-sm"></i>
                            <i v-else class="pi pi-save text-sm"></i>
                            Save Role Changes
                        </button>
                    </div>
                </div>

                <!-- Tab: Password -->
                <div v-else key="password" class="flex flex-col gap-5">
                    <div v-if="selectedUser && isSuperAdmin(selectedUser)"
                        class="flex items-start gap-3 p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-700">
                        <i class="pi pi-lock text-base flex-shrink-0 mt-0.5"></i>
                        <p class="text-sm">Super admin password cannot be reset from this panel.</p>
                    </div>
                    <template v-else-if="canManage">
                        <div class="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                            <i class="pi pi-exclamation-triangle text-base flex-shrink-0 mt-0.5"></i>
                            <p class="text-sm leading-relaxed">This will immediately overwrite the user's current password.</p>
                        </div>
                        <AppInput
                          v-model="newPassword"
                          label="New Password"
                          toggleable
                          hint="Minimum 8 characters — user will need to re-login"
                        />
                        <button @click="handleResetPassword" :disabled="modalLoading || newPassword.length < 8"
                            class="btn-primary w-full h-10 text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                            <i v-if="modalLoading" class="pi pi-spin pi-spinner text-sm"></i>
                            <i v-else class="pi pi-key text-sm"></i>
                            Reset Password
                        </button>
                    </template>
                    <div v-else class="text-center py-8 text-[var(--text-muted)]">
                        <i class="pi pi-lock text-3xl mb-3 block opacity-30"></i>
                        <p class="text-sm">You don't have permission to reset passwords.</p>
                    </div>
                </div>

            </Transition>
        </AppModal>
    </div>
</template>
