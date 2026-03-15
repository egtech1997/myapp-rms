<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRoleStore } from '@/stores/roles'
import { AppBreadcrumb, AppButton, AppModal, AppInput, AppTextarea, AppPageHeader } from '@/components/ui'

const toast = inject('$toast')
const swal  = inject('$swal')
const roleStore = useRoleStore()

const breadcrumbs = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Security & Access', active: true },
]

const showCreateModal = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const newRoleName = ref('')
const newRoleDesc = ref('')
const roleSearch = ref('')
const activeRoleId = ref(null)

const permissionGroups = [
  {
    module: 'Overview', icon: 'pi-home',
    permissions: [
      { id: 'dash_view',   name: 'View Dashboard',  desc: 'Can see the primary analytics and overview.' },
    ]
  },
  {
    module: 'Vacancies', icon: 'pi-briefcase',
    permissions: [
      { id: 'vac_view',    name: 'View Vacancies',  desc: 'Can see the list of active job postings.' },
      { id: 'vac_create',  name: 'Create Vacancy',  desc: 'Can create new vacancy drafts.' },
      { id: 'vac_edit',    name: 'Edit Vacancy',    desc: 'Can update vacancy details.' },
      { id: 'vac_delete',  name: 'Delete/Archive',  desc: 'Can archive expired positions.' },
    ]
  },
  {
    module: 'Applicants', icon: 'pi-users',
    permissions: [
      { id: 'app_view',           name: 'View Applicants', desc: 'Can see the list of people who applied.' },
      { id: 'app_view_sensitive', name: 'Sensitive Data',  desc: 'Can see PDS Address, Phone, and Family.' },
      { id: 'app_verify',         name: 'Verify Records',  desc: 'Can perform the HR PDS audit checklist.' },
      { id: 'app_disqualify',     name: 'Disqualify',      desc: 'Can mark applicants as disqualified.' },
    ]
  },
  {
    module: 'Comparative Assessment', icon: 'pi-chart-bar',
    permissions: [
      { id: 'eval_view',        name: 'View Scores',     desc: 'Can see the evaluation dashboard.' },
      { id: 'eval_score',       name: 'Input Points',    desc: 'Can rate applicants based on rubrics.' },
      { id: 'eval_view_others', name: 'View Panel Data', desc: 'Can see scores from other raters.' },
      { id: 'eval_finalize',    name: 'Finalize Score',  desc: 'Can lock scores for ranking.' },
    ]
  },
  {
    module: 'Registry (RQA)', icon: 'pi-verified',
    permissions: [
      { id: 'rqa_view',     name: 'View Registry',   desc: 'Can see the ranked RQA list.' },
      { id: 'rqa_generate', name: 'Generate Rank',   desc: 'Can trigger the tie-breaking engine.' },
      { id: 'rqa_export',   name: 'Export Reports',  desc: 'Can download official PDFs (CAR-RQA).' },
      { id: 'rqa_publish',  name: 'Official Publish', desc: 'Can finalize RQA for appointment.' },
    ]
  },
  {
    module: 'SDS Appointment', icon: 'pi-star-fill',
    permissions: [
      { id: 'appt_view',     name: 'View Top 5',    desc: 'Can see the Selection Pool grid.' },
      { id: 'appt_select',   name: 'Appoint Power', desc: 'Authorized to officially appoint candidates.' },
      { id: 'appt_generate', name: 'Print Papers',  desc: 'Can generate appointment letters.' },
    ]
  },
  {
    module: 'Administration', icon: 'pi-megaphone',
    permissions: [
      { id: 'ann_manage',    name: 'Announcements',  desc: 'Can create and post public notices.' },
      { id: 'set_manage',    name: 'Global Settings', desc: 'Can edit system names, logos, and configs.' },
      { id: 'rubric_manage', name: 'Manage Rubrics',  desc: 'Can edit scoring criteria and points.' },
    ]
  },
  {
    module: 'System Admin', icon: 'pi-cog',
    permissions: [
      { id: 'audit_view',  name: 'View Audit Logs',   desc: 'Can track user and system activity.' },
      { id: 'role_view',   name: 'View Roles',        desc: 'Can see the list of system roles.' },
      { id: 'role_manage', name: 'Manage Security',   desc: 'Can edit roles and permissions.' },
      { id: 'user_view',   name: 'View Users',        desc: 'Can see the list of system accounts.' },
      { id: 'user_manage', name: 'User Management',   desc: 'Can manage internal system accounts.' },
    ]
  }
]

