import '../catalog-shared.css'
import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import {
  deleteCustomer,
  getCatalogApiErrorMessage,
  getCustomerAlias,
} from '../../../api/catalog'
import type { CustomerResponse } from '../../../api/catalog'
import { useAuth } from '../../../auth'
import {
  TableLayout,
  type TableLayoutColumn,
} from '../../../components/TableLayout'
import { buildCatalogActionsColumn } from '../../../components/CatalogRowActions'
import { formatDisplayDate } from '../../../utils/date'
import { RoleGate, EDITOR_RANK } from '../../../routes/RoleGate'
import { useCatalogCrudPage } from '../shared'
import { CustomerFormModal } from './CustomerFormModal'
import { useInsurancePolicies } from '../InsurancePolicies/useInsurancePolicies'
import { countPoliciesByCustomer } from './customer-policy-counts'
import { useCustomers } from './useCustomers'
import './CustomersPage.css'

export function CustomersPage() {
  const navigate = useNavigate()
  const { roleRank } = useAuth()

  const {
    customers,
    isLoading: isCustomersLoading,
    loadError: customersLoadError,
    reload: reloadCustomers,
    upsertCustomer,
    removeCustomer,
  } = useCustomers()

  const {
    policies,
    isLoading: isPoliciesLoading,
    loadError: policiesLoadError,
    reload: reloadPolicies,
  } = useInsurancePolicies()

  const policyCounts = useMemo(
    () => countPoliciesByCustomer(policies),
    [policies],
  )
  const isLoading = isCustomersLoading || isPoliciesLoading
  const loadError = customersLoadError ?? policiesLoadError

  const {
    dialogMode,
    formModalOpen,
    selectedItem: selectedCustomer,
    deletePermanent,
    setDeletePermanent,
    canHardDelete,
    feedback,
    setFeedback,
    actionError,
    isSubmitting,
    deleteDialog,
    openCreate: openCreateModal,
    openEdit: openEditModal,
    openDelete: openDeleteDialog,
    closeForm: closeFormModal,
    handleDeleteConfirm,
  } = useCatalogCrudPage<CustomerResponse>({ roleRank })
  const {
    dialogRef: deleteDialogRef,
    handleDialogClose: handleDeleteDialogClose,
    handleDialogCancel: handleDeleteDialogCancel,
    confirmDialog: deleteConfirmDialog,
  } = deleteDialog

  const canEdit = (roleRank ?? 0) >= EDITOR_RANK

  function handleFormSuccess(customer: CustomerResponse) {
    upsertCustomer(customer)
    const wasCreate = dialogMode === 'create'
    closeFormModal()
    setFeedback({
      type: 'success',
      message: wasCreate
        ? `Cliente ${getCustomerAlias(customer)} creado.`
        : `Cliente ${getCustomerAlias(customer)} actualizado.`,
    })
  }

  const customerColumns: TableLayoutColumn<CustomerResponse>[] = [
    buildCatalogActionsColumn<CustomerResponse>({
      canEdit,
      canDelete: canHardDelete,
      view: {
        onClick: (customer) => navigate(`/catalog/customers/${customer.id}`),
      },
      edit: { onClick: openEditModal },
      delete: { onClick: openDeleteDialog },
    }),
    {
      key: 'alias',
      header: 'Alias',
      render: (customer) => (
        <div className="catalog-table__name">{customer.alias}</div>
      ),
      getSortValue: (customer) => customer.alias,
    },
    {
      key: 'tax-id',
      header: 'Identificador fiscal',
      render: (customer) => (
        <span className="catalog-table__muted">{customer.taxId}</span>
      ),
      getSortValue: (customer) => customer.taxId,
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (customer) => (
        <span
          className={`catalog-badge catalog-badge--${customer.type === 'Particular' ? 'particular' : 'empresa'}`}
        >
          {customer.type}
        </span>
      ),
      getSortValue: (customer) => customer.type,
    },
    {
      key: 'birth-at',
      header: 'Fecha nacimiento',
      render: (customer) => formatDisplayDate(customer.birthAt),
      getSortValue: (customer) => customer.birthAt ?? '',
    },
    {
      key: 'age',
      header: 'Edad',
      render: (customer) => customer.age ?? '—',
      getSortValue: (customer) => String(customer.age ?? ''),
    },
    {
      key: 'biological-gender',
      header: 'Sexo',
      render: (customer) => customer.biologicalGender ?? '—',
      getSortValue: (customer) => customer.biologicalGender ?? '',
    },
    {
      key: 'marital-status',
      header: 'Estado civil',
      render: (customer) => customer.maritalStatus ?? '—',
      getSortValue: (customer) => customer.maritalStatus ?? '',
    },
    {
      key: 'policy-count',
      header: 'Total pólizas',
      render: (customer) => policyCounts.get(customer.id) ?? 0,
      getSearchValue: (customer) =>
        String(policyCounts.get(customer.id) ?? 0),
      getSortValue: (customer) =>
        String(policyCounts.get(customer.id) ?? 0),
    },
  ]

  return (
    <div className="page-content catalog-page catalog-page--modal-narrow">
      <div className="catalog-page__header">
        <div className="catalog-page__intro">
          <h1 className="page-content__title">Clientes</h1>
          <p className="page-content__subtitle">
            Catálogo de clientes particulares y empresas.
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
        <p className="catalog-empty">Cargando clientes…</p>
      )}

      {!isLoading && loadError && (
        <div className="auth-alert auth-alert--error" role="alert">
          {loadError}
          <div className="catalog-page__retry">
            <button
              type="button"
              className="catalog-btn catalog-btn--secondary"
              onClick={() => {
                void Promise.all([reloadCustomers(), reloadPolicies()])
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {!isLoading && !loadError && customers.length === 0 && (
        <p className="catalog-empty">No hay clientes registrados.</p>
      )}

      {!isLoading && !loadError && customers.length > 0 && (
        <TableLayout
          columns={customerColumns}
          items={customers}
          getItemKey={(customer) => customer.id}
        />
      )}

      <CustomerFormModal
        key={
          formModalOpen
            ? `${dialogMode}-${selectedCustomer?.id ?? 'new'}`
            : 'closed'
        }
        open={formModalOpen}
        mode={dialogMode === 'edit' ? 'edit' : 'create'}
        customer={selectedCustomer ?? undefined}
        onClose={closeFormModal}
        onSuccess={handleFormSuccess}
      />

      <dialog
        ref={deleteDialogRef}
        className="catalog-modal catalog-delete-dialog"
        onClose={handleDeleteDialogClose}
        onCancel={handleDeleteDialogCancel}
        aria-labelledby="delete-customer-title"
      >
        <div className="catalog-modal__inner">
          <h2 id="delete-customer-title" className="catalog-modal__title">
            Eliminar cliente
          </h2>
          <p className="catalog-delete-dialog__description">
            {selectedCustomer
              ? deletePermanent
                ? `Se eliminará permanentemente a ${getCustomerAlias(selectedCustomer)}. Esta acción no se puede deshacer.`
                : `¿Eliminar a ${getCustomerAlias(selectedCustomer)}? El cliente dejará de aparecer en el catálogo.`
              : 'El cliente dejará de aparecer en el catálogo.'}
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
              onClick={() =>
                void handleDeleteConfirm(
                  (customer, permanent) =>
                    deleteCustomer(customer.id, { permanent }),
                  {
                    onDeleted: (customer) => removeCustomer(customer.id),
                    getSuccessMessage: (customer, wasPermanent) =>
                      wasPermanent
                        ? `Cliente ${getCustomerAlias(customer)} eliminado permanentemente.`
                        : `Cliente ${getCustomerAlias(customer)} eliminado.`,
                    getErrorMessage: (caught) =>
                      getCatalogApiErrorMessage(
                        caught,
                        'No se pudo eliminar el cliente. Inténtalo de nuevo.',
                      ),
                  },
                )
              }
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
