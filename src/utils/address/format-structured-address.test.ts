import { describe, expect, it } from 'vitest'

import {
  formatStructuredAddress,
  getStructuredAddressSearchText,
} from './format-structured-address'

describe('formatStructuredAddress', () => {
  it('returns an em dash when all fields are empty', () => {
    expect(formatStructuredAddress({})).toBe('—')
    expect(
      formatStructuredAddress({
        streetName: '   ',
        city: null,
      }),
    ).toBe('—')
  })

  it('formats a typical urban address without broken separators', () => {
    expect(
      formatStructuredAddress({
        streetType: 'Calle',
        streetName: 'Mayor',
        streetNumber: '12',
        postalCode: '28001',
        city: 'Madrid',
      }),
    ).toBe('Calle Mayor, 12 (28001) — Madrid')
  })

  it('includes building, stairs, floor and door when present', () => {
    expect(
      formatStructuredAddress({
        streetType: 'Avenida',
        streetName: 'de la Constitución',
        streetNumber: '8',
        building: 'B',
        stairs: '2',
        floor: '3',
        door: 'A',
        postalCode: '41001',
        city: 'Sevilla',
        region: 'Sevilla',
      }),
    ).toBe(
      'Avenida de la Constitución, 8, Bloque B, Esc. 2, 3º A (41001) — Sevilla, Sevilla',
    )
  })

  it('omits street type and number separators when only partial data exists', () => {
    expect(
      formatStructuredAddress({
        city: 'Almería',
        region: 'Almería',
      }),
    ).toBe('Almería, Almería')

    expect(
      formatStructuredAddress({
        streetName: 'Camino Rural',
        postalCode: '04120',
      }),
    ).toBe('Camino Rural (04120)')
  })
})

describe('getStructuredAddressSearchText', () => {
  it('joins persisted address fields for search', () => {
    expect(
      getStructuredAddressSearchText({
        streetType: 'Calle',
        streetName: 'Mayor',
        streetNumber: '12',
        postalCode: '28001',
        city: 'Madrid',
      }),
    ).toBe('Calle Mayor 12 28001 Madrid')
  })
})
