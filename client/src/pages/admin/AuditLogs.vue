<script setup>
import AuditLogCenter from '@/components/admin/AuditLogCenter.vue'
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-xl font-bold text-[var(--text-main)] tracking-tight">Audit Logs</h1>
      <p class="text-sm text-[var(--text-muted)] mt-0.5">Track all admin and system activity — user actions, logins, and data changes.</p>
    </div>
    <AuditLogCenter />
  </div>
</template>
