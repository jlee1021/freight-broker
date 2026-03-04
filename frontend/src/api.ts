// 로컬: 프록시 사용. 그 외(같은 호스트 배포 시 Railway 등): 같은 origin의 /api/v1 사용
const _isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

const API_BASE = _isLocal
  ? '/api/v1'
  : `${window.location.origin}/api/v1`

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function setToken(token: string): void {
  localStorage.setItem('token', token)
}

export function clearToken(): void {
  localStorage.removeItem('token')
}

export function buildUrl(url: string): string {
  if (url.startsWith('http')) return url
  return url.startsWith(API_BASE) ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(buildUrl(url), { ...options, headers })
  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    let msg = res.statusText
    try {
      const body = await res.json()
      if (body?.detail) msg = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch {
      try { msg = await res.text() || msg } catch { /* ignore */ }
    }
    throw new Error(msg)
  }
  return res
}

export async function apiJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(url, options)
  return res.json()
}
