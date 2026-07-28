import { useCallback, useEffect, useState } from 'react'
import {
  deleteAttachment,
  downloadAttachment,
  getCatalogApiErrorMessage,
  updateInsurancePolicy,
} from '../../../api/catalog'
import type {
  AttachmentResponse,
  InsurancePolicyResponse,
} from '../../../api/catalog'
import { useAuth } from '../../../auth'
import {
  TableLayout,
  type TableLayoutColumn,
} from '../../../components/TableLayout'
import { buildCatalogActionsColumn } from '../../../components/CatalogRowActions'
import { formatDisplayDate } from '../../../utils/date'
import { useGuardedDialog } from '../../../hooks/useGuardedDialog'
import { EDITOR_RANK, RoleGate } from '../../../routes/RoleGate'
import { MANAGER_RANK } from '../../../routes/role-ranks'
import { useCustomers } from '../Customers/useCustomers'
import { AttachmentEditModal } from '../Attachments/AttachmentEditModal'
import { AttachmentUploadModal } from '../Attachments/AttachmentUploadModal'
import {
  formatByteSize,
  isPreviewableMimeType,
} from '../Attachments/attachment-form-utils'
import { useAttachments } from '../Attachments/useAttachments'
import { useInsuredAssets } from '../InsuredAssets/useInsuredAssets'

type PolicyDetailDocumentsTabProps = {
  policy: InsurancePolicyResponse
  onPolicyUpdate: (policy: InsurancePolicyResponse) => void
  onCountChange?: (count: number) => void
}

