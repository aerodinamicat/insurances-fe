import { createContext } from 'react'

export type ProcedureLauncherContextValue = {
  openCustomerOnboarding: () => void
  openPolicyOnboarding: () => void
}

export const ProcedureLauncherContext =
  createContext<ProcedureLauncherContextValue | null>(null)
