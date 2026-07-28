import type { BuilderResult, FieldErrors } from '../../../types/form-errors'
import { hasFieldErrors } from '../../../types/form-errors'
import {
  ATTACHMENT_DOCUMENT_TYPES,
  FILE_INPUT_ACCEPT,
  buildUploadFormData,
  getAttachmentDocumentFieldErrors,
  getDateRangeFieldError,
  type AttachmentUploadFormValues,
} from './attachment-form-utils'

export type AttachmentDraftFieldErrors = FieldErrors<
  'documentType' | 'documentCode' | 'issuedAt' | 'expiredAt' | 'file'
>

export type AttachmentDraft = {
  id: string
  documentType: string
  documentCode: string
  issuedAt: string
  expiredAt: string
  file: File | null
}

let attachmentDraftCounter = 0

export function createAttachmentDraftId(): string {
  attachmentDraftCounter += 1
  return `attachment-draft-${attachmentDraftCounter}`
}

export function createEmptyAttachmentDraft(
  documentType = '',
): AttachmentDraft {
  return {
    id: createAttachmentDraftId(),
    documentType,
    documentCode: '',
    issuedAt: '',
    expiredAt: '',
    file: null,
  }
}

export function validateAttachmentDraft(
  draft: AttachmentDraft,
): AttachmentDraftFieldErrors {
  const errors: AttachmentDraftFieldErrors = {}

  if (!draft.file) {
    errors.file = 'Selecciona un archivo para subir.'
  }

  const documentErrors = getAttachmentDocumentFieldErrors(
    draft.documentType,
    draft.documentCode,
    {
      documentTypeRequiredMessage: 'El tipo de documento es obligatorio.',
      documentCodeRequiredMessage: 'El código del documento es obligatorio.',
    },
  )
  Object.assign(errors, documentErrors)

  const dateError = getDateRangeFieldError(draft.issuedAt, draft.expiredAt)
  if (dateError) {
    errors.expiredAt = dateError
  }

  return errors
}

export function buildCustomerAttachmentFormData(
  customerId: string,
  draft: AttachmentDraft,
): BuilderResult<{ formData: FormData }, keyof AttachmentDraftFieldErrors> {
  const fieldErrors = validateAttachmentDraft(draft)
  if (hasFieldErrors(fieldErrors)) {
    return { fieldErrors }
  }

  const values: AttachmentUploadFormValues = {
    parentType: 'customer',
    customerId,
    insurancePolicyId: null,
    insuredAssetId: null,
    documentType: draft.documentType,
    documentCode: draft.documentCode,
    issuedAt: draft.issuedAt,
    expiredAt: draft.expiredAt,
  }

  return buildUploadFormData(values, draft.file)
}

export function buildPolicyContractFormData(
  insurancePolicyId: string,
  draft: AttachmentDraft,
  policyEffectiveAt?: string,
): BuilderResult<{ formData: FormData }, keyof AttachmentDraftFieldErrors> {
  const fieldErrors = validateAttachmentDraft(draft)
  if (hasFieldErrors(fieldErrors)) {
    return { fieldErrors }
  }

  const values: AttachmentUploadFormValues = {
    parentType: 'policy',
    customerId: null,
    insurancePolicyId,
    insuredAssetId: null,
    documentType: ATTACHMENT_DOCUMENT_TYPES.POLICY_CONTRACT.code,
    documentCode: draft.documentCode,
    issuedAt: draft.issuedAt || policyEffectiveAt || '',
    expiredAt: draft.expiredAt,
  }

  return buildUploadFormData(values, draft.file)
}

export { FILE_INPUT_ACCEPT, ATTACHMENT_DOCUMENT_TYPES }