onMounted(async () => {
  try {
    await roleStore.fetchRoles()
    if (roleStore.roles.length > 0) activeRoleId.value = roleStore.roles[0]._id
  } catch {
    toast.fire({ icon: 'error', title: 'Connection Error', text: 'Roles could not be loaded.' })
  }
})

const activeRole = computed(() => roleStore.roles.find(r => r._id === activeRoleId.value))
const isSuperAdmin = computed(() => activeRole.value?.name?.toLowerCase().includes('super'))
const isSystemRole = computed(() => ['super_admin', 'admin', 'user'].includes(activeRole.value?.name?.toLowerCase()))

// Filter roles based on search
const filteredRoles = computed(() => {
  if (!roleSearch.value) return roleStore.roles
  const q = roleSearch.value.toLowerCase()
  return roleStore.roles.filter(r => 
    r.name.toLowerCase().includes(q) || 
    (r.description || '').toLowerCase().includes(q)
  )
})

const hasPermission = (permId) => {
  if (isSuperAdmin.value) return true
  return activeRole.value?.permissions?.includes(permId) || false
}

const togglePermission = (permId) => {
  if (isSuperAdmin.value) {
    toast.fire({ icon: 'warning', title: 'Protected Role', text: 'Super Admin privileges are immutable.' })
    return
  }
  const perms = [...(activeRole.value.permissions || [])]
  const idx = perms.indexOf(permId)
  if (idx === -1) perms.push(permId)
  else perms.splice(idx, 1)
  activeRole.value.permissions = perms
}

const toggleModuleAll = (group) => {
  if (isSuperAdmin.value) return
  const currentPerms = [...(activeRole.value.permissions || [])]
  const modulePermIds = group.permissions.map(p => p.id)
  const allSelected = modulePermIds.every(id => currentPerms.includes(id))
  activeRole.value.permissions = allSelected
    ? currentPerms.filter(id => !modulePermIds.includes(id))
    : [...currentPerms, ...modulePermIds.filter(id => !currentPerms.includes(id))]
}

const getGrantedCount = (group) => {
  if (isSuperAdmin.value) return group.permissions.length
  return group.permissions.filter(p => activeRole.value?.permissions?.includes(p.id)).length
}

const handleSaveChanges = async () => {
  isSaving.value = true
  try {
    await roleStore.upsertRole(activeRole.value)
    toast.fire({ icon: 'success', title: 'System Updated', text: 'Role permissions applied immediately.' })
  } catch {
    toast.fire({ icon: 'error', title: 'Save Failed', text: 'Permissions could not be synchronized.' })
  } finally {
    isSaving.value = false
  }
}

const handleCreateRole = async () => {
  if (!newRoleName.value) return
  isSaving.value = true
  try {
    const res = await roleStore.upsertRole({ name: newRoleName.value, description: newRoleDesc.value, permissions: [] })
    await roleStore.fetchRoles()
    activeRoleId.value = res.data.data._id
    showCreateModal.value = false
    newRoleName.value = ''
    newRoleDesc.value = ''
    toast.fire({ icon: 'success', title: 'Role Created' })
  } catch {
    toast.fire({ icon: 'error', title: 'Error', text: 'Duplicate role name or server error.' })
  } finally {
    isSaving.value = false
  }
}

