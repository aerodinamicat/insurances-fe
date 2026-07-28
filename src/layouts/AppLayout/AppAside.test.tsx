import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { fetchMyProfile } from '../../api/users'
import type { UserResponse } from '../../api/types'
import { useAuth } from '../../auth'
import type { AuthContextValue } from '../../auth/types'
import { ProcedureLauncherProvider } from '../ProcedureLauncher/ProcedureLauncherProvider'
import { useCustomers } from '../../pages/Catalog/Customers/useCustomers'
import { AppAside } from './AppAside'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(),
  EDITOR_RANK: 2,
  RoleGate: ({
    children,
    role,
  }: {
    children: React.ReactNode
    role?: string
  }) => {
    const { role: userRole } = useAuth()
    if (role && userRole !== role) {
      return null
    }
    return <>{children}</>
  },
}))

vi.mock('../../api/users', () => ({
  fetchMyProfile: vi.fn(),
}))

vi.mock('../../pages/Catalog/Customers/useCustomers', () => ({
  useCustomers: vi.fn(),
}))

const useAuthMock = vi.mocked(useAuth)
const fetchMyProfileMock = vi.mocked(fetchMyProfile)
const useCustomersMock = vi.mocked(useCustomers)

const editorAuth: AuthContextValue = {
  user: { id: 'user-1', email: 'editor@example.com' },
  role: 'Editor',
  roleRank: 2,
  isAuthenticated: true,
  isLoading: false,
  token: 'token',
  mustChangePassword: false,
  login: vi.fn(),
  logout: vi.fn(),
  loadSessionFromStorage: vi.fn(),
  changePasswordByToken: vi.fn(),
}

const profileFixture: UserResponse = {
  id: 'user-1',
  email: 'editor@example.com',
  firstName: 'Ana',
  lastName: 'López',
  confirmedEmailAt: '2024-01-01T00:00:00.000Z',
  mustChangePassword: false,
  lastLoginAt: null,
  hasActiveSession: false,
  activeSessionCount: 0,
  loginDisabled: false,
  roleCode: 'Editor',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

function renderAside(initialPath = '/catalog/customers') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ProcedureLauncherProvider>
        <AppAside />
      </ProcedureLauncherProvider>
    </MemoryRouter>,
  )
}

describe('AppAside', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue(editorAuth)
    fetchMyProfileMock.mockResolvedValue(profileFixture)
    useCustomersMock.mockReturnValue({
      customers: [],
      isLoading: false,
      loadError: null,
      reload: vi.fn(),
      upsertCustomer: vi.fn(),
      removeCustomer: vi.fn(),
    })
  })

  it('shows only the product brand at the top', async () => {
    renderAside()

    const brand = document.querySelector('.app-aside__brand')
    expect(brand).toBeTruthy()
    expect(within(brand!).getByText('Insurances')).toBeInTheDocument()
    expect(within(brand!).queryByText('editor@example.com')).not.toBeInTheDocument()
    await screen.findByRole('link', { name: /Ana López/ })
  })

  it('does not render a standalone Mi perfil nav item', () => {
    renderAside()

    expect(
      screen.queryByRole('link', { name: 'Mi perfil' }),
    ).not.toBeInTheDocument()
  })

  it('orders sections as procedures, catalog, backoffice for admins', async () => {
    useAuthMock.mockReturnValue({
      ...editorAuth,
      role: 'Admin',
      roleRank: 4,
    })
    fetchMyProfileMock.mockResolvedValue({
      ...profileFixture,
      roleCode: 'Admin',
    })
    renderAside()

    const nav = screen.getByRole('navigation')
    const labels = within(nav)
      .getAllByText(/Procedimientos|Catálogo|Backoffice/)
      .map((node) => node.textContent)

    expect(labels).toEqual(['Procedimientos', 'Catálogo', 'Backoffice'])
  })

  it('renders a clickable account block with profile name and role', async () => {
    renderAside()

    const accountLink = await screen.findByRole('link', { name: /Ana López/ })

    expect(accountLink).toHaveAttribute('href', '/profile')
    expect(within(accountLink).getByText('Editor')).toBeInTheDocument()
  })

  it('keeps logout below the account block', async () => {
    renderAside()

    await screen.findByRole('link', { name: /Ana López/ })
    const footer = screen.getByRole('button', { name: 'Cerrar sesión' }).parentElement

    expect(footer).toBeTruthy()
    expect(
      within(footer!).getByRole('link', { name: /Ana López/ }),
    ).toBeInTheDocument()
    expect(
      within(footer!).getByRole('button', { name: 'Cerrar sesión' }),
    ).toBeInTheDocument()
  })
})
