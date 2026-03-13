<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import SaaSSidebar from '@/components/layout/SaaSSidebar.vue'
import AccountSettingsModal from '@/components/layout/AccountSettingsModal.vue'
import NotificationCenter from '@/components/layout/NotificationCenter.vue'
import { AppToaster } from '@/components/ui'

const authStore     = useAuthStore()
const settingsStore = useSettingsStore()

const isCollapsed = ref(false)
const isHovered   = ref(false)
const showDropdown = ref(false)

// Settings modal
const showSettings = ref(false)
const settingsTab  = ref('profile')

const openSettings = (tab = 'profile') => {
  settingsTab.value  = tab
  showSettings.value = true
  showDropdown.value = false
}

const avatarSrc = computed(() =>
  authStore.user?.avatarUrl
  || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'Admin')}&background=random`
)

// Global Shortcut: Ctrl+K
onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      document.getElementById('global-search')?.focus()
    }
  })
})
</script>

<template>
  <div class="flex h-screen bg-[var(--bg-app)] text-[var(--text-main)] font-sans antialiased overflow-hidden">

    <!-- Fixed SaaS Sidebar -->
    <SaaSSidebar :is-collapsed="isCollapsed" :is-hovered="isHovered" @update:is-hovered="val => isHovered = val" />

    <!-- Main Workspace -->
    <div class="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
      :style="{ marginLeft: isCollapsed && !isHovered ? '5rem' : '16rem' }">

      <!-- Sticky Topbar -->
      <header class="h-14 border-b border-[var(--border-main)] bg-[var(--surface)]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
        <div class="flex items-center gap-4 flex-1">
          <button @click="isCollapsed = !isCollapsed"
            class="w-8 h-8 rounded-lg hover:bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-muted)] transition-colors">
            <i :class="['pi text-[10px]', isCollapsed ? 'pi-align-left' : 'pi-align-right']"></i>
          </button>

          <div class="relative max-w-md w-full group hidden sm:block">
            <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors"></i>
            <input id="global-search" placeholder="Search applicants, jobs, or commands... (Ctrl+K)"
              class="w-full h-9 pl-9 pr-20 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] focus:bg-[var(--surface)] transition-all outline-none" />
            <div class="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              <kbd class="h-5 px-1.5 rounded border border-[var(--border-main)] bg-[var(--surface)] text-[9px] font-black text-[var(--text-muted)] shadow-sm">Ctrl</kbd>
              <kbd class="h-5 px-1.5 rounded border border-[var(--border-main)] bg-[var(--surface)] text-[9px] font-black text-[var(--text-muted)] shadow-sm">K</kbd>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <NotificationCenter />
          <div class="h-6 w-px bg-[var(--border-main)] mx-1"></div>

          <!-- User dropdown -->
          <div class="relative">
            <button @click="showDropdown = !showDropdown"
              class="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[var(--bg-app)] border border-transparent hover:border-[var(--border-main)] transition-all"
              :aria-expanded="showDropdown" aria-haspopup="menu">
              <img :src="avatarSrc" :alt="authStore.user?.username"
                class="w-8 h-8 rounded-full object-cover border-2 border-[var(--color-primary-light)]" />
              <div class="hidden lg:flex flex-col items-start leading-none">
                <p class="text-[11px] font-bold text-[var(--text-main)] tracking-tight capitalize">{{ authStore.user?.username || 'Admin' }}</p>
                <p class="text-[9px] text-[var(--text-muted)] font-medium uppercase mt-0.5">{{ settingsStore.systemSubName }}</p>
              </div>
              <i class="pi pi-chevron-down text-[9px] text-[var(--text-faint)] hidden lg:block"></i>
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
                    <i class="pi pi-user-edit text-[var(--text-muted)] text-sm"></i>
                    <div class="leading-tight">
                      <p class="text-xs font-semibold">Account Settings</p>
                      <p class="text-[10px] text-[var(--text-muted)]">Username, bio, social links</p>
                    </div>
                  </button>
                  <button @click="openSettings('avatar')"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors text-left"
                    role="menuitem">
                    <i class="pi pi-camera text-[var(--text-muted)] text-sm"></i>
                    <div class="leading-tight">
                      <p class="text-xs font-semibold">Change Photo</p>
                      <p class="text-[10px] text-[var(--text-muted)]">Upload avatar or GIF</p>
                    </div>
                  </button>
                  <button @click="openSettings('password')"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors text-left"
                    role="menuitem">
                    <i class="pi pi-lock text-[var(--text-muted)] text-sm"></i>
                    <div class="leading-tight">
                      <p class="text-xs font-semibold">Change Password</p>
                      <p class="text-[10px] text-[var(--text-muted)]">Update login credentials</p>
                    </div>
                  </button>
                  <div class="h-px bg-[var(--border-main)] my-1"></div>
                  <button @click="authStore.logout()"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                    role="menuitem">
                    <i class="pi pi-sign-out text-sm"></i> Sign Out
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Scrollable Content Area -->
      <main class="flex-1 overflow-y-auto bg-[var(--bg-app)] custom-scrollbar flex flex-col">
        <div class="p-6 lg:p-8 max-w-[90rem] mx-auto w-full flex-1">
          <router-view v-slot="{ Component, route }">
            <transition name="page-fade" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
        </div>

        <!-- Footer -->
        <footer class="mt-auto border-t border-[var(--border-main)] bg-[var(--surface)]/50 px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div class="flex items-center gap-3">
            <div class="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center border border-[var(--border-main)] bg-white shadow-sm">
              <img v-if="settingsStore.resolvedLogoUrl" :src="settingsStore.resolvedLogoUrl" alt="Logo" class="w-full h-full object-contain p-0.5" />
              <div v-else class="w-full h-full bg-[var(--color-primary)] flex items-center justify-center">
                <i class="pi pi-shield text-white text-[10px]" aria-hidden="true"></i>
              </div>
            </div>
            <p class="text-[11px] font-medium text-[var(--text-muted)] tracking-tight">
              &copy; {{ new Date().getFullYear() }} <span class="font-bold text-[var(--text-main)]">{{ settingsStore.copyrightText }}</span>
            </p>
          </div>
          <div class="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
            <span class="hover:text-[var(--color-primary)] cursor-pointer transition-colors">{{ settingsStore.systemName }} Internal Console</span>
            <div class="w-1.5 h-1.5 rounded-full bg-[var(--border-main)]"></div>
            <span class="hover:text-[var(--text-main)] cursor-pointer transition-colors">v2.4.0 Stable</span>
          </div>
        </footer>
      </main>
    </div>

    <AppToaster position="bottom-right" />

    <!-- Account Settings (shared modal) -->
    <AccountSettingsModal v-model="showSettings" :initial-tab="settingsTab" />

  </div>
</template>
