import { useCallback, useEffect, useState } from 'react'
import '../catalog-shared.css'
import { ApiError } from '../../../api/client'
import {
  deleteAssuranceCompany,
  fetchAssuranceCompanies,
} from '../../../api/catalog/assurance-companies.api'
import { fetchInsurancePolicies } from '../../../api/catalog'
import type { AssuranceCompanyResponse } from '../../../api/catalog/types'
import { useAuth } from '../../../auth'
import {
  TableLayout,
  type TableLayoutColumn,
} from '../../../components/TableLayout'
import { buildCatalogActionsColumn } from '../../../components/CatalogRowActions'
import { useGuardedDialog } from '../../../hooks/useGuardedDialog'
import { EDITOR_RANK, RoleGate } from '../../../routes/RoleGate'
import { MANAGER_RANK } from '../../../routes/role-ranks'
import {
  AssuranceCompanyFormModal,
} from './AssuranceCompanyFormModal'
import { sortAssuranceCompaniesByBusinessName } from '../shared'
import { countPoliciesByAssuranceCompany } from './assurance-company-policy-counts'

type FormDialogMode = 'create' | 'edit' | null

export function AssuranceCompaniesPage() {
  const { roleRank } = useAuth()

  const [companies, setCompanies] = useState<AssuranceCompanyResponse[]>([])
  const [policyCounts, setPolicyCounts] = useState<Map<string, number>>(
    () => new Map(),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const [formDialogMode, setFormDialogMode] = useState<FormDialogMode>(null)
  const [selectedCompany, setSelectedCompany] =
    useState<AssuranceCompanyResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [deletePermanent, setDeletePermanent] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const canHardDelete = (roleRank ?? 0) >= MANAGER_RANK
  const canEdit = (roleRank ?? 0) >= EDITOR_RANK

  const resetDeleteDialog = useCallback(() => {
    setSelectedCompany(null)
    setDeletePermanent(false)
    setDeleteError(null)
  }, [])

  const deleteDialog = useGuardedDialog({
    isOpen: selectedCompany !== null && formDialogMode === null,
    isDirty: deletePermanent,
    onClose: resetDeleteDialog,
  })

  const loadData = useCallback(async () => {
    setLoadError(null)

    try {
      const [companiesResponse, policiesResponse] = await Promise.all([
        fetchAssuranceCompanies(),
        fetchInsurancePolicies(),
      ])
      setCompanies(sortAssuranceCompaniesByBusinessName(companiesResponse))
      setPolicyCounts(countPoliciesByAssuranceCompany(policiesResponse))
    } catch (caught) {
      setLoadError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudieron cargar las aseguradoras. Inténtalo de nuevo.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const [companiesResponse, policiesResponse] = await Promise.all([
          fetchAssuranceCompanies(),
          fetchInsurancePolicies(),
        ])
        if (cancelled) {
          return
        }
        setCompanies(sortAssuranceCompaniesByBusinessName(companiesResponse))
        setPolicyCounts(countPoliciesByAssuranceCompany(policiesResponse))
      } catch (caught) {
        if (cancelled) {
          return
        }
        setLoadError(
          caught instanceof ApiError
            ? caught.message
            : 'No se pudieron cargar las aseguradoras. Inténtalo de nuevo.',
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  function openCreateDialog() {
    setSelectedCompany(null)
    setFormDialogMode('create')
  }

  function openEditDialog(company: AssuranceCompanyResponse) {
    setSelectedCompany(company)
    setFormDialogMode('edit')
  }

  function closeFormDialog() {
    setFormDialogMode(null)
    setSelectedCompany(null)
  }

  function openDeleteDialog(company: AssuranceCompanyResponse) {
    setSelectedCompany(company)
    setDeletePermanent(false)
    setDeleteError(null)
    deleteDialog.dialogRef.current?.showModal()
  }

  function closeDeleteDialog() {
    deleteDialog.close()
  }

  function handleFormSuccess(company: AssuranceCompanyResponse) {
    if (formDialogMode === 'create') {
      setCompanies((current) => sortAssuranceCompaniesByBusinessName([...current, company]))
      setFeedback({
        type: 'success',
        message: `Aseguradora ${company.businessName} creada.`,
      })
    } else {
      setCompanies((current) =>
        sortAssuranceCompaniesByBusinessName(
          current.map((item) => (item.id === company.id ? company : item)),
        ),
      )
      setFeedback({
        type: 'success',
        message: `Aseguradora ${company.businessName} actualizada.`,
      })
    }

    closeFormDialog()
  }

  async function handleDeleteConfirm() {
    if (!selectedCompany) {
      return
    }

    setDeleteError(null)
    setIsSubmitting(true)

    try {
      await deleteAssuranceCompany(selectedCompany.id, {
        permanent: deletePermanent && canHardDelete,
      })
      setCompanies((current) =>
        current.filter((company) => company.id !== selectedCompany.id),
      )
      setFeedback({
        type: 'success',
        message: deletePermanent
          ? `Aseguradora ${selectedCompany.businessName} eliminada permanentemente.`
          : `Aseguradora ${selectedCompany.businessName} eliminada.`,
      })
      closeDeleteDialog()
    } catch (caught) {
      setDeleteError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo eliminar la aseguradora. Inténtalo de nuevo.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const companyColumns: TableLayoutColumn<AssuranceCompanyResponse>[] = [
    buildCatalogActionsColumn<AssuranceCompanyResponse>({
      canEdit,
      edit: { onClick: openEditDialog },
      delete: { onClick: openDeleteDialog },
    }),
    {
      key: 'alias',
      header: 'Alias',
      render: (company) => (
        <div className="catalog-table__name">
          {company.alias}
        </div>
      ),
      getSortValue: (company) => company.alias,
    },
    {
      key: 'business-name',
      header: 'Razón social',
      render: (company) => (
        <div className="catalog-table__name">
          {company.businessName}
        </div>
      ),
      getSortValue: (company) => company.businessName,
    },
    {
      key: 'trade-name',
      header: 'Nombre comercial',
      render: (company) => (
        <span className="catalog-table__muted">
          {company.tradeName ?? '—'}
        </span>
      ),
      getSortValue: (company) => company.tradeName ?? '',
    },
    {
      key: 'policy-count',
      header: 'Total pólizas',
      render: (company) => policyCounts.get(company.id) ?? 0,
      getSearchValue: (company) =>
        String(policyCounts.get(company.id) ?? 0),
      getSortValue: (company) =>
        String(policyCounts.get(company.id) ?? 0),
    },
  ]

  return (
    <div className="page-content catalog-page">
      <div className="catalog-page__header">
        <div className="catalog-page__intro">
          <h1 className="page-content__title">Aseguradoras</h1>
          <p className="page-content__subtitle">
            Catálogo de compañías aseguradoras del mercado.
          </p>
        </div>
        <RoleGate minRoleRank={EDITOR_RANK}>
          <button
            type="button"
            className="catalog-btn catalog-btn--add"
            onClick={openCreateDialog}
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
        <p className="catalog-loading">Cargando aseguradoras…</p>
      )}

      {!isLoading && loadError && (
        <div className="auth-alert auth-alert--error" role="alert">
          {loadError}
          <div style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="catalog-btn catalog-btn--secondary"
              onClick={() => {
                setIsLoading(true)
                void loadData()
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {!isLoading && !loadError && companies.length === 0 && (
        <p className="catalog-empty">No hay aseguradoras registradas.</p>
      )}

      {!isLoading && !loadError && companies.length > 0 && (
        <TableLayout
          columns={companyColumns}
          items={companies}
          getItemKey={(company) => company.id}
        />
      )}

      <AssuranceCompanyFormModal
        key={
          formDialogMode
            ? `${formDialogMode}-${selectedCompany?.id ?? 'new'}`
            : 'closed'
        }
        mode={formDialogMode === 'edit' ? 'edit' : 'create'}
        open={formDialogMode !== null}
        initialCompany={selectedCompany}
        onClose={closeFormDialog}
        onSuccess={handleFormSuccess}
      />

      <dialog
        ref={deleteDialog.dialogRef}
        className="catalog-modal catalog-delete-dialog"
        onClose={deleteDialog.handleDialogClose}
        onCancel={deleteDialog.handleDialogCancel}
        aria-labelledby="delete-assurance-company-title"
      >
        <div className="catalog-modal__inner">
          <h2
            id="delete-assurance-company-title"
            className="catalog-modal__title"
          >
            Eliminar aseguradora
          </h2>
          <p className="catalog-delete-dialog__description">
            {selectedCompany
              ? deletePermanent
                ? `Se eliminará permanentemente ${selectedCompany.businessName}. Esta acción no se puede deshacer.`
                : `Se eliminará ${selectedCompany.businessName} del catálogo (borrado lógico).`
              : 'Esta acción no se puede deshacer.'}
          </p>

          {deleteError && (
            <div className="auth-alert auth-alert--error" role="alert">
              {deleteError}
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
                ? 'Procesando…'
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
