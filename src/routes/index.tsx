import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppLayout } from '../layouts'
import {
  ChangePasswordPage,
  ConfirmEmailPage,
  LoginPage,
  OnboardingPage,
  ProfilePage,
  UsersPage,
} from '../pages'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleGate } from './RoleGate'
import { VIEWER_RANK } from './role-ranks'

const PROFILE_PATH = '/profile'

const CustomersPage = lazy(() =>
  import('../pages/Catalog/Customers/CustomersPage').then((module) => ({
    default: module.CustomersPage,
  })),
)

const CustomerDetailPage = lazy(() =>
  import('../pages/Catalog/Customers/CustomerDetailPage').then((module) => ({
    default: module.CustomerDetailPage,
  })),
)

const AssuranceCompaniesPage = lazy(() =>
  import('../pages/Catalog/AssuranceCompanies/AssuranceCompaniesPage').then(
    (module) => ({
      default: module.AssuranceCompaniesPage,
    }),
  ),
)

const ContactsPage = lazy(() =>
  import('../pages/Catalog/Contacts/ContactsPage').then((module) => ({
    default: module.ContactsPage,
  })),
)

const InsurancePoliciesPage = lazy(() =>
  import('../pages/Catalog/InsurancePolicies/InsurancePoliciesPage').then(
    (module) => ({
      default: module.InsurancePoliciesPage,
    }),
  ),
)

const InsurancePolicyDetailPage = lazy(() =>
  import('../pages/Catalog/InsurancePolicies/InsurancePolicyDetailPage').then(
    (module) => ({
      default: module.InsurancePolicyDetailPage,
    }),
  ),
)

const InsuredAssetsPage = lazy(() =>
  import('../pages/Catalog/InsuredAssets/InsuredAssetsPage').then((module) => ({
    default: module.InsuredAssetsPage,
  })),
)

const AttachmentsPage = lazy(() =>
  import('../pages/Catalog/Attachments/AttachmentsPage').then((module) => ({
    default: module.AttachmentsPage,
  })),
)

function CatalogRouteFallback() {
  return (
    <div className="page-content">
      <p className="page-content__subtitle">Cargando…</p>
    </div>
  )
}

function withViewerAccess(element: ReactNode) {
  return (
    <RoleGate
      minRoleRank={VIEWER_RANK}
      fallback={<Navigate to={PROFILE_PATH} replace />}
    >
      <Suspense fallback={<CatalogRouteFallback />}>{element}</Suspense>
    </RoleGate>
  )
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/confirm-email',
    element: <ConfirmEmailPage />,
  },
  {
    path: '/change-password',
    element: <ChangePasswordPage />,
  },
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={PROFILE_PATH} replace />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            path: 'backoffice/users',
            element: (
              <RoleGate
                role="Admin"
                fallback={<Navigate to={PROFILE_PATH} replace />}
              >
                <UsersPage />
              </RoleGate>
            ),
          },
          {
            path: 'catalog/customers',
            element: withViewerAccess(<CustomersPage />),
          },
          {
            path: 'catalog/customers/:id',
            element: withViewerAccess(<CustomerDetailPage />),
          },
          {
            path: 'catalog/assurance-companies',
            element: withViewerAccess(<AssuranceCompaniesPage />),
          },
          {
            path: 'catalog/contacts',
            element: withViewerAccess(<ContactsPage />),
          },
          {
            path: 'catalog/insurance-policies',
            element: withViewerAccess(<InsurancePoliciesPage />),
          },
          {
            path: 'catalog/insurance-policies/:id',
            element: withViewerAccess(<InsurancePolicyDetailPage />),
          },
          {
            path: 'catalog/insured-assets',
            element: withViewerAccess(<InsuredAssetsPage />),
          },
          {
            path: 'catalog/attachments',
            element: withViewerAccess(<AttachmentsPage />),
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
