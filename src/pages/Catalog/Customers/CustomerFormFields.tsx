import { useId } from 'react'

import { FieldHelpTrigger } from '../../../components/FieldHelp'
import {
  FieldFeedback,
  RequiredMark,
  getFieldAriaProps,
  getFieldFeedbackId,
  getFieldInputErrorClass,
  getVisibleFieldError,
} from '../../../components/FormField'
import type { CustomerResponse } from '../../../api/catalog'
import {
  BIOLOGICAL_GENDERS,
  CUSTOMER_TYPES,
  MARITAL_STATUSES,
  type CustomerFieldErrors,
  type CustomerFormValues,
} from './customer-form-utils'

type CustomerFormFieldsProps = {
  formId: string
  mode: 'create' | 'edit'
  values: CustomerFormValues
  customer?: CustomerResponse
  isSubmitting: boolean
  fieldErrors?: CustomerFieldErrors
  showErrors?: boolean
  touchedFields?: Partial<Record<keyof CustomerFormValues, boolean>>
  onFieldChange: <K extends keyof CustomerFormValues>(
    field: K,
    value: CustomerFormValues[K],
  ) => void
  onFieldBlur?: (field: keyof CustomerFormValues) => void
}

export function CustomerFormFields({
  formId,
  mode,
  values,
  customer,
  isSubmitting,
  fieldErrors,
  showErrors = false,
  touchedFields,
  onFieldChange,
  onFieldBlur,
}: CustomerFormFieldsProps) {
  const cnaeHelpId = useId()
  const activeType = mode === 'edit' ? (customer?.type ?? values.type) : values.type

  const errorOptions = { fieldErrors, showErrors, touchedFields }

  function visibleError(field: keyof CustomerFormValues): string | null {
    return getVisibleFieldError(field, errorOptions)
  }

  function renderTaxIdField() {
    const error = visibleError('taxId')
    const feedbackId = getFieldFeedbackId(formId, 'taxId')

    return (
      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor={`${formId}-taxId`}>
          Identificador fiscal
          <RequiredMark />
        </label>
        <input
          id={`${formId}-taxId`}
          className={`auth-form__input${getFieldInputErrorClass(error)}`}
          type="text"
          name="taxId"
          autoComplete="off"
          required
          maxLength={63}
          value={values.taxId}
          disabled={isSubmitting}
          {...getFieldAriaProps(feedbackId, error)}
          onBlur={() => onFieldBlur?.('taxId')}
          onChange={(event) => onFieldChange('taxId', event.target.value)}
        />
        <FieldFeedback id={feedbackId} message={error} />
      </div>
    )
  }

  return (
    <>
      <div className="auth-form__field customers-form__field">
        <span className="auth-form__label" id={`${formId}-type-label`}>
          Tipo
        </span>
        {mode === 'create' ? (
          <select
            id={`${formId}-type`}
            className="auth-form__input catalog-form__select"
            name="type"
            aria-labelledby={`${formId}-type-label`}
            value={values.type}
            disabled={isSubmitting}
            onChange={(event) =>
              onFieldChange('type', event.target.value as CustomerFormValues['type'])
            }
          >
            {CUSTOMER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        ) : (
          <div
            className="customers-form__type-readonly"
            aria-labelledby={`${formId}-type-label`}
          >
            <span
              className={`catalog-badge catalog-badge--${activeType === 'Particular' ? 'particular' : 'empresa'}`}
            >
              {activeType}
            </span>
          </div>
        )}
        <FieldFeedback
          id={getFieldFeedbackId(formId, 'type')}
          message={null}
        />
      </div>

      {activeType === 'Particular' ? (
        <>
          <div className="catalog-form__row">
            <div className="auth-form__field">
              <label className="auth-form__label" htmlFor={`${formId}-firstName`}>
                Nombre
                <RequiredMark />
              </label>
              <input
                id={`${formId}-firstName`}
                className={`auth-form__input${getFieldInputErrorClass(visibleError('firstName'))}`}
                type="text"
                name="firstName"
                autoComplete="given-name"
                required
                value={values.firstName}
                disabled={isSubmitting}
                {...getFieldAriaProps(
                  getFieldFeedbackId(formId, 'firstName'),
                  visibleError('firstName'),
                )}
                onBlur={() => onFieldBlur?.('firstName')}
                onChange={(event) => onFieldChange('firstName', event.target.value)}
              />
              <FieldFeedback
                id={getFieldFeedbackId(formId, 'firstName')}
                message={visibleError('firstName')}
              />
            </div>

            <div className="auth-form__field">
              <label className="auth-form__label" htmlFor={`${formId}-lastName`}>
                Apellidos
                <RequiredMark />
              </label>
              <input
                id={`${formId}-lastName`}
                className={`auth-form__input${getFieldInputErrorClass(visibleError('lastName'))}`}
                type="text"
                name="lastName"
                autoComplete="family-name"
                required
                value={values.lastName}
                disabled={isSubmitting}
                {...getFieldAriaProps(
                  getFieldFeedbackId(formId, 'lastName'),
                  visibleError('lastName'),
                )}
                onBlur={() => onFieldBlur?.('lastName')}
                onChange={(event) => onFieldChange('lastName', event.target.value)}
              />
              <FieldFeedback
                id={getFieldFeedbackId(formId, 'lastName')}
                message={visibleError('lastName')}
              />
            </div>
          </div>

          <div className="catalog-form__row">
            <div className="auth-form__field">
              <label className="auth-form__label" htmlFor={`${formId}-birthAt`}>
                Fecha de nacimiento
                <RequiredMark />
              </label>
              <input
                id={`${formId}-birthAt`}
                className={`auth-form__input${getFieldInputErrorClass(visibleError('birthAt'))}`}
                type="date"
                name="birthAt"
                required
                value={values.birthAt}
                disabled={isSubmitting}
                {...getFieldAriaProps(
                  getFieldFeedbackId(formId, 'birthAt'),
                  visibleError('birthAt'),
                )}
                onBlur={() => onFieldBlur?.('birthAt')}
                onChange={(event) => onFieldChange('birthAt', event.target.value)}
              />
              <FieldFeedback
                id={getFieldFeedbackId(formId, 'birthAt')}
                message={visibleError('birthAt')}
              />
            </div>

            <div className="auth-form__field">
              <label
                className="auth-form__label"
                htmlFor={`${formId}-biologicalGender`}
              >
                Sexo biológico
                <RequiredMark />
              </label>
              <select
                id={`${formId}-biologicalGender`}
                className={`auth-form__input catalog-form__select${getFieldInputErrorClass(visibleError('biologicalGender'))}`}
                name="biologicalGender"
                required
                value={values.biologicalGender}
                disabled={isSubmitting}
                {...getFieldAriaProps(
                  getFieldFeedbackId(formId, 'biologicalGender'),
                  visibleError('biologicalGender'),
                )}
                onBlur={() => onFieldBlur?.('biologicalGender')}
                onChange={(event) =>
                  onFieldChange(
                    'biologicalGender',
                    event.target.value as CustomerFormValues['biologicalGender'],
                  )
                }
              >
                <option value="">Seleccionar…</option>
                {BIOLOGICAL_GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
              <FieldFeedback
                id={getFieldFeedbackId(formId, 'biologicalGender')}
                message={visibleError('biologicalGender')}
              />
            </div>
          </div>

          {renderTaxIdField()}

          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor={`${formId}-maritalStatus`}>
              Estado civil
            </label>
            <select
              id={`${formId}-maritalStatus`}
              className="auth-form__input catalog-form__select"
              name="maritalStatus"
              value={values.maritalStatus}
              disabled={isSubmitting}
              onChange={(event) =>
                onFieldChange(
                  'maritalStatus',
                  event.target.value as CustomerFormValues['maritalStatus'],
                )
              }
            >
              <option value="">Sin especificar</option>
              {MARITAL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <FieldFeedback
              id={getFieldFeedbackId(formId, 'maritalStatus')}
              message={null}
            />
          </div>
        </>
      ) : (
        <>
          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor={`${formId}-businessName`}>
              Razón social
              <RequiredMark />
            </label>
            <input
              id={`${formId}-businessName`}
              className={`auth-form__input${getFieldInputErrorClass(visibleError('businessName'))}`}
              type="text"
              name="businessName"
              autoComplete="organization"
              required
              value={values.businessName}
              disabled={isSubmitting}
              {...getFieldAriaProps(
                getFieldFeedbackId(formId, 'businessName'),
                visibleError('businessName'),
              )}
              onBlur={() => onFieldBlur?.('businessName')}
              onChange={(event) => onFieldChange('businessName', event.target.value)}
            />
            <FieldFeedback
              id={getFieldFeedbackId(formId, 'businessName')}
              message={visibleError('businessName')}
            />
          </div>

          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor={`${formId}-tradeName`}>
              Nombre comercial
            </label>
            <input
              id={`${formId}-tradeName`}
              className="auth-form__input"
              type="text"
              name="tradeName"
              value={values.tradeName}
              disabled={isSubmitting}
              onChange={(event) => onFieldChange('tradeName', event.target.value)}
            />
            <FieldFeedback
              id={getFieldFeedbackId(formId, 'tradeName')}
              message={null}
            />
          </div>

          {renderTaxIdField()}
        </>
      )}

      <div className="auth-form__field">
        <div className="catalog-form__label-row">
          <label className="auth-form__label" htmlFor={`${formId}-cnae`}>
            CNAE
          </label>
          <FieldHelpTrigger id={cnaeHelpId} label="Ayuda sobre CNAE">
            Clasificación Nacional de Actividades Económicas
          </FieldHelpTrigger>
        </div>
        <input
          id={`${formId}-cnae`}
          className={`auth-form__input${getFieldInputErrorClass(visibleError('cnae'))}`}
          type="text"
          name="cnae"
          maxLength={127}
          value={values.cnae}
          disabled={isSubmitting}
          {...getFieldAriaProps(
            getFieldFeedbackId(formId, 'cnae'),
            visibleError('cnae'),
            cnaeHelpId,
          )}
          onBlur={() => onFieldBlur?.('cnae')}
          onChange={(event) => onFieldChange('cnae', event.target.value)}
        />
        <FieldFeedback
          id={getFieldFeedbackId(formId, 'cnae')}
          message={visibleError('cnae')}
        />
      </div>
    </>
  )
}
