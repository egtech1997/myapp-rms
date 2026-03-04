import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Lara from '@primevue/themes/lara'
import App from './App.vue'
import router from './router'

// Global Styles & Icons
import './assets/main.css'
import 'primeicons/primeicons.css'

// ==========================================
// PRIMEVUE COMPONENTS (Global Arsenal)
// ==========================================
// Forms & Inputs
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import DatePicker from 'primevue/datepicker'
import Checkbox from 'primevue/checkbox'
import RadioButton from 'primevue/radiobutton'
import ToggleSwitch from 'primevue/toggleswitch'
import AutoComplete from 'primevue/autocomplete'
import FileUpload from 'primevue/fileupload'

// Data Display
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Paginator from 'primevue/paginator'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'
import Avatar from 'primevue/avatar'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'

// Navigation & Menus
import Menu from 'primevue/menu'
import Menubar from 'primevue/menubar'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

// Panels & Layout
import Divider from 'primevue/divider'
import ScrollPanel from 'primevue/scrollpanel'
import Toolbar from 'primevue/toolbar'

// Overlays & Feedback
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import ConfirmationService from 'primevue/confirmationservice'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'
import ProgressBar from 'primevue/progressbar'
import ProgressSpinner from 'primevue/progressspinner'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: Lara,
    options: {
      darkModeSelector: '.app-dark',
      cssLayer: {
        name: 'primevue',
        order: 'tailwind-base, primevue, tailwind-utilities',
      },
    },
  },
})

// Registering Services
app.use(ToastService)
app.use(ConfirmationService)

// Registering Components Globally
app.component('Button', Button)
app.component('InputText', InputText)
app.component('Password', Password)
app.component('Textarea', Textarea)
app.component('InputNumber', InputNumber)
app.component('Select', Select)
app.component('MultiSelect', MultiSelect)
app.component('DatePicker', DatePicker)
app.component('Checkbox', Checkbox)
app.component('RadioButton', RadioButton)
app.component('ToggleSwitch', ToggleSwitch)
app.component('AutoComplete', AutoComplete)
app.component('FileUpload', FileUpload)

app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Paginator', Paginator)
app.component('Card', Card)
app.component('Tag', Tag)
app.component('Badge', Badge)
app.component('Avatar', Avatar)
app.component('Accordion', Accordion)
app.component('AccordionPanel', AccordionPanel)
app.component('AccordionHeader', AccordionHeader)
app.component('AccordionContent', AccordionContent)

app.component('Menu', Menu)
app.component('Menubar', Menubar)
app.component('Tabs', Tabs)
app.component('TabList', TabList)
app.component('Tab', Tab)
app.component('TabPanels', TabPanels)
app.component('TabPanel', TabPanel)

app.component('Divider', Divider)
app.component('ScrollPanel', ScrollPanel)
app.component('Toolbar', Toolbar)

app.component('Dialog', Dialog)
app.component('ConfirmDialog', ConfirmDialog)
app.component('Toast', Toast)
app.component('ProgressBar', ProgressBar)
app.component('ProgressSpinner', ProgressSpinner)

app.mount('#app')
