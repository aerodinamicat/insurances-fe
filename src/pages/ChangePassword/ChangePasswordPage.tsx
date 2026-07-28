import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getAuthFormErrorState } from '../../api/auth-errors'
import { useAuth } from '../../auth'
import { clearStoredAccessToken } from '../../auth/storage'
import { ActionResult } from '../../components/ActionResult'
import { PasswordForm, type PasswordFormValues } from '../../components/PasswordForm'
import type { PasswordFormFieldErrors } from '../../components/PasswordForm/password-form-utils'
import '../auth/auth-page.css'

const LOGIN_PATH = '/login'
const REDIRECT_DELAY_SECONDS = 5

const MISSING_TOKEN_MESSAGE =
  'This password reset link is invalid or incomplete. Open the link from your email.'
const DEFAULT_ERROR_MESSAGE =
  'Unable to set your password. The link may have expired or already been used.'
const SUCCESS_MESSAGE = 'Contraseña cambiada con éxito.'
const SUCCESS_HINT =
  'Todas sus sesiones han sido cerradas. Será redirigido automáticamente a login para que inicie sesión con sus nuevas credenciales.'

type FormStatus = 'form' | 'success'

export function ChangePasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const navigate = useNavigate()
  const { changePasswordByToken } = useAuth()

  const [formError, setFormError] = useState<string | null>(null)
  const [apiFieldErrors, setApiFieldErrors] = useState<PasswordFormFieldErrors>({})
  const [successMessage, setSuccessMessage] = useState(SUCCESS_MESSAGE)
  const [status, setStatus] = useState<FormStatus>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(
    REDIRECT_DELAY_SECONDS,
  )

  useEffect(() => {
    if (status !== 'success') {
      return
    }

    setRedirectCountdown(REDIRECT_DELAY_SECONDS)

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
  }, [navigate, status])

  if (!token) {
    return (
      <main className="auth-page">
        <div className="auth-page__card">
          <h1 className="auth-page__title">Set your password</h1>
          <ActionResult
            status="error"
            errorMessage={MISSING_TOKEN_MESSAGE}
            cta={{ label: 'Go to sign in', to: LOGIN_PATH }}
          />
        </div>
      </main>
    )
  }

  async function handleSubmit(values: PasswordFormValues) {
    if (isSubmitting) {
      return
    }

    setFormError(null)
    setApiFieldErrors({})
    setIsSubmitting(true)

    try {
      const response = await changePasswordByToken(token, values.newPassword)
      clearStoredAccessToken()
      setSuccessMessage(response.message || SUCCESS_MESSAGE)
      setStatus('success')
    } catch (caught) {
      const { fieldErrors, formError: apiFormError } = getAuthFormErrorState(
        caught,
        {
          entity: 'change-password',
          fallback: DEFAULT_ERROR_MESSAGE,
        },
      )

      setApiFieldErrors({
        newPassword: fieldErrors.newPassword,
        confirmPassword: fieldErrors.confirmPassword,
      })
      setFormError(apiFormError)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'success') {
    return (
      <main className="auth-page">
        <div className="auth-page__card">
          <h1 className="auth-page__title">Password updated</h1>
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
        <h1 className="auth-page__title">Set your password</h1>
        <p className="auth-page__subtitle">
          Enter and confirm your new password to finish resetting your account.
        </p>

        <PasswordForm
          idPrefix="change-password"
          isSubmitting={isSubmitting}
          formError={formError}
          apiFieldErrors={apiFieldErrors}
          submitLabel="Save password"
          onSubmit={handleSubmit}
        />

        <p className="auth-page__footer">
          <Link className="auth-page__link" to={LOGIN_PATH}>
            Go to sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
