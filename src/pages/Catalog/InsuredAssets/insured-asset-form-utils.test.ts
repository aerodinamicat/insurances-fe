import { describe, expect, it } from 'vitest'

import type { InsuredAssetResponse } from '../../../api/catalog'
import { GPS_ERROR_MESSAGES } from '../../../utils/gps'
import { hasFieldErrors } from '../../../types/form-errors'
import {
  buildCreatePayload,
  buildInitialValues,
  buildUpdatePayload,
  formatInsuredAssetAddress,
  getAssetSummary,
  validateFormValues,
} from './insured-asset-form-utils'

const policyId = 'policy-1'

function baseLocationValues() {
  return {
    ...buildInitialValues(),
    insurancePolicyId: policyId,
    type: 'Inmueble' as const,
    insuredSum: '1000',
    streetName: 'Mayor',
    city: 'Madrid',
    area: '120',
    builtAt: '2010-05-01',
  }
}

const inmuebleAsset: InsuredAssetResponse = {
  id: 'asset-1',
  alias: '',
  aliasDetail: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  insurancePolicyId: policyId,
  type: 'Inmueble',
  insuredSum: '1000',
  currency: 'EUR',
  plateNumber: null,
  brand: null,
  model: null,
  motor: null,
  color: null,
  vinNumber: null,
  manufacturedAt: null,
  streetType: 'Calle',
  streetName: 'Mayor',
  streetNumber: '12',
  building: null,
  stairs: null,
  floor: null,
  door: null,
  postalCode: '28001',
  city: 'Madrid',
  region: null,
  gpsCoordinates: '40.42,-3.70',
  area: 120,
  builtAt: '2010-05-01',
  block: null,
  parcel: null,
  sowedAt: null,
  crop: null,
  insuredProduction: null,
  customerIds: null,
}

describe('insured-asset-form-utils structured address', () => {
  it('hydrates structured address fields from API responses', () => {
    expect(buildInitialValues(inmuebleAsset)).toMatchObject({
      streetType: 'Calle',
      streetName: 'Mayor',
      streetNumber: '12',
      postalCode: '28001',
      city: 'Madrid',
      gpsCoordinates: '40.42,-3.70',
    })
  })

  it('builds create payload with normalized structured address and GPS', () => {
    const payload = buildCreatePayload({
      ...baseLocationValues(),
      streetNumber: ' 12 a ',
      postalCode: ' 28 001 ',
      gpsCoordinates: '36.77054659512445, -2.814060952500045',
    })

    expect('fieldErrors' in payload || 'error' in payload).toBe(false)
    if ('fieldErrors' in payload || 'error' in payload) {
      return
    }

    expect(payload).toMatchObject({
      insurancePolicyId: policyId,
      type: 'Inmueble',
      streetName: 'Mayor',
      streetNumber: '12A',
      postalCode: '28001',
      city: 'Madrid',
      gpsCoordinates: '36.77054659512445,-2.814060952500045',
      area: 120,
      builtAt: '2010-05-01',
    })
    expect(payload).not.toHaveProperty('address')
  })

  it('includes block and parcel for Invernadero alongside structured address', () => {
    const payload = buildCreatePayload({
      ...baseLocationValues(),
      type: 'Invernadero',
      block: 'P-12',
      parcel: '45',
    })

    expect('fieldErrors' in payload || 'error' in payload).toBe(false)
    if ('fieldErrors' in payload || 'error' in payload) {
      return
    }

    expect(payload).toMatchObject({
      type: 'Invernadero',
      streetName: 'Mayor',
      city: 'Madrid',
      block: 'P-12',
      parcel: '45',
    })
  })

  it('does not send address or GPS fields for Automóvil', () => {
    const payload = buildCreatePayload({
      ...buildInitialValues(),
      insurancePolicyId: policyId,
      type: 'Automóvil',
      insuredSum: '5000',
      plateNumber: '1234ABC',
      brand: 'Seat',
      model: 'Ibiza',
      vinNumber: 'VF12345678901234',
      manufacturedAt: '2020-01-01',
      streetName: 'Should not send',
      city: 'Madrid',
      gpsCoordinates: '36.77,-2.81',
    })

    expect('fieldErrors' in payload || 'error' in payload).toBe(false)
    if ('fieldErrors' in payload || 'error' in payload) {
      return
    }

    expect(payload).not.toHaveProperty('streetName')
    expect(payload).not.toHaveProperty('city')
    expect(payload).not.toHaveProperty('gpsCoordinates')
    expect(payload).not.toHaveProperty('address')
  })

  it('requires streetName and city for location types', () => {
    const values = {
      ...baseLocationValues(),
      streetName: '',
      city: '',
    }

    expect(validateFormValues(values)).toEqual({
      streetName: 'El nombre de la vía es obligatorio.',
      city: 'La población es obligatoria.',
    })

    const payload = buildCreatePayload(values)
    expect(payload).toEqual({
      fieldErrors: {
        streetName: 'El nombre de la vía es obligatorio.',
        city: 'La población es obligatoria.',
      },
    })
  })

  it('collects multiple automóvil field errors at once', () => {
    const values = {
      ...buildInitialValues(),
      insurancePolicyId: policyId,
      type: 'Automóvil' as const,
      insuredSum: '5000',
      plateNumber: '',
      brand: '',
      model: '',
      vinNumber: '',
      manufacturedAt: '',
    }

    const errors = validateFormValues(values)
    expect(hasFieldErrors(errors)).toBe(true)
    expect(errors.plateNumber).toBeTruthy()
    expect(errors.brand).toBeTruthy()
    expect(errors.model).toBeTruthy()
    expect(errors.vinNumber).toBeTruthy()
    expect(errors.manufacturedAt).toBeTruthy()
    expect(errors).not.toHaveProperty('streetName')
  })

  it('rejects invalid GPS for location types', () => {
    const values = {
      ...baseLocationValues(),
      gpsCoordinates: '91,0',
    }

    expect(validateFormValues(values)).toEqual({
      gpsCoordinates: GPS_ERROR_MESSAGES.invalid,
    })

    const payload = buildCreatePayload(values)
    expect(payload).toEqual({
      fieldErrors: {
        gpsCoordinates: GPS_ERROR_MESSAGES.invalid,
      },
    })
  })

  it('clears address state when rebuilding initial values after type change', () => {
    const fromAsset = buildInitialValues(inmuebleAsset)
    const afterTypeChange = buildInitialValues(undefined, fromAsset.insurancePolicyId)

    expect(afterTypeChange.streetName).toBe('')
    expect(afterTypeChange.city).toBe('')
    expect(afterTypeChange.gpsCoordinates).toBe('')
  })

  it('formats structured address for summaries', () => {
    expect(formatInsuredAssetAddress(inmuebleAsset)).toBe(
      'Calle Mayor, 12 (28001) — Madrid',
    )
    expect(getAssetSummary(inmuebleAsset)).toBe('Calle Mayor, 12 (28001) — Madrid')
  })

  it('builds update payload with structured address fields', () => {
    const payload = buildUpdatePayload(
      {
        ...baseLocationValues(),
        streetName: 'Nueva',
        city: 'Barcelona',
        gpsCoordinates: '41.38,2.17',
      },
      inmuebleAsset,
    )

    expect('fieldErrors' in payload || 'error' in payload).toBe(false)
    if ('fieldErrors' in payload || 'error' in payload) {
      return
    }

    expect(payload).toMatchObject({
      streetName: 'Nueva',
      city: 'Barcelona',
      gpsCoordinates: '41.38,2.17',
    })
    expect(payload).not.toHaveProperty('address')
  })
})
