import { useCallback } from 'react'
import { fetchInsuredAssets } from '../../../api/catalog'
import type { InsuredAssetResponse } from '../../../api/catalog'
import { getAssetSummary } from './insured-asset-form-utils'
import { useCatalogList } from '../shared/useCatalogList'

function getAssetSortKey(asset: InsuredAssetResponse): string {
  const summary = getAssetSummary(asset)
  return summary === '—' ? '' : summary
}

function sortAssets(assets: InsuredAssetResponse[]): InsuredAssetResponse[] {
  return [...assets].sort((a, b) => {
    const typeCompare = a.type.localeCompare(b.type, undefined, {
      sensitivity: 'base',
    })
    if (typeCompare !== 0) {
      return typeCompare
    }

    return getAssetSortKey(a).localeCompare(getAssetSortKey(b), undefined, {
      sensitivity: 'base',
    })
  })
}

export function useInsuredAssets(insurancePolicyIdFilter: string | null) {
  const fetchItems = useCallback(
    () =>
      fetchInsuredAssets(
        insurancePolicyIdFilter
          ? { insurancePolicyId: insurancePolicyIdFilter }
          : {},
      ),
    [insurancePolicyIdFilter],
  )

  const { items, isLoading, loadError, reload, upsertItem, removeItem } =
    useCatalogList({
      fetchItems,
      sortItems: sortAssets,
      loadErrorFallback:
        'No se pudieron cargar los bienes asegurados. Inténtalo de nuevo.',
      getItemId: (item) => item.id,
    })

  return {
    assets: items,
    isLoading,
    loadError,
    reload,
    upsertAsset: upsertItem,
    removeAsset: removeItem,
  }
}
