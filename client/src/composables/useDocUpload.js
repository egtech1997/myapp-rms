/**
 * Shared helpers for PDS document upload UI.
 */

/** Extract just the filename from a stored URL path */
export const docFilename = (url) => {
  if (!url) return ''
  return decodeURIComponent(url.split('/').pop())
}

/** Returns true when the stored file is a PDF */
export const docIsPdf = (url) => /\.pdf$/i.test(url || '')

/** Human-readable file size */
export const formatBytes = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
