import { describe, expect, it } from 'vitest'

import type { CustomerResponse } from '../../../api/catalog'
import { hasFieldErrors } from '../../../types/form-errors'
import {
  buildCreateCustomerPayload,
  buildInitialCustomerValues,
  buildUpdateCustomerPayload,
  normalizeTaxId,
  validateCustomerValues,
  validateTaxId,
} from './customer-form-utils'

const particularCustomer: CustomerResponse = {
  id: 'customer-1',
  alias: 'Juan Pérez',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  type: 'Particular',
  taxId: '12345678Z',
  firstName: 'Juan',
  lastName: 'Pérez',
  birthAt: '1985-03-10',
  age: 41,
  biologicalGender: 'Masculino',
  maritalStatus: 'Casado/a',
  cnae: null,
  businessName: null,
  tradeName: null,
}

function validParticularValues() {
  return buildInitialCustomerValues({
    ...particularCustomer,
    type: 'Particular',
  })
}

function validEmpresaValues() {
  return {
    ...buildInitialCustomerValues(),
    type: 'Empresa' as const,
    taxId: 'B12345678',
    businessName: 'Acme SL',
    tradeName: 'Acme',
    cnae: '6201',
  }
}

describe('customer-form-utils', () => {
  it('normalizes tax id to uppercase without surrounding spaces', () => {
    expect(normalizeTaxId('  b12345678  ')).toBe('B12345678')
  })

  it('rejects empty or invalid tax id', () => {
    expect(validateTaxId('')).toBe('El identificador fiscal es obligatorio.')
    expect(validateTaxId('12-34')).toBe(
      'El identificador fiscal solo puede contener letras y números en mayúsculas.',
    )
  })

  it('requires particular-specific fields', () => {
    const values = validParticularValues()
    values.firstName = ''
    expect(validateCustomerValues(values)).toEqual({
      firstName: 'El nombre es obligatorio para particulares.',
    })

    values.firstName = 'Juan'
    values.birthAt = ''
    expect(validateCustomerValues(values)).toEqual({
      birthAt: 'La fecha de nacimiento es obligatoria para particulares.',
    })
  })

  it('collects multiple particular field errors at once', () => {
    const values = validParticularValues()
    values.firstName = ''
    values.lastName = ''
    values.birthAt = ''
    values.biologicalGender = ''

    const errors = validateCustomerValues(values)
    expect(hasFieldErrors(errors)).toBe(true)
    expect(errors.firstName).toBeTruthy()
    expect(errors.lastName).toBeTruthy()
    expect(errors.birthAt).toBeTruthy()
    expect(errors.biologicalGender).toBeTruthy()
  })

  it('requires business name for empresa', () => {
    const values = validEmpresaValues()
    values.businessName = ''
    expect(validateCustomerValues(values)).toEqual({
      businessName: 'La razón social es obligatoria para empresas.',
    })
  })

  it('builds create payload for particular customers', () => {
    const payload = buildCreateCustomerPayload(validParticularValues())
    expect(payload).toEqual({
      type: 'Particular',
      taxId: '12345678Z',
      firstName: 'Juan',
      lastName: 'Pérez',
      birthAt: '1985-03-10',
      biologicalGender: 'Masculino',
      maritalStatus: 'Casado/a',
      cnae: null,
    })
  })

  it('builds create payload for empresa customers with normalized cnae', () => {
    const payload = buildCreateCustomerPayload(validEmpresaValues())
    expect(payload).toEqual({
      type: 'Empresa',
      taxId: 'B12345678',
      businessName: 'Acme SL',
      tradeName: 'Acme',
      cnae: '6201',
    })
  })

  it('returns fieldErrors instead of payload when values are invalid', () => {
    const values = validParticularValues()
    values.taxId = ''
    expect(buildCreateCustomerPayload(values)).toEqual({
      fieldErrors: {
        taxId: 'El identificador fiscal es obligatorio.',
      },
    })
  })

  it('builds update payload preserving customer type semantics', () => {
    const payload = buildUpdateCustomerPayload(
      validParticularValues(),
      particularCustomer,
    )
    expect(payload).toEqual({
      taxId: '12345678Z',
      firstName: 'Juan',
      lastName: 'Pérez',
      birthAt: '1985-03-10',
      biologicalGender: 'Masculino',
      maritalStatus: 'Casado/a',
      cnae: null,
    })
  })
})
