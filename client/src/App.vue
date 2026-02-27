<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

onMounted(async () => {
  if (!authStore.initialized) {
    await authStore.fetchCurrentUser();
  }
});
</script>

<template>
  <router-view v-if="authStore.initialized" />
  <div v-else class="loading-spinner">
    <div class="spinner"></div>
    <p>Loading your dashboard...</p>
  </div>
</template>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f9f9f9;
  /* Updated font-family to Avenir with fallbacks */
  font-family: 'Avenir', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #555;
}

.loading-spinner p {
  margin-top: 16px;
  font-size: 1rem;
  font-weight: 500;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 6px solid #e0e0e0;
  border-top: 6px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>