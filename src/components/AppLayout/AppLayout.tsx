import type { ReactNode } from 'react'
import './AppLayout.css'

export type AppLayoutProps = {
  aside: ReactNode
  children: ReactNode
  className?: string
  mainClassName?: string
  mainAriaLabel?: string
}

/**
 * Framework-agnostic application shell with a fixed aside and a scrollable
 * content outlet. Routing, authentication and navigation are injected by the
 * consuming application.
 */
export function AppLayout({
  aside,
  children,
  className,
  mainClassName,
  mainAriaLabel,
}: AppLayoutProps) {
  const rootClassName = ['app-layout', className].filter(Boolean).join(' ')
  const contentClassName = ['app-layout__main', mainClassName]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClassName}>
      {aside}
      <main className={contentClassName} aria-label={mainAriaLabel}>
        {children}
      </main>
    </div>
  )
}
