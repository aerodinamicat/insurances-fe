import { useCallback, useState } from 'react'
import { useGuardedDialog } from '../../../hooks/useGuardedDialog'
import { MANAGER_RANK } from '../../../routes/role-ranks'

/**
 * Shared CRUD page shell for catalog list pages (create/edit form modal + delete dialog).
 *
 * Pilot: CustomersPage. Encapsulates dialogMode, selectedItem, feedback, hard-delete
 * permissions and guarded delete dialog state without unifying columns, entity modals
 * or wizards.
 *
 * Extension decision: adopt incrementally on simple catalog pages (Contacts,
 * InsuredAssets, Attachments, AssuranceCompanies) that follow the same
 * create/edit/delete pattern. Keep optional for pages with extra load sources or
 * non-standard flows (InsurancePolicies, PolicyDetail tabs). Each adoption should
 * be judged on whether the hook is clearer than inline state — it is not mandatory.
 */
export type CatalogCrudDialogMode = 'create' | 'edit' | 'delete' | null

export type CatalogCrudFeedback = {
  type: 'success' | 'error'
  message: string
}

export type CatalogDeleteConfirmCallbacks<T> = {
  onDeleted: (item: T) => void
  getSuccessMessage: (item: T, wasPermanent: boolean) => string
  getErrorMessage: (error: unknown) => string
}

export type UseCatalogCrudPageOptions = {
  roleRank: number | null | undefined
}

export function useCatalogCrudPage<T>({ roleRank }: UseCatalogCrudPageOptions) {
  const [dialogMode, setDialogMode] = useState<CatalogCrudDialogMode>(null)
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletePermanent, setDeletePermanent] = useState(false)
  const [feedback, setFeedback] = useState<CatalogCrudFeedback | null>(null)

  const canHardDelete = (roleRank ?? 0) >= MANAGER_RANK

  const resetDeleteDialog = useCallback(() => {
    setDialogMode((mode) => (mode === 'delete' ? null : mode))
    setSelectedItem(null)
    setDeletePermanent(false)
    setActionError(null)
  }, [])

  const deleteDialog = useGuardedDialog({
    isOpen: dialogMode === 'delete',
    isDirty: deletePermanent,
    onClose: resetDeleteDialog,
  })

  const openCreate = useCallback(() => {
    setSelectedItem(null)
    setDialogMode('create')
    setFormModalOpen(true)
  }, [])

  const openEdit = useCallback((item: T) => {
    setSelectedItem(item)
    setDialogMode('edit')
    setFormModalOpen(true)
  }, [])

  const openDelete = useCallback(
    (item: T) => {
      setSelectedItem(item)
      setDeletePermanent(false)
      setActionError(null)
      setDialogMode('delete')
      deleteDialog.dialogRef.current?.showModal()
    },
    [deleteDialog.dialogRef],
  )

  const closeForm = useCallback(() => {
    setFormModalOpen(false)
    setDialogMode((mode) => (mode === 'create' || mode === 'edit' ? null : mode))
    setSelectedItem(null)
  }, [])

  const closeDelete = useCallback(() => {
    deleteDialog.close()
  }, [deleteDialog])

  const handleDeleteConfirm = useCallback(
    async (
      deleteFn: (item: T, permanent: boolean) => Promise<void>,
      callbacks: CatalogDeleteConfirmCallbacks<T>,
    ) => {
      if (!selectedItem) {
        return
      }

      setActionError(null)
      setIsSubmitting(true)

      const item = selectedItem
      const wasPermanent = deletePermanent && canHardDelete

      try {
        await deleteFn(item, wasPermanent)
        callbacks.onDeleted(item)
        deleteDialog.close()
        setFeedback({
          type: 'success',
          message: callbacks.getSuccessMessage(item, wasPermanent),
        })
      } catch (caught) {
        setActionError(callbacks.getErrorMessage(caught))
      } finally {
        setIsSubmitting(false)
      }
    },
    [selectedItem, deletePermanent, canHardDelete, deleteDialog],
  )

  return {
    dialogMode,
    formModalOpen,
    selectedItem,
    deletePermanent,
    setDeletePermanent,
    canHardDelete,
    feedback,
    setFeedback,
    actionError,
    isSubmitting,
    deleteDialog,
    openCreate,
    openEdit,
    openDelete,
    closeForm,
    closeDelete,
    handleDeleteConfirm,
  }
}
