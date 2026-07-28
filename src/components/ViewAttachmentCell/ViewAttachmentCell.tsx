import '../../pages/Catalog/catalog-shared.css'
import './ViewAttachmentCell.css'

type ViewAttachmentCellProps = {
  isPreviewable: boolean
  isLoading: boolean
  onView: () => void
  onDownload?: () => void
  isDownloading?: boolean
}

export function ViewAttachmentCell({
  isPreviewable,
  isLoading,
  onView,
  onDownload,
  isDownloading = false,
}: ViewAttachmentCellProps) {
  const hasDownload = Boolean(onDownload)

  if (!isPreviewable && !hasDownload) {
    return (
      <span className="view-attachment-cell view-attachment-cell--empty">—</span>
    )
  }

  return (
    <div className="view-attachment-cell row-actions">
      {isPreviewable && (
        <button
          type="button"
          className="catalog-table-action-btn"
          disabled={isLoading}
          onClick={onView}
        >
          {isLoading ? 'Cargando…' : 'Visualizar'}
        </button>
      )}
      {hasDownload && (
        <button
          type="button"
          className="catalog-table-action-btn"
          disabled={isDownloading}
          onClick={onDownload}
        >
          {isDownloading ? 'Descargando…' : 'Descargar'}
        </button>
      )}
    </div>
  )
}
