<script setup>
import { watch } from 'vue'
import { useAccountSettings } from '@/composables/useAccountSettings'
import { AppInput, AppTextarea } from '@/components/ui'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

defineOptions({ name: 'AccountSettingsModal' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initialTab: { type: String,  default: 'profile' },
})
const emit = defineEmits(['update:modelValue'])

// Destructure so template refs (cropperRef, fileInput) wire up correctly
const {
  visible, activeTab, open, close,
  isSaving, uploading,
  showCurrPw, showNewPw, showConfirmPw,
  profileForm, pw,
  avatarSrc, fileInput, triggerFile,
  showCropper, cropperImg, cropperRef, cropperFileType,
  initForm, saveProfileInfo, handlePwUpdate,
  onFileSelect, handleCrop,
  authStore,
} = useAccountSettings()

// Sync v-model → composable open/close
watch(() => props.modelValue, (val) => {
  if (val && !visible.value) open(props.initialTab)
  if (!val && visible.value)  close()
})
// Sync composable close() → v-model
watch(visible, (val) => { if (!val) emit('update:modelValue', false) })

const TABS = [
  { id: 'profile',  icon: 'pi-user-edit', label: 'Profile'  },
  { id: 'avatar',   icon: 'pi-camera',    label: 'Photo'    },
  { id: 'password', icon: 'pi-lock',      label: 'Password' },
]

const LINKS = [
  { key: 'facebook', icon: 'pi-facebook', bg: 'bg-blue-50 border-blue-100',    color: 'text-blue-600',  label: 'Facebook URL'   },
  { key: 'linkedin', icon: 'pi-linkedin', bg: 'bg-sky-50 border-sky-100',      color: 'text-sky-700',   label: 'LinkedIn URL'   },
  { key: 'twitter',  icon: 'pi-twitter',  bg: 'bg-slate-50 border-slate-200',  color: 'text-slate-600', label: 'Twitter / X URL' },
]

</script>

