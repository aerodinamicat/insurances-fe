import { type FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getAuthFormErrorState } from '../../api/auth-errors'
import { useAuth } from '../../auth'
import {
  FieldFeedback,
  getFieldAriaProps,
  getFieldInputErrorClass,
} from '../../components/FormField'
import '../auth/auth-page.css'
import './LoginPage.css'

const HOME_PATH = '/profile'

const EMAIL_FIELD_ERROR_ID = 'login-email-error'
const PASSWORD_FIELD_ERROR_ID = 'login-password-error'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectPath =
    (location.state as { from?: string } | null)?.from ?? HOME_PATH

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEmailError(null)
    setPasswordError(null)
    setFormError(null)
    setIsSubmitting(true)

    try {
      await login(email.trim(), password)
      navigate(redirectPath, { replace: true })
    } catch (caught) {
      const { fieldErrors, formError: apiFormError } = getAuthFormErrorState(
        caught,
        {
          entity: 'login',
          fallback: 'Unable to sign in. Please try again.',
        },
      )

      setEmailError(fieldErrors.email ?? null)
      setPasswordError(fieldErrors.password ?? null)
      setFormError(apiFormError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-page__card">
        <h1 className="auth-page__title">Sign in</h1>
        <p className="auth-page__subtitle">Insurances staff portal</p>

        {formError && (
          <div className="auth-alert auth-alert--error" role="alert">
            {formError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className={`auth-form__input${getFieldInputErrorClass(emailError)}`}
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              disabled={isSubmitting}
              {...getFieldAriaProps(EMAIL_FIELD_ERROR_ID, emailError)}
              onChange={(event) => {
                setEmail(event.target.value)
                if (emailError) {
                  setEmailError(null)
                }
              }}
            />
            <FieldFeedback id={EMAIL_FIELD_ERROR_ID} message={emailError} />
          </div>

          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className={`auth-form__input${getFieldInputErrorClass(passwordError)}`}
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              disabled={isSubmitting}
              {...getFieldAriaProps(PASSWORD_FIELD_ERROR_ID, passwordError)}
              onChange={(event) => {
                setPassword(event.target.value)
                if (passwordError) {
                  setPasswordError(null)
                }
              }}
            />
            <FieldFeedback id={PASSWORD_FIELD_ERROR_ID} message={passwordError} />
          </div>

          <button
            className="auth-form__submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
