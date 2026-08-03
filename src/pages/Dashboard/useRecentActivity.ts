import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchRecentActivity,
  type RecentActivityItem,
} from '../../api/activity'
import { ApiError } from '../../api/client'

const ACTIVITY_LOAD_ERROR =
  'No se pudo cargar la actividad reciente. Inténtalo de nuevo.'

export type UseRecentActivityResult = {
  items: RecentActivityItem[]
  generatedAt: string | null
  isInitialLoading: boolean
  isRefreshing: boolean
  loadError: string | null
  limit: number
  setLimit: (limit: number) => void
  reload: () => Promise<void>
}

export function useRecentActivity(initialLimit = 20): UseRecentActivityResult {
  const [items, setItems] = useState<RecentActivityItem[]>([])
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [limit, setLimit] = useState(initialLimit)
  const requestSequence = useRef(0)
  const hasSuccessfulLoad = useRef(false)

  const load = useCallback(async () => {
    const requestId = ++requestSequence.current
    const isInitialRequest = !hasSuccessfulLoad.current

    setLoadError(null)
    setIsInitialLoading(isInitialRequest)
    setIsRefreshing(!isInitialRequest)

    try {
      const response = await fetchRecentActivity(limit)
      if (requestId !== requestSequence.current) {
        return
      }

      setItems(response.items)
      setGeneratedAt(response.generatedAt)
      hasSuccessfulLoad.current = true
    } catch (caught) {
      if (requestId !== requestSequence.current) {
        return
      }

      setLoadError(
        caught instanceof ApiError ? caught.message : ACTIVITY_LOAD_ERROR,
      )
    } finally {
      if (requestId === requestSequence.current) {
        setIsInitialLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [limit])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) {
        return load()
      }
    })

    return () => {
      cancelled = true
      requestSequence.current += 1
    }
  }, [load])

  return {
    items,
    generatedAt,
    isInitialLoading,
    isRefreshing,
    loadError,
    limit,
    setLimit,
    reload: load,
  }
}
