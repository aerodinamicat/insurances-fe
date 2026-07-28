import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import '../../../pages/auth/auth-page.css'
import { ContactPhoneField } from './ContactPhoneField'
import { createPhoneFieldState } from './phone-field-state'

describe('ContactPhoneField', () => {
  it('shows phone validation error under the input on submit', () => {
    const fieldError = 'El teléfono es obligatorio.'

    render(
      <ContactPhoneField
        formId="contact-form"
        state={createPhoneFieldState()}
        fieldError={fieldError}
        showErrors
        onChange={vi.fn()}
      />,
    )

    const phoneField = screen.getByLabelText(/^Teléfono/).closest('.contacts-form__phone-field')
    expect(phoneField).not.toBeNull()
    expect(within(phoneField as HTMLElement).getByText(fieldError)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Teléfono/)).toHaveAttribute('aria-invalid', 'true')
  })
})
