import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CustomerOnboardingWizard } from '../../pages/Catalog/Customers/CustomerOnboardingWizard'
import { useCustomers } from '../../pages/Catalog/Customers/useCustomers'
import { useAssuranceCompanies } from '../../pages/Catalog/AssuranceCompanies/useAssuranceCompanies'
import { InsurancePolicyOnboardingWizard } from '../../pages/Catalog/InsurancePolicies/InsurancePolicyOnboardingWizard'
import '../../components/CatalogModal/CatalogModal.css'
import '../../pages/auth/auth-page.css'
import { ProcedureLauncherContext } from './ProcedureLauncherContext'

type ProcedureLauncherProviderProps = {
  children: ReactNode
}

export function ProcedureLauncherProvider({
  children,
}: ProcedureLauncherProviderProps) {
  const navigate = useNavigate()
  const [customerWizardOpen, setCustomerWizardOpen] = useState(false)
  const [policyWizardOpen, setPolicyWizardOpen] = useState(false)

  const {
    customers,
    isLoading: isCustomersLoading,
    loadError: customersLoadError,
    reload: reloadCustomers,
  } = useCustomers()

  const {
    assuranceCompanies,
    isLoading: isCompaniesLoading,
    loadError: companiesLoadError,
    reload: reloadCompanies,
  } = useAssuranceCompanies()

  const openCustomerOnboarding = useCallback(() => {
    setCustomerWizardOpen(true)
  }, [])

  const openPolicyOnboarding = useCallback(() => {
    setPolicyWizardOpen(true)
    void reloadCustomers()
    void reloadCompanies()
  }, [reloadCompanies, reloadCustomers])

  const policyLoadError = customersLoadError ?? companiesLoadError
  const isPolicyOptionsLoading = isCustomersLoading || isCompaniesLoading
  const policyWizardVisible = policyWizardOpen && !policyLoadError

  const closeCustomerWizard = useCallback(() => {
    setCustomerWizardOpen(false)
  }, [])

  const closePolicyWizard = useCallback(() => {
    setPolicyWizardOpen(false)
  }, [])

  const handleCustomerSuccess = useCallback(
    (customer: { id: string }) => {
      setCustomerWizardOpen(false)
      navigate(`/catalog/customers/${customer.id}`)
    },
    [navigate],
  )

  const handlePolicySuccess = useCallback(
    (policy: { id: string }) => {
      setPolicyWizardOpen(false)
      navigate(`/catalog/insurance-policies/${policy.id}`)
    },
    [navigate],
  )

  const dismissLauncherError = useCallback(() => {
    setPolicyWizardOpen(false)
  }, [])

  const contextValue = useMemo(
    () => ({
      openCustomerOnboarding,
      openPolicyOnboarding,
    }),
    [openCustomerOnboarding, openPolicyOnboarding],
  )

  const launcherError = policyWizardOpen ? policyLoadError : null

  return (
    <ProcedureLauncherContext.Provider value={contextValue}>
      {children}

      <CustomerOnboardingWizard
        key={
          customerWizardOpen
            ? 'procedure-customer-open'
            : 'procedure-customer-closed'
        }
        open={customerWizardOpen}
        onClose={closeCustomerWizard}
        onSuccess={handleCustomerSuccess}
      />

      <InsurancePolicyOnboardingWizard
        key={
          policyWizardOpen ? 'procedure-policy-open' : 'procedure-policy-closed'
        }
        open={policyWizardVisible}
        customers={customers}
        assuranceCompanies={assuranceCompanies}
        isLoadingOptions={isPolicyOptionsLoading}
        onClose={closePolicyWizard}
        onSuccess={handlePolicySuccess}
      />

      {launcherError && (
        <dialog
          open
          className="catalog-modal"
          aria-labelledby="procedure-launcher-error-title"
          aria-describedby="procedure-launcher-error-message"
        >
          <div className="catalog-modal__inner">
            <h2
              id="procedure-launcher-error-title"
              className="catalog-modal__title"
            >
              No se pudo iniciar el procedimiento
            </h2>
            <p
              id="procedure-launcher-error-message"
              className="auth-alert auth-alert--error"
              role="alert"
            >
              {launcherError}
            </p>
            <div className="catalog-modal__actions">
              <button
                type="button"
                className="catalog-modal-btn catalog-modal-btn--primary"
                onClick={dismissLauncherError}
              >
                Cerrar
              </button>
            </div>
          </div>
        </dialog>
      )}
    </ProcedureLauncherContext.Provider>
  )
}
