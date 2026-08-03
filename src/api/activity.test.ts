import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './client'
import { fetchRecentActivity } from './activity'

vi.mock('./client', () => ({
  apiClient: vi.fn(),
}))

const apiClientMock = vi.mocked(apiClient)

describe('fetchRecentActivity', () => {
  beforeEach(() => {
    apiClientMock.mockReset()
  })

  it('requests the recent activity endpoint with a serialized limit parameter', async () => {
    const response = {
      items: [],
      generatedAt: '2026-07-30T10:00:00.000Z',
    }
    apiClientMock.mockResolvedValue(response)

    await expect(fetchRecentActivity(50)).resolves.toBe(response)
    expect(apiClientMock).toHaveBeenCalledWith('/activity/recent', {
      params: { limit: 50 },
    })
  })
})
