<script setup>
const props = defineProps({
    icon:          { type: String, default: 'inbox' },
    title:         { type: String, default: 'Nothing here yet' },
    description:   String,
    actionLabel:   String,
    actionIcon:    String,
    actionVariant: { type: String, default: 'primary' }, // primary|secondary
    compact:       Boolean,
})

const emit = defineEmits(['action'])
</script>

<template>
    <div :class="['flex flex-col items-center justify-center text-center', compact ? 'py-10 gap-3' : 'py-16 gap-5']">
        <!-- Icon box -->
        <div class="w-14 h-14 rounded-[var(--radius-2xl)] bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center">
            <i :class="['pi', `pi-${icon}`, 'text-xl text-[var(--text-muted)]']"></i>
        </div>

        <!-- Text -->
        <div class="max-w-xs">
            <p class="text-sm font-bold text-[var(--text-main)]">{{ title }}</p>
            <p v-if="description" class="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">{{ description }}</p>
        </div>

        <!-- CTA -->
        <slot name="action">
            <button
                v-if="actionLabel"
                @click="emit('action')"
                :class="[
                    'inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-md)] text-sm font-semibold transition-all duration-150 active:scale-[0.97]',
                    actionVariant === 'primary'
                        ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-sm shadow-blue-900/15'
                        : 'bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border-main)] hover:bg-[var(--bg-app)]',
                ]">
                <i v-if="actionIcon" :class="['pi', `pi-${actionIcon}`, 'text-xs']"></i>
                {{ actionLabel }}
            </button>
        </slot>
    </div>
</template>
