/**
 * Map of validation messages keyed by form field name.
 * Only fields with errors are present; values are non-empty strings.
 */
export type FieldErrors<T extends string = string> = Partial<Record<T, string>>

/**
 * Result of validating a form scope (single form, tab, or draft item).
 */
export type FormValidationResult<T extends string = string> = {
  fieldErrors: FieldErrors<T>
  formError: string | null
}

/**
 * Returns true when at least one field has a non-empty error message.
 */
export function hasFieldErrors<T extends string>(
  errors: FieldErrors<T> | undefined | null,
): boolean {
  if (!errors) {
    return false
  }

  return Object.values(errors).some(
    (message): message is string =>
      typeof message === 'string' && message.trim() !== '',
  )
}

export function getFirstFieldErrorMessage<T extends string>(
  errors: FieldErrors<T> | undefined | null,
): string | null {
  if (!errors) {
    return null
  }

  const first = Object.values(errors).find(
    (message): message is string =>
      typeof message === 'string' && message.trim() !== '',
  )

  return first ?? null
}

export type BuilderFieldErrorResult<T extends string = string> = {
  fieldErrors: FieldErrors<T>
}

export type BuilderFormErrorResult = {
  error: string
}

export type BuilderResult<
  TPayload,
  TField extends string = string,
> = TPayload | BuilderFieldErrorResult<TField> | BuilderFormErrorResult

export function isBuilderFieldErrorResult<T extends string>(
  result: unknown,
): result is BuilderFieldErrorResult<T> {
  return (
    typeof result === 'object' &&
    result !== null &&
    'fieldErrors' in result &&
    typeof (result as BuilderFieldErrorResult<T>).fieldErrors === 'object'
  )
}

export function isBuilderFormErrorResult(
  result: unknown,
): result is BuilderFormErrorResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'error' in result &&
    typeof (result as BuilderFormErrorResult).error === 'string'
  )
}

export function isBuilderSuccessValue<T extends string, P extends object>(
  result: BuilderResult<P, T>,
): result is P {
  return !isBuilderFieldErrorResult<T>(result) && !isBuilderFormErrorResult(result)
}

export function isBuilderSuccessPayload<T extends string, P>(
  result: BuilderResult<{ payload: P }, T>,
): result is { payload: P } {
  return !isBuilderFieldErrorResult<T>(result)
}

export function isBuilderSuccessFormData<T extends string>(
  result: BuilderResult<{ formData: FormData }, T>,
): result is { formData: FormData } {
  return !isBuilderFieldErrorResult<T>(result)
}
