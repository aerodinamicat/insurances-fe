import '../catalog-shared.css'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDisplayDate, formatRemainingValidity, getRemainingValiditySortKey } from '../../../utils/date'
import {
  deleteInsurancePolicy,
  getCatalogApiErrorMessage,
  getCustomerAlias,
} from '../../../api/catalog'
import type {
  AssuranceCompanyResponse,
  CustomerResponse,
  InsurancePolicyResponse,
} from '../../../api/catalog'
import { useAuth } from '../../../auth'
import {
  TableLayout,
  type TableLayoutColumn,
} from '../../../components/TableLayout'
import { buildCatalogActionsColumn } from '../../../components/CatalogRowActions'
import { useGuardedDialog } from '../../../hooks/useGuardedDialog'
import { EDITOR_RANK, RoleGate } from '../../../routes/RoleGate'
import { MANAGER_RANK } from '../../../routes/role-ranks'
import { useAssuranceCompanies } from '../AssuranceCompanies/useAssuranceCompanies'
import { useCustomers } from '../Customers/useCustomers'
import { InsurancePolicyFormModal } from './InsurancePolicyFormModal'
import {
  getPolicyRenewalTargetDate,
  getPolicyStatusBadgeModifier,
} from './policy-form-utils'
import { useInsurancePolicies } from './useInsurancePolicies'
import './InsurancePoliciesPage.css'

type DialogMode = 'create' | 'edit' | 'delete' | null

