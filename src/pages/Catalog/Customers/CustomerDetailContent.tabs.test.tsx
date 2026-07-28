import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchInsurancePolicies } from '../../../api/catalog'
import type {
  AssuranceCompanyResponse,
  CustomerResponse,
  InsurancePolicyResponse,
} from '../../../api/catalog'
import { useAttachments } from '../Attachments/useAttachments'
import { useContacts } from '../Contacts/useContacts'
import { CustomerDetailContent } from './CustomerDetailContent'

vi.mock('../Attachments/useAttachments', () => ({
  useAttachments: vi.fn(),
}))

vi.mock('../Contacts/useContacts', () => ({
  useContacts: vi.fn(),
}))

vi.mock('../../../api/catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/catalog')>()
  return {
    ...actual,
    fetchInsurancePolicies: vi.fn(),
  }
})

vi.mock('../../../routes/RoleGate', () => ({
  EDITOR_RANK: 2,
  RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const useAttachmentsMock = vi.mocked(useAttachments)
const useContactsMock = vi.mocked(useContacts)
const fetchInsurancePoliciesMock = vi.mocked(fetchInsurancePolicies)

const customer: CustomerResponse = {
  id: 'customer-1',
  alias: 'Cliente Demo',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
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

const company: AssuranceCompanyResponse = {
  id: 'company-1',
  alias: 'Aseguradora Demo',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  businessName: 'Aseguradora Demo',
  tradeName: null,
  taxId: 'A12345678',
}

function createPolicy(id: string): InsurancePolicyResponse {
  return {
    id,
    alias: id,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    identifierId: id,
    branch: 'Hogar',
    effectiveAt: '2026-01-01',
    nextRenewalAt: '2027-01-01',
    cancelledAt: null,
    cancellationReason: null,
    customerId: customer.id,
    assuranceCompanyId: company.id,
    attachedContractId: null,
    status: 'Vigente',
  }
}

describe('CustomerDetailContent tabs', () => {
  beforeEach(() => {
    useContactsMock.mockReturnValue({
      contacts: [],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertContact: vi.fn(),
      removeContact: vi.fn(),
    })
    useAttachmentsMock.mockReturnValue({
      attachments: [],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertAttachment: vi.fn(),
      removeAttachment: vi.fn(),
    })
    fetchInsurancePoliciesMock.mockResolvedValue([
      createPolicy('POL-001'),
      createPolicy('POL-002'),
    ])
  })

  it('shows the detail sections as tabs with row counts', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <CustomerDetailContent
          customer={customer}
          assuranceCompanies={[company]}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('tab', { name: 'Resumen' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByText('Empresa')).toHaveClass(
      'catalog-badge',
      'catalog-badge--empresa',
    )
    expect(
      screen.getByRole('tab', { name: 'Contactos (0)' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: 'Documentos (0)' }),
    ).toBeInTheDocument()

    const policiesTab = await screen.findByRole('tab', {
      name: 'Pólizas (2)',
    })
    await user.click(policiesTab)

    expect(screen.getByText('POL-001')).toBeInTheDocument()
    expect(screen.getByText('POL-002')).toBeInTheDocument()
  })

  it('opens the create form from each data tab', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <CustomerDetailContent
          customer={customer}
          assuranceCompanies={[company]}
        />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('tab', { name: 'Contactos (0)' }))
    await user.click(screen.getByRole('button', { name: 'Añadir' }))
    expect(
      screen.getByRole('heading', { name: 'Nuevo contacto' }),
    ).toBeInTheDocument()
    const contactDialog = screen
      .getByRole('heading', { name: 'Nuevo contacto' })
      .closest('dialog')
    expect(contactDialog).not.toBeNull()
    expect(within(contactDialog!).getByLabelText(/Cliente/)).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    await user.click(screen.getByRole('tab', { name: 'Documentos (0)' }))
    await user.click(screen.getByRole('button', { name: 'Añadir' }))
    expect(
      screen.getByRole('heading', { name: 'Subir documento' }),
    ).toBeInTheDocument()
    const attachmentDialog = screen
      .getByRole('heading', { name: 'Subir documento' })
      .closest('dialog')
    expect(attachmentDialog).not.toBeNull()
    expect(within(attachmentDialog!).getByLabelText('Cliente')).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    await user.click(await screen.findByRole('tab', { name: 'Pólizas (2)' }))
    await user.click(screen.getByRole('button', { name: 'Añadir' }))
    expect(
      screen.getByRole('heading', { name: 'Nueva póliza' }),
    ).toBeInTheDocument()
    const policyDialog = screen
      .getByRole('heading', { name: 'Nueva póliza' })
      .closest('dialog')
    expect(policyDialog).not.toBeNull()
    expect(within(policyDialog!).getByLabelText(/Cliente/)).toBeDisabled()
  })
})
