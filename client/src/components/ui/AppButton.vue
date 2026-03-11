<script setup>
defineOptions({ name: 'AppButton' })

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'danger', 'ghost', 'link', 'outline', 'gold'].includes(v),
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v),
  },
  type:      { type: String,  default: 'button' },
  loading:   { type: Boolean, default: false },
  disabled:  { type: Boolean, default: false },
  block:     { type: Boolean, default: false },
  icon:      { type: String,  default: '' },
  iconRight: { type: String,  default: '' },
  ariaLabel: { type: String,  default: '' },
})

const emit = defineEmits(['click'])

const variantClass = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
  ghost:     'btn-ghost',
  link:      'btn-link',
  outline:   'btn-outline',
  gold:      'btn-gold',
}

const sizeMap = {
  xs: { h: 'h-7',    px: 'px-2.5', text: 'text-xs',     gap: 'gap-1.5', iconSize: 'text-[10px]' },
  sm: { h: 'h-8',    px: 'px-3',   text: 'text-[13px]', gap: 'gap-1.5', iconSize: 'text-xs'    },
  md: { h: 'h-9',    px: 'px-4',   text: 'text-sm',     gap: 'gap-2',   iconSize: 'text-xs'    },
  lg: { h: 'h-10',   px: 'px-5',   text: 'text-[15px]', gap: 'gap-2',   iconSize: 'text-sm'    },
  xl: { h: 'h-12',   px: 'px-6',   text: 'text-base',   gap: 'gap-2.5', iconSize: 'text-sm'    },
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-label="ariaLabel || undefined"
    :aria-busy="loading || undefined"
    :aria-disabled="(disabled || loading) || undefined"
    :class="[
      variantClass[variant],
      /* Override height/padding from global classes with size-specific values */
      variant !== 'link' ? sizeMap[size].h : '',
      variant !== 'link' ? sizeMap[size].px : '',
      sizeMap[size].text,
      sizeMap[size].gap,
      block ? 'w-full justify-center' : '',
      (disabled || loading) ? 'pointer-events-none opacity-50' : '',
    ]"
    @click="!disabled && !loading && emit('click', $event)"
  >
    <!-- Loading — spinner replaces left icon (no layout shift) -->
    <span v-if="loading" class="inline-flex items-center justify-center shrink-0" aria-hidden="true">
      <svg
        :class="[sizeMap[size].iconSize === 'text-[10px]' ? 'w-3 h-3' : sizeMap[size].iconSize === 'text-xs' ? 'w-3.5 h-3.5' : 'w-4 h-4']"
        viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
        class="animate-spin">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="2.5"/>
        <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </span>

    <!-- Left icon -->
    <i
      v-else-if="icon"
      :class="['pi shrink-0', icon, sizeMap[size].iconSize]"
      aria-hidden="true">
    </i>

    <!-- Label -->
    <slot />

    <!-- Right icon / chevron -->
    <i
      v-if="iconRight && !loading"
      :class="['pi shrink-0', iconRight, sizeMap[size].iconSize, $slots.default ? 'ml-auto' : '']"
      aria-hidden="true">
    </i>
  </button>
</template>

<style scoped>
/* Outline variant — cannot be expressed fully in global CSS */
.btn-outline {
  position: relative;
  display: inline-flex;
  align-items: center;
  background: transparent;
  color: var(--color-primary);
  font-weight: 600;
  letter-spacing: -0.01em;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-primary);
  cursor: pointer;
  overflow: hidden;
  transition:
    background  var(--dur-fast) var(--ease-smooth),
    color       var(--dur-fast) var(--ease-smooth),
    transform   var(--dur-instant) var(--ease-crisp),
    box-shadow  var(--dur-fast) var(--ease-smooth);
  will-change: transform;
}
.btn-outline:hover {
  background: var(--color-primary);
  color: #fff;
  box-shadow: var(--shadow-primary);
  transform: translateY(-1px);
}
.btn-outline:active {
  transform: translateY(0) scale(0.98);
  transition-duration: var(--dur-instant);
}
</style>
