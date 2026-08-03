import '../catalog-shared.css'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  deleteAttachment,
  downloadAttachment,
  getCatalogApiErrorMessage,
  getCustomerAlias,
} from '../../../api/catalog'
import type {
  AttachmentResponse,
  CustomerResponse,
  InsuredAssetResponse,
  InsurancePolicyResponse,
} from '../../../api/catalog'
import { useAuth } from '../../../auth'
import {
  TableLayout,
  type TableLayoutColumn,
} from '../../../components/TableLayout'
import { buildCatalogActionsColumn } from '../../../components/CatalogRowActions'
import { ViewAttachmentCell } from '../../../components/ViewAttachmentCell/ViewAttachmentCell'
import { formatDisplayDate, formatRemainingValidity, getRemainingValiditySortKey } from '../../../utils/date'
import { useGuardedDialog } from '../../../hooks/useGuardedDialog'
import { EDITOR_RANK, RoleGate } from '../../../routes/RoleGate'
import { MANAGER_RANK } from '../../../routes/role-ranks'
import { useAssuranceCompanies } from '../AssuranceCompanies/useAssuranceCompanies'
import { getAssetSummary } from '../InsuredAssets/insured-asset-form-utils'
import { useCustomers } from '../Customers/useCustomers'
import { useInsuredAssets } from '../InsuredAssets/useInsuredAssets'
import { useInsurancePolicies } from '../InsurancePolicies/useInsurancePolicies'
import { AttachmentEditModal } from './AttachmentEditModal'
import { AttachmentPreviewModal } from './AttachmentPreviewModal'
import { AttachmentUploadModal } from './AttachmentUploadModal'
import { getAttachmentParentDetailPath } from './attachment-navigation'
import {
  getAttachmentDocumentTypeLabel,
  getParentTypeFromAttachment,
  isPreviewableMimeType,
} from './attachment-form-utils'
import { useAttachments } from './useAttachments'
import './AttachmentsPage.css'

