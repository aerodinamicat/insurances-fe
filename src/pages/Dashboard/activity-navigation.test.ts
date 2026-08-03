import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ENTITY_LABELS,
  ACTIVITY_FILTER_OPTIONS,
  resolveActivityDestination,
} from './activity-navigation'

describe('activity navigation', () => {
  it.each([
    ['customer', '/catalog/customers/id%20with%20spaces'],
    ['assurance-company', '/catalog/assurance-companies'],
    ['contact', '/catalog/contacts'],
    ['insurance-policy', '/catalog/insurance-policies/id%20with%20spaces'],
    ['insured-asset', '/catalog/insured-assets'],
    ['attachment', '/catalog/attachments'],
  ] as const)('resolves %s to its supported destination', (entityType, expected) => {
    expect(resolveActivityDestination(entityType, 'id with spaces')).toBe(expected)
  })

  it('falls back to the dashboard for an unknown backend value', () => {
    expect(resolveActivityDestination('future-entity', 'id')).toBe('/dashboard')
  })

  it('defines Spanish labels and the expected filter order', () => {
    expect(ACTIVITY_ENTITY_LABELS).toEqual({
      customer: 'Cliente',
      'assurance-company': 'Aseguradora',
      contact: 'Contacto',
      'insurance-policy': 'Póliza',
      'insured-asset': 'Bien asegurado',
      attachment: 'Documento',
    })
    expect(ACTIVITY_ACTION_LABELS).toEqual({
      created: 'Creado',
      updated: 'Actualizado',
    })
    expect(ACTIVITY_FILTER_OPTIONS.map(({ value }) => value)).toEqual([
      'all',
      'customer',
      'assurance-company',
      'contact',
      'insurance-policy',
      'insured-asset',
      'attachment',
    ])
  })
})
