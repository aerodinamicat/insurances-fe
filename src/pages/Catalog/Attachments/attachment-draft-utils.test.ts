import { describe, expect, it } from 'vitest'

import { hasFieldErrors } from '../../../types/form-errors'
import {
  ATTACHMENT_DOCUMENT_TYPES,
  buildCustomerAttachmentFormData,
  buildPolicyContractFormData,
  createEmptyAttachmentDraft,
  validateAttachmentDraft,
} from './attachment-draft-utils'

function createPdfFile(name = 'contract.pdf') {
  return new File(['pdf-content'], name, { type: 'application/pdf' })
}

describe('attachment-draft-utils', () => {
  it('requires a file before upload validation passes', () => {
    const draft = createEmptyAttachmentDraft(ATTACHMENT_DOCUMENT_TYPES.DNI.code)
    draft.documentCode = 'DOC001'
    expect(validateAttachmentDraft(draft)).toEqual({
      file: 'Selecciona un archivo para subir.',
    })
  })

  it('requires document type and normalized code', () => {
    const draft = createEmptyAttachmentDraft()
    draft.file = createPdfFile()
    expect(validateAttachmentDraft(draft)).toEqual({
      documentType: 'El tipo de documento es obligatorio.',
      documentCode: 'El código del documento es obligatorio.',
    })

    draft.documentType = ATTACHMENT_DOCUMENT_TYPES.DNI.code
    expect(validateAttachmentDraft(draft)).toEqual({
      documentCode: 'El código del documento es obligatorio.',
    })

    draft.documentCode = '@@@'
    expect(validateAttachmentDraft(draft)).toEqual({
      documentCode: 'El código del documento es obligatorio.',
    })
  })

  it('collects multiple draft errors at once', () => {
    const draft = createEmptyAttachmentDraft()
    const errors = validateAttachmentDraft(draft)

    expect(hasFieldErrors(errors)).toBe(true)
    expect(errors.file).toBeTruthy()
    expect(errors.documentType).toBeTruthy()
  })

  it('rejects expired dates before issued dates', () => {
    const draft = createEmptyAttachmentDraft(ATTACHMENT_DOCUMENT_TYPES.DNI.code)
    draft.file = createPdfFile()
    draft.documentCode = 'DOC001'
    draft.issuedAt = '2025-01-10'
    draft.expiredAt = '2025-01-01'
    expect(validateAttachmentDraft(draft)).toEqual({
      expiredAt: 'La fecha de emisión debe ser anterior o igual a la de caducidad.',
    })
  })

  it('builds customer attachment form data', () => {
    const draft = createEmptyAttachmentDraft(ATTACHMENT_DOCUMENT_TYPES.DNI.code)
    draft.file = createPdfFile('dni.pdf')
    draft.documentCode = 'dni001'
    draft.issuedAt = '2024-01-01'

    const result = buildCustomerAttachmentFormData('customer-1', draft)
    expect('formData' in result).toBe(true)
    if ('formData' in result) {
      expect(result.formData.get('customerId')).toBe('customer-1')
      expect(result.formData.get('documentType')).toBe('DNI')
      expect(result.formData.get('documentCode')).toBe('DNI001')
    }
  })

  it('returns fieldErrors from customer attachment builder when invalid', () => {
    const draft = createEmptyAttachmentDraft()
    const result = buildCustomerAttachmentFormData('customer-1', draft)

    expect(result).toEqual({
      fieldErrors: validateAttachmentDraft(draft),
    })
  })

  it('builds policy contract form data with fixed document type', () => {
    const draft = createEmptyAttachmentDraft(
      ATTACHMENT_DOCUMENT_TYPES.POLICY_CONTRACT.code,
    )
    draft.file = createPdfFile()
    draft.documentCode = 'contract001'

    const result = buildPolicyContractFormData(
      'policy-1',
      draft,
      '2024-02-01',
    )
    expect('formData' in result).toBe(true)
    if ('formData' in result) {
      expect(result.formData.get('insurancePolicyId')).toBe('policy-1')
      expect(result.formData.get('documentType')).toBe('CONTRATOPOLIZA')
      expect(result.formData.get('documentCode')).toBe('CONTRACT001')
      expect(result.formData.get('issuedAt')).toBe('2024-02-01')
    }
  })

  it('keeps the document issued date when provided for a policy', () => {
    const draft = createEmptyAttachmentDraft(
      ATTACHMENT_DOCUMENT_TYPES.POLICY_CONTRACT.code,
    )
    draft.file = createPdfFile()
    draft.documentCode = 'contract002'
    draft.issuedAt = '2024-03-01'

    const result = buildPolicyContractFormData(
      'policy-1',
      draft,
      '2024-02-01',
    )

    expect('formData' in result).toBe(true)
    if ('formData' in result) {
      expect(result.formData.get('issuedAt')).toBe('2024-03-01')
    }
  })
})
