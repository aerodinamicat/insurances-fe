import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createContact, updateContact } from '../../../api/catalog'
import type { ContactResponse, CustomerResponse } from '../../../api/catalog'
import { ApiError } from '../../../api/client'
import { PHONE_ERROR_MESSAGES } from '../../../utils/phone'
import { GOOGLE_MAPS_SEARCH_BASE_URL } from '../../../utils/gps'
import { ContactFormModal } from './ContactFormModal'

vi.mock('../../../api/catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/catalog')>()
  return {
    ...actual,
    createContact: vi.fn(),
    updateContact: vi.fn(),
  }
})

const createContactMock = vi.mocked(createContact)
const updateContactMock = vi.mocked(updateContact)

const customerFixture: CustomerResponse = {
  id: 'customer-1',
  alias: 'Cliente Demo',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  type: 'Empresa',
  taxId: 'B12345678',
  firstName: null,
  lastName: null,
  birthAt: null,
  age: null,
  biologicalGender: null,
  maritalStatus: null,
  cnae: null,
  businessName: 'Cliente Demo SL',
  tradeName: null,
}

const contactFixture: ContactResponse = {
  id: 'contact-1',
  alias: 'contact-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  customerId: 'customer-1',
  type: 'Personal',
  reference: null,
  phoneNumber: '+34612345678',
  email: null,
  streetType: null,
  streetName: null,
  streetNumber: null,
  building: null,
  stairs: null,
  floor: null,
  door: null,
  postalCode: null,
  city: null,
  region: null,
  gpsCoordinates: null,
}

function renderModal(
  props: Partial<ComponentProps<typeof ContactFormModal>> = {},
) {
  const onClose = vi.fn()
  const onSuccess = vi.fn()

  render(
    <ContactFormModal
      open
      mode="create"
      customers={[customerFixture]}
      defaultCustomerId="customer-1"
      onClose={onClose}
      onSuccess={onSuccess}
      {...props}
    />,
  )

  return { onClose, onSuccess }
}

describe('ContactFormModal field errors', () => {
  beforeEach(() => {
    createContactMock.mockReset()
    updateContactMock.mockReset()
    createContactMock.mockResolvedValue(contactFixture)
    updateContactMock.mockResolvedValue(contactFixture)
  })

  it('shows phone validation under the phone field container on submit', async () => {
    const user = userEvent.setup()
    renderModal()

    const phoneInput = screen.getByLabelText(/^Teléfono/)
    await user.clear(phoneInput)
    await user.type(phoneInput, '12345')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    const phoneField = phoneInput.closest('.contacts-form__phone-field')
    expect(phoneField).not.toBeNull()
    expect(
      within(phoneField as HTMLElement).getByText(
        PHONE_ERROR_MESSAGES.invalidSpanish,
      ),
    ).toBeInTheDocument()
    expect(phoneInput).toHaveAttribute('aria-invalid', 'true')
    expect(document.querySelector('.auth-alert')).not.toBeInTheDocument()
    expect(createContactMock).not.toHaveBeenCalled()
  })

  it('maps a 409 API phoneNumber error under the phone field', async () => {
    const user = userEvent.setup()

    createContactMock.mockRejectedValue(
      new ApiError('Conflict', 409, {
        statusCode: 409,
        message: 'Conflict',
        errors: [
          {
            field: 'phoneNumber',
            message: 'phoneNumber is not a valid Spanish phone number',
          },
        ],
      }),
    )

    renderModal()

    const phoneInput = screen.getByLabelText(/^Teléfono/)
    await user.clear(phoneInput)
    await user.type(phoneInput, '612345678')
    await user.click(screen.getByLabelText(/^Referencia/))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(createContactMock).toHaveBeenCalled()
    })

    const phoneField = phoneInput.closest('.contacts-form__phone-field')
    expect(phoneField).not.toBeNull()

    await waitFor(() => {
      expect(
        within(phoneField as HTMLElement).getByText(
          'El teléfono no es un número español válido.',
        ),
      ).toBeInTheDocument()
    })

    expect(phoneInput).toHaveAttribute('aria-invalid', 'true')
    expect(document.querySelector('.auth-alert')).not.toBeInTheDocument()
  })
})

