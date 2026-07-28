import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '../../../pages/auth/auth-page.css'
import { updateInsurancePolicy } from '../../../api/catalog'
import type {
  AssuranceCompanyResponse,
  CustomerResponse,
  InsurancePolicyResponse,
} from '../../../api/catalog'
import { ApiError } from '../../../api/client'
import { InsurancePolicyFormModal } from './InsurancePolicyFormModal'

vi.mock('../../../api/catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/catalog')>()
  return {
    ...actual,
    updateInsurancePolicy: vi.fn(),
  }
})

const updateInsurancePolicyMock = vi.mocked(updateInsurancePolicy)

const customerFixture: CustomerResponse = {
  id: 'customer-1',
  alias: 'Cliente Demo',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  type: 'Empresa',
  taxId: 'B12345678',
  firstName: null,
  lastName: null,
  birthAt: null,
  age: null,
  biologicalGender: null,
  maritalStatus: null,
  cnae: null,
  businessName: 'Cliente Demo SL',
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

const policyFixture: InsurancePolicyResponse = {
  id: 'policy-1',
  alias: 'policy-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  identifierId: 'POL-001',
  branch: 'Hogar',
  effectiveAt: '2024-01-01',
  nextRenewalAt: '2025-01-01',
  cancelledAt: null,
  cancellationReason: null,
  customerId: 'customer-1',
  assuranceCompanyId: 'company-1',
  attachedContractId: null,
  status: 'Vigente',
}

describe('InsurancePolicyFormModal field errors', () => {
  beforeEach(() => {
    updateInsurancePolicyMock.mockReset()
  })

  it('maps a 409 UNIQUE API error to the identifier field', async () => {
    const user = userEvent.setup()

    updateInsurancePolicyMock.mockRejectedValue(
      new ApiError('Conflict', 409, {
        statusCode: 409,
        message: 'Conflict',
        errors: [
          {
            field: 'identifierId',
            message: 'An insurance policy with this identifierId already exists',
          },
        ],
      }),
    )

    render(
      <InsurancePolicyFormModal
        mode="edit"
        open
        policy={policyFixture}
        customers={[customerFixture]}
        assuranceCompanies={[companyFixture]}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    const identifierInput = await screen.findByLabelText(
      /^Identificador de póliza/,
    )
    const feedbackId = identifierInput.getAttribute('aria-describedby')

    await waitFor(() => {
      expect(feedbackId).toBeTruthy()
      expect(document.getElementById(feedbackId!)).toHaveTextContent(
        'Ya existe una póliza con este identificador.',
      )
    })

    expect(identifierInput).toHaveAttribute('aria-invalid', 'true')
    expect(document.querySelector('.auth-alert')).not.toBeInTheDocument()
  })
})
