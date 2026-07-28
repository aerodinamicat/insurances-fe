import { useMemo, useState } from 'react'
import {
  createInsurancePolicy,
  updateInsurancePolicy,
} from '../../../api/catalog'
import type {
  AssuranceCompanyResponse,
  CustomerResponse,
  InsurancePolicyResponse,
} from '../../../api/catalog'
import { CatalogModal } from '../../../components/CatalogModal'
import { useCatalogFormErrors } from '../../../hooks/useCatalogFormErrors'
import { isBuilderSuccessValue } from '../../../types/form-errors'
import {
  InsurancePolicyFormFields,
  addOneYearToDateInputValue,
} from './InsurancePolicyFormFields'
import {
  buildCreatePayload,
  buildInitialValues,
  buildUpdatePayload,
  type InsurancePolicyFormValues,
} from './policy-form-utils'
import './InsurancePoliciesPage.css'

type InsurancePolicyFormModalProps = {
  mode: 'create' | 'edit'
  open: boolean
  policy?: InsurancePolicyResponse
  customers: CustomerResponse[]
  assuranceCompanies: AssuranceCompanyResponse[]
  defaultCustomerId?: string | null
  customerLocked?: boolean
  isLoadingOptions?: boolean
  onClose: () => void
  onSuccess: (policy: InsurancePolicyResponse) => void
}

export function InsurancePolicyFormModal({
  mode,
  open,
  policy,
  customers,
  assuranceCompanies,
  defaultCustomerId,
  customerLocked = false,
  isLoadingOptions = false,
  onClose,
  onSuccess,
}: InsurancePolicyFormModalProps) {
  const formId = 'insurance-policy-form-modal'
  const [values, setValues] = useState<InsurancePolicyFormValues>(() =>
    buildInitialValues(policy, defaultCustomerId),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    fieldErrors,
    formError,
    submitted,
    touchedFields,
    resetFormErrors,
    clearFieldError,
    touchField,
    applyBuilderResult,
    applyApiError,
    applyFormError,
  } = useCatalogFormErrors<keyof InsurancePolicyFormValues>()

  function updateField<K extends keyof InsurancePolicyFormValues>(
    field: K,
    value: InsurancePolicyFormValues[K],
  ) {
    clearFieldError(field)
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleEffectiveAtChange(value: string) {
    clearFieldError('effectiveAt')
    clearFieldError('nextRenewalAt')
    setValues((current) => ({
      ...current,
      effectiveAt: value,
      nextRenewalAt: addOneYearToDateInputValue(value),
    }))
  }

  async function handleSubmit() {
    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        const payload = buildCreatePayload(values)
        if (applyBuilderResult(payload)) {
          return
        }
        if (!isBuilderSuccessValue(payload)) {
          return
        }

        const created = await createInsurancePolicy(payload)
        onSuccess(created)
        return
      }

      if (!policy) {
        applyFormError('No se encontró la póliza a editar.')
        return
      }

      const payload = buildUpdatePayload(values, policy)
      if (applyBuilderResult(payload)) {
        return
      }
      if (!isBuilderSuccessValue(payload)) {
        return
      }

      const updated = await updateInsurancePolicy(policy.id, payload)
      onSuccess(updated)
    } catch (caught) {
      applyApiError(caught, {
        entity: 'insurance-policy',
        fallback:
          mode === 'create'
            ? 'No se pudo crear la póliza. Inténtalo de nuevo.'
            : 'No se pudo actualizar la póliza. Inténtalo de nuevo.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDisabled = isSubmitting || isLoadingOptions
  const initialValues = useMemo(
    () => buildInitialValues(policy, defaultCustomerId),
    [policy, defaultCustomerId],
  )
  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [values, initialValues],
  )

  function handleResetAction() {
    setValues(initialValues)
    resetFormErrors()
  }

  return (
    <CatalogModal
      open={open}
      title={mode === 'create' ? 'Nueva póliza' : 'Editar póliza'}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={formError}
      isDirty={isDirty}
      autoFocusFirstField={false}
      resetActionLabel={
        mode === 'create' ? 'Vaciar campos' : 'Restablecer valores'
      }
      onResetAction={handleResetAction}
    >
      <InsurancePolicyFormFields
        formId={formId}
        values={values}
        customers={customers}
        assuranceCompanies={assuranceCompanies}
        isSubmitting={isDisabled}
        isLoadingOptions={isLoadingOptions}
        customerLocked={customerLocked}
        showCancellation={mode === 'edit'}
        fieldErrors={fieldErrors}
        showErrors={submitted}
        touchedFields={touchedFields}
        onFieldChange={updateField}
        onEffectiveAtChange={handleEffectiveAtChange}
        onFieldBlur={touchField}
      />
    </CatalogModal>
  )
}
