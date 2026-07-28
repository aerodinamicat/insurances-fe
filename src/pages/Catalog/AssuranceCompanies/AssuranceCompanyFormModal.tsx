import { useId, useMemo, useState } from 'react'
import {
  createAssuranceCompany,
  updateAssuranceCompany,
} from '../../../api/catalog/assurance-companies.api'
import type { AssuranceCompanyResponse } from '../../../api/catalog/types'
import { CatalogModal } from '../../../components'
import {
  FieldFeedback,
  getFieldAriaProps,
  getFieldFeedbackId,
  getFieldInputErrorClass,
  getVisibleFieldError,
} from '../../../components/FormField'
import { useCatalogFormErrors } from '../../../hooks/useCatalogFormErrors'

export type AssuranceCompanyFormValues = {
  businessName: string
  tradeName: string
}

type AssuranceCompanyFieldErrors = {
  businessName?: string
  tradeName?: string
}

type AssuranceCompanyFormModalProps = {
  mode: 'create' | 'edit'
  open: boolean
  initialCompany?: AssuranceCompanyResponse | null
  onClose: () => void
  onSuccess: (company: AssuranceCompanyResponse) => void
}

function buildInitialValues(
  initialCompany: AssuranceCompanyResponse | null | undefined,
): AssuranceCompanyFormValues {
  return {
    businessName: initialCompany?.businessName ?? '',
    tradeName: initialCompany?.tradeName ?? '',
  }
}

function validateAssuranceCompanyValues(
  values: AssuranceCompanyFormValues,
): AssuranceCompanyFieldErrors {
  const errors: AssuranceCompanyFieldErrors = {}

  if (!values.businessName.trim()) {
    errors.businessName = 'La razón social es obligatoria.'
  }

  return errors
}

export function AssuranceCompanyFormModal({
  mode,
  open,
  initialCompany,
  onClose,
  onSuccess,
}: AssuranceCompanyFormModalProps) {
  const formId = useId()
  const [values, setValues] = useState<AssuranceCompanyFormValues>(() =>
    buildInitialValues(initialCompany),
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
    applyFormError,
  } = useCatalogFormErrors<keyof AssuranceCompanyFieldErrors>()

  const errorOptions = { fieldErrors, showErrors: submitted, touchedFields }

  function visibleError(field: keyof AssuranceCompanyFieldErrors): string | null {
    return getVisibleFieldError(field, errorOptions)
  }

  async function handleSubmit() {
    if (applyValidationErrors(validateAssuranceCompanyValues(values))) {
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'edit' && !initialCompany) {
        applyFormError('No se encontró la aseguradora a editar.')
        return
      }

      const payload = {
        businessName: values.businessName.trim(),
        tradeName: values.tradeName.trim() || null,
      }

      const company =
        mode === 'create'
          ? await createAssuranceCompany(payload)
          : await updateAssuranceCompany(initialCompany!.id, payload)

      onSuccess(company)
    } catch (caught) {
      applyApiError(caught, {
        entity: 'assurance-company',
        fallback:
          mode === 'create'
            ? 'No se pudo crear la aseguradora. Inténtalo de nuevo.'
            : 'No se pudo actualizar la aseguradora. Inténtalo de nuevo.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = mode === 'create' ? 'Nueva aseguradora' : 'Editar aseguradora'
  const initialValues = useMemo(
    () => buildInitialValues(initialCompany),
    [initialCompany],
  )
  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [values, initialValues],
  )

  function handleResetAction() {
    setValues(initialValues)
    resetFormErrors()
  }

  const businessNameError = visibleError('businessName')

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
      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor={`${formId}-businessName`}>
          Razón social
          <span className="catalog-form__required" aria-hidden="true">
            {' '}
            *
          </span>
        </label>
        <input
          id={`${formId}-businessName`}
          className={`auth-form__input${getFieldInputErrorClass(businessNameError)}`}
          type="text"
          name="businessName"
          value={values.businessName}
          maxLength={255}
          required
          disabled={isSubmitting}
          {...getFieldAriaProps(
            getFieldFeedbackId(formId, 'businessName'),
            businessNameError,
          )}
          onBlur={() => touchField('businessName')}
          onChange={(event) => {
            clearFieldError('businessName')
            setValues((current) => ({
              ...current,
              businessName: event.target.value,
            }))
          }}
        />
        <FieldFeedback
          id={getFieldFeedbackId(formId, 'businessName')}
          message={businessNameError}
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor={`${formId}-tradeName`}>
          Nombre comercial
          <span className="catalog-form__optional"> (opcional)</span>
        </label>
        <input
          id={`${formId}-tradeName`}
          className={`auth-form__input${getFieldInputErrorClass(visibleError('tradeName'))}`}
          type="text"
          name="tradeName"
          value={values.tradeName}
          maxLength={255}
          disabled={isSubmitting}
          {...getFieldAriaProps(
            getFieldFeedbackId(formId, 'tradeName'),
            visibleError('tradeName'),
          )}
          onBlur={() => touchField('tradeName')}
          onChange={(event) => {
            clearFieldError('tradeName')
            setValues((current) => ({
              ...current,
              tradeName: event.target.value,
            }))
          }}
        />
        <FieldFeedback
          id={getFieldFeedbackId(formId, 'tradeName')}
          message={visibleError('tradeName')}
        />
      </div>
    </CatalogModal>
  )
}
