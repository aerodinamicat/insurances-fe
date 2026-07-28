import type { FieldErrors, FormValidationResult } from '../types/form-errors'
import type { ApiFieldMappingTable } from './api-field-error-utils'
import {
  buildFieldErrorsFromApiError,
  getApiFormErrorState,
} from './api-field-error-utils'
import { ApiError } from './client'

type NestErrorBody = {
  message?: string | string[]
  error?: string
  statusCode?: number
}

export type AuthEntity = 'login' | 'profile' | 'onboarding' | 'change-password'

const AUTH_FIELD_MAPPINGS_BY_ENTITY: Partial<
  Record<AuthEntity, ApiFieldMappingTable>
> = {
  login: {},
  profile: {},
  onboarding: {},
  'change-password': {},
}

function formatNestMessage(body: NestErrorBody): string | null {
  const { message } = body

  if (Array.isArray(message)) {
    const parts = message.map(String).filter(Boolean)
    return parts.length > 0 ? parts.join('. ') : null
  }

  if (typeof message === 'string' && message.length > 0) {
    return message
  }

  return null
}

/** Whether the error is an auth form/API error (400 or 409). */
export function isAuthFormError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    (error.status === 400 || error.status === 409)
  )
}

/**
 * Extracts a user-facing message from auth API errors (400/409).
 * Falls back to the ApiError message or the provided default.
 */
export function getAuthApiErrorMessage(
  error: unknown,
  fallback = 'Operation failed. Please try again.',
): string {
  if (!(error instanceof ApiError)) {
    return fallback
  }

  if (error.status !== 400 && error.status !== 409) {
    return error.message || fallback
  }

  if (typeof error.body === 'object' && error.body !== null) {
    const formatted = formatNestMessage(error.body as NestErrorBody)
    if (formatted) {
      return formatted
    }
  }

  return error.message || fallback
}

/**
 * Maps structured API field errors from auth 400/409 responses to form field keys.
 */
export function parseAuthFieldErrors(
  error: unknown,
  entity?: AuthEntity,
): FieldErrors {
  return buildFieldErrorsFromApiError(error, {
    isFormError: isAuthFormError,
    fieldMappings: entity ? AUTH_FIELD_MAPPINGS_BY_ENTITY[entity] : undefined,
  })
}

/**
 * Splits an auth API error into per-field messages and a global fallback.
 */
export function getAuthFormErrorState(
  error: unknown,
  options?: {
    entity?: AuthEntity
    fallback?: string
  },
): FormValidationResult {
  return getApiFormErrorState(error, {
    getFormErrorMessage: getAuthApiErrorMessage,
    isFormError: isAuthFormError,
    fieldMappings: options?.entity
      ? AUTH_FIELD_MAPPINGS_BY_ENTITY[options.entity]
      : undefined,
    fallback: options?.fallback,
  })
}
