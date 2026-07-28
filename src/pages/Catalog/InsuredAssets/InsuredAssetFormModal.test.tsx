import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '../../../pages/auth/auth-page.css'
import { createInsuredAsset } from '../../../api/catalog'
import type {
  AssuranceCompanyResponse,
  CustomerResponse,
  InsuredAssetResponse,
  InsurancePolicyResponse,
} from '../../../api/catalog'
import { ApiError } from '../../../api/client'
import { InsuredAssetFormModal } from './InsuredAssetFormModal'

vi.mock('../../../api/catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/catalog')>()
  return {
    ...actual,
    createInsuredAsset: vi.fn(),
  }
})

const createInsuredAssetMock = vi.mocked(createInsuredAsset)

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
  branch: 'Automóvil',
  effectiveAt: '2024-01-01',
  nextRenewalAt: '2025-01-01',
  cancelledAt: null,
  cancellationReason: null,
  customerId: 'customer-1',
  assuranceCompanyId: 'company-1',
  attachedContractId: null,
  status: 'Vigente',
}

const createdAsset: InsuredAssetResponse = {
  id: 'asset-new',
  alias: '',
  aliasDetail: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  insurancePolicyId: 'policy-1',
  type: 'Automóvil',
  insuredSum: '5000',
  currency: 'EUR',
  plateNumber: '1234ABC',
  brand: 'Seat',
  model: 'Ibiza',
  motor: null,
  color: null,
  vinNumber: 'VF12345678901234',
  manufacturedAt: '2020-01-01',
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
  area: null,
  builtAt: null,
  block: null,
  parcel: null,
  sowedAt: null,
  crop: null,
  insuredProduction: null,
  customerIds: null,
}

function renderModal() {
  render(
    <InsuredAssetFormModal
      open
      mode="create"
      policies={[policyFixture]}
      customers={[customerFixture]}
      assuranceCompanies={[companyFixture]}
      defaultPolicyId="policy-1"
      onClose={vi.fn()}
      onSuccess={vi.fn()}
    />,
  )
}

describe('InsuredAssetFormModal field errors', () => {
  beforeEach(() => {
    createInsuredAssetMock.mockReset()
    createInsuredAssetMock.mockResolvedValue(createdAsset)
  })

  it('shows automóvil validation errors under the affected fields', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.selectOptions(screen.getByLabelText(/^Tipo de bien/), 'Automóvil')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    const plateInput = screen.getByLabelText(/^Matrícula/)
    const plateFeedbackId = plateInput.getAttribute('aria-describedby')
    expect(plateFeedbackId).toBeTruthy()
    expect(document.getElementById(plateFeedbackId!)).toHaveTextContent(
      'La matrícula es obligatoria.',
    )
    expect(plateInput).toHaveAttribute('aria-invalid', 'true')

    const brandInput = screen.getByLabelText(/^Marca/)
    const brandFeedbackId = brandInput.getAttribute('aria-describedby')
    expect(document.getElementById(brandFeedbackId!)).toHaveTextContent(
      'La marca es obligatoria.',
    )
    expect(document.querySelector('.auth-alert')).not.toBeInTheDocument()
    expect(createInsuredAssetMock).not.toHaveBeenCalled()
  })

  it('maps a 409 UNIQUE API error to the plateNumber field', async () => {
    const user = userEvent.setup()

    createInsuredAssetMock.mockRejectedValue(
      new ApiError('Conflict', 409, {
        statusCode: 409,
        message: 'Conflict',
        errors: [
          {
            field: 'plateNumber',
            message: 'An insured asset with this plateNumber already exists',
          },
        ],
      }),
    )

    renderModal()

    await user.selectOptions(screen.getByLabelText(/^Tipo de bien/), 'Automóvil')
    await user.type(screen.getByLabelText(/^Matrícula/), '1234ABC')
    await user.type(screen.getByLabelText(/^Marca/), 'Seat')
    await user.type(screen.getByLabelText(/^Modelo/), 'Ibiza')
    await user.type(
      screen.getByLabelText(/^Número de bastidor/),
      'VF12345678901234',
    )
    await user.type(screen.getByLabelText(/^Fecha de fabricación/), '2020-01-01')
    await user.type(screen.getByLabelText(/^Suma asegurada/), '5000')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    const plateInput = await screen.findByLabelText(/^Matrícula/)
    const feedbackId = plateInput.getAttribute('aria-describedby')

    await waitFor(() => {
      expect(feedbackId).toBeTruthy()
      expect(document.getElementById(feedbackId!)).toHaveTextContent(
        'Ya existe un bien asegurado con esta matrícula.',
      )
    })

    expect(plateInput).toHaveAttribute('aria-invalid', 'true')
    expect(document.querySelector('.auth-alert')).not.toBeInTheDocument()
  })
})
