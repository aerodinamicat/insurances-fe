/**
 * Validates human-entered GPS coordinates (`latitud, longitud`) with optional
 * spaces around the comma. Latitude must be within [-90, 90] and longitude
 * within [-180, 180].
 */
export const GPS_COORDINATES_INPUT_PATTERN =
  /^\s*([+-]?(?:[0-8]?\d(?:\.\d+)?|90(?:\.0+)?))\s*,\s*([+-]?(?:(?:1[0-7]\d|[0-9]?\d)(?:\.\d+)?|180(?:\.0+)?))\s*$/

export const GOOGLE_MAPS_SEARCH_BASE_URL =
  'https://www.google.com/maps/search/?api=1'

export const GPS_ERROR_MESSAGES = {
  invalid:
    'Las coordenadas GPS deben tener formato latitud,longitud dentro de los rangos válidos.',
} as const

export interface ParsedGpsCoordinates {
  latitude: string
  longitude: string
}

export type GpsCoordinatesNormalizationResult =
  | { ok: true; normalized: string }
  | { ok: false; message: string }

export type GpsCoordinatesLinkState = {
  canOpen: boolean
  normalized: string | null
  url: string | null
  error: string | null
}

/** Returns whether the input matches the GPS coordinate format and ranges. */
export function isValidGpsCoordinates(value: string): boolean {
  return GPS_COORDINATES_INPUT_PATTERN.test(value)
}

/** Returns whether the input can be normalized to canonical GPS coordinates. */
export function isValidGpsCoordinatesInput(rawInput: string): boolean {
  return normalizeGpsCoordinatesResult(rawInput).ok
}

/** Parses valid GPS input into latitude and longitude string parts. */
export function parseGpsCoordinates(
  value: string,
): ParsedGpsCoordinates | null {
  const match = GPS_COORDINATES_INPUT_PATTERN.exec(value)
  if (!match) {
    return null
  }

  return {
    latitude: match[1],
    longitude: match[2],
  }
}

/**
 * Normalizes and validates GPS coordinates for form submission.
 * Blank input is treated as absent and returns `{ ok: false }` without a message.
 */
export function normalizeGpsCoordinatesResult(
  rawInput: string,
): GpsCoordinatesNormalizationResult {
  const input = rawInput.trim()

  if (!input) {
    return { ok: false, message: GPS_ERROR_MESSAGES.invalid }
  }

  const parsed = parseGpsCoordinates(input)
  if (!parsed) {
    return { ok: false, message: GPS_ERROR_MESSAGES.invalid }
  }

  return {
    ok: true,
    normalized: `${parsed.latitude},${parsed.longitude}`,
  }
}

/**
 * Normalizes GPS coordinates to canonical `latitud,longitud` without spaces.
 * Blank input returns `null`; non-empty invalid input throws.
 */
export function normalizeGpsCoordinates(
  value: string | null | undefined,
): string | null {
  if (value == null || value.trim() === '') {
    return null
  }

  const result = normalizeGpsCoordinatesResult(value)
  if (!result.ok) {
    throw new Error(result.message)
  }

  return result.normalized
}

/** Returns a validation error message for invalid GPS input, or `null` when valid. */
export function getGpsCoordinatesValidationError(rawInput: string): string | null {
  const input = rawInput.trim()
  if (!input) {
    return null
  }

  const result = normalizeGpsCoordinatesResult(input)
  return result.ok ? null : result.message
}

/**
 * Builds a Google Maps search URL for the given coordinates.
 * Accepts human input with optional spaces; returns `null` when invalid.
 */
export function buildGoogleMapsSearchUrl(
  coordinates: string | null | undefined,
): string | null {
  if (coordinates == null || coordinates.trim() === '') {
    return null
  }

  const result = normalizeGpsCoordinatesResult(coordinates)
  if (!result.ok) {
    return null
  }

  return `${GOOGLE_MAPS_SEARCH_BASE_URL}&query=${encodeURIComponent(result.normalized)}`
}

/**
 * Derives link state for forms and tables: whether a map link can be opened,
 * the canonical coordinates and the final Google Maps URL.
 */
export function getGpsCoordinatesLinkState(
  rawInput: string | null | undefined,
): GpsCoordinatesLinkState {
  if (rawInput == null || rawInput.trim() === '') {
    return {
      canOpen: false,
      normalized: null,
      url: null,
      error: null,
    }
  }

  const result = normalizeGpsCoordinatesResult(rawInput)
  if (!result.ok) {
    return {
      canOpen: false,
      normalized: null,
      url: null,
      error: result.message,
    }
  }

  return {
    canOpen: true,
    normalized: result.normalized,
    url: buildGoogleMapsSearchUrl(result.normalized),
    error: null,
  }
}
