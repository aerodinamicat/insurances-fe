import { useCallback } from 'react'
import { fetchAttachments } from '../../../api/catalog'
import type {
  AttachmentResponse,
  FetchAttachmentsParams,
} from '../../../api/catalog'
import { useCatalogList } from '../shared/useCatalogList'

function sortAttachments(
  attachments: AttachmentResponse[],
): AttachmentResponse[] {
  return [...attachments].sort((a, b) => {
    const typeCompare = a.documentType.localeCompare(
      b.documentType,
      undefined,
      {
        sensitivity: 'base',
      },
    )
    if (typeCompare !== 0) {
      return typeCompare
    }

    const codeCompare = (a.documentCode ?? '').localeCompare(
      b.documentCode ?? '',
      undefined,
      {
        sensitivity: 'base',
      },
    )
    if (codeCompare !== 0) {
      return codeCompare
    }

    return a.originalFileName.localeCompare(b.originalFileName, undefined, {
      sensitivity: 'base',
    })
  })
}

function buildFilterParams(
  customerId: string | null,
  insurancePolicyId: string | null,
  insuredAssetId: string | null,
): FetchAttachmentsParams {
  const params: FetchAttachmentsParams = {}

  if (customerId) {
    params.customerId = customerId
  }
  if (insurancePolicyId) {
    params.insurancePolicyId = insurancePolicyId
  }
  if (insuredAssetId) {
    params.insuredAssetId = insuredAssetId
  }

  return params
}

export function useAttachments(
  customerIdFilter: string | null,
  insurancePolicyIdFilter: string | null,
  insuredAssetIdFilter: string | null,
) {
  const fetchItems = useCallback(
    () =>
      fetchAttachments(
        buildFilterParams(
          customerIdFilter,
          insurancePolicyIdFilter,
          insuredAssetIdFilter,
        ),
      ),
    [customerIdFilter, insurancePolicyIdFilter, insuredAssetIdFilter],
  )

  const { items, isLoading, loadError, reload, upsertItem, removeItem } =
    useCatalogList({
      fetchItems,
      sortItems: sortAttachments,
      loadErrorFallback:
        'No se pudieron cargar los documentos. Inténtalo de nuevo.',
      getItemId: (item) => item.id,
    })

  return {
    attachments: items,
    isLoading,
    loadError,
    reload,
    upsertAttachment: upsertItem,
    removeAttachment: removeItem,
  }
}
