import { useId } from 'react'

import { FieldHelpTrigger } from '../FieldHelp'
import {
  FieldFeedback,
  getFieldAriaProps,
  getFieldFeedbackId,
  getFieldInputErrorClass,
  getVisibleFieldError,
} from '../FormField'
import type { StreetType } from '../../api/catalog'
import {
  getAddressGpsLinkState,
  getGpsFieldValidationError,
  STREET_TYPES,
  type AddressFieldErrors,
  type AddressFormValues,
} from './address-field-state'
import './AddressFormBlock.css'

type AddressFormBlockProps = {
  formId: string
  values: AddressFormValues
  disabled?: boolean
  fieldErrors?: AddressFieldErrors
  showErrors?: boolean
  touchedFields?: Partial<Record<keyof AddressFormValues, boolean>>
  onChange: (values: AddressFormValues) => void
  onFieldBlur?: (field: keyof AddressFormValues) => void
}

export function AddressFormBlock({
  formId,
  values,
  disabled = false,
  fieldErrors,
  showErrors = false,
  touchedFields,
  onChange,
  onFieldBlur,
}: AddressFormBlockProps) {
  const gpsHelpId = useId()
  const gpsMapsLinkId = useId()

  const errorOptions = { fieldErrors, showErrors, touchedFields }

  function visibleError(field: keyof AddressFormValues): string | null {
    return getVisibleFieldError(field, errorOptions)
  }

  function updateField<K extends keyof AddressFormValues>(
    field: K,
    value: AddressFormValues[K],
  ) {
    onChange({ ...values, [field]: value })
  }

  const gpsFormatError = getGpsFieldValidationError(values.gpsCoordinates)
  const gpsPropError = visibleError('gpsCoordinates')
  const gpsError = gpsFormatError ?? gpsPropError
  const gpsFeedbackId = getFieldFeedbackId(formId, 'gpsCoordinates')
  const gpsLinkState = getAddressGpsLinkState(values.gpsCoordinates)
  const gpsDescribedBy = [gpsHelpId, gpsError ? gpsFeedbackId : null, gpsLinkState.canOpen ? gpsMapsLinkId : null]
    .filter(Boolean)
    .join(' ')

  function renderAddressField(
    field: keyof AddressFormValues,
    label: string,
    options?: {
      maxLength?: number
      inputType?: 'text'
    },
  ) {
    const error = visibleError(field)
    const feedbackId = getFieldFeedbackId(formId, field)
    const inputId = `${formId}-${field}`

    return (
      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor={inputId}>
          {label}
        </label>
        <input
          id={inputId}
          className={`auth-form__input${getFieldInputErrorClass(error)}`}
          type={options?.inputType ?? 'text'}
          name={field}
          maxLength={options?.maxLength}
          value={values[field]}
          disabled={disabled}
          {...getFieldAriaProps(feedbackId, error)}
          onBlur={() => onFieldBlur?.(field)}
          onChange={(event) => updateField(field, event.target.value)}
        />
        <FieldFeedback id={feedbackId} message={error} />
      </div>
    )
  }

  return (
    <fieldset className="address-form__address">
      <legend className="address-form__address-legend">
        Dirección
        <span className="address-form__optional"> (opcional)</span>
      </legend>

      <div className="address-form__row address-form__row--street">
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-streetType`}>
            Tipo de vía
          </label>
          <select
            id={`${formId}-streetType`}
            className={`auth-form__input address-form__select${getFieldInputErrorClass(visibleError('streetType'))}`}
            name="streetType"
            value={values.streetType}
            disabled={disabled}
            {...getFieldAriaProps(
              getFieldFeedbackId(formId, 'streetType'),
              visibleError('streetType'),
            )}
            onBlur={() => onFieldBlur?.('streetType')}
            onChange={(event) =>
              updateField('streetType', event.target.value as StreetType)
            }
          >
            {STREET_TYPES.map((streetType) => (
              <option key={streetType} value={streetType}>
                {streetType}
              </option>
            ))}
          </select>
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'streetType')}
            message={visibleError('streetType')}
          />
        </div>

        {renderAddressField('streetName', 'Nombre de la vía', { maxLength: 127 })}
        {renderAddressField('streetNumber', 'Número', { maxLength: 63 })}
      </div>

      <div className="address-form__row address-form__row--quarters">
        {renderAddressField('building', 'Bloque', { maxLength: 63 })}
        {renderAddressField('stairs', 'Escalera', { maxLength: 63 })}
        {renderAddressField('floor', 'Piso', { maxLength: 15 })}
        {renderAddressField('door', 'Puerta', { maxLength: 1 })}
      </div>

      <div className="address-form__row address-form__row--address-locality">
        {renderAddressField('postalCode', 'Código postal', { maxLength: 63 })}
        {renderAddressField('city', 'Población', { maxLength: 63 })}
        {renderAddressField('region', 'Provincia', { maxLength: 63 })}
      </div>

      <div className="address-form__row address-form__row--single">
        <div className="auth-form__field">
          <div className="catalog-form__label-row">
            <label
              className="auth-form__label"
              htmlFor={`${formId}-gpsCoordinates`}
            >
              Coordenadas GPS
              <span className="address-form__optional"> (opcional)</span>
            </label>
            <FieldHelpTrigger id={gpsHelpId} label="Ayuda sobre coordenadas GPS">
              Puedes pegar valores copiados desde Google Maps, por ejemplo:
              &quot;36.770546, -2.8140609&quot;
            </FieldHelpTrigger>
          </div>
          <div className="address-form__gps-action-row">
            <input
              id={`${formId}-gpsCoordinates`}
              className={`auth-form__input${gpsError ? ' auth-form__input--error' : ''}`}
              type="text"
              name="gpsCoordinates"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              maxLength={127}
              value={values.gpsCoordinates}
              disabled={disabled}
              aria-invalid={gpsError ? true : undefined}
              aria-describedby={gpsDescribedBy || undefined}
              onBlur={() => onFieldBlur?.('gpsCoordinates')}
              onChange={(event) =>
                updateField('gpsCoordinates', event.target.value)
              }
            />
            <div className="address-form__maps-action">
              {gpsLinkState.canOpen && gpsLinkState.url ? (
                <a
                  id={gpsMapsLinkId}
                  className="address-form__maps-link"
                  href={gpsLinkState.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver en mapa
                </a>
              ) : (
                <button
                  type="button"
                  className="address-form__maps-link"
                  disabled
                  aria-disabled="true"
                  aria-describedby={gpsError ? gpsFeedbackId : gpsHelpId}
                >
                  Ver en mapa
                </button>
              )}
            </div>
          </div>
          <FieldFeedback id={gpsFeedbackId} message={gpsError} />
        </div>
      </div>
    </fieldset>
  )
}
