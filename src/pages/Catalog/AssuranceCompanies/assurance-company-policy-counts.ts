import type { InsurancePolicyResponse } from '../../../api/catalog'

export function countPoliciesByAssuranceCompany(
  policies: InsurancePolicyResponse[],
): Map<string, number> {
  const counts = new Map<string, number>()

  for (const policy of policies) {
    counts.set(
      policy.assuranceCompanyId,
      (counts.get(policy.assuranceCompanyId) ?? 0) + 1,
    )
  }

  return counts
}
