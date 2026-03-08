<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRoleStore } from '@/stores/roles'
import { AppBreadcrumb, AppButton, AppModal, AppInput, AppPageHeader } from '@/components/ui'

const toast = inject('$toast')
const roleStore = useRoleStore()

const breadcrumbs = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Security & Access', active: true },
]

const showCreateModal = ref(false)
const isSaving = ref(false)
const newRoleName = ref('')
const newRoleDesc = ref('')
const activeRoleId = ref(null)

const permissionGroups = [
  {
    module: 'Vacancies', icon: 'pi-briefcase',
    permissions: [
      { id: 'vac_view',    name: 'View Vacancies',  desc: 'Can see the list of active job postings.' },
      { id: 'vac_create',  name: 'Create Vacancy',  desc: 'Can create new vacancy drafts.' },
      { id: 'vac_publish', name: 'Publish Vacancy', desc: 'Can make vacancies visible to the public.' },
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
    module: 'System Admin', icon: 'pi-cog',
    permissions: [
      { id: 'audit_view',  name: 'View Audit Logs',   desc: 'Can track user and system activity.' },
      { id: 'role_manage', name: 'Manage Security',   desc: 'Can edit roles and permissions.' },
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
</script>

<template>
  <div class="flex flex-col gap-6 h-full">
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
      <div class="w-full lg:w-72 flex flex-col gap-2 flex-shrink-0">
        <p class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-1 mb-1">System Roles</p>
        <div v-for="role in roleStore.roles" :key="role._id"
          @click="activeRoleId = role._id"
          :class="['p-4 rounded-xl border transition-all cursor-pointer group',
            activeRoleId === role._id
              ? 'bg-[var(--surface)] border-[var(--color-primary)] shadow-md ring-2 ring-[var(--color-primary-ring)]/20'
              : 'bg-[var(--bg-app)] border-[var(--border-main)] hover:bg-[var(--surface)] hover:border-[var(--border-strong)]']">
          <div class="flex items-center justify-between mb-2">
            <div :class="['w-8 h-8 rounded-lg flex items-center justify-center transition-all',
              activeRoleId === role._id ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--border-main)] text-[var(--text-muted)]']">
              <i class="pi pi-shield text-xs"></i>
            </div>
            <span v-if="role.name.toLowerCase().includes('super')"
              class="text-[8px] font-black bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-200 uppercase">System</span>
          </div>
          <h3 :class="['text-sm font-bold tracking-tight', activeRoleId === role._id ? 'text-[var(--color-primary)]' : 'text-[var(--text-sub)]']">{{ role.name }}</h3>
          <p class="text-[10px] text-[var(--text-muted)] font-medium mt-1 line-clamp-1">{{ role.description || 'Custom user role' }}</p>
        </div>
      </div>

      <!-- Permission Matrix -->
      <div v-if="activeRole" class="flex-1 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl overflow-hidden animate-fade-in">

        <!-- Role Header -->
        <div class="px-6 py-5 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="flex items-center gap-4">
            <div class="w-11 h-11 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)]">
              <i class="pi pi-lock-open text-base"></i>
            </div>
            <div>
              <input v-model="activeRole.name" :disabled="isSuperAdmin"
                class="bg-transparent border-none text-base font-bold text-[var(--text-main)] focus:ring-0 p-0 w-full outline-none disabled:opacity-70" />
              <p class="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                {{ activeRole.permissions?.length || 0 }} Active Permissions
              </p>
            </div>
          </div>
          <div class="flex gap-3">
            <AppButton v-if="!isSuperAdmin" variant="primary" :loading="isSaving" @click="handleSaveChanges">
              Sync Privileges
            </AppButton>
            <div v-else class="h-10 px-4 rounded-xl bg-purple-50 border border-purple-200 flex items-center gap-2 text-purple-600 text-xs font-bold">
              <i class="pi pi-lock text-xs"></i> Immutable Role
            </div>
          </div>
        </div>

        <!-- Matrix Content -->
        <div class="p-6 space-y-8 custom-scrollbar max-h-[65vh] overflow-y-auto">
          <div v-for="group in permissionGroups" :key="group.module" class="space-y-3">
            <div class="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
              <div class="flex items-center gap-3">
                <i :class="['pi text-[var(--color-primary)] text-sm', group.icon]"></i>
                <h4 class="text-xs font-black text-[var(--text-main)] uppercase tracking-[0.15em]">{{ group.module }}</h4>
                <span class="text-[9px] font-black text-[var(--text-muted)] bg-[var(--bg-app)] px-2 py-0.5 rounded border border-[var(--border-main)]">
                  {{ getGrantedCount(group) }}/{{ group.permissions.length }}
                </span>
              </div>
              <label v-if="!isSuperAdmin" class="flex items-center gap-2 cursor-pointer group">
                <span class="text-[9px] font-black text-[var(--text-muted)] group-hover:text-[var(--color-primary)] uppercase transition-colors">Grant All</span>
                <input type="checkbox"
                  :checked="group.permissions.every(p => hasPermission(p.id))"
                  @change="toggleModuleAll(group)"
                  class="w-4 h-4 rounded border-[var(--border-main)] text-[var(--color-primary)] focus:ring-[var(--color-primary-ring)]" />
              </label>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div v-for="perm in group.permissions" :key="perm.id"
                @click="togglePermission(perm.id)"
                :class="['p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3',
                  hasPermission(perm.id)
                    ? 'bg-[var(--color-primary-light)] border-[var(--color-primary-ring)]'
                    : 'bg-[var(--bg-app)] border-[var(--border-main)] hover:border-[var(--border-strong)] opacity-70 hover:opacity-100']">
                <div :class="['mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                  hasPermission(perm.id) ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--border-main)]']">
                  <i v-if="hasPermission(perm.id)" class="pi pi-check text-white text-[10px]"></i>
                </div>
                <div>
                  <p :class="['text-xs font-bold uppercase tracking-tight', hasPermission(perm.id) ? 'text-[var(--color-primary)]' : 'text-[var(--text-sub)]']">{{ perm.name }}</p>
                  <p class="text-[10px] text-[var(--text-muted)] font-medium mt-0.5 leading-relaxed">{{ perm.desc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex-1 py-32 bg-[var(--surface)] border border-dashed border-[var(--border-main)] rounded-2xl flex flex-col items-center justify-center text-center px-10">
        <div class="w-16 h-16 rounded-full bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-faint)] mb-5">
          <i class="pi pi-shield text-3xl"></i>
        </div>
        <h3 class="text-base font-bold text-[var(--text-main)]">Select a Role</h3>
        <p class="text-sm text-[var(--text-muted)] mt-2 max-w-xs">Select a role from the sidebar to manage its system-wide access and module permissions.</p>
      </div>

    </div>

    <!-- Create Role Modal -->
    <AppModal
      v-model="showCreateModal"
      title="New System Role"
      subtitle="Define a new access level for platform users."
      icon="pi-shield"
      size="sm">

      <div class="space-y-4">
        <div class="flex flex-col gap-1.5">
          <label class="field-label block mb-1">Role Name</label>
          <AppInput v-model="newRoleName" placeholder="e.g. Division HRMO" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="field-label block mb-1">Description</label>
          <textarea v-model="newRoleDesc" rows="3" placeholder="Briefly describe system duties..."
            class="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] transition-all resize-none"></textarea>
        </div>
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
