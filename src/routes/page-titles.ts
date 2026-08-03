const SECTION_TITLES: Array<{
  matches: (pathname: string) => boolean
  title: string
}> = [
  { matches: (pathname) => pathname === '/login', title: 'Inicio de sesión' },
  {
    matches: (pathname) => pathname === '/confirm-email',
    title: 'Confirmar email',
  },
  {
    matches: (pathname) => pathname === '/change-password',
    title: 'Cambiar contraseña',
  },
  {
    matches: (pathname) => pathname === '/onboarding',
    title: 'Activación de cuenta',
  },
  { matches: (pathname) => pathname === '/dashboard', title: 'Dashboard' },
  { matches: (pathname) => pathname === '/profile', title: 'Mi perfil' },
  {
    matches: (pathname) => pathname === '/backoffice/users',
    title: 'Usuarios',
  },
  {
    matches: (pathname) =>
      /^\/catalog\/customers\/[^/]+$/.test(pathname),
    title: 'Detalle de cliente',
  },
  {
    matches: (pathname) => pathname === '/catalog/customers',
    title: 'Clientes',
  },
  {
    matches: (pathname) => pathname === '/catalog/assurance-companies',
    title: 'Aseguradoras',
  },
  {
    matches: (pathname) => pathname === '/catalog/contacts',
    title: 'Contactos',
  },
  {
    matches: (pathname) =>
      /^\/catalog\/insurance-policies\/[^/]+$/.test(pathname),
    title: 'Detalle de póliza',
  },
  {
    matches: (pathname) => pathname === '/catalog/insurance-policies',
    title: 'Pólizas',
  },
  {
    matches: (pathname) => pathname === '/catalog/insured-assets',
    title: 'Bienes asegurados',
  },
  {
    matches: (pathname) => pathname === '/catalog/attachments',
    title: 'Documentos',
  },
]

export function getSectionTitle(pathname: string): string | undefined {
  return SECTION_TITLES.find(({ matches }) => matches(pathname))?.title
}
