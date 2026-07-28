function parseCivilDate(value: string): Date | null {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function startOfCivilDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export type RemainingValidityParts = {
  years: number
  months: number
  days: number
}

/**
 * Calendar difference from `from` to `to`.
 * Returns full years, then remaining full months, then remaining days.
 */
export function getRemainingValidityParts(
  from: Date,
  to: Date,
): RemainingValidityParts {
  let years = to.getFullYear() - from.getFullYear()
  let months = to.getMonth() - from.getMonth()
  let days = to.getDate() - from.getDate()

  if (days < 0) {
    months -= 1
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate()
  }

  if (months < 0) {
    years -= 1
    months += 12
  }

  return { years, months, days }
}

export type FormatRemainingValidityOptions = {
  referenceDate?: Date
  pastLabel?: string
}

/**
 * Remaining time until `targetDate` from `referenceDate` (civil dates).
 * Shows years if any, else months if any, else days.
 */
export function formatRemainingValidity(
  targetDate: string | null | undefined,
  options: FormatRemainingValidityOptions = {},
): string {
  const { referenceDate = new Date(), pastLabel = 'Caducado' } = options

  if (!targetDate?.trim()) {
    return '—'
  }

  const target = parseCivilDate(targetDate)
  if (!target) {
    return '—'
  }

  const today = startOfCivilDay(referenceDate)

  if (target < today) {
    return pastLabel
  }

  const { years, months, days } = getRemainingValidityParts(today, target)

  if (years > 0) {
    return years === 1 ? '1 año' : `${years} años`
  }

  if (months > 0) {
    return months === 1 ? '1 mes' : `${months} meses`
  }

  if (days === 1) {
    return '1 día'
  }

  return `${days} días`
}

/** Days until target date; negative when already in the past. */
export function getRemainingValiditySortKey(
  targetDate: string | null | undefined,
  referenceDate: Date = new Date(),
): number {
  if (!targetDate?.trim()) {
    return Number.POSITIVE_INFINITY
  }

  const target = parseCivilDate(targetDate)
  if (!target) {
    return Number.POSITIVE_INFINITY
  }

  const today = startOfCivilDay(referenceDate)
  const millisecondsPerDay = 24 * 60 * 60 * 1000

  return Math.round((target.getTime() - today.getTime()) / millisecondsPerDay)
}
