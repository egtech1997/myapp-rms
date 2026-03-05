import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
  },
  // Auth Group
  {
    path: '/auth/register',
    component: () => import('@/pages/auth/Register.vue'),
  },
  {
    path: '/auth/login',
    component: () => import('@/pages/auth/Login.vue'),
  },
  {
    path: '/auth/verify-otp',
    component: () => import('@/pages/auth/VerifyOtp.vue'),
    props: (route) => ({ email: route.query.email }),
  },

  // User Role Group
  {
    path: '/user/dashboard',
    component: () => import('@/pages/user/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'user' },
  },

  // Admin Role Group
  {
    path: '/admin/dashboard',
    component: () => import('@/pages/admin/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'admin' },
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
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // 1. Ensure auth is initialized before any routing decision
  if (!authStore.initialized) {
    await authStore.fetchCurrentUser()
  }

  const isLoggedIn = authStore.isAuthenticated

  // 2. Handle the "Home" logic (NEW)
  // If a user hits '/' and they are logged in, send them to their dashboard immediately
  if (to.path === '/' && isLoggedIn) {
    return authStore.dashboardRoute
  }

  // 3. Prevent logged-in users from seeing login/register
  if (isLoggedIn && to.path.startsWith('/auth')) {
    return authStore.dashboardRoute
  }

  // 4. Auth requirement
  if (to.meta.requiresAuth && !isLoggedIn) {
    return { path: '/auth/login', query: { redirect: to.fullPath } }
  }

  // 5. Role protection
  if (to.meta.role) {
    if (to.meta.role === 'admin' && !authStore.isStaff) {
      return '/user/dashboard'
    }
    // Added a more specific check here
    if (to.meta.role === 'user' && !isLoggedIn) {
      return '/auth/login'
    }
  }
})

export default router
