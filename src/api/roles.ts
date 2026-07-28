import { apiClient } from './client'
import type { RoleResponse } from './types'

export function fetchRoles(): Promise<RoleResponse[]> {
  return apiClient<RoleResponse[]>('/roles')
}
