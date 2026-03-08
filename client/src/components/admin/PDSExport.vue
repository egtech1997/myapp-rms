<script setup>
import { ref } from 'vue'
import apiClient from '@/api/axios'
import { AppButton } from '@/components/ui'
import Swal from 'sweetalert2'

const props = defineProps({
  applicationId: { type: String, required: true },
  lastName: { type: String, default: 'Candidate' }
})

const generating = ref(false)

const handleExport = async () => {
  generating.value = true
  try {
    const response = await apiClient.get(`/v1/pds/${props.applicationId}/export`, {
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `PDS-${props.lastName}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    
    // Optional: Log success or show toast
    Swal.fire({
      icon: 'success',
      title: 'PDS Downloaded',
      toast: true,
      position: 'top-end',
      timer: 3000,
      showConfirmButton: false
    })
  } catch (err) {
    Swal.fire('Error', 'Failed to generate Personal Data Sheet', 'error')
  } finally {
    generating.value = false
  }
}
</script>

<template>
  <AppButton 
    variant="secondary" 
    size="sm" 
    @click="handleExport" 
    :loading="generating"
    class="w-full flex items-center justify-center gap-2"
  >
    <i class="pi pi-file-pdf text-red-500"></i>
    <span>Export PDS (Form 212)</span>
  </AppButton>
</template>
