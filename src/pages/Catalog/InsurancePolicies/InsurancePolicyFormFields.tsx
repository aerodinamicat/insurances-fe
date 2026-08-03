import type {
  AssuranceCompanyResponse,
  CustomerResponse,
  PolicyBranch,
} from '../../../api/catalog'
import {
  FieldFeedback,
  getFieldAriaProps,
  getFieldFeedbackId,
  getFieldInputErrorClass,
  getVisibleFieldError,
} from '../../../components/FormField'
import { AssuranceCompanyCombobox } from '../components/AssuranceCompanyCombobox'
import { CustomerCombobox } from '../components/CustomerCombobox'
import {
  POLICY_BRANCHES,
  type InsurancePolicyFieldErrors,
  type InsurancePolicyFormValues,
} from './policy-form-utils'
import './InsurancePoliciesPage.css'

type InsurancePolicyFormFieldsProps = {
  formId: string
  values: InsurancePolicyFormValues
  customers: CustomerResponse[]
  assuranceCompanies: AssuranceCompanyResponse[]
  isSubmitting: boolean
  isLoadingOptions?: boolean
  customerLocked?: boolean
  showCancellation?: boolean
  fieldErrors?: InsurancePolicyFieldErrors
  showErrors?: boolean
  touchedFields?: Partial<Record<keyof InsurancePolicyFormValues, boolean>>
  onFieldChange: <K extends keyof InsurancePolicyFormValues>(
    field: K,
    value: InsurancePolicyFormValues[K],
  ) => void
  onEffectiveAtChange: (value: string) => void
  onFieldBlur?: (field: keyof InsurancePolicyFormValues) => void
}

