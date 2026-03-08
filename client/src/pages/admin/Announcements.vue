<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'
import { AppButton, AppBadge, AppModal, AppInput, AppTextarea, AppCard, AppPageHeader } from '@/components/ui'

const toast = inject('$toast')
const swal = inject('$swal')
const authStore = useAuthStore()

// ─── Data ──────────────────────────────────────────────────────────────────
const announcements = ref([])
const loading = ref(true)
const showDrawer = ref(false)
const isEditing = ref(false)
const drawerLoading = ref(false)

const emptyForm = () => ({
    title: '',
    content: '',
    status: 'published',
    expiryDate: '',
})

const form = ref(emptyForm())
const editingId = ref(null)

// ─── Fetch ─────────────────────────────────────────────────────────────────
const fetchAnnouncements = async () => {
    loading.value = true
    try {
        const { data } = await apiClient.get('/v1/announcements/admin')
        announcements.value = data.data
    } catch {
        toast.fire({ icon: 'error', title: 'Error', text: 'Failed to load announcements.' })
    } finally {
        loading.value = false
    }
}

onMounted(fetchAnnouncements)

const canManage = computed(() => authStore.can('role_manage') || authStore.isAdmin)

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

// ─── Actions ───────────────────────────────────────────────────────────────
const openCreate = () => {
    form.value = emptyForm()
    editingId.value = null
    isEditing.value = false
    showDrawer.value = true
}

const openEdit = (item) => {
    form.value = {
        title: item.title,
        content: item.content,
        status: item.status,
        expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
    }
    editingId.value = item._id
    isEditing.value = true
    showDrawer.value = true
}

const handleSubmit = async () => {
    if (!form.value.title || !form.value.content) return
    drawerLoading.value = true
    try {
        const payload = {
            title: form.value.title,
            content: form.value.content,
            status: form.value.status,
            expiryDate: form.value.expiryDate || undefined,
        }
        if (isEditing.value) {
            const { data } = await apiClient.patch(`/v1/announcements/${editingId.value}`, payload)
            const idx = announcements.value.findIndex(a => a._id === editingId.value)
            if (idx !== -1) announcements.value[idx] = data.data
            toast.fire({ icon: 'success', title: 'Announcement Updated' })
        } else {
            const { data } = await apiClient.post('/v1/announcements', payload)
            announcements.value.unshift(data.data)
            toast.fire({ icon: 'success', title: 'Announcement Published' })
        }
        showDrawer.value = false
    } catch (err) {
        toast.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to save.' })
    } finally {
        drawerLoading.value = false
    }
}

const handleDelete = async (id) => {
    const result = await swal.fire({
        title: 'Delete Announcement?',
        text: 'This cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Delete',
        reverseButtons: true,
    })
    if (!result.isConfirmed) return
    try {
        await apiClient.delete(`/v1/announcements/${id}`)
        announcements.value = announcements.value.filter(a => a._id !== id)
        toast.fire({ icon: 'success', title: 'Deleted' })
    } catch {
        toast.fire({ icon: 'error', title: 'Delete failed' })
    }
}
</script>

<template>
    <div class="flex flex-col gap-6 animate-fade-in-up">
        
        <AppPageHeader title="Public Bulletin" subtitle="Manage announcements visible on the home portal." icon="pi-megaphone">
          <template #actions>
            <AppButton v-if="canManage" variant="primary" icon="pi-plus" @click="openCreate">
              New Announcement
            </AppButton>
          </template>
        </AppPageHeader>

        <!-- Feed Grid -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="i in 3" :key="i" class="h-48 rounded-xl bg-[var(--bg-app)] animate-pulse"></div>
        </div>

        <div v-else-if="announcements.length === 0" class="py-32 flex flex-col items-center justify-center text-center opacity-60">
            <div class="w-16 h-16 rounded-2xl bg-[var(--bg-app)] flex items-center justify-center mb-4">
                <i class="pi pi-megaphone text-3xl text-[var(--text-muted)]"></i>
            </div>
            <h3 class="text-lg font-bold text-[var(--text-main)]">No announcements yet</h3>
            <p class="text-sm text-[var(--text-muted)] max-w-xs mt-1">Create a new post to update applicants.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AppCard v-for="item in announcements" :key="item._id" class="card-raised flex flex-col h-full group">
                <div class="p-6 flex-1 flex flex-col">
                    <div class="flex justify-between items-start mb-4">
                        <AppBadge :variant="item.status === 'published' ? 'success' : 'neutral'" size="sm">
                            {{ item.status === 'published' ? 'Published' : 'Draft' }}
                        </AppBadge>
                        <span class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{{ formatDate(item.createdAt) }}</span>
                    </div>

                    <h3 class="text-lg font-bold text-[var(--text-main)] mb-2 group-hover:text-[var(--color-primary)] transition-colors">{{ item.title }}</h3>
                    <p class="text-sm text-[var(--text-muted)] line-clamp-3 leading-relaxed" v-html="item.content.replace(/<[^>]*>/g, ' ')"></p>
                </div>

                <div v-if="canManage" class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)]/50 flex justify-end gap-2">
                    <button @click="openEdit(item)" class="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--color-primary)] px-3 py-1.5 rounded-lg hover:bg-[var(--surface)] transition-colors flex items-center gap-1">
                        <i class="pi pi-pencil text-[10px]"></i> Edit
                    </button>
                    <button @click="handleDelete(item._id)" class="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1">
                        <i class="pi pi-trash text-[10px]"></i> Delete
                    </button>
                </div>
            </AppCard>
        </div>

        <!-- Create/Edit Modal -->
        <AppModal
            v-model="showDrawer"
            :title="isEditing ? 'Edit Announcement' : 'New Announcement'"
            subtitle="Broadcast updates to all portal visitors."
            icon="pi-megaphone"
            size="md">

            <form @submit.prevent="handleSubmit" class="space-y-5">
                <div>
                    <label class="field-label block mb-1.5">Title</label>
                    <AppInput v-model="form.title" placeholder="e.g. System Maintenance" required />
                </div>
                <div>
                    <label class="field-label block mb-1.5">Expiry Date <span class="text-[var(--text-faint)] font-normal">(optional)</span></label>
                    <AppInput v-model="form.expiryDate" type="date" />
                </div>
                <div>
                    <label class="field-label block mb-1.5">Content</label>
                    <AppTextarea v-model="form.content" rows="5" placeholder="Write your announcement here..." required />
                </div>
                <div class="flex items-center gap-3 p-4 bg-[var(--bg-app)] rounded-xl border border-[var(--border-main)]">
                    <input type="checkbox" :checked="form.status === 'published'" @change="form.status = $event.target.checked ? 'published' : 'draft'"
                        class="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-0 cursor-pointer" />
                    <div>
                        <p class="text-sm font-bold text-[var(--text-main)]">Publish Immediately</p>
                        <p class="text-xs text-[var(--text-muted)]">Visible to all guest visitors on the portal.</p>
                    </div>
                </div>
            </form>

            <template #footer>
                <AppButton variant="ghost" @click="showDrawer = false">Cancel</AppButton>
                <AppButton variant="primary" :loading="drawerLoading" @click="handleSubmit">
                    {{ isEditing ? 'Update' : 'Publish' }}
                </AppButton>
            </template>
        </AppModal>

    </div>
</template>
