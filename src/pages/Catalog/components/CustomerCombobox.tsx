import type { CustomerResponse } from '../../../api/catalog'
import { getCustomerAlias } from '../../../api/catalog'
import { CatalogCombobox } from './CatalogCombobox'

type CustomerComboboxProps = {
  customers: CustomerResponse[]
  value: string | null
  onChange: (customerId: string | null) => void
  label: string
  disabled?: boolean
  required?: boolean
  allowEmpty?: boolean
  emptyLabel?: string
  isLoading?: boolean
  openOnFocus?: boolean
  feedbackId?: string
  fieldError?: string | null
  onFieldBlur?: () => void
}

export function CustomerCombobox({
  customers,
  value,
  onChange,
  label,
  disabled = false,
  required = false,
  allowEmpty = false,
  emptyLabel = 'Todos los clientes',
  isLoading = false,
  openOnFocus = true,
  feedbackId,
  fieldError = null,
  onFieldBlur,
}: CustomerComboboxProps) {
  return (
    <CatalogCombobox
      items={customers}
      value={value}
      onChange={onChange}
      label={label}
      getItemLabel={getCustomerAlias}
      getItemMetaItems={(customer) => [{ value: customer.taxId }]}
      getItemSearchText={(customer) =>
        `${getCustomerAlias(customer)} ${customer.taxId}`
      }
      disabled={disabled}
      required={required}
      allowEmpty={allowEmpty}
      emptyLabel={emptyLabel}
      emptyMessage="No se encontraron clientes."
      isLoading={isLoading}
      openOnFocus={openOnFocus}
      placeholder="Buscar cliente…"
      feedbackId={feedbackId}
      fieldError={fieldError}
      onFieldBlur={onFieldBlur}
    />
  )
}
