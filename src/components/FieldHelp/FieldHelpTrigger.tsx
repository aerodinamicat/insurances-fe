import {
  useId,
  useState,
  type FocusEvent,
  type ReactNode,
} from 'react'

import './FieldHelpTrigger.css'

export type FieldHelpTriggerProps = {
  /** Stable id for `aria-describedby` on the related control. */
  id?: string
  /** Accessible name for the trigger button. */
  label: string
  children: ReactNode
}

export function FieldHelpTrigger({
  id,
  label,
  children,
}: FieldHelpTriggerProps): ReactNode {
  const generatedId = useId()
  const tooltipId = id ?? generatedId
  const [open, setOpen] = useState(false)

  function handleBlur(event: FocusEvent<HTMLSpanElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpen(false)
    }
  }

  return (
    <span className="field-help" onBlur={handleBlur}>
      <button
        type="button"
        className="field-help__trigger"
        aria-label={label}
        aria-expanded={open}
        aria-controls={tooltipId}
        onClick={() => setOpen((current) => !current)}
      >
        i
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className={`field-help__tooltip${open ? ' field-help__tooltip--open' : ''}`}
      >
        {children}
      </span>
    </span>
  )
}
