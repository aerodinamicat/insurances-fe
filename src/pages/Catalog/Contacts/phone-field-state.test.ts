import { describe, expect, it } from 'vitest'

import { PHONE_ERROR_MESSAGES } from '../../../utils/phone'
import {
  createPhoneFieldState,
  getPhoneFieldDisplayFlag,
  getPhoneFieldDisplayPrefix,
  getPhoneFieldValidationError,
  normalizePhoneFieldState,
  updatePhoneFieldCountry,
  updatePhoneFieldNationalInput,
  updatePhoneFieldRawInput,
} from './phone-field-state'
import { countryCodeToFlagEmoji } from '../../../utils/phone/phone-flags'

describe('phone-field-state', () => {
  it('defaults to Spain for create', () => {
    const state = createPhoneFieldState()

    expect(state.selectedCountry).toBe('ES')
    expect(state.useRawInput).toBe(false)
    expect(state.nationalInput).toBe('')
  })

  it('preloads country, prefix context and national number when editing E.164', () => {
    const state = createPhoneFieldState('+34612345678')

    expect(state.useRawInput).toBe(false)
    expect(state.selectedCountry).toBe('ES')
    expect(state.nationalInput).toBe('612345678')
  })

  it('keeps unparseable historical values editable in raw mode', () => {
    const state = createPhoneFieldState('not-a-phone')

    expect(state.useRawInput).toBe(true)
    expect(state.rawInput).toBe('not-a-phone')
  })

  it('normalizes a Spanish national entry to E.164', () => {
    const state = createPhoneFieldState()
    const withNational = updatePhoneFieldNationalInput(state, '612345678')

    expect(normalizePhoneFieldState(withNational)).toBe('+34612345678')
  })

  it('normalizes pasted international input with separators', () => {
    const state = createPhoneFieldState()
    const withPaste = updatePhoneFieldNationalInput(state, '+34 612 345 678')

    expect(withPaste.selectedCountry).toBe('ES')
    expect(withPaste.nationalInput).toBe('612345678')
    expect(normalizePhoneFieldState(withPaste)).toBe('+34612345678')
  })

  it('transitions from raw mode when the value becomes valid', () => {
    const raw = createPhoneFieldState('not-a-phone')
    const corrected = updatePhoneFieldRawInput(raw, '612345678')

    expect(corrected.useRawInput).toBe(false)
    expect(corrected.nationalInput).toBe('612345678')
    expect(getPhoneFieldValidationError(corrected)).toBeNull()
  })

  it('treats numbers without + as Spanish, including 00 prefixes', () => {
    const state = createPhoneFieldState()
    const withNational = updatePhoneFieldNationalInput(state, '0034612345678')

    expect(withNational.selectedCountry).toBe('ES')
    expect(withNational.nationalInput).toBe('0034612345678')
    expect(withNational.inferredCallingCode).toBeNull()
  })

  it('normalizes explicit international numbers with +', () => {
    const state = createPhoneFieldState()
    const withPortuguese = updatePhoneFieldNationalInput(state, '+351912345678')

    expect(withPortuguese.selectedCountry).toBe('PT')
    expect(normalizePhoneFieldState(withPortuguese)).toBe('+351912345678')
  })

  it('filters phone input to a leading + and digits only', () => {
    const state = createPhoneFieldState()
    const filtered = updatePhoneFieldNationalInput(state, '6a1+2 3-4(5)')

    expect(filtered.selectedCountry).toBe('ES')
    expect(filtered.nationalInput).toBe('612345')
  })

  it('uses a leading + as explicit international input', () => {
    const state = createPhoneFieldState()
    const filtered = updatePhoneFieldNationalInput(state, '+35+1 912abc')

    expect(filtered.selectedCountry).toBe('PT')
    expect(filtered.nationalInput).toBe('912')
  })

  it('removes + characters that are not the first character', () => {
    const state = createPhoneFieldState()
    const filtered = updatePhoneFieldNationalInput(state, '6+12345')

    expect(filtered.selectedCountry).toBe('ES')
    expect(filtered.nationalInput).toBe('612345')
  })

  it('reports validation errors for invalid national input', () => {
    const state = updatePhoneFieldNationalInput(createPhoneFieldState(), '12345')

    expect(getPhoneFieldValidationError(state)).toBe(
      PHONE_ERROR_MESSAGES.invalidSpanish,
    )
  })

  it('reports validation errors for empty input', () => {
    expect(getPhoneFieldValidationError(createPhoneFieldState())).toBe(
      PHONE_ERROR_MESSAGES.empty,
    )
  })

  it('exposes Spain flag and prefix for the default country', () => {
    const state = createPhoneFieldState()

    expect(getPhoneFieldDisplayPrefix(state)).toBe('+34')
    expect(getPhoneFieldDisplayFlag(state)).toBe(countryCodeToFlagEmoji('ES'))
  })

  it('updates prefix when the selected country changes', () => {
    const state = updatePhoneFieldCountry(createPhoneFieldState(), 'PT')

    expect(state.selectedCountry).toBe('PT')
    expect(getPhoneFieldDisplayPrefix(state)).toBe('+351')
    expect(getPhoneFieldDisplayFlag(state)).toBe(countryCodeToFlagEmoji('PT'))
  })

  it('switches back to Spain when the input does not start with +', () => {
    const state = updatePhoneFieldCountry(createPhoneFieldState(), 'PT')
    const withSpanishAssumption = updatePhoneFieldNationalInput(state, '612345678')

    expect(withSpanishAssumption.selectedCountry).toBe('ES')
    expect(getPhoneFieldDisplayPrefix(withSpanishAssumption)).toBe('+34')
    expect(normalizePhoneFieldState(withSpanishAssumption)).toBe('+34612345678')
  })

  it('preserves ambiguous international prefixes when saving without edits', () => {
    const state = createPhoneFieldState('+8821612345678')

    expect(state.inferredCallingCode).toBe('+882')
    expect(getPhoneFieldValidationError(state)).toBeNull()
    expect(normalizePhoneFieldState(state)).toBe('+8821612345678')
  })
})
