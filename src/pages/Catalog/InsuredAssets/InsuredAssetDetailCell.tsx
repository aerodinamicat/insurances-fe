import type { InsuredAssetResponse } from '../../../api/catalog'
import { getInsuredAssetDetailInlineText } from './insured-asset-detail-utils'
import './InsuredAssetDetailCell.css'

type InsuredAssetDetailCellProps = {
  asset: InsuredAssetResponse
  getCustomerName: (customerId: string) => string
}

export function InsuredAssetDetailCell({
  asset,
  getCustomerName,
}: InsuredAssetDetailCellProps) {
  const text = getInsuredAssetDetailInlineText(asset, getCustomerName)

  if (!text) {
    return (
      <span className="insured-asset-detail-cell insured-asset-detail-cell--empty">
        —
      </span>
    )
  }

  return (
    <span className="insured-asset-detail-cell insured-asset-detail-cell__inline">
      {text}
    </span>
  )
}
