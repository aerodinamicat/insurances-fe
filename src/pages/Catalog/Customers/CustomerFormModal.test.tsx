import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '../../../pages/auth/auth-page.css'
import { updateCustomer } from '../../../api/catalog'
import type { CustomerResponse } from '../../../api/catalog'
import { ApiError } from '../../../api/client'
import { validateCustomerValues, buildInitialCustomerValues } from './customer-form-utils'
import { CustomerFormModal } from './CustomerFormModal'

vi.mock('../../../api/catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/catalog')>()
  return {
    ...actual,
    updateCustomer: vi.fn(),
  }
})

const updateCustomerMock = vi.mocked(updateCustomer)

const customerFixture: CustomerResponse = {
  id: 'customer-1',
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
  maritalStatus: 'Casado/a',
  cnae: null,
  businessName: null,
  tradeName: null,
}

describe('CustomerFormModal field errors', () => {
  beforeEach(() => {
    updateCustomerMock.mockReset()
    updateCustomerMock.mockResolvedValue(customerFixture)
  })

  it('shows client validation errors under the affected field instead of the global banner', async () => {
    const user = userEvent.setup()

    render(
      <CustomerFormModal
        mode="edit"
        open
        customer={customerFixture}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )

    const firstNameInput = screen.getByLabelText(/^Nombre/)
    await user.clear(firstNameInput)
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    const fieldErrors = validateCustomerValues({
      ...buildInitialCustomerValues(customerFixture),
      firstName: '',
    })

    const feedbackId = firstNameInput.getAttribute('aria-describedby')
    expect(feedbackId).toBeTruthy()
    expect(document.getElementById(feedbackId!)).toHaveTextContent(
      fieldErrors.firstName!,
    )
    expect(firstNameInput).toHaveAttribute('aria-invalid', 'true')
    expect(document.querySelector('.auth-alert')).not.toBeInTheDocument()
    expect(updateCustomerMock).not.toHaveBeenCalled()
  })

  it('maps a 409 UNIQUE API error to the taxId field', async () => {
    const user = userEvent.setup()

    updateCustomerMock.mockRejectedValue(
      new ApiError('Conflict', 409, {
        statusCode: 409,
        message: 'Conflict',
        errors: [
          {
            field: 'taxId',
            message: 'A customer with this taxId already exists',
          },
        ],
      }),
    )

    render(
      <CustomerFormModal
        mode="edit"
        open
        customer={customerFixture}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    const taxIdInput = await screen.findByLabelText(/^Identificador fiscal/)
    const feedbackId = taxIdInput.getAttribute('aria-describedby')

    await waitFor(() => {
      expect(feedbackId).toBeTruthy()
      expect(document.getElementById(feedbackId!)).toHaveTextContent(
        'Ya existe un cliente con este identificador fiscal.',
      )
    })

    expect(taxIdInput).toHaveAttribute('aria-invalid', 'true')
    expect(document.querySelector('.auth-alert')).not.toBeInTheDocument()
  })
})
