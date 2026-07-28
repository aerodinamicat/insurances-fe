import { describe, expect, it } from 'vitest'

import {
  buildGoogleMapsSearchUrl,
  getGpsCoordinatesLinkState,
  getGpsCoordinatesValidationError,
  GOOGLE_MAPS_SEARCH_BASE_URL,
  GPS_COORDINATES_INPUT_PATTERN,
  GPS_ERROR_MESSAGES,
  isValidGpsCoordinates,
  isValidGpsCoordinatesInput,
  normalizeGpsCoordinates,
  normalizeGpsCoordinatesResult,
  parseGpsCoordinates,
} from './gps-coordinates'

describe('gps-coordinates utilities', () => {
  describe('GPS_COORDINATES_INPUT_PATTERN', () => {
    it('is exported as a RegExp', () => {
      expect(GPS_COORDINATES_INPUT_PATTERN).toBeInstanceOf(RegExp)
    })
  })

  describe('isValidGpsCoordinates', () => {
    it.each([
      '36.77054659512445,-2.814060952500045',
      '36.77054659512445, -2.814060952500045',
      ' 36.77054659512445 , -2.814060952500045 ',
      '0,0',
      '0, 0',
      '-33.45,-70.66',
      '-33.45, -70.66',
      '90,180',
      '90.0,-180.0',
      '-90,-180',
    ])('accepts valid input: %s', (value) => {
      expect(isValidGpsCoordinates(value)).toBe(true)
    })

    it.each([
      '36.77',
      '36.77,',
      ', -2.81',
      'lat,lon',
      '36.77,abc',
      '91,0',
      '-91,0',
      '0,181',
      '0,-181',
      '90.1,0',
      '0,180.1',
      'https://www.google.com/maps/search/?api=1&query=36.77,-2.81',
    ])('rejects invalid input: %s', (value) => {
      expect(isValidGpsCoordinates(value)).toBe(false)
    })
  })

  describe('parseGpsCoordinates', () => {
    it('extracts latitude and longitude parts', () => {
      expect(parseGpsCoordinates(' 36.77 , -2.81 ')).toEqual({
        latitude: '36.77',
        longitude: '-2.81',
      })
    })

    it('returns null for invalid input', () => {
      expect(parseGpsCoordinates('invalid')).toBeNull()
    })
  })

  describe('normalizeGpsCoordinatesResult', () => {
    it.each([
      ['36.77054659512445, -2.814060952500045', '36.77054659512445,-2.814060952500045'],
      ['0, 0', '0,0'],
      ['-33.45, -70.66', '-33.45,-70.66'],
      ['90, 180', '90,180'],
      ['-90,-180', '-90,-180'],
    ])('normalizes %j to %j', (input, expected) => {
      expect(normalizeGpsCoordinatesResult(input)).toEqual({
        ok: true,
        normalized: expected,
      })
    })

    it('rejects invalid input with a clear message', () => {
      expect(normalizeGpsCoordinatesResult('91,0')).toEqual({
        ok: false,
        message: GPS_ERROR_MESSAGES.invalid,
      })
    })

    it('rejects blank input', () => {
      expect(normalizeGpsCoordinatesResult('   ')).toEqual({
        ok: false,
        message: GPS_ERROR_MESSAGES.invalid,
      })
    })
  })

  describe('normalizeGpsCoordinates', () => {
    it('returns null for blank input', () => {
      expect(normalizeGpsCoordinates(null)).toBeNull()
      expect(normalizeGpsCoordinates(undefined)).toBeNull()
      expect(normalizeGpsCoordinates('   ')).toBeNull()
    })

    it('throws for non-empty invalid input', () => {
      expect(() => normalizeGpsCoordinates('36.77')).toThrow(
        GPS_ERROR_MESSAGES.invalid,
      )
      expect(() => normalizeGpsCoordinates('foo,bar')).toThrow(
        GPS_ERROR_MESSAGES.invalid,
      )
      expect(() => normalizeGpsCoordinates('91,0')).toThrow(
        GPS_ERROR_MESSAGES.invalid,
      )
    })

    it('persists canonical string without spaces', () => {
      const result = normalizeGpsCoordinates(
        ' 36.77054659512445 , -2.814060952500045 ',
      )
      expect(result).toBe('36.77054659512445,-2.814060952500045')
      expect(result).not.toMatch(/\s/)
    })
  })

  describe('validation helpers', () => {
    it('returns null for blank or valid input', () => {
      expect(getGpsCoordinatesValidationError('')).toBeNull()
      expect(getGpsCoordinatesValidationError('   ')).toBeNull()
      expect(
        getGpsCoordinatesValidationError('36.77054659512445, -2.814060952500045'),
      ).toBeNull()
    })

    it('returns an error message for invalid input', () => {
      expect(getGpsCoordinatesValidationError('91,0')).toBe(
        GPS_ERROR_MESSAGES.invalid,
      )
    })

    it('returns true only for valid input', () => {
      expect(isValidGpsCoordinatesInput('36.77,-2.81')).toBe(true)
      expect(isValidGpsCoordinatesInput('invalid')).toBe(false)
    })
  })

  describe('buildGoogleMapsSearchUrl', () => {
    it('builds a Google Maps search URL with encoded coordinates', () => {
      const coordinates = '36.77054659512445, -2.814060952500045'
      const url = buildGoogleMapsSearchUrl(coordinates)

      expect(url).toBe(
        `${GOOGLE_MAPS_SEARCH_BASE_URL}&query=${encodeURIComponent('36.77054659512445,-2.814060952500045')}`,
      )
      expect(url).toBe(
        'https://www.google.com/maps/search/?api=1&query=36.77054659512445%2C-2.814060952500045',
      )
    })

    it('accepts canonical coordinates without spaces', () => {
      expect(buildGoogleMapsSearchUrl('0,0')).toBe(
        `${GOOGLE_MAPS_SEARCH_BASE_URL}&query=${encodeURIComponent('0,0')}`,
      )
    })

    it('returns null for blank or invalid coordinates', () => {
      expect(buildGoogleMapsSearchUrl(null)).toBeNull()
      expect(buildGoogleMapsSearchUrl('')).toBeNull()
      expect(buildGoogleMapsSearchUrl('   ')).toBeNull()
      expect(buildGoogleMapsSearchUrl('91,0')).toBeNull()
    })
  })

  describe('getGpsCoordinatesLinkState', () => {
    it('enables the link for valid coordinates', () => {
      const state = getGpsCoordinatesLinkState(
        '36.77054659512445, -2.814060952500045',
      )

      expect(state).toEqual({
        canOpen: true,
        normalized: '36.77054659512445,-2.814060952500045',
        url: 'https://www.google.com/maps/search/?api=1&query=36.77054659512445%2C-2.814060952500045',
        error: null,
      })
    })

    it('disables the link without error for empty input', () => {
      expect(getGpsCoordinatesLinkState(null)).toEqual({
        canOpen: false,
        normalized: null,
        url: null,
        error: null,
      })
      expect(getGpsCoordinatesLinkState('   ')).toEqual({
        canOpen: false,
        normalized: null,
        url: null,
        error: null,
      })
    })

    it('disables the link with error for invalid coordinates', () => {
      expect(getGpsCoordinatesLinkState('91,0')).toEqual({
        canOpen: false,
        normalized: null,
        url: null,
        error: GPS_ERROR_MESSAGES.invalid,
      })
    })
  })
})
