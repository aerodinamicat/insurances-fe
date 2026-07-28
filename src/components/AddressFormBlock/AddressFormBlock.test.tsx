import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { GOOGLE_MAPS_SEARCH_BASE_URL, GPS_ERROR_MESSAGES } from '../../utils/gps'
import { AddressFormBlock } from './AddressFormBlock'
import {
  createAddressFieldState,
  validateAddressFormValues,
} from './address-field-state'

function renderAddressBlock(
  initialValues = createAddressFieldState(),
) {
  function StatefulAddressBlock() {
    const [values, setValues] = useState(initialValues)
    return (
      <AddressFormBlock
        formId="address-form"
        values={values}
        onChange={setValues}
      />
    )
  }

  return render(<StatefulAddressBlock />)
}

describe('AddressFormBlock', () => {
  it('renders postal address fields and optional GPS input', () => {
    renderAddressBlock()

    expect(screen.getByLabelText(/^Tipo de vía/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Nombre de la vía/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Coordenadas GPS/)).toBeInTheDocument()
    expect(screen.getAllByText(/opcional/i).length).toBeGreaterThan(0)
  })

  it('shows a Google Maps link for pasted valid coordinates', async () => {
    const user = userEvent.setup()
    renderAddressBlock()

    const gpsInput = screen.getByLabelText(/^Coordenadas GPS/)
    await user.click(gpsInput)
    await user.paste('36.77054659512445, -2.814060952500045')

    const mapsLink = screen.getByRole('link', { name: 'Ver en mapa' })
    expect(mapsLink).toHaveAttribute(
      'href',
      `${GOOGLE_MAPS_SEARCH_BASE_URL}&query=${encodeURIComponent('36.77054659512445,-2.814060952500045')}`,
    )
    expect(mapsLink).toHaveAttribute('target', '_blank')
    expect(mapsLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('disables the Google Maps action for invalid GPS input', async () => {
    const user = userEvent.setup()
    renderAddressBlock()

    const gpsInput = screen.getByLabelText(/^Coordenadas GPS/)
    await user.type(gpsInput, '91,0')

    expect(
      screen.getByRole('button', { name: 'Ver en mapa' }),
    ).toBeDisabled()
    expect(
      screen.queryByRole('link', { name: 'Ver en mapa' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(GPS_ERROR_MESSAGES.invalid),
    ).toBeInTheDocument()
    expect(gpsInput).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a disabled map action when GPS is empty', () => {
    renderAddressBlock()

    expect(
      screen.queryByRole('link', { name: 'Ver en mapa' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ver en mapa' }),
    ).toBeDisabled()
  })

  it('allows filling address without GPS coordinates', async () => {
    const user = userEvent.setup()
    renderAddressBlock()

    await user.type(screen.getByLabelText(/^Nombre de la vía/), 'Mayor')
    await user.type(screen.getByLabelText(/^Código postal/), '08001')
    await user.type(screen.getByLabelText(/^Población/), 'Barcelona')

    expect(screen.getByLabelText(/^Coordenadas GPS/)).toHaveValue('')
    expect(
      screen.queryByText(GPS_ERROR_MESSAGES.invalid),
    ).not.toBeInTheDocument()
  })

  it('shows address validation errors under fields on submit', () => {
    const values = createAddressFieldState({ streetName: 'Mayor' })
    const fieldErrors = validateAddressFormValues(values)

    render(
      <AddressFormBlock
        formId="address-form"
        values={values}
        fieldErrors={fieldErrors}
        showErrors
        onChange={() => {}}
      />,
    )

    const postalCodeInput = screen.getByLabelText(/^Código postal/)
    const feedbackId = postalCodeInput.getAttribute('aria-describedby')
    expect(feedbackId).toBeTruthy()
    expect(document.getElementById(feedbackId!)).toHaveTextContent(
      fieldErrors.postalCode!,
    )
    expect(postalCodeInput).toHaveAttribute('aria-invalid', 'true')
  })
})
