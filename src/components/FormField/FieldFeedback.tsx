import type { ReactNode } from 'react'

export type FieldFeedbackProps = {
  /** Stable id referenced by the control's `aria-describedby`. */
  id?: string
  /** Field-level message; `null` or empty renders reserved space without error styling. */
  message: string | null
}

/**
 * Inline feedback below a form control.
 *
 * Accessibility contract for the paired input/select/textarea:
 * - Set `aria-describedby` to this element's `id` (and any help text ids, space-separated).
 * - Set `aria-invalid="true"` when `message` is a non-empty error string; omit or `false` otherwise.
 * - Reserve layout height with a non-breaking space when there is no message (`auth-form__field-feedback`).
 *
 * Styles: `auth-page.css` (`auth-form__field-feedback`, `auth-form__field-feedback--error`).
 */
export function FieldFeedback({ id, message }: FieldFeedbackProps): ReactNode {
  const hasMessage = Boolean(message)

  return (
    <p
      id={id}
      className={`auth-form__field-feedback${hasMessage ? ' auth-form__field-feedback--error' : ''}`}
      role={hasMessage ? 'alert' : undefined}
      aria-live={hasMessage ? 'polite' : undefined}
    >
      {message ?? '\u00a0'}
    </p>
  )
}
