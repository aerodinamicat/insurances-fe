import { StrictMode } from 'react'
import { screen, waitFor } from '@testing-library/react'
import { confirmEmail } from '../../api/auth.api'
import { ApiError } from '../../api/client'
import { renderWithRouter } from '../../test/renderWithRouter'
import { ConfirmEmailPage } from './ConfirmEmailPage'

vi.mock('../../api/auth.api', () => ({
  confirmEmail: vi.fn(),
}))

const confirmEmailMock = vi.mocked(confirmEmail)

function renderConfirmEmailPage(token?: string) {
  const search = token ? `?token=${encodeURIComponent(token)}` : ''

  return renderWithRouter(
    <StrictMode>
      <ConfirmEmailPage />
    </StrictMode>,
    {
      initialEntries: [`/confirm-email${search}`],
      path: '/confirm-email',
    },
  )
}

describe('ConfirmEmailPage', () => {
  beforeEach(() => {
    confirmEmailMock.mockReset()
  })

  it('calls confirmEmail only once under StrictMode', async () => {
    confirmEmailMock.mockResolvedValue({ message: 'Email cambiado con éxito.' })

    renderConfirmEmailPage('single-use-token')

    expect(screen.getByRole('heading', { name: 'Email updated' })).toBeInTheDocument()
    expect(screen.getByText('Email cambiado con éxito.')).toBeInTheDocument()

    await waitFor(() => {
      expect(confirmEmailMock).toHaveBeenCalledTimes(1)
    })
    expect(confirmEmailMock).toHaveBeenCalledWith('single-use-token')
    expect(
      screen.getByText(
        /Todas las sesiones del usuario han sido cerradas. Será redirigido automáticamente a login/i,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Redirección en 5 segundos.')).toBeInTheDocument()
  })

  it('shows error without calling the API when token is missing', () => {
    renderConfirmEmailPage()

    expect(
      screen.getByText(
        'This confirmation link is invalid or incomplete. Open the link from your email.',
      ),
    ).toBeInTheDocument()
    expect(confirmEmailMock).not.toHaveBeenCalled()
  })

  it('shows API error message when confirmation fails', async () => {
    confirmEmailMock.mockRejectedValue(new ApiError('Link expired or already used.', 401))

    renderConfirmEmailPage('expired-token')

    expect(await screen.findByText('Link expired or already used.')).toBeInTheDocument()
    expect(confirmEmailMock).toHaveBeenCalledTimes(1)
  })
})
