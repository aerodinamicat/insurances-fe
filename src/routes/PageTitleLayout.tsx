import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { buildDocumentTitle } from '../config/branding'
import { getSectionTitle } from './page-titles'

export function PageTitleLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = buildDocumentTitle(getSectionTitle(pathname))
  }, [pathname])

  return <Outlet />
}
