import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RecentActivityItem } from '../../api/activity'
import { useAuth } from '../../auth'
import { DashboardPage } from './DashboardPage'
import {
  useRecentActivity,
  type UseRecentActivityResult,
} from './useRecentActivity'

vi.mock('./useRecentActivity', () => ({
  useRecentActivity: vi.fn(),
}))

vi.mock('../../auth', () => ({
  useAuth: vi.fn(),
}))

const useRecentActivityMock = vi.mocked(useRecentActivity)
const useAuthMock = vi.mocked(useAuth)
const reload = vi.fn().mockResolvedValue(undefined)
const setLimit = vi.fn()
const mixedItems: RecentActivityItem[] = [
  {
    key: 'customer:customer-1:created',
    entityType: 'customer',
    entityId: 'customer-1',
    action: 'created',
    occurredAt: '2026-07-30T09:00:00.000Z',
    label: 'García, Ana',
    secondaryLabel: '12345678Z',
    actorLabel: 'López, María',
  },
  {
    key: 'attachment:attachment-1:updated',
    entityType: 'attachment',
    entityId: 'attachment-1',
    action: 'updated',
    occurredAt: '2026-07-30T08:00:00.000Z',
    label: 'Póliza',
    secondaryLabel: 'poliza.pdf',
    actorLabel: null,
  },
]

function makeHookResult(
  overrides: Partial<UseRecentActivityResult> = {},
): UseRecentActivityResult {
  return {
    items: mixedItems,
    generatedAt: '2026-07-30T10:00:00.000Z',
    isInitialLoading: false,
    isRefreshing: false,
    loadError: null,
    limit: 20,
    setLimit,
    reload,
    ...overrides,
  }
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    reload.mockClear()
    setLimit.mockClear()
    useAuthMock.mockReturnValue({ roleRank: 3 } as ReturnType<typeof useAuth>)
    useRecentActivityMock.mockReturnValue(makeHookResult())
  })

  it('uses TableLayout with the requested columns and single-line aliases', () => {
    renderDashboard()

    const customerRow = screen.getByText('García, Ana').closest('tr')
    const attachmentRow = screen.getByTitle('Póliza').closest('tr')

    expect(screen.getByRole('table')).toHaveClass('table-layout')
    expect(useRecentActivityMock).toHaveBeenCalledWith(100)
    expect(screen.getByLabelText('Filtrar tabla')).toBeInTheDocument()
    expect(screen.getByText(/Mostrando 1 - 2 \/ 2/)).toBeInTheDocument()
    expect(
      screen.getAllByRole('columnheader').map((header) => header.textContent),
    ).toEqual([
      'Acciones',
      '¿Quién?',
      '¿Cuándo?',
      '¿Qué?',
      'Alias de registro',
    ])

    expect(customerRow).not.toBeNull()
    expect(within(customerRow!).getByText('López, María')).toBeInTheDocument()
    expect(within(customerRow!).getByText('Cliente')).toHaveAttribute(
      'title',
      'Creado',
    )
    expect(within(customerRow!).getByText(/30\/7\/26, 11:00/)).toBeInTheDocument()
    expect(within(customerRow!).getByRole('link', { name: 'Ver' })).toHaveAttribute(
      'href',
      '/catalog/customers/customer-1',
    )

    expect(attachmentRow).not.toBeNull()
    expect(within(attachmentRow!).getByText('—')).toBeInTheDocument()
    expect(
      within(attachmentRow!).getByText('Documento'),
    ).toHaveAttribute('title', 'Actualizado')
    expect(screen.queryByText('poliza.pdf')).not.toBeInTheDocument()
    expect(screen.getByTitle('Póliza')).toHaveClass('dashboard-table__alias')
    expect(
      within(attachmentRow!).getByRole('link', { name: 'Ver' }),
    ).toHaveAttribute('href', '/catalog/attachments')
  })

  it('does not render actor information below Manager', () => {
    useAuthMock.mockReturnValue({ roleRank: 2 } as ReturnType<typeof useAuth>)
    renderDashboard()

    expect(
      screen.getAllByRole('columnheader').map((header) => header.textContent),
    ).toEqual(['Acciones', '¿Cuándo?', '¿Qué?', 'Alias de registro'])
    expect(screen.queryByText('López, María')).not.toBeInTheDocument()
  })

  it('uses TableLayout pagination without additional dashboard controls', async () => {
    const user = userEvent.setup()
    renderDashboard()

    await user.selectOptions(screen.getByLabelText('Registros por página'), '50')

    expect(screen.getByLabelText('Registros por página')).toHaveValue('50')
    expect(
      screen.queryByRole('region', { name: 'Controles de actividad' }),
    ).not.toBeInTheDocument()
    expect(setLimit).not.toHaveBeenCalled()
  })

  it('shows initial loading and refresh progress clearly', () => {
    useRecentActivityMock.mockReturnValue(
      makeHookResult({
        items: [],
        isInitialLoading: true,
        isRefreshing: false,
      }),
    )
    const { rerender } = renderDashboard()

    expect(screen.getByRole('status')).toHaveTextContent('Cargando actividad…')

    useRecentActivityMock.mockReturnValue(makeHookResult({ isRefreshing: true }))
    rerender(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('García, Ana')).toBeInTheDocument()
  })

  it('shows an API error and retries', async () => {
    const user = userEvent.setup()
    useRecentActivityMock.mockReturnValue(
      makeHookResult({
        items: [],
        generatedAt: null,
        loadError: 'Servicio no disponible',
      }),
    )
    renderDashboard()

    expect(screen.getByRole('alert')).toHaveTextContent('Servicio no disponible')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('shows the empty state', () => {
    useRecentActivityMock.mockReturnValue(
      makeHookResult({ items: [], generatedAt: null }),
    )
    renderDashboard()

    expect(
      screen.getByText('Todavía no hay actividad reciente.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
