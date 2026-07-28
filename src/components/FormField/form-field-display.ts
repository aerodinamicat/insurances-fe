import type { FieldErrors } from '../../types/form-errors'

export type FieldErrorDisplayOptions<T extends string> = {
  fieldErrors?: FieldErrors<T>
  showErrors?: boolean
  touchedFields?: Partial<Record<T, boolean>>
}

export function getVisibleFieldError<T extends string>(
  field: T,
  options: FieldErrorDisplayOptions<T>,
): string | null {
  const { fieldErrors, showErrors = false, touchedFields } = options

  if (!showErrors && !touchedFields?.[field]) {
    return null
  }

  return fieldErrors?.[field] ?? null
}

export function getFieldFeedbackId(formId: string, field: string): string {
  return `${formId}-${field}-feedback`
}

export function getFieldInputErrorClass(error: string | null): string {
  return error ? ' auth-form__input--error' : ''
}

export function getFieldAriaProps(
  feedbackId: string,
  error: string | null,
  extraDescribedBy?: string,
): {
  'aria-invalid'?: boolean
  'aria-describedby'?: string
} {
  const describedBy = [extraDescribedBy, error ? feedbackId : null]
    .filter(Boolean)
    .join(' ')

  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
  }
}
