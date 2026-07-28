import type { AssuranceCompanyResponse } from '../../../api/catalog'

export function sortByLocaleCompare<T>(
  items: T[],
  getSortKey: (item: T) => string,
): T[] {
  return [...items].sort((a, b) =>
    getSortKey(a).localeCompare(getSortKey(b), undefined, {
      sensitivity: 'base',
    }),
  )
}

export function sortAssuranceCompaniesByBusinessName(
  companies: AssuranceCompanyResponse[],
): AssuranceCompanyResponse[] {
  return sortByLocaleCompare(companies, (company) => company.businessName)
}
