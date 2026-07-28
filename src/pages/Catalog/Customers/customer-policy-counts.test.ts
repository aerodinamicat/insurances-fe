import { describe, expect, it } from 'vitest'

import type { InsurancePolicyResponse } from '../../../api/catalog'
import { countPoliciesByCustomer } from './customer-policy-counts'

function createPolicy(id: string, customerId: string): InsurancePolicyResponse {
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
    customerId,
    assuranceCompanyId: 'company-1',
    attachedContractId: null,
    status: 'Vigente',
  }
}

describe('countPoliciesByCustomer', () => {
  it('counts policies for each customer', () => {
    const counts = countPoliciesByCustomer([
      createPolicy('policy-1', 'customer-1'),
      createPolicy('policy-2', 'customer-1'),
      createPolicy('policy-3', 'customer-2'),
    ])

    expect(counts.get('customer-1')).toBe(2)
    expect(counts.get('customer-2')).toBe(1)
    expect(counts.get('customer-without-policies') ?? 0).toBe(0)
  })
})
