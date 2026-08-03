import '../catalog-shared.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteInsuredAsset,
  fetchAssuranceCompanies,
  getCatalogApiErrorMessage,
  getCustomerAlias,
} from '../../../api/catalog'
import type {
  AssuranceCompanyResponse,
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
import { useInsurancePolicies } from '../InsurancePolicies/useInsurancePolicies'
import { InsuredAssetDetailCell } from './InsuredAssetDetailCell'
import { InsuredAssetFormModal } from './InsuredAssetFormModal'
import { getInsuredAssetDetailSearchText } from './insured-asset-detail-utils'
import {
  formatInsuredSum,
  getAssetSummary,
  getAssetTypeBadgeModifier,
  isLocationType,
} from './insured-asset-form-utils'
import { useInsuredAssets } from './useInsuredAssets'
import './InsuredAssetsPage.css'

type DialogMode = 'create' | 'edit' | 'delete' | null

function getAssetLabel(asset: InsuredAssetResponse): string {
  const summary = getAssetSummary(asset)
  return summary && summary !== '—' ? `${asset.type}: ${summary}` : asset.type
}

export function InsuredAssetsPage() {
  const { roleRank } = useAuth()

  const {
    policies,
    isLoading: isPoliciesLoading,
    loadError: policiesLoadError,
    reload: reloadPolicies,
  } = useInsurancePolicies()

  const {
    customers,
    isLoading: isCustomersLoading,
    loadError: customersLoadError,
  } = useCustomers()

  const [assuranceCompanies, setAssuranceCompanies] = useState<
    AssuranceCompanyResponse[]
  >([])
  const [isCompaniesLoading, setIsCompaniesLoading] = useState(true)
  const [companiesLoadError, setCompaniesLoadError] = useState<string | null>(
    null,
  )

  const [policyFilterId] = useState<string | null>(null)
  const {
    assets,
    isLoading: isAssetsLoading,
    loadError: assetsLoadError,
    reload: reloadAssets,
    upsertAsset,
    removeAsset,
  } = useInsuredAssets(policyFilterId)

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
  const isLoading =
    isPoliciesLoading ||
    isCustomersLoading ||
    isAssetsLoading ||
    isCompaniesLoading
  const loadError =
    policiesLoadError ??
    customersLoadError ??
    assetsLoadError ??
    companiesLoadError

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
  const {
    dialogRef: deleteDialogRef,
    handleDialogClose: handleDeleteDialogClose,
    handleDialogCancel: handleDeleteDialogCancel,
    confirmDialog: deleteConfirmDialog,
  } = deleteDialog

  const loadCompanies = useCallback(async () => {
    setCompaniesLoadError(null)

    try {
      setAssuranceCompanies(await fetchAssuranceCompanies())
    } catch (caught) {
      setCompaniesLoadError(
        getCatalogApiErrorMessage(
          caught,
          'No se pudieron cargar las aseguradoras. Inténtalo de nuevo.',
        ),
      )
    } finally {
      setIsCompaniesLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const response = await fetchAssuranceCompanies()
        if (cancelled) {
          return
        }
        setAssuranceCompanies(response)
      } catch (caught) {
        if (cancelled) {
          return
        }
        setCompaniesLoadError(
          getCatalogApiErrorMessage(
            caught,
            'No se pudieron cargar las aseguradoras. Inténtalo de nuevo.',
          ),
        )
      } finally {
        if (!cancelled) {
          setIsCompaniesLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const policyById = useMemo(() => {
    const map = new Map<string, InsurancePolicyResponse>()
    for (const policy of policies) {
      map.set(policy.id, policy)
    }
    return map
  }, [policies])

  const customerById = useMemo(() => {
    const map = new Map<string, CustomerResponse>()
    for (const customer of customers) {
      map.set(customer.id, customer)
    }
    return map
  }, [customers])

  function getPolicyIdentifier(policyId: string): string {
    const policy = policyById.get(policyId)
    return policy?.identifierId ?? policyId
  }

  function getCustomerName(customerId: string): string {
    const customer = customerById.get(customerId)
    return customer ? getCustomerAlias(customer) : customerId
  }

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

  async function handleRetry() {
    setIsCompaniesLoading(true)
    await Promise.all([reloadPolicies(), reloadAssets(), loadCompanies()])
  }

  const assetColumns: TableLayoutColumn<InsuredAssetResponse>[] = [
    buildCatalogActionsColumn<InsuredAssetResponse>({
      columnClassName: 'insured-assets-table__actions-col',
      canEdit,
      canDelete: canHardDelete,
      edit: { onClick: openEditModal },
      delete: { onClick: openDeleteDialog },
    }),
    {
      key: 'policy',
      header: 'Póliza',
      headerClassName: 'insured-assets-table__policy-col',
      cellClassName: 'insured-assets-table__policy-col',
      render: (asset) => (
        getPolicyIdentifier(asset.insurancePolicyId)
      ),
    },
    {
      key: 'insured-sum',
      header: 'Suma asegurada',
      headerClassName: 'insured-assets-table__insured-sum-col',
      cellClassName: 'insured-assets-table__insured-sum-col',
      render: (asset) => formatInsuredSum(asset.insuredSum),
    },
    {
      key: 'type',
      header: 'Tipo',
      headerClassName: 'insured-assets-table__type-col',
      cellClassName: 'insured-assets-table__type-col',
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
      headerClassName: 'insured-assets-table__detail-col',
      cellClassName: 'insured-assets-table__detail-col',
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
      headerClassName: 'table-layout__actions insured-assets-table__map-col',
      cellClassName: 'table-layout__actions insured-assets-table__map-col',
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

  return (
    <div className="page-content catalog-page">
      <div className="catalog-page__header">
        <div className="catalog-page__intro">
          <h1 className="page-content__title">Bienes asegurados</h1>
          <p className="page-content__subtitle">
            Bienes y riesgos cubiertos por póliza.
          </p>
        </div>

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
                void handleRetry()
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {!isLoading && !loadError && assets.length === 0 && (
        <p className="catalog-empty">
          {policyFilterId
            ? 'No hay bienes asegurados para esta póliza.'
            : 'No hay bienes asegurados registrados.'}
        </p>
      )}

      {!isLoading && !loadError && assets.length > 0 && (
        <TableLayout
          className="insured-assets-table"
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
        policies={policies}
        customers={customers}
        assuranceCompanies={assuranceCompanies}
        defaultPolicyId={policyFilterId}
        isLoadingOptions={
          isPoliciesLoading || isCustomersLoading || isCompaniesLoading
        }
        onClose={closeFormModal}
        onSuccess={handleFormSuccess}
      />

      <dialog
        ref={deleteDialogRef}
        className="catalog-modal catalog-delete-dialog"
        onClose={handleDeleteDialogClose}
        onCancel={handleDeleteDialogCancel}
        aria-labelledby="delete-insured-asset-title"
      >
        <div className="catalog-modal__inner">
          <h2 id="delete-insured-asset-title" className="catalog-modal__title">
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
      {deleteConfirmDialog}
    </div>
  )
}
