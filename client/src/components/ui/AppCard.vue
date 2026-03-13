<script setup>
defineOptions({ name: 'AppCard' })

const props = defineProps({
  /**
   * Variants:
   *   default  — white surface, hairline border, subtle shadow
   *   flat     — white surface, hairline border, NO shadow (for nested cards)
   *   raised   — white surface, border, prominent shadow + lift on hover
   *   bordered — white surface, 2px primary-tinted border, no shadow
   *   ghost    — off-white bg-app surface, dashed border (de-emphasis)
   *   gradient — white surface with purple-tinted gradient header band
   */
  variant:   { type: String, default: 'default',
    validator: (v) => ['default', 'flat', 'raised', 'bordered', 'ghost', 'gradient'].includes(v) },
  title:     { type: String,  default: '' },
  subtitle:  { type: String,  default: '' },
  icon:      { type: String,  default: '' },
  iconColor: { type: String,  default: 'primary' }, // primary | gold | success | danger
  hoverable: { type: Boolean, default: false },
  padding:   { type: String,  default: 'md', validator: (v) => ['none', 'sm', 'md', 'lg'].includes(v) },
  as:        { type: String,  default: 'div' },
})

defineEmits(['click'])

const iconColorMap = {
  primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
  gold:    'bg-[var(--color-gold-light)]    text-[var(--color-gold)]',
  success: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
  danger:  'bg-[var(--color-danger-light)]  text-[var(--color-danger)]',
}

const paddingClass = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }

// Base class per variant — each has a distinct visual identity
const variantBase = {
  default:  'bg-[var(--surface)] border border-[var(--border-main)]',
  flat:     'bg-[var(--surface)] border border-[var(--border-main)]',
  raised:   'bg-[var(--surface)] border border-[var(--border-main)]',
  bordered: 'bg-[var(--surface)] border-2 border-[var(--color-primary-ring)]/40',
  ghost:    'bg-[var(--bg-app)] border border-dashed border-[var(--border-main)]',
  gradient: 'bg-[var(--surface)] border border-[var(--border-main)]',
}

const shadowMap = {
  default:  'var(--shadow-sm)',
  flat:     'none',
  raised:   'var(--shadow-md)',
  bordered: 'none',
  ghost:    'none',
  gradient: 'var(--shadow-sm)',
}
</script>

<template>
  <component
    :is="as"
    :data-hoverable="hoverable || undefined"
    :class="[
      'rounded-[var(--radius-xl)] overflow-hidden',
      variantBase[variant],
    ]"
    :style="{
      boxShadow: shadowMap[variant],
      transition: hoverable ? 'box-shadow var(--dur-normal) var(--ease-smooth), transform var(--dur-normal) var(--ease-smooth), border-color var(--dur-normal) var(--ease-smooth)' : '',
      cursor: hoverable ? 'pointer' : '',
    }"
    @click="$emit('click', $event)"
    @mouseenter="(e) => { if (hoverable) { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; } }"
    @mouseleave="(e) => { if (hoverable) { e.currentTarget.style.boxShadow = shadowMap[variant]; e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = ''; } }"
    @mousedown="(e)  => { if (hoverable) { e.currentTarget.style.transform = 'translateY(-1px) scale(0.995)'; e.currentTarget.style.transition = 'all var(--dur-instant) var(--ease-crisp)'; } }"
    @mouseup="(e)    => { if (hoverable) { e.currentTarget.style.transition = 'all var(--dur-normal) var(--ease-smooth)'; } }">

    <!-- Custom header slot (images, etc.) -->
    <slot name="header" />

    <!-- Gradient band header (variant="gradient") -->
    <div v-if="variant === 'gradient' && (title || subtitle || icon || $slots.actions)"
      class="px-5 py-4 flex items-center justify-between gap-4"
      style="background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 6%, white) 0%, white 80%); border-bottom: 1px solid var(--border-main);">
      <div class="flex items-center gap-3">
        <div v-if="icon" :class="['w-9 h-9 rounded-[var(--radius-xl)] flex items-center justify-center shrink-0', iconColorMap[iconColor]]">
          <i :class="['pi text-sm', icon]" aria-hidden="true"></i>
        </div>
        <div>
          <p v-if="title" class="text-sm font-bold text-[var(--text-main)] leading-snug tracking-tight">{{ title }}</p>
          <p v-if="subtitle" class="text-xs text-[var(--text-muted)] mt-0.5">{{ subtitle }}</p>
        </div>
      </div>
      <div class="shrink-0"><slot name="actions" /></div>
    </div>

    <!-- Standard header for all other variants -->
    <div v-else-if="title || subtitle || icon || $slots.actions"
      class="flex items-start justify-between gap-4 px-5 pt-5 pb-0">
      <div class="flex items-center gap-3">
        <div v-if="icon" :class="['w-9 h-9 rounded-[var(--radius-xl)] flex items-center justify-center shrink-0', iconColorMap[iconColor]]">
          <i :class="['pi text-sm', icon]" aria-hidden="true"></i>
        </div>
        <div>
          <h3 v-if="title" class="text-sm font-bold text-[var(--text-main)] leading-snug tracking-tight">{{ title }}</h3>
          <p v-if="subtitle" class="text-xs text-[var(--text-muted)] mt-0.5 leading-snug">{{ subtitle }}</p>
        </div>
      </div>
      <div class="shrink-0"><slot name="actions" /></div>
    </div>

    <!-- Body -->
    <div :class="['text-sm text-[var(--text-sub)]', paddingClass[padding]]">
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer"
      class="px-5 py-3.5 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex items-center gap-3">
      <slot name="footer" />
    </div>
  </component>
</template>
