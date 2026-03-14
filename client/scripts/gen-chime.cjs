/**
 * Generates a subtle two-note doorbell chime WAV (ding-dong) saved as transition.mp3
 * Uses pure PCM math — no dependencies required.
 */
const fs   = require('fs')
const path = require('path')

const SR      = 44100   // sample rate
const BITS    = 16
const CHANNELS= 1

// ── helper: write PCM WAV ──────────────────────────────────────────────────
function writeWav(filename, samples) {
  const dataBytes  = samples.length * 2
  const buf        = Buffer.alloc(44 + dataBytes)

  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataBytes, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)              // PCM
  buf.writeUInt16LE(CHANNELS, 22)
  buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * CHANNELS * 2, 28) // byte rate
  buf.writeUInt16LE(CHANNELS * 2, 32)  // block align
  buf.writeUInt16LE(BITS, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataBytes, 40)

  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2)
  }

  fs.writeFileSync(filename, buf)
  console.log(`✓ wrote ${filename} (${(buf.length / 1024).toFixed(1)} KB)`)
}

// ── bell tone: sine with exponential decay + subtle harmonics ─────────────
function bellNote(freq, durationSec, amplitude = 0.45) {
  const len = Math.round(SR * durationSec)
  const out = new Float32Array(len)
  const decayRate = 4.5 / durationSec   // reach ~1% by end

  for (let i = 0; i < len; i++) {
    const t       = i / SR
    const env     = Math.exp(-decayRate * t)
    // fundamental + 2nd harmonic (softer bell character)
    const wave    = Math.sin(2 * Math.PI * freq * t)
               + 0.18 * Math.sin(2 * Math.PI * freq * 2.756 * t) // inharmonic partial (bell-like)
               + 0.08 * Math.sin(2 * Math.PI * freq * 5.4 * t)
    out[i] = amplitude * env * wave
  }
  return out
}

// ── main: single bell strike ──────────────────────────────────────────────
// One clean A5 (880 Hz) bell tone — subtle, crisp entrance cue
const TAIL = 0.05

const note1 = bellNote(587, 0.70, 0.36)   // D5 — the low "dong"

const total    = note1.length + Math.round(SR * TAIL)
const combined = new Float32Array(total)
for (let i = 0; i < note1.length; i++) combined[i] = note1[i]

const outFile = path.join(__dirname, '..', 'public', 'sounds', 'transition.wav')
writeWav(outFile, combined)

// Also write as .mp3 filename (Howler will load it; WAV is fine for web)
const mp3File = path.join(__dirname, '..', 'public', 'sounds', 'transition.mp3')
fs.copyFileSync(outFile, mp3File)
fs.unlinkSync(outFile)
console.log(`✓ copied to transition.mp3 (WAV container, Howler handles it fine)`)