export function InsurancePoliciesPage() {
  const navigate = useNavigate()
  const { roleRank } = useAuth()

  const {
    customers,
    isLoading: isCustomersLoading,
    loadError: customersLoadError,
  } = useCustomers()

  const {
    policies,
    isLoading: isPoliciesLoading,
    loadError: policiesLoadError,
    reload,
    upsertPolicy,
    removePolicy,
  } = useInsurancePolicies()

  const {
    assuranceCompanies,
    isLoading: isCompaniesLoading,
    loadError: companiesLoadError,
    reload: reloadCompanies,
  } = useAssuranceCompanies()

  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selectedPolicy, setSelectedPolicy] =
    useState<InsurancePolicyResponse | null>(null)
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
    isCustomersLoading || isPoliciesLoading || isCompaniesLoading
  const loadError =
    customersLoadError ?? policiesLoadError ?? companiesLoadError

  const resetDeleteDialog = useCallback(() => {
    setDialogMode((mode) => (mode === 'delete' ? null : mode))
    setSelectedPolicy(null)
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

  const customerById = useMemo(() => {
    const map = new Map<string, CustomerResponse>()
    for (const customer of customers) {
      map.set(customer.id, customer)
    }
    return map
  }, [customers])

  const companyById = useMemo(() => {
    const map = new Map<string, AssuranceCompanyResponse>()
    for (const company of assuranceCompanies) {
      map.set(company.id, company)
    }
    return map
  }, [assuranceCompanies])

  function getCustomerName(customerId: string): string {
    const customer = customerById.get(customerId)
    return customer ? getCustomerAlias(customer) : customerId
  }

  function getCompanyName(assuranceCompanyId: string): string {
    const company = companyById.get(assuranceCompanyId)
    return company?.alias ?? assuranceCompanyId
  }

  function openCreateModal() {
    setSelectedPolicy(null)
    setDialogMode('create')
    setFormModalOpen(true)
  }

  function openEditModal(policy: InsurancePolicyResponse) {
    setSelectedPolicy(policy)
    setDialogMode('edit')
    setFormModalOpen(true)
  }

  function closeFormModal() {
    setFormModalOpen(false)
    setDialogMode((mode) => (mode === 'create' || mode === 'edit' ? null : mode))
    setSelectedPolicy(null)
  }

  function handleFormSuccess(policy: InsurancePolicyResponse) {
    upsertPolicy(policy)
    const wasCreate = dialogMode === 'create'
    closeFormModal()
    setFeedback({
      type: 'success',
      message: wasCreate
        ? `Póliza ${policy.identifierId} creada.`
        : `Póliza ${policy.identifierId} actualizada.`,
    })
  }

  function openDeleteDialog(policy: InsurancePolicyResponse) {
    setSelectedPolicy(policy)
    setDeletePermanent(false)
    setActionError(null)
    setDialogMode('delete')
    deleteDialog.dialogRef.current?.showModal()
  }

  function closeDeleteDialog() {
    deleteDialog.close()
  }

  async function handleDeleteConfirm() {
    if (!selectedPolicy) {
      return
    }

    setActionError(null)
    setIsSubmitting(true)

    try {
      await deleteInsurancePolicy(selectedPolicy.id, {
        permanent: deletePermanent && canHardDelete,
      })
      removePolicy(selectedPolicy.id)
      closeDeleteDialog()
      setFeedback({
        type: 'success',
        message: deletePermanent
          ? `Póliza ${selectedPolicy.identifierId} eliminada permanentemente.`
          : `Póliza ${selectedPolicy.identifierId} eliminada.`,
      })
    } catch (caught) {
      setActionError(
        getCatalogApiErrorMessage(
          caught,
          'No se pudo eliminar la póliza. Inténtalo de nuevo.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRetry() {
    await Promise.all([reload(), reloadCompanies()])
  }

  const policyColumns: TableLayoutColumn<InsurancePolicyResponse>[] = [
    buildCatalogActionsColumn<InsurancePolicyResponse>({
      canEdit,
      canDelete: canHardDelete,
      view: {
        onClick: (policy) =>
          navigate(`/catalog/insurance-policies/${policy.id}`),
      },
      edit: { onClick: openEditModal },
      delete: { onClick: openDeleteDialog },
    }),
    {
      key: 'customer',
      header: 'Cliente',
      render: (policy) => getCustomerName(policy.customerId),
    },
    {
      key: 'identifier',
      header: 'Identificador',
      render: (policy) => (
        <span className="catalog-table__muted">{policy.identifierId}</span>
      ),
      getSortValue: (policy) => policy.identifierId,
    },
    {
      key: 'branch',
      header: 'Ramo',
      render: (policy) => (
        <span className="catalog-badge catalog-badge--branch">
          {policy.branch}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (policy) => (
        <span
          className={`catalog-badge catalog-badge--status catalog-badge--${getPolicyStatusBadgeModifier(policy.status)}`}
        >
          {policy.status}
        </span>
      ),
    },
    {
      key: 'effective-at',
      header: 'Fecha efecto',
      render: (policy) => formatDisplayDate(policy.effectiveAt),
    },
    {
      key: 'next-renewal-at',
      header: 'Próxima renovación',
      render: (policy) =>
        formatDisplayDate(getPolicyRenewalTargetDate(policy)),
    },
    {
      key: 'remaining-validity',
      header: 'Vigencia restante',
      headerClassName: 'table-layout__actions',
      render: (policy) =>
        formatRemainingValidity(getPolicyRenewalTargetDate(policy), {
          pastLabel: 'Vencida',
        }),
      getSearchValue: (policy) =>
        formatRemainingValidity(getPolicyRenewalTargetDate(policy), {
          pastLabel: 'Vencida',
        }),
      getSortValue: (policy) =>
        String(getRemainingValiditySortKey(getPolicyRenewalTargetDate(policy))),
    },
    {
      key: 'assurance-company',
      header: 'Aseguradora',
      cellClassName: 'insurance-policies-table__company',
      render: (policy) => {
        const companyName = getCompanyName(policy.assuranceCompanyId)
        return <span title={companyName}>{companyName}</span>
      },
      getSortValue: (policy) => getCompanyName(policy.assuranceCompanyId),
    },
  ]

  return (
    <div className="page-content catalog-page">
      <div className="catalog-page__header">
        <div className="catalog-page__intro">
          <h1 className="page-content__title">Pólizas</h1>
          <p className="page-content__subtitle">
            Catálogo de pólizas de seguro.
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
        <p className="catalog-empty">Cargando pólizas…</p>
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

      {!isLoading && !loadError && policies.length === 0 && (
        <p className="catalog-empty">No hay pólizas registradas.</p>
      )}

      {!isLoading && !loadError && policies.length > 0 && (
        <TableLayout
          columns={policyColumns}
          items={policies}
          getItemKey={(policy) => policy.id}
          className="insurance-policies-table"
        />
      )}

      <InsurancePolicyFormModal
        key={
          formModalOpen
            ? `${dialogMode}-${selectedPolicy?.id ?? 'new'}`
            : 'closed'
        }
        open={formModalOpen}
        mode={dialogMode === 'edit' ? 'edit' : 'create'}
        policy={selectedPolicy ?? undefined}
        customers={customers}
        assuranceCompanies={assuranceCompanies}
        isLoadingOptions={isCustomersLoading || isCompaniesLoading}
        onClose={closeFormModal}
        onSuccess={handleFormSuccess}
      />

      <dialog
        ref={deleteDialogRef}
        className="catalog-modal catalog-delete-dialog"
        onClose={handleDeleteDialogClose}
        onCancel={handleDeleteDialogCancel}
        aria-labelledby="delete-insurance-policy-title"
      >
        <div className="catalog-modal__inner">
          <h2
            id="delete-insurance-policy-title"
            className="catalog-modal__title"
          >
            Eliminar póliza
          </h2>
          <p className="catalog-delete-dialog__description">
            {selectedPolicy
              ? deletePermanent
                ? `Se eliminará permanentemente la póliza ${selectedPolicy.identifierId}. Esta acción no se puede deshacer.`
                : `¿Eliminar la póliza ${selectedPolicy.identifierId}? Dejará de aparecer en el catálogo.`
              : 'La póliza dejará de aparecer en el catálogo.'}
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
