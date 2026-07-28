import { describe, expect, it } from 'vitest'

import { ApiError } from '../client'
import {
  getCatalogFormErrorState,
  parseApiFieldErrors,
} from './catalog-errors'

function createCatalogApiError(
  status: 400 | 409,
  body: Record<string, unknown>,
): ApiError {
  return new ApiError(String(body.message ?? 'Error'), status, body)
}

describe('parseApiFieldErrors', () => {
  it('maps a 400 field error to the form field with a Spanish message', () => {
    const error = createCatalogApiError(400, {
      statusCode: 400,
      message: 'Validation failed',
      errors: [
        {
          field: 'taxId',
          message: 'taxId must contain only uppercase letters and digits',
        },
      ],
    })

    expect(parseApiFieldErrors(error, 'customer')).toEqual({
      taxId:
        'El identificador fiscal solo puede contener letras y números en mayúsculas.',
    })
  })

  it('maps a 409 conflict to the form field with a Spanish unique message', () => {
    const error = createCatalogApiError(409, {
      statusCode: 409,
      message: 'Conflict',
      errors: [
        {
          field: 'identifierId',
          message:
            'An insurance policy with this identifierId already exists',
        },
      ],
    })

    expect(parseApiFieldErrors(error, 'insurance-policy')).toEqual({
      identifierId: 'Ya existe una póliza con este identificador.',
    })
  })

  it('maps nested address fields to flat form keys', () => {
    const error = createCatalogApiError(400, {
      statusCode: 400,
      message: 'Validation failed',
      errors: [
        {
          field: 'address.streetName',
          message: 'streetName should not be empty',
        },
      ],
    })

    expect(parseApiFieldErrors(error, 'contact')).toEqual({
      streetName: 'El nombre de la vía es obligatorio.',
    })
  })

  it('returns an empty map for non-catalog errors', () => {
    expect(parseApiFieldErrors(new Error('boom'))).toEqual({})
    expect(parseApiFieldErrors(new ApiError('Not found', 404, {}))).toEqual({})
  })

  it('returns an empty map when the body has no errors array', () => {
    const error = createCatalogApiError(400, {
      statusCode: 400,
      message: 'Validation failed',
    })

    expect(parseApiFieldErrors(error)).toEqual({})
  })

  it('maps insured-asset 409 plateNumber conflict to Spanish message', () => {
    const error = createCatalogApiError(409, {
      statusCode: 409,
      message: 'Conflict',
      errors: [
        {
          field: 'plateNumber',
          message: 'An insured asset with this plateNumber already exists',
        },
      ],
    })

    expect(parseApiFieldErrors(error, 'insured-asset')).toEqual({
      plateNumber: 'Ya existe un bien asegurado con esta matrícula.',
    })
  })

  it('maps attachment documentCode validation to the form field', () => {
    const error = createCatalogApiError(400, {
      statusCode: 400,
      message: 'Validation failed',
      errors: [
        {
          field: 'documentCode',
          message:
            'documentCode must be uppercase alphanumeric (1-255 characters)',
        },
      ],
    })

    expect(parseApiFieldErrors(error, 'attachment')).toEqual({
      documentCode:
        'El código del documento solo puede contener letras y números en mayúsculas (1-255 caracteres).',
    })
  })

  it('maps assurance-company businessName conflict to Spanish message', () => {
    const error = createCatalogApiError(409, {
      statusCode: 409,
      message: 'Conflict',
      errors: [
        {
          field: 'businessName',
          message:
            'An assurance company with this business name already exists',
        },
      ],
    })

    expect(parseApiFieldErrors(error, 'assurance-company')).toEqual({
      businessName: 'Ya existe una aseguradora con esta razón social.',
    })
  })

  it('maps multiple API field errors at once', () => {
    const error = createCatalogApiError(400, {
      statusCode: 400,
      message: 'Validation failed',
      errors: [
        {
          field: 'taxId',
          message: 'taxId should not be empty',
        },
        {
          field: 'firstName',
          message: 'firstName should not be empty',
        },
      ],
    })

    expect(parseApiFieldErrors(error, 'customer')).toEqual({
      taxId: 'El identificador fiscal es obligatorio.',
      firstName: 'El nombre es obligatorio para particulares.',
    })
  })
})

describe('getCatalogFormErrorState', () => {
  it('returns fieldErrors and no formError when errors[] is present', () => {
    const error = createCatalogApiError(400, {
      statusCode: 400,
      message: 'Validation failed',
      errors: [
        {
          field: 'phoneNumber',
          message: 'phoneNumber must not be empty',
        },
      ],
    })

    expect(getCatalogFormErrorState(error, { entity: 'contact' })).toEqual({
      fieldErrors: {
        phoneNumber: 'El teléfono es obligatorio.',
      },
      formError: null,
    })
  })

  it('returns only formError when the response has no errors array', () => {
    const error = createCatalogApiError(400, {
      statusCode: 400,
      message: 'Validation failed',
    })

    expect(
      getCatalogFormErrorState(error, {
        fallback: 'No se pudo completar la operación.',
      }),
    ).toEqual({
      fieldErrors: {},
      formError: 'Validation failed',
    })
  })

  it('uses the fallback for unknown errors', () => {
    expect(
      getCatalogFormErrorState(new Error('network'), {
        fallback: 'No se pudo completar la operación.',
      }),
    ).toEqual({
      fieldErrors: {},
      formError: 'No se pudo completar la operación.',
    })
  })

  it('returns multiple fieldErrors without formError when errors[] has several entries', () => {
    const error = createCatalogApiError(400, {
      statusCode: 400,
      message: 'Validation failed',
      errors: [
        {
          field: 'streetName',
          message: 'streetName should not be empty',
        },
        {
          field: 'city',
          message: 'city should not be empty',
        },
      ],
    })

    expect(getCatalogFormErrorState(error, { entity: 'contact' })).toEqual({
      fieldErrors: {
        streetName: 'El nombre de la vía es obligatorio.',
        city: 'La localidad es obligatoria.',
      },
      formError: null,
    })
  })
})
