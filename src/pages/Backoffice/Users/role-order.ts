import type { RoleResponse } from '../../../api/types'

const ROLE_IMPACT_ORDER = ['Viewer', 'Editor', 'Manager', 'Admin'] as const

export function sortRolesByImpact(roles: RoleResponse[]): RoleResponse[] {
  return [...roles].sort((a, b) => {
    const aIndex = ROLE_IMPACT_ORDER.indexOf(
      a.code as (typeof ROLE_IMPACT_ORDER)[number],
    )
    const bIndex = ROLE_IMPACT_ORDER.indexOf(
      b.code as (typeof ROLE_IMPACT_ORDER)[number],
    )
    const safeA = aIndex === -1 ? ROLE_IMPACT_ORDER.length : aIndex
    const safeB = bIndex === -1 ? ROLE_IMPACT_ORDER.length : bIndex
    return safeA - safeB
  })
}

export function getDefaultViewerRoleId(roles: RoleResponse[]): string {
  const viewer = roles.find((role) => role.code === 'Viewer')
  return viewer?.id ?? roles[0]?.id ?? ''
}
