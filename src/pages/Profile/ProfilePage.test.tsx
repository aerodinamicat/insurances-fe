import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import {
  changeProfilePassword,
  requestProfileEmailChange,
  verifyCurrentPassword,
} from '../../api/auth.api'
import { ApiError } from '../../api/client'
import { checkUserEmailAvailability, fetchMyProfile } from '../../api/users'
import type { UserResponse } from '../../api/types'
import { useAuth } from '../../auth'
import type { AuthContextValue } from '../../auth/types'
import { renderWithRouter } from '../../test/renderWithRouter'
import { ProfilePage } from './ProfilePage'

vi.mock('../../auth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../api/users', () => ({
  checkUserEmailAvailability: vi.fn(),
  fetchMyProfile: vi.fn(),
}))

vi.mock('../../api/auth.api', () => ({
  changeProfilePassword: vi.fn(),
  requestProfileEmailChange: vi.fn(),
  verifyCurrentPassword: vi.fn(),
}))

const useAuthMock = vi.mocked(useAuth)
const checkUserEmailAvailabilityMock = vi.mocked(checkUserEmailAvailability)
const fetchMyProfileMock = vi.mocked(fetchMyProfile)
const changeProfilePasswordMock = vi.mocked(changeProfilePassword)
const requestProfileEmailChangeMock = vi.mocked(requestProfileEmailChange)
const verifyCurrentPasswordMock = vi.mocked(verifyCurrentPassword)

const profileFixture: UserResponse = {
  id: 'user-1',
  email: 'user@example.com',
  firstName: 'Test',
  lastName: 'User',
  confirmedEmailAt: '2024-06-01T10:00:00.000Z',
  mustChangePassword: false,
  lastLoginAt: '2024-06-01T10:00:00.000Z',
  hasActiveSession: true,
  activeSessionCount: 1,
  loginDisabled: false,
  roleCode: 'admin',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-06-01T10:00:00.000Z',
}

function createAuthMock(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    token: 'jwt-token',
    user: { id: 'user-1', email: 'user@example.com' },
    isAuthenticated: true,
    mustChangePassword: false,
    role: 'admin',
    roleRank: 100,
    isLoading: false,
    login: vi.fn(),
    changePasswordByToken: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    loadSessionFromStorage: vi.fn(),
    ...overrides,
  }
}

function renderProfilePage() {
  return renderWithRouter(<ProfilePage />, {
    initialEntries: ['/profile'],
    path: '/profile',
  })
}

