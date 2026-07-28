import { describe, expect, it } from 'vitest'

import {
  hasFieldErrors,
  isBuilderFieldErrorResult,
  isBuilderFormErrorResult,
} from './form-errors'

describe('hasFieldErrors', () => {
  it('returns false for undefined, null, or empty maps', () => {
    expect(hasFieldErrors(undefined)).toBe(false)
    expect(hasFieldErrors(null)).toBe(false)
    expect(hasFieldErrors({})).toBe(false)
  })

  it('returns false when all messages are empty or whitespace', () => {
    expect(hasFieldErrors({ email: '' })).toBe(false)
    expect(hasFieldErrors({ email: '   ' })).toBe(false)
    expect(hasFieldErrors({ email: '', name: undefined })).toBe(false)
  })

  it('returns true when at least one field has a message', () => {
    expect(hasFieldErrors({ email: 'Email is required.' })).toBe(true)
    expect(
      hasFieldErrors({ email: '', name: 'Name is required.' }),
    ).toBe(true)
  })
})

describe('builder result type guards', () => {
  it('detects fieldErrors results', () => {
    expect(isBuilderFieldErrorResult({ fieldErrors: { taxId: 'Required.' } })).toBe(
      true,
    )
    expect(isBuilderFieldErrorResult({ error: 'Required.' })).toBe(false)
  })

  it('detects form error results', () => {
    expect(isBuilderFormErrorResult({ error: 'Network error.' })).toBe(true)
    expect(isBuilderFormErrorResult({ fieldErrors: { taxId: 'Required.' } })).toBe(
      false,
    )
  })
})
