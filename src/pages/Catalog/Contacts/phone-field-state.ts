import type { CountryCode } from 'libphonenumber-js'

import {
  DEFAULT_PHONE_COUNTRY,
  getPhoneCountryUiOption,
  NEUTRAL_COUNTRY_LABEL,
} from '../../../utils/phone'
import {
  getPhoneNumberValidationError,
  normalizePhoneNumberToE164,
  parsePhoneE164,
  presentPhoneNumber,
} from '../../../utils/phone'

export type PhoneFieldState = {
  selectedCountry: CountryCode
  nationalInput: string
  useRawInput: boolean
  rawInput: string
  /** Prefix derived from explicit international numbers without a confident country. */
  inferredCallingCode: string | null
}

export function createPhoneFieldState(storedPhone?: string): PhoneFieldState {
  const emptyState: PhoneFieldState = {
    selectedCountry: DEFAULT_PHONE_COUNTRY,
    nationalInput: '',
    useRawInput: false,
    rawInput: '',
    inferredCallingCode: null,
  }

  const source = storedPhone?.trim()
  if (!source) {
    return emptyState
  }

  const presentation = parsePhoneE164(source)
  if (presentation.parseable && presentation.nationalNumber) {
    return {
      selectedCountry: presentation.countryCode ?? DEFAULT_PHONE_COUNTRY,
      nationalInput: presentation.nationalNumber,
      useRawInput: false,
      rawInput: '',
      inferredCallingCode: presentation.isNeutralCountry
        ? presentation.callingCode
        : null,
    }
  }

  return {
    selectedCountry: DEFAULT_PHONE_COUNTRY,
    nationalInput: '',
    useRawInput: true,
    rawInput: source,
    inferredCallingCode: null,
  }
}

export function buildPhoneNormalizationInput(state: PhoneFieldState): string {
  if (state.useRawInput) {
    return state.rawInput.trim()
  }

  const national = state.nationalInput.trim()
  if (state.inferredCallingCode && national) {
    return `${state.inferredCallingCode}${national}`
  }

  return national
}

export function getPhoneFieldValidationError(state: PhoneFieldState): string | null {
  return getPhoneNumberValidationError(buildPhoneNormalizationInput(state), {
    defaultCountry: state.selectedCountry,
    useInternationalPrefix00: state.useRawInput,
  })
}

export function normalizePhoneFieldState(state: PhoneFieldState): string {
  return normalizePhoneNumberToE164(buildPhoneNormalizationInput(state), {
    defaultCountry: state.selectedCountry,
    useInternationalPrefix00: state.useRawInput,
  })
}

function sanitizePhoneFieldInput(value: string): string {
  const trimmedStart = value.trimStart()
  const hasLeadingPlus = trimmedStart.startsWith('+')
  const digits = trimmedStart.replace(/\D/g, '')

  return hasLeadingPlus ? `+${digits}` : digits
}

function applyStructuredPresentation(
  value: string,
  fallbackCountry: CountryCode,
): PhoneFieldState | null {
  const presentation = presentPhoneNumber(value, {
    defaultCountry: fallbackCountry,
  })

  if (!presentation.parseable || !presentation.nationalNumber) {
    return null
  }

  return {
    selectedCountry: presentation.countryCode ?? fallbackCountry,
    nationalInput: presentation.nationalNumber,
    useRawInput: false,
    rawInput: '',
    inferredCallingCode: presentation.isNeutralCountry
      ? presentation.callingCode
      : null,
  }
}

export function updatePhoneFieldNationalInput(
  state: PhoneFieldState,
  value: string,
): PhoneFieldState {
  const sanitized = sanitizePhoneFieldInput(value)
  const looksInternational = sanitized.startsWith('+')

  if (looksInternational) {
    const structured = applyStructuredPresentation(sanitized, state.selectedCountry)
    if (structured) {
      return structured
    }

    return {
      ...state,
      nationalInput: sanitized,
      useRawInput: false,
      inferredCallingCode: null,
    }
  }

  return {
    ...state,
    selectedCountry: DEFAULT_PHONE_COUNTRY,
    nationalInput: sanitized,
    useRawInput: false,
    inferredCallingCode: null,
  }
}

export function updatePhoneFieldRawInput(
  state: PhoneFieldState,
  value: string,
): PhoneFieldState {
  const structured = applyStructuredPresentation(value, state.selectedCountry)
  if (structured && value.trim()) {
    return structured
  }

  return {
    ...state,
    rawInput: value,
    useRawInput: true,
  }
}

export function updatePhoneFieldCountry(
  state: PhoneFieldState,
  country: CountryCode,
): PhoneFieldState {
  return {
    ...state,
    selectedCountry: country,
    inferredCallingCode: null,
    useRawInput: false,
  }
}

export function getPhoneFieldDisplayPrefix(state: PhoneFieldState): string {
  if (state.inferredCallingCode) {
    return state.inferredCallingCode
  }

  return getPhoneCountryUiOption(state.selectedCountry)?.callingCode ?? ''
}

export function getPhoneFieldDisplayFlag(state: PhoneFieldState): string | null {
  if (state.inferredCallingCode) {
    return null
  }

  return getPhoneCountryUiOption(state.selectedCountry)?.flag ?? null
}

export function getPhoneFieldCountryLabel(state: PhoneFieldState): string {
  if (state.inferredCallingCode) {
    return NEUTRAL_COUNTRY_LABEL
  }

  return getPhoneCountryUiOption(state.selectedCountry)?.name ?? state.selectedCountry
}
