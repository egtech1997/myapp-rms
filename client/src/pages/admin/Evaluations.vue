<script setup>
</script>

<template>
    <div class="flex flex-col gap-6">
        <div>
            <h1 class="text-2xl font-bold text-[var(--text-main)] tracking-tight">Evaluations</h1>
            <p class="text-sm text-[var(--text-muted)] mt-0.5">Rate and score applicants based on DepEd MSP criteria.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div v-for="item in [
                { icon: 'pi-star', label: 'Education Points', desc: 'Score education credentials per qualification standards' },
                { icon: 'pi-chart-bar', label: 'Experience Points', desc: 'Evaluate relevant work experience and government service' },
                { icon: 'pi-verified', label: 'Training Points', desc: 'Assess trainings and eligibilities within the last 5 years' },
            ]" :key="item.label"
                class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex flex-col gap-3 opacity-60">
                <div class="w-10 h-10 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center">
                    <i :class="['pi text-sm text-[var(--text-muted)]', item.icon]"></i>
                </div>
                <div>
                    <p class="text-sm font-bold text-[var(--text-main)]">{{ item.label }}</p>
                    <p class="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{{ item.desc }}</p>
                </div>
            </div>
        </div>

        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl py-20 flex flex-col items-center gap-4 text-[var(--text-muted)]">
            <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center">
                <i class="pi pi-list-check text-2xl"></i>
            </div>
            <div class="text-center">
                <p class="text-sm font-semibold text-[var(--text-main)]">Evaluation Module</p>
                <p class="text-xs mt-1 max-w-xs">The DepEd MSP-based rating sheet will be available here for HR to score and rank qualified applicants.</p>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Coming Soon</span>
        </div>
    </div>
</template>
