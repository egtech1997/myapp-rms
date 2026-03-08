<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import apiClient from '@/api/axios'
import { useSettingsStore } from '@/stores/settings'
import { AppPageHeader } from '@/components/ui'

const toast         = inject('$toast')
const settingsStore = useSettingsStore()

const SERVER_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '')

// ── State ────────────────────────────────────────────────────────────────────
const loading  = ref(true)
const saving   = ref(false)
const logoFile = ref(null)
const logoInput = ref(null)

const form = reactive({
  systemName:    '',
  systemSubName: '',
  copyrightText: '',
})

const logoPreview = computed(() => {
  if (logoFile.value) return URL.createObjectURL(logoFile.value)
  return settingsStore.resolvedLogoUrl || ''
})

// ── Load ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const { data } = await apiClient.get('/v1/settings')
    const s = data.data
    form.systemName    = s.systemName    || 'DepEd GHC'
    form.systemSubName = s.systemSubName || 'RSP Portal'
    form.copyrightText = s.copyrightText || 'DepEd Division of Guihulngan City'
  } catch {
    form.systemName    = settingsStore.systemName
    form.systemSubName = settingsStore.systemSubName
    form.copyrightText = settingsStore.copyrightText
  } finally {
    loading.value = false
  }
})

// ── Logo file select ─────────────────────────────────────────────────────────
const onLogoSelect = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    toast.fire({ icon: 'error', title: 'Logo must be under 5 MB.' })
    return
  }
  logoFile.value = file
}

const removeLogo = () => {
  logoFile.value = null
  if (logoInput.value) logoInput.value.value = ''
}

// ── Save ─────────────────────────────────────────────────────────────────────
const save = async () => {
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('systemName',    form.systemName)
    fd.append('systemSubName', form.systemSubName)
    fd.append('copyrightText', form.copyrightText)
    if (logoFile.value) fd.append('logo', logoFile.value)

    const { data } = await apiClient.put('/v1/settings', fd)
    settingsStore.apply(data.data)
    logoFile.value = null
    if (logoInput.value) logoInput.value.value = ''

    toast.fire({ icon: 'success', title: 'Settings saved.' })
  } catch (err) {
    toast.fire({ icon: 'error', title: err.response?.data?.message || 'Failed to save settings.' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">

    <AppPageHeader title="Settings" subtitle="Configure system-wide branding and display options." icon="pi-cog" />

    <!-- Loading skeleton -->
    <div v-if="loading" class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-6 flex flex-col gap-4 animate-pulse">
      <div class="h-4 w-32 bg-[var(--bg-app)] rounded"></div>
      <div class="h-24 w-24 bg-[var(--bg-app)] rounded-xl"></div>
      <div class="h-10 w-full bg-[var(--bg-app)] rounded-lg"></div>
      <div class="h-10 w-full bg-[var(--bg-app)] rounded-lg"></div>
    </div>

    <template v-else>
      <!-- Branding card -->
      <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden">

        <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center">
            <i class="pi pi-palette text-sm text-[var(--color-primary)]"></i>
          </div>
          <div>
            <p class="text-sm font-bold text-[var(--text-main)]">Branding</p>
            <p class="text-xs text-[var(--text-muted)]">Logo, system name, and copyright displayed across the portal.</p>
          </div>
        </div>

        <div class="p-6 flex flex-col gap-6">

          <!-- Logo upload -->
          <div class="flex flex-col gap-3">
            <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">System Logo</label>
            <div class="flex items-center gap-4 flex-wrap">

              <!-- Preview -->
              <div class="w-20 h-20 rounded-xl border-2 border-dashed border-[var(--border-main)] overflow-hidden flex items-center justify-center bg-[var(--bg-app)] shrink-0">
                <img v-if="logoPreview"
                  :src="logoPreview"
                  alt="Logo preview"
                  class="w-full h-full object-cover" />
                <i v-else class="pi pi-image text-2xl text-[var(--text-faint)]"></i>
              </div>

              <!-- Actions -->
              <div class="flex flex-col gap-2">
                <input ref="logoInput" type="file" class="sr-only" accept="image/*" @change="onLogoSelect" />
                <button @click="logoInput.click()"
                  class="btn-secondary h-9 px-4 text-sm flex items-center gap-2">
                  <i class="pi pi-upload text-xs"></i>
                  {{ logoPreview ? 'Replace Logo' : 'Upload Logo' }}
                </button>
                <button v-if="logoFile" @click="removeLogo"
                  class="h-9 px-4 text-sm flex items-center gap-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                  <i class="pi pi-times text-xs"></i>
                  Remove selection
                </button>
                <p class="text-xs text-[var(--text-muted)]">PNG, JPG, SVG &bull; Max 5 MB</p>
              </div>
            </div>
            <p v-if="logoFile" class="text-xs text-[var(--color-primary)] font-medium flex items-center gap-1">
              <i class="pi pi-check-circle text-xs"></i>
              {{ logoFile.name }} selected — will upload on save
            </p>
          </div>

          <div class="h-px bg-[var(--border-main)]"></div>

          <!-- Text fields -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">System Name</label>
              <input v-model="form.systemName"
                type="text"
                placeholder="e.g. DepEd GHC"
                class="field" />
              <p class="text-[11px] text-[var(--text-faint)]">Shown in the sidebar and top header.</p>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">System Sub Name</label>
              <input v-model="form.systemSubName"
                type="text"
                placeholder="e.g. RSP Portal"
                class="field" />
              <p class="text-[11px] text-[var(--text-faint)]">Displayed below the system name.</p>
            </div>

            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Copyright Text</label>
              <input v-model="form.copyrightText"
                type="text"
                placeholder="e.g. DepEd Division of Guihulngan City"
                class="field" />
              <p class="text-[11px] text-[var(--text-faint)]">Appears in the portal footer next to the copyright symbol.</p>
            </div>
          </div>

          <!-- Live preview -->
          <div class="rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)] p-4 flex flex-col gap-2">
            <p class="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Preview</p>
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl overflow-hidden shrink-0"
                :class="logoPreview ? '' : 'bg-[var(--color-primary)] flex items-center justify-center'">
                <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-cover" alt="" />
                <i v-else class="pi pi-shield text-white text-base"></i>
              </div>
              <div class="flex flex-col leading-tight">
                <span class="text-sm font-bold text-[var(--text-main)] tracking-tight">{{ form.systemName || 'System Name' }}</span>
                <span class="text-[10px] font-medium text-[var(--text-muted)] tracking-wider uppercase">{{ form.systemSubName || 'Sub Name' }}</span>
              </div>
            </div>
            <p class="text-[11px] text-[var(--text-muted)] mt-1">
              &copy; {{ new Date().getFullYear() }} {{ form.copyrightText || 'Copyright Text' }}
            </p>
          </div>

        </div>

        <!-- Footer actions -->
        <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-end">
          <button @click="save" :disabled="saving"
            class="btn-primary h-9 px-6 text-sm flex items-center gap-2 disabled:opacity-50">
            <i :class="['pi text-xs', saving ? 'pi-spin pi-spinner' : 'pi-check']"></i>
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

    </template>
  </div>
</template>
