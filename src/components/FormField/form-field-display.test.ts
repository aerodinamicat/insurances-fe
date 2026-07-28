import { describe, expect, it } from 'vitest'

import {
  getFieldAriaProps,
  getFieldFeedbackId,
  getVisibleFieldError,
} from './form-field-display'

describe('form-field-display', () => {
  it('returns null until showErrors or touched', () => {
    expect(
      getVisibleFieldError('email', {
        fieldErrors: { email: 'Required' },
      }),
    ).toBeNull()

    expect(
      getVisibleFieldError('email', {
        fieldErrors: { email: 'Required' },
        touchedFields: { email: true },
      }),
    ).toBe('Required')

    expect(
      getVisibleFieldError('email', {
        fieldErrors: { email: 'Required' },
        showErrors: true,
      }),
    ).toBe('Required')
  })

  it('builds stable feedback ids and aria props', () => {
    expect(getFieldFeedbackId('form', 'taxId')).toBe('form-taxId-feedback')
    expect(getFieldAriaProps('form-taxId-feedback', 'Error')).toEqual({
      'aria-invalid': true,
      'aria-describedby': 'form-taxId-feedback',
    })
    expect(getFieldAriaProps('form-taxId-feedback', null)).toEqual({})
  })
})
