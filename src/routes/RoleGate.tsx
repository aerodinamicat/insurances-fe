import type { ReactNode } from 'react'
import { useAuth } from '../auth'

export { EDITOR_RANK, VIEWER_RANK } from './role-ranks'

type RoleGateProps = {
  children: ReactNode
  /** Exact role code required (e.g. `Admin`). */
  role?: string
  /** Minimum hierarchical rank required (higher = more privileged). */
  minRoleRank?: number
  fallback?: ReactNode
}

export function RoleGate({
  children,
  role,
  minRoleRank,
  fallback = null,
}: RoleGateProps) {
  const { role: userRole, roleRank } = useAuth()

  if (role !== undefined && userRole !== role) {
    return fallback
  }

  if (minRoleRank !== undefined && (roleRank ?? 0) < minRoleRank) {
    return fallback
  }

  return children
}
