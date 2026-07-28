import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useId,
} from 'react'
import { useGuardedDialog } from '../../hooks/useGuardedDialog'
import '../../pages/auth/auth-page.css'
import './CatalogModal.css'

export type CatalogModalProps = {
  open: boolean
  title: string
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
  isSubmitting: boolean
  error: string | null
  isDirty?: boolean
  autoFocusFirstField?: boolean
  resetActionLabel?: string
  onResetAction?: () => void
  children: ReactNode
}

function focusFirstField(dialog: HTMLDialogElement) {
  const firstField = dialog.querySelector<HTMLElement>(
    'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])',
  )
  firstField?.focus()
}

function focusDialog(dialog: HTMLDialogElement) {
  const activeElement = document.activeElement
  if (activeElement instanceof HTMLElement && dialog.contains(activeElement)) {
    activeElement.blur()
  }

  dialog.focus({ preventScroll: true })
}

export function CatalogModal({
  open,
  title,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  isDirty = false,
  autoFocusFirstField = true,
  resetActionLabel,
  onResetAction,
  children,
}: CatalogModalProps) {
  const titleId = useId()

  const {
    dialogRef,
    attemptClose,
    closeSilently,
    handleDialogClose,
    handleDialogCancel,
    confirmDialog,
  } = useGuardedDialog({
    isOpen: open,
    isDirty,
    onClose,
  })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      if (autoFocusFirstField) {
        requestAnimationFrame(() => focusFirstField(dialog))
      } else {
        focusDialog(dialog)
        requestAnimationFrame(() => focusDialog(dialog))
      }
    } else if (!open && dialog.open) {
      closeSilently()
    }
  }, [autoFocusFirstField, closeSilently, dialogRef, open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit(event)
  }

  return (
    <>
      <dialog
        ref={dialogRef}
        className="catalog-modal"
        onClose={handleDialogClose}
        onCancel={handleDialogCancel}
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="catalog-modal__inner">
          <h2 id={titleId} className="catalog-modal__title">
            {title}
          </h2>

          <form
            className="catalog-modal__form"
            onSubmit={handleSubmit}
            noValidate
          >
            {error && (
              <div className="auth-alert auth-alert--error" role="alert">
                {error}
              </div>
            )}

            {children}

            <div className="catalog-modal__actions">
              {resetActionLabel && onResetAction && (
                <button
                  type="button"
                  className="catalog-modal-btn catalog-modal-btn--secondary"
                  disabled={isSubmitting}
                  onClick={onResetAction}
                >
                  {resetActionLabel}
                </button>
              )}
              <button
                type="button"
                className="catalog-modal-btn catalog-modal-btn--secondary"
                disabled={isSubmitting}
                onClick={() => void attemptClose()}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="catalog-modal-btn catalog-modal-btn--primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </dialog>
      {confirmDialog}
    </>
  )
}
