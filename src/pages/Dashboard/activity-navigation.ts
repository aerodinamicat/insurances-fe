import {
  ACTIVITY_ENTITY_TYPES,
  type ActivityAction,
  type ActivityEntityType,
} from '../../api/activity'

export const ACTIVITY_ENTITY_LABELS: Record<ActivityEntityType, string> = {
  customer: 'Cliente',
  'assurance-company': 'Aseguradora',
  contact: 'Contacto',
  'insurance-policy': 'Póliza',
  'insured-asset': 'Bien asegurado',
  attachment: 'Documento',
}

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  created: 'Creado',
  updated: 'Actualizado',
}

export const ACTIVITY_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  ...ACTIVITY_ENTITY_TYPES.map((value) => ({
    value,
    label: ACTIVITY_ENTITY_LABELS[value],
  })),
] as const

const CATALOG_DESTINATIONS: Record<
  Exclude<ActivityEntityType, 'customer' | 'insurance-policy'>,
  string
> = {
  'assurance-company': '/catalog/assurance-companies',
  contact: '/catalog/contacts',
  'insured-asset': '/catalog/insured-assets',
  attachment: '/catalog/attachments',
}

export function resolveActivityDestination(
  entityType: ActivityEntityType | string,
  entityId: string,
): string {
  switch (entityType) {
    case 'customer':
      return `/catalog/customers/${encodeURIComponent(entityId)}`
    case 'insurance-policy':
      return `/catalog/insurance-policies/${encodeURIComponent(entityId)}`
    case 'assurance-company':
    case 'contact':
    case 'insured-asset':
    case 'attachment':
      return CATALOG_DESTINATIONS[entityType]
    default:
      return '/dashboard'
  }
}
