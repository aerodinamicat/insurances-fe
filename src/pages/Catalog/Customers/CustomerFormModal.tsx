import { useMemo, useState } from 'react'
import { createCustomer, updateCustomer } from '../../../api/catalog'
import type { CustomerResponse } from '../../../api/catalog'
import { CatalogModal } from '../../../components/CatalogModal'
import { useCatalogFormErrors } from '../../../hooks/useCatalogFormErrors'
import {
  isBuilderSuccessValue,
} from '../../../types/form-errors'
import { CustomerFormFields } from './CustomerFormFields'
import {
  buildCreateCustomerPayload,
  buildInitialCustomerValues,
  buildUpdateCustomerPayload,
  validateCustomerValues,
  type CustomerFormValues,
} from './customer-form-utils'
import './CustomersPage.css'

type CustomerFormModalProps = {
  mode: 'create' | 'edit'
  open: boolean
  customer?: CustomerResponse
  onClose: () => void
  onSuccess: (customer: CustomerResponse) => void
}

export function CustomerFormModal({
  mode,
  open,
  customer,
  onClose,
  onSuccess,
}: CustomerFormModalProps) {
  const [values, setValues] = useState<CustomerFormValues>(() =>
    buildInitialCustomerValues(customer),
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
    applyValidationErrors,
    applyApiError,
    applyBuilderResult,
    applyFormError,
  } = useCatalogFormErrors<keyof CustomerFormValues>()

  function updateField<K extends keyof CustomerFormValues>(
    field: K,
    value: CustomerFormValues[K],
  ) {
    clearFieldError(field)
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit() {
    if (applyValidationErrors(validateCustomerValues(values))) {
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        const payload = buildCreateCustomerPayload(values)
        if (applyBuilderResult(payload)) {
          return
        }
        if (!isBuilderSuccessValue(payload)) {
          return
        }

        const created = await createCustomer(payload)
        onSuccess(created)
        return
      }

      if (!customer) {
        applyFormError('No se encontró el cliente a editar.')
        return
      }

      const payload = buildUpdateCustomerPayload(values, customer)
      if (applyBuilderResult(payload)) {
        return
      }
      if (!isBuilderSuccessValue(payload)) {
        return
      }

      const updated = await updateCustomer(customer.id, payload)
      onSuccess(updated)
    } catch (caught) {
      applyApiError(caught, {
        entity: 'customer',
        fallback:
          mode === 'create'
            ? 'No se pudo crear el cliente. Inténtalo de nuevo.'
            : 'No se pudo actualizar el cliente. Inténtalo de nuevo.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = mode === 'create' ? 'Nuevo cliente' : 'Editar cliente'
  const initialValues = useMemo(
    () => buildInitialCustomerValues(customer),
    [customer],
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
      title={title}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={formError}
      isDirty={isDirty}
      resetActionLabel={
        mode === 'create' ? 'Vaciar campos' : 'Restablecer valores'
      }
      onResetAction={handleResetAction}
    >
      <CustomerFormFields
        formId="customer-form-modal"
        mode={mode}
        values={values}
        customer={customer}
        isSubmitting={isSubmitting}
        fieldErrors={fieldErrors}
        showErrors={submitted}
        touchedFields={touchedFields}
        onFieldChange={updateField}
        onFieldBlur={touchField}
      />
    </CatalogModal>
  )
}
