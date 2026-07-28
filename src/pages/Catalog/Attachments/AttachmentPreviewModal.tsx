import { useEffect, useRef } from 'react'
import type { AttachmentResponse } from '../../../api/catalog'
import './AttachmentPreviewModal.css'

type AttachmentPreviewModalProps = {
  open: boolean
  attachment: AttachmentResponse | null
  previewUrl: string | null
  isLoading: boolean
  error: string | null
  onClose: () => void
}

export function AttachmentPreviewModal({
  open,
  attachment,
  previewUrl,
  isLoading,
  error,
  onClose,
}: AttachmentPreviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const isImage = attachment?.mimeType.startsWith('image/') ?? false

  return (
    <dialog
      ref={dialogRef}
      className="attachment-preview-modal"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      aria-labelledby="attachment-preview-title"
    >
      <div className="attachment-preview-modal__inner">
        <header className="attachment-preview-modal__header">
          <h2
            id="attachment-preview-title"
            className="attachment-preview-modal__title"
          >
            {attachment?.originalFileName ?? 'Vista previa'}
          </h2>
          <button
            type="button"
            className="attachment-preview-modal__close"
            onClick={onClose}
          >
            Cerrar
          </button>
        </header>

        {isLoading && (
          <p className="attachment-preview-modal__status">Cargando documento…</p>
        )}

        {error && (
          <div className="auth-alert auth-alert--error" role="alert">
            {error}
          </div>
        )}

        {previewUrl && attachment && !isLoading && !error && (
          <div className="attachment-preview-modal__content">
            {isImage ? (
              <img
                className="attachment-preview-modal__image"
                src={previewUrl}
                alt={attachment.originalFileName}
              />
            ) : (
              <iframe
                className="attachment-preview-modal__frame"
                src={previewUrl}
                title={attachment.originalFileName}
              />
            )}
          </div>
        )}
      </div>
    </dialog>
  )
}
