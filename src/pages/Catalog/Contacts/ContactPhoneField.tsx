import type { CountryCode } from 'libphonenumber-js'

import {
  FieldFeedback,
  getFieldAriaProps,
  getFieldFeedbackId,
  getFieldInputErrorClass,
  getVisibleFieldError,
} from '../../../components/FormField'
import {
  PHONE_COUNTRY_UI_OPTIONS,
} from '../../../utils/phone'
import {
  getPhoneFieldCountryLabel,
  getPhoneFieldDisplayPrefix,
  type PhoneFieldState,
  updatePhoneFieldCountry,
  updatePhoneFieldNationalInput,
  updatePhoneFieldRawInput,
} from './phone-field-state'

type ContactPhoneFieldProps = {
  formId: string
  state: PhoneFieldState
  disabled?: boolean
  fieldError?: string | null
  showErrors?: boolean
  touched?: boolean
  onChange: (state: PhoneFieldState) => void
  onFieldBlur?: () => void
}

export function ContactPhoneField({
  formId,
  state,
  disabled = false,
  fieldError,
  showErrors = false,
  touched = false,
  onChange,
  onFieldBlur,
}: ContactPhoneFieldProps) {
  const countrySelectId = `${formId}-phoneCountry`
  const phoneInputId = `${formId}-phoneNumber`
  const displayPrefix = getPhoneFieldDisplayPrefix(state)
  const countryLabel = getPhoneFieldCountryLabel(state)
  const feedbackId = getFieldFeedbackId(formId, 'phoneNumber')
  const visibleError = getVisibleFieldError('phoneNumber', {
    fieldErrors: fieldError ? { phoneNumber: fieldError } : undefined,
    showErrors,
    touchedFields: touched ? { phoneNumber: true } : undefined,
  })

  function handleCountryChange(iso2: CountryCode) {
    onChange(updatePhoneFieldCountry(state, iso2))
  }

  if (state.useRawInput) {
    const rawHintId = `${formId}-phone-raw-hint`

    return (
      <div className="auth-form__field contacts-form__phone-field">
        <label className="auth-form__label" htmlFor={phoneInputId}>
          Teléfono
          <span className="catalog-form__required" aria-hidden="true">
            {' '}
            *
          </span>
        </label>
        <p className="contacts-form__phone-raw-hint" id={rawHintId}>
          Formato no reconocido. Corrige el número para guardarlo.
        </p>
        <input
          id={phoneInputId}
          className={`auth-form__input${getFieldInputErrorClass(visibleError)}`}
          type="tel"
          name="phoneNumber"
          autoComplete="tel"
          required
          {...getFieldAriaProps(feedbackId, visibleError, rawHintId)}
          value={state.rawInput}
          disabled={disabled}
          onBlur={onFieldBlur}
          onChange={(event) =>
            onChange(updatePhoneFieldRawInput(state, event.target.value))
          }
        />
        <FieldFeedback id={feedbackId} message={visibleError} />
      </div>
    )
  }

  const countrySummaryId = `${formId}-phone-country-summary`

  return (
    <div className="auth-form__field contacts-form__phone-field">
      <label className="auth-form__label" htmlFor={phoneInputId}>
        Teléfono
        <span className="catalog-form__required" aria-hidden="true">
          {' '}
          *
        </span>
      </label>
      <div className="contacts-form__phone-input-group">
        <div className="contacts-form__phone-country">
          <label className="contacts-form__sr-only" htmlFor={countrySelectId}>
            País del teléfono
          </label>
          <select
            id={countrySelectId}
            className="auth-form__input contacts-form__phone-country-select"
            name="phoneCountry"
            value={state.inferredCallingCode ? '' : state.selectedCountry}
            disabled={disabled || Boolean(state.inferredCallingCode)}
            aria-label={`País del teléfono, ${countryLabel}`}
            onChange={(event) =>
              handleCountryChange(event.target.value as CountryCode)
            }
          >
            {state.inferredCallingCode ? (
              <option value="">
                {countryLabel}
                {displayPrefix ? ` (${displayPrefix})` : ''}
              </option>
            ) : null}
            {PHONE_COUNTRY_UI_OPTIONS.map((option) => (
              <option key={option.iso2} value={option.iso2}>
                {option.flag} {option.name} ({option.callingCode})
              </option>
            ))}
          </select>
        </div>
        <input
          id={phoneInputId}
          className={`auth-form__input contacts-form__phone-national${getFieldInputErrorClass(visibleError)}`}
          type="tel"
          name="phoneNumber"
          autoComplete="tel"
          required
          inputMode="tel"
          placeholder="612 345 678"
          {...getFieldAriaProps(feedbackId, visibleError, countrySummaryId)}
          value={state.nationalInput}
          disabled={disabled}
          onBlur={onFieldBlur}
          onChange={(event) =>
            onChange(updatePhoneFieldNationalInput(state, event.target.value))
          }
        />
      </div>
      <p className="contacts-form__sr-only" id={countrySummaryId}>
        {countryLabel}
        {displayPrefix ? `, prefijo ${displayPrefix}` : ''}
      </p>
      <FieldFeedback id={feedbackId} message={visibleError} />
    </div>
  )
}
