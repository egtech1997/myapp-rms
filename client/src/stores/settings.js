import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api/axios'

const SERVER_BASE = (import.meta.env.VITE_API_URL || `${window.location.origin}/api`).replace('/api', '')

export const useSettingsStore = defineStore('settings', () => {
  const systemName    = ref('DepEd GHC')
  const systemSubName = ref('RSP Portal')
  const copyrightText = ref('DepEd Division of Guihulngan City')
  const logoUrl       = ref('')

  const resolvedLogoUrl = computed(() => {
    if (!logoUrl.value) return ''
    // base64 data URLs are self-contained; file paths need the server base prepended
    return logoUrl.value.startsWith('data:') ? logoUrl.value : `${SERVER_BASE}${logoUrl.value}`
  })

  function apply(s) {
    if (s.systemName)    systemName.value    = s.systemName
    if (s.systemSubName) systemSubName.value = s.systemSubName
    if (s.copyrightText) copyrightText.value = s.copyrightText
    logoUrl.value = s.logoUrl || ''
  }

  async function init() {
    try {
      const { data } = await apiClient.get('/v1/settings')
      apply(data.data)
    } catch { /* keep defaults */ }
  }

  return { systemName, systemSubName, copyrightText, logoUrl, resolvedLogoUrl, init, apply }
})
