import { describe, expect, it } from 'vitest'

import type { AssuranceCompanyResponse } from '../../../api/catalog'
import {
  sortAssuranceCompaniesByBusinessName,
  sortByLocaleCompare,
} from './sort'

function makeCompany(
  overrides: Partial<AssuranceCompanyResponse> & {
    id: string
    businessName: string
  },
): AssuranceCompanyResponse {
  return {
    alias: overrides.alias ?? overrides.businessName,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    tradeName: null,
    ...overrides,
  }
}

describe('sortByLocaleCompare', () => {
  it('sorts strings case-insensitively with base sensitivity', () => {
    const items = ['zebra', 'Árbol', 'apple', 'Banana']

    expect(sortByLocaleCompare(items, (item) => item)).toEqual([
      'apple',
      'Árbol',
      'Banana',
      'zebra',
    ])
  })

  it('does not mutate the original array', () => {
    const items = ['b', 'a']
    const copy = [...items]

    sortByLocaleCompare(items, (item) => item)

    expect(items).toEqual(copy)
  })
})

describe('sortAssuranceCompaniesByBusinessName', () => {
  it('sorts companies by businessName', () => {
    const companies = [
      makeCompany({ id: '1', alias: 'Zeta', businessName: 'Zeta Seguros' }),
      makeCompany({ id: '2', alias: 'Alpha', businessName: 'Alpha Corp' }),
      makeCompany({ id: '3', alias: 'Beta', businessName: 'beta insurance' }),
    ]

    expect(
      sortAssuranceCompaniesByBusinessName(companies).map((c) => c.businessName),
    ).toEqual(['Alpha Corp', 'beta insurance', 'Zeta Seguros'])
  })

  it('ignores alias when businessName differs', () => {
    const companies = [
      makeCompany({ id: '1', alias: 'AAA', businessName: 'Zulu' }),
      makeCompany({ id: '2', alias: 'ZZZ', businessName: 'Alpha' }),
    ]

    expect(
      sortAssuranceCompaniesByBusinessName(companies).map((c) => c.id),
    ).toEqual(['2', '1'])
  })
})
