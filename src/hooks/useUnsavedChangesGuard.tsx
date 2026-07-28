import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { confirmUnsavedChangesClose } from './confirmUnsavedChangesClose'
import { UnsavedChangesConfirmDialog } from './UnsavedChangesConfirmDialog'
import {
  BEFORE_UNLOAD_MESSAGE,
  UNSAVED_CHANGES_MESSAGE,
} from './unsaved-changes-messages'

export type UseUnsavedChangesGuardOptions = {
  /** When true and isDirty, registers beforeunload while the modal is open. */
  isModalOpen?: boolean
  isDirty?: boolean
  message?: string
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  /**
   * When true, uses window.confirm instead of the accessible dialog.
   * Useful for quick integration or tests without rendering confirmDialog.
   */
  useNativeConfirm?: boolean
}

export type UseUnsavedChangesGuardResult = {
  confirmClose: (isDirty: boolean) => Promise<boolean>
  /** Render once alongside the guarded modal (ignored when useNativeConfirm is true). */
  confirmDialog: ReactNode
}

export function useUnsavedChangesGuard(
  options: UseUnsavedChangesGuardOptions = {},
): UseUnsavedChangesGuardResult {
  const {
    isModalOpen = false,
    isDirty = false,
    message = UNSAVED_CHANGES_MESSAGE,
    title,
    confirmLabel,
    cancelLabel,
    useNativeConfirm = false,
  } = options

  const [pending, setPending] = useState<{
    resolve: (confirmed: boolean) => void
  } | null>(null)
  const pendingRef = useRef(pending)

  useEffect(() => {
    pendingRef.current = pending
  }, [pending])

  const confirmClose = useCallback(
    async (dirty: boolean): Promise<boolean> => {
      if (!dirty) {
        return true
      }

      if (useNativeConfirm) {
        return confirmUnsavedChangesClose(true, { message })
      }

      return new Promise<boolean>((resolve) => {
        setPending({ resolve })
      })
    },
    [message, useNativeConfirm],
  )

  const settlePending = useCallback((confirmed: boolean) => {
    pendingRef.current?.resolve(confirmed)
    setPending(null)
  }, [])

  const handleConfirm = useCallback(() => {
    settlePending(true)
  }, [settlePending])

  const handleCancel = useCallback(() => {
    settlePending(false)
  }, [settlePending])

  useEffect(() => {
    if (!isModalOpen || !isDirty) {
      return
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = BEFORE_UNLOAD_MESSAGE
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isModalOpen, isDirty])

  const confirmDialog =
    useNativeConfirm ? null : (
      <UnsavedChangesConfirmDialog
        open={pending !== null}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    )

  return { confirmClose, confirmDialog }
}
