import { Navigate, useLocation } from 'react-router-dom'

type RedirectPreserveSearchProps = {
  to: string
}

export function RedirectPreserveSearch({ to }: RedirectPreserveSearchProps) {
  const location = useLocation()
  return <Navigate to={`${to}${location.search}`} replace />
}
