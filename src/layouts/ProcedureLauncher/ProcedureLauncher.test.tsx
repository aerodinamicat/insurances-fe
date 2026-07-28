import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import {
  createContact,
  createCustomer,
  createInsurancePolicy,
  fetchAssuranceCompanies,
  updateInsurancePolicy,
  uploadAttachment,
} from '../../api/catalog'
import type {
  AssuranceCompanyResponse,
  ContactResponse,
  CustomerResponse,
  InsurancePolicyResponse,
} from '../../api/catalog'
import { useAuth } from '../../auth'
import type { AuthContextValue } from '../../auth/types'
import { AppAside } from '../AppLayout/AppAside'
import { ProcedureLauncherProvider } from './ProcedureLauncherProvider'
import { useProcedureLauncher } from './useProcedureLauncher'
import { useCustomers } from '../../pages/Catalog/Customers/useCustomers'
import { fetchMyProfile } from '../../api/users'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../../auth', () => ({
  useAuth: vi.fn(),
  EDITOR_RANK: 2,
  RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../../pages/Catalog/Customers/useCustomers', () => ({
  useCustomers: vi.fn(),
}))

vi.mock('../../api/users', () => ({
  fetchMyProfile: vi.fn(),
}))

vi.mock('../../api/catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/catalog')>()
  return {
    ...actual,
    createCustomer: vi.fn(),
    createContact: vi.fn(),
    uploadAttachment: vi.fn(),
    fetchAssuranceCompanies: vi.fn(),
    createInsurancePolicy: vi.fn(),
    updateInsurancePolicy: vi.fn(),
  }
})

const useAuthMock = vi.mocked(useAuth)
const useCustomersMock = vi.mocked(useCustomers)
const fetchMyProfileMock = vi.mocked(fetchMyProfile)
const createCustomerMock = vi.mocked(createCustomer)
const createContactMock = vi.mocked(createContact)
const fetchAssuranceCompaniesMock = vi.mocked(fetchAssuranceCompanies)
const createInsurancePolicyMock = vi.mocked(createInsurancePolicy)
const uploadAttachmentMock = vi.mocked(uploadAttachment)
const updateInsurancePolicyMock = vi.mocked(updateInsurancePolicy)

const editorAuth: AuthContextValue = {
  user: { email: 'editor@example.com' },
  role: 'Editor',
  roleRank: 2,
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
}

const viewerAuth: AuthContextValue = {
  user: { email: 'viewer@example.com' },
  role: 'Viewer',
  roleRank: 1,
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
}

const createdCustomer: CustomerResponse = {
  id: 'customer-procedure',
  alias: 'Ana López',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  type: 'Particular',
  taxId: '12345678Z',
  firstName: 'Ana',
  lastName: 'López',
  birthAt: '1990-01-01',
  age: 36,
  biologicalGender: 'Femenino',
  maritalStatus: null,
  cnae: null,
  businessName: null,
  tradeName: null,
}

const createdContact: ContactResponse = {
  id: 'contact-procedure',
  alias: 'contact-procedure',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  customerId: 'customer-procedure',
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
}

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

const createdPolicy: InsurancePolicyResponse = {
  id: 'policy-procedure',
  alias: 'policy-procedure',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  identifierId: 'POL-PROC',
  branch: 'Hogar',
  effectiveAt: '2024-06-01',
  nextRenewalAt: '2025-06-01',
  cancelledAt: null,
  cancellationReason: null,
  customerId: 'customer-1',
  assuranceCompanyId: 'company-1',
  attachedContractId: null,
  status: 'Vigente',
}

function renderLauncher(ui: React.ReactNode) {
  return render(
    <MemoryRouter>
      <ProcedureLauncherProvider>{ui}</ProcedureLauncherProvider>
    </MemoryRouter>,
  )
}

function LauncherHarness() {
  const { openCustomerOnboarding, openPolicyOnboarding } = useProcedureLauncher()

  return (
    <div>
      <button type="button" onClick={openCustomerOnboarding}>
        Launch customer
      </button>
      <button type="button" onClick={openPolicyOnboarding}>
        Launch policy
      </button>
    </div>
  )
}

async function completeCustomerWizard(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Nombre/), 'Ana')
  await user.type(screen.getByLabelText(/^Apellidos/), 'López')
  await user.type(screen.getByLabelText(/^Fecha de nacimiento/), '1990-01-01')
  await user.selectOptions(
    screen.getByLabelText(/^Sexo biológico/),
    'Femenino',
  )
  await user.type(screen.getByLabelText(/^Identificador fiscal/), '12345678Z')
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await screen.findByText(/Añade al menos un contacto/)
  await user.clear(screen.getByLabelText(/^Teléfono/))
  await user.type(screen.getByLabelText(/^Teléfono/), '612345678')
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await user.click(screen.getByRole('button', { name: 'Finalizar' }))
}

function createPdfFile(name = 'contract.pdf') {
  return new File(['pdf-content'], name, { type: 'application/pdf' })
}

async function selectComboboxOption(
  user: ReturnType<typeof userEvent.setup>,
  label: RegExp,
  optionName: string,
) {
  const input = screen.getByRole('combobox', { name: label })
  await user.click(input)
  const option = screen.getByRole('option', { name: new RegExp(optionName) })
  await user.click(within(option).getByRole('button'))
}

