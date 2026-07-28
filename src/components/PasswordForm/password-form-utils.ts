export const PASSWORD_MIN_LENGTH = 8

export type PasswordFormValues = {
  newPassword: string
  confirmPassword: string
}

export type PasswordFormFieldErrors = {
  newPassword?: string
  confirmPassword?: string
}

export function validatePasswordFormValues(
  values: PasswordFormValues,
): PasswordFormFieldErrors {
  const errors: PasswordFormFieldErrors = {}

  if (values.newPassword.length < PASSWORD_MIN_LENGTH) {
    errors.newPassword = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (values.newPassword !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

export function hasPasswordFormErrors(
  errors: PasswordFormFieldErrors,
): boolean {
  return Boolean(errors.newPassword || errors.confirmPassword)
}
