/**
 * generate-sounds.js
 * Generates professional UI sound WAV files for the RSP Portal.
 * Run: node scripts/generate-sounds.js
 */

const fs   = require('fs')
const path = require('path')

const SAMPLE_RATE = 44100
const OUT_DIR     = path.join(__dirname, '..', 'public', 'sounds')

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

// ─── WAV writer ────────────────────────────────────────────────────────────

function writeWav(filename, samples) {
  const data       = new Float32Array(samples)
  const numSamples = data.length
  const buffer     = Buffer.alloc(44 + numSamples * 2)

  // RIFF header
  buffer.write('RIFF',              0);  buffer.writeUInt32LE(36 + numSamples * 2, 4)
  buffer.write('WAVE',              8)
  buffer.write('fmt ',             12);  buffer.writeUInt32LE(16,         16)
  buffer.writeUInt16LE(1,          20)  // PCM
  buffer.writeUInt16LE(1,          22)  // mono
  buffer.writeUInt32LE(SAMPLE_RATE,24)
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28)
  buffer.writeUInt16LE(2,          32)  // block align
  buffer.writeUInt16LE(16,         34)  // bits per sample
  buffer.write('data',             36);  buffer.writeUInt32LE(numSamples * 2, 40)

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, data[i]))
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2)
  }

  fs.writeFileSync(path.join(OUT_DIR, filename), buffer)
  console.log(`  ✓ ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`)
}

// ─── Envelope helpers ───────────────────────────────────────────────────────

/** Smooth attack-decay envelope (no click/pop) */
function envelope(t, duration, attack = 0.008, release = 0.12) {
  if (t < attack)                      return t / attack
  if (t > duration - release)          return Math.max(0, (duration - t) / release)
  return 1
}

/** Exponential decay envelope */
function expDecay(t, duration, decay = 6) {
  const a = t < 0.005 ? t / 0.005 : 1
  return a * Math.exp(-decay * t / duration)
}

// ─── Sound generators ───────────────────────────────────────────────────────

function sineWave(freq, t) { return Math.sin(2 * Math.PI * freq * t) }

function sweep(freqStart, freqEnd, t, duration) {
  const f = freqStart * Math.pow(freqEnd / freqStart, t / duration)
  return Math.sin(2 * Math.PI * f * t)
}

// ─── CLICK — soft sine tick, 800 Hz, 55ms ──────────────────────────────────

;(() => {
  const dur     = 0.055
  const samples = Math.ceil(SAMPLE_RATE * dur)
  const out     = []
  for (let i = 0; i < samples; i++) {
    const t   = i / SAMPLE_RATE
    const env = expDecay(t, dur, 8)
    out.push(sineWave(800, t) * env * 0.22)
  }
  writeWav('click.mp3', out)
})()

// ─── TOGGLE — higher tick, 1100 Hz, 40ms ───────────────────────────────────

;(() => {
  const dur     = 0.040
  const samples = Math.ceil(SAMPLE_RATE * dur)
  const out     = []
  for (let i = 0; i < samples; i++) {
    const t   = i / SAMPLE_RATE
    const env = expDecay(t, dur, 10)
    out.push(sineWave(1100, t) * env * 0.16)
  }
  writeWav('toggle.mp3', out)
})()

// ─── SUCCESS — two-note ascending chord, A4 then E5 ────────────────────────

;(() => {
  const dur     = 0.32
  const samples = Math.ceil(SAMPLE_RATE * dur)
  const out     = []
  for (let i = 0; i < samples; i++) {
    const t    = i / SAMPLE_RATE
    let   sig  = 0

    // Note 1: A4 = 440 Hz (0ms → 160ms)
    if (t < 0.16) {
      const env = expDecay(t, 0.16, 5)
      sig += sineWave(440, t) * env * 0.28
      // Gentle harmonic
      sig += sineWave(880, t) * env * 0.06
    }

    // Note 2: E5 = 659 Hz (100ms → 320ms)
    if (t >= 0.10) {
      const lt  = t - 0.10
      const env = expDecay(lt, 0.22, 5)
      sig += sineWave(659, t) * env * 0.28
      sig += sineWave(1318, t) * env * 0.05
    }

    out.push(sig * 0.55)
  }
  writeWav('success.mp3', out)
})()

// ─── ERROR — low double-buzz, 220 Hz + 180 Hz ──────────────────────────────

