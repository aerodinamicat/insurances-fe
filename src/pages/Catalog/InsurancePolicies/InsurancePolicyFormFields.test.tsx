import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import '../../../pages/auth/auth-page.css'
import type {
  AssuranceCompanyResponse,
  CustomerResponse,
} from '../../../api/catalog'
import { InsurancePolicyFormFields } from './InsurancePolicyFormFields'
import {
  buildInitialValues,
  validateFormValues,
} from './policy-form-utils'

const customerFixture: CustomerResponse = {
  id: 'customer-1',
  alias: 'Juan Pérez',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  type: 'Particular',
  taxId: '12345678Z',
  firstName: 'Juan',
  lastName: 'Pérez',
  birthAt: '1985-03-10',
  age: 41,
  biologicalGender: 'Masculino',
  maritalStatus: null,
  cnae: null,
  businessName: null,
  tradeName: null,
}

const companyFixture: AssuranceCompanyResponse = {
  id: 'company-1',
  alias: 'Aseguradora Demo',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  businessName: 'Aseguradora Demo',
  tradeName: null,
  taxId: 'A12345678',
}

describe('InsurancePolicyFormFields', () => {
  it('shows validation errors under the correct fields on empty submit', () => {
    const values = buildInitialValues()
    const fieldErrors = validateFormValues(values)

    render(
      <InsurancePolicyFormFields
        formId="policy-form"
        values={values}
        customers={[]}
        assuranceCompanies={[]}
        isSubmitting={false}
        fieldErrors={fieldErrors}
        showErrors
        onFieldChange={vi.fn()}
        onEffectiveAtChange={vi.fn()}
      />,
    )

    const branchSelect = screen.getByLabelText(/^Ramo/)
    const branchFeedbackId = branchSelect.getAttribute('aria-describedby')
    expect(branchFeedbackId).toBeTruthy()
    expect(document.getElementById(branchFeedbackId!)).toHaveTextContent(
      fieldErrors.branch!,
    )
    expect(branchSelect).toHaveAttribute('aria-invalid', 'true')

    const identifierInput = screen.getByLabelText(/^Identificador de póliza/)
    const identifierFeedbackId = identifierInput.getAttribute('aria-describedby')
    expect(document.getElementById(identifierFeedbackId!)).toHaveTextContent(
      fieldErrors.identifierId!,
    )
  })

  it('shows combobox validation errors under the customer and assurance company fields', () => {
    const values = buildInitialValues()
    const fieldErrors = validateFormValues(values)

    render(
      <InsurancePolicyFormFields
        formId="policy-form"
        values={values}
        customers={[customerFixture]}
        assuranceCompanies={[companyFixture]}
        isSubmitting={false}
        fieldErrors={fieldErrors}
        showErrors
        onFieldChange={vi.fn()}
        onEffectiveAtChange={vi.fn()}
      />,
    )

    const customerCombobox = screen.getByRole('combobox', { name: /^Cliente/ })
    const customerFeedbackId = customerCombobox.getAttribute('aria-describedby')
    expect(customerFeedbackId).toBeTruthy()
    expect(document.getElementById(customerFeedbackId!)).toHaveTextContent(
      fieldErrors.customerId!,
    )
    expect(customerCombobox).toHaveAttribute('aria-invalid', 'true')

    const companyCombobox = screen.getByRole('combobox', {
      name: /^Aseguradora/,
    })
    const companyFeedbackId = companyCombobox.getAttribute('aria-describedby')
    expect(document.getElementById(companyFeedbackId!)).toHaveTextContent(
      fieldErrors.assuranceCompanyId!,
    )
    expect(companyCombobox).toHaveAttribute('aria-invalid', 'true')
  })
})
