import { describe, expect, it } from 'vitest'

import type { AttachmentResponse } from '../../../api/catalog'
import { getAttachmentParentDetailPath } from './attachment-navigation'

function createAttachment(
  parent: Partial<
    Pick<
      AttachmentResponse,
      'customerId' | 'insurancePolicyId' | 'insuredAssetId'
    >
  >,
): AttachmentResponse {
  return {
    id: 'attachment-1',
    alias: 'attachment-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    documentType: 'DNI',
    documentCode: null,
    issuedAt: null,
    expiredAt: null,
    customerId: null,
    insurancePolicyId: null,
    insuredAssetId: null,
    originalFileName: 'document.pdf',
    mimeType: 'application/pdf',
    byteSize: '100',
    fileExtension: 'pdf',
    ...parent,
  }
}

describe('getAttachmentParentDetailPath', () => {
  it('returns the customer detail path for customer attachments', () => {
    expect(
      getAttachmentParentDetailPath(
        createAttachment({ customerId: 'customer-uuid' }),
      ),
    ).toBe('/catalog/customers/customer-uuid')
  })

  it('returns the policy detail path for policy attachments', () => {
    expect(
      getAttachmentParentDetailPath(
        createAttachment({ insurancePolicyId: 'policy-uuid' }),
      ),
    ).toBe('/catalog/insurance-policies/policy-uuid')
  })

  it('does not return a path for insured assets without a detail page', () => {
    expect(
      getAttachmentParentDetailPath(
        createAttachment({ insuredAssetId: 'asset-uuid' }),
      ),
    ).toBeNull()
  })
})
