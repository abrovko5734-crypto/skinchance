export interface User { id: string; name: string; avatar: string }
export type AuthState = { status: 'loading' } | { status: 'out'; error?: string } | { status: 'in'; user: User; balance: number }

export async function fetchMe(): Promise<AuthState> {
  try {
    const r = await fetch('/api/auth?a=me', { credentials: 'same-origin' })
    if (r.status === 401) return { status: 'out' }
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return { status: 'out', error: j.message || 'Сервер недоступен' }
    return { status: 'in', user: j.user, balance: j.balance }
  } catch { return { status: 'out', error: 'Сервер недоступен (локально запускайте через «vercel dev»)' } }
}
