import { useCallback } from 'react'
import { fetchContacts } from '../../../api/catalog'
import type { ContactResponse } from '../../../api/catalog'
import { useCatalogList } from '../shared/useCatalogList'

function sortContacts(contacts: ContactResponse[]): ContactResponse[] {
  return [...contacts].sort((a, b) => {
    const typeCompare = a.type.localeCompare(b.type, undefined, {
      sensitivity: 'base',
    })
    if (typeCompare !== 0) {
      return typeCompare
    }

    return a.phoneNumber.localeCompare(b.phoneNumber, undefined, {
      sensitivity: 'base',
    })
  })
}

export function useContacts(customerIdFilter: string | null) {
  const fetchItems = useCallback(
    () =>
      fetchContacts(
        customerIdFilter ? { customerId: customerIdFilter } : {},
      ),
    [customerIdFilter],
  )

  const { items, isLoading, loadError, reload, upsertItem, removeItem } =
    useCatalogList({
      fetchItems,
      sortItems: sortContacts,
      loadErrorFallback:
        'No se pudieron cargar los contactos. Inténtalo de nuevo.',
      getItemId: (item) => item.id,
    })

  return {
    contacts: items,
    isLoading,
    loadError,
    reload,
    upsertContact: upsertItem,
    removeContact: removeItem,
  }
}
