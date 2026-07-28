import { useId, useMemo, useState } from 'react'
import type { CustomerResponse } from '../../../api/catalog'
import { getCustomerAlias } from '../../../api/catalog'
import {
  FieldFeedback,
  getFieldAriaProps,
  getFieldFeedbackId,
  getFieldInputErrorClass,
} from '../../../components/FormField'

type CustomerMultiSelectProps = {
  customers: CustomerResponse[]
  value: string[]
  onChange: (customerIds: string[]) => void
  label: string
  disabled?: boolean
  required?: boolean
  isLoading?: boolean
  formId?: string
  fieldError?: string | null
  onFieldBlur?: () => void
}

export function CustomerMultiSelect({
  customers,
  value,
  onChange,
  label,
  disabled = false,
  required = false,
  isLoading = false,
  formId: formIdProp,
  fieldError = null,
  onFieldBlur,
}: CustomerMultiSelectProps) {
  const generatedFormId = useId()
  const formId = formIdProp ?? generatedFormId
  const listId = useId()
  const feedbackId = getFieldFeedbackId(formId, 'customerIds')
  const [query, setQuery] = useState('')

  const particularCustomers = useMemo(
    () => customers.filter((customer) => customer.type === 'Particular'),
    [customers],
  )

  const selectedCustomers = useMemo(
    () =>
      value
        .map((id) => particularCustomers.find((customer) => customer.id === id))
        .filter((customer): customer is CustomerResponse => Boolean(customer)),
    [particularCustomers, value],
  )

  const availableCustomers = useMemo(() => {
    const selectedSet = new Set(value)
    const normalizedQuery = query.trim().toLowerCase()

    return particularCustomers.filter((customer) => {
      if (selectedSet.has(customer.id)) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const alias = getCustomerAlias(customer).toLowerCase()
      return (
        alias.includes(normalizedQuery) ||
        customer.taxId.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [particularCustomers, query, value])

  function addCustomer(customerId: string) {
    if (!value.includes(customerId)) {
      onChange([...value, customerId])
    }
    setQuery('')
  }

  function removeCustomer(customerId: string) {
    onChange(value.filter((id) => id !== customerId))
  }

  const isDisabled = disabled || isLoading

  return (
    <div className="insured-assets-multiselect">
      <label className="auth-form__label" htmlFor={listId}>
        {label}
        {required && (
          <span className="catalog-form__required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>

      <p className="insured-assets-multiselect__hint">
        Solo clientes particulares. Selecciona una o más personas aseguradas.
      </p>

      {selectedCustomers.length > 0 && (
        <ul
          className="insured-assets-multiselect__selected"
          aria-label="Personas seleccionadas"
        >
          {selectedCustomers.map((customer) => (
            <li key={customer.id} className="insured-assets-multiselect__chip">
              <span>{getCustomerAlias(customer)}</span>
              <button
                type="button"
                className="insured-assets-multiselect__chip-remove"
                disabled={isDisabled}
                aria-label={`Quitar ${getCustomerAlias(customer)}`}
                onClick={() => removeCustomer(customer.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        id={listId}
        className={`auth-form__input${getFieldInputErrorClass(fieldError)}`}
        type="search"
        autoComplete="off"
        disabled={isDisabled}
        placeholder={
          isLoading ? 'Cargando clientes…' : 'Buscar cliente para añadir…'
        }
        value={query}
        {...getFieldAriaProps(feedbackId, fieldError)}
        onBlur={onFieldBlur}
        onChange={(event) => setQuery(event.target.value)}
      />
      <FieldFeedback id={feedbackId} message={fieldError} />

      {query.trim() && !isDisabled && (
        <ul
          className="catalog-combobox__list insured-assets-multiselect__list"
          role="listbox"
          aria-label="Clientes disponibles"
        >
          {availableCustomers.length === 0 && (
            <li className="catalog-combobox__empty" aria-live="polite">
              No se encontraron clientes particulares.
            </li>
          )}

          {availableCustomers.map((customer) => (
            <li key={customer.id} className="catalog-combobox__option">
              <button
                type="button"
                className="catalog-combobox__option-btn"
                onClick={() => addCustomer(customer.id)}
              >
                <span className="catalog-combobox__option-name">
                  {getCustomerAlias(customer)}
                </span>
                <span className="catalog-combobox__option-meta">
                  {customer.taxId}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
