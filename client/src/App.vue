<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  // This will hit /auth/me and fill authStore.user
  await authStore.fetchCurrentUser()
})
</script>

<template>
  <router-view v-if="authStore.initialized" />
  <div v-else class="loading-spinner">Loading...</div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
}
</style>