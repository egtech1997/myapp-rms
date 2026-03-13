<script setup>
import { AppInput } from '@/components/ui'

defineOptions({ name: 'ReferencesTab' })

const props = defineProps({
  modelValue: { type: Array, required: true },
})

// modelValue IS form.references (reactive array) — mutate directly
const addEntry    = () => props.modelValue.unshift({ name: '', address: '', phone: '' })
const removeEntry = (i) => props.modelValue.splice(i, 1)
</script>

<template>
  <div class="flex flex-col gap-6">

    <!-- ── BEI Reminder banner ──────────────────────────── -->
    <div class="flex items-start gap-3 p-4 rounded-[var(--radius-xl)] border border-[var(--color-primary-light)] bg-[var(--color-primary-light)]">
      <div class="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center shrink-0 mt-0.5">
        <i class="pi pi-info-circle text-sm text-white"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-black text-[var(--color-primary)] mb-1.5">Background and Employment Investigation (BEI) Notice</p>
        <p class="text-[11px] text-[var(--text-sub)] leading-relaxed mb-2">
          Your listed references may be contacted by the DepEd Selection Board or the BEI Committee
          to verify your credentials, character, and fitness for the position. Ensure all references
          are <strong>aware and available</strong>, and contact details are accurate.
        </p>
        <div class="flex flex-col gap-1">
          <div class="flex items-start gap-1.5">
            <i class="pi pi-check-circle text-[10px] text-[var(--color-primary)] mt-0.5 shrink-0"></i>
            <span class="text-[10px] text-[var(--text-muted)]">Provide at least <strong>3 references</strong> not related to you by blood or marriage.</span>
          </div>
          <div class="flex items-start gap-1.5">
            <i class="pi pi-check-circle text-[10px] text-[var(--color-primary)] mt-0.5 shrink-0"></i>
            <span class="text-[10px] text-[var(--text-muted)]">References must be persons of known integrity and good standing in the community.</span>
          </div>
          <div class="flex items-start gap-1.5">
            <i class="pi pi-check-circle text-[10px] text-[var(--color-primary)] mt-0.5 shrink-0"></i>
            <span class="text-[10px] text-[var(--text-muted)]">Former supervisors, principals, or department heads are strongly preferred.</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Section header ──────────────────────────────── -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-black text-[var(--text-main)]">Character References</h3>
        <p class="text-xs text-[var(--text-muted)] mt-0.5">Provide at least 3 character references not related to you by blood or marriage.</p>
      </div>
      <button @click="addEntry" class="btn-primary h-9 px-4 text-xs flex items-center gap-2 shrink-0">
        <i class="pi pi-plus text-[10px]"></i> Add Reference
      </button>
    </div>

    <!-- ── Empty state ─────────────────────────────────── -->
    <div v-if="modelValue.length === 0"
      class="py-16 flex flex-col items-center gap-3 border-2 border-dashed border-[var(--border-main)] rounded-[var(--radius-xl)] bg-[var(--bg-app)]">
      <div class="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border-main)] flex items-center justify-center shadow-sm">
        <i class="pi pi-address-book text-xl text-[var(--text-faint)]"></i>
      </div>
      <div class="text-center">
        <p class="text-sm font-bold text-[var(--text-main)]">No references added yet</p>
        <p class="text-xs text-[var(--text-muted)] mt-1">Add at least 3 character references to complete your profile.</p>
      </div>
      <button @click="addEntry" class="btn-secondary h-9 px-4 text-xs flex items-center gap-2">
        <i class="pi pi-plus text-[10px]"></i> Add First Reference
      </button>
    </div>

    <!-- ── Reference entries ───────────────────────────── -->
    <div v-else class="flex flex-col gap-4">
      <div
        v-for="(ref, i) in modelValue" :key="i"
        class="border border-[var(--border-main)] rounded-[var(--radius-xl)] overflow-hidden"
        style="box-shadow:var(--shadow-xs)">

        <!-- Entry header -->
        <div class="px-5 py-3 bg-[var(--bg-app)] border-b border-[var(--border-main)] flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-black flex items-center justify-center shrink-0">
              {{ i + 1 }}
            </span>
            <span class="text-xs font-bold text-[var(--text-muted)]">
              {{ ref.name || 'Reference Entry' }}
            </span>
          </div>
          <button @click="removeEntry(i)"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-faint)] hover:text-rose-500 hover:bg-rose-50 transition-colors">
            <i class="pi pi-trash text-xs"></i>
          </button>
        </div>

        <!-- Fields -->
        <div class="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <AppInput v-model="ref.name" label="Full Name"
              hint="e.g. Dr. Maria Santos" />
          </div>
          <div class="sm:col-span-1 lg:col-span-1">
            <AppInput v-model="ref.phone" label="Telephone / Mobile No."
              hint="Active contact number" prefixIcon="pi-phone" />
          </div>
          <div class="sm:col-span-2 lg:col-span-1">
            <AppInput v-model="ref.address" label="Position &amp; Organization / Address"
              hint="e.g. Principal II, Guihulngan City NHS" />
          </div>
        </div>

      </div>

      <!-- Minimum count indicator -->
      <div class="flex items-center gap-3 px-1">
        <div class="flex items-center gap-1">
          <span v-for="n in 3" :key="n"
            :class="['w-2 h-2 rounded-full transition-all duration-300', n <= modelValue.length ? 'bg-green-500' : 'bg-[var(--border-main)]']">
          </span>
        </div>
        <p class="text-[10px] font-bold" :class="modelValue.length >= 3 ? 'text-green-600' : 'text-[var(--text-faint)]'">
          {{ modelValue.length }}/3 minimum
          <span v-if="modelValue.length >= 3"> — requirement met</span>
          <span v-else> — add {{ 3 - modelValue.length }} more</span>
        </p>
      </div>
    </div>

  </div>
</template>
