// API Configuration
// Use localhost for development
function getBackendBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace('/api', '');
  }
  
  // Default to localhost (backend runs on port 5000)
  return 'http://localhost:5000';
}

export const BACKEND_BASE_URL = getBackendBaseUrl();


