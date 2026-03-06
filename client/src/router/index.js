import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
  },

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================
  {
    path: '/auth/register',
    name: 'Register',
    component: () => import('@/pages/auth/Register.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/auth/login',
    name: 'Login',
    component: () => import('@/pages/auth/Login.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/auth/verify-otp',
    name: 'VerifyOtp',
    component: () => import('@/pages/auth/VerifyOtp.vue'),
    props: (route) => ({ email: route.query.email }),
    meta: { guestOnly: true },
  },

  // ==========================================
  // APPLICANT / USER ROUTES
  // ==========================================
  {
    path: '/vacancies',
    name: 'Job Vacancies',
    component: () => import('@/pages/user/Vacancies.vue'),
  },
  {
    path: '/user',
    meta: { requiresAuth: true, role: 'user' },
    children: [
      {
        path: 'dashboard',
        name: 'User Dashboard',
        component: () => import('@/pages/user/Dashboard.vue'),
      },
      {
        path: 'applications',
        name: 'My Applications',
        component: () => import('@/pages/user/Applications.vue'),
      },
    ],
  },

  // ==========================================
  // ADMIN ROUTES
  // ==========================================
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard',
      },
      {
        path: 'dashboard',
        name: 'Admin Dashboard',
        component: () => import('@/pages/admin/Dashboard.vue'),
      },
      {
        path: 'roles-permissions',
        name: 'Roles & Permissions',
        component: () => import('@/pages/admin/RolesPermissions.vue'),
        meta: { permissions: ['role_view'] },
      },
      {
        path: 'user-list',
        name: 'User List',
        component: () => import('@/pages/admin/UserList.vue'),
        meta: { permissions: ['user_view'] },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/pages/admin/Settings.vue'),
      },
      {
        path: 'audit-logs',
        name: 'Audit Logs',
        component: () => import('@/pages/admin/AuditLogs.vue'),
      },
      {
        path: 'vacancies',
        name: 'Manage Vacancies',
        component: () => import('@/pages/admin/Vacancies.vue'),
      },
      {
        path: 'applicants',
        name: 'Applicants List',
        component: () => import('@/pages/admin/Applicants.vue'),
      },
      {
        path: 'evaluations',
        name: 'Evaluations',
        component: () => import('@/pages/admin/Evaluations.vue'),
      },
      {
        path: 'rqa',
        name: 'Registry of Qualified Applicants',
        component: () => import('@/pages/admin/RQA.vue'),
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: () => import('@/pages/admin/Announcements.vue'),
      },
    ],
  },

  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation Guard
// Navigation Guard
router.beforeEach(async (to, from) => {
  const authStore = useAuthStore()

  // 1. Ensure auth is initialized before routing
  if (!authStore.initialized) {
    await authStore.fetchCurrentUser()
  }

  const isLoggedIn = authStore.isAuthenticated

  // 2. Prevent logged-in users from accessing Guest routes (Login/Register)
  if (to.meta.guestOnly && isLoggedIn) {
    return authStore.dashboardRoute || '/'
  }

  if (to.meta.requiresAuth && !isLoggedIn) {
    return { path: '/auth/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.role === 'admin' && !authStore.isStaff) {
    return '/user/dashboard'
  }

  if (to.meta.permission) {
    if (!authStore.can(to.meta.permission)) {
      return '/admin/dashboard'
    }
  }

  // 6. Proceed normally
  return true
})

export default router
