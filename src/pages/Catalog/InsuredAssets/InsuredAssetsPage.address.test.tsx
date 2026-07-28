import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  AssuranceCompanyResponse,
  CustomerResponse,
  InsuredAssetResponse,
  InsurancePolicyResponse,
} from '../../../api/catalog'
import { useAuth } from '../../../auth'
import type { AuthContextValue } from '../../../auth/types'
import { GOOGLE_MAPS_SEARCH_BASE_URL } from '../../../utils/gps'
import { useCustomers } from '../Customers/useCustomers'
import { useInsurancePolicies } from '../InsurancePolicies/useInsurancePolicies'
import { InsuredAssetsPage } from './InsuredAssetsPage'
import { getInsuredAssetDetailInlineText } from './insured-asset-detail-utils'
import { useInsuredAssets } from './useInsuredAssets'

vi.mock('../../../auth', () => ({
  useAuth: vi.fn(),
  EDITOR_RANK: 2,
  RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('./useInsuredAssets', () => ({
  useInsuredAssets: vi.fn(),
}))

vi.mock('../Customers/useCustomers', () => ({
  useCustomers: vi.fn(),
}))

vi.mock('../InsurancePolicies/useInsurancePolicies', () => ({
  useInsurancePolicies: vi.fn(),
}))

vi.mock('../../../api/catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/catalog')>()
  return {
    ...actual,
    fetchAssuranceCompanies: vi.fn().mockResolvedValue([]),
  }
})

const useAuthMock = vi.mocked(useAuth)
const useInsuredAssetsMock = vi.mocked(useInsuredAssets)
const useCustomersMock = vi.mocked(useCustomers)
const useInsurancePoliciesMock = vi.mocked(useInsurancePolicies)

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

const policyFixture: InsurancePolicyResponse = {
  id: 'policy-1',
  alias: 'policy-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  identifierId: 'POL-001',
  branch: 'Multirriesgo',
  effectiveAt: '2024-01-01',
  nextRenewalAt: '2025-01-01',
  cancelledAt: null,
  cancellationReason: null,
  customerId: 'customer-1',
  assuranceCompanyId: 'company-1',
  attachedContractId: null,
  status: 'Vigente',
}

function createAsset(
  overrides: Partial<InsuredAssetResponse> = {},
): InsuredAssetResponse {
  return {
    id: 'asset-1',
    alias: '',
    aliasDetail: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    insurancePolicyId: 'policy-1',
    type: 'Inmueble',
    insuredSum: '1000',
    currency: 'EUR',
    plateNumber: null,
    brand: null,
    model: null,
    motor: null,
    color: null,
    vinNumber: null,
    manufacturedAt: null,
    streetType: 'Calle',
    streetName: 'Mayor',
    streetNumber: '12',
    building: null,
    stairs: null,
    floor: null,
    door: null,
    postalCode: '28001',
    city: 'Madrid',
    region: null,
    gpsCoordinates: null,
    area: 120,
    builtAt: '2010-05-01',
    block: null,
    parcel: null,
    sowedAt: null,
    crop: null,
    insuredProduction: null,
    customerIds: null,
    ...overrides,
  }
}

function createAuthMock(): AuthContextValue {
  return {
    token: 'jwt-token',
    user: { id: 'user-1', email: 'user@example.com' },
    isAuthenticated: true,
    mustChangePassword: false,
    role: 'editor',
    roleRank: 2,
    isLoading: false,
    login: vi.fn(),
    changePasswordByToken: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    loadSessionFromStorage: vi.fn(),
  }
}

describe('InsuredAssetsPage detail column', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue(createAuthMock())
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
    useInsuredAssetsMock.mockReturnValue({
      assets: [],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertAsset: vi.fn(),
      removeAsset: vi.fn(),
    })
  })

  it('renders structured address in detail and map action in its own column', async () => {
    useInsuredAssetsMock.mockReturnValue({
      assets: [
        createAsset({
          gpsCoordinates: '40.42,-3.70',
        }),
      ],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertAsset: vi.fn(),
      removeAsset: vi.fn(),
    })

    render(<InsuredAssetsPage />)

    const asset = createAsset({ gpsCoordinates: '40.42,-3.70' })
    const expectedDetail = getInsuredAssetDetailInlineText(
      asset,
      () => customerFixture.alias,
    )

    expect(await screen.findByText(expectedDetail!)).toBeInTheDocument()

    const mapLink = screen.getByRole('link', { name: 'Visualizar' })
    expect(mapLink).toHaveAttribute(
      'href',
      `${GOOGLE_MAPS_SEARCH_BASE_URL}&query=${encodeURIComponent('40.42,-3.70')}`,
    )
    expect(mapLink).toHaveAttribute('target', '_blank')
  })

  it('renders automóvil detail without map link', async () => {
    useInsuredAssetsMock.mockReturnValue({
      assets: [
        createAsset({
          type: 'Automóvil',
          plateNumber: '1234ABC',
          brand: 'Seat',
          model: 'Ibiza',
          color: 'Rojo',
          streetType: null,
          streetName: null,
          streetNumber: null,
          postalCode: null,
          city: null,
          gpsCoordinates: '40.42,-3.70',
        }),
      ],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertAsset: vi.fn(),
      removeAsset: vi.fn(),
    })

    render(<InsuredAssetsPage />)

    expect(await screen.findByText('1234ABC · Seat · Ibiza · Rojo')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Visualizar' })).not.toBeInTheDocument()
    expect(screen.queryByText('Superficie:')).not.toBeInTheDocument()
  })
})
