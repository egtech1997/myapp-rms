import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const authStore = useAuthStore()

  const user = computed(() => authStore.user)

  const permissions = computed(() => {
    if (!user.value?.roles) return []
    return user.value.roles.flatMap((role) => role.permissions || [])
  })

  const roles = computed(() => {
    if (!user.value?.roles) return []
    return user.value.roles.map((role) => (typeof role === 'object' ? role.name : role))
  })

  const can = (permission) => {
    if (roles.value.includes('super_admin')) return true
    return permissions.value.includes(permission)
  }

  const is = (roleName) => {
    return roles.value.includes(roleName)
  }

  return {
    user,
    permissions,
    roles,
    can,
    is,
    isAuthenticated: computed(() => !!user.value),
  }
}
