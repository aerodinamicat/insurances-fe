/**
 * Single field-level validation or conflict error returned by the API.
 *
 * @see insurances-backend-server commons/exceptions/api-error.types.ts
 */
export type ApiFieldError = {
  field: string
  message: string
}

/**
 * Standard HTTP error body for 400/409 responses that can be mapped to form inputs.
 */
export type ApiErrorBody = {
  statusCode?: number
  message?: string | string[]
  error?: string
  errors?: ApiFieldError[]
}
