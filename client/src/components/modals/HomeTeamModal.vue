<script setup>
defineOptions({ name: 'HomeTeamModal' })

defineProps({
  visible: { type: Boolean, default: false },
  member:  { type: Object,  default: null },
})

defineEmits(['update:visible'])
</script>

<template>
  <Teleport to="body">
    <Transition name="team-fade">
      <div
        v-if="visible && member"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style="background: rgba(2, 6, 23, 0.75); backdrop-filter: blur(6px);"
        @click.self="$emit('update:visible', false)"
      >
        <!-- Panel -->
        <div
          class="relative w-full max-w-sm bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 animate-zoom-in"
          @click.stop
        >
          <!-- Header / Avatar area -->
          <div class="relative h-36 bg-gradient-to-br from-slate-800 to-slate-900 flex items-end justify-center">
            <!-- Close button -->
            <button
              @click="$emit('update:visible', false)"
              class="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-all z-20"
            >
              <i class="pi pi-times text-sm"></i>
            </button>

            <!-- Avatar (overlapping) -->
            <div class="relative translate-y-1/2 z-10 group">
              <div class="absolute inset-0 bg-violet-500 blur-2xl opacity-25 group-hover:opacity-50 transition-opacity duration-500 rounded-full"></div>
              <img
                v-if="member.image"
                :src="member.image"
                class="relative w-28 h-28 rounded-full object-cover shadow-2xl border-4 border-slate-900 transition-transform duration-500 group-hover:scale-105"
                alt="Team Member"
              />
              <div v-else
                class="relative w-28 h-28 rounded-full bg-slate-700 border-4 border-slate-900 flex items-center justify-center shadow-2xl">
                <i class="pi pi-user text-slate-400 text-3xl"></i>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="pt-20 pb-8 px-8 text-center">
            <h2 class="text-xl font-black text-white tracking-tight">{{ member.name }}</h2>
            <div class="mt-2 mb-5">
              <span class="text-[9px] font-black uppercase tracking-[0.22em] text-teal-300 bg-teal-900/30 px-4 py-1.5 rounded-full border border-teal-800/40">
                {{ member.role }}
              </span>
            </div>

            <p class="text-slate-300 text-sm leading-relaxed font-medium mb-7">
              {{ member.bio }}
            </p>

            <a
              v-if="member.email"
              :href="`mailto:${member.email}`"
              class="inline-flex items-center justify-center gap-2.5 py-2.5 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-violet-900/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              <i class="pi pi-envelope text-violet-200 text-xs"></i>
              {{ member.email }}
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.team-fade-enter-active,
.team-fade-leave-active {
  transition: opacity 0.25s ease;
}
.team-fade-enter-from,
.team-fade-leave-to {
  opacity: 0;
}
</style>
