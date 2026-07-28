import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import '../../../pages/auth/auth-page.css'
import { CustomerFormFields } from './CustomerFormFields'
import {
  buildInitialCustomerValues,
  validateCustomerValues,
} from './customer-form-utils'

describe('CustomerFormFields', () => {
  it('shows validation errors under the correct fields on empty submit', () => {
    const values = buildInitialCustomerValues()
    const fieldErrors = validateCustomerValues(values)

    render(
      <CustomerFormFields
        formId="customer-form"
        mode="create"
        values={values}
        isSubmitting={false}
        fieldErrors={fieldErrors}
        showErrors
        onFieldChange={vi.fn()}
      />,
    )

    const firstNameInput = screen.getByLabelText(/^Nombre/)
    const firstNameFeedbackId = firstNameInput.getAttribute('aria-describedby')
    expect(firstNameFeedbackId).toBeTruthy()
    expect(document.getElementById(firstNameFeedbackId!)).toHaveTextContent(
      fieldErrors.firstName!,
    )
    expect(firstNameInput).toHaveAttribute('aria-invalid', 'true')

    const taxIdInput = screen.getByLabelText(/^Identificador fiscal/)
    const taxIdFeedbackId = taxIdInput.getAttribute('aria-describedby')
    expect(document.getElementById(taxIdFeedbackId!)).toHaveTextContent(
      fieldErrors.taxId!,
    )
  })

  it('hides field errors until showErrors or touched', () => {
    const values = buildInitialCustomerValues()
    const fieldErrors = validateCustomerValues(values)

    render(
      <CustomerFormFields
        formId="customer-form"
        mode="create"
        values={values}
        isSubmitting={false}
        fieldErrors={fieldErrors}
        onFieldChange={vi.fn()}
      />,
    )

    expect(
      screen.queryByText(fieldErrors.firstName!),
    ).not.toBeInTheDocument()
  })
})
