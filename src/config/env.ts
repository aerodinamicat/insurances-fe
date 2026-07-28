const DEFAULT_API_URL = 'http://localhost:3001'
const DEFAULT_JWT_STORAGE_KEY = 'insurances.accessToken'

/** Backend API base URL (browser-reachable; see .env.example). */
export const apiUrl =
  import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_URL

/** sessionStorage/localStorage key for JWT (optional override via env). */
export const jwtStorageKey =
  import.meta.env.VITE_JWT_STORAGE_KEY?.trim() || DEFAULT_JWT_STORAGE_KEY
