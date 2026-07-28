import type {
  AttachmentResponse,
  InsuredAssetResponse,
  InsuredAssetType,
  UpdateAttachmentPayload,
} from '../../../api/catalog'
import type { BuilderResult, FieldErrors } from '../../../types/form-errors'
import { hasFieldErrors } from '../../../types/form-errors'

export const ALLOWED_FILE_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'odt',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'avif',
] as const

export const FILE_INPUT_ACCEPT = ALLOWED_FILE_EXTENSIONS.map(
  (ext) => `.${ext}`,
).join(',')

const DOCUMENT_CODE_PATTERN = /^[A-Z0-9]{1,255}$/

export type AttachmentParentType = 'customer' | 'policy' | 'asset'

export type AttachmentDocumentType = {
  code: string
  label: string
}

export const ATTACHMENT_DOCUMENT_TYPES = {
  DNI: {
    code: 'DNI',
    label: 'DNI',
  },
  NIE: {
    code: 'NIE',
    label: 'NIE',
  },
  PASSPORT: {
    code: 'PASAPORTE',
    label: 'Pasaporte',
  },
  CIRCULATION_PERMIT: {
    code: 'PERMISOCIRCULACION',
    label: 'Permiso de circulación',
  },
  POLICY_CONTRACT: {
    code: 'CONTRATOPOLIZA',
    label: 'Contrato de póliza',
  },
  ITV_CARD: {
    code: 'TARJETAITV',
    label: 'Tarjeta de ITV',
  },
  CADASTRAL_CERTIFICATE: {
    code: 'CERTIFICADOCATASTRAL',
    label: 'Certificado catastral',
  },
} as const satisfies Record<string, AttachmentDocumentType>

const CUSTOMER_DOCUMENT_TYPES: AttachmentDocumentType[] = [
  ATTACHMENT_DOCUMENT_TYPES.DNI,
  ATTACHMENT_DOCUMENT_TYPES.NIE,
  ATTACHMENT_DOCUMENT_TYPES.PASSPORT,
  ATTACHMENT_DOCUMENT_TYPES.CIRCULATION_PERMIT,
]

const POLICY_DOCUMENT_TYPES: AttachmentDocumentType[] = [
  ATTACHMENT_DOCUMENT_TYPES.POLICY_CONTRACT,
]

const ASSET_DOCUMENT_TYPES_BY_TYPE: Partial<
  Record<InsuredAssetType, AttachmentDocumentType[]>
> = {
  Automóvil: [
    ATTACHMENT_DOCUMENT_TYPES.CIRCULATION_PERMIT,
    ATTACHMENT_DOCUMENT_TYPES.ITV_CARD,
  ],
  Inmueble: [ATTACHMENT_DOCUMENT_TYPES.CADASTRAL_CERTIFICATE],
  Instalación: [ATTACHMENT_DOCUMENT_TYPES.CADASTRAL_CERTIFICATE],
  Invernadero: [ATTACHMENT_DOCUMENT_TYPES.CADASTRAL_CERTIFICATE],
}

export type AttachmentUploadFormValues = {
  parentType: AttachmentParentType
  customerId: string | null
  insurancePolicyId: string | null
  insuredAssetId: string | null
  documentType: string
  documentCode: string
  issuedAt: string
  expiredAt: string
}

export type AttachmentEditFormValues = {
  documentType: string
  documentCode: string
  issuedAt: string
  expiredAt: string
}

export type AttachmentUploadFieldErrors = FieldErrors<
  | keyof AttachmentUploadFormValues
  | 'file'
>

export type AttachmentEditFieldErrors = FieldErrors<keyof AttachmentEditFormValues>

export function normalizeDocumentCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function getAttachmentDocumentTypeLabel(documentType: string): string {
  const normalizedCode = normalizeDocumentCode(documentType)
  const matchingDocumentType = Object.values(ATTACHMENT_DOCUMENT_TYPES).find(
    (type) => type.code === normalizedCode,
  )

  return matchingDocumentType?.label ?? documentType
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return ''
  }
  return value.slice(0, 10)
}

