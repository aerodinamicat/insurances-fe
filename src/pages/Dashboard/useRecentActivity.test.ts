import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchRecentActivity,
  type RecentActivityResponse,
} from '../../api/activity'
import { ApiError } from '../../api/client'
import { useRecentActivity } from './useRecentActivity'

vi.mock('../../api/activity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/activity')>()
  return {
    ...actual,
    fetchRecentActivity: vi.fn(),
  }
})

const fetchRecentActivityMock = vi.mocked(fetchRecentActivity)
const firstResponse: RecentActivityResponse = {
  items: [
    {
      key: 'customer:1:created',
      entityType: 'customer',
      entityId: '1',
      action: 'created',
      occurredAt: '2026-07-30T09:00:00.000Z',
      label: 'Cliente uno',
      secondaryLabel: null,
    },
  ],
  generatedAt: '2026-07-30T10:00:00.000Z',
}

function deferredResponse() {
  let resolve!: (response: RecentActivityResponse) => void
  const promise = new Promise<RecentActivityResponse>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe('useRecentActivity', () => {
  beforeEach(() => {
    fetchRecentActivityMock.mockReset()
  })

  it('loads the initial activity and exposes generatedAt', async () => {
    fetchRecentActivityMock.mockResolvedValue(firstResponse)

    const { result } = renderHook(() => useRecentActivity())

    expect(result.current.isInitialLoading).toBe(true)
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false))
    expect(fetchRecentActivityMock).toHaveBeenCalledWith(20)
    expect(result.current.items).toEqual(firstResponse.items)
    expect(result.current.generatedAt).toBe(firstResponse.generatedAt)
    expect(result.current.loadError).toBeNull()
  })

  it('supports an empty response', async () => {
    fetchRecentActivityMock.mockResolvedValue({
      items: [],
      generatedAt: firstResponse.generatedAt,
    })

    const { result } = renderHook(() => useRecentActivity())

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false))
    expect(result.current.items).toEqual([])
  })

  it('uses the ApiError message and retries successfully', async () => {
    fetchRecentActivityMock
      .mockRejectedValueOnce(new ApiError('Servicio no disponible', 503))
      .mockResolvedValueOnce(firstResponse)

    const { result } = renderHook(() => useRecentActivity())

    await waitFor(() =>
      expect(result.current.loadError).toBe('Servicio no disponible'),
    )
    await act(async () => {
      await result.current.reload()
    })
    expect(result.current.items).toEqual(firstResponse.items)
    expect(result.current.loadError).toBeNull()
  })

  it('uses a Spanish fallback for unknown errors', async () => {
    fetchRecentActivityMock.mockRejectedValue(new Error('network'))

    const { result } = renderHook(() => useRecentActivity())

    await waitFor(() =>
      expect(result.current.loadError).toBe(
        'No se pudo cargar la actividad reciente. Inténtalo de nuevo.',
      ),
    )
  })

  it('keeps visible items while refreshing', async () => {
    const refresh = deferredResponse()
    fetchRecentActivityMock
      .mockResolvedValueOnce(firstResponse)
      .mockReturnValueOnce(refresh.promise)
    const { result } = renderHook(() => useRecentActivity())
    await waitFor(() => expect(result.current.items).toEqual(firstResponse.items))

    let reloadPromise!: Promise<void>
    act(() => {
      reloadPromise = result.current.reload()
    })
    expect(result.current.isRefreshing).toBe(true)
    expect(result.current.items).toEqual(firstResponse.items)

    await act(async () => {
      refresh.resolve({ items: [], generatedAt: firstResponse.generatedAt })
      await reloadPromise
    })
    expect(result.current.isRefreshing).toBe(false)
    expect(result.current.items).toEqual([])
  })

  it('reloads with a new limit without clearing current items', async () => {
    const next = deferredResponse()
    fetchRecentActivityMock
      .mockResolvedValueOnce(firstResponse)
      .mockReturnValueOnce(next.promise)
    const { result } = renderHook(() => useRecentActivity())
    await waitFor(() => expect(result.current.items).toEqual(firstResponse.items))

    act(() => {
      result.current.setLimit(50)
    })
    await waitFor(() => expect(fetchRecentActivityMock).toHaveBeenCalledWith(50))
    expect(result.current.items).toEqual(firstResponse.items)
    expect(result.current.isRefreshing).toBe(true)

    await act(async () => {
      next.resolve({ items: [], generatedAt: firstResponse.generatedAt })
    })
  })

  it('ignores an obsolete response after the limit changes', async () => {
    const first = deferredResponse()
    const second = deferredResponse()
    fetchRecentActivityMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const { result } = renderHook(() => useRecentActivity())

    await waitFor(() => expect(fetchRecentActivityMock).toHaveBeenCalledWith(20))
    act(() => {
      result.current.setLimit(10)
    })
    await waitFor(() => expect(fetchRecentActivityMock).toHaveBeenCalledWith(10))

    await act(async () => {
      second.resolve(firstResponse)
    })
    expect(result.current.items).toEqual(firstResponse.items)

    await act(async () => {
      first.resolve({ items: [], generatedAt: '2020-01-01T00:00:00.000Z' })
    })
    expect(result.current.items).toEqual(firstResponse.items)
  })

  it('ignores completion after unmount', async () => {
    const pending = deferredResponse()
    fetchRecentActivityMock.mockReturnValue(pending.promise)
    const { unmount } = renderHook(() => useRecentActivity())

    await waitFor(() => expect(fetchRecentActivityMock).toHaveBeenCalledTimes(1))
    unmount()
    await act(async () => {
      pending.resolve(firstResponse)
    })
    expect(fetchRecentActivityMock).toHaveBeenCalledTimes(1)
  })
})
