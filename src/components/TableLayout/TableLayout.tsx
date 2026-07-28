import {
  cloneElement,
  isValidElement,
  useId,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import './TableLayout.css'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

type SortDirection = 'asc' | 'desc'

type SortState = {
  columnKey: string
  direction: SortDirection
} | null

export type TableLayoutColumn<TItem> = {
  key: string
  header: ReactNode
  render: (item: TItem) => ReactNode
  getSearchValue?: (item: TItem) => string
  getSortValue?: (item: TItem) => string
  headerClassName?: string
  cellClassName?: string
}

type TableLayoutProps<TItem> = {
  columns: TableLayoutColumn<TItem>[]
  items: TItem[]
  getItemKey: (item: TItem) => string
  getRowClassName?: (item: TItem) => string | undefined
  className?: string
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getNodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return ''
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map((child) => getNodeText(child)).join(' ')
  }

  if (isValidElement(node)) {
    return getNodeText((node.props as { children?: ReactNode }).children)
  }

  return ''
}

function highlightText(text: string, query: string): ReactNode {
  if (!query) {
    return text
  }

  const pattern = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  const parts = text.split(pattern)

  if (parts.length === 1) {
    return text
  }

  return parts.map((part, index) =>
    part.toLocaleLowerCase() === query.toLocaleLowerCase() ? (
      <mark key={`${part}-${index}`} className="table-layout__highlight">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

function highlightNode(node: ReactNode, query: string): ReactNode {
  if (!query) {
    return node
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return highlightText(String(node), query)
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <span key={index}>{highlightNode(child, query)}</span>
    ))
  }

  if (isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>
    const children = element.props.children

    if (children === undefined) {
      return node
    }

    return cloneElement(element, undefined, highlightNode(children, query))
  }

  return node
}

function getAliasSortValue(item: unknown): string | null {
  if (
    typeof item === 'object' &&
    item !== null &&
    'alias' in item &&
    typeof item.alias === 'string'
  ) {
    return item.alias
  }

  return null
}

function compareText(left: string, right: string, direction: SortDirection) {
  const result = left.localeCompare(right, undefined, {
    sensitivity: 'base',
    numeric: true,
  })

  return direction === 'asc' ? result : -result
}

export function TableLayout<TItem>({
  columns,
  items,
  getItemKey,
  getRowClassName,
  className,
}: TableLayoutProps<TItem>) {
  const searchInputId = useId()
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] =
    useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10)
  const [page, setPage] = useState(1)
  const [sortState, setSortState] = useState<SortState>(null)
  const tableClassName = className
    ? `table-layout ${className}`
    : 'table-layout'
  const normalizedSearchQuery = searchQuery.trim()

  const rows = useMemo(
    () =>
      items.map((item, originalIndex) => ({
        item,
        originalIndex,
        key: getItemKey(item),
        cells: columns.map((column) => {
          const content = column.render(item)
          const headerText = getNodeText(column.header)
          const valueText = column.getSearchValue?.(item) ?? getNodeText(content)
          const sortText = column.getSortValue?.(item) ?? valueText

          return {
            column,
            content,
            searchText: `${headerText} ${valueText}`.toLocaleLowerCase(),
            sortText,
          }
        }),
      })),
    [columns, getItemKey, items],
  )

  const naturallySortedRows = useMemo(
    () =>
      [...rows].sort((left, right) => {
        const leftAlias = getAliasSortValue(left.item)
        const rightAlias = getAliasSortValue(right.item)

        if (leftAlias !== null && rightAlias !== null) {
          const result = compareText(leftAlias, rightAlias, 'asc')

          return result === 0 ? left.originalIndex - right.originalIndex : result
        }

        return left.originalIndex - right.originalIndex
      }),
    [rows],
  )

  const sortedRows = useMemo(() => {
    if (!sortState) {
      return naturallySortedRows
    }

    return [...naturallySortedRows].sort((left, right) => {
      const leftCell = left.cells.find(
        (cell) => cell.column.key === sortState.columnKey,
      )
      const rightCell = right.cells.find(
        (cell) => cell.column.key === sortState.columnKey,
      )
      const result = compareText(
        leftCell?.sortText ?? '',
        rightCell?.sortText ?? '',
        sortState.direction,
      )

      return result === 0 ? left.originalIndex - right.originalIndex : result
    })
  }, [naturallySortedRows, sortState])

  const filteredRows = useMemo(() => {
    const query = normalizedSearchQuery.toLocaleLowerCase()

    if (!query) {
      return sortedRows
    }

    return sortedRows.filter((row) =>
      row.cells.some((cell) => cell.searchText.includes(query)),
    )
  }, [normalizedSearchQuery, sortedRows])

  const totalRows = rows.length
  const filteredRowCount = filteredRows.length
  const pageCount = Math.max(1, Math.ceil(filteredRowCount / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageStartIndex = (currentPage - 1) * pageSize
  const pageRows = filteredRows.slice(pageStartIndex, pageStartIndex + pageSize)
  const shownStart = filteredRowCount === 0 ? 0 : pageStartIndex + 1
  const shownEnd = Math.min(pageStartIndex + pageRows.length, filteredRowCount)

  function goToPage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), pageCount))
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setPage(1)
  }

  function handleSort(columnKey: string) {
    setSortState((current) => {
      if (!current || current.columnKey !== columnKey) {
        return { columnKey, direction: 'asc' }
      }

      if (current.direction === 'asc') {
        return { columnKey, direction: 'desc' }
      }

      return null
    })
    setPage(1)
  }

  function handlePageSizeChange(value: string) {
    const nextPageSize = Number(value) as (typeof PAGE_SIZE_OPTIONS)[number]

    setPageSize(nextPageSize)
    setPage(1)
  }

  function renderPaginationControls() {
    const pageInputId = `${searchInputId}-page`

    return (
      <div className="table-layout-pagination">
        <div className="table-layout-pagination__summary" aria-live="polite">
          Mostrando {shownStart} - {shownEnd} / {filteredRowCount} 
          {filteredRowCount !== totalRows ? ` (${totalRows} total)` : ''}
        </div>

        <div
          className="table-layout-pagination__controls"
          aria-label="Controles de paginación"
        >
          <button
            type="button"
            className="table-layout-pagination__button"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            aria-label="Primera página"
          >
            «
          </button>
          <button
            type="button"
            className="table-layout-pagination__button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Página anterior"
          >
            ‹
          </button>
          <label className="table-layout-pagination__page-jump">
            <span className="table-layout__sr-only">Página</span>
            <input
              id={pageInputId}
              type="number"
              min={1}
              max={pageCount}
              value={currentPage}
              onChange={(event) => {
                const nextPage = Number(event.target.value)

                if (Number.isInteger(nextPage)) {
                  goToPage(nextPage)
                }
              }}
              aria-label={`Página actual de ${pageCount}`}
            />
            <span>/ {pageCount}</span>
          </label>
          <button
            type="button"
            className="table-layout-pagination__button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === pageCount}
            aria-label="Página siguiente"
          >
            ›
          </button>
          <button
            type="button"
            className="table-layout-pagination__button"
            onClick={() => goToPage(pageCount)}
            disabled={currentPage === pageCount}
            aria-label="Última página"
          >
            »
          </button>
        </div>

        <label className="table-layout-pagination__page-size">
          <span>Registros por página</span>
          <select
            value={pageSize}
            onChange={(event) => handlePageSizeChange(event.target.value)}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    )
  }

  return (
    <div className="table-layout-root">
      <div className="table-layout-filter">
        <label htmlFor={searchInputId}>Filtrar tabla</label>
        <input
          id={searchInputId}
          type="search"
          value={searchQuery}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Buscar en todos los campos"
        />
      </div>

      <div className="table-layout-wrap">
        <table className={tableClassName}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={column.headerClassName}
                >
                  <button
                    type="button"
                    className="table-layout__sort-button"
                    onClick={() => handleSort(column.key)}
                  >
                    <span>{column.header}</span>
                    {sortState?.columnKey === column.key && (
                      <span
                        className="table-layout__sort-icon"
                        aria-hidden="true"
                      >
                        {sortState.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length > 0 ? (
              pageRows.map((row) => (
                <tr
                  key={row.key}
                  className={getRowClassName?.(row.item)}
                >
                  {row.cells.map(({ column, content }) => (
                    <td key={column.key} className={column.cellClassName}>
                      {highlightNode(content, normalizedSearchQuery)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="table-layout__empty" colSpan={columns.length}>
                  No hay resultados para el filtro aplicado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {renderPaginationControls()}
    </div>
  )
}
