import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import '../../../pages/auth/auth-page.css'
import { AttachmentDraftFields } from './AttachmentDraftFields'
import {
  createEmptyAttachmentDraft,
  validateAttachmentDraft,
} from './attachment-draft-utils'

describe('AttachmentDraftFields', () => {
  it('shows validation errors under the correct fields on empty submit', () => {
    const draft = createEmptyAttachmentDraft()
    const fieldErrors = validateAttachmentDraft(draft)

    render(
      <AttachmentDraftFields
        draft={draft}
        isSubmitting={false}
        fieldErrors={fieldErrors}
        showErrors
        onChange={vi.fn()}
      />,
    )

    const fileInput = screen.getByLabelText(/^Archivo/)
    const fileFeedbackId = fileInput.getAttribute('aria-describedby')
    expect(fileFeedbackId).toBeTruthy()
    expect(document.getElementById(fileFeedbackId!)).toHaveTextContent(
      fieldErrors.file!,
    )
    expect(fileInput).toHaveAttribute('aria-invalid', 'true')

    const documentCodeInput = screen.getByLabelText(/^Código/)
    const documentCodeFeedbackId = documentCodeInput.getAttribute('aria-describedby')
    expect(document.getElementById(documentCodeFeedbackId!)).toHaveTextContent(
      fieldErrors.documentCode!,
    )
  })
})
