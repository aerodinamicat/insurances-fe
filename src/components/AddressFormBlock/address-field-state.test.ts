import { describe, expect, it } from 'vitest'

import { GPS_ERROR_MESSAGES } from '../../utils/gps'
import { hasFieldErrors } from '../../types/form-errors'
import {
  buildAddressPayload,
  createAddressFieldState,
  getAddressFieldErrors,
  getAddressValidationError,
  getGpsFieldValidationError,
  validateAddressFormValues,
} from './address-field-state'

describe('address-field-state', () => {
  describe('createAddressFieldState', () => {
    it('returns empty defaults when no source is provided', () => {
      expect(createAddressFieldState()).toEqual({
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
      })
    })

    it('maps persisted values into form state', () => {
      expect(
        createAddressFieldState({
          streetType: 'Avenida',
          streetName: 'Mayor',
          gpsCoordinates: '36.77,-2.81',
        }),
      ).toMatchObject({
        streetType: 'Avenida',
        streetName: 'Mayor',
        gpsCoordinates: '36.77,-2.81',
      })
    })
  })

  describe('getAddressFieldErrors', () => {
    it('allows empty address and empty GPS', () => {
      expect(getAddressFieldErrors(createAddressFieldState())).toEqual({})
    })

    it('requires minimum postal fields when any address part is provided', () => {
      expect(
        getAddressFieldErrors(createAddressFieldState({ streetNumber: '12' })),
      ).toEqual({
        streetName: 'Si indicas dirección, el nombre de la vía es obligatorio.',
        postalCode: 'Si indicas dirección, el código postal es obligatorio.',
        city: 'Si indicas dirección, la población es obligatoria.',
      })
    })

    it('does not require GPS when address is complete', () => {
      expect(
        getAddressFieldErrors(
          createAddressFieldState({
            streetName: 'Mayor',
            postalCode: '08001',
            city: 'Barcelona',
          }),
        ),
      ).toEqual({})
    })
  })

  describe('getAddressValidationError', () => {
    it('returns the first address field error for legacy callers', () => {
      expect(
        getAddressValidationError(
          createAddressFieldState({ streetNumber: '12' }),
        ),
      ).toBe('Si indicas dirección, el nombre de la vía es obligatorio.')
    })
  })

  describe('getGpsFieldValidationError', () => {
    it('returns null for blank GPS input', () => {
      expect(getGpsFieldValidationError('')).toBeNull()
      expect(getGpsFieldValidationError('   ')).toBeNull()
    })

    it('returns an error for invalid GPS input', () => {
      expect(getGpsFieldValidationError('91,0')).toBe(GPS_ERROR_MESSAGES.invalid)
    })
  })

  describe('validateAddressFormValues', () => {
    it('rejects invalid GPS even without postal address', () => {
      expect(
        validateAddressFormValues(
          createAddressFieldState({ gpsCoordinates: '91,0' }),
        ),
      ).toEqual({
        gpsCoordinates: GPS_ERROR_MESSAGES.invalid,
      })
    })

    it('accepts valid GPS without postal address', () => {
      expect(
        validateAddressFormValues(
          createAddressFieldState({
            gpsCoordinates: '36.77054659512445, -2.814060952500045',
          }),
        ),
      ).toEqual({})
    })

    it('collects address and GPS errors together', () => {
      const errors = validateAddressFormValues(
        createAddressFieldState({
          streetNumber: '12',
          gpsCoordinates: '91,0',
        }),
      )

      expect(hasFieldErrors(errors)).toBe(true)
      expect(errors.streetName).toBeTruthy()
      expect(errors.gpsCoordinates).toBe(GPS_ERROR_MESSAGES.invalid)
    })
  })

  describe('buildAddressPayload', () => {
    it('normalizes GPS coordinates for submit', () => {
      expect(
        buildAddressPayload(
          createAddressFieldState({
            gpsCoordinates: '36.77054659512445, -2.814060952500045',
          }),
        ).gpsCoordinates,
      ).toBe('36.77054659512445,-2.814060952500045')
    })

    it('returns null GPS when the field is blank', () => {
      expect(
        buildAddressPayload(
          createAddressFieldState({
            streetName: 'Mayor',
            postalCode: '08001',
            city: 'Barcelona',
          }),
        ),
      ).toMatchObject({
        streetName: 'Mayor',
        postalCode: '08001',
        city: 'Barcelona',
        gpsCoordinates: null,
      })
    })

    it('compacts alphanumeric address parts', () => {
      expect(
        buildAddressPayload(
          createAddressFieldState({
            streetName: 'Mayor',
            streetNumber: ' 12 a ',
            postalCode: ' 08 001 ',
            city: 'Madrid',
          }),
        ),
      ).toMatchObject({
        streetNumber: '12A',
        postalCode: '08001',
      })
    })
  })
})
