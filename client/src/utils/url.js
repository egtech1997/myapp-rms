/**
 * Resolves a backend path to a full URL, correctly handling the VITE_API_URL 
 * and stripping any /api prefix to point to the server root for static files.
 * 
 * @param {string} path - The relative path from the server root (e.g., /uploads/...)
 * @returns {string} The full absolute URL
 */
export const resolveUrl = (path) => {
  if (!path) return '';
  
  // Get API URL from env or fallback
  const apiUrl = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;
  
  let baseUrl = '';
  if (apiUrl.startsWith('http')) {
    try {
      baseUrl = new URL(apiUrl).origin;
    } catch (e) {
      baseUrl = apiUrl.split('/api')[0];
    }
  } else {
    baseUrl = window.location.origin;
  }

  let cleanPath = path;

  // If path is absolute URL, extract the relative part if it matches our origin
  if (path.startsWith('http')) {
    try {
      const urlObj = new URL(path);
      // If it's our own backend, we want to normalize it
      if (urlObj.origin === baseUrl || urlObj.host === new URL(apiUrl).host) {
        cleanPath = urlObj.pathname + urlObj.search;
      } else {
        return path; // External URL, leave as is
      }
    } catch (e) {
      return path;
    }
  }
    
  // Normalize cleanPath: must start with / and not have /api prefix
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
  
  // Strip /api prefix if present (multiple times to be safe)
  while (cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.replace('/api/', '/');
  }
  
  return `${baseUrl.replace(/\/$/, '')}${cleanPath}`;
};
