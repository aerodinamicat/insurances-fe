import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'

const LOGIN_PATH = '/login'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to={LOGIN_PATH}
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <Outlet />
}