const handleDeleteRole = async () => {
  if (isSystemRole.value) {
    toast.fire({ icon: 'error', title: 'Access Denied', text: 'System-critical roles cannot be removed.' })
    return
  }

  const result = await swal.fire({
    title: 'Delete Role?',
    html: `Are you sure you want to delete <strong>${activeRole.value.name}</strong>? This will affect all users assigned to this role.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    confirmButtonText: 'Yes, Delete Role',
    reverseButtons: true
  })

  if (!result.isConfirmed) return

  isDeleting.value = true
  try {
    await roleStore.deleteRole(activeRole.value._id)
    await roleStore.fetchRoles()
    if (roleStore.roles.length > 0) {
      activeRoleId.value = roleStore.roles[0]._id
    } else {
      activeRoleId.value = null
    }
    toast.fire({ icon: 'success', title: 'Role Removed' })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Action Failed', text: err.response?.data?.message || 'Could not delete role.' })
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 h-full animate-fade-in">
    <AppBreadcrumb :items="breadcrumbs" />

    <AppPageHeader title="Access Control Matrix" subtitle="Define module-level authorization and user privileges." icon="pi-shield">
      <template #actions>
        <AppButton variant="primary" icon="pi-plus" @click="showCreateModal = true">
          Create New Role
        </AppButton>
      </template>
    </AppPageHeader>

    <div class="flex flex-col lg:flex-row gap-6 items-start">

      <!-- Role Sidebar -->
      <div class="w-full lg:w-80 flex flex-col gap-4 flex-shrink-0">
        <div class="relative group">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs group-focus-within:text-[var(--color-primary)] transition-colors"></i>
          <input v-model="roleSearch" placeholder="Search roles..."
            class="w-full h-10 pl-9 pr-3 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-all" />
        </div>

        <div class="flex flex-col gap-2 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar pr-1">
          <p class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-1 mb-1">System & Custom Roles</p>
          <div v-for="role in filteredRoles" :key="role._id"
            @click="activeRoleId = role._id"
            :class="['p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden',
              activeRoleId === role._id
                ? 'bg-[var(--surface)] border-[var(--color-primary)] shadow-md ring-2 ring-[var(--color-primary-ring)]/10'
                : 'bg-[var(--surface)] border-[var(--border-main)] hover:border-[var(--border-strong)] hover:shadow-sm']">
            
            <div v-if="activeRoleId === role._id" class="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)]"></div>

            <div class="flex items-center justify-between mb-2">
              <div :class="['w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                activeRoleId === role._id ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'bg-[var(--bg-app)] text-[var(--text-muted)] group-hover:text-[var(--text-main)]']">
                <i class="pi pi-shield text-xs"></i>
              </div>
              <span v-if="['super_admin', 'admin', 'user'].includes(role.name.toLowerCase())"
                class="text-[8px] font-black bg-[var(--bg-app)] text-[var(--text-muted)] px-2 py-0.5 rounded border border-[var(--border-main)] uppercase">System</span>
            </div>
            <h3 :class="['text-sm font-bold tracking-tight uppercase', activeRoleId === role._id ? 'text-[var(--text-main)]' : 'text-[var(--text-sub)]']">{{ role.name }}</h3>
            <p class="text-[10px] text-[var(--text-muted)] font-medium mt-1 line-clamp-1 italic">{{ role.description || 'No description provided' }}</p>
          </div>

          <div v-if="filteredRoles.length === 0" class="py-10 text-center opacity-50">
            <i class="pi pi-search text-2xl mb-2"></i>
            <p class="text-xs font-bold uppercase tracking-widest">No matching roles</p>
          </div>
        </div>
      </div>

      <!-- Permission Matrix -->
      <div v-if="activeRole" class="flex-1 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-sm overflow-hidden flex flex-col self-stretch min-h-[600px]">

        <!-- Role Header -->
        <div class="px-8 py-6 bg-[var(--bg-app)] border-b border-[var(--border-main)]">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div class="flex items-center gap-5 flex-1 min-w-0">
              <div class="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border-main)] flex items-center justify-center text-[var(--color-primary)] shadow-sm">
                <i class="pi pi-lock-open text-xl"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3">
                  <input v-model="activeRole.name" :disabled="isSystemRole"
                    class="bg-transparent border-none text-xl font-black text-[var(--text-main)] focus:ring-0 p-0 w-full outline-none disabled:opacity-70 uppercase tracking-tight" />
                  <span v-if="isSystemRole" title="This role is required by the system engine and cannot be renamed or deleted."
                    class="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center cursor-help">
                    <i class="pi pi-info text-[10px]"></i>
                  </span>
                </div>
                <div class="mt-1 flex items-center gap-2">
                  <input v-model="activeRole.description" :disabled="isSuperAdmin" placeholder="Describe this role's purpose..."
                    class="bg-transparent border-none text-[11px] font-medium text-[var(--text-muted)] focus:ring-0 p-0 w-full outline-none italic" />
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 self-end sm:self-center">
              <button v-if="!isSystemRole" @click="handleDeleteRole" :disabled="isDeleting"
                class="h-10 px-4 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors text-xs font-bold flex items-center gap-2">
                <i :class="['pi text-xs', isDeleting ? 'pi-spin pi-spinner' : 'pi-trash']"></i>
                Delete Role
              </button>
              <AppButton v-if="!isSuperAdmin" variant="primary" size="lg" :loading="isSaving" @click="handleSaveChanges">
                Sync Privileges
              </AppButton>
              <div v-else class="h-11 px-5 rounded-xl bg-[var(--color-navy)] border border-white/10 flex items-center gap-2 text-white text-xs font-black uppercase tracking-widest shadow-lg">
                <i class="pi pi-lock text-xs"></i> Immutable Master
              </div>
            </div>
          </div>
          
          <div class="mt-6 flex items-center gap-6">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Active Keys:</span>
              <span class="text-xs font-black text-[var(--color-primary)] bg-[var(--color-primary-light)] px-2 py-0.5 rounded-lg border border-[var(--color-primary)]/20">
                {{ activeRole.permissions?.length || 0 }}
              </span>
            </div>
            <div class="w-px h-4 bg-[var(--border-main)]"></div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Status:</span>
              <span :class="['text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest', isSystemRole ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-green-50 text-green-600 border border-green-200']">
                {{ isSystemRole ? 'System Protected' : 'Custom Config' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Matrix Content -->
        <div class="flex-1 p-8 space-y-10 custom-scrollbar overflow-y-auto bg-[var(--surface)]">
          <div v-for="group in permissionGroups" :key="group.module" class="space-y-4">
            <div class="flex items-center justify-between border-b border-[var(--border-main)] pb-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-[var(--bg-app)] flex items-center justify-center text-[var(--color-primary)]">
                  <i :class="['pi text-sm', group.icon]"></i>
                </div>
                <div>
                  <h4 class="text-xs font-black text-[var(--text-main)] uppercase tracking-[0.15em]">{{ group.module }}</h4>
                  <p class="text-[9px] font-bold text-[var(--text-faint)] uppercase tracking-tighter mt-0.5">
                    {{ getGrantedCount(group) }} OF {{ group.permissions.length }} GRANTED
                  </p>
                </div>
              </div>
              <button v-if="!isSuperAdmin" type="button" @click="toggleModuleAll(group)"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-app)] transition-colors group/btn">
                <span class="text-[9px] font-black text-[var(--text-muted)] group-hover/btn:text-[var(--color-primary)] uppercase tracking-widest">Toggle All</span>
                <div :class="['w-4 h-4 rounded border flex items-center justify-center transition-all', 
                  group.permissions.every(p => hasPermission(p.id)) ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--border-main)] bg-white']">
                  <i v-if="group.permissions.every(p => hasPermission(p.id))" class="pi pi-check text-white text-[8px]"></i>
                </div>
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div v-for="perm in group.permissions" :key="perm.id"
                @click="togglePermission(perm.id)"
                :class="['p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-3 group/item relative overflow-hidden',
                  hasPermission(perm.id)
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/20 shadow-sm'
                    : 'border-[var(--bg-app)] bg-[var(--bg-app)] hover:border-[var(--border-main)] hover:bg-[var(--surface)] opacity-80 hover:opacity-100']">
                
                <div class="flex items-center justify-between w-full">
                  <p :class="['text-11px] font-black uppercase tracking-tight', hasPermission(perm.id) ? 'text-[var(--color-primary)]' : 'text-[var(--text-sub)]']">
                    {{ perm.name }}
                  </p>
                  <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                    hasPermission(perm.id) ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--border-main)] bg-white']">
                    <i v-if="hasPermission(perm.id)" class="pi pi-check text-white text-[9px] font-black"></i>
                  </div>
                </div>
                <p class="text-[10px] text-[var(--text-muted)] font-medium leading-tight">{{ perm.desc }}</p>
                
                <div v-if="hasPermission(perm.id)" class="absolute -bottom-2 -right-2 opacity-5 pointer-events-none">
                  <i class="pi pi-shield text-4xl"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex-1 py-32 bg-[var(--surface)] border border-dashed border-[var(--border-main)] rounded-2xl flex flex-col items-center justify-center text-center px-10 self-stretch min-h-[600px]">
        <div class="w-20 h-20 rounded-3xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-faint)] mb-6 shadow-sm">
          <i class="pi pi-shield text-4xl"></i>
        </div>
        <h3 class="text-lg font-black text-[var(--text-main)] uppercase tracking-tight">Access Control Station</h3>
        <p class="text-sm text-[var(--text-muted)] mt-2 max-w-xs font-medium">Select a security role from the left panel to modify its granular module permissions and system-wide visibility.</p>
      </div>

    </div>

    <!-- Create Role Modal -->
    <AppModal
      v-model="showCreateModal"
      title="Initialize Security Role"
      subtitle="Define a new access tier for system users."
      icon="pi-shield"
      size="sm">

      <div class="space-y-5">
        <AppInput
          v-model="newRoleName"
          label="Role Identifier"
          placeholder="e.g. DISTRICT_ADMIN"
          class="uppercase"
          hint="Use SCREAMING_SNAKE_CASE — e.g. DISTRICT_ADMIN"
        />
        <AppTextarea
          v-model="newRoleDesc"
          label="Role Purpose / Scope"
          placeholder="Describe the responsibilities associated with this role..."
          :rows="3"
          hint="Optional — helps admins understand when to assign this role"
        />
      </div>

      <template #footer>
        <AppButton variant="ghost" @click="showCreateModal = false">Cancel</AppButton>
        <AppButton variant="primary" :loading="isSaving" :disabled="!newRoleName" @click="handleCreateRole">
          Initialize Role
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
