<script setup>
defineOptions({ name: 'AppSkeleton' })

const props = defineProps({
  type:    { type: String, default: 'line',
    validator: (v) => ['line', 'circle', 'rect', 'paragraph', 'table', 'card'].includes(v) },
  width:   { type: String, default: '100%' },
  height:  { type: String, default: '14px' },
  size:    { type: String, default: '' },      // shorthand for circle diameter
  lines:   { type: Number, default: 3 },       // for paragraph
  rows:    { type: Number, default: 4 },       // for table
  cols:    { type: Number, default: 3 },       // for table
  rounded: { type: String, default: 'rounded-md' },
})

const BASE = 'animate-shimmer'
</script>

<template>
  <!-- Line / rect -->
  <div
    v-if="type === 'line' || type === 'rect'"
    :class="[BASE, props.rounded]"
    :style="{ width: props.width, height: props.height }"
    aria-hidden="true">
  </div>

  <!-- Circle -->
  <div
    v-else-if="type === 'circle'"
    :class="[BASE, 'rounded-full shrink-0']"
    :style="{
      width:  props.size || props.width,
      height: props.size || props.width,
    }"
    aria-hidden="true">
  </div>

  <!-- Paragraph (multiple lines) -->
  <div v-else-if="type === 'paragraph'" class="flex flex-col gap-2.5" aria-hidden="true">
    <div
      v-for="i in lines"
      :key="i"
      :class="[BASE, 'rounded-md']"
      :style="{ width: i === lines ? '65%' : i % 2 === 0 ? '88%' : '100%', height: props.height }">
    </div>
  </div>

  <!-- Table rows -->
  <div v-else-if="type === 'table'" class="flex flex-col gap-2" aria-hidden="true">
    <div
      v-for="r in rows"
      :key="r"
      class="grid gap-3"
      :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }">
      <div
        v-for="c in cols"
        :key="c"
        :class="[BASE, 'h-8 rounded-lg']"
        :style="{ width: c === 1 ? '70%' : '100%' }">
      </div>
    </div>
  </div>

  <!-- Card skeleton -->
  <div v-else-if="type === 'card'"
    class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex flex-col gap-4"
    aria-hidden="true">
    <div class="flex items-center gap-3">
      <div :class="[BASE, 'w-10 h-10 rounded-xl shrink-0']"></div>
      <div class="flex flex-col gap-2 flex-1">
        <div :class="[BASE, 'h-4 rounded-md w-1/3']"></div>
        <div :class="[BASE, 'h-3 rounded-md w-1/2']"></div>
      </div>
    </div>
    <div class="flex flex-col gap-2">
      <div :class="[BASE, 'h-3 rounded-md w-full']"></div>
      <div :class="[BASE, 'h-3 rounded-md w-5/6']"></div>
      <div :class="[BASE, 'h-3 rounded-md w-3/4']"></div>
    </div>
    <div :class="[BASE, 'h-9 rounded-lg w-28']"></div>
  </div>
</template>
