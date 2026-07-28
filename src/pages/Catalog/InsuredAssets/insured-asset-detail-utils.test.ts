import { describe, expect, it } from 'vitest'

import type { InsuredAssetResponse } from '../../../api/catalog'
import { formatDisplayDate } from '../../../utils/date'
import {
  getInsuredAssetDetailContent,
  getInsuredAssetDetailSearchText,
} from './insured-asset-detail-utils'
import { formatInsuredAssetAddress } from './insured-asset-form-utils'

const baseAsset: InsuredAssetResponse = {
  id: 'asset-1',
  alias: '',
  aliasDetail: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  insurancePolicyId: 'policy-1',
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

const getCustomerName = (customerId: string) => `Cliente ${customerId}`

describe('insured-asset-detail-utils', () => {
  it('builds enriched detail for inmueble assets with map action', () => {
    const content = getInsuredAssetDetailContent(baseAsset, getCustomerName)

    expect(content.primary).toBe(formatInsuredAssetAddress(baseAsset))
    expect(content.lines).toEqual([
      {
        text: `120 m² · ${formatDisplayDate('2010-05-01')}`,
      },
    ])
  })

  it('builds enriched detail for automóvil assets without map action', () => {
    const content = getInsuredAssetDetailContent(
      {
        ...baseAsset,
        type: 'Automóvil',
        plateNumber: '1234ABC',
        brand: 'Seat',
        model: 'Ibiza',
        color: 'Rojo',
        vinNumber: 'WVWZZZ1JZ3W386752',
        manufacturedAt: '2020-01-15',
        streetType: null,
        streetName: null,
        streetNumber: null,
        postalCode: null,
        city: null,
        gpsCoordinates: null,
        area: null,
        builtAt: null,
      },
      getCustomerName,
    )

    expect(content.primary).toBe('1234ABC · Seat · Ibiza · Rojo')
    expect(content.lines).toEqual([
      {
        text: `WVWZZZ1JZ3W386752 · ${formatDisplayDate('2020-01-15')}`,
      },
    ])
  })

  it('uses API alias fields when provided', () => {
    const content = getInsuredAssetDetailContent(
      {
        ...baseAsset,
        alias: 'Calle Mayor, 12 (28001) — Madrid',
        aliasDetail: '120 m² · 1 may 2010',
      },
      getCustomerName,
    )

    expect(content.primary).toBe('Calle Mayor, 12 (28001) — Madrid')
    expect(content.lines).toEqual([
      { text: '120 m² · 1 may 2010', muted: false },
    ])
  })

  it('includes type-specific fields in search text', () => {
    const searchText = getInsuredAssetDetailSearchText(
      {
        ...baseAsset,
        type: 'Persona/s',
        customerIds: 'customer-1;customer-2',
      },
      getCustomerName,
    )

    expect(searchText).toContain('Cliente customer-1')
    expect(searchText).toContain('Cliente customer-2')
  })
})
