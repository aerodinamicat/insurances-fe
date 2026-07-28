import { useContext } from 'react'
import { ProcedureLauncherContext } from './ProcedureLauncherContext'

export function useProcedureLauncher() {
  const context = useContext(ProcedureLauncherContext)

  if (!context) {
    throw new Error(
      'useProcedureLauncher must be used within ProcedureLauncherProvider',
    )
  }

  return context
}
