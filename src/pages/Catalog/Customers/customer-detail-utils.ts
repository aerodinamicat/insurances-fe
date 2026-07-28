import type { CustomerResponse } from '../../../api/catalog'

export type CustomerDetailField = {
  label: string
  value: string
}

function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
}

export function buildCustomerDetailFields(
  customer: CustomerResponse,
  formatBirthDate: (value: string | null) => string,
): CustomerDetailField[] {
  const commonFields: CustomerDetailField[] = [
    { label: 'Alias', value: displayValue(customer.alias) },
    { label: 'Tipo', value: customer.type },
    { label: 'Identificador fiscal', value: displayValue(customer.taxId) },
  ]

  if (customer.type === 'Empresa') {
    return [
      ...commonFields,
      { label: 'Razón social', value: displayValue(customer.businessName) },
      { label: 'Nombre comercial', value: displayValue(customer.tradeName) },
      { label: 'CNAE', value: displayValue(customer.cnae) },
    ]
  }

  return [
    ...commonFields,
    { label: 'Nombre', value: displayValue(customer.firstName) },
    { label: 'Apellidos', value: displayValue(customer.lastName) },
    {
      label: 'Fecha de nacimiento',
      value: formatBirthDate(customer.birthAt),
    },
    { label: 'Edad', value: displayValue(customer.age) },
    { label: 'Sexo', value: displayValue(customer.biologicalGender) },
    { label: 'Estado civil', value: displayValue(customer.maritalStatus) },
    { label: 'CNAE', value: displayValue(customer.cnae) },
  ]
}
