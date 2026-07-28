import { describe, expect, it } from 'vitest'

import {
  DEFAULT_PHONE_COUNTRY,
  getDefaultPhoneCountryOption,
  NEUTRAL_COUNTRY_LABEL,
  PHONE_COUNTRY_UI_OPTIONS,
} from './phone-countries'
import { countryCodeToFlagEmoji } from './phone-flags'
import {
  cleanPhoneInput,
  getPhoneNumberValidationError,
  isValidPhoneNumberInput,
  normalizePhoneNumberResult,
  normalizePhoneNumberToE164,
  parsePhoneE164,
  PHONE_ERROR_MESSAGES,
  PHONE_NUMBER_E164_MAX_LENGTH,
  presentPhoneNumber,
} from './phone-number'

describe('phone-number utilities', () => {
  describe('cleanPhoneInput', () => {
    it('removes human separators and converts 00 to +', () => {
      expect(cleanPhoneInput('+34 612 345 678')).toBe('+34612345678')
      expect(cleanPhoneInput('(+34) 612-345-678')).toBe('+34612345678')
      expect(cleanPhoneInput('0034612345678')).toBe('+34612345678')
    })
  })

  describe('normalizePhoneNumberResult', () => {
    it.each([
      ['612345678', '+34612345678'],
      ['+34612345678', '+34612345678'],
      ['0034612345678', '+34612345678'],
      ['+34 612 345 678', '+34612345678'],
      ['(+34) 612-345-678', '+34612345678'],
      ['612 345 678', '+34612345678'],
      ['+351 912 345 678', '+351912345678'],
    ])('normalizes %j to %j', (input, expected) => {
      expect(normalizePhoneNumberResult(input)).toEqual({
        ok: true,
        e164: expected,
      })
    })

    it.each([
      ['123456789', PHONE_ERROR_MESSAGES.invalidSpanish],
      ['+123', PHONE_ERROR_MESSAGES.invalidInternational],
      ['61234abc5678', PHONE_ERROR_MESSAGES.letters],
      ['++34612345678', PHONE_ERROR_MESSAGES.multiplePlus],
      ['34+612345678', PHONE_ERROR_MESSAGES.plusPosition],
      ['612345678#123', PHONE_ERROR_MESSAGES.unsupported],
      ['', PHONE_ERROR_MESSAGES.empty],
    ])('rejects %j with %j', (input, message) => {
      expect(normalizePhoneNumberResult(input)).toEqual({
        ok: false,
        message,
      })
    })

    it('uses Spain as the default country for national input', () => {
      expect(DEFAULT_PHONE_COUNTRY).toBe('ES')
      expect(normalizePhoneNumberToE164('612345678')).toBe('+34612345678')
    })

    it('enforces the E.164 storage ceiling', () => {
      expect(PHONE_NUMBER_E164_MAX_LENGTH).toBe(16)
      expect(normalizePhoneNumberToE164('+34612345678').length).toBeLessThanOrEqual(
        PHONE_NUMBER_E164_MAX_LENGTH,
      )
    })
  })

  describe('parsePhoneE164', () => {
    it('parses a Spanish E.164 number with country, prefix and national number', () => {
      const presentation = parsePhoneE164('+34612345678')

      expect(presentation.parseable).toBe(true)
      expect(presentation.valid).toBe(true)
      expect(presentation.e164).toBe('+34612345678')
      expect(presentation.countryCode).toBe('ES')
      expect(presentation.callingCode).toBe('+34')
      expect(presentation.nationalNumber).toBe('612345678')
      expect(presentation.flag).toBe(countryCodeToFlagEmoji('ES'))
      expect(presentation.isNeutralCountry).toBe(false)
      expect(presentation.accessibleLabel).toContain('España')
      expect(presentation.accessibleLabel).toContain('+34')
    })

    it('parses a Portuguese international number', () => {
      const presentation = parsePhoneE164('+351912345678')

      expect(presentation.countryCode).toBe('PT')
      expect(presentation.callingCode).toBe('+351')
      expect(presentation.nationalNumber).toBe('912345678')
      expect(presentation.flag).toBe(countryCodeToFlagEmoji('PT'))
      expect(presentation.isNeutralCountry).toBe(false)
    })

    it('uses a neutral label when the shared prefix cannot infer a country', () => {
      const presentation = parsePhoneE164('+8821612345678')

      expect(presentation.parseable).toBe(true)
      expect(presentation.valid).toBe(true)
      expect(presentation.countryCode).toBeNull()
      expect(presentation.countryLabel).toBe(NEUTRAL_COUNTRY_LABEL)
      expect(presentation.callingCode).toBe('+882')
      expect(presentation.flag).toBeNull()
      expect(presentation.isNeutralCountry).toBe(true)
      expect(presentation.accessibleLabel).toContain(NEUTRAL_COUNTRY_LABEL)
      expect(presentation.accessibleLabel).toContain('+882')
    })

    it('returns an unparseable presentation for invalid stored values', () => {
      const presentation = parsePhoneE164('not-a-phone')

      expect(presentation.parseable).toBe(false)
      expect(presentation.valid).toBe(false)
      expect(presentation.e164).toBeNull()
      expect(presentation.flag).toBeNull()
      expect(presentation.accessibleLabel).toContain('no reconocido')
    })
  })

  describe('presentPhoneNumber', () => {
    it('presents a national Spanish input using the default country', () => {
      const presentation = presentPhoneNumber('612 345 678')

      expect(presentation.countryCode).toBe('ES')
      expect(presentation.callingCode).toBe('+34')
      expect(presentation.nationalNumber).toBe('612345678')
    })
  })

  describe('validation helpers', () => {
    it('returns null for valid input', () => {
      expect(getPhoneNumberValidationError('612345678')).toBeNull()
    })

    it('returns an error message for invalid input', () => {
      expect(getPhoneNumberValidationError('++34612345678')).toBe(
        PHONE_ERROR_MESSAGES.multiplePlus,
      )
    })

    it('returns true only for valid input', () => {
      expect(isValidPhoneNumberInput('+34612345678')).toBe(true)
      expect(isValidPhoneNumberInput('not-a-phone')).toBe(false)
    })
  })

  describe('phone country UI config', () => {
    it('keeps country options sorted by display name', () => {
      const optionNames = PHONE_COUNTRY_UI_OPTIONS.map((option) => option.name)
      const sortedOptionNames = [...optionNames].sort((left, right) =>
        left.localeCompare(right, 'es'),
      )

      expect(optionNames).toEqual(sortedOptionNames)
    })

    it('keeps Spain as the default phone country', () => {
      const defaultOption = getDefaultPhoneCountryOption()

      expect(defaultOption.iso2).toBe('ES')
      expect(defaultOption.callingCode).toBe('+34')
      expect(defaultOption.flag).toBe(countryCodeToFlagEmoji('ES'))
    })
  })
})
