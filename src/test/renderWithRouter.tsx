import { render, type RenderOptions } from '@testing-library/react'
import { type ReactElement, type ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

type RenderWithRouterOptions = RenderOptions & {
  initialEntries?: string[]
  path?: string
}

export function renderWithRouter(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    path = '/',
    ...options
  }: RenderWithRouterOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path={path} element={children} />
        </Routes>
      </MemoryRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}
