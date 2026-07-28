import {
  parsePhoneNumber,
  type CountryCode,
  type PhoneNumber,
} from 'libphonenumber-js'

import {
  DEFAULT_PHONE_COUNTRY,
  getCountryLabel,
  NEUTRAL_COUNTRY_LABEL,
} from './phone-countries'
import { countryCodeToFlagEmoji } from './phone-flags'

/** Maximum stored length for E.164 (`+` plus up to 15 digits). */
export const PHONE_NUMBER_E164_MAX_LENGTH = 16

const LETTER_PATTERN = /\p{L}/u
const ALLOWED_INPUT_PATTERN = /^[\d+\s\-().]*$/

export const PHONE_ERROR_MESSAGES = {
  empty: 'El teléfono es obligatorio.',
  letters: 'El teléfono no puede contener letras.',
  unsupported: 'El teléfono contiene caracteres no admitidos.',
  multiplePlus: 'El teléfono solo puede incluir un signo + al inicio.',
  plusPosition: 'El signo + del teléfono debe ir al principio.',
  invalidSpanish: 'El teléfono no es un número español válido.',
  invalidInternational: 'El teléfono no es un número internacional válido.',
  tooLong: 'El teléfono supera la longitud máxima permitida.',
} as const

export type PhoneNumberNormalizationResult =
  | { ok: true; e164: string }
  | { ok: false; message: string }

export type PhonePresentation = {
  source: string
  parseable: boolean
  valid: boolean
  e164: string | null
  countryCode: CountryCode | null
  countryLabel: string
  callingCode: string | null
  nationalNumber: string | null
  formattedNationalNumber: string | null
  flag: string | null
  accessibleLabel: string
  isNeutralCountry: boolean
}

export type NormalizePhoneNumberOptions = {
  defaultCountry?: CountryCode
  useInternationalPrefix00?: boolean
}

/**
 * Strips human separators and normalizes a leading `00` prefix to `+`.
 * Does not validate the resulting value.
 */
export function cleanPhoneInput(
  rawInput: string,
  options: Pick<NormalizePhoneNumberOptions, 'useInternationalPrefix00'> = {},
): string {
  const trimmed = rawInput.trim()
  if (!trimmed) {
    return ''
  }

  let normalized = trimmed
  if (options.useInternationalPrefix00 !== false && normalized.startsWith('00')) {
    normalized = `+${normalized.slice(2)}`
  }

  return normalized.replace(/[\s\-()]/g, '')
}

function getInvalidMessage(isExplicitInternational: boolean): string {
  return isExplicitInternational
    ? PHONE_ERROR_MESSAGES.invalidInternational
    : PHONE_ERROR_MESSAGES.invalidSpanish
}

/**
 * Normalizes and validates a phone number input for contact persistence.
 */
export function normalizePhoneNumberResult(
  rawInput: string,
  options: NormalizePhoneNumberOptions = {},
): PhoneNumberNormalizationResult {
  const defaultCountry = options.defaultCountry ?? DEFAULT_PHONE_COUNTRY
  const useInternationalPrefix00 = options.useInternationalPrefix00 !== false
  const input = rawInput.trim()

  if (!input) {
    return { ok: false, message: PHONE_ERROR_MESSAGES.empty }
  }

  if (LETTER_PATTERN.test(input)) {
    return { ok: false, message: PHONE_ERROR_MESSAGES.letters }
  }

  if (!ALLOWED_INPUT_PATTERN.test(input)) {
    return { ok: false, message: PHONE_ERROR_MESSAGES.unsupported }
  }

  const plusCount = (input.match(/\+/g) ?? []).length
  if (plusCount > 1) {
    return { ok: false, message: PHONE_ERROR_MESSAGES.multiplePlus }
  }

  const digitsAndPlus = cleanPhoneInput(input, { useInternationalPrefix00 })

  if (plusCount === 1 && !digitsAndPlus.startsWith('+')) {
    return { ok: false, message: PHONE_ERROR_MESSAGES.plusPosition }
  }

  if (!digitsAndPlus) {
    return { ok: false, message: PHONE_ERROR_MESSAGES.empty }
  }

  const isExplicitInternational =
    input.startsWith('+') || (useInternationalPrefix00 && input.startsWith('00'))

  try {
    const phoneNumber = digitsAndPlus.startsWith('+')
      ? parsePhoneNumber(digitsAndPlus)
      : parsePhoneNumber(digitsAndPlus, defaultCountry)

    if (!phoneNumber.isValid()) {
      return {
        ok: false,
        message: getInvalidMessage(isExplicitInternational),
      }
    }

    const e164 = phoneNumber.format('E.164')

    if (e164.length > PHONE_NUMBER_E164_MAX_LENGTH) {
      return { ok: false, message: PHONE_ERROR_MESSAGES.tooLong }
    }

    return { ok: true, e164 }
  } catch {
    return {
      ok: false,
      message: getInvalidMessage(isExplicitInternational),
    }
  }
}