async function completePolicyWizard(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => {
    expect(screen.getByRole('combobox', { name: /^Cliente/ })).toBeEnabled()
  })

  await selectComboboxOption(user, /^Cliente/, 'Juan Pérez')
  await selectComboboxOption(user, /^Aseguradora/, 'Aseguradora Demo')
  await user.selectOptions(screen.getByLabelText(/^Ramo/), 'Hogar')
  await user.type(screen.getByLabelText(/^Identificador de póliza/), 'POL-PROC')
  await user.type(screen.getByLabelText(/^Fecha de efecto/), '2024-06-01')
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await screen.findByText(/Este documento es obligatorio/)
  await user.type(screen.getByLabelText(/^Código/), 'CONTRACT001')
  await user.upload(screen.getByLabelText(/^Archivo/), createPdfFile())
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await user.click(screen.getByRole('button', { name: 'Finalizar' }))
}

describe('ProcedureLauncher', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    useAuthMock.mockReturnValue(editorAuth)
    fetchMyProfileMock.mockResolvedValue({
      id: 'user-1',
      email: 'editor@example.com',
      firstName: 'Ana',
      lastName: 'López',
      confirmedEmailAt: null,
      mustChangePassword: false,
      roleCode: 'Editor',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    })
    useCustomersMock.mockReturnValue({
      customers: [customerFixture],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertCustomer: vi.fn(),
      removeCustomer: vi.fn(),
    })
    createCustomerMock.mockReset()
    createContactMock.mockReset()
    fetchAssuranceCompaniesMock.mockReset()
    createInsurancePolicyMock.mockReset()
    uploadAttachmentMock.mockReset()
    updateInsurancePolicyMock.mockReset()
    createCustomerMock.mockResolvedValue(createdCustomer)
    createContactMock.mockResolvedValue(createdContact)
    fetchAssuranceCompaniesMock.mockResolvedValue([companyFixture])
    createInsurancePolicyMock.mockResolvedValue(createdPolicy)
    uploadAttachmentMock.mockResolvedValue({
      id: 'attachment-contract',
      alias: 'attachment-contract',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      customerId: null,
      insurancePolicyId: 'policy-procedure',
      insuredAssetId: null,
      documentType: 'CONTRATOPOLIZA',
      documentCode: 'CONTRACT001',
      issuedAt: null,
      expiredAt: null,
      fileName: 'contract.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 10,
    })
    updateInsurancePolicyMock.mockResolvedValue({
      ...createdPolicy,
      attachedContractId: 'attachment-contract',
    })
  })

  it('opens the customer wizard from the launcher without navigation', async () => {
    const user = userEvent.setup()
    renderLauncher(<LauncherHarness />)

    await user.click(screen.getByRole('button', { name: 'Launch customer' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nuevo cliente' })).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('closes the customer wizard on cancel without navigation', async () => {
    const user = userEvent.setup()
    renderLauncher(<LauncherHarness />)

    await user.click(screen.getByRole('button', { name: 'Launch customer' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('redirects to the customer detail page after success', async () => {
    const user = userEvent.setup()
    renderLauncher(<LauncherHarness />)

    await user.click(screen.getByRole('button', { name: 'Launch customer' }))
    await completeCustomerWizard(user)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(
        '/catalog/customers/customer-procedure',
      )
    })
  })

  it('opens the policy wizard once catalog options are loaded', async () => {
    const user = userEvent.setup()
    renderLauncher(<LauncherHarness />)

    await user.click(screen.getByRole('button', { name: 'Launch policy' }))

    expect(
      await screen.findByRole('heading', { name: 'Nueva póliza' }),
    ).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('redirects to the policy detail page after success', async () => {
    const user = userEvent.setup()
    renderLauncher(<LauncherHarness />)

    await user.click(screen.getByRole('button', { name: 'Launch policy' }))
    await screen.findByRole('heading', { name: 'Nueva póliza' })
    await completePolicyWizard(user)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(
        '/catalog/insurance-policies/policy-procedure',
      )
    })
  })
})

describe('AppAside procedures', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    useAuthMock.mockReturnValue(editorAuth)
    fetchMyProfileMock.mockResolvedValue({
      id: 'user-1',
      email: 'editor@example.com',
      firstName: 'Ana',
      lastName: 'López',
      confirmedEmailAt: null,
      mustChangePassword: false,
      roleCode: 'Editor',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    })
    useCustomersMock.mockReturnValue({
      customers: [],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertCustomer: vi.fn(),
      removeCustomer: vi.fn(),
    })
  })

  it('shows procedure buttons for editors', () => {
    renderLauncher(<AppAside />)

    expect(
      screen.getByRole('button', { name: 'Alta de cliente' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Alta de póliza' }),
    ).toBeInTheDocument()
  })

  it('hides procedure buttons for viewers', () => {
    useAuthMock.mockReturnValue(viewerAuth)
    renderLauncher(<AppAside />)

    expect(
      screen.queryByRole('button', { name: 'Alta de cliente' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Alta de póliza' }),
    ).not.toBeInTheDocument()
  })

  it('opens the customer wizard from the aside without navigation', async () => {
    const user = userEvent.setup()
    renderLauncher(<AppAside />)

    await user.click(screen.getByRole('button', { name: 'Alta de cliente' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nuevo cliente' })).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
