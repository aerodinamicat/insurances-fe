export const COMPANY_NAME = 'López Larios Asesores SL'
export const COMPANY_ACRONYM = 'LLA'
export const PROJECT_NAME = 'Correduría de Seguros'
export const DOCUMENT_TITLE_PREFIX = `${COMPANY_ACRONYM} - Correduría de seguros`

export function buildDocumentTitle(section?: string): string {
  return section
    ? `${DOCUMENT_TITLE_PREFIX} - ${section}`
    : DOCUMENT_TITLE_PREFIX
}
