import { apiClient } from '../client'
import type {
  CreateInsurancePolicyPayload,
  DeleteCatalogEntityOptions,
  FetchInsurancePoliciesParams,
  InsurancePolicyResponse,
  UpdateInsurancePolicyPayload,
} from './types'

function buildInsurancePoliciesParams(
  params: FetchInsurancePoliciesParams,
): Record<string, string> | undefined {
  const query: Record<string, string> = {}

  if (params.customerId) {
    query.customerId = params.customerId
  }

  if (params.assuranceCompanyId) {
    query.assuranceCompanyId = params.assuranceCompanyId
  }

  if (params.branch) {
    query.branch = params.branch
  }

  if (params.status) {
    query.status = params.status
  }

  return Object.keys(query).length > 0 ? query : undefined
}

export async function fetchInsurancePolicies(
  params: FetchInsurancePoliciesParams = {},
): Promise<InsurancePolicyResponse[]> {
  return apiClient<InsurancePolicyResponse[]>('/insurance-policies', {
    params: buildInsurancePoliciesParams(params),
  })
}

export async function fetchInsurancePolicy(
  id: string,
): Promise<InsurancePolicyResponse> {
  return apiClient<InsurancePolicyResponse>(`/insurance-policies/${id}`)
}

export async function createInsurancePolicy(
  payload: CreateInsurancePolicyPayload,
): Promise<InsurancePolicyResponse> {
  return apiClient<InsurancePolicyResponse>('/insurance-policies', {
    method: 'POST',
    body: payload,
  })
}

export async function updateInsurancePolicy(
  id: string,
  payload: UpdateInsurancePolicyPayload,
): Promise<InsurancePolicyResponse> {
  return apiClient<InsurancePolicyResponse>(`/insurance-policies/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function deleteInsurancePolicy(
  id: string,
  options: DeleteCatalogEntityOptions = {},
): Promise<void> {
  await apiClient(`/insurance-policies/${id}`, {
    method: 'DELETE',
    params: options.permanent ? { permanent: true } : undefined,
  })
}
