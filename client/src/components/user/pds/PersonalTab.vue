<script setup>
import { AppInput, AppSelect, AppCheckbox } from '@/components/ui'
import { docFilename, docIsPdf } from '@/composables/useDocUpload'

defineOptions({ name: 'PersonalTab' })

const props = defineProps({
  modelValue: { type: Object, required: true },
})

defineEmits(['update:modelValue', 'upload', 'preview'])

const civilStatusOptions = [
  { label: 'Single',    value: 'Single'    },
  { label: 'Married',   value: 'Married'   },
  { label: 'Widowed',   value: 'Widowed'   },
  { label: 'Separated', value: 'Separated' },
  { label: 'Other',     value: 'Other'     },
]

const sexOptions = [
  { label: 'Male',              value: 'male'             },
  { label: 'Female',            value: 'female'           },
  { label: 'LGBTQ+',            value: 'LGBTQ+'           },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
]

const religionOptions = [
  'Roman Catholicism', 'Islam', 'Protestantism', 'Iglesia ni Cristo',
  'Philippine Independent Church (Aglipayan)', 'Seventh-day Adventist',
  "Jehovah's Witnesses", 'Buddhism', 'Hinduism', 'Other',
]

const addPhone   = () => props.modelValue.contact.phones.push('')
const removePhone = (i) => props.modelValue.contact.phones.splice(i, 1)
const addEmail   = () => props.modelValue.contact.emails.push('')
const removeEmail = (i) => props.modelValue.contact.emails.splice(i, 1)
</script>

