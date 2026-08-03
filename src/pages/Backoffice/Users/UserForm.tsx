import {
  type FormEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { checkUserEmailAvailability } from '../../../api/users'
import type { RoleResponse, UserResponse } from '../../../api/types'
import {
  FieldFeedback,
  RequiredMark,
  getFieldFeedbackId,
} from '../../../components/FormField'
import { getDefaultViewerRoleId } from './role-order'
import '../../auth/auth-page.css'

export type UserFormValues = {
  email: string
  firstName: string
  lastName: string
  roleId: string
}

type UserFormProps = {
  mode: 'create' | 'edit'
  roles: RoleResponse[]
  initialUser?: UserResponse
  isSubmitting: boolean
  error: string | null
  onSubmit: (values: UserFormValues) => Promise<void>
  onCancel: () => void
  onDirtyChange?: (isDirty: boolean) => void
}

type FieldKey = keyof UserFormValues

type UserFieldErrors = Record<FieldKey, string | null>

type TouchedFields = Record<FieldKey, boolean>

type EmailAvailabilityState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'unavailable'
  | 'error'

const NAME_PATTERN = /^[\p{L}\s-]+$/u
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_CHECK_DEBOUNCE_MS = 400

function buildInitialValues(
  mode: 'create' | 'edit',
  initialUser: UserResponse | undefined,
  roles: RoleResponse[],
): UserFormValues {
  if (mode === 'create') {
    return {
      email: '',
      firstName: '',
      lastName: '',
      roleId: getDefaultViewerRoleId(roles),
    }
  }

  return {
    email: initialUser?.email ?? '',
    firstName: initialUser?.firstName ?? '',
    lastName: initialUser?.lastName ?? '',
    roleId: initialUser?.roleId ?? getDefaultViewerRoleId(roles),
  }
}

function validateField(
  mode: 'create' | 'edit',
  field: FieldKey,
  values: UserFormValues,
  emailAvailability: EmailAvailabilityState,
): string | null {
  switch (field) {
    case 'email': {
      if (mode === 'edit') {
        return null
      }
      const trimmed = values.email.trim()
      if (!trimmed) {
        return 'Email is required.'
      }
      if (!EMAIL_PATTERN.test(trimmed)) {
        return 'Enter a valid email address.'
      }
      if (emailAvailability === 'checking') {
        return 'Checking email availability…'
      }
      if (emailAvailability === 'unavailable') {
        return 'This email is already in use.'
      }
      if (emailAvailability === 'error') {
        return 'Unable to verify email availability.'
      }
      if (emailAvailability !== 'available') {
        return null
      }
      return null
    }
    case 'firstName': {
      const trimmed = values.firstName.trim()
      if (!trimmed) {
        return 'First name is required.'
      }
      if (trimmed.length < 3) {
        return 'First name must be at least 3 characters.'
      }
      if (!NAME_PATTERN.test(trimmed)) {
        return 'First name may only contain letters, spaces and hyphens.'
      }
      return null
    }
    case 'lastName': {
      const trimmed = values.lastName.trim()
      if (!trimmed) {
        return 'Last name is required.'
      }
      if (trimmed.length < 3) {
        return 'Last name must be at least 3 characters.'
      }
      if (!NAME_PATTERN.test(trimmed)) {
        return 'Last name may only contain letters, spaces and hyphens.'
      }
      return null
    }
    case 'roleId': {
      if (!values.roleId) {
        return 'Role is required.'
      }
      return null
    }
    default:
      return null
  }
}

function validateAllFields(
  mode: 'create' | 'edit',
  values: UserFormValues,
  emailAvailability: EmailAvailabilityState,
): UserFieldErrors {
  return {
    email: validateField(mode, 'email', values, emailAvailability),
    firstName: validateField(mode, 'firstName', values, emailAvailability),
    lastName: validateField(mode, 'lastName', values, emailAvailability),
    roleId: validateField(mode, 'roleId', values, emailAvailability),
  }
}

function isFieldValid(
  field: FieldKey,
  mode: 'create' | 'edit',
  values: UserFormValues,
  emailAvailability: EmailAvailabilityState,
): boolean {
  if (mode === 'edit' && field === 'email') {
    return true
  }

  const trimmedEmail = values.email.trim()
  if (field === 'email') {
    return (
      EMAIL_PATTERN.test(trimmedEmail) &&
      emailAvailability === 'available'
    )
  }

  return validateField(mode, field, values, emailAvailability) === null
}

function getInputStateClass(
  field: FieldKey,
  mode: 'create' | 'edit',
  touched: boolean,
  submitted: boolean,
  values: UserFormValues,
  emailAvailability: EmailAvailabilityState,
  fieldErrors: UserFieldErrors,
): string {
  if (!touched && !submitted) {
    return ''
  }

  const error = fieldErrors[field]
  if (error) {
    return 'auth-form__input--error'
  }

  if (isFieldValid(field, mode, values, emailAvailability)) {
    return 'auth-form__input--valid'
  }

  return ''
}

export function UserForm({
  mode,
  roles,
  initialUser,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
  onDirtyChange,
}: UserFormProps) {
  const formId = useId()
  const initialValues = useMemo(
    () => buildInitialValues(mode, initialUser, roles),
    [mode, initialUser, roles],
  )
  const [values, setValues] = useState<UserFormValues>(initialValues)
  const isEditingAdmin = mode === 'edit' && initialUser?.roleCode === 'Admin'
  const [touched, setTouched] = useState<TouchedFields>({
    email: false,
    firstName: false,
    lastName: false,
    roleId: false,
  })
  const [submitted, setSubmitted] = useState(false)
  const [emailAvailability, setEmailAvailability] =
    useState<EmailAvailabilityState>('idle')
  const emailCheckRequestRef = useRef(0)

  const fieldErrors = useMemo(
    () => validateAllFields(mode, values, emailAvailability),
    [mode, values, emailAvailability],
  )

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [values, initialValues],
  )

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  useEffect(() => {
    if (mode === 'edit') {
      return
    }

    const trimmed = values.email.trim()
    if (!EMAIL_PATTERN.test(trimmed)) {
      return
    }

    const requestId = ++emailCheckRequestRef.current

    const timeoutId = window.setTimeout(() => {
      setEmailAvailability('checking')
      void (async () => {
        try {
          const result = await checkUserEmailAvailability(
            trimmed,
            undefined,
          )
          if (emailCheckRequestRef.current !== requestId) {
            return
          }
          setEmailAvailability(result.available ? 'available' : 'unavailable')
        } catch {
          if (emailCheckRequestRef.current !== requestId) {
            return
          }
          setEmailAvailability('error')
        }
      })()
    }, EMAIL_CHECK_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [values.email, mode])

  function touchField(field: FieldKey) {
    setTouched((current) => ({ ...current, [field]: true }))
  }

  function updateField<K extends FieldKey>(field: K, value: UserFormValues[K]) {
    if (field === 'email') {
      emailCheckRequestRef.current += 1
      setEmailAvailability('idle')
    }
    setValues((current) => ({ ...current, [field]: value }))
  }

  function shouldShowError(field: FieldKey): string | null {
    if (!touched[field] && !submitted) {
      return null
    }
    return fieldErrors[field]
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    setTouched({
      email: true,
      firstName: true,
      lastName: true,
      roleId: true,
    })

    const errors = validateAllFields(mode, values, emailAvailability)
    const hasErrors = Object.values(errors).some(Boolean)
    if (hasErrors || emailAvailability === 'checking') {
      return
    }

    await onSubmit(values)
  }

  return (
    <form
      id={formId}
      className="catalog-modal__form"
      onSubmit={handleSubmit}
      noValidate
    >
      {error && (
        <div className="auth-alert auth-alert--error" role="alert">
          {error}
        </div>
      )}

      {mode === 'create' ? (
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-email`}>
            Email
            <RequiredMark />
          </label>
          <input
            id={`${formId}-email`}
            className={`auth-form__input ${getInputStateClass('email', mode, touched.email, submitted, values, emailAvailability, fieldErrors)}`}
            type="email"
            name="email"
            autoComplete="email"
            value={values.email}
            disabled={isSubmitting}
            aria-invalid={Boolean(shouldShowError('email'))}
            aria-describedby={getFieldFeedbackId(formId, 'email')}
            onBlur={() => touchField('email')}
            onChange={(event) => updateField('email', event.target.value)}
          />
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'email')}
            message={shouldShowError('email')}
          />
        </div>
      ) : (
        <p className="users-form__hint">
          Email can only be changed by the account owner from their profile.
        </p>
      )}

      <div className="catalog-form__row">
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-firstName`}>
            First name
            <RequiredMark />
          </label>
          <input
            id={`${formId}-firstName`}
            className={`auth-form__input ${getInputStateClass('firstName', mode, touched.firstName, submitted, values, emailAvailability, fieldErrors)}`}
            type="text"
            name="firstName"
            autoComplete="given-name"
            value={values.firstName}
            disabled={isSubmitting}
            aria-invalid={Boolean(shouldShowError('firstName'))}
            aria-describedby={getFieldFeedbackId(formId, 'firstName')}
            onBlur={() => touchField('firstName')}
            onChange={(event) => updateField('firstName', event.target.value)}
          />
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'firstName')}
            message={shouldShowError('firstName')}
          />
        </div>

        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-lastName`}>
            Last name
            <RequiredMark />
          </label>
          <input
            id={`${formId}-lastName`}
            className={`auth-form__input ${getInputStateClass('lastName', mode, touched.lastName, submitted, values, emailAvailability, fieldErrors)}`}
            type="text"
            name="lastName"
            autoComplete="family-name"
            value={values.lastName}
            disabled={isSubmitting}
            aria-invalid={Boolean(shouldShowError('lastName'))}
            aria-describedby={getFieldFeedbackId(formId, 'lastName')}
            onBlur={() => touchField('lastName')}
            onChange={(event) => updateField('lastName', event.target.value)}
          />
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'lastName')}
            message={shouldShowError('lastName')}
          />
        </div>
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor={`${formId}-role`}>
          Role
          <RequiredMark />
        </label>
        <select
          id={`${formId}-role`}
          className={`auth-form__input catalog-form__select ${getInputStateClass('roleId', mode, touched.roleId, submitted, values, emailAvailability, fieldErrors)}`}
          name="roleId"
          value={values.roleId}
          disabled={isSubmitting || roles.length === 0 || isEditingAdmin}
          aria-invalid={Boolean(shouldShowError('roleId'))}
          aria-describedby={getFieldFeedbackId(formId, 'roleId')}
          onBlur={() => touchField('roleId')}
          onChange={(event) => updateField('roleId', event.target.value)}
        >
          {roles.length === 0 ? (
            <option value="">No roles available</option>
          ) : (
            roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.code}
              </option>
            ))
          )}
        </select>
        <FieldFeedback
          id={getFieldFeedbackId(formId, 'roleId')}
          message={
            isEditingAdmin
              ? 'Admin user role cannot be changed.'
              : shouldShowError('roleId')
          }
        />
      </div>

      {mode === 'create' && (
        <p className="users-form__hint">
          An onboarding email will be sent. The user sets their password during
          onboarding — no password is required here.
        </p>
      )}

      <div className="catalog-modal__actions">
        <button
          type="button"
          className="catalog-modal-btn catalog-modal-btn--secondary"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="catalog-modal-btn catalog-modal-btn--primary"
          disabled={
            isSubmitting ||
            roles.length === 0 ||
            emailAvailability === 'checking'
          }
        >
          {isSubmitting
            ? mode === 'create'
              ? 'Creating…'
              : 'Saving…'
            : mode === 'create'
              ? 'Create user'
              : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
