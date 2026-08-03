import { Outlet } from 'react-router-dom'
import { AppLayout as AppLayoutShell } from '../../components/AppLayout'
import { ProcedureLauncherProvider } from '../ProcedureLauncher'
import { AppAside } from './AppAside'
import './AppLayout.css'

export function AppLayout() {
  return (
    <ProcedureLauncherProvider>
      <AppLayoutShell aside={<AppAside />}>
        <Outlet />
      </AppLayoutShell>
    </ProcedureLauncherProvider>
  )
}
