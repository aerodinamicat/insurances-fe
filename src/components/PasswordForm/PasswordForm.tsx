import { type FormEvent, useId, useState } from 'react'
import {
  FieldFeedback,
  RequiredMark,
  getFieldAriaProps,
  getFieldInputErrorClass,
} from '../FormField'
import {
  PASSWORD_MIN_LENGTH,
  hasPasswordFormErrors,
  validatePasswordFormValues,
  type PasswordFormFieldErrors,
  type PasswordFormValues,
} from './password-form-utils'

export type PasswordFormProps = {
  idPrefix?: string
  isSubmitting?: boolean
  submitLabel?: string
  submittingLabel?: string
  formError?: string | null
  apiFieldErrors?: PasswordFormFieldErrors
  onSubmit: (values: PasswordFormValues) => void | Promise<void>
}

type TouchedFields = {
  newPassword: boolean
  confirmPassword: boolean
}

export function PasswordForm({
  idPrefix,
  isSubmitting = false,
  submitLabel = 'Save password',
  submittingLabel = 'Saving…',
  formError = null,
  apiFieldErrors = {},
  onSubmit,
}: PasswordFormProps) {
  const generatedId = useId().replace(/:/g, '')
  const prefix = idPrefix ?? `password-form-${generatedId}`

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<PasswordFormFieldErrors>({})
  const [touched, setTouched] = useState<TouchedFields>({
    newPassword: false,
    confirmPassword: false,
  })
  const [submitted, setSubmitted] = useState(false)

  function getVisibleFieldError(field: keyof TouchedFields): string | null {
    const apiError = apiFieldErrors[field] ?? null
    if (apiError) {
      return apiError
    }

    if (!touched[field] && !submitted) {
      return null
    }

    return fieldErrors[field] ?? null
  }

  function validateAndSetErrors(values: PasswordFormValues): PasswordFormFieldErrors {
    const errors = validatePasswordFormValues(values)
    setFieldErrors(errors)
    return errors
  }

  function handleBlur(field: keyof TouchedFields) {
    setTouched((current) => ({ ...current, [field]: true }))
    validateAndSetErrors({ newPassword, confirmPassword })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)

    const values = { newPassword, confirmPassword }
    const errors = validateAndSetErrors(values)

    if (hasPasswordFormErrors(errors)) {
      return
    }

    await onSubmit(values)
  }

  const newPasswordErrorId = `${prefix}-new-error`
  const confirmPasswordErrorId = `${prefix}-confirm-error`
  const newPasswordError = getVisibleFieldError('newPassword')
  const confirmPasswordError = getVisibleFieldError('confirmPassword')

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <div className="auth-alert auth-alert--error" role="alert">
          {formError}
        </div>
      )}

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor={`${prefix}-new`}>
          New password
          <RequiredMark />
        </label>
        <input
          id={`${prefix}-new`}
          className={`auth-form__input${getFieldInputErrorClass(newPasswordError)}`}
          type="password"
          name="newPassword"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          value={newPassword}
          disabled={isSubmitting}
          {...getFieldAriaProps(newPasswordErrorId, newPasswordError)}
          onBlur={() => handleBlur('newPassword')}
          onChange={(event) => {
            const value = event.target.value
            setNewPassword(value)
            if (touched.newPassword || submitted) {
              validateAndSetErrors({ newPassword: value, confirmPassword })
            }
          }}
        />
        <FieldFeedback id={newPasswordErrorId} message={newPasswordError} />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor={`${prefix}-confirm`}>
          Confirm password
          <RequiredMark />
        </label>
        <input
          id={`${prefix}-confirm`}
          className={`auth-form__input${getFieldInputErrorClass(confirmPasswordError)}`}
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          value={confirmPassword}
          disabled={isSubmitting}
          {...getFieldAriaProps(confirmPasswordErrorId, confirmPasswordError)}
          onBlur={() => handleBlur('confirmPassword')}
          onChange={(event) => {
            const value = event.target.value
            setConfirmPassword(value)
            if (touched.confirmPassword || submitted) {
              validateAndSetErrors({ newPassword, confirmPassword: value })
            }
          }}
        />
        <FieldFeedback id={confirmPasswordErrorId} message={confirmPasswordError} />
      </div>

      <button
        className="auth-form__submit"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  )
}
