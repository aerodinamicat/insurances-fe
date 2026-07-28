import { describe, expect, it } from 'vitest'

import { ApiError } from './client'
import {
  getAuthFormErrorState,
  parseAuthFieldErrors,
} from './auth-errors'

function createAuthApiError(
  status: 400 | 409,
  body: Record<string, unknown>,
): ApiError {
  return new ApiError(String(body.message ?? 'Error'), status, body)
}

describe('parseAuthFieldErrors', () => {
  it('maps structured auth field errors to Spanish messages', () => {
    const error = createAuthApiError(400, {
      statusCode: 400,
      message: 'Validation failed',
      errors: [
        {
          field: 'email',
          message: 'email should not be empty',
        },
      ],
    })

    expect(parseAuthFieldErrors(error, 'login')).toEqual({
      email: 'El correo electrónico es obligatorio.',
    })
  })
})

describe('getAuthFormErrorState', () => {
  it('returns only formError when the response has no errors array', () => {
    const error = createAuthApiError(400, {
      statusCode: 400,
      message: 'Invalid credentials',
    })

    expect(
      getAuthFormErrorState(error, {
        entity: 'login',
        fallback: 'No se pudo iniciar sesión.',
      }),
    ).toEqual({
      fieldErrors: {},
      formError: 'Invalid credentials',
    })
  })
})
