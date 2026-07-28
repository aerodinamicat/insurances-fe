import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { InsuredAssetResponse } from '../../../api/catalog'
import { getInsuredAssetAlias } from '../../../api/catalog'
import { InsuredAssetDetailCell } from './InsuredAssetDetailCell'

function createAsset(
  overrides: Partial<InsuredAssetResponse> = {},
): InsuredAssetResponse {
  return {
    id: 'asset-1',
    alias: '',
    aliasDetail: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    insurancePolicyId: 'policy-1',
    type: 'Automóvil',
    insuredSum: '1000',
    currency: 'EUR',
    plateNumber: '1234ABC',
    brand: 'Seat',
    model: 'Ibiza',
    motor: null,
    color: 'Rojo',
    vinNumber: null,
    manufacturedAt: null,
    streetType: null,
    streetName: null,
    streetNumber: null,
    building: null,
    stairs: null,
    floor: null,
    door: null,
    postalCode: null,
    city: null,
    region: null,
    gpsCoordinates: null,
    area: null,
    builtAt: null,
    block: null,
    parcel: null,
    sowedAt: null,
    crop: null,
    insuredProduction: null,
    customerIds: null,
    ...overrides,
  }
}

describe('getInsuredAssetAlias', () => {
  it('prefers API alias over derived summary', () => {
    const asset = createAsset({
      alias: 'Alias API del bien',
      plateNumber: '1234ABC',
      brand: 'Seat',
      model: 'Ibiza',
    })

    expect(getInsuredAssetAlias(asset)).toBe('Alias API del bien')
  })

  it('derives automóvil summary when alias is empty', () => {
    const asset = createAsset({
      alias: '',
      plateNumber: '1234ABC',
      brand: 'Seat',
      model: 'Ibiza',
      color: 'Rojo',
    })

    expect(getInsuredAssetAlias(asset)).toBe('1234ABC · Seat · Ibiza · Rojo')
  })
})

describe('InsuredAssetDetailCell', () => {
  it('renders API alias as primary without field feedback elements', () => {
    const asset = createAsset({
      alias: 'Alias API del bien',
      aliasDetail: 'Detalle secundario',
    })

    render(
      <InsuredAssetDetailCell
        asset={asset}
        getCustomerName={() => 'Cliente'}
      />,
    )

    expect(screen.getByText('Alias API del bien · Detalle secundario')).toHaveClass(
      'insured-asset-detail-cell__inline',
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(document.querySelector('.auth-form__field-feedback')).not.toBeInTheDocument()
  })

  it('renders derived alias when API alias is empty', () => {
    const asset = createAsset({
      alias: '',
      plateNumber: '5678XYZ',
      brand: 'Toyota',
      model: 'Corolla',
      color: 'Azul',
    })

    render(
      <InsuredAssetDetailCell
        asset={asset}
        getCustomerName={() => 'Cliente'}
      />,
    )

    expect(screen.getByText('5678XYZ · Toyota · Corolla · Azul')).toHaveClass(
      'insured-asset-detail-cell__inline',
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
