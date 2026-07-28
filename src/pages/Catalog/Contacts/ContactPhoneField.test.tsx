import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { NEUTRAL_COUNTRY_LABEL } from '../../../utils/phone'
import { countryCodeToFlagEmoji } from '../../../utils/phone/phone-flags'
import { ContactPhoneField } from './ContactPhoneField'
import {
  createPhoneFieldState,
} from './phone-field-state'

function renderPhoneField(
  state: PhoneFieldState,
  onChange = vi.fn(),
) {
  return {
    onChange,
    ...render(
      <ContactPhoneField
        formId="contact-form"
        state={state}
        onChange={onChange}
      />,
    ),
  }
}

describe('ContactPhoneField', () => {
  it('defaults to Spain with visible prefix and flag for create', () => {
    renderPhoneField(createPhoneFieldState())

    const countrySelect = screen.getByLabelText(/^País del teléfono/)
    expect(screen.getByLabelText(/^Teléfono/)).toBeInTheDocument()
    expect(countrySelect).toHaveValue('ES')
    expect(screen.getByLabelText(/^País del teléfono, España/)).toBeInTheDocument()
    expect(countrySelect).toHaveTextContent(countryCodeToFlagEmoji('ES'))
    expect(countrySelect).toHaveTextContent('+34')
  })

  it('preloads national input when editing an E.164 number', () => {
    renderPhoneField(createPhoneFieldState('+34612345678'))

    const countrySelect = screen.getByLabelText(/^País del teléfono/)
    expect(screen.getByLabelText(/^Teléfono/)).toHaveValue('612345678')
    expect(countrySelect).toHaveValue('ES')
    expect(countrySelect).toHaveTextContent('+34')
  })

  it('shows raw mode for unparseable historical values', () => {
    renderPhoneField(createPhoneFieldState('not-a-phone'))

    expect(screen.getByLabelText(/^Teléfono/)).toHaveValue('not-a-phone')
    expect(
      screen.getByText('Formato no reconocido. Corrige el número para guardarlo.'),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/^País del teléfono/)).not.toBeInTheDocument()
  })

  it('uses neutral country label without flag for ambiguous prefixes', () => {
    renderPhoneField(createPhoneFieldState('+8821612345678'))

    const countrySelect = screen.getByLabelText(/^País del teléfono/)
    expect(countrySelect).toHaveValue('')
    expect(countrySelect).toHaveTextContent(NEUTRAL_COUNTRY_LABEL)
    expect(countrySelect).toHaveTextContent('+882')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('forwards national input changes to the parent state', async () => {
    const user = userEvent.setup()

    function StatefulPhoneField() {
      const [state, setState] = useState(createPhoneFieldState())
      return (
        <ContactPhoneField
          formId="contact-form"
          state={state}
          onChange={setState}
        />
      )
    }

    render(<StatefulPhoneField />)

    await user.type(screen.getByLabelText(/^Teléfono/), '612345678')

    expect(screen.getByLabelText(/^Teléfono/)).toHaveValue('612345678')
  })
})
