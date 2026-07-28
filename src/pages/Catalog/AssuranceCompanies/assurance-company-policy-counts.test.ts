import { describe, expect, it } from 'vitest'

import type { InsurancePolicyResponse } from '../../../api/catalog'
import { countPoliciesByAssuranceCompany } from './assurance-company-policy-counts'

function createPolicy(
  id: string,
  assuranceCompanyId: string,
): InsurancePolicyResponse {
  return {
    id,
    alias: id,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    identifierId: id,
    branch: 'Hogar',
    effectiveAt: '2026-01-01',
    nextRenewalAt: '2027-01-01',
    cancelledAt: null,
    cancellationReason: null,
    customerId: 'customer-1',
    assuranceCompanyId,
    attachedContractId: null,
    status: 'Vigente',
  }
}

describe('countPoliciesByAssuranceCompany', () => {
  it('counts policies for each assurance company', () => {
    const counts = countPoliciesByAssuranceCompany([
      createPolicy('policy-1', 'company-1'),
      createPolicy('policy-2', 'company-1'),
      createPolicy('policy-3', 'company-2'),
    ])

    expect(counts.get('company-1')).toBe(2)
    expect(counts.get('company-2')).toBe(1)
    expect(counts.get('company-without-policies') ?? 0).toBe(0)
  })
})
