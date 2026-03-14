<script setup>
import { ref, onMounted, computed, watchEffect, watch } from 'vue'
import { useRoute }         from 'vue-router'
import { useAuthStore }    from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import AppToaster from '@/components/ui/AppToaster.vue'

const authStore     = useAuthStore()
const settingsStore = useSettingsStore()
const route         = useRoute()

// ── Dynamic page title ─────────────────────────────────────────
watchEffect(() => {
  const appName  = settingsStore.systemName || 'RSP Portal'
  document.title = route.name || appName
})

// ── Dynamic favicon from settings logo ────────────────────────
watch(
  () => settingsStore.resolvedLogoUrl,
  (url) => {
    if (!url) return
    let link = document.querySelector('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = url
  },
  { immediate: true },
)

const appReady         = ref(false)
const progress         = ref(0)
const loadingTextIndex = ref(0)
const showCurtain      = ref(true)

const loadingTexts = [
  'Upholding DepEd Excellence...',
  'Synchronizing Merit Records...',
  'Calibrating Recruitment Engine...',
  'Advancing Transparency & Integrity...',
  'Transforming Education Through Meritocracy...',
  'For every learner, We Rise.',
]

onMounted(async () => {
  const startTime = Date.now()

  const progressInterval = setInterval(() => {
    if (progress.value < 90) progress.value += Math.random() * 15
  }, 200)

  const textInterval = setInterval(() => {
    loadingTextIndex.value = (loadingTextIndex.value + 1) % loadingTexts.length
  }, 900)

  try {
    await Promise.all([
      settingsStore.init(),
      !authStore.initialized ? authStore.fetchCurrentUser() : Promise.resolve(),
    ])

    const elapsed  = Date.now() - startTime
    const waitTime = Math.max(0, 3500 - elapsed)

    setTimeout(() => {
      progress.value = 100
      clearInterval(progressInterval)
      clearInterval(textInterval)

      setTimeout(() => {
        appReady.value = true
        setTimeout(() => { showCurtain.value = false }, 1000)
      }, 500)
    }, waitTime)

  } catch (err) {
    console.error('Initialization failed:', err)
    appReady.value  = true
    showCurtain.value = false
  }
})

const currentText = computed(() => loadingTexts[loadingTextIndex.value])
const pct         = computed(() => Math.min(Math.floor(progress.value), 100))
</script>

<template>
  <div class="app-container">

    <!-- ── LOADING SCREEN ─────────────────────────────────────── -->
    <Transition name="app-reveal">
      <div
        v-if="!appReady"
        class="welcome-screen fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
        :style="{ background: 'radial-gradient(ellipse at 50% 40%, #ffffff 0%, #f1f5f9 100%)' }"
      >

        <!-- Animated blobs -->
        <div class="absolute inset-0 opacity-40 pointer-events-none">
          <div class="blob blob-1"></div>
          <div class="blob blob-2"></div>
        </div>

        <!-- Central branding -->
        <div class="relative flex flex-col items-center gap-10">

          <!-- Logo -->
          <div class="logo-wrapper relative">
            <div class="logo-pulse absolute inset-0 rounded-full bg-blue-500/10 scale-150"></div>
            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-white shadow-2xl shadow-blue-500/20 border border-slate-100 p-1 flex items-center justify-center overflow-hidden animate-float">
              <img
                v-if="settingsStore.resolvedLogoUrl"
                :src="settingsStore.resolvedLogoUrl"
                alt="Guih-Ranking Logo"
                class="w-full h-full object-contain"
              />
              <div v-else class="w-full h-full bg-[var(--color-primary)] flex items-center justify-center">
                <i class="pi pi-shield text-white text-3xl"></i>
              </div>
            </div>
          </div>

          <!-- Text + progress -->
          <div class="flex flex-col items-center text-center max-w-xs gap-7">

            <!-- System name + cycling text -->
            <div class="space-y-2">
              <h1 class="text-xl font-black text-slate-900 uppercase tracking-[0.2em]">
                {{ settingsStore.systemName || 'Guih-Ranking' }}
              </h1>
              <div class="h-6 overflow-hidden relative w-72">
                <Transition name="text-slide" mode="out-in">
                  <p
                    :key="currentText"
                    class="text-[10px] font-black uppercase tracking-[0.28em] absolute inset-0 flex items-center justify-center"
                    :class="currentText === 'For every learner, We Rise.' ? 'text-[var(--color-primary)]' : 'text-blue-500'"
                  >
                    {{ currentText }}
                  </p>
                </Transition>
              </div>
            </div>

            <!-- ── IMPROVED PROGRESS BAR ── -->
            <div class="w-64 sm:w-72 flex flex-col gap-2">

              <!-- Track -->
              <div class="progress-track-wrap relative h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <!-- Fill -->
                <div
                  class="progress-fill absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                  :style="{ width: `${pct}%` }"
                ></div>
                <!-- Shine sweep -->
                <div class="progress-shine-sweep absolute inset-0"></div>
                <!-- Leading glow dot -->
                <div
                  class="progress-dot absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full transition-all duration-700 ease-out"
                  :style="{ left: `calc(${pct}% - 7px)` }"
                ></div>
              </div>

              <!-- Labels row -->
              <div class="flex items-center justify-between px-0.5">
                <span class="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">Loading</span>
                <span class="text-[10px] font-black tabular-nums text-[var(--color-primary)]">{{ pct }}%</span>
              </div>

            </div>
          </div>
        </div>

        <!-- Footer motto -->
        <div class="absolute bottom-12 flex flex-col items-center gap-3 opacity-55">
          <div class="w-px h-8 bg-gradient-to-b from-transparent to-slate-400"></div>
          <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.45em]">
            For every learner, We Rise.
          </p>
        </div>

      </div>
    </Transition>

    <!-- ── Curtain ──────────────────────────────────────────── -->
    <template v-if="showCurtain">
      <div v-if="appReady" class="fixed inset-0 z-[9998] bg-white"></div>
    </template>

    <!-- ── Main application ─────────────────────────────────── -->
    <div :class="['main-wrapper', { 'is-ready': appReady }]">
      <router-view />
      <AppToaster position="bottom-right" />
    </div>

  </div>
