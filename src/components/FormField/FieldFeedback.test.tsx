import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import '../../pages/auth/auth-page.css'
import { FieldFeedback } from './FieldFeedback'

describe('FieldFeedback', () => {
  it('renders reserved space without error styling when message is null', () => {
    const { container } = render(<FieldFeedback id="email-feedback" message={null} />)

    const feedback = container.querySelector('#email-feedback')
    expect(feedback).not.toBeNull()
    expect(feedback?.childNodes).toHaveLength(1)
    expect(feedback?.firstChild?.nodeValue).toBe('\u00a0')
    expect(feedback).toHaveClass('auth-form__field-feedback')
    expect(feedback).not.toHaveClass('auth-form__field-feedback--error')
    expect(feedback).not.toHaveAttribute('role')
  })

  it('renders an alert with error styling when message is present', () => {
    render(<FieldFeedback id="email-feedback" message="Email is required." />)

    const feedback = screen.getByRole('alert')
    expect(feedback).toHaveTextContent('Email is required.')
    expect(feedback).toHaveClass(
      'auth-form__field-feedback',
      'auth-form__field-feedback--error',
    )
    expect(feedback).toHaveAttribute('aria-live', 'polite')
  })
})
