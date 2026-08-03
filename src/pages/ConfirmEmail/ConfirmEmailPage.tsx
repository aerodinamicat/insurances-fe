import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { confirmEmail as confirmEmailByToken } from '../../api/auth.api'
import { ApiError } from '../../api/client'
import { clearStoredAccessToken } from '../../auth/storage'
import { EmailActionResult } from '../../components/ActionResult'
import '../auth/auth-page.css'

const LOGIN_PATH = '/login'

const MISSING_TOKEN_MESSAGE =
  'This confirmation link is invalid or incomplete. Open the link from your email.'
const DEFAULT_ERROR_MESSAGE =
  'Unable to confirm your new email. The link may have expired or already been used.'
const SUCCESS_MESSAGE = 'Email cambiado con éxito.'
const SUCCESS_HINT =
  'Todas las sesiones del usuario han sido cerradas. Será redirigido automáticamente a login para que inicie sesión con sus nuevas credenciales.'
const REDIRECT_DELAY_SECONDS = 5

export function ConfirmEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''

  const [successMessage, setSuccessMessage] = useState(SUCCESS_MESSAGE)
  const [errorMessage, setErrorMessage] = useState<string | null>(
    token ? null : MISSING_TOKEN_MESSAGE,
  )
  const [redirectCountdown, setRedirectCountdown] = useState(
    REDIRECT_DELAY_SECONDS,
  )
  const startedRef = useRef(false)
  const isSuccess = Boolean(token && !errorMessage)

  useEffect(() => {
    if (!isSuccess) {
      return
    }

    const countdownTimer = window.setInterval(() => {
      setRedirectCountdown((current) => Math.max(current - 1, 0))
    }, 1000)
    const redirectTimer = window.setTimeout(() => {
      navigate(LOGIN_PATH, { replace: true })
    }, REDIRECT_DELAY_SECONDS * 1000)

    return () => {
      window.clearInterval(countdownTimer)
      window.clearTimeout(redirectTimer)
    }
  }, [isSuccess, navigate])

  useEffect(() => {
    if (!token || startedRef.current) {
      return
    }
    startedRef.current = true

    let cancelled = false

    async function confirmEmail() {
      try {
        const response = await confirmEmailByToken(token)
        if (!cancelled) {
          clearStoredAccessToken()
          setSuccessMessage(response.message || SUCCESS_MESSAGE)
        }
      } catch (caught) {
        if (!cancelled) {
          setErrorMessage(
            caught instanceof ApiError
              ? caught.message
              : DEFAULT_ERROR_MESSAGE,
          )
        }
      }
    }

    void confirmEmail()

    return () => {
      cancelled = true
    }
  }, [token])

  if (isSuccess) {
    return (
      <main className="auth-page">
        <div className="auth-page__card">
          <h1 className="auth-page__title">Email updated</h1>
          <div className="auth-page__success-icon" aria-hidden="true">
            ✓
          </div>
          <div className="auth-alert auth-alert--success" role="status">
            {successMessage}
          </div>
          <p className="auth-page__status">{SUCCESS_HINT}</p>
          <p className="auth-page__countdown" aria-live="polite">
            Redirección en {redirectCountdown} segundos.
          </p>
          <p className="auth-page__footer">
            <Link className="auth-page__link" to={LOGIN_PATH}>
              Ir a login ahora
            </Link>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <div className="auth-page__card">
        <h1 className="auth-page__title">Confirm email</h1>
        <EmailActionResult
          status="error"
          errorMessage={errorMessage}
          cta={
            {
              label: 'Go to sign in',
              to: LOGIN_PATH,
            }
          }
        />
      </div>
    </main>
  )
}