<template>
  <div class="flex flex-col gap-8 animate-fade-in">

    <!-- ── Section header helper ───────────────────────── -->

    <!-- ── 1. Full Name ─────────────────────────────────── -->
    <div>
      <div class="flex items-center gap-2.5 mb-4 pb-2 border-b border-[var(--border-main)]">
        <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
          <i class="pi pi-user text-xs text-[var(--color-primary)]"></i>
        </div>
        <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Legal Full Name</h3>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AppInput v-model="modelValue.name.lastName"   label="Surname"     hint="e.g. DELA CRUZ" />
        <AppInput v-model="modelValue.name.firstName"  label="First Name"  hint="e.g. JUAN" />
        <AppInput v-model="modelValue.name.middleName" label="Middle Name" hint="e.g. MERCADO" />
        <AppInput v-model="modelValue.name.suffix"     label="Suffix"      hint="e.g. JR., III" />
      </div>
    </div>

    <!-- ── 2. Demographics ──────────────────────────────── -->
    <div>
      <div class="flex items-center gap-2.5 mb-4 pb-2 border-b border-[var(--border-main)]">
        <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
          <i class="pi pi-id-card text-xs text-[var(--color-primary)]"></i>
        </div>
        <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Demographics &amp; Identity</h3>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AppInput  v-model="modelValue.birthDate"   type="date" label="Date of Birth" />
        <AppSelect v-model="modelValue.sex"         label="Sex"          :options="sexOptions" />
        <AppSelect v-model="modelValue.civilStatus" label="Civil Status" :options="civilStatusOptions" />
        <AppSelect v-model="modelValue.religion"    label="Religion"     :options="religionOptions" />
        <AppInput  v-model="modelValue.disability"  label="Disability (if any)" hint="e.g. Visual Impairment — leave blank if none" />
        <div class="flex items-center gap-6 h-11 px-4 border border-[var(--border-main)] rounded-xl bg-[var(--surface)]">
          <AppCheckbox v-model="modelValue.isIndigenous" label="Indigenous People (IP)" />
          <AppCheckbox v-model="modelValue.isSoloParent" label="Solo Parent" />
        </div>
      </div>
    </div>

    <!-- ── 3. Government IDs ────────────────────────────── -->
    <div class="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-main)] p-5">
      <div class="flex items-center gap-2.5 mb-4 pb-2 border-b border-[var(--border-main)]">
        <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
          <i class="pi pi-shield text-xs text-[var(--color-primary)]"></i>
        </div>
        <div>
          <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Government-Issued IDs</h3>
          <p class="text-[10px] text-[var(--text-muted)] mt-0.5">Required for appointment processing and payroll enrollment</p>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <AppInput v-model="modelValue.gsisNo"          label="GSIS BP No."         size="sm" />
        <AppInput v-model="modelValue.pagibigNo"        label="Pag-IBIG No."        size="sm" />
        <AppInput v-model="modelValue.philhealthNo"     label="PhilHealth No."      size="sm" />
        <AppInput v-model="modelValue.tinNo"            label="TIN No."             size="sm" />
        <AppInput v-model="modelValue.philSysNo"        label="PhilSys (National ID) No." size="sm" />
        <AppInput v-model="modelValue.agencyEmployeeNo" label="Agency Employee No." size="sm" />
      </div>
    </div>

    <!-- ── 4. Contact Information ───────────────────────── -->
    <div>
      <div class="flex items-center gap-2.5 mb-4 pb-2 border-b border-[var(--border-main)]">
        <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
          <i class="pi pi-phone text-xs text-[var(--color-primary)]"></i>
        </div>
        <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Contact Information</h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <!-- Phones -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Phone Numbers</p>
            <button @click="addPhone" class="text-[10px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
              <i class="pi pi-plus text-[9px]"></i> Add
            </button>
          </div>
          <div class="flex flex-col gap-1">
            <div v-for="(_, i) in modelValue.contact.phones" :key="i" class="flex items-start gap-1.5">
              <AppInput v-model="modelValue.contact.phones[i]"
                :label="i === 0 ? 'Primary Phone' : `Phone ${i + 1}`"
                prefixIcon="pi-phone" size="sm" class="flex-1" />
              <button v-if="i > 0" @click="removePhone(i)"
                class="w-8 h-8 shrink-0 self-start mt-1 flex items-center justify-center rounded-lg text-[var(--text-faint)] hover:text-rose-500 hover:bg-rose-50 transition-colors">
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
            <p v-if="!modelValue.contact.phones.length" class="text-[11px] text-[var(--text-faint)] italic px-1">No phone numbers added.</p>
          </div>
        </div>

        <!-- Emails -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">Email Addresses</p>
            <button @click="addEmail" class="text-[10px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
              <i class="pi pi-plus text-[9px]"></i> Add
            </button>
          </div>
          <div class="flex flex-col gap-1">
            <div v-for="(_, i) in modelValue.contact.emails" :key="i" class="flex items-start gap-1.5">
              <AppInput v-model="modelValue.contact.emails[i]"
                :label="i === 0 ? 'Primary Email' : `Email ${i + 1}`"
                prefixIcon="pi-envelope" size="sm" class="flex-1" />
              <button v-if="i > 0" @click="removeEmail(i)"
                class="w-8 h-8 shrink-0 self-start mt-1 flex items-center justify-center rounded-lg text-[var(--text-faint)] hover:text-rose-500 hover:bg-rose-50 transition-colors">
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
            <p v-if="!modelValue.contact.emails.length" class="text-[11px] text-[var(--text-faint)] italic px-1">No email addresses added.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 5. Current Residential Address ──────────────── -->
    <div>
      <div class="flex items-center gap-2.5 mb-4 pb-2 border-b border-[var(--border-main)]">
        <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
          <i class="pi pi-home text-xs text-[var(--color-primary)]"></i>
        </div>
        <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Current Residential Address</h3>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div class="col-span-2 md:col-span-3">
          <AppInput v-model="modelValue.currentAddress.sitio" label="House No. / Street / Sitio" />
        </div>
        <AppInput v-model="modelValue.currentAddress.barangay"    label="Barangay"     size="sm" />
        <AppInput v-model="modelValue.currentAddress.municipality" label="Municipality" size="sm" />
        <AppInput v-model="modelValue.currentAddress.city"         label="City"         size="sm" />
        <AppInput v-model="modelValue.currentAddress.province"     label="Province"     size="sm" />
        <AppInput v-model="modelValue.currentAddress.zipCode"      label="ZIP Code"     size="sm" />
        <AppInput v-model="modelValue.currentAddress.country"      label="Country"      size="sm" />
      </div>
    </div>

    <!-- ── 6. COMELEC Registered Address ───────────────── -->
    <div class="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-main)] p-5">
      <div class="flex items-center gap-2.5 mb-4 pb-2 border-b border-[var(--border-main)]">
        <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
          <i class="pi pi-map text-xs text-[var(--color-primary)]"></i>
        </div>
        <div>
          <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">COMELEC Registered Address</h3>
          <p class="text-[10px] text-[var(--text-muted)] mt-0.5">Address on record with the Commission on Elections (for voting)</p>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div class="col-span-2 md:col-span-3">
          <AppInput v-model="modelValue.comelecAddress.sitio" label="House No. / Street / Sitio" />
        </div>
        <AppInput v-model="modelValue.comelecAddress.barangay"    label="Barangay"     size="sm" />
        <AppInput v-model="modelValue.comelecAddress.municipality" label="Municipality" size="sm" />
        <AppInput v-model="modelValue.comelecAddress.city"         label="City"         size="sm" />
        <AppInput v-model="modelValue.comelecAddress.province"     label="Province"     size="sm" />
        <AppInput v-model="modelValue.comelecAddress.zipCode"      label="ZIP Code"     size="sm" />
      </div>

      <!-- COMELEC Document -->
      <div class="flex items-center gap-3 px-3 py-2.5 bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border-main)]">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          :class="modelValue.comelecAddress.document ? 'bg-[var(--color-primary-light)]' : 'bg-[var(--bg-app)]'">
          <i :class="[
            'text-sm',
            modelValue.comelecAddress.document
              ? (docIsPdf(modelValue.comelecAddress.document) ? 'pi pi-file-pdf text-[var(--color-primary)]' : 'pi pi-image text-[var(--color-primary)]')
              : 'pi pi-upload text-[var(--text-faint)]'
          ]"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[10px] font-bold text-[var(--text-muted)]">Voter's ID / Certificate of Registration</p>
          <div v-if="modelValue.comelecAddress.document" class="flex items-center gap-2 mt-0.5">
            <span class="text-[10px] text-[var(--text-faint)] truncate max-w-[140px]" :title="docFilename(modelValue.comelecAddress.document)">
              {{ docFilename(modelValue.comelecAddress.document) }}
            </span>
            <button @click="$emit('preview', modelValue.comelecAddress.document, 'COMELEC Registration')"
              class="text-[11px] font-black text-[var(--color-primary)] hover:underline shrink-0">View</button>
          </div>
          <label v-else class="text-[11px] font-bold text-[var(--color-primary)] hover:underline cursor-pointer mt-0.5 block">
            Click to upload
            <input type="file" class="sr-only" accept=".pdf,image/*" @change="$emit('upload', $event, 'comelecAddress')" />
          </label>
        </div>
        <label v-if="modelValue.comelecAddress.document"
          class="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border-main)] bg-[var(--surface)] text-[var(--text-faint)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all cursor-pointer shrink-0"
          title="Replace file">
          <i class="pi pi-sync text-[10px]"></i>
          <input type="file" class="sr-only" accept=".pdf,image/*" @change="$emit('upload', $event, 'comelecAddress')" />
        </label>
      </div>
    </div>

  </div>
</template>
