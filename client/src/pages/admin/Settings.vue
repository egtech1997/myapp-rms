<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import apiClient from '@/api/axios'
import { useSettingsStore } from '@/stores/settings'
import { AppPageHeader, AppButton, AppCard } from '@/components/ui'

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
  <div class="flex flex-col gap-8 animate-fade-in-up pb-12">

    <AppPageHeader title="Platform Settings" subtitle="Configure division-wide branding, logos, and identity." icon="pi-cog" />

    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
      <div class="lg:col-span-2 h-96 bg-white rounded-3xl border border-[var(--border-main)]"></div>
      <div class="h-64 bg-white rounded-3xl border border-[var(--border-main)]"></div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- MAIN CONFIG -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-3xl shadow-sm overflow-hidden">
          <div class="px-8 py-6 border-b border-[var(--border-main)] bg-[var(--bg-app)] flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <i class="pi pi-palette"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Branding & Identity</h3>
              <p class="text-xs text-[var(--text-muted)] font-medium">Customize how the portal appears to applicants and staff.</p>
            </div>
          </div>

          <div class="p-8 space-y-8">
            <!-- Logo Section -->
            <div class="flex flex-col sm:flex-row items-start gap-8">
              <div class="flex flex-col gap-3">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)]">System Logo</label>
                <div class="w-32 h-32 rounded-3xl border-2 border-dashed border-[var(--border-main)] bg-[var(--bg-app)] flex items-center justify-center overflow-hidden group relative">
                  <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-contain p-2" />
                  <i v-else class="pi pi-image text-3xl text-[var(--text-faint)]"></i>
                  
                  <div v-if="logoFile" class="absolute inset-0 bg-[var(--color-primary)]/80 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity p-2 text-center">
                    <i class="pi pi-upload mb-2"></i>
                    <span class="text-[9px] font-bold uppercase">Pending Save</span>
                  </div>
                </div>
              </div>

              <div class="flex-1 space-y-4 pt-6">
                <input ref="logoInput" type="file" class="hidden" accept="image/*" @change="onLogoSelect" />
                <div class="flex flex-wrap gap-2">
                  <AppButton variant="secondary" size="sm" @click="logoInput.click()">
                    <i class="pi pi-upload mr-2"></i> Change Logo
                  </AppButton>
                  <AppButton v-if="logoFile" variant="ghost" size="sm" class="text-red-500 hover:bg-red-50" @click="removeLogo">
                    <i class="pi pi-times mr-2"></i> Cancel
                  </AppButton>
                </div>
                <p class="text-[10px] text-[var(--text-muted)] leading-relaxed">
                  Recommended: Square PNG or SVG with transparent background.<br/>Max file size: 5 MB.
                </p>
              </div>
            </div>

            <div class="h-px bg-[var(--border-main)]"></div>

            <!-- Text Fields -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="flex flex-col gap-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)]">Primary System Name</label>
                <input v-model="form.systemName" type="text" class="h-12 px-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-bold text-[var(--text-main)] focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 outline-none transition-all" placeholder="e.g. DepEd RSP" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)]">Secondary Sub-title</label>
                <input v-model="form.systemSubName" type="text" class="h-12 px-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-bold text-[var(--text-main)] focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 outline-none transition-all" placeholder="e.g. Recruitment Portal" />
              </div>
              <div class="flex flex-col gap-2 sm:col-span-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)]">Official Copyright Footer</label>
                <input v-model="form.copyrightText" type="text" class="h-12 px-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-bold text-[var(--text-main)] focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 outline-none transition-all" placeholder="e.g. Department of Education - Division of..." />
              </div>
            </div>
          </div>

          <div class="px-8 py-6 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-end">
            <AppButton variant="primary" class="h-11 px-8 rounded-xl shadow-primary font-black uppercase tracking-widest text-xs" 
              @click="save" :loading="saving">
              <i class="pi pi-check-circle mr-2"></i> Commit Changes
            </AppButton>
          </div>
        </div>
      </div>

      <!-- PREVIEW SIDEBAR -->
      <div class="space-y-6">
        <div class="p-6 bg-[var(--color-navy)] rounded-3xl shadow-xl text-white relative overflow-hidden">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-6">Real-time Preview</h3>
          
          <div class="space-y-8 relative z-10">
            <!-- Sidebar Preview -->
            <div class="space-y-3">
              <p class="text-[9px] font-bold uppercase text-white/30 tracking-widest">Navigation Header</p>
              <div class="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0">
                  <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-contain p-1" />
                  <i v-else class="pi pi-shield text-[var(--color-primary)] text-xl"></i>
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-black truncate leading-tight uppercase">{{ form.systemName || 'SYSTEM NAME' }}</p>
                  <p class="text-[9px] font-bold text-white/50 truncate uppercase tracking-tighter">{{ form.systemSubName || 'Sub Name' }}</p>
                </div>
              </div>
            </div>

            <!-- Footer Preview -->
            <div class="space-y-3">
              <p class="text-[9px] font-bold uppercase text-white/30 tracking-widest">System Footer</p>
              <div class="py-4 border-t border-white/10 text-center">
                <p class="text-[9px] font-medium text-white/40 italic">
                  &copy; {{ new Date().getFullYear() }} {{ form.copyrightText || 'Copyright Information' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Decorative Glow -->
          <div class="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>

        <div class="p-6 bg-amber-50 border border-amber-100 rounded-3xl">
          <div class="flex items-center gap-3 mb-3 text-amber-700">
            <i class="pi pi-info-circle"></i>
            <h4 class="text-xs font-black uppercase tracking-widest">Deployment Note</h4>
          </div>
          <p class="text-xs text-amber-800/70 leading-relaxed font-medium">
            Changes made here affect all users (Applicants and Admins) across the platform. Ensure the logo has a transparent background for best results in both light and dark themes.
          </p>
        </div>
      </div>

    </div>
  </div>
</template>
