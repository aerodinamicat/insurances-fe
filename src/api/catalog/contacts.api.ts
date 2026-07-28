import { apiClient } from '../client'
import type {
  ContactResponse,
  CreateContactPayload,
  DeleteCatalogEntityOptions,
  FetchContactsParams,
  UpdateContactPayload,
} from './types'

export async function fetchContacts(
  params: FetchContactsParams = {},
): Promise<ContactResponse[]> {
  return apiClient<ContactResponse[]>('/contacts', {
    params: params.customerId ? { customerId: params.customerId } : undefined,
  })
}

export async function fetchContact(id: string): Promise<ContactResponse> {
  return apiClient<ContactResponse>(`/contacts/${id}`)
}

export async function createContact(
  payload: CreateContactPayload,
): Promise<ContactResponse> {
  return apiClient<ContactResponse>('/contacts', {
    method: 'POST',
    body: payload,
  })
}

export async function updateContact(
  id: string,
  payload: UpdateContactPayload,
): Promise<ContactResponse> {
  return apiClient<ContactResponse>(`/contacts/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function deleteContact(
  id: string,
  options: DeleteCatalogEntityOptions = {},
): Promise<void> {
  await apiClient(`/contacts/${id}`, {
    method: 'DELETE',
    params: options.permanent ? { permanent: true } : undefined,
  })
}