/** Returns the normalized E.164 phone number or throws when the input is invalid. */
export function normalizePhoneNumberToE164(
  rawInput: string,
  options: NormalizePhoneNumberOptions = {},
): string {
  const result = normalizePhoneNumberResult(rawInput, options)
  if (!result.ok) {
    throw new Error(result.message)
  }
  return result.e164
}

/** Returns a validation error message for invalid phone input, or `null` when valid. */
export function getPhoneNumberValidationError(
  rawInput: string,
  options: NormalizePhoneNumberOptions = {},
): string | null {
  const result = normalizePhoneNumberResult(rawInput, options)
  return result.ok ? null : result.message
}

/** Returns whether the input can be normalized to a valid E.164 phone number. */
export function isValidPhoneNumberInput(
  rawInput: string,
  options: NormalizePhoneNumberOptions = {},
): boolean {
  return normalizePhoneNumberResult(rawInput, options).ok
}

function isCountryInferenceConfident(phoneNumber: PhoneNumber): boolean {
  return phoneNumber.country !== undefined
}

function buildAccessibleLabel(presentation: {
  countryLabel: string
  callingCode: string | null
  formattedNationalNumber: string | null
  source: string
  parseable: boolean
}): string {
  if (!presentation.parseable) {
    return `Teléfono no reconocido: ${presentation.source}`
  }

  const parts: string[] = []

  if (presentation.countryLabel) {
    parts.push(presentation.countryLabel)
  }

  if (presentation.callingCode) {
    parts.push(`prefijo ${presentation.callingCode}`)
  }

  if (presentation.formattedNationalNumber) {
    parts.push(presentation.formattedNationalNumber)
  }

  return parts.join(', ')
}

function buildPresentationFromPhoneNumber(
  source: string,
  phoneNumber: PhoneNumber,
): PhonePresentation {
  const callingCode = `+${phoneNumber.countryCallingCode}`
  const nationalNumber = phoneNumber.nationalNumber
  const formattedNationalNumber = phoneNumber.formatNational()
  const confidentCountry = isCountryInferenceConfident(phoneNumber)
  const countryCode = confidentCountry ? (phoneNumber.country ?? null) : null
  const countryLabel = countryCode
    ? getCountryLabel(countryCode)
    : NEUTRAL_COUNTRY_LABEL
  const flag = countryCode ? countryCodeToFlagEmoji(countryCode) : null

  const presentation = {
    source,
    parseable: true,
    valid: phoneNumber.isValid(),
    e164: phoneNumber.format('E.164'),
    countryCode,
    countryLabel,
    callingCode,
    nationalNumber,
    formattedNationalNumber,
    flag,
    isNeutralCountry: !confidentCountry,
    accessibleLabel: '',
  }

  presentation.accessibleLabel = buildAccessibleLabel(presentation)
  return presentation
}

function buildUnparseablePresentation(source: string): PhonePresentation {
  return {
    source,
    parseable: false,
    valid: false,
    e164: null,
    countryCode: null,
    countryLabel: source,
    callingCode: null,
    nationalNumber: null,
    formattedNationalNumber: null,
    flag: null,
    accessibleLabel: buildAccessibleLabel({
      source,
      parseable: false,
      countryLabel: '',
      callingCode: null,
      formattedNationalNumber: null,
    }),
    isNeutralCountry: false,
  }
}

/**
 * Parses an existing E.164 value for presentation (flag, prefix, national number).
 */
export function parsePhoneE164(e164: string): PhonePresentation {
  const source = e164.trim()
  if (!source) {
    return buildUnparseablePresentation(source)
  }

  try {
    const phoneNumber = parsePhoneNumber(source)
    return buildPresentationFromPhoneNumber(source, phoneNumber)
  } catch {
    return buildUnparseablePresentation(source)
  }
}

/**
 * Parses user input or stored values and returns a presentation model.
 * Invalid stored values remain visible without throwing.
 */
export function presentPhoneNumber(
  value: string,
  options: NormalizePhoneNumberOptions = {},
): PhonePresentation {
  const source = value.trim()
  if (!source) {
    return buildUnparseablePresentation(source)
  }

  const cleaned = cleanPhoneInput(source, options)
  const defaultCountry = options.defaultCountry ?? DEFAULT_PHONE_COUNTRY

  try {
    const phoneNumber = cleaned.startsWith('+')
      ? parsePhoneNumber(cleaned)
      : parsePhoneNumber(cleaned, defaultCountry)

    return buildPresentationFromPhoneNumber(source, phoneNumber)
  } catch {
    return buildUnparseablePresentation(source)
  }
}
