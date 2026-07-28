import { apiClient } from '../client'
import type {
  AttachmentResponse,
  DeleteCatalogEntityOptions,
  FetchAttachmentsParams,
  UpdateAttachmentPayload,
} from './types'

function buildAttachmentsParams(
  params: FetchAttachmentsParams,
): Record<string, string> | undefined {
  const query: Record<string, string> = {}

  if (params.customerId) {
    query.customerId = params.customerId
  }

  if (params.insurancePolicyId) {
    query.insurancePolicyId = params.insurancePolicyId
  }

  if (params.insuredAssetId) {
    query.insuredAssetId = params.insuredAssetId
  }

  return Object.keys(query).length > 0 ? query : undefined
}

export async function fetchAttachments(
  params: FetchAttachmentsParams = {},
): Promise<AttachmentResponse[]> {
  return apiClient<AttachmentResponse[]>('/attachments', {
    params: buildAttachmentsParams(params),
  })
}

export async function fetchAttachment(id: string): Promise<AttachmentResponse> {
  return apiClient<AttachmentResponse>(`/attachments/${id}`)
}

export async function uploadAttachment(
  formData: FormData,
): Promise<AttachmentResponse> {
  return apiClient<AttachmentResponse>('/attachments', {
    method: 'POST',
    body: formData,
  })
}

export async function downloadAttachment(id: string): Promise<Blob> {
  return apiClient<Blob>(`/attachments/${id}/download`, {
    parseAs: 'blob',
  })
}

export async function updateAttachment(
  id: string,
  payload: UpdateAttachmentPayload,
): Promise<AttachmentResponse> {
  return apiClient<AttachmentResponse>(`/attachments/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function deleteAttachment(
  id: string,
  options: DeleteCatalogEntityOptions = {},
): Promise<void> {
  await apiClient(`/attachments/${id}`, {
    method: 'DELETE',
    params: options.permanent ? { permanent: true } : undefined,
  })
}
