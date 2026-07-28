import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../../api/client'
import {
  useCatalogList,
  type UseCatalogListOptions,
} from './useCatalogList'

type TestItem = {
  id: string
  name: string
}

function sortTestItems(items: TestItem[]): TestItem[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name))
}

function makeOptions(
  overrides: Partial<UseCatalogListOptions<TestItem>> = {},
): UseCatalogListOptions<TestItem> {
  return {
    fetchItems: vi.fn().mockResolvedValue([]),
    sortItems: sortTestItems,
    loadErrorFallback: 'No se pudieron cargar los elementos. Inténtalo de nuevo.',
    getItemId: (item) => item.id,
    ...overrides,
  }
}

describe('useCatalogList', () => {
  it('loads items successfully on mount', async () => {
    const items = [
      { id: '2', name: 'Beta' },
      { id: '1', name: 'Alpha' },
    ]
    const fetchItems = vi.fn().mockResolvedValue(items)

    const { result } = renderHook(() =>
      useCatalogList(makeOptions({ fetchItems })),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(fetchItems).toHaveBeenCalledTimes(1)
    expect(result.current.items).toEqual(sortTestItems(items))
    expect(result.current.loadError).toBeNull()
  })

  it('sets ApiError message on load failure', async () => {
    const fetchItems = vi
      .fn()
      .mockRejectedValue(new ApiError('Error de API', 500, {}))

    const { result } = renderHook(() =>
      useCatalogList(makeOptions({ fetchItems })),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.loadError).toBe('Error de API')
    expect(result.current.items).toEqual([])
  })

  it('sets fallback message on non-ApiError load failure', async () => {
    const fetchItems = vi.fn().mockRejectedValue(new Error('network'))

    const { result } = renderHook(() =>
      useCatalogList(makeOptions({ fetchItems })),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.loadError).toBe(
      'No se pudieron cargar los elementos. Inténtalo de nuevo.',
    )
  })

  it('reload fetches again and clears previous error', async () => {
    const fetchItems = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('Error temporal', 503, {}))
      .mockResolvedValueOnce([{ id: '1', name: 'Alpha' }])

    const { result } = renderHook(() =>
      useCatalogList(makeOptions({ fetchItems })),
    )

    await waitFor(() => expect(result.current.loadError).toBe('Error temporal'))

    await act(async () => {
      await result.current.reload()
    })

    expect(fetchItems).toHaveBeenCalledTimes(2)
    expect(result.current.loadError).toBeNull()
    expect(result.current.items).toEqual([{ id: '1', name: 'Alpha' }])
    expect(result.current.isLoading).toBe(false)
  })

  it('upsertItem replaces an existing item and re-sorts', async () => {
    const fetchItems = vi.fn().mockResolvedValue([
      { id: '1', name: 'Alpha' },
      { id: '2', name: 'Beta' },
    ])

    const { result } = renderHook(() =>
      useCatalogList(makeOptions({ fetchItems })),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.upsertItem({ id: '2', name: 'Zulu' })
    })

    expect(result.current.items).toEqual([
      { id: '1', name: 'Alpha' },
      { id: '2', name: 'Zulu' },
    ])
  })

  it('upsertItem inserts a new item and re-sorts', async () => {
    const fetchItems = vi.fn().mockResolvedValue([{ id: '1', name: 'Alpha' }])

    const { result } = renderHook(() =>
      useCatalogList(makeOptions({ fetchItems })),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.upsertItem({ id: '2', name: 'Beta' })
    })

    expect(result.current.items).toEqual([
      { id: '1', name: 'Alpha' },
      { id: '2', name: 'Beta' },
    ])
  })

  it('removeItem filters by id', async () => {
    const fetchItems = vi.fn().mockResolvedValue([
      { id: '1', name: 'Alpha' },
      { id: '2', name: 'Beta' },
    ])

    const { result } = renderHook(() =>
      useCatalogList(makeOptions({ fetchItems })),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.removeItem('1')
    })

    expect(result.current.items).toEqual([{ id: '2', name: 'Beta' }])
  })

  it('ignores stale response when fetchItems changes before resolution', async () => {
    const firstItems = [{ id: '1', name: 'First' }]
    const secondItems = [{ id: '2', name: 'Second' }]

    let resolveFirst!: (items: TestItem[]) => void
    const fetchFirst = vi.fn(
      () =>
        new Promise<TestItem[]>((resolve) => {
          resolveFirst = resolve
        }),
    )
    const fetchSecond = vi.fn().mockResolvedValue(secondItems)

    const { result, rerender } = renderHook(
      ({ fetch }) => useCatalogList(makeOptions({ fetchItems: fetch })),
      { initialProps: { fetch: fetchFirst } },
    )

    rerender({ fetch: fetchSecond })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.items).toEqual(sortTestItems(secondItems))

    await act(async () => {
      resolveFirst(firstItems)
    })

    expect(result.current.items).toEqual(sortTestItems(secondItems))
  })

  it('does not update state after unmount', async () => {
    let resolveFetch!: (items: TestItem[]) => void
    const fetchItems = vi.fn(
      () =>
        new Promise<TestItem[]>((resolve) => {
          resolveFetch = resolve
        }),
    )

    const { unmount } = renderHook(() =>
      useCatalogList(makeOptions({ fetchItems })),
    )

    unmount()

    await act(async () => {
      resolveFetch([{ id: '1', name: 'Alpha' }])
    })

    expect(fetchItems).toHaveBeenCalledTimes(1)
  })
})
