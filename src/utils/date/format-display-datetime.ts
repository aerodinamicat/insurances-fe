const DISPLAY_DATETIME_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatDisplayDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return DISPLAY_DATETIME_FORMATTER.format(date)
}
