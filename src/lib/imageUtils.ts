/**
 * Get the backend base URL for serving static files (images, PDFs, etc.)
 * Use localhost for development
 */
export function getBackendBaseUrl(): string {
  // Check if VITE_API_URL is explicitly set
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL.replace('/api', '');
    console.log('[imageUtils] Using VITE_API_URL:', url);
    return url;
  }
  
  // Default to localhost (backend runs on port 5000)
  const localUrl = 'http://localhost:5000';
  console.log('[imageUtils] Using localhost:', localUrl);
  return localUrl;
}

/**
 * Get the full URL for an uploaded file (photo, manifesto, etc.)
 */
export function getFileUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  
  // If filePath already includes http, return as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // Ensure filePath starts with /
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  
  return `${getBackendBaseUrl()}${normalizedPath}`;
}

