import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Lara from '@primevue/themes/lara'
import App from './App.vue'
import router from './router'

// Global Styles
import './assets/main.css'
import 'primeicons/primeicons.css'

// PrimeVue Components
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import Menu from 'primevue/menu'
import Dialog from 'primevue/dialog'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.use(PrimeVue, {
  theme: {
    preset: Lara,
    options: {
      darkModeSelector: '.my-app-dark',
      ripple: true,
    },
  },
})

app.component('Button', Button)
app.component('Avatar', Avatar)
app.component('Menu', Menu)
<<<<<<< Updated upstream
app.component('Dialog', Dialog)
=======
app.component('Card', Card)
app.component('Dialog', Dialog)
app.component('InputText', InputText)
app.component('Password', Password)
app.component('Toast', Toast)
app.component('ToastService', ToastService)
app.use(ToastService);
>>>>>>> Stashed changes
app.mount('#app')
