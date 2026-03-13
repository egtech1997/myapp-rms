<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore }    from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import AppToaster from '@/components/ui/AppToaster.vue'

const authStore     = useAuthStore()
const settingsStore = useSettingsStore()

// ── LOADING STATE ──────────────────────────────────────────────
const appReady = ref(false)
const progress = ref(0)
const loadingTextIndex = ref(0)
const showCurtain = ref(true)

const loadingTexts = [
  "Upholding DepEd Excellence...",
  "Synchronizing Merit Records...",
  "Calibrating Recruitment Engine...",
  "Advancing Transparency & Integrity...",
  "Transforming Education Through Meritocracy...",
  "Para sa Bata, Para sa Bayan."
]

// ── INITIALIZATION ─────────────────────────────────────────────
onMounted(async () => {
  const startTime = Date.now()
  
  // Start progress bar simulation
  const progressInterval = setInterval(() => {
    if (progress.value < 90) progress.value += Math.random() * 15
  }, 200)

  // Cycle mission statements
  const textInterval = setInterval(() => {
    loadingTextIndex.value = (loadingTextIndex.value + 1) % loadingTexts.length
  }, 900)

  try {
    // Parallelize init calls for better performance
    await Promise.all([
      settingsStore.init(),
      !authStore.initialized ? authStore.fetchCurrentUser() : Promise.resolve()
    ])
    
    // Ensure "heavy" feel: Minimum 3.5 seconds or until ready
    const elapsed = Date.now() - startTime
    const waitTime = Math.max(0, 3500 - elapsed)
    
    setTimeout(() => {
      progress.value = 100
      clearInterval(progressInterval)
      clearInterval(textInterval)
      
      // Trigger final transition
      setTimeout(() => {
        appReady.value = true
        // Delay curtain removal for zoom-out animation
        setTimeout(() => showCurtain.value = false, 1000)
      }, 500)
    }, waitTime)

  } catch (err) {
    console.error("Initialization failed:", err)
    // Fallback to allow app to load even on minor errors
    appReady.value = true
    showCurtain.value = false
  }
})

const currentText = computed(() => loadingTexts[loadingTextIndex.value])
</script>

<template>
  <div class="app-container">
    
    <!-- ── PREMIUM LOADING SCREEN ────────────────────────────── -->
    <Transition name="app-reveal">
      <div v-if="!appReady" 
        class="welcome-screen fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
        :style="{ background: 'radial-gradient(circle at center, #ffffff 0%, #f1f5f9 100%)' }">
        
        <!-- Animated Background Elements -->
        <div class="absolute inset-0 opacity-40 pointer-events-none">
          <div class="blob blob-1"></div>
          <div class="blob blob-2"></div>
        </div>

        <!-- Central Branding -->
        <div class="relative flex flex-col items-center gap-10">
          <!-- Logo Pulse/Zoom -->
          <div class="logo-wrapper relative">
            <div class="logo-pulse absolute inset-0 rounded-full bg-blue-500/10 scale-150"></div>
            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-white shadow-2xl shadow-blue-500/20 border border-slate-100 p-1 flex items-center justify-center overflow-hidden animate-float">
              <img v-if="settingsStore.resolvedLogoUrl" 
                :src="settingsStore.resolvedLogoUrl" 
                alt="Guih-Ranking Logo" 
                class="w-full h-full object-contain" />
              <div v-else class="w-full h-full bg-blue-600 flex items-center justify-center">
                 <i class="pi pi-shield text-white text-3xl"></i>
              </div>
            </div>
          </div>

          <!-- Mission Text & Progress -->
          <div class="flex flex-col items-center text-center max-w-xs gap-6">
            <div class="space-y-2">
              <h1 class="text-xl font-black text-slate-900 tracking-tight uppercase tracking-[0.2em]">
                {{ settingsStore.systemName || 'Guih-Ranking' }}
              </h1>
              <div class="h-6 overflow-hidden relative w-64">
                <Transition name="text-slide" mode="out-in">
                  <p :key="currentText" class="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] absolute inset-0">
                    {{ currentText }}
                  </p>
                </Transition>
              </div>
            </div>

            <!-- Heavy Progress Bar -->
            <div class="w-48 h-1 bg-slate-200 rounded-full overflow-hidden relative">
              <div class="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-700 ease-out"
                :style="{ width: `${progress}%` }"></div>
              <!-- Secondary Shine -->
              <div class="progress-shine"></div>
            </div>
          </div>
        </div>

        <!-- Footer Motto -->
        <div class="absolute bottom-12 flex flex-col items-center gap-3 opacity-60">
          <div class="w-px h-8 bg-gradient-to-b from-transparent to-slate-400"></div>
          <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">
            Para sa Bata, Para sa Bayan
          </p>
        </div>
      </div>
    </Transition>

    <!-- ── MAIN APPLICATION ────────────────────────────────── -->
    <template v-if="showCurtain">
      <!-- Empty space or curtain overlay to prevent FOUC during reveal -->
      <div class="fixed inset-0 z-[9998] bg-white" v-if="appReady"></div>
    </template>

    <div :class="['main-wrapper', { 'is-ready': appReady }]">
      <router-view />
      <!-- Global toast notifications -->
      <AppToaster position="bottom-right" />
    </div>

  </div>
</template>

<style>
/* ── KEYFRAME ANIMATIONS ─────────────────────────────────────── */

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.02); }
}

@keyframes blob {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

.animate-float { animation: float 4s ease-in-out infinite; }

.blob {
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(80px);
  z-index: -1;
}

.blob-1 { top: -10%; left: -10%; animation: blob 15s infinite; }
.blob-2 { bottom: -10%; right: -10%; animation: blob 20s infinite reverse; }

.progress-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shine 1.5s infinite;
  transform: translateX(-100%);
}

@keyframes shine {
  100% { transform: translateX(100%); }
}

/* ── TRANSITIONS ───────────────────────────────────────────── */

/* App Reveal: Zoom out and fade */
.app-reveal-leave-active {
  transition: all 1s cubic-bezier(0.7, 0, 0.3, 1);
}
.app-reveal-leave-to {
  opacity: 0;
  transform: scale(1.1);
}

/* Text Slide Crossfade */
.text-slide-enter-active, .text-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.text-slide-enter-from { transform: translateY(10px); opacity: 0; }
.text-slide-leave-to { transform: translateY(-10px); opacity: 0; }

/* Main Wrapper Reveal Animation */
.main-wrapper {
  opacity: 0;
  transform: scale(0.95);
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
