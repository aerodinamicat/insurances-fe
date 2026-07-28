import type { InsuredAssetResponse } from '../../../api/catalog'
import { CatalogCombobox } from './CatalogCombobox'
import { getAssetSummary } from '../InsuredAssets/insured-asset-form-utils'

type InsuredAssetComboboxProps = {
  assets: InsuredAssetResponse[]
  value: string | null
  onChange: (assetId: string | null) => void
  label: string
  disabled?: boolean
  required?: boolean
  allowEmpty?: boolean
  emptyLabel?: string
  isLoading?: boolean
  openOnFocus?: boolean
  feedbackId?: string
  fieldError?: string | null
  onFieldBlur?: () => void
}

function getAssetLabel(asset: InsuredAssetResponse): string {
  const summary = getAssetSummary(asset)
  return summary && summary !== '—' ? `${asset.type}: ${summary}` : asset.type
}

export function InsuredAssetCombobox({
  assets,
  value,
  onChange,
  label,
  disabled = false,
  required = false,
  allowEmpty = false,
  emptyLabel = 'Todos los bienes',
  isLoading = false,
  openOnFocus = true,
  feedbackId,
  fieldError = null,
  onFieldBlur,
}: InsuredAssetComboboxProps) {
  return (
    <CatalogCombobox
      items={assets}
      value={value}
      onChange={onChange}
      label={label}
      getItemLabel={(asset) => asset.type}
      getItemMetaItems={(asset) => [{ value: getAssetSummary(asset) }]}
      getItemSearchText={getAssetLabel}
      disabled={disabled}
      required={required}
      allowEmpty={allowEmpty}
      emptyLabel={emptyLabel}
      emptyMessage="No se encontraron bienes asegurados."
      isLoading={isLoading}
      openOnFocus={openOnFocus}
      placeholder="Buscar bien asegurado…"
      feedbackId={feedbackId}
      fieldError={fieldError}
      onFieldBlur={onFieldBlur}
    />
  )
}