export function PolicyDetailDocumentsTab({
  policy,
  onPolicyUpdate,
  onCountChange,
}: PolicyDetailDocumentsTabProps) {
  const { roleRank } = useAuth()

  const {
    customers,
    isLoading: isCustomersLoading,
    loadError: customersLoadError,
  } = useCustomers()

  const {
    assets,
    isLoading: isAssetsLoading,
    loadError: assetsLoadError,
    reload: reloadAssets,
  } = useInsuredAssets(policy.id)

  const {
    attachments,
    isLoading: isAttachmentsLoading,
    loadError: attachmentsLoadError,
    reload: reloadAttachments,
    upsertAttachment,
    removeAttachment,
  } = useAttachments(null, policy.id, null)

  useEffect(() => {
    onCountChange?.(attachments.length)
  }, [attachments.length, onCountChange])

  const [selectedAttachment, setSelectedAttachment] =
    useState<AttachmentResponse | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [linkingContractId, setLinkingContractId] = useState<string | null>(
    null,
  )
  const [deletePermanent, setDeletePermanent] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const canHardDelete = (roleRank ?? 0) >= MANAGER_RANK
  const canEdit = (roleRank ?? 0) >= EDITOR_RANK
  const isLoading =
    isCustomersLoading || isAssetsLoading || isAttachmentsLoading
  const loadError =
    customersLoadError ?? assetsLoadError ?? attachmentsLoadError

  const resetDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false)
    setSelectedAttachment(null)
    setDeletePermanent(false)
    setActionError(null)
  }, [])

  const deleteDialog = useGuardedDialog({
    isOpen: deleteDialogOpen,
    isDirty: deletePermanent,
    onClose: resetDeleteDialog,
  })

  function openUploadModal() {
    setUploadModalOpen(true)
  }

  function closeUploadModal() {
    setUploadModalOpen(false)
  }

  function handleUploadSuccess(attachment: AttachmentResponse) {
    upsertAttachment(attachment)
    closeUploadModal()
    setFeedback({
      type: 'success',
      message: `Documento ${attachment.documentCode} subido correctamente.`,
    })
  }

  function openEditModal(attachment: AttachmentResponse) {
    setSelectedAttachment(attachment)
    setEditModalOpen(true)
  }

  function closeEditModal() {
    setEditModalOpen(false)
    setSelectedAttachment(null)
  }

  function handleEditSuccess(attachment: AttachmentResponse) {
    upsertAttachment(attachment)
    closeEditModal()
    setFeedback({
      type: 'success',
      message: `Documento ${attachment.documentCode} actualizado.`,
    })
  }

  function openDeleteDialog(attachment: AttachmentResponse) {
    setSelectedAttachment(attachment)
    setDeletePermanent(false)
    setActionError(null)
    setDeleteDialogOpen(true)
    deleteDialog.dialogRef.current?.showModal()
  }

  function closeDeleteDialog() {
    deleteDialog.close()
  }

  async function handleDeleteConfirm() {
    if (!selectedAttachment) {
      return
    }

    setActionError(null)
    setIsSubmitting(true)

    try {
      await deleteAttachment(selectedAttachment.id, {
        permanent: deletePermanent && canHardDelete,
      })
      removeAttachment(selectedAttachment.id)
      closeDeleteDialog()
      setFeedback({
        type: 'success',
        message: deletePermanent
          ? `Documento ${selectedAttachment.documentCode} eliminado permanentemente.`
          : `Documento ${selectedAttachment.documentCode} eliminado.`,
      })
    } catch (caught) {
      setActionError(
        getCatalogApiErrorMessage(
          caught,
          'No se pudo eliminar el documento. Inténtalo de nuevo.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDownload(attachment: AttachmentResponse) {
    setIsDownloading(attachment.id)
    setFeedback(null)

    try {
      const blob = await downloadAttachment(attachment.id)
      const url = URL.createObjectURL(blob)

      if (isPreviewableMimeType(attachment.mimeType)) {
        const previewWindow = window.open(url, '_blank', 'noopener')
        if (!previewWindow) {
          const link = document.createElement('a')
          link.href = url
          link.download = attachment.originalFileName
          link.click()
        }
      } else {
        const link = document.createElement('a')
        link.href = url
        link.download = attachment.originalFileName
        link.click()
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (caught) {
      setFeedback({
        type: 'error',
        message: getCatalogApiErrorMessage(
          caught,
          'No se pudo descargar el documento. Inténtalo de nuevo.',
        ),
      })
    } finally {
      setIsDownloading(null)
    }
  }

  async function handleSetAsContract(attachment: AttachmentResponse) {
    setLinkingContractId(attachment.id)
    setFeedback(null)

    try {
      const updated = await updateInsurancePolicy(policy.id, {
        attachedContractId: attachment.id,
      })
      onPolicyUpdate(updated)
      setFeedback({
        type: 'success',
        message: `Documento ${attachment.documentCode} establecido como contrato de la póliza.`,
      })
    } catch (caught) {
      setFeedback({
        type: 'error',
        message: getCatalogApiErrorMessage(
          caught,
          'No se pudo vincular el contrato. Inténtalo de nuevo.',
        ),
      })
    } finally {
      setLinkingContractId(null)
    }
  }

  async function handleRetry() {
    await Promise.all([reloadAssets(), reloadAttachments()])
  }

  function getParentLabel(): string {
    return `Póliza ${policy.identifierId}`
  }

  const attachmentColumns: TableLayoutColumn<AttachmentResponse>[] = [
    buildCatalogActionsColumn<AttachmentResponse>({
      canEdit,
      download: {
        onClick: (attachment) => {
          void handleDownload(attachment)
        },
        isLoading: (attachment) => isDownloading === attachment.id,
      },
      custom: [
        {
          label: (attachment) =>
            linkingContractId === attachment.id
              ? 'Vinculando…'
              : 'Establecer como contrato',
          onClick: (attachment) => {
            void handleSetAsContract(attachment)
          },
          hidden: (attachment) => policy.attachedContractId === attachment.id,
          isLoading: (attachment) => linkingContractId === attachment.id,
          requiresEdit: true,
        },
      ],
      edit: { onClick: openEditModal },
      delete: { onClick: openDeleteDialog },
    }),
    {
      key: 'code',
      header: 'Código',
      render: (attachment) => {
        const isContract = policy.attachedContractId === attachment.id

        return (
          <>
            <code className="attachments-table__code">
              {attachment.documentCode}
            </code>
            {isContract && (
              <span className="policy-detail-documents__contract-badge">
                Contrato
              </span>
            )}
          </>
        )
      },
    },
    {
      key: 'file',
      header: 'Archivo',
      render: (attachment) => (
        <>
          <span className="attachments-table__filename">
            {attachment.originalFileName}
          </span>
          <span className="attachments-table__extension">
            {attachment.fileExtension.toUpperCase()}
          </span>
        </>
      ),
    },
    {
      key: 'issued-at',
      header: 'Emisión',
      render: (attachment) => formatDisplayDate(attachment.issuedAt),
    },
    {
      key: 'expired-at',
      header: 'Caducidad',
      render: (attachment) => formatDisplayDate(attachment.expiredAt),
    },
    {
      key: 'size',
      header: 'Tamaño',
      render: (attachment) => formatByteSize(attachment.byteSize),
    },
  ]

  return (
    <div className="policy-detail-tab-panel">
      <div className="catalog-page__toolbar">
        <RoleGate minRoleRank={EDITOR_RANK}>
          <button
            type="button"
            className="catalog-btn catalog-btn--add"
            onClick={openUploadModal}
            disabled={isLoading || Boolean(loadError)}
          >
            Añadir
          </button>
        </RoleGate>
      </div>

      {feedback && (
        <div
          className={`catalog-feedback auth-alert auth-alert--${feedback.type}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </div>
      )}

      {isLoading && (
        <p className="catalog-empty">Cargando documentos…</p>
      )}

      {!isLoading && loadError && (
        <div className="auth-alert auth-alert--error" role="alert">
          {loadError}
          <div className="catalog-page__retry">
            <button
              type="button"
              className="catalog-btn catalog-btn--secondary"
              onClick={() => {
                void handleRetry()
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {!isLoading && !loadError && attachments.length === 0 && (
        <p className="catalog-empty">
          No hay documentos vinculados a esta póliza.
        </p>
      )}

      {!isLoading && !loadError && attachments.length > 0 && (
        <TableLayout
          columns={attachmentColumns}
          items={attachments}
          getItemKey={(attachment) => attachment.id}
          getRowClassName={(attachment) =>
            policy.attachedContractId === attachment.id
              ? 'policy-detail-documents__row--contract'
              : undefined
          }
        />
      )}

      <AttachmentUploadModal
        key={uploadModalOpen ? `upload-${policy.id}` : 'upload-closed'}
        open={uploadModalOpen}
        customers={customers}
        policies={[policy]}
        assets={assets}
        customerFilterId={policy.customerId}
        policyFilterId={policy.id}
        assetFilterId={null}
        parentLocked
        isLoadingOptions={
          isCustomersLoading || isAssetsLoading
        }
        onClose={closeUploadModal}
        onSuccess={handleUploadSuccess}
      />

      <AttachmentEditModal
        key={
          editModalOpen
            ? `edit-${selectedAttachment?.id ?? 'none'}`
            : 'edit-closed'
        }
        open={editModalOpen}
        attachment={selectedAttachment ?? undefined}
        parentLabel={
          selectedAttachment ? getParentLabel() : ''
        }
        onClose={closeEditModal}
        onSuccess={handleEditSuccess}
      />

      <dialog
        ref={deleteDialog.dialogRef}
        className="catalog-modal catalog-delete-dialog"
        onClose={deleteDialog.handleDialogClose}
        onCancel={deleteDialog.handleDialogCancel}
        aria-labelledby="delete-policy-attachment-title"
      >
        <div className="catalog-modal__inner">
          <h2
            id="delete-policy-attachment-title"
            className="catalog-modal__title"
          >
            Eliminar documento
          </h2>
          <p className="catalog-delete-dialog__description">
            {selectedAttachment
              ? deletePermanent
                ? `Se eliminará permanentemente el documento ${selectedAttachment.documentCode} (${selectedAttachment.originalFileName}). Esta acción no se puede deshacer.`
                : `¿Eliminar el documento ${selectedAttachment.documentCode} (${selectedAttachment.originalFileName})? Dejará de aparecer en el catálogo.`
              : 'El documento dejará de aparecer en el catálogo.'}
          </p>

          {actionError && (
            <div className="auth-alert auth-alert--error" role="alert">
              {actionError}
            </div>
          )}

          {canHardDelete && (
            <label className="catalog-delete-dialog__checkbox">
              <input
                type="checkbox"
                checked={deletePermanent}
                disabled={isSubmitting}
                onChange={(event) => setDeletePermanent(event.target.checked)}
              />
              <span>Eliminar permanentemente (no se puede restaurar)</span>
            </label>
          )}

          <div className="catalog-modal__actions">
            <button
              type="button"
              className="catalog-modal-btn catalog-modal-btn--secondary"
              disabled={isSubmitting}
              onClick={() => void deleteDialog.attemptClose()}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={`catalog-modal-btn ${deletePermanent ? 'catalog-btn--danger' : 'catalog-modal-btn--primary'}`}
              disabled={isSubmitting}
              onClick={() => void handleDeleteConfirm()}
            >
              {isSubmitting
                ? 'Eliminando…'
                : deletePermanent
                  ? 'Borrar permanentemente'
                  : 'Borrar'}
            </button>
          </div>
        </div>
      </dialog>
      {deleteDialog.confirmDialog}
    </div>
  )
}
