import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  AssuranceCompanyResponse,
  CustomerResponse,
  InsurancePolicyResponse,
} from '../../../api/catalog'
import { fetchAssuranceCompanies } from '../../../api/catalog'
import { useAuth } from '../../../auth'
import type { AuthContextValue } from '../../../auth/types'
import { useCustomers } from '../Customers/useCustomers'
import { InsurancePoliciesPage } from './InsurancePoliciesPage'
import { useInsurancePolicies } from './useInsurancePolicies'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../../../auth', () => ({
  useAuth: vi.fn(),
  EDITOR_RANK: 2,
  RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../Customers/useCustomers', () => ({
  useCustomers: vi.fn(),
}))

vi.mock('./useInsurancePolicies', () => ({
  useInsurancePolicies: vi.fn(),
}))

vi.mock('../../../api/catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/catalog')>()
  return {
    ...actual,
    fetchAssuranceCompanies: vi.fn(),
  }
})

const useAuthMock = vi.mocked(useAuth)
const useCustomersMock = vi.mocked(useCustomers)
const useInsurancePoliciesMock = vi.mocked(useInsurancePolicies)
const fetchAssuranceCompaniesMock = vi.mocked(fetchAssuranceCompanies)

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

const companyFixture: AssuranceCompanyResponse = {
  id: 'company-1',
  alias: 'Alias aseguradora',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  businessName: 'Aseguradora Demo',
  tradeName: null,
  taxId: 'A12345678',
}

function createAuthMock(roleRank: number): AuthContextValue {
  return {
    token: 'jwt-token',
    user: { id: 'user-1', email: 'user@example.com' },
    isAuthenticated: true,
    mustChangePassword: false,
    role: roleRank >= 2 ? 'editor' : 'viewer',
    roleRank,
    isLoading: false,
    login: vi.fn(),
    changePasswordByToken: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    loadSessionFromStorage: vi.fn(),
  }
}

describe('InsurancePoliciesPage navigation actions', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    useCustomersMock.mockReturnValue({
      customers: [customerFixture],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertCustomer: vi.fn(),
      removeCustomer: vi.fn(),
    })
    useInsurancePoliciesMock.mockReturnValue({
      policies: [policyFixture],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertPolicy: vi.fn(),
      removePolicy: vi.fn(),
    })
    fetchAssuranceCompaniesMock.mockResolvedValue([companyFixture])
  })

  it('navigates to detail via Ver action without link in identifier cell', async () => {
    useAuthMock.mockReturnValue(createAuthMock(1))
    const user = userEvent.setup()
    render(<InsurancePoliciesPage />)

    expect(await screen.findByText('POL-001')).toBeInTheDocument()
    expect(screen.getByText('POL-001').closest('a')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Ver' }))

    expect(navigateMock).toHaveBeenCalledWith(
      '/catalog/insurance-policies/policy-1',
    )
  })

  it('renders the assurance company virtual alias', async () => {
    useAuthMock.mockReturnValue(createAuthMock(1))
    render(<InsurancePoliciesPage />)

    expect(await screen.findByText('Alias aseguradora')).toHaveAttribute(
      'title',
      'Alias aseguradora',
    )
    expect(screen.queryByText('Aseguradora Demo')).not.toBeInTheDocument()
  })

  it('shows only Ver for viewers and full actions for editors', async () => {
    useAuthMock.mockReturnValue(createAuthMock(1))
    const { unmount } = render(<InsurancePoliciesPage />)

    expect(await screen.findByRole('button', { name: 'Ver' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Borrar' })).not.toBeInTheDocument()

    unmount()
    useAuthMock.mockReturnValue(createAuthMock(2))
    render(<InsurancePoliciesPage />)

    expect(await screen.findByRole('button', { name: 'Ver' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Borrar' })).toBeInTheDocument()
  })
})