</template>

<style>
/* ── FLOAT ───────────────────────────────────────────────────── */
@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50%       { transform: translateY(-10px) scale(1.02); }
}
.animate-float { animation: float 4s ease-in-out infinite; }

/* ── BLOBS ───────────────────────────────────────────────────── */
@keyframes blob {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(30px, -50px) scale(1.1); }
  66%       { transform: translate(-20px, 20px) scale(0.9); }
}
.blob {
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.10) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(80px);
}
.blob-1 { top: -10%;    left: -10%;  animation: blob 15s infinite; }
.blob-2 { bottom: -10%; right: -10%; animation: blob 20s infinite reverse; }

/* ── PROGRESS BAR ────────────────────────────────────────────── */
.progress-fill {
  background: linear-gradient(
    90deg,
    #4A4D8F 0%,
    #5B84BA 45%,
    #4A4D8F 100%
  );
  background-size: 200% auto;
  animation: fill-shift 2.5s linear infinite;
  box-shadow: 0 0 10px rgba(74, 77, 143, 0.35);
}
@keyframes fill-shift {
  0%   { background-position: 0%   center; }
  100% { background-position: 200% center; }
}

.progress-shine-sweep {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.55) 50%,
    transparent 100%
  );
  animation: sweep 1.8s ease-in-out infinite;
  transform: translateX(-100%);
}
@keyframes sweep {
  100% { transform: translateX(100%); }
}

.progress-dot {
  background: white;
  box-shadow:
    0 0 0 2px #5B84BA,
    0 0 12px rgba(74, 77, 143, 0.6),
    0 0 24px rgba(74, 77, 143, 0.3);
  transition: left 0.7s ease-out;
}

/* ── TRANSITIONS ─────────────────────────────────────────────── */
.app-reveal-leave-active {
  transition: all 1s cubic-bezier(0.7, 0, 0.3, 1);
}
.app-reveal-leave-to {
  opacity: 0;
  transform: scale(1.08);
}

.text-slide-enter-active,
.text-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.text-slide-enter-from { transform: translateY(10px);  opacity: 0; }
.text-slide-leave-to   { transform: translateY(-10px); opacity: 0; }

/* ── MAIN WRAPPER ────────────────────────────────────────────── */
.main-wrapper {
  opacity: 0;
  transform: scale(0.96);
  transition: all 1s cubic-bezier(0.2, 0.8, 0.2, 1);
  min-height: 100vh;
}
.main-wrapper.is-ready {
  opacity: 1;
  transform: scale(1);
}

.welcome-screen {
  user-select: none;
  pointer-events: none;
}
</style>
