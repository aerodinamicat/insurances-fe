import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { onboarding } from '../../api/auth.api'
import { getAuthFormErrorState } from '../../api/auth-errors'
import { ActionResult } from '../../components/ActionResult'
import { PasswordForm, type PasswordFormValues } from '../../components/PasswordForm'
import type { PasswordFormFieldErrors } from '../../components/PasswordForm/password-form-utils'
import '../auth/auth-page.css'

const LOGIN_PATH = '/login'

const MISSING_TOKEN_MESSAGE =
  'This onboarding link is invalid or incomplete. Open the link from your welcome email.'
const DEFAULT_ERROR_MESSAGE =
  'Unable to complete onboarding. The link may have expired or already been used.'
const SUCCESS_HINT =
  'Your account is ready. Sign in with the password you just chose.'

type FormStatus = 'form' | 'success'

export function OnboardingPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''

  const [formError, setFormError] = useState<string | null>(null)
  const [apiFieldErrors, setApiFieldErrors] = useState<PasswordFormFieldErrors>({})
  const [status, setStatus] = useState<FormStatus>('form')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!token) {
    return (
      <main className="auth-page">
        <div className="auth-page__card">
          <h1 className="auth-page__title">Complete onboarding</h1>
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
      const response = await onboarding({
        token,
        newPassword: values.newPassword,
      })
      setSuccessMessage(response.message)
      setStatus('success')
    } catch (caught) {
      const { fieldErrors, formError: apiFormError } = getAuthFormErrorState(
        caught,
        {
          entity: 'onboarding',
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

  if (status === 'success' && successMessage) {
    return (
      <main className="auth-page">
        <div className="auth-page__card">
          <h1 className="auth-page__title">Onboarding complete</h1>
          <ActionResult
            status="success"
            successMessage={successMessage}
            successHint={SUCCESS_HINT}
            cta={{ label: 'Go to sign in', to: LOGIN_PATH }}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <div className="auth-page__card">
        <h1 className="auth-page__title">Complete onboarding</h1>
        <p className="auth-page__subtitle">
          Choose a password to activate your account and confirm your email address.
        </p>

        <PasswordForm
          idPrefix="onboarding"
          isSubmitting={isSubmitting}
          formError={formError}
          apiFieldErrors={apiFieldErrors}
          submitLabel="Complete onboarding"
          submittingLabel="Completing…"
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
