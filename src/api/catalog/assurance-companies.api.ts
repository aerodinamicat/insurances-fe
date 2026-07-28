import { apiClient } from '../client'
import type {
  AssuranceCompanyResponse,
  CreateAssuranceCompanyPayload,
  DeleteCatalogEntityOptions,
  UpdateAssuranceCompanyPayload,
} from './types'

export async function fetchAssuranceCompanies(): Promise<
  AssuranceCompanyResponse[]
> {
  return apiClient<AssuranceCompanyResponse[]>('/assurance-companies')
}

export async function fetchAssuranceCompany(
  id: string,
): Promise<AssuranceCompanyResponse> {
  return apiClient<AssuranceCompanyResponse>(`/assurance-companies/${id}`)
}

export async function createAssuranceCompany(
  payload: CreateAssuranceCompanyPayload,
): Promise<AssuranceCompanyResponse> {
  return apiClient<AssuranceCompanyResponse>('/assurance-companies', {
    method: 'POST',
    body: payload,
  })
}

export async function updateAssuranceCompany(
  id: string,
  payload: UpdateAssuranceCompanyPayload,
): Promise<AssuranceCompanyResponse> {
  return apiClient<AssuranceCompanyResponse>(`/assurance-companies/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function deleteAssuranceCompany(
  id: string,
  options: DeleteCatalogEntityOptions = {},
): Promise<void> {
  await apiClient(`/assurance-companies/${id}`, {
    method: 'DELETE',
    params: options.permanent ? { permanent: true } : undefined,
  })
}
