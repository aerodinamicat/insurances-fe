import { apiUrl } from '../config/env'

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type ApiAuthConfig = {
  getAccessToken: () => string | null
  onAccessTokenRenewed: (token: string) => void
  onUnauthorized: () => void
}

let authConfig: ApiAuthConfig = {
  getAccessToken: () => null,
  onAccessTokenRenewed: () => {},
  onUnauthorized: () => {},
}

export function configureApiAuth(config: ApiAuthConfig): void {
  authConfig = config
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  params?: Record<string, string | number | boolean | undefined | null>
  /** Attach Authorization header when a token exists (default: true). */
  auth?: boolean
  /** How to parse a successful response body (default: json). */
  parseAs?: 'json' | 'blob'
  /** When true, 401 is surfaced as ApiError instead of clearing the session. */
  allowUnauthorized?: boolean
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = path.startsWith('http') ? new URL(path) : new URL(`${apiUrl}${normalizedPath}`)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value != null) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url.toString()
}

function extractRenewedAccessToken(response: Response): string | null {
  const xAccessToken = response.headers.get('X-Access-Token')?.trim()
  if (xAccessToken) {
    return xAccessToken
  }

  const authorization = response.headers.get('Authorization')?.trim()
  if (authorization?.toLowerCase().startsWith('bearer ')) {
    return authorization.slice('Bearer '.length).trim()
  }

  return null
}

async function parseResponse<T>(
  response: Response,
  parseAs: RequestOptions['parseAs'] = 'json',
): Promise<T> {
  const contentType = response.headers.get('content-type')
  const isJson = contentType?.includes('application/json')

  if (!response.ok) {
    const body = isJson ? await response.json() : await response.text()
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
        : response.statusText
    throw new ApiError(message, response.status, body)
  }

  if (parseAs === 'blob') {
    return (await response.blob()) as T
  }

  const hasBody = response.status !== 204 && response.status !== 205
  const body = hasBody
    ? isJson
      ? await response.json()
      : await response.text()
    : undefined

  return body as T
}

export async function apiClient<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    body,
    params,
    headers,
    auth = true,
    parseAs = 'json',
    allowUnauthorized = false,
    ...init
  } = options
  const accessToken = auth ? authConfig.getAccessToken() : null
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  const response = await fetch(buildUrl(path, params), {
    ...init,
    headers: {
      ...(body !== undefined && !isFormData
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body:
      body !== undefined
        ? isFormData
          ? body
          : JSON.stringify(body)
        : undefined,
  })

  const renewedToken = extractRenewedAccessToken(response)
  if (renewedToken) {
    authConfig.onAccessTokenRenewed(renewedToken)
  }

  if (response.status === 401 && accessToken && !allowUnauthorized) {
    authConfig.onUnauthorized()
    throw new ApiError('Unauthorized', 401)
  }

  return parseResponse<T>(response, parseAs)
}
