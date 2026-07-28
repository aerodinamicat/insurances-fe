import { apiClient } from '../client'
import type {
  CreateCustomerPayload,
  CustomerResponse,
  DeleteCatalogEntityOptions,
  UpdateCustomerPayload,
} from './types'

export async function fetchCustomers(): Promise<CustomerResponse[]> {
  return apiClient<CustomerResponse[]>('/customers')
}

export async function fetchCustomer(id: string): Promise<CustomerResponse> {
  return apiClient<CustomerResponse>(`/customers/${id}`)
}

export async function createCustomer(
  payload: CreateCustomerPayload,
): Promise<CustomerResponse> {
  return apiClient<CustomerResponse>('/customers', {
    method: 'POST',
    body: payload,
  })
}

export async function updateCustomer(
  id: string,
  payload: UpdateCustomerPayload,
): Promise<CustomerResponse> {
  return apiClient<CustomerResponse>(`/customers/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function deleteCustomer(
  id: string,
  options: DeleteCatalogEntityOptions = {},
): Promise<void> {
  await apiClient(`/customers/${id}`, {
    method: 'DELETE',
    params: options.permanent ? { permanent: true } : undefined,
  })
}
