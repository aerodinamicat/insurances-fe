import { Outlet } from 'react-router-dom'
import { ProcedureLauncherProvider } from '../ProcedureLauncher'
import { AppAside } from './AppAside'
import './AppLayout.css'

export function AppLayout() {
  return (
    <ProcedureLauncherProvider>
      <div className="app-layout">
        <AppAside />
        <main className="app-layout__main">
          <Outlet />
        </main>
      </div>
    </ProcedureLauncherProvider>
  )
}
