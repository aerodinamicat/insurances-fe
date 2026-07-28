import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import { useAuth } from '../../auth'
import type { AuthContextValue } from '../../auth/types'
import { ApiError } from '../../api/client'
import { renderWithRouter } from '../../test/renderWithRouter'
import { ChangePasswordPage } from './ChangePasswordPage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(),
}))

const useAuthMock = vi.mocked(useAuth)

function createAuthMock(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    token: null,
    user: null,
    isAuthenticated: false,
    mustChangePassword: false,
    role: null,
    roleRank: null,
    isLoading: false,
    login: vi.fn(),
    changePasswordByToken: vi.fn(),
    logout: vi.fn(),
    loadSessionFromStorage: vi.fn(),
    ...overrides,
  }
}

function renderChangePasswordPage(token?: string) {
  const search = token ? `?token=${encodeURIComponent(token)}` : ''

  return renderWithRouter(<ChangePasswordPage />, {
    initialEntries: [`/change-password${search}`],
    path: '/change-password',
  })
}

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue(createAuthMock())
  })

  it('shows error when token is missing', () => {
    renderChangePasswordPage()

    expect(
      screen.getByText(
        'This password reset link is invalid or incomplete. Open the link from your email.',
      ),
    ).toBeInTheDocument()
  })

  it('blocks submit when password validation fails', async () => {
    const changePasswordByToken = vi.fn()
    useAuthMock.mockReturnValue(createAuthMock({ changePasswordByToken }))
    const user = userEvent.setup()

    renderChangePasswordPage('reset-token')

    await user.type(screen.getByLabelText(/^New password/), 'short')
    await user.type(screen.getByLabelText(/^Confirm password/), 'short')
    await user.click(screen.getByRole('button', { name: 'Save password' }))

    expect(
      await screen.findByText('Password must be at least 8 characters.'),
    ).toBeInTheDocument()
    expect(changePasswordByToken).not.toHaveBeenCalled()
  })

  it('blocks submit when passwords do not match', async () => {
    const changePasswordByToken = vi.fn()
    useAuthMock.mockReturnValue(createAuthMock({ changePasswordByToken }))
    const user = userEvent.setup()

    renderChangePasswordPage('reset-token')

    await user.type(screen.getByLabelText(/^New password/), 'validpass1')
    await user.type(screen.getByLabelText(/^Confirm password/), 'validpass2')
    await user.click(screen.getByRole('button', { name: 'Save password' }))

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument()
    expect(changePasswordByToken).not.toHaveBeenCalled()
  })

  it('disables submit while the request is in flight', async () => {
    let resolveSubmit: ((value: unknown) => void) | undefined
    const changePasswordByToken = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve
        }),
    )
    useAuthMock.mockReturnValue(createAuthMock({ changePasswordByToken }))
    const user = userEvent.setup()

    renderChangePasswordPage('reset-token')

    await user.type(screen.getByLabelText(/^New password/), 'validpass1')
    await user.type(screen.getByLabelText(/^Confirm password/), 'validpass1')
    await user.click(screen.getByRole('button', { name: 'Save password' }))

    expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled()
    expect(changePasswordByToken).toHaveBeenCalledWith('reset-token', 'validpass1')

    resolveSubmit?.({
      message: 'Contraseña cambiada con éxito.',
    })

    await waitFor(() => {
      expect(screen.getByText('Contraseña cambiada con éxito.')).toBeInTheDocument()
    })
    expect(
      screen.getByText(
        /Todas sus sesiones han sido cerradas. Será redirigido automáticamente a login/i,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Redirección en 5 segundos.')).toBeInTheDocument()
  })

  it('shows API error when password change fails', async () => {
    const changePasswordByToken = vi.fn().mockRejectedValue(
      new ApiError('Reset link expired.', 401),
    )
    useAuthMock.mockReturnValue(createAuthMock({ changePasswordByToken }))
    const user = userEvent.setup()

    renderChangePasswordPage('reset-token')

    await user.type(screen.getByLabelText(/^New password/), 'validpass1')
    await user.type(screen.getByLabelText(/^Confirm password/), 'validpass1')
    await user.click(screen.getByRole('button', { name: 'Save password' }))

    expect(await screen.findByText('Reset link expired.')).toBeInTheDocument()
  })
})
