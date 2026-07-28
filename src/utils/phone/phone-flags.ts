import type { CountryCode } from 'libphonenumber-js'

/** Converts an ISO 3166-1 alpha-2 code into its regional-indicator flag emoji. */
export function countryCodeToFlagEmoji(countryCode: CountryCode): string {
  const normalized = countryCode.toUpperCase()
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return ''
  }

  return String.fromCodePoint(
    ...[...normalized].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65),
  )
}
