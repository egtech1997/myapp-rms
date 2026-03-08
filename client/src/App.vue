<script setup>
import { onMounted } from 'vue'
import { useAuthStore }    from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import AppToaster from '@/components/ui/AppToaster.vue'

const authStore     = useAuthStore()
const settingsStore = useSettingsStore()

onMounted(async () => {
  if (!authStore.initialized) {
    await authStore.fetchCurrentUser()
  }
})
</script>

<template>
  <!-- Premium loading state matching design system -->
  <div v-if="!authStore.initialized"
    class="fixed inset-0 flex flex-col items-center justify-center gap-4"
    style="background: var(--bg-app);">
    <div
      class="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
      style="background: linear-gradient(180deg, #5558A0 0%, #4A4D8F 100%); box-shadow: var(--shadow-primary);">
      <i class="pi pi-shield text-white text-base" aria-hidden="true"></i>
    </div>
    <div class="flex flex-col items-center gap-1">
      <div class="w-5 h-5 rounded-full border-2 border-[var(--border-main)] border-t-[var(--color-primary)] animate-spin"></div>
      <p class="text-xs font-medium text-[var(--text-muted)] mt-1">Loading...</p>
    </div>
  </div>

  <template v-else>
    <router-view />
    <!-- Global toast notifications (Sonner-inspired) -->
    <AppToaster position="bottom-right" />
  </template>
</template>
