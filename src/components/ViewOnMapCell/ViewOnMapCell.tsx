import '../../pages/Catalog/catalog-shared.css'
import { getGpsCoordinatesLinkState } from '../../utils/gps'
import './ViewOnMapCell.css'

type ViewOnMapCellProps = {
  gpsCoordinates: string | null | undefined
}

export function ViewOnMapCell({ gpsCoordinates }: ViewOnMapCellProps) {
  const trimmed = gpsCoordinates?.trim()

  if (!trimmed) {
    return <span className="view-on-map-cell view-on-map-cell--empty">—</span>
  }

  const linkState = getGpsCoordinatesLinkState(trimmed)

  if (linkState.canOpen && linkState.url) {
    return (
      <a
        className="catalog-table-action-btn"
        href={linkState.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        Visualizar
      </a>
    )
  }

  return (
    <button
      type="button"
      className="catalog-table-action-btn"
      disabled
      aria-disabled="true"
    >
      Visualizar
    </button>
  )
}
