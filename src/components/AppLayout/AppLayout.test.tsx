import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppLayout } from './AppLayout'

describe('AppLayout', () => {
  it('composes an injected aside and application content', () => {
    render(
      <AppLayout
        aside={<aside>Navegación externa</aside>}
        mainAriaLabel="Contenido principal"
      >
        <p>Contenido externo</p>
      </AppLayout>,
    )

    expect(screen.getByText('Navegación externa')).toBeInTheDocument()
    expect(
      screen.getByRole('main', { name: 'Contenido principal' }),
    ).toHaveTextContent('Contenido externo')
  })
})
