import type {
  BiologicalGender,
  CreateCustomerPayload,
  CustomerResponse,
  CustomerType,
  MaritalStatus,
  UpdateCustomerPayload,
} from '../../../api/catalog'
import type { BuilderResult, FieldErrors } from '../../../types/form-errors'
import { hasFieldErrors } from '../../../types/form-errors'

export const CUSTOMER_TYPES: CustomerType[] = ['Particular', 'Empresa']

export const BIOLOGICAL_GENDERS: BiologicalGender[] = ['Femenino', 'Masculino']

export const MARITAL_STATUSES: MaritalStatus[] = [
  'Soltero/a',
  'Casado/a',
  'Divorciado/a',
  'Viudo/a',
]

export type CustomerFormValues = {
  type: CustomerType
  taxId: string
  firstName: string
  lastName: string
  birthAt: string
  biologicalGender: BiologicalGender | ''
  maritalStatus: MaritalStatus | ''
  businessName: string
  tradeName: string
  cnae: string
}

export type CustomerFieldErrors = FieldErrors<keyof CustomerFormValues>

export function buildInitialCustomerValues(
  customer?: CustomerResponse,
): CustomerFormValues {
  return {
    type: customer?.type ?? 'Particular',
    taxId: customer?.taxId ?? '',
    firstName: customer?.firstName ?? '',
    lastName: customer?.lastName ?? '',
    birthAt: customer?.birthAt ?? '',
    biologicalGender: customer?.biologicalGender ?? '',
    maritalStatus: customer?.maritalStatus ?? '',
    businessName: customer?.businessName ?? '',
    tradeName: customer?.tradeName ?? '',
    cnae: customer?.cnae ?? '',
  }
}

export function normalizeTaxId(value: string): string {
  return value.trim().toUpperCase()
}

export function validateTaxId(value: string): string | null {
  const normalized = normalizeTaxId(value)
  if (!normalized) {
    return 'El identificador fiscal es obligatorio.'
  }
  if (!/^[A-Z0-9]+$/.test(normalized)) {
    return 'El identificador fiscal solo puede contener letras y números en mayúsculas.'
  }
  return null
}

export function validateCustomerValues(
  values: CustomerFormValues,
): CustomerFieldErrors {
  const errors: CustomerFieldErrors = {}

  const taxIdError = validateTaxId(values.taxId)
  if (taxIdError) {
    errors.taxId = taxIdError
  }

  if (values.type === 'Particular') {
    if (!values.firstName.trim()) {
      errors.firstName = 'El nombre es obligatorio para particulares.'
    }
    if (!values.lastName.trim()) {
      errors.lastName = 'Los apellidos son obligatorios para particulares.'
    }
    if (!values.birthAt) {
      errors.birthAt = 'La fecha de nacimiento es obligatoria para particulares.'
    }
    if (!values.biologicalGender) {
      errors.biologicalGender =
        'El sexo biológico es obligatorio para particulares.'
    }
    return errors
  }

  if (!values.businessName.trim()) {
    errors.businessName = 'La razón social es obligatoria para empresas.'
  }

  return errors
}

export function buildCreateCustomerPayload(
  values: CustomerFormValues,
): BuilderResult<CreateCustomerPayload, keyof CustomerFormValues> {
  const fieldErrors = validateCustomerValues(values)
  if (hasFieldErrors(fieldErrors)) {
    return { fieldErrors }
  }

  const taxId = normalizeTaxId(values.taxId)
  const cnae = values.cnae.trim() ? values.cnae.trim().toUpperCase() : null

  if (values.type === 'Particular') {
    return {
      type: 'Particular',
      taxId,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      birthAt: values.birthAt,
      biologicalGender: values.biologicalGender as BiologicalGender,
      maritalStatus: values.maritalStatus || null,
      cnae,
    }
  }

  return {
    type: 'Empresa',
    taxId,
    businessName: values.businessName.trim(),
    tradeName: values.tradeName.trim() || null,
    cnae,
  }
}

export function buildUpdateCustomerPayload(
  values: CustomerFormValues,
  customer: CustomerResponse,
): BuilderResult<UpdateCustomerPayload, keyof CustomerFormValues> {
  const fieldErrors = validateCustomerValues(values)
  if (hasFieldErrors(fieldErrors)) {
    return { fieldErrors }
  }

  const taxId = normalizeTaxId(values.taxId)
  const cnae = values.cnae.trim() ? values.cnae.trim().toUpperCase() : null

  if (customer.type === 'Particular') {
    return {
      taxId,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      birthAt: values.birthAt,
      biologicalGender: values.biologicalGender as BiologicalGender,
      maritalStatus: values.maritalStatus || null,
      cnae,
    }
  }

  return {
    taxId,
    businessName: values.businessName.trim(),
    tradeName: values.tradeName.trim() || null,
    cnae,
  }
}
