import '../catalog-shared.css'
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../api/client'
import {
  fetchAttachments,
  fetchInsuredAssets,
  fetchInsurancePolicy,
  getCustomerAlias,
} from '../../../api/catalog'
import type {
  AssuranceCompanyResponse,
  CustomerResponse,
  InsurancePolicyResponse,
} from '../../../api/catalog'
import { useAssuranceCompanies } from '../AssuranceCompanies/useAssuranceCompanies'
import { useCustomers } from '../Customers/useCustomers'
import { formatDisplayDate } from '../../../utils/date'
import { PolicyDetailAssetsTab } from './PolicyDetailAssetsTab'
import { PolicyDetailDocumentsTab } from './PolicyDetailDocumentsTab'
import { getPolicyStatusBadgeModifier } from './policy-form-utils'
import '../InsuredAssets/InsuredAssetsPage.css'
import '../Attachments/AttachmentsPage.css'
import './InsurancePolicyDetailPage.css'
import './InsurancePoliciesPage.css'

const POLICIES_LIST_PATH = '/catalog/insurance-policies'

type DetailTab = 'resumen' | 'bienes' | 'documentos'

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'bienes', label: 'Bienes' },
  { id: 'documentos', label: 'Documentos' },
]

export function InsurancePolicyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const tabsId = useId()

  const {
    customers,
    isLoading: isCustomersLoading,
    loadError: customersLoadError,
  } = useCustomers()

  const [policy, setPolicy] = useState<InsurancePolicyResponse | null>(null)
  const [isPolicyLoading, setIsPolicyLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const {
    assuranceCompanies,
    isLoading: isCompaniesLoading,
  } = useAssuranceCompanies()
  const [activeTab, setActiveTab] = useState<DetailTab>('resumen')
  const [assetCount, setAssetCount] = useState(0)
  const [documentCount, setDocumentCount] = useState(0)

  const loadPolicy = useCallback(async (policyId: string) => {
    setIsPolicyLoading(true)
    setLoadError(null)

    try {
      const response = await fetchInsurancePolicy(policyId)
      setPolicy(response)
    } catch (caught) {
      setPolicy(null)
      setLoadError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo cargar la póliza. Inténtalo de nuevo.',
      )
    } finally {
      setIsPolicyLoading(false)
    }
  }, [])

  const invalidIdError = id ? null : 'Identificador de póliza no válido.'

  useEffect(() => {
    if (!id) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const response = await fetchInsurancePolicy(id)
        if (cancelled) {
          return
        }
        setPolicy(response)
      } catch (caught) {
        if (cancelled) {
          return
        }
        setPolicy(null)
        setLoadError(
          caught instanceof ApiError
            ? caught.message
            : 'No se pudo cargar la póliza. Inténtalo de nuevo.',
        )
      } finally {
        if (!cancelled) {
          setIsPolicyLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!id) {
      return
    }

    let cancelled = false

    void Promise.all([
      fetchInsuredAssets({ insurancePolicyId: id }),
      fetchAttachments({ insurancePolicyId: id }),
    ]).then(([assets, attachments]) => {
      if (!cancelled) {
        setAssetCount(assets.length)
        setDocumentCount(attachments.length)
      }
    }).catch(() => {
      if (!cancelled) {
        setAssetCount(0)
        setDocumentCount(0)
      }
    })

    return () => {
      cancelled = true
    }
  }, [id])

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

  const isLoading =
    Boolean(id) &&
    (isPolicyLoading || isCustomersLoading || isCompaniesLoading)
  const pageLoadError = invalidIdError ?? loadError ?? customersLoadError

  function getCustomerName(customerId: string): string {
    const customer = customerById.get(customerId)
    return customer ? getCustomerAlias(customer) : customerId
  }

  function getCompanyName(assuranceCompanyId: string): string {
    const company = companyById.get(assuranceCompanyId)
    return company?.businessName ?? assuranceCompanyId
  }

  function handlePolicyUpdate(updated: InsurancePolicyResponse) {
    setPolicy(updated)
  }

  async function handleRetry() {
    if (id) {
      await loadPolicy(id)
    }
  }

  const activeTabPanelId = `${tabsId}-${activeTab}-panel`
  const activeTabId = `${tabsId}-${activeTab}-tab`

  return (
    <div className="page-content insurance-policy-detail">
      <nav className="insurance-policy-detail__breadcrumb" aria-label="Volver">
        <Link
          to={POLICIES_LIST_PATH}
          className="insurance-policy-detail__back-link"
        >
          ← Pólizas
        </Link>
      </nav>

      <header className="insurance-policy-detail__header">
        {policy ? (
          <>
            <div className="insurance-policy-detail__title-row">
              <h1 className="page-content__title">
                {policy.identifierId}
              </h1>
              <div className="insurance-policy-detail__badges">
                <span className="catalog-badge catalog-badge--branch">
                  {policy.branch}
                </span>
                <span
                  className={`catalog-badge catalog-badge--status catalog-badge--${getPolicyStatusBadgeModifier(policy.status)}`}
                >
                  {policy.status}
                </span>
              </div>
            </div>
            <p className="page-content__subtitle">
              Ficha de póliza con bienes y documentos asociados.
            </p>
          </>
        ) : (
          <>
            <h1 className="page-content__title">Ficha de póliza</h1>
            <p className="page-content__subtitle">
              Detalle de póliza, bienes asegurados y documentación.
            </p>
          </>
        )}
      </header>

      {isLoading && (
        <p className="catalog-empty">Cargando ficha de póliza…</p>
      )}

      {!isLoading && pageLoadError && (
        <div className="auth-alert auth-alert--error" role="alert">
          {pageLoadError}
          {id && (
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
          )}
        </div>
      )}

      {!isLoading && !pageLoadError && policy && (
        <>
          <div
            className="policy-detail-tabs"
            role="tablist"
            aria-label="Secciones de la póliza"
          >
            {TABS.map((tab) => {
              const isSelected = activeTab === tab.id
              const tabId = `${tabsId}-${tab.id}-tab`
              const panelId = `${tabsId}-${tab.id}-panel`

              return (
                <button
                  key={tab.id}
                  type="button"
                  id={tabId}
                  role="tab"
                  className="policy-detail-tabs__tab"
                  aria-selected={isSelected}
                  aria-controls={panelId}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  {tab.id === 'bienes' ? ` (${assetCount})` : ''}
                  {tab.id === 'documentos' ? ` (${documentCount})` : ''}
                </button>
              )
            })}
          </div>

          <div
            id={activeTabPanelId}
            role="tabpanel"
            aria-labelledby={activeTabId}
            className="policy-detail-tabpanel"
          >
            {activeTab === 'resumen' && (
              <dl className="policy-detail-summary">
                <div className="policy-detail-summary__item">
                  <dt>Identificador</dt>
                  <dd>{policy.identifierId}</dd>
                </div>
                <div className="policy-detail-summary__item">
                  <dt>Ramo</dt>
                  <dd>
                    <span className="catalog-badge catalog-badge--branch">
                      {policy.branch}
                    </span>
                  </dd>
                </div>
                <div className="policy-detail-summary__item">
                  <dt>Estado</dt>
                  <dd>
                    <span
                      className={`catalog-badge catalog-badge--status catalog-badge--${getPolicyStatusBadgeModifier(policy.status)}`}
                    >
                      {policy.status}
                    </span>
                  </dd>
                </div>
                <div className="policy-detail-summary__item">
                  <dt>Fecha de efecto</dt>
                  <dd>{formatDisplayDate(policy.effectiveAt)}</dd>
                </div>
                <div className="policy-detail-summary__item">
                  <dt>Próxima renovación</dt>
                  <dd>{formatDisplayDate(policy.nextRenewalAt)}</dd>
                </div>
                <div className="policy-detail-summary__item">
                  <dt>Cliente</dt>
                  <dd>
                    <Link
                      to={`/catalog/customers/${policy.customerId}`}
                      className="insurance-policies-table__link"
                    >
                      {getCustomerName(policy.customerId)}
                    </Link>
                  </dd>
                </div>
                <div className="policy-detail-summary__item">
                  <dt>Aseguradora</dt>
                  <dd>{getCompanyName(policy.assuranceCompanyId)}</dd>
                </div>
                <div className="policy-detail-summary__item">
                  <dt>Contrato vinculado</dt>
                  <dd>
                    {policy.attachedContractId ? (
                      <span className="policy-detail-summary__contract-linked">
                        Documento vinculado
                        <span className="policy-detail-summary__contract-hint">
                          Consulta el tab Documentos para ver el archivo.
                        </span>
                      </span>
                    ) : (
                      'Sin contrato vinculado'
                    )}
                  </dd>
                </div>
                {(policy.cancelledAt || policy.cancellationReason) && (
                  <>
                    <div className="policy-detail-summary__item">
                      <dt>Fecha de cancelación</dt>
                      <dd>
                        {policy.cancelledAt
                          ? formatDisplayDate(policy.cancelledAt)
                          : '—'}
                      </dd>
                    </div>
                    <div className="policy-detail-summary__item policy-detail-summary__item--wide">
                      <dt>Motivo de cancelación</dt>
                      <dd>{policy.cancellationReason ?? '—'}</dd>
                    </div>
                  </>
                )}
              </dl>
            )}

            {activeTab === 'bienes' && (
              <PolicyDetailAssetsTab
                policy={policy}
                onCountChange={setAssetCount}
              />
            )}

            {activeTab === 'documentos' && (
              <PolicyDetailDocumentsTab
                policy={policy}
                onPolicyUpdate={handlePolicyUpdate}
                onCountChange={setDocumentCount}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
