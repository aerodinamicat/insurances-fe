import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import '../../../pages/auth/auth-page.css'
import { ContactDraftFields } from './ContactDraftFields'
import {
  createEmptyContactDraft,
  validateContactDraft,
} from './contact-draft-utils'

describe('ContactDraftFields', () => {
  it('shows validation errors under the correct fields on empty submit', () => {
    const draft = createEmptyContactDraft('Particular')
    const fieldErrors = validateContactDraft(draft)

    render(
      <ContactDraftFields
        formId="contact-form"
        draft={draft}
        isSubmitting={false}
        fieldErrors={fieldErrors}
        showErrors
        onValuesChange={vi.fn()}
        onPhoneFieldChange={vi.fn()}
      />,
    )

    const phoneField = screen.getByLabelText(/^Teléfono/).closest('.contacts-form__phone-field')
    expect(phoneField).not.toBeNull()
    expect(
      within(phoneField as HTMLElement).getByText(fieldErrors.phoneNumber!),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/^Teléfono/)).toHaveAttribute('aria-invalid', 'true')
  })
})
