/**
 * useSound.js — Vue 3 composable for the RSP Portal Sound System
 *
 * Wraps soundManager as reactive Vue state.
 * SSR-safe: all audio calls are guarded by window/AudioContext checks inside soundManager.
 *
 * Usage:
 *   import { useSound } from '@/composables/useSound'
 *   const { play, isMuted, volume, toggleMute, setVolume } = useSound()
 *
 *   play('click')        // on button click
 *   play('success')      // on form submit success
 *   play('error')        // on validation error
 *   play('notification') // on incoming notification
 *   play('modal-open')   // when a modal opens
 *   play('modal-close')  // when a modal closes
 *   play('toggle')       // on switch/checkbox toggle
 *   play('transition')   // on page/route transition
 *   play('upload')       // on file upload complete
 */

import { ref, computed } from 'vue'
import soundManager from '@/services/soundManager'

// Shared reactive state — a single reactive layer over the singleton
// so all composable instances stay in sync.
const _isMuted  = ref(soundManager.isMuted)
const _volume   = ref(soundManager.volume)

export function useSound() {
  /**
   * Play a named sound effect.
   * @param {string} name
   */
  function play(name) {
    soundManager.play(name)
  }

  /**
   * Toggle mute state on/off.
   */
  function toggleMute() {
    soundManager.toggleMute()
    _isMuted.value = soundManager.isMuted
  }

  /**
   * Explicitly mute all sounds.
   */
  function mute() {
    soundManager.mute()
    _isMuted.value = true
  }

  /**
   * Explicitly unmute all sounds.
   */
  function unmute() {
    soundManager.unmute()
    _isMuted.value = false
  }

  /**
   * Set the global volume level.
   * @param {number} v - 0.0 (silent) to 1.0 (full)
   */
  function setVolume(v) {
    soundManager.setVolume(v)
    _volume.value = soundManager.volume
  }

  return {
    /** Call play('soundName') to trigger a sound effect. */
    play,

    /** Reactive boolean — true when sounds are muted. */
    isMuted: computed(() => _isMuted.value),

    /** Reactive number — current volume 0.0–1.0. */
    volume: _volume,

    toggleMute,
    mute,
    unmute,
    setVolume,
  }
}
