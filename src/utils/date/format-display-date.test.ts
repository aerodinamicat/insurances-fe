import { formatDisplayDate } from './format-display-date'

describe('formatDisplayDate', () => {
  it('formats ISO date values using es-ES medium style', () => {
    expect(formatDisplayDate('2024-01-15')).toBe('15 ene 2024')
  })

  it('formats datetime values using only the date portion', () => {
    expect(formatDisplayDate('2024-06-01T10:00:00.000Z')).toBe('1 jun 2024')
  })

  it('returns an em dash for empty values', () => {
    expect(formatDisplayDate(null)).toBe('—')
    expect(formatDisplayDate(undefined)).toBe('—')
    expect(formatDisplayDate('')).toBe('—')
  })

  it('returns the original value when parsing fails', () => {
    expect(formatDisplayDate('invalid-date')).toBe('invalid-date')
  })
})
