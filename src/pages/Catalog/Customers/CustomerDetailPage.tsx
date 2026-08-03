import '../catalog-shared.css'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../api/client'
import { fetchCustomer, getCustomerAlias } from '../../../api/catalog'
import type { CustomerResponse } from '../../../api/catalog'
import { useAssuranceCompanies } from '../AssuranceCompanies/useAssuranceCompanies'
import { CustomerDetailContent } from './CustomerDetailContent'
import '../InsurancePolicies/InsurancePoliciesPage.css'
import './CustomerDetailPage.css'

export const CUSTOMERS_LIST_PATH = '/catalog/customers'

function getCustomerTypeBadgeModifier(
  type: CustomerResponse['type'],
): 'particular' | 'empresa' {
  return type === 'Empresa' ? 'empresa' : 'particular'
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [customer, setCustomer] = useState<CustomerResponse | null>(null)
  const [isCustomerLoading, setIsCustomerLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const {
    assuranceCompanies,
    isLoading: isCompaniesLoading,
  } = useAssuranceCompanies()

  const loadCustomer = useCallback(async (customerId: string) => {
    setIsCustomerLoading(true)
    setLoadError(null)

    try {
      const response = await fetchCustomer(customerId)
      setCustomer(response)
    } catch (caught) {
      setCustomer(null)
      setLoadError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo cargar el cliente. Inténtalo de nuevo.',
      )
    } finally {
      setIsCustomerLoading(false)
    }
  }, [])

  const invalidIdError = id ? null : 'Identificador de cliente no válido.'

  useEffect(() => {
    if (!id) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void loadCustomer(id)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [id, loadCustomer])

  const isLoading = isCustomerLoading || isCompaniesLoading
  const pageLoadError = invalidIdError ?? loadError

  async function handleRetry() {
    if (id) {
      await loadCustomer(id)
    }
  }

  return (
    <div className="page-content customer-detail">
      <nav className="customer-detail__breadcrumb" aria-label="Volver">
        <Link to={CUSTOMERS_LIST_PATH} className="customer-detail__back-link">
          ← Clientes
        </Link>
      </nav>

      <header className="customer-detail__header">
        {customer ? (
          <>
            <div className="customer-detail__title-row">
              <h1 className="page-content__title">{getCustomerAlias(customer)}</h1>
              <div className="customer-detail__badges">
                <span
                  className={`catalog-badge catalog-badge--${getCustomerTypeBadgeModifier(customer.type)}`}
                >
                  {customer.type}
                </span>
              </div>
            </div>
            <p className="page-content__subtitle">
              Ficha de cliente con contactos, documentos y pólizas asociadas.
            </p>
          </>
        ) : (
          <>
            <h1 className="page-content__title">Ficha de cliente</h1>
            <p className="page-content__subtitle">
              Detalle de cliente, contactos, documentos y pólizas.
            </p>
          </>
        )}
      </header>

      {isLoading && (
        <p className="catalog-empty">Cargando ficha de cliente…</p>
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

      {!isLoading && !pageLoadError && customer && (
        <CustomerDetailContent
          customer={customer}
          assuranceCompanies={assuranceCompanies}
        />
      )}
    </div>
  )
}
