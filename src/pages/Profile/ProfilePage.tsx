import { type FormEvent, useEffect, useState } from 'react'
import { getAuthFormErrorState } from '../../api/auth-errors'
import { ApiError } from '../../api/client'
import {
  changeProfilePassword,
  requestProfileEmailChange,
  verifyCurrentPassword,
} from '../../api/auth.api'
import type { UserResponse } from '../../api/types'
import {
  checkUserEmailAvailability,
  fetchMyProfile,
} from '../../api/users'
import { useAuth } from '../../auth'
import {
  FieldFeedback,
  getFieldAriaProps,
  getFieldInputErrorClass,
} from '../../components/FormField'
import { formatDisplayDate } from '../../utils/date'
import '../auth/auth-page.css'
import './ProfilePage.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type PendingProfileAction =
  | { type: 'email'; email: string; currentPassword: string }
  | { type: 'password'; currentPassword: string }

function formatConfirmedEmailDate(value: string | null): string {
  if (!value) {
    return 'Pending confirmation'
  }

  return formatDisplayDate(value)
}

function applyProfileApiError(
  caught: unknown,
  handlers: {
    setEmailFieldError: (message: string | null) => void
    setEmailCurrentPasswordError: (message: string | null) => void
    setPasswordCurrentPasswordError: (message: string | null) => void
    setEmailFormError: (message: string | null) => void
    setPasswordFormError: (message: string | null) => void
  },
  section: 'email' | 'password',
) {
  if (caught instanceof ApiError && caught.status === 401) {
    const message = caught.message || 'Current password is incorrect.'
    if (section === 'email') {
      handlers.setEmailCurrentPasswordError(message)
    } else {
      handlers.setPasswordCurrentPasswordError(message)
    }
    return
  }

  const { fieldErrors, formError } = getAuthFormErrorState(caught, {
    entity: 'profile',
    fallback:
      section === 'email'
        ? 'Unable to request an email change. Please try again.'
        : 'Unable to request a password change. Please try again.',
  })

  if (section === 'email') {
    handlers.setEmailFieldError(fieldErrors.email ?? null)
    handlers.setEmailCurrentPasswordError(fieldErrors.currentPassword ?? null)
    handlers.setEmailFormError(formError)
    return
  }

  handlers.setPasswordCurrentPasswordError(fieldErrors.currentPassword ?? null)
  handlers.setPasswordFormError(formError)
}

