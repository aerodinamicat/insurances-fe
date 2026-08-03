const JWT_STORAGE_KEY = 'insurances.accessToken'

/** Set while this tab writes JWT storage to ignore echoed storage events. */
let isWritingAccessToken = false

export function isAccessTokenWriteInProgress(): boolean {
  return isWritingAccessToken
}

export function readStoredAccessToken(): string | null {
  try {
    const value = sessionStorage.getItem(JWT_STORAGE_KEY)?.trim()
    return value || null
  } catch {
    return null
  }
}

function syncAccessTokenBroadcast(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(JWT_STORAGE_KEY, token)
    } else {
      localStorage.removeItem(JWT_STORAGE_KEY)
    }
  } catch {
    // Ignore quota / private-mode failures; sessionStorage remains authoritative in-tab.
  }
}

export function writeStoredAccessToken(token: string): void {
  isWritingAccessToken = true
  try {
    sessionStorage.setItem(JWT_STORAGE_KEY, token)
    syncAccessTokenBroadcast(token)
  } finally {
    isWritingAccessToken = false
  }
}

export function clearStoredAccessToken(): void {
  isWritingAccessToken = true
  try {
    sessionStorage.removeItem(JWT_STORAGE_KEY)
    syncAccessTokenBroadcast(null)
  } finally {
    isWritingAccessToken = false
  }
}

/** Apply a JWT change from another tab's storage event into sessionStorage only. */
export function applyAccessTokenFromStorageEvent(newValue: string | null): void {
  isWritingAccessToken = true
  try {
    const token = newValue?.trim()
    if (token) {
      sessionStorage.setItem(JWT_STORAGE_KEY, token)
    } else {
      sessionStorage.removeItem(JWT_STORAGE_KEY)
    }
  } finally {
    isWritingAccessToken = false
  }
}

export function isJwtStorageEvent(event: StorageEvent): boolean {
  return event.key === JWT_STORAGE_KEY && event.storageArea === localStorage
}
