import { useCallback } from 'react'
import { fetchAssuranceCompanies } from '../../../api/catalog'
import type { AssuranceCompanyResponse } from '../../../api/catalog'
import { sortAssuranceCompaniesByBusinessName } from '../shared'
import { useCatalogList } from '../shared/useCatalogList'

export function useAssuranceCompanies() {
  const fetchItems = useCallback(() => fetchAssuranceCompanies(), [])

  const { items, isLoading, loadError, reload } = useCatalogList({
    fetchItems,
    sortItems: sortAssuranceCompaniesByBusinessName,
    loadErrorFallback:
      'No se pudieron cargar las aseguradoras. Inténtalo de nuevo.',
    getItemId: (item: AssuranceCompanyResponse) => item.id,
  })

  return {
    assuranceCompanies: items,
    isLoading,
    loadError,
    reload,
  }
}
