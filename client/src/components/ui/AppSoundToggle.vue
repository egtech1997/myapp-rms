<template>
  <button
    type="button"
    :title="isMuted ? 'Sound effects (muted)' : 'Sound effects (on)'"
    :aria-label="isMuted ? 'Unmute sound effects' : 'Mute sound effects'"
    :aria-pressed="!isMuted"
    data-ab
    class="sound-toggle"
    :class="{ 'sound-toggle--muted': isMuted }"
    @click="handleToggle"
  >
    <i :class="isMuted ? 'pi pi-volume-off' : 'pi pi-volume-up'" />
  </button>
</template>

<script setup>
import { useSound } from '@/composables/useSound'

const { isMuted, toggleMute, play } = useSound()

function handleToggle() {
  // Play a click before toggling so the user hears the confirmation
  // when unmuting, or hears nothing (already muted) when muting.
  if (isMuted.value) {
    // Unmuting first so the click is audible
    toggleMute()
    play('click')
  } else {
    play('click')
    toggleMute()
  }
}
</script>

<style scoped>
.sound-toggle {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 0.875rem;
  transition: color 0.15s ease, background-color 0.15s ease;
  flex-shrink: 0;
}

.sound-toggle:hover {
  color: var(--text-main);
  background-color: var(--color-primary-light);
}

.sound-toggle:focus-visible {
  outline: 2px solid var(--color-primary-ring);
  outline-offset: 2px;
}

/* Slightly dimmed icon when muted */
.sound-toggle--muted {
  color: var(--text-faint);
}

.sound-toggle--muted:hover {
  color: var(--text-sub);
}
</style>
