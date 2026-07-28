import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiClient, configureApiAuth } from '../api/client'
import { changePassword as changePasswordByTokenApi } from '../api/auth.api'
import { AuthContext } from './auth-context'
import { authStateFromToken } from './jwt'
import {
  applyAccessTokenFromStorageEvent,
  clearStoredAccessToken,
  isAccessTokenWriteInProgress,
  isJwtStorageEvent,
  readStoredAccessToken,
  writeStoredAccessToken,
} from './storage'
import type { AuthContextValue, AuthState, LoginResponse } from './types'

const LOGIN_PATH = '/login'

const EMPTY_AUTH_STATE: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  mustChangePassword: false,
  role: null,
  roleRank: null,
}

function resolveAuthStateFromStorage(): AuthState {
  const storedToken = readStoredAccessToken()
  const nextState = authStateFromToken(storedToken)

  if (storedToken && !nextState.isAuthenticated) {
    clearStoredAccessToken()
  }

  return nextState
}

function redirectToLogin(): void {
  if (window.location.pathname !== LOGIN_PATH) {
    window.location.assign(LOGIN_PATH)
  }
}

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>(resolveAuthStateFromStorage)

  const clearSession = useCallback(() => {
    clearStoredAccessToken()
    setAuthState(EMPTY_AUTH_STATE)
  }, [])

  const applyAccessToken = useCallback((token: string) => {
    writeStoredAccessToken(token)
    setAuthState(authStateFromToken(token))
  }, [])

  const loadSessionFromStorage = useCallback(() => {
    setAuthState(resolveAuthStateFromStorage())
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    })

    applyAccessToken(response.accessToken)
    return response
  }, [applyAccessToken])

  const changePasswordByToken = useCallback(async (token: string, newPassword: string) => {
    const response = await changePasswordByTokenApi({ token, newPassword })

    clearSession()
    return response
  }, [clearSession])

  const logout = useCallback(async () => {
    const token = readStoredAccessToken()

    if (token) {
      try {
        await apiClient('/auth/logout', { method: 'POST' })
      } catch {
        // Best-effort server-side revocation; local session is always cleared.
      }
    }

    clearSession()
  }, [clearSession])

  useEffect(() => {
    configureApiAuth({
      getAccessToken: readStoredAccessToken,
      onAccessTokenRenewed: applyAccessToken,
      onUnauthorized: () => {
        clearSession()
        redirectToLogin()
      },
    })
  }, [applyAccessToken, clearSession])

  useEffect(() => {
    const handleStorageSync = (event: StorageEvent) => {
      if (!isJwtStorageEvent(event) || isAccessTokenWriteInProgress()) {
        return
      }

      applyAccessTokenFromStorageEvent(event.newValue)
      loadSessionFromStorage()
    }

    window.addEventListener('storage', handleStorageSync)
    return () => window.removeEventListener('storage', handleStorageSync)
  }, [loadSessionFromStorage])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...authState,
      isLoading: false,
      login,
      changePasswordByToken,
      logout,
      loadSessionFromStorage,
    }),
    [authState, login, changePasswordByToken, logout, loadSessionFromStorage],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
