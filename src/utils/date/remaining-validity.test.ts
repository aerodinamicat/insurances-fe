import { describe, expect, it } from 'vitest'

import {
  formatRemainingValidity,
  getRemainingValidityParts,
  getRemainingValiditySortKey,
} from './remaining-validity'

const referenceDate = new Date(2026, 6, 13)

describe('getRemainingValidityParts', () => {
  it('splits calendar difference into years, months and days', () => {
    expect(
      getRemainingValidityParts(
        new Date(2026, 6, 13),
        new Date(2028, 8, 15),
      ),
    ).toEqual({ years: 2, months: 2, days: 2 })
  })
})

describe('formatRemainingValidity', () => {
  it('returns em dash when target date is missing', () => {
    expect(formatRemainingValidity(null, { referenceDate })).toBe('—')
  })

  it('returns past label when target date is in the past', () => {
    expect(
      formatRemainingValidity('2025-01-01', { referenceDate }),
    ).toBe('Caducado')
    expect(
      formatRemainingValidity('2025-01-01', {
        referenceDate,
        pastLabel: 'Vencida',
      }),
    ).toBe('Vencida')
  })

  it('shows years when at least one full year remains', () => {
    expect(formatRemainingValidity('2028-07-13', { referenceDate })).toBe(
      '2 años',
    )
    expect(formatRemainingValidity('2027-07-13', { referenceDate })).toBe(
      '1 año',
    )
  })

  it('shows months when years are zero', () => {
    expect(formatRemainingValidity('2026-10-13', { referenceDate })).toBe(
      '3 meses',
    )
    expect(formatRemainingValidity('2026-08-13', { referenceDate })).toBe(
      '1 mes',
    )
  })

  it('shows days when years and months are zero', () => {
    expect(formatRemainingValidity('2026-07-13', { referenceDate })).toBe(
      '0 días',
    )
    expect(formatRemainingValidity('2026-07-20', { referenceDate })).toBe(
      '7 días',
    )
    expect(formatRemainingValidity('2026-07-14', { referenceDate })).toBe(
      '1 día',
    )
  })
})

describe('getRemainingValiditySortKey', () => {
  it('orders by days until target date', () => {
    expect(getRemainingValiditySortKey('2026-07-20', referenceDate)).toBe(7)
    expect(getRemainingValiditySortKey('2025-01-01', referenceDate)).toBeLessThan(
      0,
    )
    expect(getRemainingValiditySortKey(null, referenceDate)).toBe(
      Number.POSITIVE_INFINITY,
    )
  })
})
