import type { AssuranceCompanyResponse } from '../../../api/catalog'
import { CatalogCombobox } from './CatalogCombobox'

type AssuranceCompanyComboboxProps = {
  assuranceCompanies: AssuranceCompanyResponse[]
  value: string | null
  onChange: (companyId: string | null) => void
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

export function AssuranceCompanyCombobox({
  assuranceCompanies,
  value,
  onChange,
  label,
  disabled = false,
  required = false,
  allowEmpty = false,
  emptyLabel = 'Todas las aseguradoras',
  isLoading = false,
  openOnFocus = true,
  feedbackId,
  fieldError = null,
  onFieldBlur,
}: AssuranceCompanyComboboxProps) {
  return (
    <CatalogCombobox
      items={assuranceCompanies}
      value={value}
      onChange={onChange}
      label={label}
      getItemLabel={(company) => company.businessName}
      getItemMetaItems={(company) => [{ value: company.tradeName }]}
      getItemSearchText={(company) =>
        `${company.businessName} ${company.tradeName ?? ''}`
      }
      disabled={disabled}
      required={required}
      allowEmpty={allowEmpty}
      emptyLabel={emptyLabel}
      emptyMessage="No se encontraron aseguradoras."
      isLoading={isLoading}
      openOnFocus={openOnFocus}
      placeholder={isLoading ? 'Cargando aseguradoras…' : 'Buscar aseguradora…'}
      feedbackId={feedbackId}
      fieldError={fieldError}
      onFieldBlur={onFieldBlur}
    />
  )
}
