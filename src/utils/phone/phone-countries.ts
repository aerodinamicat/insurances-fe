import { getCountryCallingCode, type CountryCode } from 'libphonenumber-js'

import { countryCodeToFlagEmoji } from './phone-flags'

/** Default country when the input has no explicit international prefix. */
export const DEFAULT_PHONE_COUNTRY: CountryCode = 'ES'

/** Neutral label when the country cannot be inferred with confidence. */
export const NEUTRAL_COUNTRY_LABEL = 'Internacional'

export type PhoneCountryUiOption = {
  iso2: CountryCode
  name: string
  callingCode: string
  flag: string
}

function buildCountryOption(
  iso2: CountryCode,
  name: string,
): PhoneCountryUiOption {
  return {
    iso2,
    name,
    callingCode: `+${getCountryCallingCode(iso2)}`,
    flag: countryCodeToFlagEmoji(iso2),
  }
}

/**
 * Minimal UI country list for the phone selector.
 * Validation and parsing use libphonenumber-js, not this list.
 */
export const PHONE_COUNTRY_UI_OPTIONS: PhoneCountryUiOption[] = [
  buildCountryOption('ES', 'España'),
  buildCountryOption('PT', 'Portugal'),
  buildCountryOption('FR', 'Francia'),
  buildCountryOption('DE', 'Alemania'),
  buildCountryOption('GB', 'Reino Unido'),
  buildCountryOption('IT', 'Italia'),
  buildCountryOption('US', 'Estados Unidos'),
  buildCountryOption('MX', 'México'),
  buildCountryOption('AR', 'Argentina'),
  buildCountryOption('CO', 'Colombia'),
].sort((left, right) => left.name.localeCompare(right.name, 'es'))

export function getPhoneCountryUiOption(
  iso2: CountryCode,
): PhoneCountryUiOption | undefined {
  return PHONE_COUNTRY_UI_OPTIONS.find((option) => option.iso2 === iso2)
}

export function getDefaultPhoneCountryOption(): PhoneCountryUiOption {
  return (
    getPhoneCountryUiOption(DEFAULT_PHONE_COUNTRY) ??
    buildCountryOption(DEFAULT_PHONE_COUNTRY, 'España')
  )
}

export function getCountryLabel(iso2: CountryCode): string {
  return getPhoneCountryUiOption(iso2)?.name ?? iso2
}
