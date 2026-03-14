import { createApp, watchEffect } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import soundManager from '@/services/soundManager'

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
    // Play sound based on Swal icon type
    const icon = toast.querySelector('.swal2-icon')
    if (icon) {
      if (icon.classList.contains('swal2-success')) soundManager.play('success')
      else if (icon.classList.contains('swal2-error'))   soundManager.play('error')
      else if (icon.classList.contains('swal2-warning')) soundManager.play('error')
      else soundManager.play('notification')
    } else {
      soundManager.play('notification')
    }
  },
})

// Swal full dialogs — play sounds on open/confirm/deny
const SwalWithSound = Swal.mixin({
  didOpen: () => soundManager.play('modal-open'),
  willClose: () => soundManager.play('modal-close'),
  preConfirm: () => soundManager.play('success'),
})

app.provide('$toast', Toast)
app.provide('$swal', SwalWithSound)

// Global error handler — prevents silent white-screen crashes
app.config.errorHandler = (err, instance, info) => {
  console.error('[App Error]', err, info)
}

app.directive('click-outside', {
  mounted(el, binding) {
    el._clickOutsideHandler = (e) => {
      if (!el.contains(e.target)) binding.value(e)
    }
    document.addEventListener('mousedown', el._clickOutsideHandler)
  },
  unmounted(el) {
    document.removeEventListener('mousedown', el._clickOutsideHandler)
  },
})

// Reactive v-can — re-evaluates when user permissions change
app.directive('can', {
  mounted(el, binding) {
    const authStore = useAuthStore()
    el._canStop = watchEffect(() => {
      el.style.display = authStore.can(binding.value) ? '' : 'none'
    })
  },
  updated(el, binding) {
    const authStore = useAuthStore()
    el.style.display = authStore.can(binding.value) ? '' : 'none'
  },
  unmounted(el) {
    el._canStop?.()
  },
})

// Reactive v-role
app.directive('role', {
  mounted(el, binding) {
    const authStore = useAuthStore()
    el._roleStop = watchEffect(() => {
      const names = authStore.user?.roles?.map((r) =>
        typeof r === 'object' ? r.name : r
      ) ?? []
      el.style.display = names.includes(binding.value) ? '' : 'none'
    })
  },
  unmounted(el) {
    el._roleStop?.()
  },
})

app.mount('#app')

useSettingsStore().init()

// Initialize sound system after mount (restores persisted mute/volume settings).
// AudioContext is created lazily on first user gesture — no autoplay policy issues.
soundManager.init()

// Global delegated click sound — fires for any <button> that is NOT an AppButton
// (AppButton already plays its own sound via @click handler; data-ab marks those).
// This covers all raw <button> elements in pages: delete trash icons, table actions, etc.
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button')
  if (!btn || btn.disabled || btn.dataset.ab !== undefined) return
  soundManager.play('click')
}, true)
