const DISPLAY_DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
})

export function formatDisplayDate(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) {
    return value
  }

  return DISPLAY_DATE_FORMATTER.format(new Date(year, month - 1, day))
}