export function InsurancePolicyFormFields({
  formId,
  values,
  customers,
  assuranceCompanies,
  isSubmitting,
  isLoadingOptions = false,
  customerLocked = false,
  showCancellation = true,
  fieldErrors,
  showErrors = false,
  touchedFields,
  onFieldChange,
  onEffectiveAtChange,
  onFieldBlur,
}: InsurancePolicyFormFieldsProps) {
  const isDisabled = isSubmitting || isLoadingOptions
  const errorOptions = { fieldErrors, showErrors, touchedFields }

  function visibleError(field: keyof InsurancePolicyFormValues): string | null {
    return getVisibleFieldError(field, errorOptions)
  }

  const customerError = visibleError('customerId')
  const customerFeedbackId = getFieldFeedbackId(formId, 'customerId')
  const assuranceCompanyError = visibleError('assuranceCompanyId')
  const assuranceCompanyFeedbackId = getFieldFeedbackId(formId, 'assuranceCompanyId')

  return (
    <>
      <div className="catalog-form__row insurance-policies-form__row--full">
        <CustomerCombobox
          customers={customers}
          value={values.customerId}
          onChange={(customerId) => onFieldChange('customerId', customerId)}
          label="Cliente"
          required
          disabled={isDisabled || customerLocked}
          isLoading={isLoadingOptions}
          openOnFocus={false}
          feedbackId={customerFeedbackId}
          fieldError={customerError}
          onFieldBlur={() => onFieldBlur?.('customerId')}
        />
      </div>

      <div className="catalog-form__row insurance-policies-form__row--full">
        <AssuranceCompanyCombobox
          assuranceCompanies={assuranceCompanies}
          value={values.assuranceCompanyId || null}
          onChange={(companyId) =>
            onFieldChange('assuranceCompanyId', companyId ?? '')
          }
          label="Aseguradora"
          required
          disabled={isDisabled}
          isLoading={isLoadingOptions}
          openOnFocus={false}
          feedbackId={assuranceCompanyFeedbackId}
          fieldError={assuranceCompanyError}
          onFieldBlur={() => onFieldBlur?.('assuranceCompanyId')}
        />
      </div>

      <div className="catalog-form__row">
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-branch`}>
            Ramo
            <span className="catalog-form__required" aria-hidden="true">
              {' '}
              *
            </span>
          </label>
          <select
            id={`${formId}-branch`}
            className={`auth-form__input catalog-form__select${getFieldInputErrorClass(visibleError('branch'))}`}
            name="branch"
            value={values.branch}
            required
            disabled={isDisabled}
            {...getFieldAriaProps(
              getFieldFeedbackId(formId, 'branch'),
              visibleError('branch'),
            )}
            onBlur={() => onFieldBlur?.('branch')}
            onChange={(event) =>
              onFieldChange('branch', event.target.value as PolicyBranch | '')
            }
          >
            <option value="" disabled>
              Selecciona un ramo
            </option>
            {POLICY_BRANCHES.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'branch')}
            message={visibleError('branch')}
          />
        </div>

        <div className="auth-form__field">
          <label
            className="auth-form__label"
            htmlFor={`${formId}-identifierId`}
          >
            Identificador de póliza
            <span className="catalog-form__required" aria-hidden="true">
              {' '}
              *
            </span>
          </label>
          <input
            id={`${formId}-identifierId`}
            className={`auth-form__input${getFieldInputErrorClass(visibleError('identifierId'))}`}
            type="text"
            name="identifierId"
            value={values.identifierId}
            maxLength={255}
            required
            disabled={isDisabled}
            {...getFieldAriaProps(
              getFieldFeedbackId(formId, 'identifierId'),
              visibleError('identifierId'),
            )}
            onBlur={() => onFieldBlur?.('identifierId')}
            onChange={(event) => onFieldChange('identifierId', event.target.value)}
          />
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'identifierId')}
            message={visibleError('identifierId')}
          />
        </div>
      </div>

      <div className="catalog-form__row">
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-effectiveAt`}>
            Fecha de efecto
            <span className="catalog-form__required" aria-hidden="true">
              {' '}
              *
            </span>
          </label>
          <input
            id={`${formId}-effectiveAt`}
            className={`auth-form__input${getFieldInputErrorClass(visibleError('effectiveAt'))}`}
            type="date"
            name="effectiveAt"
            value={values.effectiveAt}
            required
            disabled={isDisabled}
            {...getFieldAriaProps(
              getFieldFeedbackId(formId, 'effectiveAt'),
              visibleError('effectiveAt'),
            )}
            onBlur={() => onFieldBlur?.('effectiveAt')}
            onChange={(event) => onEffectiveAtChange(event.target.value)}
          />
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'effectiveAt')}
            message={visibleError('effectiveAt')}
          />
        </div>

        <div className="auth-form__field">
          <label
            className="auth-form__label"
            htmlFor={`${formId}-nextRenewalAt`}
          >
            Próxima renovación
            <span className="catalog-form__optional"> (opcional)</span>
          </label>
          <input
            id={`${formId}-nextRenewalAt`}
            className={`auth-form__input${getFieldInputErrorClass(visibleError('nextRenewalAt'))}`}
            type="date"
            name="nextRenewalAt"
            value={values.nextRenewalAt}
            disabled={isDisabled}
            {...getFieldAriaProps(
              getFieldFeedbackId(formId, 'nextRenewalAt'),
              visibleError('nextRenewalAt'),
            )}
            onBlur={() => onFieldBlur?.('nextRenewalAt')}
            onChange={(event) =>
              onFieldChange('nextRenewalAt', event.target.value)
            }
          />
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'nextRenewalAt')}
            message={visibleError('nextRenewalAt')}
          />
        </div>
      </div>

      {showCancellation && (
        <fieldset className="insurance-policies-form__cancellation">
          <legend className="insurance-policies-form__legend">Cancelación</legend>
          <p className="insurance-policies-form__hint">
            Informa fecha y motivo juntos, o deja ambos campos vacíos.
          </p>

          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor={`${formId}-cancelledAt`}>
              Fecha de cancelación
            </label>
            <input
              id={`${formId}-cancelledAt`}
              className={`auth-form__input${getFieldInputErrorClass(visibleError('cancelledAt'))}`}
              type="date"
              name="cancelledAt"
              value={values.cancelledAt}
              min={values.effectiveAt || undefined}
              disabled={isDisabled}
              {...getFieldAriaProps(
                getFieldFeedbackId(formId, 'cancelledAt'),
                visibleError('cancelledAt'),
              )}
              onBlur={() => onFieldBlur?.('cancelledAt')}
              onChange={(event) =>
                onFieldChange('cancelledAt', event.target.value)
              }
            />
            <FieldFeedback
              id={getFieldFeedbackId(formId, 'cancelledAt')}
              message={visibleError('cancelledAt')}
            />
          </div>

          <div className="auth-form__field">
            <label
              className="auth-form__label"
              htmlFor={`${formId}-cancellationReason`}
            >
              Motivo de cancelación
            </label>
            <textarea
              id={`${formId}-cancellationReason`}
              className={`auth-form__input insurance-policies-form__textarea${getFieldInputErrorClass(visibleError('cancellationReason'))}`}
              name="cancellationReason"
              value={values.cancellationReason}
              maxLength={255}
              rows={3}
              disabled={isDisabled}
              {...getFieldAriaProps(
                getFieldFeedbackId(formId, 'cancellationReason'),
                visibleError('cancellationReason'),
              )}
              onBlur={() => onFieldBlur?.('cancellationReason')}
              onChange={(event) =>
                onFieldChange('cancellationReason', event.target.value)
              }
            />
            <FieldFeedback
              id={getFieldFeedbackId(formId, 'cancellationReason')}
              message={visibleError('cancellationReason')}
            />
          </div>
        </fieldset>
      )}
    </>
  )
}
