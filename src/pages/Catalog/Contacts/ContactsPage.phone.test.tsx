import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ContactResponse, CustomerResponse } from '../../../api/catalog'
import { useAuth } from '../../../auth'
import type { AuthContextValue } from '../../../auth/types'
import { NEUTRAL_COUNTRY_LABEL } from '../../../utils/phone'
import { countryCodeToFlagEmoji } from '../../../utils/phone/phone-flags'
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

function createContact(phoneNumber: string): ContactResponse {
  return {
    id: `contact-${phoneNumber}`,
    alias: `contact-${phoneNumber}`,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    customerId: 'customer-1',
    type: 'Personal',
    reference: null,
    phoneNumber,
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

describe('ContactsPage phone presentation', () => {
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

  it('renders Spanish numbers with flag, prefix and accessible label', () => {
    useContactsMock.mockReturnValue({
      contacts: [createContact('+34612345678')],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertContact: vi.fn(),
      removeContact: vi.fn(),
    })

    render(<ContactsPage />)

    const phoneCell = screen.getByLabelText(/España.*\+34/i)
    expect(phoneCell).toBeInTheDocument()
    expect(phoneCell).toHaveTextContent(countryCodeToFlagEmoji('ES'))
    expect(phoneCell).toHaveTextContent('+34')
  })

  it('renders international numbers with country context when inferable', () => {
    useContactsMock.mockReturnValue({
      contacts: [createContact('+351912345678')],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertContact: vi.fn(),
      removeContact: vi.fn(),
    })

    render(<ContactsPage />)

    const phoneCell = screen.getByLabelText(/Portugal.*\+351/i)
    expect(phoneCell).toBeInTheDocument()
    expect(phoneCell).toHaveTextContent(countryCodeToFlagEmoji('PT'))
  })

  it('uses a neutral label for ambiguous international prefixes', () => {
    useContactsMock.mockReturnValue({
      contacts: [createContact('+8821612345678')],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertContact: vi.fn(),
      removeContact: vi.fn(),
    })

    render(<ContactsPage />)

    const phoneCell = screen.getByLabelText(
      new RegExp(`${NEUTRAL_COUNTRY_LABEL}.*\\+882`, 'i'),
    )
    expect(phoneCell).toHaveTextContent(NEUTRAL_COUNTRY_LABEL)
    expect(phoneCell).toHaveTextContent('+882')
  })

  it('shows unrecognized values without breaking the table', () => {
    useContactsMock.mockReturnValue({
      contacts: [createContact('not-a-phone')],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertContact: vi.fn(),
      removeContact: vi.fn(),
    })

    render(<ContactsPage />)

    expect(screen.getByLabelText(/Teléfono no reconocido: not-a-phone/i)).toBeInTheDocument()
    expect(screen.getByText('not-a-phone')).toBeInTheDocument()
    expect(screen.getByText('Formato no reconocido')).toBeInTheDocument()
  })
})
