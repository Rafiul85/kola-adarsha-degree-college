import { useCallback, useEffect, useState } from 'react'

export class ApiError extends Error {
  status: number
  code: string
  details: unknown

  constructor(message: string, status: number, code = '', details: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Accept', 'application/json')
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...init,
    headers,
  })
  const contentType = response.headers.get('content-type') || ''
  let payload: unknown = null
  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null)
  }
  if (!response.ok) {
    const data = payload as { error?: string; code?: string; details?: unknown } | null
    throw new ApiError(
      data?.error || `অনুরোধ ব্যর্থ হয়েছে (${response.status})।`,
      response.status,
      data?.code || '',
      data?.details || null,
    )
  }
  return payload as T
}

export function jsonRequest(method: string, body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) }
}

export interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string
  reload: () => void
}

export function useApi<T>(path: string | null): ApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(Boolean(path))
  const [error, setError] = useState('')
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!path) {
      setData(null)
      setLoading(false)
      setError('')
      return
    }
    const controller = new AbortController()
    let active = true
    setLoading(true)
    setError('')
    api<T>(path, { signal: controller.signal })
      .then((result) => {
        if (!active) return
        setData(result)
      })
      .catch((err: unknown) => {
        if (!active) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'তথ্য লোড করা যায়নি।')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [path, nonce])

  const reload = useCallback(() => setNonce((value) => value + 1), [])
  return { data, loading, error, reload }
}
