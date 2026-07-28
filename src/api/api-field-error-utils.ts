import type { FieldErrors, FormValidationResult } from '../types/form-errors'
import { hasFieldErrors } from '../types/form-errors'
import type { ApiErrorBody, ApiFieldError } from './api-error-types'
import { ApiError } from './client'

const REQUIRED_FIELD_MESSAGES_ES: Partial<Record<string, string>> = {
  taxId: 'El identificador fiscal es obligatorio.',
  firstName: 'El nombre es obligatorio para particulares.',
  lastName: 'Los apellidos son obligatorios para particulares.',
  birthAt: 'La fecha de nacimiento es obligatoria para particulares.',
  biologicalGender: 'El sexo biológico es obligatorio para particulares.',
  businessName: 'La razón social es obligatoria.',
  tradeName: 'El nombre comercial es obligatorio.',
  identifierId: 'El identificador de póliza es obligatorio.',
  branch: 'El ramo es obligatorio.',
  customerId: 'El cliente es obligatorio.',
  assuranceCompanyId: 'La aseguradora es obligatoria.',
  phoneNumber: 'El teléfono es obligatorio.',
  documentType: 'El tipo de documento es obligatorio.',
  documentCode: 'El código del documento es obligatorio.',
  file: 'El archivo es obligatorio.',
  type: 'El tipo de bien es obligatorio.',
  plateNumber: 'La matrícula es obligatoria.',
  vinNumber: 'El número de bastidor es obligatorio.',
  model: 'El modelo es obligatorio.',
  streetName: 'El nombre de la vía es obligatorio.',
  postalCode: 'El código postal es obligatorio.',
  city: 'La localidad es obligatoria.',
  email: 'El correo electrónico es obligatorio.',
  password: 'La contraseña es obligatoria.',
  currentPassword: 'La contraseña actual es obligatoria.',
  newPassword: 'La nueva contraseña es obligatoria.',
  token: 'El enlace o token es obligatorio.',
}

const EXACT_MESSAGE_TRANSLATIONS_ES: Record<string, string> = {
  'A customer with this taxId already exists':
    'Ya existe un cliente con este identificador fiscal.',
  'A company customer with this business name already exists':
    'Ya existe una empresa con esta razón social.',
  'An insurance policy with this identifierId already exists':
    'Ya existe una póliza con este identificador.',
  'An insured asset with this plateNumber already exists':
    'Ya existe un bien asegurado con esta matrícula.',
  'An assurance company with this business name already exists':
    'Ya existe una aseguradora con esta razón social.',
  'taxId must contain only uppercase letters and digits':
    'El identificador fiscal solo puede contener letras y números en mayúsculas.',
  'phoneNumber must not be empty': 'El teléfono es obligatorio.',
  'phoneNumber must not contain letters':
    'El teléfono no puede contener letras.',
  'phoneNumber must not contain multiple + signs':
    'El teléfono no puede contener varios signos +.',
  'phoneNumber + sign must be at the beginning':
    'El signo + del teléfono debe ir al principio.',
  'phoneNumber contains unsupported characters':
    'El teléfono contiene caracteres no permitidos.',
  'phoneNumber is not a valid Spanish phone number':
    'El teléfono no es un número español válido.',
  'phoneNumber is not a valid international phone number':
    'El teléfono no es un número internacional válido.',
  'phoneNumber exceeds maximum E.164 length':
    'El teléfono supera la longitud máxima permitida.',
  'documentCode must be uppercase alphanumeric (1-255 characters)':
    'El código del documento solo puede contener letras y números en mayúsculas (1-255 caracteres).',
  'File is required': 'El archivo es obligatorio.',
  'birthAt cannot be in the future':
    'La fecha de nacimiento no puede ser futura.',
  'birthAt must be a valid date':
    'La fecha de nacimiento no es válida.',
  'birthAt is outside the allowed age range':
    'La fecha de nacimiento está fuera del rango de edad permitido.',
  'issuedAt must be on or before expiredAt':
    'La fecha de emisión debe ser anterior o igual a la de caducidad.',
  'gpsCoordinates must be a valid latitude,longitude pair within valid ranges':
    'Las coordenadas GPS no son válidas.',
}

