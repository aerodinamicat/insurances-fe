import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '../../../pages/auth/auth-page.css'
import {
  createInsurancePolicy,
  updateInsurancePolicy,
  uploadAttachment,
} from '../../../api/catalog'
import type {
  AssuranceCompanyResponse,
  CustomerResponse,
  InsurancePolicyResponse,
} from '../../../api/catalog'
import { validateAttachmentDraft, createEmptyAttachmentDraft, ATTACHMENT_DOCUMENT_TYPES } from '../Attachments/attachment-draft-utils'
import { InsurancePolicyOnboardingWizard } from './InsurancePolicyOnboardingWizard'

vi.mock('../../../api/catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/catalog')>()
  return {
    ...actual,
    createInsurancePolicy: vi.fn(),
    uploadAttachment: vi.fn(),
    updateInsurancePolicy: vi.fn(),
  }
})

const createInsurancePolicyMock = vi.mocked(createInsurancePolicy)
const uploadAttachmentMock = vi.mocked(uploadAttachment)
const updateInsurancePolicyMock = vi.mocked(updateInsurancePolicy)

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
  maritalStatus: null,
  cnae: null,
  businessName: null,
  tradeName: null,
}

const companyFixture: AssuranceCompanyResponse = {
  id: 'company-1',
  alias: 'Aseguradora Demo',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  businessName: 'Aseguradora Demo',
  tradeName: null,
  taxId: 'A12345678',
}

const createdPolicy: InsurancePolicyResponse = {
  id: 'policy-new',
  alias: 'policy-new',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  identifierId: 'POL-NEW',
  branch: 'Hogar',
  effectiveAt: '2024-06-01',
  nextRenewalAt: '2025-06-01',
  cancelledAt: null,
  cancellationReason: null,
  customerId: 'customer-1',
  assuranceCompanyId: 'company-1',
  attachedContractId: null,
  status: 'Vigente',
}

function renderWizard(
  props: Partial<ComponentProps<typeof InsurancePolicyOnboardingWizard>> = {},
) {
  const onClose = vi.fn()
  const onSuccess = vi.fn()

  render(
    <InsurancePolicyOnboardingWizard
      open
      customers={[customerFixture]}
      assuranceCompanies={[companyFixture]}
      onClose={onClose}
      onSuccess={onSuccess}
      {...props}
    />,
  )

  return { onClose, onSuccess }
}

async function selectComboboxOption(
  user: ReturnType<typeof userEvent.setup>,
  label: RegExp,
  optionName: string,
) {
  const input = screen.getByRole('combobox', { name: label })
  await user.click(input)
  const option = screen.getByRole('option', { name: new RegExp(optionName) })
  await user.click(within(option).getByRole('button'))
}

async function fillPolicyTab(user: ReturnType<typeof userEvent.setup>) {
  await selectComboboxOption(user, /^Cliente/, 'Juan Pérez')
  await selectComboboxOption(user, /^Aseguradora/, 'Aseguradora Demo')
  await user.selectOptions(screen.getByLabelText(/^Ramo/), 'Hogar')
  await user.type(screen.getByLabelText(/^Identificador de póliza/), 'POL-NEW')
  await user.type(screen.getByLabelText(/^Fecha de efecto/), '2024-06-01')
}

function createPdfFile(name = 'contract.pdf') {
  return new File(['pdf-content'], name, { type: 'application/pdf' })
}

