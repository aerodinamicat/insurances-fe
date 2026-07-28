import type { StreetType } from '../../api/catalog'
import type { FieldErrors } from '../../types/form-errors'
import {
  getGpsCoordinatesLinkState,
  getGpsCoordinatesValidationError,
  normalizeGpsCoordinates,
} from '../../utils/gps'

export const STREET_TYPES: StreetType[] = ['Calle', 'Avenida', 'Carretera', 'Plaza']

export const MIN_ADDRESS_FIELDS = ['streetName', 'postalCode', 'city'] as const

export type AddressFormValues = {
  streetType: StreetType
  streetName: string
  streetNumber: string
  building: string
  stairs: string
  floor: string
  door: string
  postalCode: string
  city: string
  region: string
  gpsCoordinates: string
}

export type AddressFieldErrors = FieldErrors<keyof AddressFormValues>

export type NormalizedAddressPayload = {
  streetType: StreetType | null
  streetName: string | null
  streetNumber: string | null
  building: string | null
  stairs: string | null
  floor: string | null
  door: string | null
  postalCode: string | null
  city: string | null
  region: string | null
  gpsCoordinates: string | null
}

const EMPTY_ADDRESS_VALUES: AddressFormValues = {
  streetType: 'Calle',
  streetName: '',
  streetNumber: '',
  building: '',
  stairs: '',
  floor: '',
  door: '',
  postalCode: '',
  city: '',
  region: '',
  gpsCoordinates: '',
}

export type AddressFieldStateSource =
  | Partial<{
      [K in keyof AddressFormValues]: AddressFormValues[K] | null
    }>
  | null
  | undefined

export function createAddressFieldState(
  source?: AddressFieldStateSource,
): AddressFormValues {
  if (!source) {
    return { ...EMPTY_ADDRESS_VALUES }
  }

  return {
    streetType: source.streetType ?? EMPTY_ADDRESS_VALUES.streetType,
    streetName: source.streetName ?? '',
    streetNumber: source.streetNumber ?? '',
    building: source.building ?? '',
    stairs: source.stairs ?? '',
    floor: source.floor ?? '',
    door: source.door ?? '',
    postalCode: source.postalCode ?? '',
    city: source.city ?? '',
    region: source.region ?? '',
    gpsCoordinates: source.gpsCoordinates ?? '',
  }
}

function normalizeCompactAlphanumeric(value: string): string | null {
  const normalized = value.replace(/[^\p{L}\p{N}]/gu, '').toUpperCase()
  return normalized || null
}

export function getGpsFieldValidationError(gpsInput: string): string | null {
  return getGpsCoordinatesValidationError(gpsInput)
}

export function getAddressFieldErrors(values: AddressFormValues): AddressFieldErrors {
  const errors: AddressFieldErrors = {}
  const addressValues = [
    values.streetName,
    values.streetNumber,
    values.building,
    values.stairs,
    values.floor,
    values.door,
    values.postalCode,
    values.city,
    values.region,
  ]
  const anyProvided = addressValues.some((value) => value.trim())

  if (anyProvided) {
    if (!values.streetName.trim()) {
      errors.streetName = 'Si indicas dirección, el nombre de la vía es obligatorio.'
    }
    if (!values.postalCode.trim()) {
      errors.postalCode = 'Si indicas dirección, el código postal es obligatorio.'
    }
    if (!values.city.trim()) {
      errors.city = 'Si indicas dirección, la población es obligatoria.'
    }
  }

  if (values.door.trim().length > 1) {
    errors.door = 'La puerta solo puede tener un carácter.'
  }

  return errors
}

export function getAddressValidationError(values: AddressFormValues): string | null {
  const errors = getAddressFieldErrors(values)
  const firstError = Object.values(errors).find(
    (message): message is string =>
      typeof message === 'string' && message.trim() !== '',
  )
  return firstError ?? null
}

export function validateAddressFormValues(
  values: AddressFormValues,
): AddressFieldErrors {
  const errors = getAddressFieldErrors(values)

  const gpsError = getGpsFieldValidationError(values.gpsCoordinates)
  if (gpsError) {
    errors.gpsCoordinates = gpsError
  }

  return errors
}

export function buildAddressPayload(
  values: AddressFormValues,
): NormalizedAddressPayload {
  const hasAddress = MIN_ADDRESS_FIELDS.some((field) => values[field].trim())
  const streetType = hasAddress ? values.streetType : null
  const streetName = values.streetName.trim() || null
  const streetNumber = normalizeCompactAlphanumeric(values.streetNumber)
  const building = normalizeCompactAlphanumeric(values.building)
  const stairs = normalizeCompactAlphanumeric(values.stairs)
  const floor = normalizeCompactAlphanumeric(values.floor)
  const door = normalizeCompactAlphanumeric(values.door)
  const postalCode = normalizeCompactAlphanumeric(values.postalCode)
  const city = values.city.trim() || null
  const region = values.region.trim() || null
  const gpsCoordinates = normalizeGpsCoordinates(values.gpsCoordinates)

  return {
    streetType,
    streetName,
    streetNumber,
    building,
    stairs,
    floor,
    door,
    postalCode,
    city,
    region,
    gpsCoordinates,
  }
}

export function getAddressGpsLinkState(gpsInput: string) {
  return getGpsCoordinatesLinkState(gpsInput)
}
