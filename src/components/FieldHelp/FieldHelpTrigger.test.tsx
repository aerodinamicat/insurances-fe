import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { FieldHelpTrigger } from './FieldHelpTrigger'

describe('FieldHelpTrigger', () => {
  it('exposes help text through an accessible trigger', async () => {
    const user = userEvent.setup()

    render(
      <FieldHelpTrigger id="cnae-help" label="Ayuda sobre CNAE">
        Clasificación Nacional de Actividades Económicas
      </FieldHelpTrigger>,
    )

    const trigger = screen.getByRole('button', { name: 'Ayuda sobre CNAE' })
    expect(trigger).toHaveAttribute('aria-controls', 'cnae-help')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Clasificación Nacional de Actividades Económicas',
    )
  })
})
