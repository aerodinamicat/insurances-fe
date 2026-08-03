const DEFAULT_API_URL = 'http://localhost:3001'

/** Backend API base URL (browser-reachable; see .env.example). */
export const apiUrl =
  import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_URL
