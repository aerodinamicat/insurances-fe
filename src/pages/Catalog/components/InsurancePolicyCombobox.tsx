import { useMemo } from 'react'
import { getCustomerAlias } from '../../../api/catalog'
import type {
  AssuranceCompanyResponse,
  CustomerResponse,
  InsurancePolicyResponse,
} from '../../../api/catalog'
import { CatalogCombobox } from './CatalogCombobox'

type InsurancePolicyComboboxProps = {
  policies: InsurancePolicyResponse[]
  customers?: CustomerResponse[]
  assuranceCompanies?: AssuranceCompanyResponse[]
  value: string | null
  onChange: (policyId: string | null) => void
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

function getPolicyLabel(policy: InsurancePolicyResponse): string {
  return `${policy.identifierId} · ${policy.branch}`
}

export function InsurancePolicyCombobox({
  policies,
  customers = [],
  assuranceCompanies = [],
  value,
  onChange,
  label,
  disabled = false,
  required = false,
  allowEmpty = false,
  emptyLabel = 'Todas las pólizas',
  isLoading = false,
  openOnFocus = true,
  feedbackId,
  fieldError = null,
  onFieldBlur,
}: InsurancePolicyComboboxProps) {
  const customerById = useMemo(() => {
    const map = new Map<string, CustomerResponse>()
    for (const customer of customers) {
      map.set(customer.id, customer)
    }
    return map
  }, [customers])

  const companyById = useMemo(() => {
    const map = new Map<string, AssuranceCompanyResponse>()
    for (const company of assuranceCompanies) {
      map.set(company.id, company)
    }
    return map
  }, [assuranceCompanies])

  function getPolicyCustomerName(policy: InsurancePolicyResponse): string {
    const customer = customerById.get(policy.customerId)
    return customer ? getCustomerAlias(customer) : ''
  }

  function getPolicyCompanyName(policy: InsurancePolicyResponse): string {
    return companyById.get(policy.assuranceCompanyId)?.businessName ?? ''
  }

  function getPolicyOptionMeta(policy: InsurancePolicyResponse): string {
    return [
      policy.branch,
      policy.status,
      getPolicyCustomerName(policy),
      getPolicyCompanyName(policy),
    ]
      .filter(Boolean)
      .join(' · ')
  }

  return (
    <CatalogCombobox
      items={policies}
      value={value}
      onChange={onChange}
      label={label}
      getItemLabel={(policy) => policy.identifierId}
      getItemMetaItems={(policy) =>
        [
          policy.branch,
          policy.status,
          getPolicyCustomerName(policy),
          getPolicyCompanyName(policy),
        ].map((value) => ({ value }))
      }
      getItemSearchText={(policy) =>
        [
          getPolicyLabel(policy),
          getPolicyOptionMeta(policy),
          policy.status,
          getPolicyCustomerName(policy),
          getPolicyCompanyName(policy),
        ].join(' ')
      }
      disabled={disabled}
      required={required}
      allowEmpty={allowEmpty}
      emptyLabel={emptyLabel}
      emptyMessage="No se encontraron pólizas."
      isLoading={isLoading}
      openOnFocus={openOnFocus}
      placeholder="Buscar póliza…"
      feedbackId={feedbackId}
      fieldError={fieldError}
      onFieldBlur={onFieldBlur}
    />
  )
}
