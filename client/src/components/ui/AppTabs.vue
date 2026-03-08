<script setup>
import { computed } from 'vue'

defineOptions({ name: 'AppTabs' })

const props = defineProps({
  modelValue: { type: String, required: true },
  tabs: {
    type: Array,   // [{ key, label, icon?, badge?, disabled? }]
    required: true,
  },
  variant: {
    type: String,
    default: 'underline',
    validator: (v) => ['underline', 'pills', 'boxed'].includes(v),
  },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
})
const emit = defineEmits(['update:modelValue'])

const select = (key, disabled) => { if (!disabled) emit('update:modelValue', key) }

// Keyboard navigation: arrow keys move between tabs
const onKeyDown = (e, idx) => {
  const enabled = props.tabs.filter(t => !t.disabled)
  const cur = enabled.findIndex(t => t.key === props.modelValue)
  if (e.key === 'ArrowRight') { const next = enabled[(cur + 1) % enabled.length]; select(next.key) }
  if (e.key === 'ArrowLeft')  { const prev = enabled[(cur - 1 + enabled.length) % enabled.length]; select(prev.key) }
  if (e.key === 'Home') select(enabled[0].key)
  if (e.key === 'End')  select(enabled[enabled.length - 1].key)
}

const tabBtnClass = computed(() => (tab) => {
  const active = tab.key === props.modelValue
  const disabled = tab.disabled
  const base = 'inline-flex items-center gap-2 font-semibold transition-all duration-150 whitespace-nowrap outline-none'
  const sizeC = props.size === 'sm' ? 'text-xs px-3 py-1.5' : props.size === 'lg' ? 'text-base px-5 py-3' : 'text-sm px-4 py-2.5'

  if (props.variant === 'underline') {
    return [base, sizeC, 'border-b-2 -mb-px rounded-none',
      active   ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
               : disabled ? 'border-transparent text-[var(--text-faint)] cursor-not-allowed'
               : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)]',
    ]
  }
  if (props.variant === 'pills') {
    return [base, sizeC, 'rounded-lg',
      active   ? 'bg-[var(--color-primary)] text-white shadow-sm'
               : disabled ? 'text-[var(--text-faint)] cursor-not-allowed'
               : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-2)]',
    ]
  }
  // boxed
  return [base, sizeC, 'rounded-t-lg border border-b-0',
    active   ? 'bg-[var(--surface)] border-[var(--border-main)] text-[var(--text-main)] -mb-px'
             : disabled ? 'border-transparent text-[var(--text-faint)] cursor-not-allowed'
             : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]',
  ]
})
</script>

<template>
  <div class="flex flex-col">
    <!-- Tab list -->
    <div
      role="tablist"
      :aria-label="'Tabs'"
      :class="[
        'flex gap-1',
        variant === 'underline' ? 'border-b border-[var(--border-main)]' : '',
        variant === 'boxed'     ? 'border-b border-[var(--border-main)]' : '',
        variant === 'pills'     ? 'p-1 bg-[var(--surface-2)] rounded-xl gap-1 w-fit' : '',
      ]">
      <button
        v-for="(tab, idx) in tabs"
        :key="tab.key"
        role="tab"
        :aria-selected="tab.key === modelValue"
        :aria-controls="`tabpanel-${tab.key}`"
        :aria-disabled="tab.disabled || undefined"
        :tabindex="tab.key === modelValue ? 0 : -1"
        :class="tabBtnClass(tab)"
        @click="select(tab.key, tab.disabled)"
        @keydown="onKeyDown($event, idx)">

        <i v-if="tab.icon" :class="['pi', tab.icon,
          tab.key === modelValue ? '' : 'opacity-70',
          props.size === 'sm' ? 'text-[11px]' : 'text-xs']"
          aria-hidden="true"></i>

        {{ tab.label }}

        <!-- Badge count -->
        <span v-if="tab.badge"
          :class="[
            'min-w-[18px] h-[18px] text-[10px] font-bold rounded-full flex items-center justify-center px-1',
            tab.key === modelValue
              ? variant === 'pills' ? 'bg-white/25 text-white' : 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border-main)]',
          ]">
          {{ tab.badge }}
        </span>
      </button>
    </div>

    <!-- Tab panels -->
    <div class="flex-1">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        role="tabpanel"
        :id="`tabpanel-${tab.key}`"
        :aria-labelledby="tab.key"
        :hidden="tab.key !== modelValue">
        <Transition name="tab-slide" mode="out-in">
          <div v-if="tab.key === modelValue" :key="tab.key">
            <slot :name="tab.key" />
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
