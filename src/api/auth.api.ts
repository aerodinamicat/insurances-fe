import type { AuthMessageResponse } from '../auth/types'
import { apiClient } from './client'

export async function confirmEmail(token: string): Promise<AuthMessageResponse> {
  return apiClient<AuthMessageResponse>('/auth/confirm-email', {
    method: 'POST',
    body: { token },
    auth: false,
  })
}

/** Public password reset by one-time token; closes sessions and returns a message. */
export async function changePassword(body: {
  token: string
  newPassword: string
}): Promise<AuthMessageResponse> {
  return apiClient<AuthMessageResponse>('/auth/change-password', {
    method: 'POST',
    body,
    auth: false,
  })
}

/** Completes staff onboarding; returns a message only (no JWT). */
export async function onboarding(body: {
  token: string
  newPassword: string
}): Promise<AuthMessageResponse> {
  return apiClient<AuthMessageResponse>('/auth/onboarding', {
    method: 'POST',
    body,
    auth: false,
  })
}

export async function changeProfilePassword(body: {
  currentPassword: string
}): Promise<void> {
  await apiClient('/auth/password', {
    method: 'PATCH',
    body,
    allowUnauthorized: true,
  })
}

export async function verifyCurrentPassword(body: {
  currentPassword: string
}): Promise<void> {
  await apiClient('/auth/verify-current-password', {
    method: 'POST',
    body,
    allowUnauthorized: true,
  })
}

export async function requestProfileEmailChange(body: {
  currentPassword: string
  email: string
}): Promise<void> {
  await apiClient('/users/me/email', {
    method: 'PATCH',
    body,
    allowUnauthorized: true,
  })
}
