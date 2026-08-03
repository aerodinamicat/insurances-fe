import { describe, expect, it } from 'vitest'
import { buildDocumentTitle } from '../config/branding'
import { getSectionTitle } from './page-titles'

describe('page titles', () => {
  it.each([
    ['/login', 'Inicio de sesión'],
    ['/dashboard', 'Dashboard'],
    ['/profile', 'Mi perfil'],
    ['/catalog/customers', 'Clientes'],
    ['/catalog/customers/customer-1', 'Detalle de cliente'],
    ['/catalog/insurance-policies', 'Pólizas'],
    ['/catalog/insurance-policies/policy-1', 'Detalle de póliza'],
    ['/catalog/attachments', 'Documentos'],
    ['/backoffice/users', 'Usuarios'],
  ])('maps %s to its section title', (pathname, section) => {
    expect(getSectionTitle(pathname)).toBe(section)
    expect(buildDocumentTitle(section)).toBe(
      `LLA - Correduría de seguros - ${section}`,
    )
  })

  it('uses only the product title for unknown routes', () => {
    expect(buildDocumentTitle(getSectionTitle('/unknown'))).toBe(
      'LLA - Correduría de seguros',
    )
  })
})
