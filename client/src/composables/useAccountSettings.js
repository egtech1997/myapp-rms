import { ref, reactive, computed, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'

export function useAccountSettings() {
  const authStore = useAuthStore()
  const $toast    = inject('$toast')

  // ── Visibility ────────────────────────────────────────────
  const visible    = ref(false)
  const activeTab  = ref('profile')

  const open  = (tab = 'profile') => { initForm(); activeTab.value = tab; visible.value = true }
  const close = ()                 => { visible.value = false }

  // ── Loading states ─────────────────────────────────────────
  const isSaving  = ref(false)
  const uploading = ref(false)

  // ── Password visibility toggles ───────────────────────────
  const showCurrPw    = ref(false)
  const showNewPw     = ref(false)
  const showConfirmPw = ref(false)

  // ── Forms ─────────────────────────────────────────────────
  const profileForm = reactive({
    username: '',
    bio: '',
    links: { facebook: '', linkedin: '', twitter: '' },
  })

  const pw = reactive({ current: '', new: '', confirm: '' })

  const initForm = () => {
    if (!authStore.user) return
    profileForm.username        = authStore.user.username        || ''
    profileForm.bio             = authStore.user.bio             || ''
    profileForm.links.facebook  = authStore.user.links?.facebook || ''
    profileForm.links.linkedin  = authStore.user.links?.linkedin || ''
    profileForm.links.twitter   = authStore.user.links?.twitter  || ''
  }

  // ── Avatar ────────────────────────────────────────────────
  const avatarSrc = computed(() =>
    authStore.user?.avatarUrl
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'U')}&background=4A4D8F&color=fff&bold=true`
  )

  const fileInput = ref(null)
  const triggerFile = () => fileInput.value?.click()

  // ── Cropper ───────────────────────────────────────────────
  const showCropper      = ref(false)
  const cropperImg       = ref(null)
  const cropperRef       = ref(null)
  const cropperFileType  = ref('image/jpeg')

  const onFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { $toast?.fire({ icon: 'warning', title: 'File too large. Max 10 MB.' }); return }

    if (file.type === 'image/gif') {
      uploadAvatar(file)
      return
    }

    cropperFileType.value = file.type
    const reader = new FileReader()
    reader.onload = (ev) => { cropperImg.value = ev.target.result; showCropper.value = true }
    reader.readAsDataURL(file)
  }

  const handleCrop = () => {
    const { canvas } = cropperRef.value.getResult()
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], `avatar.${cropperFileType.value.split('/')[1]}`, { type: cropperFileType.value })
      const ok = await uploadAvatar(file)
      if (ok) { showCropper.value = false; cropperImg.value = null }
    }, cropperFileType.value)
  }

  const uploadAvatar = async (file) => {
    const fd = new FormData()
    fd.append('avatar', file, file.name)
    uploading.value = true
    try {
      const { data } = await apiClient.patch('/auth/update-avatar', fd)
      authStore.user = { ...data.user, avatarUrl: `${data.user.avatarUrl}?t=${Date.now()}` }
      $toast?.fire({ icon: 'success', title: 'Avatar updated!' })
      close()
      return true
    } catch (err) {
      $toast?.fire({ icon: 'error', title: err.response?.data?.message || 'Upload failed.' })
      return false
    } finally {
      uploading.value = false
      if (fileInput.value) fileInput.value.value = ''
    }
  }

  // ── Profile save ──────────────────────────────────────────
  const saveProfileInfo = async () => {
    isSaving.value = true
    try {
      const { data } = await apiClient.patch('/auth/update-me', {
        username: profileForm.username.trim(),
        bio: profileForm.bio,
        links: profileForm.links,
      })
      authStore.user = { ...authStore.user, ...data.user }
      $toast?.fire({ icon: 'success', title: 'Profile saved!' })
      close()
    } catch (err) {
      $toast?.fire({ icon: 'error', title: err.response?.data?.message || 'Update failed.' })
    } finally { isSaving.value = false }
  }

  // ── Password change ────────────────────────────────────────
  const handlePwUpdate = async () => {
    if (pw.new !== pw.confirm) { $toast?.fire({ icon: 'warning', title: 'Passwords do not match.' }); return }
    if (pw.new.length < 8)    { $toast?.fire({ icon: 'warning', title: 'Minimum 8 characters required.' }); return }
    isSaving.value = true
    try {
      await apiClient.patch('/auth/update-password', { currentPassword: pw.current, newPassword: pw.new })
      Object.assign(pw, { current: '', new: '', confirm: '' })
      $toast?.fire({ icon: 'success', title: 'Password updated!' })
      close()
    } catch (err) {
      $toast?.fire({ icon: 'error', title: err.response?.data?.message || 'Update failed.' })
    } finally { isSaving.value = false }
  }

  return {
    // visibility
    visible, activeTab, open, close,
    // state
    isSaving, uploading,
    showCurrPw, showNewPw, showConfirmPw,
    profileForm, pw,
    // avatar
    avatarSrc, fileInput, triggerFile,
    // cropper
    showCropper, cropperImg, cropperRef, cropperFileType,
    // actions
    initForm, saveProfileInfo, handlePwUpdate,
    onFileSelect, handleCrop, uploadAvatar,
    // store ref
    authStore,
  }
}
