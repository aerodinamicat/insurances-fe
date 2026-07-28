import { useEffect, useState } from 'react'
import { apiClient } from '../../api/client'
import { apiUrl } from '../../config/env'
import './HomePage.css'

type HealthStatus = 'checking' | 'ok' | 'unavailable'

export function HomePage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('checking')

  useEffect(() => {
    let cancelled = false

    apiClient<{ status?: string }>('/health')
      .then(() => {
        if (!cancelled) {
          setHealthStatus('ok')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHealthStatus('unavailable')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="page page--centered">
      <h1>Insurances</h1>
      <p className="page__subtitle">Application scaffold — router active</p>

      <dl className="meta">
        <div className="meta-row">
          <dt>API URL</dt>
          <dd>
            <code>{apiUrl}</code>
          </dd>
        </div>
        <div className="meta-row">
          <dt>Backend health</dt>
          <dd>
            {healthStatus === 'checking' && 'Checking…'}
            {healthStatus === 'ok' && 'OK'}
            {healthStatus === 'unavailable' && 'Unavailable'}
          </dd>
        </div>
      </dl>
    </main>
  )
}
