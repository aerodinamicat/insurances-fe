/** JWT claims aligned with backend {@link JwtPayload}. */
export interface JwtPayload {
  sub: string
  email: string
  role: string
  roleRank: number
  mustChangePassword: boolean
  jti: string
  iat?: number
  exp?: number
}

/** Minimal authenticated user derived from JWT claims. */
export interface AuthUser {
  id: string
  email: string
}

/** Successful login response from `POST /auth/login`. */
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: string
  mustChangePassword: boolean
}

export interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  mustChangePassword: boolean
  role: string | null
  roleRank: number | null
}

/** Generic auth mutation response with a message. */
export interface AuthMessageResponse {
  message: string
}

export interface AuthContextValue extends AuthState {
  isLoading: boolean
  login: (email: string, password: string) => Promise<LoginResponse>
  changePasswordByToken: (token: string, newPassword: string) => Promise<AuthMessageResponse>
  logout: () => Promise<void>
  loadSessionFromStorage: () => void
}
