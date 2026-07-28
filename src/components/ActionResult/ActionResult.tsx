import { Link } from 'react-router-dom'

export type ActionResultStatus = 'loading' | 'success' | 'error'

export type ActionResultCta =
  | {
      label: string
      to: string
      href?: never
      onClick?: never
    }
  | {
      label: string
      href: string
      to?: never
      onClick?: never
    }
  | {
      label: string
      onClick: () => void
      to?: never
      href?: never
    }

export type ActionResultProps = {
  status: ActionResultStatus
  loadingMessage?: string
  successMessage?: string | null
  errorMessage?: string | null
  successHint?: string | null
  cta?: ActionResultCta
}

function ActionResultCtaLink({ cta }: { cta: ActionResultCta }) {
  if ('to' in cta && cta.to) {
    return (
      <Link className="auth-page__link" to={cta.to}>
        {cta.label}
      </Link>
    )
  }

  if ('href' in cta && cta.href) {
    return (
      <a className="auth-page__link" href={cta.href}>
        {cta.label}
      </a>
    )
  }

  return (
    <button
      type="button"
      className="auth-page__link auth-page__link-button"
      onClick={cta.onClick}
    >
      {cta.label}
    </button>
  )
}

export function ActionResult({
  status,
  loadingMessage = 'Processing…',
  successMessage = null,
  errorMessage = null,
  successHint = null,
  cta,
}: ActionResultProps) {
  return (
    <>
      {status === 'loading' && (
        <p className="auth-page__status">{loadingMessage}</p>
      )}

      {status === 'success' && successMessage && (
        <>
          <div className="auth-alert auth-alert--success" role="status">
            {successMessage}
          </div>
          {successHint && (
            <p className="auth-page__status">{successHint}</p>
          )}
        </>
      )}

      {status === 'error' && errorMessage && (
        <div className="auth-alert auth-alert--error" role="alert">
          {errorMessage}
        </div>
      )}

      {status !== 'loading' && cta && (
        <p className="auth-page__footer">
          <ActionResultCtaLink cta={cta} />
        </p>
      )}
    </>
  )
}