export function formatByteSize(byteSize: string): string {
  const bytes = Number(byteSize)
  if (!Number.isFinite(bytes) || bytes < 0) {
    return byteSize
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getParentTypeFromAttachment(
  attachment: AttachmentResponse,
): AttachmentParentType {
  if (attachment.insuredAssetId) {
    return 'asset'
  }
  if (attachment.insurancePolicyId) {
    return 'policy'
  }
  return 'customer'
}

export function inferDefaultParentType(
  customerFilterId: string | null,
  policyFilterId: string | null,
  assetFilterId: string | null,
): AttachmentParentType {
  if (assetFilterId) {
    return 'asset'
  }
  if (policyFilterId) {
    return 'policy'
  }
  if (customerFilterId) {
    return 'customer'
  }
  return 'policy'
}

export function buildInitialUploadValues(
  customerFilterId: string | null,
  policyFilterId: string | null,
  assetFilterId: string | null,
): AttachmentUploadFormValues {
  const parentType = inferDefaultParentType(
    customerFilterId,
    policyFilterId,
    assetFilterId,
  )

  return {
    parentType,
    customerId: parentType === 'customer' ? customerFilterId : null,
    insurancePolicyId: parentType === 'policy' ? policyFilterId : null,
    insuredAssetId: parentType === 'asset' ? assetFilterId : null,
    documentType: '',
    documentCode: '',
    issuedAt: '',
    expiredAt: '',
  }
}

export function getSelectedAttachmentParentType(
  values: Pick<
    AttachmentUploadFormValues,
    'customerId' | 'insurancePolicyId' | 'insuredAssetId'
  >,
): AttachmentParentType | null {
  if (values.insuredAssetId) {
    return 'asset'
  }
  if (values.insurancePolicyId) {
    return 'policy'
  }
  if (values.customerId) {
    return 'customer'
  }
  return null
}

export function getAttachmentDocumentTypeOptions(
  values: Pick<
    AttachmentUploadFormValues,
    'customerId' | 'insurancePolicyId' | 'insuredAssetId'
  >,
  assets: InsuredAssetResponse[],
): AttachmentDocumentType[] {
  const parentType = getSelectedAttachmentParentType(values)

  if (parentType === 'customer') {
    return CUSTOMER_DOCUMENT_TYPES
  }
  if (parentType === 'policy') {
    return POLICY_DOCUMENT_TYPES
  }
  if (parentType === 'asset') {
    const asset = assets.find((currentAsset) => currentAsset.id === values.insuredAssetId)
    return asset ? (ASSET_DOCUMENT_TYPES_BY_TYPE[asset.type] ?? []) : []
  }
  return []
}

export function buildInitialEditValues(
  attachment: AttachmentResponse,
): AttachmentEditFormValues {
  return {
    documentType: attachment.documentType,
    documentCode: attachment.documentCode ?? '',
    issuedAt: toDateInputValue(attachment.issuedAt),
    expiredAt: toDateInputValue(attachment.expiredAt),
  }
}

function getDocumentIdentifierFieldError(
  value: string,
  requiredMessage: string | null,
): string | null {
  const normalized = normalizeDocumentCode(value)
  if (!normalized) {
    return requiredMessage
  }
  if (!DOCUMENT_CODE_PATTERN.test(normalized)) {
    return 'El código solo puede contener letras y números (sin espacios).'
  }
  return null
}

export function getDateRangeFieldError(
  issuedAt: string,
  expiredAt: string,
): string | null {
  if (issuedAt && expiredAt && issuedAt > expiredAt) {
    return 'La fecha de emisión debe ser anterior o igual a la de caducidad.'
  }
  return null
}

export function getAttachmentDocumentFieldErrors(
  documentType: string,
  documentCode: string,
  options: {
    documentTypeRequiredMessage: string
    documentCodeRequiredMessage: string | null
  },
): Pick<AttachmentEditFieldErrors, 'documentType' | 'documentCode'> {
  const errors: Pick<AttachmentEditFieldErrors, 'documentType' | 'documentCode'> =
    {}

  const documentTypeError = getDocumentIdentifierFieldError(
    documentType,
    options.documentTypeRequiredMessage,
  )
  if (documentTypeError) {
    errors.documentType = documentTypeError
  }

  const documentCodeError = getDocumentIdentifierFieldError(
    documentCode,
    options.documentCodeRequiredMessage,
  )
  if (documentCodeError) {
    errors.documentCode = documentCodeError
  }

  return errors
}

export function validateAttachmentEditValues(
  values: AttachmentEditFormValues,
): AttachmentEditFieldErrors {
  const errors: AttachmentEditFieldErrors = {
    ...getAttachmentDocumentFieldErrors(values.documentType, values.documentCode, {
      documentTypeRequiredMessage: 'El tipo de documento es obligatorio.',
      documentCodeRequiredMessage: null,
    }),
  }

  const dateError = getDateRangeFieldError(values.issuedAt, values.expiredAt)
  if (dateError) {
    errors.expiredAt = dateError
  }

  return errors
}

export function validateAttachmentUploadValues(
  values: AttachmentUploadFormValues,
  file: File | null,
): AttachmentUploadFieldErrors {
  const errors: AttachmentUploadFieldErrors = {
    ...getAttachmentDocumentFieldErrors(values.documentType, values.documentCode, {
      documentTypeRequiredMessage: 'El tipo de documento es obligatorio.',
      documentCodeRequiredMessage: null,
    }),
  }

  if (!file) {
    errors.file = 'Selecciona un archivo para subir.'
  }

  const dateError = getDateRangeFieldError(values.issuedAt, values.expiredAt)
  if (dateError) {
    errors.expiredAt = dateError
  }

  const selectedParentIds = [
    values.customerId,
    values.insurancePolicyId,
    values.insuredAssetId,
  ].filter(Boolean)

  if (selectedParentIds.length !== 1) {
    errors.customerId =
      'Selecciona exactamente un cliente, una póliza o un bien asegurado.'
  }

  return errors
}

export function buildUploadFormData(
  values: AttachmentUploadFormValues,
  file: File | null,
): BuilderResult<{ formData: FormData }, keyof AttachmentUploadFieldErrors> {
  const fieldErrors = validateAttachmentUploadValues(values, file)
  if (hasFieldErrors(fieldErrors)) {
    return { fieldErrors }
  }

  if (!file) {
    return { fieldErrors: { file: 'Selecciona un archivo para subir.' } }
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('documentType', normalizeDocumentCode(values.documentType))

  if (values.documentCode.trim()) {
    formData.append('documentCode', normalizeDocumentCode(values.documentCode))
  }

  if (values.issuedAt) {
    formData.append('issuedAt', values.issuedAt)
  }
  if (values.expiredAt) {
    formData.append('expiredAt', values.expiredAt)
  }

  if (values.customerId) {
    formData.append('customerId', values.customerId)
  } else if (values.insurancePolicyId) {
    formData.append('insurancePolicyId', values.insurancePolicyId)
  } else if (values.insuredAssetId) {
    formData.append('insuredAssetId', values.insuredAssetId)
  }

  return { formData }
}

export function buildUpdatePayload(
  values: AttachmentEditFormValues,
  attachment: AttachmentResponse,
): BuilderResult<
  { payload: UpdateAttachmentPayload },
  keyof AttachmentEditFieldErrors
> {
  const fieldErrors = validateAttachmentEditValues(values)
  if (hasFieldErrors(fieldErrors)) {
    return { fieldErrors }
  }

  const normalizedType = normalizeDocumentCode(values.documentType)
  const normalizedCode = normalizeDocumentCode(values.documentCode)
  const payload: UpdateAttachmentPayload = {}

  if (normalizedType !== attachment.documentType) {
    payload.documentType = normalizedType
  }

  const documentCode = normalizedCode || null
  if (documentCode !== attachment.documentCode) {
    payload.documentCode = documentCode
  }

  const issuedAt = values.issuedAt || null
  if (issuedAt !== (attachment.issuedAt?.slice(0, 10) ?? null)) {
    payload.issuedAt = issuedAt
  }

  const expiredAt = values.expiredAt || null
  if (expiredAt !== (attachment.expiredAt?.slice(0, 10) ?? null)) {
    payload.expiredAt = expiredAt
  }

  if (Object.keys(payload).length === 0) {
    return { error: 'No hay cambios que guardar.' }
  }

  return { payload }
}

export function isPreviewableMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/') || mimeType === 'application/pdf'
}
