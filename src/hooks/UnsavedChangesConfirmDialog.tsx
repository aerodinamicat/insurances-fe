import { useEffect, useId, useRef } from 'react'
import '../components/CatalogModal/CatalogModal.css'
import {
  UNSAVED_CHANGES_MESSAGE,
  UNSAVED_CHANGES_TITLE,
} from './unsaved-changes-messages'

export { UNSAVED_CHANGES_MESSAGE, UNSAVED_CHANGES_TITLE } from './unsaved-changes-messages'

export type UnsavedChangesConfirmDialogProps = {
  open: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function UnsavedChangesConfirmDialog({
  open,
  title = UNSAVED_CHANGES_TITLE,
  message = UNSAVED_CHANGES_MESSAGE,
  confirmLabel = 'Cerrar sin guardar',
  cancelLabel = 'Seguir editando',
  onConfirm,
  onCancel,
}: UnsavedChangesConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  function handleDialogClose() {
    onCancel()
  }

  return (
    <dialog
      ref={dialogRef}
      className="catalog-modal"
      onClose={handleDialogClose}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="catalog-modal__inner">
        <h2 id={titleId} className="catalog-modal__title">
          {title}
        </h2>
        <p id={descriptionId} className="catalog-modal__description">
          {message}
        </p>
        <div className="catalog-modal__actions">
          <button
            type="button"
            className="catalog-modal-btn catalog-modal-btn--secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="catalog-modal-btn catalog-modal-btn--primary"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