describe('ContactFormModal phone capture', () => {
  beforeEach(() => {
    createContactMock.mockReset()
    updateContactMock.mockReset()
    createContactMock.mockResolvedValue(contactFixture)
    updateContactMock.mockResolvedValue(contactFixture)
  })

  it('does not focus the customer field when the dialog opens', async () => {
    renderModal()

    const customerInput = screen.getByLabelText(/^Cliente/)

    await waitFor(() => {
      expect(document.activeElement).not.toBe(customerInput)
      expect(document.activeElement?.tagName).toBe('DIALOG')
    })
  })

  it('submits only phoneNumber as E.164 for a Spanish national entry', async () => {
    const user = userEvent.setup()
    const { onSuccess } = renderModal()

    await user.clear(screen.getByLabelText(/^Teléfono/))
    await user.type(screen.getByLabelText(/^Teléfono/), '612345678')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(createContactMock).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'customer-1',
          phoneNumber: '+34612345678',
        }),
      )
    })

    const payload = createContactMock.mock.calls[0]?.[0]
    expect(payload).toBeDefined()
    expect(Object.keys(payload ?? {})).not.toContain('phoneCountry')
    expect(Object.keys(payload ?? {})).not.toContain('phonePrefix')
    expect(onSuccess).toHaveBeenCalled()
  })

  it('normalizes pasted international input with separators', async () => {
    const user = userEvent.setup()
    renderModal()

    const phoneInput = screen.getByLabelText(/^Teléfono/)
    await user.clear(phoneInput)
    await user.click(phoneInput)
    await user.paste('+34 612 345 678')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(createContactMock).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumber: '+34612345678',
        }),
      )
    })
  })

  it('normalizes 00 international prefix on submit', async () => {
    const user = userEvent.setup()
    renderModal()

    const phoneInput = screen.getByLabelText(/^Teléfono/)
    await user.clear(phoneInput)
    await user.type(phoneInput, '0034612345678')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(createContactMock).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumber: '+34612345678',
        }),
      )
    })
  })

  it('shows a validation error for invalid phone input', async () => {
    const user = userEvent.setup()
    renderModal()

    const phoneInput = screen.getByLabelText(/^Teléfono/)
    await user.clear(phoneInput)
    await user.type(phoneInput, '12345')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(
      await screen.findByText(PHONE_ERROR_MESSAGES.invalidSpanish),
    ).toBeInTheDocument()
    expect(document.querySelector('.auth-alert')).not.toBeInTheDocument()
    expect(createContactMock).not.toHaveBeenCalled()
  })

  it('compacts address codes to uppercase alphanumeric values on submit', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.clear(screen.getByLabelText(/^Teléfono/))
    await user.type(screen.getByLabelText(/^Teléfono/), '612345678')
    await user.type(screen.getByLabelText(/^Nombre de la vía/), 'Mayor')
    await user.type(screen.getByLabelText(/^Número/), ' 12 a ')
    await user.type(screen.getByLabelText(/^Bloque/), ' bl-2 ')
    await user.type(screen.getByLabelText(/^Escalera/), ' e 1 ')
    await user.type(screen.getByLabelText(/^Piso/), ' 3 b ')
    await user.type(screen.getByLabelText(/^Puerta/), 'c')
    await user.type(screen.getByLabelText(/^Código postal/), ' 08 001 ')
    await user.type(screen.getByLabelText(/^Población/), 'Madrid')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(createContactMock).toHaveBeenCalledWith(
        expect.objectContaining({
          streetNumber: '12A',
          building: 'BL2',
          stairs: 'E1',
          floor: '3B',
          door: 'C',
          postalCode: '08001',
        }),
      )
    })
  })

  it('preloads edit state from an existing E.164 value', () => {
    renderModal({
      mode: 'edit',
      contact: contactFixture,
    })

    const countrySelect = screen.getByLabelText(/^País del teléfono/)
    expect(screen.getByLabelText(/^Teléfono/)).toHaveValue('612345678')
    expect(countrySelect).toHaveValue('ES')
    expect(countrySelect).toHaveTextContent('+34')
  })

  it('does not submit customerId when updating a contact', async () => {
    const user = userEvent.setup()
    renderModal({
      mode: 'edit',
      contact: contactFixture,
    })

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(updateContactMock).toHaveBeenCalledWith(
        'contact-1',
        expect.not.objectContaining({
          customerId: expect.anything(),
        }),
      )
    })
  })

  it('allows correcting an unparseable historical value and submits E.164', async () => {
    const user = userEvent.setup()
    const invalidContact: ContactResponse = {
      ...contactFixture,
      phoneNumber: 'not-a-phone',
    }

    renderModal({
      mode: 'edit',
      contact: invalidContact,
    })

    expect(screen.getByLabelText(/^Teléfono/)).toHaveValue('not-a-phone')

    const phoneInput = screen.getByLabelText(/^Teléfono/)
    await user.clear(phoneInput)
    await user.click(phoneInput)
    await user.paste('612345678')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(updateContactMock).toHaveBeenCalledWith(
        'contact-1',
        expect.objectContaining({
          phoneNumber: '+34612345678',
        }),
      )
    })
  })
})

