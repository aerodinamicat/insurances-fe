import type { InsurancePolicyResponse } from '../../../api/catalog'

export function countPoliciesByCustomer(
  policies: InsurancePolicyResponse[],
): Map<string, number> {
  const counts = new Map<string, number>()

  for (const policy of policies) {
    counts.set(
      policy.customerId,
      (counts.get(policy.customerId) ?? 0) + 1,
    )
  }

  return counts
}
