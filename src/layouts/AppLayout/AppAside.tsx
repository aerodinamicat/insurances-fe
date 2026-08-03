import { NavLink } from 'react-router-dom'
import projectLogo from '../../assets/logo.png'
import { useAuth } from '../../auth'
import {
  COMPANY_ACRONYM,
  COMPANY_NAME,
  PROJECT_NAME,
} from '../../config/branding'
import { EDITOR_RANK, RoleGate } from '../../routes/RoleGate'
import { useProcedureLauncher } from '../ProcedureLauncher'
import { useMyProfileSummary } from './useMyProfileSummary'

const PROFILE_PATH = '/profile'
const DASHBOARD_PATH = '/dashboard'
const USERS_PATH = '/backoffice/users'
const CATALOG_CUSTOMERS_PATH = '/catalog/customers'
const CATALOG_ASSURANCE_COMPANIES_PATH = '/catalog/assurance-companies'
const CATALOG_CONTACTS_PATH = '/catalog/contacts'
const CATALOG_INSURANCE_POLICIES_PATH = '/catalog/insurance-policies'
const CATALOG_INSURED_ASSETS_PATH = '/catalog/insured-assets'
const CATALOG_ATTACHMENTS_PATH = '/catalog/attachments'

const catalogNavItems = [
  { label: 'Clientes', to: CATALOG_CUSTOMERS_PATH },
  { label: 'Aseguradoras', to: CATALOG_ASSURANCE_COMPANIES_PATH },
  { label: 'Contactos', to: CATALOG_CONTACTS_PATH },
  { label: 'Pólizas', to: CATALOG_INSURANCE_POLICIES_PATH },
  { label: 'Bienes asegurados', to: CATALOG_INSURED_ASSETS_PATH },
  { label: 'Documentos', to: CATALOG_ATTACHMENTS_PATH },
] as const

const proceduresNavItems = [
  { label: 'Alta de cliente', action: 'customer' as const },
  { label: 'Alta de póliza', action: 'policy' as const },
] as const

export function AppAside() {
  const { logout, roleRank } = useAuth()
  const { displayName, roleLabel } = useMyProfileSummary()
  const { openCustomerOnboarding, openPolicyOnboarding } = useProcedureLauncher()
  const canRunProcedures = (roleRank ?? 0) >= EDITOR_RANK

  return (
    <aside className="app-aside" aria-label="Main navigation">
      <div className="app-aside__brand">
        <img
          className="app-aside__logo"
          src={projectLogo}
          alt={`Logo de ${COMPANY_ACRONYM}`}
        />
        <div className="app-aside__brand-copy">
          <span className="app-aside__title">{COMPANY_ACRONYM}</span>
          <span className="app-aside__project">{PROJECT_NAME}</span>
          <span className="app-aside__company">{COMPANY_NAME}</span>
        </div>
      </div>

      <nav className="app-aside__nav">
        <div className="app-aside__section">
          <ul className="app-aside__list">
            <li>
              <NavLink className="app-aside__link" to={DASHBOARD_PATH} end>
                Dashboard
              </NavLink>
            </li>
          </ul>
        </div>

        {canRunProcedures && (
          <div className="app-aside__section">
            <span className="app-aside__section-label">Procedimientos</span>
            <ul className="app-aside__list">
              {proceduresNavItems.map((item) => (
                <li key={item.action}>
                  <button
                    type="button"
                    className="app-aside__link app-aside__action"
                    onClick={() =>
                      item.action === 'customer'
                        ? openCustomerOnboarding()
                        : openPolicyOnboarding()
                    }
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="app-aside__section">
          <span className="app-aside__section-label">Catálogo</span>
          <ul className="app-aside__list">
            {catalogNavItems.map((item) => (
              <li key={item.to}>
                <NavLink className="app-aside__link" to={item.to} end>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <RoleGate role="Admin">
          <div className="app-aside__section">
            <span className="app-aside__section-label">Backoffice</span>
            <ul className="app-aside__list">
              <li>
                <NavLink className="app-aside__link" to={USERS_PATH} end>
                  Usuarios
                </NavLink>
              </li>
            </ul>
          </div>
        </RoleGate>
      </nav>

      <div className="app-aside__footer">
        <NavLink
          className={({ isActive }) =>
            `app-aside__account${isActive ? ' app-aside__account--active' : ''}`
          }
          to={PROFILE_PATH}
          end
        >
          <span className="app-aside__account-name">{displayName}</span>
          {roleLabel && (
            <span className="app-aside__account-role">{roleLabel}</span>
          )}
        </NavLink>
        <button
          type="button"
          className="app-aside__logout"
          onClick={() => logout()}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