export function ProfilePage() {
  const { user, role } = useAuth()

  const [profile, setProfile] = useState<UserResponse | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [passwordCurrentPasswordError, setPasswordCurrentPasswordError] =
    useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)

  const [newEmail, setNewEmail] = useState('')
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('')
  const [emailCurrentPasswordError, setEmailCurrentPasswordError] =
    useState<string | null>(null)
  const [emailFieldError, setEmailFieldError] = useState<string | null>(null)
  const [emailFormError, setEmailFormError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingProfileAction | null>(null)
  const [isConfirmingAction, setIsConfirmingAction] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetchMyProfile()
      .then((data) => {
        if (!cancelled) {
          setProfile(data)
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          if (caught instanceof ApiError) {
            setProfileError(caught.message)
          } else {
            setProfileError('Unable to load your profile. Please try again.')
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingProfile(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordCurrentPasswordError(null)
    setPasswordError(null)
    setPasswordSuccess(null)

    if (!currentPassword) {
      setPasswordCurrentPasswordError('Current password is required.')
      return
    }

    setIsSubmittingPassword(true)

    try {
      await verifyCurrentPassword({ currentPassword })
      setPendingAction({ type: 'password', currentPassword })
    } catch (caught) {
      applyProfileApiError(
        caught,
        {
          setEmailFieldError,
          setEmailCurrentPasswordError,
          setPasswordCurrentPasswordError,
          setEmailFormError,
          setPasswordFormError: setPasswordError,
        },
        'password',
      )
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEmailCurrentPasswordError(null)
    setEmailFieldError(null)
    setEmailFormError(null)
    setEmailSuccess(null)

    const trimmedEmail = newEmail.trim().toLowerCase()
    const currentEmail = profile?.email ?? user?.email ?? ''

    if (!emailCurrentPassword) {
      setEmailCurrentPasswordError('Current password is required.')
      return
    }

    if (!trimmedEmail) {
      setEmailFieldError('Email is required.')
      return
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailFieldError('Enter a valid email address.')
      return
    }

    if (trimmedEmail === currentEmail.toLowerCase()) {
      setEmailFieldError('The new email must differ from your current one.')
      return
    }

    setIsSubmittingEmail(true)

    try {
      const availability = await checkUserEmailAvailability(
        trimmedEmail,
        profile?.id ?? user?.id,
      )

      if (!availability.available) {
        setEmailFieldError('Email is already in use.')
        return
      }

      await verifyCurrentPassword({ currentPassword: emailCurrentPassword })
      setPendingAction({
        type: 'email',
        email: trimmedEmail,
        currentPassword: emailCurrentPassword,
      })
    } catch (caught) {
      applyProfileApiError(
        caught,
        {
          setEmailFieldError,
          setEmailCurrentPasswordError,
          setPasswordCurrentPasswordError,
          setEmailFormError,
          setPasswordFormError: setPasswordError,
        },
        'email',
      )
    } finally {
      setIsSubmittingEmail(false)
    }
  }

  async function handleConfirmPendingAction() {
    if (!pendingAction || isConfirmingAction) {
      return
    }

    setIsConfirmingAction(true)

    try {
      if (pendingAction.type === 'email') {
        await requestProfileEmailChange({
          currentPassword: pendingAction.currentPassword,
          email: pendingAction.email,
        })
        setNewEmail('')
        setEmailCurrentPassword('')
        setEmailSuccess(
          `A confirmation link was sent to ${pendingAction.email}. Your current email remains active until you confirm the change.`,
        )
      } else {
        await changeProfilePassword({
          currentPassword: pendingAction.currentPassword,
        })
        setCurrentPassword('')
        setPasswordSuccess(
          'A password change link was sent to your current email address.',
        )
      }

      setPendingAction(null)
    } catch (caught) {
      applyProfileApiError(
        caught,
        {
          setEmailFieldError,
          setEmailCurrentPasswordError,
          setPasswordCurrentPasswordError,
          setEmailFormError,
          setPasswordFormError: setPasswordError,
        },
        pendingAction.type,
      )

      setPendingAction(null)
    } finally {
      setIsConfirmingAction(false)
    }
  }

  const emailFieldErrorId = 'profile-new-email-error'
  const passwordCurrentPasswordErrorId = 'profile-current-password-error'
  const emailCurrentPasswordErrorId = 'profile-email-current-password-error'

  return (
    <div className="page-content profile-page">
      <h1 className="page-content__title">Mi perfil</h1>
      <p className="page-content__subtitle">
        Consulta tus datos y gestiona tu contraseña y email.
      </p>

      {isLoadingProfile && (
        <p className="profile-page__status" role="status">
          Loading profile…
        </p>
      )}

      {profileError && (
        <div className="auth-alert auth-alert--error" role="alert">
          {profileError}
        </div>
      )}

      {!isLoadingProfile && profile && (
        <section className="profile-page__info" aria-label="Account information">
          <div className="profile-page__info-row">
            <span className="profile-page__info-label">Name</span>
            <span className="profile-page__info-value">
              {profile.firstName} {profile.lastName}
            </span>
          </div>
          <div className="profile-page__info-row">
            <span className="profile-page__info-label">Email</span>
            <span className="profile-page__info-value">{profile.email}</span>
          </div>
          <div className="profile-page__info-row">
            <span className="profile-page__info-label">Role</span>
            <span className="profile-page__info-value">
              {profile.roleCode ?? role ?? '—'}
            </span>
          </div>
          <div className="profile-page__info-row">
            <span className="profile-page__info-label">Email confirmed</span>
            <span className="profile-page__info-value">
              {formatConfirmedEmailDate(profile.confirmedEmailAt)}
            </span>
          </div>
        </section>
      )}

      <div className="profile-page__sections-row">
        <section
          className="profile-page__section"
          aria-labelledby="change-email-title"
        >
          <h2 id="change-email-title" className="profile-page__section-title">
            Change email
          </h2>
          <p className="profile-page__section-desc">
            We will send a confirmation link to the new address. You can keep signing in
            with your current email until the change is confirmed.
          </p>

          {emailSuccess && (
            <div className="auth-alert auth-alert--success" role="status">
              {emailSuccess}
            </div>
          )}

          {emailFormError && (
            <div className="auth-alert auth-alert--error" role="alert">
              {emailFormError}
            </div>
          )}

          <form
            className="auth-form profile-page__form"
            onSubmit={handleEmailSubmit}
            noValidate
          >
            <div className="auth-form__field">
              <label className="auth-form__label" htmlFor="profile-new-email">
                New email
              </label>
              <input
                id="profile-new-email"
                className={`auth-form__input${getFieldInputErrorClass(emailFieldError)}`}
                type="email"
                name="email"
                autoComplete="email"
                required
                value={newEmail}
                disabled={isSubmittingEmail || isConfirmingAction}
                {...getFieldAriaProps(emailFieldErrorId, emailFieldError)}
                onChange={(event) => {
                  setNewEmail(event.target.value)
                  if (emailFieldError) {
                    setEmailFieldError(null)
                  }
                }}
              />
              <FieldFeedback id={emailFieldErrorId} message={emailFieldError} />
            </div>

            <div className="auth-form__field">
              <label
                className="auth-form__label"
                htmlFor="profile-email-current-password"
              >
                Current password
              </label>
              <input
                id="profile-email-current-password"
                className={`auth-form__input${emailCurrentPasswordError ? ' auth-form__input--error' : ''}`}
                type="password"
                name="currentPassword"
                autoComplete="current-password"
                required
                value={emailCurrentPassword}
                disabled={isSubmittingEmail || isConfirmingAction}
                aria-invalid={emailCurrentPasswordError ? true : undefined}
                aria-describedby={
                  emailCurrentPasswordError ? emailCurrentPasswordErrorId : undefined
                }
                onChange={(event) => {
                  setEmailCurrentPassword(event.target.value)
                  if (emailCurrentPasswordError) {
                    setEmailCurrentPasswordError(null)
                  }
                }}
              />
              <FieldFeedback
                id={emailCurrentPasswordErrorId}
                message={emailCurrentPasswordError}
              />
            </div>

            <button
              className="auth-form__submit"
              type="submit"
              disabled={isSubmittingEmail || isConfirmingAction}
            >
              {isSubmittingEmail ? 'Validating…' : 'Request email change'}
            </button>
          </form>
        </section>

        <section
          className="profile-page__section"
          aria-labelledby="change-password-title"
        >
          <h2 id="change-password-title" className="profile-page__section-title">
            Change password
          </h2>
          <p className="profile-page__section-desc">
            Confirm your current password and we will send a one-time link to your
            current email address.
          </p>

          {passwordSuccess && (
            <div className="auth-alert auth-alert--success" role="status">
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="auth-alert auth-alert--error" role="alert">
              {passwordError}
            </div>
          )}

          <form
            className="auth-form profile-page__form"
            onSubmit={handlePasswordSubmit}
            noValidate
          >
            <div className="auth-form__field">
              <label className="auth-form__label" htmlFor="profile-current-password">
                Current password
              </label>
              <input
                id="profile-current-password"
                className={`auth-form__input${passwordCurrentPasswordError ? ' auth-form__input--error' : ''}`}
                type="password"
                name="currentPassword"
                autoComplete="current-password"
                required
                value={currentPassword}
                disabled={isSubmittingPassword || isConfirmingAction}
                aria-invalid={passwordCurrentPasswordError ? true : undefined}
                aria-describedby={
                  passwordCurrentPasswordError ? passwordCurrentPasswordErrorId : undefined
                }
                onChange={(event) => {
                  setCurrentPassword(event.target.value)
                  if (passwordCurrentPasswordError) {
                    setPasswordCurrentPasswordError(null)
                  }
                }}
              />
              <FieldFeedback
                id={passwordCurrentPasswordErrorId}
                message={passwordCurrentPasswordError}
              />
            </div>

            <button
              className="auth-form__submit"
              type="submit"
              disabled={isSubmittingPassword || isConfirmingAction}
            >
              {isSubmittingPassword ? 'Validating…' : 'Send password change link'}
            </button>
          </form>
        </section>
      </div>

      {pendingAction && (
        <div className="profile-page__modal-backdrop" role="presentation">
          <div
            className="profile-page__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-confirmation-title"
          >
            <h2 id="profile-confirmation-title" className="profile-page__modal-title">
              Confirm action
            </h2>
            <p className="profile-page__modal-copy">
              {pendingAction.type === 'email'
                ? `Your current password is valid. Confirm that you want to send a verification link to ${pendingAction.email}.`
                : 'Your current password is valid. Confirm that you want to send a password change link to your current email address.'}
            </p>
            <div className="profile-page__modal-actions">
              <button
                type="button"
                className="profile-page__modal-button profile-page__modal-button--secondary"
                disabled={isConfirmingAction}
                onClick={() => setPendingAction(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="profile-page__modal-button profile-page__modal-button--primary"
                disabled={isConfirmingAction}
                onClick={handleConfirmPendingAction}
              >
                {isConfirmingAction ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
