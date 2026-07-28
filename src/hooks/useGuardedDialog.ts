import {
  type SyntheticEvent,
  useCallback,
  useRef,
} from 'react'
import { useUnsavedChangesGuard } from './useUnsavedChangesGuard'

export type UseGuardedDialogOptions = {
  isOpen: boolean
  isDirty?: boolean
  onClose: () => void
}

export function useGuardedDialog({
  isOpen,
  isDirty = false,
  onClose,
}: UseGuardedDialogOptions) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeConfirmedRef = useRef(false)
  const programmaticCloseRef = useRef(false)

  const { confirmClose, confirmDialog } = useUnsavedChangesGuard({
    isModalOpen: isOpen,
    isDirty,
  })

  const close = useCallback(() => {
    programmaticCloseRef.current = true
    dialogRef.current?.close()
    onClose()
  }, [onClose])

  const closeSilently = useCallback(() => {
    programmaticCloseRef.current = true
    dialogRef.current?.close()
  }, [])

  const attemptClose = useCallback(async () => {
    const confirmed = await confirmClose(isDirty)
    if (confirmed) {
      closeConfirmedRef.current = true
      dialogRef.current?.close()
    }
  }, [confirmClose, isDirty])

  const handleDialogClose = useCallback(() => {
    if (programmaticCloseRef.current) {
      programmaticCloseRef.current = false
      return
    }

    if (closeConfirmedRef.current) {
      closeConfirmedRef.current = false
      onClose()
      return
    }

    dialogRef.current?.showModal()
  }, [onClose])

  const handleDialogCancel = useCallback(
    (event: SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault()
      void attemptClose()
    },
    [attemptClose],
  )

  return {
    dialogRef,
    close,
    closeSilently,
    attemptClose,
    handleDialogClose,
    handleDialogCancel,
    confirmDialog,
  }
}
