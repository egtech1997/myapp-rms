<script setup>
import { ref, computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import AccountSettingsModal from '@/components/layout/AccountSettingsModal.vue'
import NotificationCenter from '@/components/layout/NotificationCenter.vue'

const route         = useRoute()
const authStore     = useAuthStore()
const settingsStore = useSettingsStore()

// ── Mobile menu ───────────────────────────────────────────
const showMobileMenu = ref(false)
const closeMenu      = () => { showMobileMenu.value = false }

// ── User dropdown ─────────────────────────────────────────
const showDropdown = ref(false)

// ── Settings modal ────────────────────────────────────────
const showSettings = ref(false)
const settingsTab  = ref('profile')

const openSettings = (tab = 'profile') => {
  settingsTab.value  = tab
  showSettings.value = true
  showDropdown.value = false
}

const avatarSrc = computed(() =>
  authStore.user?.avatarUrl
  || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'U')}&background=4A4D8F&color=fff&bold=true`
)

const navLinks = [
  { label: 'Dashboard',       to: '/user/dashboard',    icon: 'pi-home'        },
  { label: 'My Profile',      to: '/user/profile',      icon: 'pi-id-card'     },
  { label: 'My Applications', to: '/user/applications', icon: 'pi-folder-open' },
  { label: 'Job Vacancies',   to: '/user/vacancies',    icon: 'pi-briefcase'   },
  { label: 'Resources',       to: '/user/resources',    icon: 'pi-book'        },
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-main)] font-sans antialiased">

    <!-- Skip to content -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- ── Header ─────────────────────────────────────────── -->
    <header class="sticky top-0 z-30 bg-white border-b border-[var(--border-main)] shadow-sm" role="banner">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-3 shrink-0 group" aria-label="RSP Portal home">
          <div class="w-9 h-9 rounded-xl overflow-hidden shadow-md group-hover:shadow-blue-300 transition-shadow"
            :class="settingsStore.resolvedLogoUrl ? '' : 'bg-[var(--color-primary)] flex items-center justify-center'">
            <img v-if="settingsStore.resolvedLogoUrl" :src="settingsStore.resolvedLogoUrl" alt="System Logo" class="w-full h-full object-cover" />
            <i v-else class="pi pi-shield text-white text-base" aria-hidden="true"></i>
          </div>
          <div class="hidden sm:flex flex-col leading-tight">
            <span class="text-sm font-bold text-[var(--text-main)] tracking-tight">{{ settingsStore.systemName }}</span>
            <span class="text-[10px] font-medium text-[var(--text-muted)] tracking-wider uppercase">{{ settingsStore.systemSubName }}</span>
          </div>
        </router-link>

        <!-- Desktop nav -->
        <nav class="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
          <router-link
            v-for="link in navLinks" :key="link.to"
            :to="link.to"
            class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="route.path === link.to
              ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)]'"
            :aria-current="route.path === link.to ? 'page' : undefined">
            <i :class="['pi text-xs', link.icon]" aria-hidden="true"></i>
            {{ link.label }}
          </router-link>
        </nav>

        <!-- Right controls -->
        <div class="flex items-center gap-2">
          <NotificationCenter />

          <!-- Mobile menu toggle -->
          <button @click="showMobileMenu = !showMobileMenu"
            class="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-app)] transition-colors"
            :aria-expanded="showMobileMenu" aria-controls="mobile-menu"
            :aria-label="showMobileMenu ? 'Close menu' : 'Open menu'">
            <i :class="['pi text-sm', showMobileMenu ? 'pi-times' : 'pi-bars']" aria-hidden="true"></i>
          </button>

          <!-- User dropdown -->
          <div class="relative">
            <button @click="showDropdown = !showDropdown"
              class="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[var(--bg-app)] border border-transparent hover:border-[var(--border-main)] transition-all"
              :aria-expanded="showDropdown" aria-haspopup="menu" aria-label="User account menu">
              <img :src="avatarSrc" :alt="authStore.user?.username"
                class="w-8 h-8 rounded-full object-cover border-2 border-[var(--color-primary-light)]" />
              <div class="hidden sm:flex flex-col items-start leading-tight">
                <span class="text-xs font-bold text-[var(--text-main)] capitalize max-w-[80px] truncate">{{ authStore.user?.username }}</span>
                <span class="text-[10px] text-[var(--text-muted)]">Applicant</span>
              </div>
              <i class="pi pi-chevron-down text-[9px] text-[var(--text-faint)] hidden sm:block" aria-hidden="true"></i>
            </button>

            <Transition name="dropdown">
              <div v-if="showDropdown" v-click-outside="() => showDropdown = false"
                class="absolute right-0 mt-2 w-52 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-xl z-50 overflow-hidden"
                role="menu">
                <div class="px-4 py-3 border-b border-[var(--border-main)] bg-[var(--color-primary-light)]/30">
                  <p class="text-sm font-bold text-[var(--text-main)] capitalize truncate">{{ authStore.user?.username }}</p>
                  <p class="text-xs text-[var(--text-muted)] truncate mt-0.5">{{ authStore.user?.email }}</p>
                </div>
                <div class="p-1.5 flex flex-col gap-0.5" role="none">
                  <button @click="openSettings('profile')"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors text-left"
                    role="menuitem">
                    <i class="pi pi-user-edit text-[var(--text-muted)] text-sm" aria-hidden="true"></i>
                    <div class="leading-tight">
                      <p class="text-xs font-semibold">Account Settings</p>
                      <p class="text-[10px] text-[var(--text-muted)]">Username, bio, social links</p>
                    </div>
                  </button>
                  <button @click="openSettings('avatar')"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors text-left"
                    role="menuitem">
                    <i class="pi pi-camera text-[var(--text-muted)] text-sm" aria-hidden="true"></i>
                    <div class="leading-tight">
                      <p class="text-xs font-semibold">Change Photo</p>
                      <p class="text-[10px] text-[var(--text-muted)]">Upload avatar or GIF</p>
                    </div>
                  </button>
                  <button @click="openSettings('password')"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors text-left"
                    role="menuitem">
                    <i class="pi pi-lock text-[var(--text-muted)] text-sm" aria-hidden="true"></i>
                    <div class="leading-tight">
                      <p class="text-xs font-semibold">Change Password</p>
                      <p class="text-[10px] text-[var(--text-muted)]">Update login credentials</p>
                    </div>
                  </button>
                  <div class="h-px bg-[var(--border-main)] my-1" role="separator"></div>
                  <button @click="authStore.logout()"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                    role="menuitem">
                    <i class="pi pi-sign-out text-sm" aria-hidden="true"></i> Sign Out
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- Mobile nav -->
      <Transition name="slide-down">
        <div v-if="showMobileMenu" id="mobile-menu"
          class="md:hidden border-t border-[var(--border-main)] bg-[var(--surface)] px-4 py-3 flex flex-col gap-1">
          <router-link
            v-for="link in navLinks" :key="link.to"
            :to="link.to" @click="closeMenu"
            class="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors"
            :class="route.path === link.to
              ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)]'"
            :aria-current="route.path === link.to ? 'page' : undefined">
            <i :class="['pi text-sm', link.icon]" aria-hidden="true"></i>
            {{ link.label }}
          </router-link>
        </div>
      </Transition>
    </header>

    <!-- ── Page content ─────────────────────────────────────── -->
    <main id="main-content" class="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
      <RouterView v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <KeepAlive>
            <component :is="Component" :key="$route.name" />
          </KeepAlive>
        </transition>
      </RouterView>
    </main>

    <!-- ── Footer ──────────────────────────────────────────── -->
    <footer class="border-t border-[var(--border-main)] bg-[var(--surface)]" role="contentinfo">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center border border-[var(--border-main)]">
            <img v-if="settingsStore.resolvedLogoUrl" :src="settingsStore.resolvedLogoUrl" alt="Logo" class="w-full h-full object-contain p-0.5" />
            <div v-else class="w-full h-full bg-[var(--color-primary)] flex items-center justify-center">
              <i class="pi pi-shield text-white text-[10px]" aria-hidden="true"></i>
            </div>
          </div>
          <p class="text-[11px] font-medium text-[var(--text-muted)]">
            &copy; {{ new Date().getFullYear() }} {{ settingsStore.copyrightText }}
          </p>
        </div>
        <div class="flex gap-5 text-[11px] font-medium text-[var(--text-muted)]">
          <a href="#" class="hover:text-[var(--text-main)] transition-colors">Privacy Policy</a>
          <a href="#" class="hover:text-[var(--text-main)] transition-colors">Support Center</a>
        </div>
      </div>
    </footer>

    <!-- Account Settings (shared modal) -->
    <AccountSettingsModal v-model="showSettings" :initial-tab="settingsTab" />

  </div>
</template>
