import type { FieldErrors, FormValidationResult } from '../../types/form-errors'
import type { ApiFieldMappingTable } from '../api-field-error-utils'
import {
  buildFieldErrorsFromApiError,
  getApiFormErrorState,
} from '../api-field-error-utils'
import { ApiError } from '../client'

type NestErrorBody = {
  message?: string | string[]
  error?: string
  statusCode?: number
}

export type CatalogEntity =
  | 'customer'
  | 'contact'
  | 'insurance-policy'
  | 'attachment'
  | 'insured-asset'
  | 'assurance-company'

const SHARED_CATALOG_FIELD_MAPPINGS: ApiFieldMappingTable = {
  'address.streetType': 'streetType',
  'address.streetName': 'streetName',
  'address.streetNumber': 'streetNumber',
  'address.building': 'building',
  'address.stairs': 'stairs',
  'address.floor': 'floor',
  'address.door': 'door',
  'address.postalCode': 'postalCode',
  'address.city': 'city',
  'address.region': 'region',
  'address.gpsCoordinates': 'gpsCoordinates',
}

const CATALOG_FIELD_MAPPINGS_BY_ENTITY: Partial<
  Record<CatalogEntity, ApiFieldMappingTable>
> = {
  customer: {},
  contact: {},
  'insurance-policy': {},
  attachment: {},
  'insured-asset': {},
  'assurance-company': {},
}

function getCatalogFieldMappings(
  entity?: CatalogEntity,
): ApiFieldMappingTable | undefined {
  const entityMappings = entity
    ? CATALOG_FIELD_MAPPINGS_BY_ENTITY[entity]
    : undefined

  if (!entityMappings || Object.keys(entityMappings).length === 0) {
    return SHARED_CATALOG_FIELD_MAPPINGS
  }

  return {
    ...SHARED_CATALOG_FIELD_MAPPINGS,
    ...entityMappings,
  }
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

/** Whether the error is a validation failure (400) suitable for modal feedback. */
export function isCatalogValidationError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 400
}

/** Whether the error is a uniqueness/conflict failure (409) suitable for modal feedback. */
export function isCatalogConflictError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 409
}

/** Whether the error is a client-side catalog form/API error (400 or 409). */
export function isCatalogFormError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    (error.status === 400 || error.status === 409)
  )
}

/**
 * Extracts a user-facing message from catalog API errors (400/409).
 * Falls back to the ApiError message or the provided default.
 */
export function getCatalogApiErrorMessage(
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
 * Maps structured API field errors from catalog 400/409 responses to form field keys.
 */
export function parseApiFieldErrors(
  error: unknown,
  entity?: CatalogEntity,
): FieldErrors {
  return buildFieldErrorsFromApiError(error, {
    isFormError: isCatalogFormError,
    fieldMappings: getCatalogFieldMappings(entity),
  })
}

/**
 * Splits a catalog API error into per-field messages and a global fallback.
 * When `errors[]` is present, field messages are returned in Spanish and `formError` is null.
 */
export function getCatalogFormErrorState(
  error: unknown,
  options?: {
    entity?: CatalogEntity
    fallback?: string
  },
): FormValidationResult {
  return getApiFormErrorState(error, {
    getFormErrorMessage: getCatalogApiErrorMessage,
    isFormError: isCatalogFormError,
    fieldMappings: getCatalogFieldMappings(options?.entity),
    fallback: options?.fallback,
  })
}
