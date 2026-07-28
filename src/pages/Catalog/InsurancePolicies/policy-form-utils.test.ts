import { describe, expect, it } from 'vitest'

import { hasFieldErrors } from '../../../types/form-errors'
import {
  buildCreatePayload,
  buildInitialValues,
  validateFormValues,
} from './policy-form-utils'

describe('policy-form-utils field errors', () => {
  it('collects multiple required field errors at once', () => {
    const errors = validateFormValues(buildInitialValues())

    expect(hasFieldErrors(errors)).toBe(true)
    expect(errors).toMatchObject({
      identifierId: 'El identificador de póliza es obligatorio.',
      branch: 'El ramo es obligatorio.',
      effectiveAt: 'La fecha de efecto es obligatoria.',
      customerId: 'El cliente es obligatorio.',
      assuranceCompanyId: 'La aseguradora es obligatoria.',
    })
  })

  it('returns fieldErrors from buildCreatePayload when values are invalid', () => {
    const result = buildCreatePayload(buildInitialValues())

    expect(result).toEqual({
      fieldErrors: validateFormValues(buildInitialValues()),
    })
  })
})
