<script setup>
const props = defineProps({
    title:      String,
    value:      [String, Number],
    icon:       String,
    iconColor:  { type: String, default: 'primary' }, // primary|blue|green|purple|amber|red|slate|gold|cyan|emerald
    trend:      Number,
    trendLabel: String,
    description: String,
    prefix:     String,
    suffix:     String,
    loading:    Boolean,
    to:         String,
})

const ICON_COLORS = {
    primary:'bg-[var(--color-primary-light)] text-[var(--color-primary)]   border-[var(--color-primary-ring)]',
    blue:   'bg-[var(--color-primary-light)] text-[var(--color-primary)]   border-[var(--color-primary-ring)]',
    green:  'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber:  'bg-amber-50  text-amber-600 border-amber-100',
    red:    'bg-red-50    text-red-600   border-red-100',
    slate:  'bg-[var(--bg-app)] text-[var(--text-muted)] border-[var(--border-main)]',
    gold:   'bg-[var(--color-gold-light)] text-[var(--color-gold)]         border-[var(--color-gold-ring)]',
    cyan:   'bg-cyan-50 text-cyan-600 border-cyan-100',
    emerald:'bg-green-50 text-green-600 border-green-100',
}
</script>

<template>
    <component
        :is="to ? 'router-link' : 'div'"
        :to="to"
        :class="[
            'card-raised p-5 h-full flex flex-col justify-between',
            to ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:duration-100' : '',
        ]">

        <!-- Skeleton loader -->
        <div v-if="loading" class="flex flex-col gap-4">
            <div class="flex items-start justify-between">
                <div class="flex flex-col gap-2 flex-1">
                    <div class="h-3 w-20 bg-[var(--bg-app)] rounded-[var(--radius-sm)] animate-pulse"></div>
                    <div class="h-7 w-14 bg-[var(--bg-app)] rounded-[var(--radius-md)] animate-pulse"></div>
                    <div class="h-3 w-28 bg-[var(--bg-app)] rounded-[var(--radius-sm)] animate-pulse"></div>
                </div>
                <div class="w-10 h-10 rounded-[var(--radius-xl)] bg-[var(--bg-app)] animate-pulse flex-shrink-0"></div>
            </div>
        </div>

        <!-- Content -->
        <div v-else class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
                <!-- Label -->
                <p class="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5 select-none opacity-90">
                    {{ title }}
                </p>

                <!-- Value -->
                <p class="text-3xl font-extrabold text-[var(--text-main)] leading-none tabular-nums tracking-tight">
                    <span v-if="prefix" class="text-lg font-semibold text-[var(--text-muted)] align-top mr-0.5">{{ prefix }}</span>
                    {{ value }}
                    <span v-if="suffix" class="text-lg font-semibold text-[var(--text-muted)] align-top ml-0.5">{{ suffix }}</span>
                </p>

                <!-- Trend / Description -->
                <div class="flex items-center gap-2 mt-3 min-h-[1.25rem]">
                    <template v-if="trend !== undefined">
                        <span :class="[
                            'inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full',
                            trend > 0  ? 'bg-green-50 text-green-700' :
                            trend < 0  ? 'bg-red-50 text-red-700'   : 'bg-slate-100 text-slate-600',
                        ]">
                            <i :class="['pi text-[9px]',
                                trend > 0 ? 'pi-arrow-up-right' :
                                trend < 0 ? 'pi-arrow-down-right' : 'pi-minus'
                            ]"></i>
                            {{ Math.abs(trend) }}%
                        </span>
                        <span v-if="trendLabel" class="text-[11px] font-medium text-[var(--text-muted)]">{{ trendLabel }}</span>
                    </template>
                    <span v-else-if="description" class="text-[11px] font-medium text-[var(--text-muted)]">{{ description }}</span>
                </div>
            </div>

            <!-- Icon -->
            <div
                v-if="icon"
                :class="[
                    'w-10 h-10 rounded-[var(--radius-xl)] border flex items-center justify-center flex-shrink-0 shadow-sm transition-colors',
                    ICON_COLORS[iconColor] ?? ICON_COLORS.blue,
                ]">
                <i :class="['pi text-base', `pi-${icon}`]"></i>
            </div>
        </div>
    </component>
</template>
