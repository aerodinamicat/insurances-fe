import { useCallback } from 'react'
import { fetchInsurancePolicies } from '../../../api/catalog'
import type { InsurancePolicyResponse } from '../../../api/catalog'
import { useCatalogList } from '../shared/useCatalogList'

function sortPolicies(
  policies: InsurancePolicyResponse[],
): InsurancePolicyResponse[] {
  return [...policies].sort((a, b) =>
    a.identifierId.localeCompare(b.identifierId, undefined, {
      sensitivity: 'base',
    }),
  )
}

export function useInsurancePolicies() {
  const fetchItems = useCallback(() => fetchInsurancePolicies(), [])

  const { items, isLoading, loadError, reload, upsertItem, removeItem } =
    useCatalogList({
      fetchItems,
      sortItems: sortPolicies,
      loadErrorFallback:
        'No se pudieron cargar las pólizas. Inténtalo de nuevo.',
      getItemId: (item) => item.id,
    })

  return {
    policies: items,
    isLoading,
    loadError,
    reload,
    upsertPolicy: upsertItem,
    removePolicy: removeItem,
  }
}
