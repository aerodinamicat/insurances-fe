import '../../pages/Catalog/catalog-shared.css'
import '../CatalogModal/CatalogModal.css'
import { useEffect, useId, type ReactNode } from 'react'
import { useGuardedDialog } from '../../hooks/useGuardedDialog'
import '../../pages/auth/auth-page.css'
import './CompositionWizardModal.css'

export type CompositionWizardTab = {
  id: string
  label: string
  disabled?: boolean
  hasError?: boolean
}

type CompositionWizardModalProps = {
  open: boolean
  title: string
  tabs: CompositionWizardTab[]
  activeTabId: string
  onTabChange: (tabId: string) => void
  onClose: () => void
  isDirty: boolean
  isSubmitting: boolean
  /** Global banner only: partial persistence, form-level API errors, or tab messages without field mapping. Field validation uses per-tab `fieldErrors` in wizard content. */
  error: string | null
  children: ReactNode
  primaryLabel: string
  onPrimaryAction: () => void
  primaryDisabled?: boolean
  showBack?: boolean
  onBack?: () => void
}

export function CompositionWizardModal({
  open,
  title,
  tabs,
  activeTabId,
  onTabChange,
  onClose,
  isDirty,
  isSubmitting,
  error,
  children,
  primaryLabel,
  onPrimaryAction,
  primaryDisabled = false,
  showBack = false,
  onBack,
}: CompositionWizardModalProps) {
  const titleId = useId()
  const tabsId = useId()

  const {
    dialogRef,
    attemptClose,
    closeSilently,
    handleDialogClose,
    handleDialogCancel,
    confirmDialog,
  } = useGuardedDialog({
    isOpen: open,
    isDirty,
    onClose,
  })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      closeSilently()
    }
  }, [closeSilently, dialogRef, open])

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
  const activeTabPanelId = `${tabsId}-${activeTab?.id ?? 'panel'}-panel`
  const activeTabIdAttr = `${tabsId}-${activeTab?.id ?? 'tab'}-tab`

  return (
    <>
      <dialog
        ref={dialogRef}
        className="composition-wizard-modal"
        onClose={handleDialogClose}
        onCancel={handleDialogCancel}
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="composition-wizard-modal__inner">
          <header className="composition-wizard-modal__header">
            <h2 id={titleId} className="composition-wizard-modal__title">
              {title}
            </h2>
          </header>

          <div
            className="composition-wizard-modal__tabs"
            role="tablist"
            aria-label="Pasos del asistente"
          >
            {tabs.map((tab) => {
              const isSelected = tab.id === activeTabId
              const tabId = `${tabsId}-${tab.id}-tab`
              const panelId = `${tabsId}-${tab.id}-panel`

              return (
                <button
                  key={tab.id}
                  type="button"
                  id={tabId}
                  role="tab"
                  className={`composition-wizard-modal__tab${tab.hasError ? ' composition-wizard-modal__tab--error' : ''}`}
                  aria-selected={isSelected}
                  aria-controls={panelId}
                  tabIndex={isSelected ? 0 : -1}
                  disabled={tab.disabled || isSubmitting}
                  onClick={() => onTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div
            id={activeTabPanelId}
            role="tabpanel"
            aria-labelledby={activeTabIdAttr}
            className="composition-wizard-modal__body"
          >
            {error && (
              <div className="auth-alert auth-alert--error" role="alert">
                {error}
              </div>
            )}
            {children}
          </div>

          <footer className="composition-wizard-modal__footer">
            <button
              type="button"
              className="catalog-modal-btn catalog-modal-btn--secondary"
              disabled={isSubmitting}
              onClick={() => void attemptClose()}
            >
              Cancelar
            </button>
            {showBack && onBack && (
              <button
                type="button"
                className="catalog-modal-btn catalog-modal-btn--secondary"
                disabled={isSubmitting}
                onClick={onBack}
              >
                Anterior
              </button>
            )}
            <button
              type="button"
              className="catalog-modal-btn catalog-modal-btn--primary"
              disabled={isSubmitting || primaryDisabled}
              onClick={onPrimaryAction}
            >
              {isSubmitting ? 'Guardando…' : primaryLabel}
            </button>
          </footer>
        </div>
      </dialog>
      {confirmDialog}
    </>
  )
}