describe('ProfilePage', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue(createAuthMock())
    checkUserEmailAvailabilityMock.mockReset()
    checkUserEmailAvailabilityMock.mockResolvedValue({ available: true })
    fetchMyProfileMock.mockResolvedValue(profileFixture)
    changeProfilePasswordMock.mockReset()
    requestProfileEmailChangeMock.mockReset()
    verifyCurrentPasswordMock.mockReset()
    verifyCurrentPasswordMock.mockResolvedValue(undefined)
  })

  it('shows change email before change password', async () => {
    renderProfilePage()

    await screen.findByText('user@example.com')

    const emailTitle = screen.getByRole('heading', { name: 'Change email' })
    const passwordTitle = screen.getByRole('heading', { name: 'Change password' })

    expect(
      emailTitle.compareDocumentPosition(passwordTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('requires current password before requesting a password change link', async () => {
    const user = userEvent.setup()

    renderProfilePage()

    await screen.findByText('user@example.com')

    await user.click(screen.getByRole('button', { name: 'Send password change link' }))

    expect(await screen.findByText('Current password is required.')).toBeInTheDocument()
    expect(changeProfilePasswordMock).not.toHaveBeenCalled()
  })

  it('shows current password error on 401 when requesting a password change link', async () => {
    verifyCurrentPasswordMock.mockRejectedValue(
      new ApiError('Current password is incorrect.', 401),
    )
    const user = userEvent.setup()

    renderProfilePage()

    await screen.findByText('user@example.com')

    const currentPasswordInput = document.getElementById('profile-current-password')
    expect(currentPasswordInput).not.toBeNull()
    await user.type(currentPasswordInput!, 'wrong-pass')
    await user.click(screen.getByRole('button', { name: 'Send password change link' }))

    expect(
      await screen.findByText('Current password is incorrect.'),
    ).toBeInTheDocument()
    expect(changeProfilePasswordMock).not.toHaveBeenCalled()
  })

  it('shows a confirmation modal before requesting a password change link', async () => {
    changeProfilePasswordMock.mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderProfilePage()

    await screen.findByText('user@example.com')

    const currentPasswordInput = document.getElementById('profile-current-password')
    expect(currentPasswordInput).not.toBeNull()
    await user.type(currentPasswordInput!, 'correct-pass')
    await user.click(screen.getByRole('button', { name: 'Send password change link' }))

    expect(
      await screen.findByRole('dialog', { name: 'Confirm action' }),
    ).toBeInTheDocument()
    expect(verifyCurrentPasswordMock).toHaveBeenCalledWith({
      currentPassword: 'correct-pass',
    })
    expect(changeProfilePasswordMock).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    await waitFor(() => {
      expect(changeProfilePasswordMock).toHaveBeenCalledWith({
        currentPassword: 'correct-pass',
      })
    })
    expect(
      await screen.findByText(
        'A password change link was sent to your current email address.',
      ),
    ).toBeInTheDocument()
  })

  it('requires current password before requesting email change', async () => {
    const user = userEvent.setup()

    renderProfilePage()

    await screen.findByText('user@example.com')

    await user.type(screen.getByLabelText('New email'), 'new@example.com')
    await user.click(screen.getByRole('button', { name: 'Request email change' }))

    expect(await screen.findByText('Current password is required.')).toBeInTheDocument()
    expect(requestProfileEmailChangeMock).not.toHaveBeenCalled()
  })

  it('shows current password error on 401 when requesting email change', async () => {
    verifyCurrentPasswordMock.mockRejectedValue(
      new ApiError('Current password is incorrect.', 401),
    )
    const user = userEvent.setup()

    renderProfilePage()

    await screen.findByText('user@example.com')

    await user.type(screen.getByLabelText('New email'), 'new@example.com')
    const emailCurrentPasswordInput = document.getElementById(
      'profile-email-current-password',
    )
    expect(emailCurrentPasswordInput).not.toBeNull()
    await user.type(emailCurrentPasswordInput!, 'wrong-pass')
    await user.click(screen.getByRole('button', { name: 'Request email change' }))

    expect(
      await screen.findByText('Current password is incorrect.'),
    ).toBeInTheDocument()
    expect(requestProfileEmailChangeMock).not.toHaveBeenCalled()
  })

  it('shows email error on 409 when the address is already taken', async () => {
    requestProfileEmailChangeMock.mockRejectedValue(
      new ApiError('Email is already in use.', 409),
    )
    const user = userEvent.setup()

    renderProfilePage()

    await screen.findByText('user@example.com')

    await user.type(screen.getByLabelText('New email'), 'taken@example.com')
    const emailCurrentPasswordInput = document.getElementById(
      'profile-email-current-password',
    )
    expect(emailCurrentPasswordInput).not.toBeNull()
    await user.type(emailCurrentPasswordInput!, 'correct-pass')
    await user.click(screen.getByRole('button', { name: 'Request email change' }))

    expect(
      await screen.findByRole('dialog', { name: 'Confirm action' }),
    ).toBeInTheDocument()
    expect(requestProfileEmailChangeMock).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(await screen.findByText('Email is already in use.')).toBeInTheDocument()
    await waitFor(() => {
      expect(verifyCurrentPasswordMock).toHaveBeenCalledWith({
        currentPassword: 'correct-pass',
      })
      expect(requestProfileEmailChangeMock).toHaveBeenCalledWith({
        currentPassword: 'correct-pass',
        email: 'taken@example.com',
      })
    })
  })

  it('validates email availability before verifying current password', async () => {
    checkUserEmailAvailabilityMock.mockResolvedValue({ available: false })
    const user = userEvent.setup()

    renderProfilePage()

    await screen.findByText('user@example.com')

    await user.type(screen.getByLabelText('New email'), 'taken@example.com')
    const emailCurrentPasswordInput = document.getElementById(
      'profile-email-current-password',
    )
    expect(emailCurrentPasswordInput).not.toBeNull()
    await user.type(emailCurrentPasswordInput!, 'correct-pass')
    await user.click(screen.getByRole('button', { name: 'Request email change' }))

    expect(await screen.findByText('Email is already in use.')).toBeInTheDocument()
    expect(checkUserEmailAvailabilityMock).toHaveBeenCalledWith(
      'taken@example.com',
      'user-1',
    )
    expect(verifyCurrentPasswordMock).not.toHaveBeenCalled()
    expect(requestProfileEmailChangeMock).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog', { name: 'Confirm action' })).not.toBeInTheDocument()
  })
})
