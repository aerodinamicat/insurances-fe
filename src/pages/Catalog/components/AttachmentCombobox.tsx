import type { AttachmentResponse } from '../../../api/catalog'
import { CatalogCombobox } from './CatalogCombobox'
import { formatDisplayDate } from '../../../utils/date'
import {
  formatByteSize,
  getAttachmentDocumentTypeLabel,
} from '../Attachments/attachment-form-utils'

type AttachmentComboboxProps = {
  attachments: AttachmentResponse[]
  value: string | null
  onChange: (attachmentId: string | null) => void
  label: string
  disabled?: boolean
  required?: boolean
  allowEmpty?: boolean
  emptyLabel?: string
  isLoading?: boolean
  openOnFocus?: boolean
}

function getAttachmentSearchText(attachment: AttachmentResponse): string {
  return [
    attachment.documentType,
    attachment.documentCode,
    attachment.originalFileName,
    attachment.mimeType,
    attachment.fileExtension,
    attachment.issuedAt,
    attachment.expiredAt,
  ]
    .filter(Boolean)
    .join(' ')
}

export function AttachmentCombobox({
  attachments,
  value,
  onChange,
  label,
  disabled = false,
  required = false,
  allowEmpty = false,
  emptyLabel = 'Todos los documentos',
  isLoading = false,
  openOnFocus = true,
}: AttachmentComboboxProps) {
  return (
    <CatalogCombobox
      items={attachments}
      value={value}
      onChange={onChange}
      label={label}
      getItemLabel={(attachment) =>
        getAttachmentDocumentTypeLabel(attachment.documentType)
      }
      getItemMetaItems={(attachment) => [
        { value: attachment.documentCode },
        { value: attachment.originalFileName },
        { value: attachment.fileExtension.toUpperCase() },
        { value: formatByteSize(attachment.byteSize) },
        {
          value: attachment.issuedAt
            ? formatDisplayDate(attachment.issuedAt)
            : null,
        },
        {
          value: attachment.expiredAt
            ? formatDisplayDate(attachment.expiredAt)
            : null,
        },
      ]}
      getItemSearchText={getAttachmentSearchText}
      disabled={disabled}
      required={required}
      allowEmpty={allowEmpty}
      emptyLabel={emptyLabel}
      emptyMessage="No se encontraron documentos."
      isLoading={isLoading}
      openOnFocus={openOnFocus}
      placeholder="Buscar documento…"
    />
  )
}
