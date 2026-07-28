import type {
  CreateInsurancePolicyPayload,
  InsurancePolicyResponse,
  PolicyBranch,
  UpdateInsurancePolicyPayload,
} from '../../../api/catalog'
import type { BuilderResult, FieldErrors } from '../../../types/form-errors'
import { hasFieldErrors } from '../../../types/form-errors'

export const POLICY_BRANCHES: PolicyBranch[] = [
  'Accidentes',
  'Automóvil',
  'Comunidad de vecinos',
  'Decesos',
  'Hogar',
  'Patrimonio',
  'Responsabilidad civil',
  'Riesgo',
  'SAC',
  'Salud',
  'Viaje',
]

export type InsurancePolicyFormValues = {
  identifierId: string
  branch: PolicyBranch | ''
  effectiveAt: string
  nextRenewalAt: string
  customerId: string | null
  assuranceCompanyId: string
  cancelledAt: string
  cancellationReason: string
}

export type InsurancePolicyFieldErrors = FieldErrors<
  keyof InsurancePolicyFormValues
>

function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function addOneYearToDateInputValue(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) {
    return ''
  }

  const nextYearDate = new Date(year + 1, month - 1, day)
  if (nextYearDate.getMonth() !== month - 1) {
    return toLocalDateInputValue(new Date(year + 1, month, 0))
  }

  return toLocalDateInputValue(nextYearDate)
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return ''
  }
  return value.slice(0, 10)
}

export function getPolicyStatusBadgeModifier(
  status: InsurancePolicyResponse['status'],
): string {
  switch (status) {
    case 'Cancelada':
      return 'cancelada'
    case 'En renovación':
      return 'en-renovacion'
    case 'Vigente':
      return 'vigente'
  }
}

export function isPolicyCancelled(
  policy: Pick<InsurancePolicyResponse, 'cancelledAt'>,
): boolean {
  return Boolean(policy.cancelledAt?.trim())
}

/** Renewal date used for list columns; null when the policy is cancelled. */
export function getPolicyRenewalTargetDate(
  policy: Pick<InsurancePolicyResponse, 'cancelledAt' | 'nextRenewalAt'>,
): string | null {
  if (isPolicyCancelled(policy)) {
    return null
  }

  return policy.nextRenewalAt
}

export function buildInitialValues(
  policy?: InsurancePolicyResponse,
  defaultCustomerId?: string | null,
): InsurancePolicyFormValues {
  return {
    identifierId: policy?.identifierId ?? '',
    branch: policy?.branch ?? '',
    effectiveAt: toDateInputValue(policy?.effectiveAt),
    nextRenewalAt: toDateInputValue(policy?.nextRenewalAt),
    customerId: policy?.customerId ?? defaultCustomerId ?? null,
    assuranceCompanyId: policy?.assuranceCompanyId ?? '',
    cancelledAt: toDateInputValue(policy?.cancelledAt),
    cancellationReason: policy?.cancellationReason ?? '',
  }
}

function normalizeIdentifierId(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase()
}

type CancellationFields = Pick<
  CreateInsurancePolicyPayload,
  'cancelledAt' | 'cancellationReason'
>

export function resolveCancellationFields(
  cancelledAt: string,
  cancellationReason: string,
  mode: 'create' | 'edit',
  initialPolicy?: InsurancePolicyResponse,
): CancellationFields | { error: string } | Record<string, never> {
  const dateValue = cancelledAt.trim()
  const reasonValue = cancellationReason.trim()
  const hasDate = Boolean(dateValue)
  const hasReason = Boolean(reasonValue)

  if (hasDate !== hasReason) {
    return {
      error:
        'La cancelación requiere fecha y motivo, o dejar ambos campos vacíos.',
    }
  }

  if (!hasDate && !hasReason) {
    if (mode === 'create') {
      return {}
    }

    if (initialPolicy?.cancelledAt || initialPolicy?.cancellationReason) {
      return {
        cancelledAt: null,
        cancellationReason: null,
      }
    }

    return {}
  }

  return {
    cancelledAt: dateValue,
    cancellationReason: reasonValue,
  }
}

function applyCancellationFieldErrors(
  errors: InsurancePolicyFieldErrors,
  cancelledAt: string,
  cancellationReason: string,
): void {
  const cancellation = resolveCancellationFields(
    cancelledAt,
    cancellationReason,
    'create',
  )

  if ('error' in cancellation) {
    errors.cancelledAt = cancellation.error
    errors.cancellationReason = cancellation.error
  }
}

export function validateFormValues(
  values: InsurancePolicyFormValues,
): InsurancePolicyFieldErrors {
  const errors: InsurancePolicyFieldErrors = {}

  if (!normalizeIdentifierId(values.identifierId)) {
    errors.identifierId = 'El identificador de póliza es obligatorio.'
  }

  if (!values.branch) {
    errors.branch = 'El ramo es obligatorio.'
  }

  if (!values.effectiveAt) {
    errors.effectiveAt = 'La fecha de efecto es obligatoria.'
  }

  if (!values.customerId) {
    errors.customerId = 'El cliente es obligatorio.'
  }

  if (!values.assuranceCompanyId) {
    errors.assuranceCompanyId = 'La aseguradora es obligatoria.'
  }

  if (values.cancelledAt && values.cancelledAt < values.effectiveAt) {
    errors.cancelledAt =
      'La fecha de cancelación no puede ser anterior a la fecha de efecto.'
  }

  applyCancellationFieldErrors(
    errors,
    values.cancelledAt,
    values.cancellationReason,
  )

  return errors
}

export function buildCreatePayload(
  values: InsurancePolicyFormValues,
): BuilderResult<
  CreateInsurancePolicyPayload,
  keyof InsurancePolicyFormValues
> {
  const fieldErrors = validateFormValues(values)
  if (hasFieldErrors(fieldErrors)) {
    return { fieldErrors }
  }

  const cancellation = resolveCancellationFields(
    values.cancelledAt,
    values.cancellationReason,
    'create',
  )

  if ('error' in cancellation) {
    return { error: cancellation.error }
  }

  const payload: CreateInsurancePolicyPayload = {
    identifierId: normalizeIdentifierId(values.identifierId),
    branch: values.branch as PolicyBranch,
    effectiveAt: values.effectiveAt,
    customerId: values.customerId!,
    assuranceCompanyId: values.assuranceCompanyId,
    ...cancellation,
  }

  if (values.nextRenewalAt.trim()) {
    payload.nextRenewalAt = values.nextRenewalAt.trim()
  }

  return payload
}

export function buildUpdatePayload(
  values: InsurancePolicyFormValues,
  initialPolicy: InsurancePolicyResponse,
): BuilderResult<
  UpdateInsurancePolicyPayload,
  keyof InsurancePolicyFormValues
> {
  const fieldErrors = validateFormValues(values)
  if (hasFieldErrors(fieldErrors)) {
    return { fieldErrors }
  }

  const cancellation = resolveCancellationFields(
    values.cancelledAt,
    values.cancellationReason,
    'edit',
    initialPolicy,
  )

  if ('error' in cancellation) {
    return { error: cancellation.error }
  }

  return {
    identifierId: normalizeIdentifierId(values.identifierId),
    branch: values.branch as PolicyBranch,
    effectiveAt: values.effectiveAt,
    nextRenewalAt: values.nextRenewalAt.trim() || undefined,
    customerId: values.customerId!,
    assuranceCompanyId: values.assuranceCompanyId,
    ...cancellation,
  }
}
