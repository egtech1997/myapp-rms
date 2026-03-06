<script setup>
</script>

<template>
    <div class="flex flex-col gap-6">
        <div>
            <h1 class="text-2xl font-bold text-[var(--text-main)] tracking-tight">Settings</h1>
            <p class="text-sm text-[var(--text-muted)] mt-0.5">Configure system-wide options and preferences.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="item in [
                { icon: 'pi-cog',        label: 'General Settings',    desc: 'Application name, logo, and basic configuration' },
                { icon: 'pi-envelope',   label: 'Email Configuration', desc: 'SMTP settings for OTP and notification emails' },
                { icon: 'pi-shield',     label: 'Security Policies',   desc: 'Password rules, session limits, and 2FA settings' },
                { icon: 'pi-database',   label: 'Data Management',     desc: 'Backup schedules, data retention, and export tools' },
            ]" :key="item.label"
                class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex items-start gap-4 opacity-60">
                <div class="w-10 h-10 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center flex-shrink-0">
                    <i :class="['pi text-sm text-[var(--text-muted)]', item.icon]"></i>
                </div>
                <div>
                    <p class="text-sm font-bold text-[var(--text-main)]">{{ item.label }}</p>
                    <p class="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{{ item.desc }}</p>
                </div>
            </div>
        </div>

        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl py-16 flex flex-col items-center gap-4 text-[var(--text-muted)]">
            <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center">
                <i class="pi pi-cog text-2xl"></i>
            </div>
            <div class="text-center">
                <p class="text-sm font-semibold text-[var(--text-main)]">System Settings</p>
                <p class="text-xs mt-1 max-w-xs">Full configuration panel will be available here to manage the recruitment system.</p>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Coming Soon</span>
        </div>
    </div>
</template>
