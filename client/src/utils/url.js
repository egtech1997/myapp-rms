/**
 * Resolves a backend path to a full URL, correctly handling the VITE_API_URL 
 * and stripping any /api prefix to point to the server root for static files.
 * 
 * @param {string} path - The relative path from the server root (e.g., /uploads/...)
 * @returns {string} The full absolute URL
 */
export const resolveUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const apiUrl = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;
  
  // Strip trailing slash, then strip /api (with or without trailing slash), then strip any remaining trailing slash
  const baseUrl = apiUrl
    .replace(/\/$/, '')
    .replace(/\/api$/, '')
    .replace(/\/$/, '');
    
  // Ensure path starts with a slash, then combine
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
};
