<script setup>
import { computed, ref } from 'vue';
import AppModal from './AppModal.vue';
import { resolveUrl } from '@/utils/url';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  url: { type: String, default: '' },
  title: { type: String, default: 'Document Preview' }
});

const emit = defineEmits(['update:modelValue']);

const isImage = computed(() => {
  if (!props.url) return false;
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(props.url);
});

const isPdf = computed(() => {
  if (!props.url) return false;
  return /\.pdf(\?.*)?$/i.test(props.url);
});

// File Viewer State
const isFullScreen = ref(false);
const toggleFullScreen = () => {
  isFullScreen.value = !isFullScreen.value;
};

const fullUrl = computed(() => resolveUrl(props.url));

const close = () => {
  isFullScreen.value = false;
  emit('update:modelValue', false);
};
</script>

<template>
  <AppModal
    :modelValue="modelValue"
    @update:modelValue="val => emit('update:modelValue', val)"
    :title="title"
    :size="isFullScreen ? 'fixed' : '2xl'"
    :bodyClass="['!p-0 overflow-hidden transition-all duration-300', isFullScreen ? 'h-screen' : '']"
  >
    <div :class="['flex flex-col bg-slate-900 overflow-hidden transition-all duration-300', isFullScreen ? 'h-screen' : 'h-[70vh] sm:h-[80vh]']">
      <!-- Toolbar -->
      <div class="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/10 shrink-0">
        <div class="flex items-center gap-2">
          <i :class="['pi text-white/60', isPdf ? 'pi-file-pdf' : 'pi-image']"></i>
          <span class="text-[10px] font-bold text-white/80 uppercase tracking-widest truncate max-w-[200px]">
            {{ url.split('/').pop() }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button @click="toggleFullScreen" 
             class="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all"
             title="Toggle Fullscreen">
            <i :class="['pi text-xs', isFullScreen ? 'pi-window-minimize' : 'pi-window-maximize']"></i>
          </button>
          <div class="w-px h-4 bg-white/10 mx-1"></div>
          <a :href="fullUrl" target="_blank" download
             class="h-8 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
            <i class="pi pi-download"></i>
            Download
          </a>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 relative overflow-auto flex items-center justify-center p-4">
        <template v-if="url">
          <img v-if="isImage" :src="fullUrl" class="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in duration-300" />
          <iframe v-else-if="isPdf" :src="fullUrl" class="w-full h-full border-none bg-white rounded-lg shadow-2xl"></iframe>
          <div v-else class="flex flex-col items-center justify-center text-white/40 gap-4 text-center p-12">
            <i class="pi pi-info-circle text-4xl"></i>
            <p class="text-xs font-bold uppercase tracking-widest leading-relaxed">
              Preview not supported for this file type.<br/>You can download it to view.
            </p>
            <a :href="fullUrl" target="_blank" class="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Open in New Tab
            </a>
          </div>
        </template>
        <div v-else class="flex flex-col items-center justify-center text-white/20 gap-3">
          <i class="pi pi-spin pi-spinner text-2xl"></i>
          <p class="text-[10px] font-bold uppercase tracking-widest">Loading document...</p>
        </div>
      </div>
    </div>
  </AppModal>
</template>

<style scoped>
/* Ensure iframe takes full space */
iframe {
  min-height: 100%;
}
</style>
