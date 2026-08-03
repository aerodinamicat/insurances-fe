import { apiClient } from './client'

export const ACTIVITY_ENTITY_TYPES = [
  'customer',
  'assurance-company',
  'contact',
  'insurance-policy',
  'insured-asset',
  'attachment',
] as const

export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number]
export type ActivityAction = 'created' | 'updated'

export type RecentActivityItem = {
  key: string
  entityType: ActivityEntityType
  entityId: string
  action: ActivityAction
  occurredAt: string
  label: string
  secondaryLabel: string | null
  actorLabel?: string | null
}

export type RecentActivityResponse = {
  items: RecentActivityItem[]
  generatedAt: string
}

export function fetchRecentActivity(limit: number): Promise<RecentActivityResponse> {
  return apiClient<RecentActivityResponse>('/activity/recent', {
    params: { limit },
  })
}
