/** HTTP response shape for a user resource. */
export interface UserResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  confirmedEmailAt: string | null
  mustChangePassword: boolean
  lastLoginAt: string | null
  hasActiveSession: boolean
  activeSessionCount: number
  loginDisabled: boolean
  roleId?: string
  roleCode?: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserPayload {
  email: string
  firstName: string
  lastName: string
  roleId: string
}

export interface UpdateUserPayload {
  firstName?: string
  lastName?: string
  roleId?: string
}

/** HTTP response shape for a role resource. */
export interface RoleResponse {
  id: string
  code: string
  createdAt: string
  updatedAt: string
}

export interface EmailAvailabilityResponse {
  available: boolean
}
