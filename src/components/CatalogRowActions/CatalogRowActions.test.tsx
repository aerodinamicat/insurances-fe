import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CatalogRowActions } from './CatalogRowActions'

describe('CatalogRowActions', () => {
  it('renders canonical actions in order and hides edit/delete for viewers', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()
    const onDownload = vi.fn()
    const onEdit = vi.fn()
    const onDelete = vi.fn()

    render(
      <CatalogRowActions
        item={{ id: '1' }}
        config={{
          canEdit: false,
          view: { onClick: onView },
          download: { onClick: onDownload },
          edit: { onClick: onEdit },
          delete: { onClick: onDelete },
        }}
      />,
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons.map((button) => button.textContent)).toEqual([
      'Ver',
      'Descargar',
    ])

    await user.click(screen.getByRole('button', { name: 'Ver' }))
    expect(onView).toHaveBeenCalledWith({ id: '1' })
  })

  it('renders edit and delete when editing is allowed', () => {
    render(
      <CatalogRowActions
        item={{ id: '1' }}
        config={{
          canEdit: true,
          edit: { onClick: vi.fn() },
          delete: { onClick: vi.fn() },
        }}
      />,
    )

    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Borrar' })).toBeInTheDocument()
  })

  it('uses compact table action styling for view and edit', () => {
    render(
      <CatalogRowActions
        item={{ id: '1' }}
        config={{
          canEdit: true,
          view: { onClick: vi.fn() },
          edit: { onClick: vi.fn() },
        }}
      />,
    )

    expect(screen.getByRole('button', { name: 'Ver' })).toHaveClass(
      'catalog-table-action-btn',
    )
    expect(screen.getByRole('button', { name: 'Editar' })).toHaveClass(
      'catalog-table-action-btn',
    )
  })

  it('shows an empty placeholder when no actions are available', () => {
    render(
      <CatalogRowActions
        item={{ id: '1' }}
        config={{ canEdit: false }}
      />,
    )

    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
