import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import { onboarding } from '../../api/auth.api'
import { ApiError } from '../../api/client'
import * as storage from '../../auth/storage'
import { renderWithRouter } from '../../test/renderWithRouter'
import { OnboardingPage } from './OnboardingPage'

vi.mock('../../api/auth.api', () => ({
  onboarding: vi.fn(),
}))

const onboardingMock = vi.mocked(onboarding)

function renderOnboardingPage(token?: string) {
  const search = token ? `?token=${encodeURIComponent(token)}` : ''

  return renderWithRouter(<OnboardingPage />, {
    initialEntries: [`/onboarding${search}`],
    path: '/onboarding',
  })
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    onboardingMock.mockReset()
    vi.spyOn(storage, 'writeStoredAccessToken')
    vi.spyOn(storage, 'readStoredAccessToken')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows error when token is missing', () => {
    renderOnboardingPage()

    expect(
      screen.getByText(
        'This onboarding link is invalid or incomplete. Open the link from your welcome email.',
      ),
    ).toBeInTheDocument()
    expect(onboardingMock).not.toHaveBeenCalled()
  })

  it('blocks submit when password validation fails', async () => {
    const user = userEvent.setup()

    renderOnboardingPage('onboarding-token')

    await user.type(screen.getByLabelText(/^New password/), 'short')
    await user.type(screen.getByLabelText(/^Confirm password/), 'short')
    await user.click(screen.getByRole('button', { name: 'Complete onboarding' }))

    expect(
      await screen.findByText('Password must be at least 8 characters.'),
    ).toBeInTheDocument()
    expect(onboardingMock).not.toHaveBeenCalled()
  })

  it('disables submit while onboarding is in flight', async () => {
    let resolveSubmit: ((value: unknown) => void) | undefined
    onboardingMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve
        }),
    )
    const user = userEvent.setup()

    renderOnboardingPage('onboarding-token')

    await user.type(screen.getByLabelText(/^New password/), 'validpass1')
    await user.type(screen.getByLabelText(/^Confirm password/), 'validpass1')
    await user.click(screen.getByRole('button', { name: 'Complete onboarding' }))

    expect(await screen.findByRole('button', { name: 'Completing…' })).toBeDisabled()
    expect(onboardingMock).toHaveBeenCalledWith({
      token: 'onboarding-token',
      newPassword: 'validpass1',
    })

    resolveSubmit?.({ message: 'Onboarding complete.' })

    await waitFor(() => {
      expect(screen.getByText('Onboarding complete.')).toBeInTheDocument()
    })
    expect(storage.writeStoredAccessToken).not.toHaveBeenCalled()
  })

  it('completes onboarding without persisting a session token', async () => {
    onboardingMock.mockResolvedValue({ message: 'Your account is ready.' })
    const user = userEvent.setup()

    renderOnboardingPage('onboarding-token')

    await user.type(screen.getByLabelText(/^New password/), 'validpass1')
    await user.type(screen.getByLabelText(/^Confirm password/), 'validpass1')
    await user.click(screen.getByRole('button', { name: 'Complete onboarding' }))

    expect(await screen.findByText('Your account is ready.')).toBeInTheDocument()
    expect(onboardingMock).toHaveBeenCalledTimes(1)
    expect(storage.writeStoredAccessToken).not.toHaveBeenCalled()
    expect(storage.readStoredAccessToken()).toBeNull()
  })

  it('shows API error when onboarding fails', async () => {
    onboardingMock.mockRejectedValue(new ApiError('Onboarding link expired.', 401))
    const user = userEvent.setup()

    renderOnboardingPage('onboarding-token')

    await user.type(screen.getByLabelText(/^New password/), 'validpass1')
    await user.type(screen.getByLabelText(/^Confirm password/), 'validpass1')
    await user.click(screen.getByRole('button', { name: 'Complete onboarding' }))

    expect(await screen.findByText('Onboarding link expired.')).toBeInTheDocument()
    expect(storage.writeStoredAccessToken).not.toHaveBeenCalled()
  })
})
