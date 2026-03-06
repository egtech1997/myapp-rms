<script setup>
</script>

<template>
    <div class="flex flex-col gap-6">
        <div>
            <h1 class="text-2xl font-bold text-[var(--text-main)] tracking-tight">Registry of Qualified Applicants</h1>
            <p class="text-sm text-[var(--text-muted)] mt-0.5">Consolidated list of applicants who passed the evaluation process.</p>
        </div>

        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl py-24 flex flex-col items-center gap-4 text-[var(--text-muted)]">
            <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center">
                <i class="pi pi-verified text-2xl"></i>
            </div>
            <div class="text-center">
                <p class="text-sm font-semibold text-[var(--text-main)]">RQA Module</p>
                <p class="text-xs mt-1 max-w-sm">Ranked and qualified applicants will appear here after evaluations are completed. The RQA is used for final selection and appointment.</p>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Coming Soon</span>
        </div>
    </div>
</template>
