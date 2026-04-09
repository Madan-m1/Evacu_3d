/**
 * API Configuration
 * 
 * Determines the base URL for API requests and Socket.io connections.
 * Uses VITE_API_URL environment variable if present, otherwise defaults to localhost.
 */

// In Vite, environment variables are accessed via import.meta.env
// They must be prefixed with VITE_ to be exposed to the client
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Clean the URL to ensure it doesn't have a trailing slash for consistency
// If empty, it will use relative paths (useful for some deployment strategies)
export const API_URL = API_BASE_URL.replace(/\/$/, '') || 'http://localhost:5005';

// Logging for easier troubleshooting in production
if (import.meta.env.PROD) {
  if (!import.meta.env.VITE_API_URL) {
    console.warn('⚠️ VITE_API_URL is not set. API calls will default to http://localhost:5005');
  } else {
    console.log(`🌐 API initialized with: ${API_URL}`);
  }
}

// Helper to construct API endpoints
export const getApiUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // If the endpoint already starts with /api, don't duplicate it
  if (cleanEndpoint.startsWith('/api')) {
    return `${API_URL}${cleanEndpoint}`;
  }
  return `${API_URL}/api${cleanEndpoint}`;
};
