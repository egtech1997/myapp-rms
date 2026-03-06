import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'

import Swal from 'sweetalert2'

import './assets/main.css'
import 'primeicons/primeicons.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: 'var(--surface)',
  color: 'var(--text-main)',
  customClass: {
    popup: 'border border-[var(--border-main)] rounded-xl shadow-xl font-sans text-sm',
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer
    toast.onmouseleave = Swal.resumeTimer
  },
})

app.provide('$toast', Toast)
app.provide('$swal', Swal)

app.directive('can', {
  mounted(el, binding) {
    const authStore = useAuthStore()
    if (!authStore.can(binding.value)) {
      el.style.display = 'none'
    }
  },
})

app.directive('role', {
  mounted(el, binding) {
    const authStore = useAuthStore()
    if (!authStore.hasRole(binding.value)) {
      el.style.display = 'none'
    }
  },
})

app.mount('#app')
