import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ContactResponse, CustomerResponse } from '../../../api/catalog'
import { useAuth } from '../../../auth'
import type { AuthContextValue } from '../../../auth/types'
import { GOOGLE_MAPS_SEARCH_BASE_URL } from '../../../utils/gps'
import { useCustomers } from '../Customers/useCustomers'
import { ContactsPage } from './ContactsPage'
import { useContacts } from './useContacts'

vi.mock('../../../auth', () => ({
  useAuth: vi.fn(),
  EDITOR_RANK: 2,
  RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('./useContacts', () => ({
  useContacts: vi.fn(),
}))

vi.mock('../Customers/useCustomers', () => ({
  useCustomers: vi.fn(),
}))

const useAuthMock = vi.mocked(useAuth)
const useContactsMock = vi.mocked(useContacts)
const useCustomersMock = vi.mocked(useCustomers)

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

function createContact(
  overrides: Partial<ContactResponse> = {},
): ContactResponse {
  return {
    id: 'contact-1',
    alias: 'contact-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    customerId: 'customer-1',
    type: 'Personal',
    reference: null,
    phoneNumber: '+34612345678',
    email: null,
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

describe('ContactsPage address and map columns', () => {
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
    useContactsMock.mockReturnValue({
      contacts: [],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertContact: vi.fn(),
      removeContact: vi.fn(),
    })
  })

  it('renders a formatted structured address in the table', () => {
    useContactsMock.mockReturnValue({
      contacts: [
        createContact({
          streetType: 'Calle',
          streetName: 'Mayor',
          streetNumber: '12',
          postalCode: '28001',
          city: 'Madrid',
        }),
      ],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertContact: vi.fn(),
      removeContact: vi.fn(),
    })

    render(<ContactsPage />)

    expect(screen.getByText('Calle Mayor, 12 (28001)')).toBeInTheDocument()
    expect(screen.queryByText(/Madrid/)).not.toBeInTheDocument()
  })

  it('opens Google Maps in a new tab when GPS coordinates are valid', () => {
    useContactsMock.mockReturnValue({
      contacts: [
        createContact({
          gpsCoordinates: '36.77054659512445,-2.814060952500045',
        }),
      ],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertContact: vi.fn(),
      removeContact: vi.fn(),
    })

    render(<ContactsPage />)

    const mapLink = screen.getByRole('link', { name: 'Visualizar' })
    expect(mapLink).toHaveAttribute(
      'href',
      `${GOOGLE_MAPS_SEARCH_BASE_URL}&query=${encodeURIComponent('36.77054659512445,-2.814060952500045')}`,
    )
    expect(mapLink).toHaveAttribute('target', '_blank')
    expect(mapLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows a non-actionable map cell when GPS coordinates are missing', () => {
    useContactsMock.mockReturnValue({
      contacts: [createContact()],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertContact: vi.fn(),
      removeContact: vi.fn(),
    })

    render(<ContactsPage />)

    expect(screen.queryByRole('link', { name: 'Visualizar' })).not.toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('disables the map action for invalid GPS coordinates', () => {
    useContactsMock.mockReturnValue({
      contacts: [
        createContact({
          gpsCoordinates: 'invalid-gps',
        }),
      ],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertContact: vi.fn(),
      removeContact: vi.fn(),
    })

    render(<ContactsPage />)

    const disabledMapButton = document.querySelector(
      '.catalog-table-action-btn:disabled',
    )
    expect(disabledMapButton).not.toBeNull()
    expect(disabledMapButton).toHaveTextContent('Visualizar')
    expect(screen.queryByRole('link', { name: 'Visualizar' })).not.toBeInTheDocument()
  })
})
