import type { ReactNode } from 'react'

import type { TableLayoutColumn } from '../TableLayout/TableLayout'

export const CATALOG_ACTIONS_COLUMN_HEADER = 'Acciones'

export const CATALOG_ROW_ACTION_LABELS = {
  view: 'Ver',
  edit: 'Editar',
  delete: 'Borrar',
  download: 'Descargar',
  downloading: 'Descargando…',
} as const

const CATALOG_TABLE_ACTION_BTN_CLASS = 'catalog-table-action-btn'
const CATALOG_TABLE_DANGER_BTN_CLASS = 'catalog-btn catalog-btn--danger'

export type CatalogCustomRowAction<T> = {
  label: string | ((item: T) => string)
  onClick: (item: T) => void
  variant?: 'ghost' | 'danger'
  requiresEdit?: boolean
  hidden?: (item: T) => boolean
  disabled?: (item: T) => boolean
  isLoading?: (item: T) => boolean
  loadingLabel?: string | ((item: T) => string)
  title?: string | ((item: T) => string | undefined)
}

export type CatalogRowActionsConfig<T> = {
  canEdit: boolean
  view?: {
    onClick: (item: T) => void
    label?: string
  }
  download?: {
    onClick: (item: T) => void
    isLoading?: (item: T) => boolean
    label?: string
    loadingLabel?: string
  }
  custom?: CatalogCustomRowAction<T>[]
  edit?: {
    onClick: (item: T) => void
  }
  delete?: {
    onClick: (item: T) => void
    disabled?: (item: T) => boolean
    title?: string | ((item: T) => string | undefined)
  }
}

function resolveValue<T>(
  value: string | ((item: T) => string),
  item: T,
): string {
  return typeof value === 'function' ? value(item) : value
}

function resolveOptionalValue<T>(
  value: string | ((item: T) => string | undefined) | undefined,
  item: T,
): string | undefined {
  if (!value) {
    return undefined
  }

  return typeof value === 'function' ? value(item) : value
}

type CatalogRowActionsProps<T> = {
  item: T
  config: CatalogRowActionsConfig<T>
}

export function CatalogRowActions<T>({
  item,
  config,
}: CatalogRowActionsProps<T>): ReactNode {
  const {
    canEdit,
    view,
    download,
    custom = [],
    edit,
    delete: deleteAction,
  } = config
  const buttons: ReactNode[] = []

  if (view) {
    buttons.push(
      <button
        key="view"
        type="button"
        className={CATALOG_TABLE_ACTION_BTN_CLASS}
        onClick={() => view.onClick(item)}
      >
        {view.label ?? CATALOG_ROW_ACTION_LABELS.view}
      </button>,
    )
  }

  if (download) {
    const loading = download.isLoading?.(item) ?? false

    buttons.push(
      <button
        key="download"
        type="button"
        className={CATALOG_TABLE_ACTION_BTN_CLASS}
        disabled={loading}
        onClick={() => download.onClick(item)}
      >
        {loading
          ? (download.loadingLabel ?? CATALOG_ROW_ACTION_LABELS.downloading)
          : (download.label ?? CATALOG_ROW_ACTION_LABELS.download)}
      </button>,
    )
  }

  custom.forEach((action, index) => {
    if (action.hidden?.(item)) {
      return
    }

    if (action.requiresEdit !== false && !canEdit) {
      return
    }

    const loading = action.isLoading?.(item) ?? false
    const label =
      loading && action.loadingLabel
        ? resolveValue(action.loadingLabel, item)
        : resolveValue(action.label, item)

    buttons.push(
      <button
        key={`custom-${index}`}
        type="button"
        className={
          action.variant === 'danger'
            ? CATALOG_TABLE_DANGER_BTN_CLASS
            : CATALOG_TABLE_ACTION_BTN_CLASS
        }
        disabled={action.disabled?.(item) || loading}
        title={resolveOptionalValue(action.title, item)}
        onClick={() => action.onClick(item)}
      >
        {label}
      </button>,
    )
  })

  if (edit && canEdit) {
    buttons.push(
      <button
        key="edit"
        type="button"
        className={CATALOG_TABLE_ACTION_BTN_CLASS}
        onClick={() => edit.onClick(item)}
      >
        {CATALOG_ROW_ACTION_LABELS.edit}
      </button>,
    )
  }

  if (deleteAction && canEdit) {
    buttons.push(
      <button
        key="delete"
        type="button"
        className={CATALOG_TABLE_DANGER_BTN_CLASS}
        disabled={deleteAction.disabled?.(item)}
        title={resolveOptionalValue(deleteAction.title, item)}
        onClick={() => deleteAction.onClick(item)}
      >
        {CATALOG_ROW_ACTION_LABELS.delete}
      </button>,
    )
  }

  if (buttons.length === 0) {
    return <span className="catalog-row-actions__empty">—</span>
  }

  return <div className="row-actions">{buttons}</div>
}

export function buildCatalogActionsColumn<T>(
  config: CatalogRowActionsConfig<T> & { columnClassName?: string },
): TableLayoutColumn<T> {
  const { columnClassName, ...actionConfig } = config
  const actionColumnClassName = ['table-layout__actions', columnClassName]
    .filter(Boolean)
    .join(' ')

  return {
    key: 'actions',
    header: CATALOG_ACTIONS_COLUMN_HEADER,
    headerClassName: actionColumnClassName,
    cellClassName: actionColumnClassName,
    render: (item) => <CatalogRowActions item={item} config={actionConfig} />,
  }
}
