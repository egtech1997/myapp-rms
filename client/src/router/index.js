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
        meta: { permission: 'role_view' }, // Fixed typo from 'permissions' array to string
      },
      {
        path: 'user-list',
        name: 'User List',
        component: () => import('@/pages/admin/UserList.vue'),
        meta: { permission: 'user_view' },
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

  // Catch-all for 404
  {
    path: '/not-authorized',
    name: 'NotAuthorized',
    component: () => import('@/components/errors/NotAuthorized.vue'),
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
router.beforeEach(async (to, from) => {
  const authStore = useAuthStore()

  // 1. Ensure auth is initialized before routing
  if (!authStore.initialized) {
    await authStore.fetchCurrentUser()
  }

  const isLoggedIn = authStore.isAuthenticated

  // 2. Protect Guest routes (Login/Register)
  if (to.meta.guestOnly && isLoggedIn) {
    return authStore.dashboardRoute
  }

  // 3. Protect Auth-required routes
  if (to.meta.requiresAuth && !isLoggedIn) {
    return { path: '/auth/login', query: { redirect: to.fullPath } }
  }

  // If the user IS logged in, enforce the strict Admin vs User boundaries:
  if (isLoggedIn) {
    // 4. ADMIN BOUNDARY: "User" role trying to access /admin
    // If route requires admin, but user is NOT an admin
    if (to.meta.role === 'admin' && !authStore.isAdmin) {
      return '/not-authorized' // Or redirect to '/user/dashboard' if you prefer
    }

    // 5. USER BOUNDARY: "Admin" role trying to access /user
    // If route requires user, but user IS an admin
    if (to.meta.role === 'user' && authStore.isAdmin) {
      return '/admin/dashboard'
    }

    // 6. Specific Permission Checks inside Admin
    if (to.meta.permission && !authStore.can(to.meta.permission)) {
      return '/admin/dashboard' // Bump them back to admin root if they lack permission
    }
  }

  // 7. Proceed normally
  return true
})

export default router