describe('ContactFormModal GPS capture', () => {
  beforeEach(() => {
    createContactMock.mockReset()
    updateContactMock.mockReset()
    createContactMock.mockResolvedValue(contactFixture)
    updateContactMock.mockResolvedValue(contactFixture)
  })

  it('submits normalized gpsCoordinates for pasted coordinates', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.clear(screen.getByLabelText(/^Teléfono/))
    await user.type(screen.getByLabelText(/^Teléfono/), '612345678')

    const gpsInput = screen.getByLabelText(/^Coordenadas GPS/)
    await user.click(gpsInput)
    await user.paste('36.77054659512445, -2.814060952500045')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(createContactMock).toHaveBeenCalledWith(
        expect.objectContaining({
          gpsCoordinates: '36.77054659512445,-2.814060952500045',
        }),
      )
    })
  })

  it('shows a Google Maps link for valid GPS input', async () => {
    const user = userEvent.setup()
    renderModal()

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

  it('blocks submit for invalid GPS coordinates', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.clear(screen.getByLabelText(/^Teléfono/))
    await user.type(screen.getByLabelText(/^Teléfono/), '612345678')
    await user.type(screen.getByLabelText(/^Coordenadas GPS/), '91,0')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByLabelText(/^Coordenadas GPS/)).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(createContactMock).not.toHaveBeenCalled()
  })

  it('allows saving without GPS coordinates', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.clear(screen.getByLabelText(/^Teléfono/))
    await user.type(screen.getByLabelText(/^Teléfono/), '612345678')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(createContactMock).toHaveBeenCalledWith(
        expect.objectContaining({
          gpsCoordinates: null,
        }),
      )
    })
  })

  it('preloads gpsCoordinates from an existing contact on edit', () => {
    renderModal({
      mode: 'edit',
      contact: {
        ...contactFixture,
        gpsCoordinates: '36.77,-2.81',
      },
    })

    expect(screen.getByLabelText(/^Coordenadas GPS/)).toHaveValue('36.77,-2.81')
    expect(
      screen.getByRole('link', { name: 'Ver en mapa' }),
    ).toBeInTheDocument()
  })

  it('allows GPS without postal address on submit', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.clear(screen.getByLabelText(/^Teléfono/))
    await user.type(screen.getByLabelText(/^Teléfono/), '612345678')

    const gpsInput = screen.getByLabelText(/^Coordenadas GPS/)
    await user.click(gpsInput)
    await user.paste('36.77,-2.81')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(createContactMock).toHaveBeenCalledWith(
        expect.objectContaining({
          gpsCoordinates: '36.77,-2.81',
          streetName: null,
          postalCode: null,
          city: null,
        }),
      )
    })
  })
})
