import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../../api/client'

export type UseCatalogListOptions<T> = {
  fetchItems: () => Promise<T[]>
  sortItems: (items: T[]) => T[]
  loadErrorFallback: string
  getItemId: (item: T) => string
}

export type UseCatalogListResult<T> = {
  items: T[]
  isLoading: boolean
  loadError: string | null
  reload: () => Promise<void>
  upsertItem: (item: T) => void
  removeItem: (id: string) => void
}

export function useCatalogList<T>(
  options: UseCatalogListOptions<T>,
): UseCatalogListResult<T> {
  const { fetchItems, sortItems, loadErrorFallback, getItemId } = options

  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const response = await fetchItems()
      setItems(sortItems(response))
    } catch (caught) {
      setLoadError(
        caught instanceof ApiError ? caught.message : loadErrorFallback,
      )
    } finally {
      setIsLoading(false)
    }
  }, [fetchItems, sortItems, loadErrorFallback])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const response = await fetchItems()
        if (cancelled) {
          return
        }
        setItems(sortItems(response))
      } catch (caught) {
        if (cancelled) {
          return
        }
        setLoadError(
          caught instanceof ApiError ? caught.message : loadErrorFallback,
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fetchItems, sortItems, loadErrorFallback])

  function upsertItem(item: T) {
    const itemId = getItemId(item)
    setItems((current) =>
      sortItems(
        current.some((existing) => getItemId(existing) === itemId)
          ? current.map((existing) =>
              getItemId(existing) === itemId ? item : existing,
            )
          : [...current, item],
      ),
    )
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => getItemId(item) !== id))
  }

  return {
    items,
    isLoading,
    loadError,
    reload,
    upsertItem,
    removeItem,
  }
}