;(() => {
  const dur     = 0.28
  const samples = Math.ceil(SAMPLE_RATE * dur)
  const out     = []
  for (let i = 0; i < samples; i++) {
    const t    = i / SAMPLE_RATE
    // Two quick pulses
    const pulse1 = t < 0.10 ? expDecay(t,       0.10, 7) : 0
    const pulse2 = t >= 0.14 && t < 0.26 ? expDecay(t - 0.14, 0.12, 7) : 0
    const env    = pulse1 + pulse2 * 0.7
    const sig    = sineWave(220, t) * 0.6 + sineWave(180, t) * 0.4
    out.push(sig * env * 0.35)
  }
  writeWav('error.mp3', out)
})()

// ─── NOTIFICATION — warm bell ding, C5 (523 Hz) ────────────────────────────

;(() => {
  const dur     = 0.55
  const samples = Math.ceil(SAMPLE_RATE * dur)
  const out     = []
  for (let i = 0; i < samples; i++) {
    const t   = i / SAMPLE_RATE
    const env = expDecay(t, dur, 4)
    // Bell-like: fundamental + harmonics
    const sig =
      sineWave(523, t) * 1.0 +
      sineWave(1046, t) * 0.35 +     // octave
      sineWave(1568, t) * 0.15 +     // 5th
      sineWave(2093, t) * 0.08        // 2nd octave
    // Slight pitch-drop mimics a struck bell
    const pitchMod = sineWave(523 * (1 - t * 0.015), t)
    out.push((sig * 0.7 + pitchMod * 0.3) * env * 0.32)
  }
  writeWav('notification.mp3', out)
})()

// ─── MODAL-OPEN — warm sweep up, 280 Hz → 560 Hz, 200ms ───────────────────

;(() => {
  const dur     = 0.20
  const samples = Math.ceil(SAMPLE_RATE * dur)
  const out     = []
  for (let i = 0; i < samples; i++) {
    const t   = i / SAMPLE_RATE
    const env = envelope(t, dur, 0.015, 0.06)
    const sig = sweep(280, 560, t, dur)
    // Blend with octave for warmth
    const sig2 = sweep(560, 1120, t, dur)
    out.push((sig * 0.7 + sig2 * 0.15) * env * 0.24)
  }
  writeWav('modal-open.mp3', out)
})()

// ─── MODAL-CLOSE — gentle sweep down, 500 Hz → 280 Hz, 160ms ─────────────

;(() => {
  const dur     = 0.16
  const samples = Math.ceil(SAMPLE_RATE * dur)
  const out     = []
  for (let i = 0; i < samples; i++) {
    const t   = i / SAMPLE_RATE
    const env = envelope(t, dur, 0.010, 0.08)
    const sig = sweep(500, 280, t, dur)
    out.push(sig * env * 0.20)
  }
  writeWav('modal-close.mp3', out)
})()

// ─── TRANSITION — soft filtered whoosh, 180ms ──────────────────────────────

;(() => {
  const dur     = 0.18
  const samples = Math.ceil(SAMPLE_RATE * dur)
  const out     = []
  // Simple pseudo-noise with LP filter via moving average
  const raw = []
  for (let i = 0; i < samples; i++) {
    raw.push(Math.random() * 2 - 1)
  }
  const MA = 12
  for (let i = 0; i < samples; i++) {
    const t   = i / SAMPLE_RATE
    const env = envelope(t, dur, 0.02, 0.10)
    let   sum = 0
    for (let k = 0; k < MA; k++) sum += (raw[i - k] ?? 0)
    // Blend noise with a rising-then-falling sine for shape
    const tone = sweep(300, 600, t, dur) * 0.3
    out.push(((sum / MA) * 0.7 + tone) * env * 0.15)
  }
  writeWav('transition.mp3', out)
})()

// ─── Upload — rising C-E-G arpeggio ─────────────────────────────────────────

;(() => {
  const dur     = 0.42
  const samples = Math.ceil(SAMPLE_RATE * dur)
  const notes   = [
    { freq: 523, start: 0.00, len: 0.14 },  // C5
    { freq: 659, start: 0.13, len: 0.14 },  // E5
    { freq: 784, start: 0.26, len: 0.18 },  // G5
  ]
  const out = new Array(samples).fill(0)
  notes.forEach(({ freq, start, len }) => {
    const s0 = Math.floor(start * SAMPLE_RATE)
    const s1 = Math.min(samples, Math.floor((start + len) * SAMPLE_RATE))
    for (let i = s0; i < s1; i++) {
      const t   = (i - s0) / SAMPLE_RATE
      const env = expDecay(t, len, 5)
      out[i]   += sineWave(freq, i / SAMPLE_RATE) * env * 0.28
      out[i]   += sineWave(freq * 2, i / SAMPLE_RATE) * env * 0.06
    }
  })
  writeWav('upload.mp3', out)
})()

console.log('\nAll sounds generated in public/sounds/')