export function AttachmentsPage() {
  const { roleRank } = useAuth()
  const navigate = useNavigate()

  const {
    customers,
    isLoading: isCustomersLoading,
    loadError: customersLoadError,
  } = useCustomers()

  const {
    policies,
    isLoading: isPoliciesLoading,
    loadError: policiesLoadError,
    reload: reloadPolicies,
  } = useInsurancePolicies()

  const {
    assuranceCompanies,
    isLoading: isCompaniesLoading,
    loadError: companiesLoadError,
    reload: reloadCompanies,
  } = useAssuranceCompanies()

  const {
    assets,
    isLoading: isAssetsLoading,
    loadError: assetsLoadError,
    reload: reloadAssets,
  } = useInsuredAssets(null)

  const {
    attachments,
    isLoading: isAttachmentsLoading,
    loadError: attachmentsLoadError,
    reload: reloadAttachments,
    upsertAttachment,
    removeAttachment,
  } = useAttachments(null, null, null)

  const [selectedAttachment, setSelectedAttachment] =
    useState<AttachmentResponse | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [isPreviewing, setIsPreviewing] = useState<string | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewAttachment, setPreviewAttachment] =
    useState<AttachmentResponse | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [deletePermanent, setDeletePermanent] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const canHardDelete = (roleRank ?? 0) >= MANAGER_RANK
  const canEdit = (roleRank ?? 0) >= EDITOR_RANK
  const isLoading =
    isCustomersLoading ||
    isPoliciesLoading ||
    isCompaniesLoading ||
    isAssetsLoading ||
    isAttachmentsLoading
  const loadError =
    customersLoadError ??
    policiesLoadError ??
    companiesLoadError ??
    assetsLoadError ??
    attachmentsLoadError

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
  const {
    dialogRef: deleteDialogRef,
    handleDialogClose: handleDeleteDialogClose,
    handleDialogCancel: handleDeleteDialogCancel,
    confirmDialog: deleteConfirmDialog,
  } = deleteDialog

  const customerById = useMemo(() => {
    const map = new Map<string, CustomerResponse>()
    for (const customer of customers) {
      map.set(customer.id, customer)
    }
    return map
  }, [customers])

  const policyById = useMemo(() => {
    const map = new Map<string, InsurancePolicyResponse>()
    for (const policy of policies) {
      map.set(policy.id, policy)
    }
    return map
  }, [policies])

  const assetById = useMemo(() => {
    const map = new Map<string, InsuredAssetResponse>()
    for (const asset of assets) {
      map.set(asset.id, asset)
    }
    return map
  }, [assets])

  function getCustomerName(customerId: string): string {
    const customer = customerById.get(customerId)
    return customer ? getCustomerAlias(customer) : customerId
  }

  function getPolicyIdentifier(policyId: string): string {
    const policy = policyById.get(policyId)
    return policy?.identifierId ?? policyId
  }

  function getAssetLabel(assetId: string): string {
    const asset = assetById.get(assetId)
    if (!asset) {
      return assetId
    }

    const summary = getAssetSummary(asset)
    return summary && summary !== '—' ? `${asset.type}: ${summary}` : asset.type
  }

  function getParentLabel(attachment: AttachmentResponse): string {
    const parentType = getParentTypeFromAttachment(attachment)

    if (parentType === 'asset' && attachment.insuredAssetId) {
      return getAssetLabel(attachment.insuredAssetId)
    }
    if (parentType === 'policy' && attachment.insurancePolicyId) {
      return `Póliza ${getPolicyIdentifier(attachment.insurancePolicyId)}`
    }
    if (attachment.customerId) {
      return getCustomerName(attachment.customerId)
    }
    return '—'
  }

  function getParentTypeLabel(attachment: AttachmentResponse): string {
    const parentType = getParentTypeFromAttachment(attachment)
    switch (parentType) {
      case 'asset':
        return 'Bien'
      case 'policy':
        return 'Póliza'
      default:
        return 'Cliente'
    }
  }

  function getAttachmentReference(attachment: AttachmentResponse): string {
    return (
      attachment.documentCode ??
      getAttachmentDocumentTypeLabel(attachment.documentType)
    )
  }

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
      message: `Documento ${getAttachmentReference(attachment)} subido correctamente.`,
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
      message: `Documento ${getAttachmentReference(attachment)} actualizado.`,
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
          ? `Documento ${getAttachmentReference(selectedAttachment)} eliminado permanentemente.`
          : `Documento ${getAttachmentReference(selectedAttachment)} eliminado.`,
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
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.originalFileName
      link.click()
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

  function closePreviewModal() {
    setPreviewModalOpen(false)
    setPreviewAttachment(null)
    setPreviewError(null)

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  async function handlePreview(attachment: AttachmentResponse) {
    setIsPreviewing(attachment.id)
    setPreviewError(null)
    setPreviewAttachment(attachment)
    setPreviewUrl(null)
    setPreviewModalOpen(true)
    setFeedback(null)

    try {
      const blob = await downloadAttachment(attachment.id)
      setPreviewUrl(URL.createObjectURL(blob))
    } catch (caught) {
      setPreviewError(
        getCatalogApiErrorMessage(
          caught,
          'No se pudo cargar el documento. Inténtalo de nuevo.',
        ),
      )
    } finally {
      setIsPreviewing(null)
    }
  }

  async function handleRetry() {
    await Promise.all([
      reloadPolicies(),
      reloadCompanies(),
      reloadAssets(),
      reloadAttachments(),
    ])
  }

  const attachmentColumns: TableLayoutColumn<AttachmentResponse>[] = [
    buildCatalogActionsColumn<AttachmentResponse>({
      canEdit,
      canDelete: canHardDelete,
      edit: { onClick: openEditModal },
      delete: { onClick: openDeleteDialog },
    }),
    {
      key: 'view',
      header: 'Archivo',
      headerClassName: 'table-layout__actions',
      cellClassName: 'table-layout__actions',
      render: (attachment) => (
        <ViewAttachmentCell
          isPreviewable={isPreviewableMimeType(attachment.mimeType)}
          isLoading={isPreviewing === attachment.id}
          isDownloading={isDownloading === attachment.id}
          onView={() => {
            void handlePreview(attachment)
          }}
          onDownload={() => {
            void handleDownload(attachment)
          }}
        />
      ),
      getSearchValue: () => '',
      getSortValue: () => '',
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (attachment) => (
        <span>{getAttachmentDocumentTypeLabel(attachment.documentType)}</span>
      ),
      getSearchValue: (attachment) =>
        `${getAttachmentDocumentTypeLabel(attachment.documentType)} ${attachment.documentType}`,
    },
    {
      key: 'code',
      header: 'Código',
      render: (attachment) => (
        attachment.documentCode ? (
          <span>{attachment.documentCode}</span>
        ) : (
          '—'
        )
      ),
    },
    {
      key: 'parent',
      header: 'Vinculado a',
      render: (attachment) => {
        const detailPath = getAttachmentParentDetailPath(attachment)

        return (
          <span className="attachments-table__parent">
            {detailPath && (
              <button
                type="button"
                className="catalog-table-action-btn"
                onClick={() => navigate(detailPath)}
              >
                Ver
              </button>
            )}
            <span className="catalog-badge catalog-badge--parent">
              {getParentTypeLabel(attachment)}
            </span>
            <span>{getParentLabel(attachment)}</span>
          </span>
        )
      },
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
      key: 'remaining-validity',
      header: 'Vigencia restante',
      headerClassName: 'table-layout__actions',
      render: (attachment) => formatRemainingValidity(attachment.expiredAt),
      getSearchValue: (attachment) =>
        formatRemainingValidity(attachment.expiredAt),
      getSortValue: (attachment) =>
        String(getRemainingValiditySortKey(attachment.expiredAt)),
    },
  ]

  return (
    <div className="page-content catalog-page">
      <div className="catalog-page__header">
        <div className="catalog-page__intro">
          <h1 className="page-content__title">Documentos</h1>
          <p className="page-content__subtitle">
            Documentos adjuntos a clientes, pólizas y bienes.
          </p>
        </div>

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
        <p className="catalog-empty">No hay documentos registrados.</p>
      )}

      {!isLoading && !loadError && attachments.length > 0 && (
        <TableLayout
          columns={attachmentColumns}
          items={attachments}
          getItemKey={(attachment) => attachment.id}
        />
      )}

      <AttachmentUploadModal
        key={
          uploadModalOpen ? 'upload-catalog-page' : 'upload-closed'
        }
        open={uploadModalOpen}
        customers={customers}
        policies={policies}
        assuranceCompanies={assuranceCompanies}
        assets={assets}
        customerFilterId={null}
        policyFilterId={null}
        assetFilterId={null}
        isLoadingOptions={
          isCustomersLoading ||
          isPoliciesLoading ||
          isCompaniesLoading ||
          isAssetsLoading
        }
        onClose={closeUploadModal}
        onSuccess={handleUploadSuccess}
      />

      <AttachmentPreviewModal
        open={previewModalOpen}
        attachment={previewAttachment}
        previewUrl={previewUrl}
        isLoading={isPreviewing !== null}
        error={previewError}
        onClose={closePreviewModal}
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
          selectedAttachment ? getParentLabel(selectedAttachment) : ''
        }
        onClose={closeEditModal}
        onSuccess={handleEditSuccess}
      />

      <dialog
        ref={deleteDialogRef}
        className="catalog-modal catalog-delete-dialog"
        onClose={handleDeleteDialogClose}
        onCancel={handleDeleteDialogCancel}
        aria-labelledby="delete-attachment-title"
      >
        <div className="catalog-modal__inner">
          <h2 id="delete-attachment-title" className="catalog-modal__title">
            Eliminar documento
          </h2>
          <p className="catalog-delete-dialog__description">
            {selectedAttachment
              ? deletePermanent
                ? `Se eliminará permanentemente el documento ${getAttachmentReference(selectedAttachment)} (${selectedAttachment.originalFileName}). Esta acción no se puede deshacer.`
                : `¿Eliminar el documento ${getAttachmentReference(selectedAttachment)} (${selectedAttachment.originalFileName})? Dejará de aparecer en el catálogo.`
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
      {deleteConfirmDialog}
    </div>
  )
}
