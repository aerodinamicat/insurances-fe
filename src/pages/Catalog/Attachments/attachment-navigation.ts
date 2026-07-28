import type { AttachmentResponse } from '../../../api/catalog'
import { getParentTypeFromAttachment } from './attachment-form-utils'

export function getAttachmentParentDetailPath(
  attachment: AttachmentResponse,
): string | null {
  const parentType = getParentTypeFromAttachment(attachment)

  if (parentType === 'policy' && attachment.insurancePolicyId) {
    return `/catalog/insurance-policies/${attachment.insurancePolicyId}`
  }
  if (parentType === 'customer' && attachment.customerId) {
    return `/catalog/customers/${attachment.customerId}`
  }
  return null
}
