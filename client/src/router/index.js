import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth' // 👈 Must import store here

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
    meta: { requiresAuth: true, role: 'user' }, // 👈 Added meta tags
  },

  // Admin Role Group
  {
    path: '/admin/dashboard',
    component: () => import('@/pages/admin/Dashboard.vue'),
    meta: { requiresAuth: true, role: 'admin' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation Guard
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.fetchCurrentUser()
  }

  const isLoggedIn = !!authStore.user

  // ✅ FIX: Handle both object and string structures
  const userRole =
    typeof authStore.user?.role === 'object' ? authStore.user.role.name : authStore.user?.role

  // 1. Redirect logged-in users away from Auth pages
  if (isLoggedIn && to.path.startsWith('/auth')) {
    return userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard'
  }

  // 2. Protect routes requiring authentication
  if (to.meta.requiresAuth && !isLoggedIn) {
    return { path: '/auth/login', query: { redirect: to.fullPath } }
  }

  // 3. Role-based Access Control
  if (to.meta.role && to.meta.role !== userRole) {
    console.warn(`Access Denied: Required ${to.meta.role}, but user is ${userRole}`)
    return '/'
  }
})

export default router
