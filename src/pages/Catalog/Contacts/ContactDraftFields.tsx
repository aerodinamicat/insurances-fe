import type { AddressFormValues } from '../../../components/AddressFormBlock'
import { AddressFormBlock } from '../../../components/AddressFormBlock'
import {
  FieldFeedback,
  getFieldAriaProps,
  getFieldFeedbackId,
  getFieldInputErrorClass,
  getVisibleFieldError,
} from '../../../components/FormField'
import { ContactPhoneField } from './ContactPhoneField'
import {
  CONTACT_TYPES,
  type ContactDraft,
  type ContactDraftFieldErrors,
  type ContactDraftValues,
} from './contact-draft-utils'

type ContactDraftFieldsProps = {
  formId: string
  draft: ContactDraft
  isSubmitting: boolean
  fieldErrors?: ContactDraftFieldErrors
  showErrors?: boolean
  touchedFields?: Partial<Record<keyof ContactDraftValues | 'phoneNumber', boolean>>
  onValuesChange: (values: ContactDraftValues) => void
  onPhoneFieldChange: (phoneField: ContactDraft['phoneField']) => void
  onFieldBlur?: (field: keyof ContactDraftValues | 'phoneNumber') => void
}

export function ContactDraftFields({
  formId,
  draft,
  isSubmitting,
  fieldErrors,
  showErrors = false,
  touchedFields,
  onValuesChange,
  onPhoneFieldChange,
  onFieldBlur,
}: ContactDraftFieldsProps) {
  const { values, phoneField } = draft
  const errorOptions = { fieldErrors, showErrors, touchedFields }

  function visibleError(
    field: keyof ContactDraftValues | 'phoneNumber',
  ): string | null {
    return getVisibleFieldError(field, errorOptions)
  }

  function updateField<K extends keyof ContactDraftValues>(
    field: K,
    value: ContactDraftValues[K],
  ) {
    onValuesChange({ ...values, [field]: value })
  }

  function handleAddressChange(addressValues: AddressFormValues) {
    onValuesChange({ ...values, ...addressValues })
  }

  const emailError = visibleError('email')
  const emailFeedbackId = getFieldFeedbackId(formId, 'email')

  return (
    <>
      <div className="catalog-form__row contacts-form__row--wide-second">
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-type`}>
            Tipo de contacto
            <span className="catalog-form__required" aria-hidden="true">
              {' '}
              *
            </span>
          </label>
          <select
            id={`${formId}-type`}
            className="auth-form__input catalog-form__select"
            name="type"
            required
            value={values.type}
            disabled={isSubmitting}
            onChange={(event) =>
              updateField('type', event.target.value as ContactDraftValues['type'])
            }
          >
            {CONTACT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'type')}
            message={null}
          />
        </div>

        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-reference`}>
            Referencia
          </label>
          <input
            id={`${formId}-reference`}
            className="auth-form__input"
            type="text"
            name="reference"
            maxLength={127}
            value={values.reference}
            disabled={isSubmitting}
            onChange={(event) => updateField('reference', event.target.value)}
          />
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'reference')}
            message={null}
          />
        </div>
      </div>

      <div className="catalog-form__row contacts-form__row--single">
        <ContactPhoneField
          formId={formId}
          state={phoneField}
          disabled={isSubmitting}
          fieldError={fieldErrors?.phoneNumber}
          showErrors={showErrors}
          touched={Boolean(touchedFields?.phoneNumber)}
          onChange={onPhoneFieldChange}
          onFieldBlur={() => onFieldBlur?.('phoneNumber')}
        />
      </div>

      <div className="catalog-form__row contacts-form__row--single">
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-email`}>
            Correo electrónico
          </label>
          <input
            id={`${formId}-email`}
            className={`auth-form__input${getFieldInputErrorClass(emailError)}`}
            type="email"
            name="email"
            autoComplete="email"
            maxLength={127}
            value={values.email}
            disabled={isSubmitting}
            {...getFieldAriaProps(emailFeedbackId, emailError)}
            onBlur={() => onFieldBlur?.('email')}
            onChange={(event) => updateField('email', event.target.value)}
          />
          <FieldFeedback id={emailFeedbackId} message={emailError} />
        </div>
      </div>

      <AddressFormBlock
        formId={formId}
        values={values}
        disabled={isSubmitting}
        fieldErrors={fieldErrors}
        showErrors={showErrors}
        touchedFields={touchedFields}
        onChange={handleAddressChange}
        onFieldBlur={onFieldBlur}
      />
    </>
  )
}