const FORMAT_FIELD_MESSAGES_ES: Partial<Record<string, string>> = {
  taxId:
    'El identificador fiscal solo puede contener letras y números en mayúsculas.',
  businessName:
    'La razón social solo puede contener letras, espacios y guiones.',
  streetName:
    'El nombre de la vía solo puede contener letras, espacios y guiones.',
  city: 'La localidad solo puede contener letras, espacios y guiones.',
  region: 'La provincia solo puede contener letras, espacios y guiones.',
  documentCode:
    'El código del documento solo puede contener letras y números en mayúsculas.',
}

const REQUIRED_MESSAGE_PATTERN =
  /^(?:\w+\.)?[\w]+ (?:should not be empty|must not be empty)$/i

const UNIQUE_MESSAGE_PATTERN = /already exists$/i

const INVALID_MESSAGE_PATTERN =
  /(?:is not a valid|must be a valid|is invalid|must be a UUID)/i

const FORMAT_MESSAGE_PATTERN = /must contain only/i

export type ApiFieldMappingTable = Partial<Record<string, string>>

export function extractApiFieldErrors(body: unknown): ApiFieldError[] | undefined {
  if (typeof body !== 'object' || body === null) {
    return undefined
  }

  const errors = (body as ApiErrorBody).errors
  if (!Array.isArray(errors) || errors.length === 0) {
    return undefined
  }

  const parsed = errors.filter(
    (entry): entry is ApiFieldError =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof entry.field === 'string' &&
      entry.field.length > 0 &&
      typeof entry.message === 'string' &&
      entry.message.length > 0,
  )

  return parsed.length > 0 ? parsed : undefined
}

export function mapApiFieldToFormField(
  apiField: string,
  fieldMappings?: ApiFieldMappingTable,
): string {
  if (fieldMappings?.[apiField]) {
    return fieldMappings[apiField]!
  }

  if (apiField.startsWith('address.')) {
    return apiField.slice('address.'.length)
  }

  return apiField
}

export function translateApiFieldErrorMessage(
  message: string,
  formField?: string,
): string {
  const trimmed = message.trim()
  const exact = EXACT_MESSAGE_TRANSLATIONS_ES[trimmed]
  if (exact) {
    return exact
  }

  if (REQUIRED_MESSAGE_PATTERN.test(trimmed) && formField) {
    return (
      REQUIRED_FIELD_MESSAGES_ES[formField] ??
      'Este campo es obligatorio.'
    )
  }

  if (UNIQUE_MESSAGE_PATTERN.test(trimmed)) {
    return 'Ya existe un registro con este valor.'
  }

  if (INVALID_MESSAGE_PATTERN.test(trimmed)) {
    if (formField === 'insurancePolicyId') {
      return 'La póliza seleccionada no es válida.'
    }
    if (formField === 'customerId') {
      return 'El cliente seleccionado no es válido.'
    }
    return 'El valor no es válido.'
  }

  if (FORMAT_MESSAGE_PATTERN.test(trimmed) && formField) {
    return (
      FORMAT_FIELD_MESSAGES_ES[formField] ??
      'El valor no cumple el formato requerido.'
    )
  }

  return 'El valor no es válido.'
}

export function buildFieldErrorsFromApiError(
  error: unknown,
  options?: {
    isFormError?: (error: unknown) => error is ApiError
    fieldMappings?: ApiFieldMappingTable
  },
): FieldErrors {
  const isFormError =
    options?.isFormError ??
    ((value: unknown): value is ApiError => value instanceof ApiError)

  if (!isFormError(error)) {
    return {}
  }

  const apiErrors = extractApiFieldErrors(error.body)
  if (!apiErrors) {
    return {}
  }

  const fieldErrors: FieldErrors = {}

  for (const { field, message } of apiErrors) {
    const formField = mapApiFieldToFormField(field, options?.fieldMappings)
    if (fieldErrors[formField]) {
      continue
    }
    fieldErrors[formField] = translateApiFieldErrorMessage(message, formField)
  }

  return fieldErrors
}

export function getApiFormErrorState(
  error: unknown,
  options: {
    getFormErrorMessage: (error: unknown, fallback?: string) => string
    isFormError?: (error: unknown) => error is ApiError
    fieldMappings?: ApiFieldMappingTable
    fallback?: string
  },
): FormValidationResult {
  const fieldErrors = buildFieldErrorsFromApiError(error, {
    isFormError: options.isFormError,
    fieldMappings: options.fieldMappings,
  })

  if (hasFieldErrors(fieldErrors)) {
    return { fieldErrors, formError: null }
  }

  return {
    fieldErrors: {},
    formError: options.getFormErrorMessage(error, options.fallback),
  }
}
