/**
 * useToast — Global toast notification state (Sonner-inspired)
 * ─────────────────────────────────────────────────────────────
 * Usage:
 *   // In any component:
 *   const toast = useToast()
 *   toast.success('Application saved!')
 *   toast.error('Failed to submit', { description: 'Please try again.' })
 *   toast.info('Loading data...', { duration: Infinity, id: 'fetch' })
 *   toast.dismiss('fetch')
 *   toast.promise(fetch(...), {
 *     loading: 'Saving...',
 *     success: 'Saved!',
 *     error:   'Failed.',
 *   })
 */
import { reactive, readonly } from 'vue'
import soundManager from '@/services/soundManager'

const MAX_VISIBLE = 5
const DEFAULT_DURATION = 4000  // ms

const state = reactive({
  toasts: [],
})

let idCounter = 0

function add(opts) {
  const id   = opts.id ?? `toast-${++idCounter}`
  const type = opts.type ?? 'info'
  if (type === 'success') soundManager.play('success')
  else if (type === 'error') soundManager.play('error')
  else if (type !== 'loading') soundManager.play('notification')

  // Replace existing if same id
  const existing = state.toasts.findIndex(t => t.id === id)
  if (existing !== -1) {
    state.toasts.splice(existing, 1, { ...state.toasts[existing], ...opts, id })
    return id
  }

  // Trim if over limit
  if (state.toasts.length >= MAX_VISIBLE) {
    state.toasts.shift()
  }

  state.toasts.push({
    id,
    type:        opts.type        ?? 'info',
    title:       opts.title       ?? '',
    description: opts.description ?? '',
    duration:    opts.duration    ?? DEFAULT_DURATION,
    action:      opts.action      ?? null,   // { label, onClick }
    closable:    opts.closable    ?? true,
    createdAt:   Date.now(),
  })

  return id
}

function dismiss(id) {
  const idx = state.toasts.findIndex(t => t.id === id)
  if (idx !== -1) state.toasts.splice(idx, 1)
}

function dismissAll() {
  state.toasts.splice(0)
}

// Convenience helpers — mirrors Sonner API
const success = (title, opts = {}) => add({ ...opts, title, type: 'success' })
const error   = (title, opts = {}) => add({ ...opts, title, type: 'error', duration: opts.duration ?? 6000 })
const warning = (title, opts = {}) => add({ ...opts, title, type: 'warning' })
const info    = (title, opts = {}) => add({ ...opts, title, type: 'info' })
const loading = (title, opts = {}) => add({ ...opts, title, type: 'loading', duration: Infinity, closable: false })

async function promise(promiseFn, { loading: loadMsg, success: successMsg, error: errorMsg } = {}, opts = {}) {
  const id = loading(loadMsg || 'Loading...', opts)
  try {
    const result = await (typeof promiseFn === 'function' ? promiseFn() : promiseFn)
    const title = typeof successMsg === 'function' ? successMsg(result) : successMsg ?? 'Done!'
    add({ id, title, type: 'success', duration: DEFAULT_DURATION, closable: true })
    return result
  } catch (err) {
    const title = typeof errorMsg === 'function' ? errorMsg(err) : errorMsg ?? 'Something went wrong.'
    add({ id, title, type: 'error', duration: 6000, closable: true })
    throw err
  }
}

export function useToast() {
  return {
    toasts:     readonly(state.toasts),
    add,
    dismiss,
    dismissAll,
    success,
    error,
    warning,
    info,
    loading,
    promise,
  }
}

// Singleton export for use outside Vue components (e.g., axios interceptors)
export const toast = { add, dismiss, dismissAll, success, error, warning, info, loading, promise }
