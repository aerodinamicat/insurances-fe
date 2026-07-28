import type { AuthState, AuthUser, JwtPayload } from './types'

const EMPTY_AUTH_STATE: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  mustChangePassword: false,
  role: null,
  roleRank: null,
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  return atob(padded)
}

/** Decodes JWT payload without verifying signature (client-side session restore only). */
export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as JwtPayload
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.role !== 'string' ||
      typeof payload.roleRank !== 'number' ||
      typeof payload.mustChangePassword !== 'boolean'
    ) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

export function isTokenExpired(payload: JwtPayload, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  return payload.exp != null && payload.exp <= nowSeconds
}

export function authUserFromPayload(payload: JwtPayload): AuthUser {
  return {
    id: payload.sub,
    email: payload.email,
  }
}

export function authStateFromToken(token: string | null): AuthState {
  if (!token) {
    return EMPTY_AUTH_STATE
  }

  const payload = decodeJwtPayload(token)
  if (!payload || isTokenExpired(payload)) {
    return EMPTY_AUTH_STATE
  }

  return {
    token,
    user: authUserFromPayload(payload),
    isAuthenticated: true,
    mustChangePassword: payload.mustChangePassword,
    role: payload.role,
    roleRank: payload.roleRank,
  }
}
