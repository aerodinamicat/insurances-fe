import { describe, expect, it } from 'vitest'

import type { CustomerResponse } from '../../../api/catalog'
import { buildCustomerDetailFields } from './customer-detail-utils'

const formatBirthDate = (value: string | null) => value ?? '—'

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

const empresaCustomer: CustomerResponse = {
  ...particularCustomer,
  type: 'Empresa',
  firstName: null,
  lastName: null,
  birthAt: null,
  age: null,
  biologicalGender: null,
  maritalStatus: null,
  businessName: 'Acme SL',
  tradeName: 'Acme',
  cnae: '6201',
}

describe('buildCustomerDetailFields', () => {
  it('builds particular customer fields', () => {
    const fields = buildCustomerDetailFields(particularCustomer, formatBirthDate)

    expect(fields).toEqual(
      expect.arrayContaining([
        { label: 'Nombre', value: 'Juan' },
        { label: 'Apellidos', value: 'Pérez' },
        { label: 'Fecha de nacimiento', value: '1985-03-10' },
      ]),
    )
  })

  it('builds empresa customer fields', () => {
    const fields = buildCustomerDetailFields(empresaCustomer, formatBirthDate)

    expect(fields).toEqual(
      expect.arrayContaining([
        { label: 'Razón social', value: 'Acme SL' },
        { label: 'Nombre comercial', value: 'Acme' },
        { label: 'CNAE', value: '6201' },
      ]),
    )
    expect(fields.some((field) => field.label === 'Nombre')).toBe(false)
  })
})
