import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '../../../pages/auth/auth-page.css'
import {
  createContact,
  createCustomer,
  uploadAttachment,
} from '../../../api/catalog'
import type { ContactResponse, CustomerResponse } from '../../../api/catalog'
import { PHONE_ERROR_MESSAGES } from '../../../utils/phone'
import { validateContactDraft, createEmptyContactDraft } from '../Contacts/contact-draft-utils'
import { CustomerOnboardingWizard } from './CustomerOnboardingWizard'

vi.mock('../../../api/catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/catalog')>()
  return {
    ...actual,
    createCustomer: vi.fn(),
    createContact: vi.fn(),
    uploadAttachment: vi.fn(),
  }
})

const createCustomerMock = vi.mocked(createCustomer)
const createContactMock = vi.mocked(createContact)
const uploadAttachmentMock = vi.mocked(uploadAttachment)

const createdCustomer: CustomerResponse = {
  id: 'customer-new',
  alias: 'Juan Pérez',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  type: 'Particular',
  taxId: '12345678Z',
  firstName: 'Juan',
  lastName: 'Pérez',
  birthAt: '1985-03-10',
  age: 41,
  biologicalGender: 'Masculino',
  maritalStatus: null,
  cnae: null,
  businessName: null,
  tradeName: null,
}

const createdContact: ContactResponse = {
  id: 'contact-new',
  alias: 'contact-new',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  customerId: 'customer-new',
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

function renderWizard(
  props: Partial<ComponentProps<typeof CustomerOnboardingWizard>> = {},
) {
  const onClose = vi.fn()
  const onSuccess = vi.fn()

  render(
    <CustomerOnboardingWizard
      open
      onClose={onClose}
      onSuccess={onSuccess}
      {...props}
    />,
  )

  return { onClose, onSuccess }
}

async function fillParticularCustomer(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Nombre/), 'Juan')
  await user.type(screen.getByLabelText(/^Apellidos/), 'Pérez')
  await user.type(screen.getByLabelText(/^Fecha de nacimiento/), '1985-03-10')
  await user.selectOptions(
    screen.getByLabelText(/^Sexo biológico/),
    'Masculino',
  )
  await user.type(screen.getByLabelText(/^Identificador fiscal/), '12345678Z')
}

async function fillContactPhone(user: ReturnType<typeof userEvent.setup>) {
  await user.clear(screen.getByLabelText(/^Teléfono/))
  await user.type(screen.getByLabelText(/^Teléfono/), '612345678')
}

describe('CustomerOnboardingWizard', () => {
  beforeEach(() => {
    createCustomerMock.mockReset()
    createContactMock.mockReset()
    uploadAttachmentMock.mockReset()
    createCustomerMock.mockResolvedValue(createdCustomer)
    createContactMock.mockResolvedValue(createdContact)
    uploadAttachmentMock.mockResolvedValue({
      id: 'attachment-1',
      alias: 'attachment-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      customerId: 'customer-new',
      insurancePolicyId: null,
      insuredAssetId: null,
      documentType: 'DNI',
      documentCode: 'DOC001',
      issuedAt: null,
      expiredAt: null,
      fileName: 'dni.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 10,
    })
  })

  it('shows customer tab validation under the affected field when continuing without required fields', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    const taxIdInput = screen.getByLabelText(/^Identificador fiscal/)
    const feedbackId = taxIdInput.getAttribute('aria-describedby')
    expect(feedbackId).toBeTruthy()
    expect(document.getElementById(feedbackId!)).toHaveTextContent(
      'El identificador fiscal es obligatorio.',
    )
    expect(taxIdInput).toHaveAttribute('aria-invalid', 'true')
    expect(document.querySelector('.auth-alert')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Cliente' })).toHaveClass(
      'composition-wizard-modal__tab--error',
    )
    expect(createCustomerMock).not.toHaveBeenCalled()
    expect(screen.getByRole('tab', { name: 'Contactos' })).toBeDisabled()
  })

  it('creates the customer when leaving the first tab and unlocks later tabs', async () => {
    const user = userEvent.setup()
    renderWizard()

    await fillParticularCustomer(user)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => {
      expect(createCustomerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'Particular',
          taxId: '12345678Z',
          firstName: 'Juan',
          lastName: 'Pérez',
        }),
      )
    })

    expect(await screen.findByText(/Añade al menos un contacto/)).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Contactos' })).toBeEnabled()
    expect(screen.getByRole('tab', { name: 'Documentos' })).toBeEnabled()
  })

  it('blocks finalize without a valid contact phone and marks the contacts tab', async () => {
    const user = userEvent.setup()
    renderWizard()

    await fillParticularCustomer(user)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByText(/Añade al menos un contacto/)

    await user.click(screen.getByRole('tab', { name: 'Resumen' }))
    await user.click(screen.getByRole('button', { name: 'Finalizar' }))

    const phoneInput = await screen.findByLabelText(/^Teléfono/)
    expect(phoneInput).toHaveAttribute('aria-invalid', 'true')
    expect(
      await screen.findByText(
        validateContactDraft(createEmptyContactDraft('Particular')).phoneNumber!,
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Contactos' })).toHaveClass(
      'composition-wizard-modal__tab--error',
    )
    expect(document.querySelector('.auth-alert')).not.toBeInTheDocument()
    expect(createContactMock).not.toHaveBeenCalled()
  })

  it('shows phone validation under the phone field on the contacts tab', async () => {
    const user = userEvent.setup()
    renderWizard()

    await fillParticularCustomer(user)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByText(/Añade al menos un contacto/)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    const phoneInput = await screen.findByLabelText(/^Teléfono/)
    const phoneField = phoneInput.closest('.contacts-form__phone-field')
    expect(phoneField).not.toBeNull()
    expect(
      within(phoneField as HTMLElement).getByText(PHONE_ERROR_MESSAGES.empty),
    ).toBeInTheDocument()
    expect(phoneInput).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('tab', { name: 'Contactos' })).toHaveClass(
      'composition-wizard-modal__tab--error',
    )
  })

  it('shows orphan-entity guidance when contact persistence fails after customer creation', async () => {
    createContactMock.mockRejectedValue(new Error('contact failed'))
    const user = userEvent.setup()
    const { onSuccess } = renderWizard()

    await fillParticularCustomer(user)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByText(/Añade al menos un contacto/)
    await fillContactPhone(user)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Finalizar' }))

    expect(
      await screen.findByText(
        /El cliente ya existe; puedes completar el alta desde su ficha o reintentar/,
      ),
    ).toBeInTheDocument()
    expect(createCustomerMock).toHaveBeenCalledTimes(1)
    expect(createContactMock).toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('completes onboarding with customer and mandatory contact', async () => {
    const user = userEvent.setup()
    const { onClose, onSuccess } = renderWizard()

    await fillParticularCustomer(user)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByText(/Añade al menos un contacto/)
    await fillContactPhone(user)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Finalizar' }))

    await waitFor(() => {
      expect(createContactMock).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'customer-new',
          phoneNumber: '+34612345678',
        }),
      )
    })
    expect(onSuccess).toHaveBeenCalledWith(createdCustomer)
    expect(onClose).toHaveBeenCalled()
    expect(uploadAttachmentMock).not.toHaveBeenCalled()
  })
})
