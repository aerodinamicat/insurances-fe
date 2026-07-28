import { describe, expect, it } from 'vitest'

import { hasFieldErrors } from '../../../types/form-errors'
import {
  buildContactCreatePayload,
  createEmptyContactDraft,
  validateContactDraft,
  validateContactFormWithCustomer,
} from './contact-draft-utils'
import {
  createPhoneFieldState,
  updatePhoneFieldNationalInput,
} from './phone-field-state'

describe('contact-draft-utils', () => {
  it('creates personal contact draft for particular customers', () => {
    const draft = createEmptyContactDraft('Particular')
    expect(draft.values.type).toBe('Personal')
  })

  it('creates laboral contact draft for empresa customers', () => {
    const draft = createEmptyContactDraft('Empresa')
    expect(draft.values.type).toBe('Laboral')
  })

  it('requires a valid phone number in draft validation', () => {
    const draft = createEmptyContactDraft('Particular')
    expect(hasFieldErrors(validateContactDraft(draft))).toBe(true)
    expect(validateContactDraft(draft).phoneNumber).toBeTruthy()
  })

  it('accepts a valid phone-only contact draft', () => {
    const draft = createEmptyContactDraft('Particular')
    draft.phoneField = updatePhoneFieldNationalInput(
      createPhoneFieldState(),
      '612345678',
    )
    expect(hasFieldErrors(validateContactDraft(draft))).toBe(false)
  })

  it('rejects invalid email addresses', () => {
    const draft = createEmptyContactDraft('Particular')
    draft.phoneField = updatePhoneFieldNationalInput(
      createPhoneFieldState(),
      '612345678',
    )
    draft.values.email = 'not-an-email'
    expect(validateContactDraft(draft)).toEqual({
      email: 'Introduce un correo electrónico válido.',
    })
  })

  it('requires customer id when validating form context', () => {
    const draft = createEmptyContactDraft('Particular')
    expect(validateContactFormWithCustomer(null, draft)).toEqual({
      customerId: 'Debes seleccionar un cliente.',
    })
  })

  it('builds create payload with normalized phone and optional fields', () => {
    const draft = createEmptyContactDraft('Particular')
    draft.phoneField = updatePhoneFieldNationalInput(
      createPhoneFieldState(),
      '612345678',
    )
    draft.values.reference = '  Oficina  '
    draft.values.email = 'contact@example.com'

    expect(buildContactCreatePayload('customer-1', draft)).toEqual({
      customerId: 'customer-1',
      type: 'Personal',
      phoneNumber: '+34612345678',
      reference: 'Oficina',
      email: 'contact@example.com',
      streetType: null,
      streetName: null,
      streetNumber: null,
      building: null,
      stairs: null,
      floor: null,
      door: null,
      postalCode: null,
      city: null,
      region: null,
      gpsCoordinates: null,
    })
  })
})
