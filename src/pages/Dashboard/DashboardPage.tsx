import { Link } from 'react-router-dom'
import {
  TableLayout,
  type TableLayoutColumn,
} from '../../components/TableLayout'
import { useAuth } from '../../auth'
import { MANAGER_RANK } from '../../routes/role-ranks'
import '../Catalog/catalog-shared.css'
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ENTITY_LABELS,
  resolveActivityDestination,
} from './activity-navigation'
import './DashboardPage.css'
import { useRecentActivity } from './useRecentActivity'

const activityDateFormatter = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Europe/Madrid',
})

function formatActivityDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : activityDateFormatter.format(date)
}

export function DashboardPage() {
  const { roleRank } = useAuth()
  const canViewActors = (roleRank ?? 0) >= MANAGER_RANK
  const {
    items,
    generatedAt,
    isInitialLoading,
    isRefreshing,
    loadError,
    reload,
  } = useRecentActivity(100)
  const activityColumns: TableLayoutColumn<(typeof items)[number]>[] = [
    {
      key: 'actions',
      header: 'Acciones',
      headerClassName: 'table-layout__actions',
      cellClassName: 'table-layout__actions',
      render: (item) => (
        <Link
          className="catalog-table-action-btn"
          to={resolveActivityDestination(item.entityType, item.entityId)}
        >
          Ver
        </Link>
      ),
    },
    ...(canViewActors
      ? [
          {
            key: 'actor',
            header: '¿Quién?',
            render: (item) => item.actorLabel ?? '—',
            getSortValue: (item) => item.actorLabel ?? '',
          } satisfies TableLayoutColumn<(typeof items)[number]>,
        ]
      : []),
    {
      key: 'occurred-at',
      header: '¿Cuándo?',
      render: (item) => (
        <time dateTime={item.occurredAt}>
          {formatActivityDate(item.occurredAt)}
        </time>
      ),
      getSortValue: (item) => item.occurredAt,
    },
    {
      key: 'entity-type',
      header: '¿Qué?',
      render: (item) => (
        <span
          className={`dashboard-badge dashboard-badge--${item.action}`}
          title={ACTIVITY_ACTION_LABELS[item.action]}
          aria-label={`${ACTIVITY_ENTITY_LABELS[item.entityType]}: ${ACTIVITY_ACTION_LABELS[item.action]}`}
        >
          {ACTIVITY_ENTITY_LABELS[item.entityType]}
        </span>
      ),
      getSortValue: (item) =>
        `${ACTIVITY_ENTITY_LABELS[item.entityType]} ${ACTIVITY_ACTION_LABELS[item.action]}`,
    },
    {
      key: 'record-alias',
      header: 'Alias de registro',
      render: (item) => (
        <span className="dashboard-table__alias" title={item.label}>
          {item.label}
        </span>
      ),
      getSortValue: (item) => item.label,
    },
  ]

  return (
    <main className="page-content dashboard-page">
      <header className="dashboard-page__header">
        <div>
          <h1 className="page-content__title">Dashboard</h1>
          <p className="page-content__subtitle">
            Consulta las altas y modificaciones más recientes de los catálogos.
          </p>
        </div>
        {generatedAt && (
          <p className="dashboard-page__updated" aria-live="polite">
            Actualizado {formatActivityDate(generatedAt)}
          </p>
        )}
      </header>

      {loadError && (
        <div className="dashboard-feedback" role="alert">
          <span>{loadError}</span>
          <button
            type="button"
            className="catalog-btn catalog-btn--secondary"
            onClick={() => void reload()}
            disabled={isInitialLoading || isRefreshing}
          >
            Reintentar
          </button>
        </div>
      )}

      {isInitialLoading ? (
        <p className="dashboard-state" role="status">
          Cargando actividad…
        </p>
      ) : items.length === 0 && !loadError ? (
        <p className="dashboard-state">
          Todavía no hay actividad reciente.
        </p>
      ) : items.length > 0 ? (
        <TableLayout
          className="dashboard-table"
          columns={activityColumns}
          items={items}
          getItemKey={(item) => item.key}
        />
      ) : null}
    </main>
  )
}