<template>
  <!-- ── Cropper modal ─────────────────────────────────────── -->
  <Teleport to="body">
    <div
      v-if="showCropper"
      class="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div class="w-full max-w-lg bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-main)] overflow-hidden flex flex-col">

        <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
          <h2 class="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Adjust Avatar</h2>
          <button @click="showCropper = false"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors">
            <i class="pi pi-times text-sm"></i>
          </button>
        </div>

        <div class="p-6 bg-slate-900 flex items-center justify-center min-h-[320px]">
          <Cropper
            ref="cropperRef"
            class="max-h-[400px] w-full"
            :src="cropperImg"
            :stencil-props="{ aspectRatio: 1, previewClass: 'rounded-full border-4 border-white/20' }"
            image-class="max-w-full" />
        </div>

        <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-between items-center">
          <p class="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
            Drag to reposition &bull; Pinch to zoom
          </p>
          <div class="flex gap-3">
            <button @click="showCropper = false" class="btn-secondary h-9 px-4 text-xs uppercase font-black">Cancel</button>
            <button @click="handleCrop" :disabled="uploading"
              class="btn-primary h-9 px-6 text-xs uppercase font-black flex items-center gap-2">
              <i v-if="uploading" class="pi pi-spin pi-spinner text-xs"></i>
              {{ uploading ? 'Uploading...' : 'Save' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>

  <!-- ── Account Settings modal ────────────────────────────── -->
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog" aria-modal="true" aria-labelledby="acct-settings-title"
      @click.self="close()">

      <div class="w-full max-w-lg bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-main)] overflow-hidden animate-zoom-in">

        <!-- Header -->
        <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img :src="avatarSrc" :alt="authStore.user?.username"
              class="w-9 h-9 rounded-full object-cover border-2 border-[var(--color-primary-light)]" />
            <div>
              <h2 id="acct-settings-title" class="text-sm font-black text-[var(--text-main)]">Account Settings</h2>
              <p class="text-[10px] text-[var(--text-muted)] capitalize">{{ authStore.user?.username }}</p>
            </div>
          </div>
          <button @click="close()"
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors"
            aria-label="Close settings">
            <i class="pi pi-times text-sm" aria-hidden="true"></i>
          </button>
        </div>

        <!-- Tab bar -->
        <div class="flex border-b border-[var(--border-main)]" role="tablist">
          <button
            v-for="tab in TABS" :key="tab.id"
            @click="activeTab = tab.id"
            :aria-selected="activeTab === tab.id ? 'true' : 'false'"
            role="tab"
            :class="[
              'flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2',
              activeTab === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-light)]/30'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)]',
            ]">
            <i :class="['pi text-[11px]', tab.icon]" aria-hidden="true"></i>
            {{ tab.label }}
          </button>
        </div>

        <!-- ── Profile tab ─────────────────────────────────── -->
        <div v-if="activeTab === 'profile'" class="p-6 flex flex-col gap-5" role="tabpanel">
          <!-- Full name row -->
          <div class="grid grid-cols-3 gap-3">
            <AppInput v-model="profileForm.firstName"  label="First Name"  size="sm" />
            <AppInput v-model="profileForm.middleName" label="Middle Name" size="sm" />
            <AppInput v-model="profileForm.lastName"   label="Last Name"   size="sm" />
          </div>
          <AppInput
            v-model="profileForm.username"
            label="Username"
            hint="Lowercase, no spaces. Used for login and display."
            size="sm" />
          <AppTextarea
            v-model="profileForm.bio"
            label="Bio"
            :maxlength="240"
            show-count
            placeholder="A short bio about your role or professional background..."
            size="sm" />
          <div>
            <p class="text-[11px] font-medium text-[var(--text-muted)] mb-3">Social Links</p>
            <div class="space-y-3">
              <div v-for="link in LINKS" :key="link.key" class="flex items-center gap-3">
                <div :class="['w-9 h-9 rounded-xl border flex items-center justify-center shrink-0', link.bg]">
                  <i :class="['pi text-sm', link.icon, link.color]"></i>
                </div>
                <AppInput v-model="profileForm.links[link.key]" :label="link.label" size="sm" class="flex-1" />
              </div>
            </div>
          </div>
        </div>

        <!-- ── Avatar tab ──────────────────────────────────── -->
        <div v-if="activeTab === 'avatar'" class="p-6 flex flex-col items-center gap-5" role="tabpanel">
          <div
            class="relative group cursor-pointer" tabindex="0" role="button"
            aria-label="Click to change profile photo"
            @click="triggerFile()"
            @keydown.enter="triggerFile()"
            @keydown.space.prevent="triggerFile()">
            <img :src="avatarSrc" :alt="authStore.user?.username"
              class="w-28 h-28 rounded-2xl object-cover border-4 border-[var(--color-primary-light)] shadow-lg" />
            <div class="absolute inset-0 rounded-2xl bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
              <i :class="['pi text-white text-2xl mb-1', uploading ? 'pi-spin pi-spinner' : 'pi-camera']"></i>
              <span class="text-white text-[10px] font-bold uppercase tracking-widest">Change</span>
            </div>
          </div>

          <input
            ref="fileInput"
            type="file"
            class="sr-only"
            accept="image/jpeg,image/png,image/webp,image/gif"
            @change="onFileSelect"
            aria-label="Upload profile photo" />

          <div class="text-center">
            <button @click="triggerFile()" :disabled="uploading"
              class="btn-primary h-10 px-6 text-sm disabled:opacity-50 flex items-center gap-2 mx-auto">
              <i :class="['pi text-xs', uploading ? 'pi-spin pi-spinner' : 'pi-upload']" aria-hidden="true"></i>
              {{ uploading ? 'Uploading...' : 'Upload New Photo' }}
            </button>
            <p class="text-[11px] text-[var(--text-muted)] mt-3">JPG, PNG, WebP &bull; Max 10 MB</p>
            <p class="text-[11px] text-[var(--text-muted)]">GIF files are accepted and will animate as-is.</p>
          </div>

          <div class="w-full p-3 bg-[var(--color-primary-light)]/40 rounded-xl border border-[var(--border-main)] text-center">
            <p class="text-[10px] text-[var(--color-primary)] font-bold">Your avatar is visible to admins on job applications.</p>
          </div>
        </div>

        <!-- ── Password tab ────────────────────────────────── -->
        <div v-if="activeTab === 'password'" class="p-6 flex flex-col gap-4" role="tabpanel">
          <div v-if="authStore.user?.googleId"
            class="flex items-start gap-3 p-4 rounded-xl bg-[var(--color-primary-light)] border border-[var(--border-main)] text-[var(--color-primary)]"
            role="alert">
            <i class="pi pi-info-circle mt-0.5 shrink-0" aria-hidden="true"></i>
            <div>
              <p class="text-sm font-bold">Google Account</p>
              <p class="text-xs mt-0.5">Your account uses Google sign-in. Manage your password through Google settings.</p>
            </div>
          </div>
          <template v-else>
            <AppInput v-model="pw.current" :type="showCurrPw ? 'text' : 'password'"
              label="Current Password" autocomplete="current-password" toggleable size="sm" />
            <AppInput v-model="pw.new" :type="showNewPw ? 'text' : 'password'"
              label="New Password" hint="Minimum 8 characters" autocomplete="new-password" toggleable size="sm" />
            <AppInput v-model="pw.confirm" :type="showConfirmPw ? 'text' : 'password'"
              label="Confirm New Password" autocomplete="new-password" toggleable size="sm" />
          </template>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-end gap-3">
          <button @click="close()" class="btn-secondary h-10 px-5 text-sm">Cancel</button>
          <button
            v-if="activeTab === 'profile'"
            @click="saveProfileInfo()"
            :disabled="isSaving"
            class="btn-primary h-10 px-5 text-sm disabled:opacity-50 flex items-center gap-2">
            <i v-if="isSaving" class="pi pi-spin pi-spinner text-xs" aria-hidden="true"></i>
            {{ isSaving ? 'Saving...' : 'Save Profile' }}
          </button>
          <button
            v-if="activeTab === 'password' && !authStore.user?.googleId"
            @click="handlePwUpdate()"
            :disabled="isSaving"
            class="btn-primary h-10 px-5 text-sm disabled:opacity-50 flex items-center gap-2">
            <i v-if="isSaving" class="pi pi-spin pi-spinner text-xs" aria-hidden="true"></i>
            {{ isSaving ? 'Updating...' : 'Update Password' }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>
