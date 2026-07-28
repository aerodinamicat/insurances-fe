import { jwtStorageKey } from '../config/env'

/** Set while this tab writes JWT storage to ignore echoed storage events. */
let isWritingAccessToken = false

export function isAccessTokenWriteInProgress(): boolean {
  return isWritingAccessToken
}

export function readStoredAccessToken(): string | null {
  try {
    const value = sessionStorage.getItem(jwtStorageKey)?.trim()
    return value || null
  } catch {
    return null
  }
}

function syncAccessTokenBroadcast(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(jwtStorageKey, token)
    } else {
      localStorage.removeItem(jwtStorageKey)
    }
  } catch {
    // Ignore quota / private-mode failures; sessionStorage remains authoritative in-tab.
  }
}

export function writeStoredAccessToken(token: string): void {
  isWritingAccessToken = true
  try {
    sessionStorage.setItem(jwtStorageKey, token)
    syncAccessTokenBroadcast(token)
  } finally {
    isWritingAccessToken = false
  }
}

export function clearStoredAccessToken(): void {
  isWritingAccessToken = true
  try {
    sessionStorage.removeItem(jwtStorageKey)
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
      sessionStorage.setItem(jwtStorageKey, token)
    } else {
      sessionStorage.removeItem(jwtStorageKey)
    }
  } finally {
    isWritingAccessToken = false
  }
}

export function isJwtStorageEvent(event: StorageEvent): boolean {
  return event.key === jwtStorageKey && event.storageArea === localStorage
}
