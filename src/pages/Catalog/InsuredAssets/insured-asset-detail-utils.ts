import type { InsuredAssetResponse } from '../../../api/catalog'
import { getInsuredAssetAlias } from '../../../api/catalog'
import { getStructuredAddressSearchText } from '../../../utils/address'
import { formatDisplayDate } from '../../../utils/date'
import {
  formatInsuredAssetAddress,
} from './insured-asset-form-utils'

export type InsuredAssetDetailLine = {
  text: string
  muted?: boolean
}

export type InsuredAssetDetailContent = {
  primary: string | null
  lines: InsuredAssetDetailLine[]
}

function joinParts(
  parts: Array<string | null | undefined>,
  separator = ' · ',
): string | null {
  const filtered = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))

  return filtered.length > 0 ? filtered.join(separator) : null
}

function buildDetailLines(
  parts: Array<string | null | undefined>,
  muted = false,
): InsuredAssetDetailLine[] {
  const text = joinParts(parts)
  if (!text) {
    return []
  }

  return muted ? [{ text, muted: true }] : [{ text }]
}

function formatProduction(value: string | null): string | null {
  if (!value?.trim()) {
    return null
  }

  const numeric = Number.parseFloat(value)
  if (!Number.isFinite(numeric)) {
    return value
  }

  return `${new Intl.NumberFormat('es-ES').format(numeric)} kg`
}

export function formatPersonasAssetSummary(
  asset: InsuredAssetResponse,
  getCustomerName: (customerId: string) => string,
): string | null {
  const alias = getInsuredAssetAlias(asset, getCustomerName)
  return alias || null
}

function buildFallbackDetailLines(
  asset: InsuredAssetResponse,
): InsuredAssetDetailLine[] {
  switch (asset.type) {
    case 'Automóvil':
      return buildDetailLines([
        asset.vinNumber,
        asset.manufacturedAt
          ? formatDisplayDate(asset.manufacturedAt)
          : null,
      ])

    case 'Inmueble':
    case 'Instalación':
      return buildDetailLines([
        asset.area != null ? `${asset.area} m²` : null,
        asset.builtAt ? formatDisplayDate(asset.builtAt) : null,
      ])

    case 'Invernadero': {
      const address = formatInsuredAssetAddress(asset)

      return buildDetailLines(
        [
          address !== '—' ? address : null,
          asset.sowedAt ? formatDisplayDate(asset.sowedAt) : null,
        ],
        true,
      )
    }

    case 'SAC':
      return buildDetailLines([
        formatProduction(asset.insuredProduction),
        asset.sowedAt ? formatDisplayDate(asset.sowedAt) : null,
      ])

    case 'Persona/s':
      return []
  }
}

export function getInsuredAssetDetailInlineText(
  asset: InsuredAssetResponse,
  getCustomerName: (customerId: string) => string,
): string | null {
  const content = getInsuredAssetDetailContent(asset, getCustomerName)
  const parts = [
    content.primary,
    ...content.lines.map((line) => line.text),
  ].filter((part): part is string => Boolean(part?.trim()))

  return parts.length > 0 ? parts.join(' · ') : null
}

export function getInsuredAssetDetailContent(
  asset: InsuredAssetResponse,
  getCustomerName: (customerId: string) => string,
): InsuredAssetDetailContent {
  const primary = getInsuredAssetAlias(asset, getCustomerName) || null

  if (asset.aliasDetail?.trim()) {
    return {
      primary,
      lines: [
        {
          text: asset.aliasDetail,
          muted: asset.type === 'Invernadero',
        },
      ],
    }
  }

  return {
    primary,
    lines: buildFallbackDetailLines(asset),
  }
}

export function getInsuredAssetDetailSearchText(
  asset: InsuredAssetResponse,
  getCustomerName: (customerId: string) => string,
): string {
  const content = getInsuredAssetDetailContent(asset, getCustomerName)

  const parts = [
    content.primary,
    ...content.lines.map((line) => line.text),
    asset.alias,
    asset.aliasDetail,
    asset.plateNumber,
    asset.brand,
    asset.model,
    asset.motor,
    asset.color,
    asset.vinNumber,
    asset.manufacturedAt,
    asset.block,
    asset.parcel,
    asset.crop,
    asset.sowedAt,
    asset.builtAt,
    asset.area != null ? String(asset.area) : null,
    asset.insuredProduction,
    asset.gpsCoordinates,
    getStructuredAddressSearchText(asset),
    asset.customerIds
      ?.split(';')
      .map((id) => getCustomerName(id))
      .join(' '),
  ]

  return parts
    .filter((part) => part && part !== '—')
    .join(' ')
}

export function formatInsuredAssetDetailFallback(
  asset: InsuredAssetResponse,
  getCustomerName: (customerId: string) => string,
): string {
  const content = getInsuredAssetDetailContent(asset, getCustomerName)

  if (content.primary) {
    return content.primary
  }

  const firstLine = content.lines[0]?.text
  if (firstLine) {
    return firstLine
  }

  return '—'
}
