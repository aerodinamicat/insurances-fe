import { apiClient } from '../client'
import type {
  CreateInsuredAssetPayload,
  DeleteCatalogEntityOptions,
  FetchInsuredAssetsParams,
  InsuredAssetResponse,
  UpdateInsuredAssetPayload,
} from './types'

function buildInsuredAssetsParams(
  params: FetchInsuredAssetsParams,
): Record<string, string> | undefined {
  const query: Record<string, string> = {}

  if (params.insurancePolicyId) {
    query.insurancePolicyId = params.insurancePolicyId
  }

  if (params.type) {
    query.type = params.type
  }

  return Object.keys(query).length > 0 ? query : undefined
}

export async function fetchInsuredAssets(
  params: FetchInsuredAssetsParams = {},
): Promise<InsuredAssetResponse[]> {
  return apiClient<InsuredAssetResponse[]>('/insured-assets', {
    params: buildInsuredAssetsParams(params),
  })
}

export async function fetchInsuredAsset(
  id: string,
): Promise<InsuredAssetResponse> {
  return apiClient<InsuredAssetResponse>(`/insured-assets/${id}`)
}

export async function createInsuredAsset(
  payload: CreateInsuredAssetPayload,
): Promise<InsuredAssetResponse> {
  return apiClient<InsuredAssetResponse>('/insured-assets', {
    method: 'POST',
    body: payload,
  })
}

export async function updateInsuredAsset(
  id: string,
  payload: UpdateInsuredAssetPayload,
): Promise<InsuredAssetResponse> {
  return apiClient<InsuredAssetResponse>(`/insured-assets/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function deleteInsuredAsset(
  id: string,
  options: DeleteCatalogEntityOptions = {},
): Promise<void> {
  await apiClient(`/insured-assets/${id}`, {
    method: 'DELETE',
    params: options.permanent ? { permanent: true } : undefined,
  })
}
