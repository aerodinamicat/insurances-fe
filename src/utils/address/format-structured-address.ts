export type StructuredAddressFields = {
  streetType?: string | null
  streetName?: string | null
  streetNumber?: string | null
  building?: string | null
  stairs?: string | null
  floor?: string | null
  door?: string | null
  postalCode?: string | null
  city?: string | null
  region?: string | null
}

function trimField(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function formatUnitDetails(
  building?: string,
  stairs?: string,
  floor?: string,
  door?: string,
): string | undefined {
  const parts: string[] = []

  if (building) {
    parts.push(`Bloque ${building}`)
  }

  if (stairs) {
    parts.push(`Esc. ${stairs}`)
  }

  const floorDoor = [floor ? `${floor}º` : undefined, door].filter(Boolean).join(' ')
  if (floorDoor) {
    parts.push(floorDoor)
  }

  return parts.length > 0 ? parts.join(', ') : undefined
}

function formatLocalitySuffix(
  postalCode?: string,
  city?: string,
  region?: string,
): string | undefined {
  const localityParts = [city, region].filter(Boolean)
  let suffix = ''

  if (postalCode) {
    suffix = ` (${postalCode})`
  }

  if (localityParts.length > 0) {
    suffix += postalCode
      ? ` — ${localityParts.join(', ')}`
      : localityParts.join(', ')
  }

  return suffix || undefined
}

/**
 * Composes a human-readable postal address from structured fields, omitting
 * absent parts without leaving broken separators.
 */
export function formatStructuredAddress(
  fields: StructuredAddressFields,
): string {
  const streetType = trimField(fields.streetType)
  const streetName = trimField(fields.streetName)
  const streetNumber = trimField(fields.streetNumber)
  const building = trimField(fields.building)
  const stairs = trimField(fields.stairs)
  const floor = trimField(fields.floor)
  const door = trimField(fields.door)
  const postalCode = trimField(fields.postalCode)
  const city = trimField(fields.city)
  const region = trimField(fields.region)
  const unitDetails = formatUnitDetails(building, stairs, floor, door)

  const hasAny =
    streetType ||
    streetName ||
    streetNumber ||
    unitDetails ||
    postalCode ||
    city ||
    region

  if (!hasAny) {
    return '—'
  }

  const segments: string[] = []
  const streetLine = [streetType, streetName].filter(Boolean).join(' ')

  if (streetLine && streetNumber) {
    segments.push(`${streetLine}, ${streetNumber}`)
  } else if (streetLine) {
    segments.push(streetLine)
  } else if (streetNumber) {
    segments.push(streetNumber)
  }

  if (unitDetails) {
    segments.push(unitDetails)
  }

  const localitySuffix = formatLocalitySuffix(postalCode, city, region)

  if (segments.length === 0) {
    return localitySuffix ?? '—'
  }

  const formatted = `${segments.join(', ')}${localitySuffix ?? ''}`
  return formatted.trim() || '—'
}

/** Joins persisted address fields for table search over stored data. */
export function getStructuredAddressSearchText(
  fields: StructuredAddressFields,
): string {
  return [
    fields.streetType,
    fields.streetName,
    fields.streetNumber,
    fields.building,
    fields.stairs,
    fields.floor,
    fields.door,
    fields.postalCode,
    fields.city,
    fields.region,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ')
}
