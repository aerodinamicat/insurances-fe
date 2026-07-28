import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteInsuredAsset,
  getCatalogApiErrorMessage,
  getCustomerAlias,
} from '../../../api/catalog'
import type {
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
import { ViewOnMapCell } from '../../../components/ViewOnMapCell'
import { useGuardedDialog } from '../../../hooks/useGuardedDialog'
import { EDITOR_RANK, RoleGate } from '../../../routes/RoleGate'
import { MANAGER_RANK } from '../../../routes/role-ranks'
import { useCustomers } from '../Customers/useCustomers'
import { InsuredAssetDetailCell } from '../InsuredAssets/InsuredAssetDetailCell'
import { InsuredAssetFormModal } from '../InsuredAssets/InsuredAssetFormModal'
import { getInsuredAssetDetailSearchText } from '../InsuredAssets/insured-asset-detail-utils'
import {
  formatInsuredSum,
  getAssetSummary,
  getAssetTypeBadgeModifier,
  isLocationType,
} from '../InsuredAssets/insured-asset-form-utils'
import { useInsuredAssets } from '../InsuredAssets/useInsuredAssets'

type DialogMode = 'create' | 'edit' | 'delete' | null

type PolicyDetailAssetsTabProps = {
  policy: InsurancePolicyResponse
  onCountChange?: (count: number) => void
}

function getAssetLabel(asset: InsuredAssetResponse): string {
  const summary = getAssetSummary(asset)
  return summary && summary !== '—' ? `${asset.type}: ${summary}` : asset.type
}

export function PolicyDetailAssetsTab({
  policy,
  onCountChange,
}: PolicyDetailAssetsTabProps) {
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
    upsertAsset,
    removeAsset,
  } = useInsuredAssets(policy.id)

  useEffect(() => {
    onCountChange?.(assets.length)
  }, [assets.length, onCountChange])

  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selectedAsset, setSelectedAsset] =
    useState<InsuredAssetResponse | null>(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletePermanent, setDeletePermanent] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const canHardDelete = (roleRank ?? 0) >= MANAGER_RANK
  const canEdit = (roleRank ?? 0) >= EDITOR_RANK
  const isLoading = isCustomersLoading || isAssetsLoading
  const loadError = customersLoadError ?? assetsLoadError

  const resetDeleteDialog = useCallback(() => {
    setDialogMode((mode) => (mode === 'delete' ? null : mode))
    setSelectedAsset(null)
    setDeletePermanent(false)
    setActionError(null)
  }, [])

  const deleteDialog = useGuardedDialog({
    isOpen: dialogMode === 'delete',
    isDirty: deletePermanent,
    onClose: resetDeleteDialog,
  })

  const customerById = useMemo(() => {
    const map = new Map<string, CustomerResponse>()
    for (const customer of customers) {
      map.set(customer.id, customer)
    }
    return map
  }, [customers])

  function getCustomerName(customerId: string): string {
    const customer = customerById.get(customerId)
    return customer ? getCustomerAlias(customer) : customerId
  }

  const assetColumns: TableLayoutColumn<InsuredAssetResponse>[] = [
    buildCatalogActionsColumn<InsuredAssetResponse>({
      canEdit,
      edit: { onClick: openEditModal },
      delete: { onClick: openDeleteDialog },
    }),
    {
      key: 'insured-sum',
      header: 'Suma asegurada',
      render: (asset) => formatInsuredSum(asset.insuredSum),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (asset) => (
        <span
          className={`catalog-badge catalog-badge--${getAssetTypeBadgeModifier(asset.type)}`}
        >
          {asset.type}
        </span>
      ),
    },
    {
      key: 'detail',
      header: 'Detalle',
      render: (asset) => (
        <InsuredAssetDetailCell
          asset={asset}
          getCustomerName={getCustomerName}
        />
      ),
      getSearchValue: (asset) =>
        getInsuredAssetDetailSearchText(asset, getCustomerName),
      getSortValue: (asset) =>
        getInsuredAssetDetailSearchText(asset, getCustomerName),
    },
    {
      key: 'view-on-map',
      header: 'Mapa',
      headerClassName: 'table-layout__actions',
      cellClassName: 'table-layout__actions',
      render: (asset) =>
        isLocationType(asset.type) ? (
          <ViewOnMapCell gpsCoordinates={asset.gpsCoordinates} />
        ) : (
          <span className="view-on-map-cell view-on-map-cell--empty">—</span>
        ),
      getSearchValue: () => '',
      getSortValue: () => '',
    },
  ]

  function openCreateModal() {
    setSelectedAsset(null)
    setDialogMode('create')
    setFormModalOpen(true)
  }

  function openEditModal(asset: InsuredAssetResponse) {
    setSelectedAsset(asset)
    setDialogMode('edit')
    setFormModalOpen(true)
  }

  function closeFormModal() {
    setFormModalOpen(false)
    setDialogMode((mode) => (mode === 'create' || mode === 'edit' ? null : mode))
    setSelectedAsset(null)
  }

  function handleFormSuccess(asset: InsuredAssetResponse) {
    upsertAsset(asset)
    closeFormModal()
    setFeedback({
      type: 'success',
      message:
        dialogMode === 'create'
          ? `Bien asegurado ${getAssetLabel(asset)} creado.`
          : `Bien asegurado ${getAssetLabel(asset)} actualizado.`,
    })
  }

  function openDeleteDialog(asset: InsuredAssetResponse) {
    setSelectedAsset(asset)
    setDeletePermanent(false)
    setActionError(null)
    setDialogMode('delete')
    deleteDialog.dialogRef.current?.showModal()
  }

  function closeDeleteDialog() {
    deleteDialog.close()
  }

  async function handleDeleteConfirm() {
    if (!selectedAsset) {
      return
    }

    setActionError(null)
    setIsSubmitting(true)

    try {
      await deleteInsuredAsset(selectedAsset.id, {
        permanent: deletePermanent && canHardDelete,
      })
      removeAsset(selectedAsset.id)
      closeDeleteDialog()
      setFeedback({
        type: 'success',
        message: deletePermanent
          ? `Bien asegurado ${getAssetLabel(selectedAsset)} eliminado permanentemente.`
          : `Bien asegurado ${getAssetLabel(selectedAsset)} eliminado.`,
      })
    } catch (caught) {
      setActionError(
        getCatalogApiErrorMessage(
          caught,
          'No se pudo eliminar el bien asegurado. Inténtalo de nuevo.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="policy-detail-tab-panel">
      <div className="catalog-page__toolbar">
        <RoleGate minRoleRank={EDITOR_RANK}>
          <button
            type="button"
            className="catalog-btn catalog-btn--add"
            onClick={openCreateModal}
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
        <p className="catalog-empty">Cargando bienes asegurados…</p>
      )}

      {!isLoading && loadError && (
        <div className="auth-alert auth-alert--error" role="alert">
          {loadError}
          <div className="catalog-page__retry">
            <button
              type="button"
              className="catalog-btn catalog-btn--secondary"
              onClick={() => {
                void reloadAssets()
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {!isLoading && !loadError && assets.length === 0 && (
        <p className="catalog-empty">
          No hay bienes asegurados para esta póliza.
        </p>
      )}

      {!isLoading && !loadError && assets.length > 0 && (
        <TableLayout
          columns={assetColumns}
          items={assets}
          getItemKey={(asset) => asset.id}
        />
      )}

      <InsuredAssetFormModal
        key={
          formModalOpen
            ? `${dialogMode}-${selectedAsset?.id ?? 'new'}`
            : 'closed'
        }
        open={formModalOpen}
        mode={dialogMode === 'edit' ? 'edit' : 'create'}
        asset={selectedAsset ?? undefined}
        policies={[policy]}
        customers={customers}
        defaultPolicyId={policy.id}
        policyLocked
        isLoadingOptions={isCustomersLoading}
        onClose={closeFormModal}
        onSuccess={handleFormSuccess}
      />

      <dialog
        ref={deleteDialog.dialogRef}
        className="catalog-modal catalog-delete-dialog"
        onClose={deleteDialog.handleDialogClose}
        onCancel={deleteDialog.handleDialogCancel}
        aria-labelledby="delete-policy-asset-title"
      >
        <div className="catalog-modal__inner">
          <h2 id="delete-policy-asset-title" className="catalog-modal__title">
            Eliminar bien asegurado
          </h2>
          <p className="catalog-delete-dialog__description">
            {selectedAsset
              ? deletePermanent
                ? `Se eliminará permanentemente ${getAssetLabel(selectedAsset)}. Esta acción no se puede deshacer.`
                : `¿Eliminar ${getAssetLabel(selectedAsset)}? Dejará de aparecer en el catálogo.`
              : 'El bien dejará de aparecer en el catálogo.'}
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