describe('InsurancePolicyOnboardingWizard', () => {
  beforeEach(() => {
    createInsurancePolicyMock.mockReset()
    uploadAttachmentMock.mockReset()
    updateInsurancePolicyMock.mockReset()
    createInsurancePolicyMock.mockResolvedValue(createdPolicy)
    uploadAttachmentMock.mockResolvedValue({
      id: 'attachment-contract',
      alias: 'attachment-contract',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      customerId: null,
      insurancePolicyId: 'policy-new',
      insuredAssetId: null,
      documentType: 'CONTRATOPOLIZA',
      documentCode: 'CONTRACT001',
      issuedAt: null,
      expiredAt: null,
      fileName: 'contract.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 10,
    })
    updateInsurancePolicyMock.mockResolvedValue({
      ...createdPolicy,
      attachedContractId: 'attachment-contract',
    })
  })

  it('shows policy tab validation under the affected field when continuing without required fields', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    const identifierInput = screen.getByLabelText(/^Identificador de póliza/)
    const feedbackId = identifierInput.getAttribute('aria-describedby')
    expect(feedbackId).toBeTruthy()
    expect(document.getElementById(feedbackId!)).toHaveTextContent(
      'El identificador de póliza es obligatorio.',
    )
    expect(identifierInput).toHaveAttribute('aria-invalid', 'true')
    expect(document.querySelector('.auth-alert')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Póliza' })).toHaveClass(
      'composition-wizard-modal__tab--error',
    )
    expect(createInsurancePolicyMock).not.toHaveBeenCalled()
    expect(screen.getByRole('tab', { name: 'Contrato' })).toBeDisabled()
  })

  it('creates the policy when leaving the first tab and unlocks contract tab', async () => {
    const user = userEvent.setup()
    renderWizard()

    await fillPolicyTab(user)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => {
      expect(createInsurancePolicyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierId: 'POL-NEW',
          branch: 'Hogar',
          customerId: 'customer-1',
          assuranceCompanyId: 'company-1',
        }),
      )
    })

    expect(
      await screen.findByText(/Este documento es obligatorio para finalizar/),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Contrato' })).toBeEnabled()
  })

  it('shows contract file validation under the file field when continuing without attachment', async () => {
    const user = userEvent.setup()
    renderWizard()

    await fillPolicyTab(user)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByText(/Este documento es obligatorio/)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    const fileInput = screen.getByLabelText(/^Archivo/)
    const feedbackId = fileInput.getAttribute('aria-describedby')
    expect(feedbackId).toBeTruthy()
    expect(document.getElementById(feedbackId!)).toHaveTextContent(
      validateAttachmentDraft(
        createEmptyAttachmentDraft(ATTACHMENT_DOCUMENT_TYPES.POLICY_CONTRACT.code),
      ).file!,
    )
    expect(fileInput).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('tab', { name: 'Contrato' })).toHaveClass(
      'composition-wizard-modal__tab--error',
    )
    expect(document.querySelector('.auth-alert')).not.toBeInTheDocument()
  })

  it('blocks finalize without contract file', async () => {
    const user = userEvent.setup()
    renderWizard()

    await fillPolicyTab(user)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByText(/Este documento es obligatorio/)
    await user.click(screen.getByRole('tab', { name: 'Resumen' }))

    expect(screen.getByRole('button', { name: 'Finalizar' })).toBeDisabled()
    expect(uploadAttachmentMock).not.toHaveBeenCalled()
  })

  it('shows orphan-entity guidance when contract upload fails after policy creation', async () => {
    uploadAttachmentMock.mockRejectedValue(new Error('upload failed'))
    const user = userEvent.setup()
    const { onSuccess } = renderWizard()

    await fillPolicyTab(user)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByText(/Este documento es obligatorio/)
    await user.type(screen.getByLabelText(/^Código/), 'CONTRACT001')
    await user.upload(
      screen.getByLabelText(/^Archivo/),
      createPdfFile(),
    )
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Finalizar' }))

    expect(
      await screen.findByText(
        /La póliza ya existe; puedes completar el alta desde su ficha o reintentar/,
      ),
    ).toBeInTheDocument()
    expect(createInsurancePolicyMock).toHaveBeenCalledTimes(1)
    expect(uploadAttachmentMock).toHaveBeenCalled()
    expect(updateInsurancePolicyMock).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('completes onboarding with mandatory contract attachment', async () => {
    const user = userEvent.setup()
    const { onClose, onSuccess } = renderWizard()

    await fillPolicyTab(user)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByText(/Este documento es obligatorio/)
    await user.type(screen.getByLabelText(/^Código/), 'CONTRACT001')
    await user.upload(
      screen.getByLabelText(/^Archivo/),
      createPdfFile(),
    )
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Finalizar' }))

    await waitFor(() => {
      expect(uploadAttachmentMock).toHaveBeenCalled()
      expect(updateInsurancePolicyMock).toHaveBeenCalledWith('policy-new', {
        attachedContractId: 'attachment-contract',
      })
    })
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ attachedContractId: 'attachment-contract' }),
    )
    expect(onClose).toHaveBeenCalled()
  })
})
