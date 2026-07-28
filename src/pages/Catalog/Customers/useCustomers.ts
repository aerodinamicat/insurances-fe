import { useCallback } from 'react'
import { fetchCustomers } from '../../../api/catalog'
import type { CustomerResponse } from '../../../api/catalog'
import { getCustomerAlias } from '../../../api/catalog'
import { useCatalogList } from '../shared/useCatalogList'

function sortCustomers(customers: CustomerResponse[]): CustomerResponse[] {
  return [...customers].sort((a, b) =>
    getCustomerAlias(a).localeCompare(
      getCustomerAlias(b),
      undefined,
      { sensitivity: 'base' },
    ),
  )
}

export function useCustomers() {
  const fetchItems = useCallback(() => fetchCustomers(), [])

  const { items, isLoading, loadError, reload, upsertItem, removeItem } =
    useCatalogList({
      fetchItems,
      sortItems: sortCustomers,
      loadErrorFallback:
        'No se pudieron cargar los clientes. Inténtalo de nuevo.',
      getItemId: (item) => item.id,
    })

  return {
    customers: items,
    isLoading,
    loadError,
    reload,
    upsertCustomer: upsertItem,
    removeCustomer: removeItem,
  }
}
