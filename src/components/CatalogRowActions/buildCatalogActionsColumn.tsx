import type { TableLayoutColumn } from '../TableLayout/TableLayout'
import { CatalogRowActions } from './CatalogRowActions'
import type { CatalogRowActionsConfig } from './CatalogRowActions'
import { CATALOG_ACTIONS_COLUMN_HEADER } from './catalog-row-actions.constants'

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
