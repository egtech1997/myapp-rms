/**
 * soundManager.js — Howler.js-powered UI Sound System
 * RSP Portal · DepEd SDO Guihulngan City
 *
 * Uses Howler.js (howlerjs.com) with locally generated WAV files.
 * Files live in /public/sounds/ and are served as static assets.
 *
 * Usage from any Vue component:
 *   import { useSound } from '@/composables/useSound'
 *   const { play } = useSound()
 *   play('click')        // button click
 *   play('success')      // form success
 *   play('error')        // validation error
 *   play('notification') // incoming notification
 *   play('modal-open')   // modal opens
 *   play('modal-close')  // modal closes
 *   play('toggle')       // switch / checkbox
 *   play('transition')   // page navigation
 *   play('upload')       // file upload complete
 */

import { Howl, Howler } from 'howler'

const STORAGE_KEY_MUTED  = 'rsp-sound-muted'
const STORAGE_KEY_VOLUME = 'rsp-sound-volume'

// Minimum ms between plays of the same sound (spam guard)
const COOLDOWN_MS = 80

// ── Sound definitions ──────────────────────────────────────────────────────
// Volume per sound: lower = more subtle. All are already quiet WAV files.
const SOUND_DEFS = {
  'click':       { src: '/sounds/click.mp3',       volume: 0.55 },
  'toggle':      { src: '/sounds/toggle.mp3',       volume: 0.50 },
  'success':     { src: '/sounds/success.mp3',      volume: 0.60 },
  'error':       { src: '/sounds/error.mp3',        volume: 0.55 },
  'notification':{ src: '/sounds/notification.mp3', volume: 0.55 },
  'modal-open':  { src: '/sounds/modal-open.mp3',   volume: 0.45 },
  'modal-close': { src: '/sounds/modal-close.mp3',  volume: 0.40 },
  'transition':  { src: '/sounds/transition.mp3',   volume: 0.22 },
  'upload':      { src: '/sounds/upload.mp3',       volume: 0.60 },
}

class SoundManager {
  constructor() {
    /** @type {Map<string, Howl>} created lazily on first play */
    this._howls = new Map()

    /** @type {Map<string, number>} last played timestamp per sound */
    this._lastPlayed = new Map()

    /** @type {boolean} */
    this._muted = false

    /** @type {number} 0.0 – 1.0 */
    this._volume = 0.8

    /** @type {boolean} */
    this._initialized = false
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Call once after app.mount() — only restores persisted settings.
   * Howl instances are created lazily on first user gesture to satisfy
   * the Chrome AudioContext autoplay policy.
   */
  init() {
    if (this._initialized) return
    this._initialized = true
    this._loadSettings()
    // Do NOT call Howler.volume() or new Howl() here —
    // that would create an AudioContext before a user gesture.
  }

  /**
   * Play a named sound. The Howl instance is created on first call
   * (which is always triggered by a user gesture — click, keydown, etc.)
   * so the AudioContext is guaranteed to start in a valid state.
   * @param {string} name
   */
  play(name) {
    if (!this._initialized || this._muted) return
    if (!this._canPlay(name)) return

    try {
      const howl = this._getOrCreate(name)
      if (!howl) return
      this._lastPlayed.set(name, Date.now())
      howl.play()
    } catch (e) {
      console.warn('[SoundManager] play error:', e)
    }
  }

  mute() {
    this._muted = true
    // Only touch Howler if it has been used (AudioContext already exists)
    if (this._howls.size > 0) Howler.mute(true)
    this._persist()
  }

  unmute() {
    this._muted = false
    if (this._howls.size > 0) Howler.mute(false)
    this._persist()
  }

  toggleMute() {
    this._muted ? this.unmute() : this.mute()
  }

  /** @param {number} v — 0.0 to 1.0 */
  setVolume(v) {
    this._volume = Math.min(1, Math.max(0, v))
    if (this._howls.size > 0) Howler.volume(this._volume)
    this._persist()
  }

  get isMuted()  { return this._muted }
  get volume()   { return this._volume }

  // ── Internals ─────────────────────────────────────────────────────────────

  /**
   * Return the cached Howl for `name`, creating it on first access.
   * Creation happens inside a user-gesture call stack so AudioContext
   * is allowed to start without restriction.
   */
  _getOrCreate(name) {
    if (this._howls.has(name)) return this._howls.get(name)

    const def = SOUND_DEFS[name]
    if (!def) {
      console.warn('[SoundManager] Unknown sound:', name)
      return null
    }

    // First Howl creation — also sync global volume now that
    // AudioContext is about to be created legitimately.
    const isFirst = this._howls.size === 0
    const howl = new Howl({
      src:      [def.src],
      volume:   def.volume,
      preload:  true,
      html5:    false,
      onloaderror: (id, err) => {
        console.warn(`[SoundManager] Failed to load "${name}":`, err)
      },
    })
    this._howls.set(name, howl)

    if (isFirst) {
      Howler.volume(this._volume)
      if (this._muted) Howler.mute(true)
    }

    return howl
  }

  _canPlay(name) {
    const last = this._lastPlayed.get(name) ?? 0
    return (Date.now() - last) >= COOLDOWN_MS
  }

  _loadSettings() {
    try {
      const muted  = localStorage.getItem(STORAGE_KEY_MUTED)
      const volume = localStorage.getItem(STORAGE_KEY_VOLUME)
      if (muted  !== null) this._muted  = muted === 'true'
      if (volume !== null) this._volume = Math.min(1, Math.max(0, parseFloat(volume)))
    } catch (_) {}
  }

  _persist() {
    try {
      localStorage.setItem(STORAGE_KEY_MUTED,  String(this._muted))
      localStorage.setItem(STORAGE_KEY_VOLUME, String(this._volume))
    } catch (_) {}
  }
}

// Singleton
const soundManager = new SoundManager()
export default soundManager
