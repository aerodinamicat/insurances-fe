import { apiClient } from './client'
import type {
  CreateUserPayload,
  EmailAvailabilityResponse,
  UpdateUserPayload,
  UserResponse,
} from './types'

export async function fetchMyProfile(): Promise<UserResponse> {
  return apiClient<UserResponse>('/users/me')
}

export async function fetchUsers(): Promise<UserResponse[]> {
  return apiClient<UserResponse[]>('/users')
}

export async function checkUserEmailAvailability(
  email: string,
  excludeUserId?: string,
): Promise<EmailAvailabilityResponse> {
  const params = new URLSearchParams({ email })
  if (excludeUserId) {
    params.set('excludeUserId', excludeUserId)
  }
  return apiClient<EmailAvailabilityResponse>(
    `/users/email-availability?${params.toString()}`,
  )
}

export async function createUser(payload: CreateUserPayload): Promise<UserResponse> {
  return apiClient<UserResponse>('/users', {
    method: 'POST',
    body: payload,
  })
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<UserResponse> {
  return apiClient<UserResponse>(`/users/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient(`/users/${id}`, { method: 'DELETE' })
}

export async function resetUserPassword(id: string): Promise<void> {
  await apiClient(`/users/${id}/reset-password`, { method: 'POST' })
}

export async function resendUserOnboarding(id: string): Promise<void> {
  await apiClient(`/users/${id}/resend-onboarding`, { method: 'POST' })
}

export async function revokeUserSessions(id: string): Promise<void> {
  await apiClient(`/users/${id}/revoke-sessions`, { method: 'POST' })
}

export async function disableUserLogin(id: string): Promise<void> {
  await apiClient(`/users/${id}/disable-login`, { method: 'POST' })
}

export async function enableUserLogin(id: string): Promise<void> {
  await apiClient(`/users/${id}/enable-login`, { method: 'POST' })
}
