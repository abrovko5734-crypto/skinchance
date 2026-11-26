export interface User {
  id: string
  name: string
  avatar: string
}

export type AuthState =
  | { status: 'loading' }
  | { status: 'out'; error?: string }
  | { status: 'in'; user: User; balance: number }

/** Steam IDs from VITE_ADMIN_STEAM_IDS (comma-separated) */
export function getAdminIds(): string[] {
  const raw = (import.meta.env.VITE_ADMIN_STEAM_IDS as string) || ''
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false
  const ids = getAdminIds()
  if (ids.length === 0) return false
  return ids.includes(String(user.id))
}

export async function fetchMe(): Promise<AuthState> {
  try {
    const r = await fetch('/api/auth?a=me', { credentials: 'same-origin' })
    if (r.status === 401) return { status: 'out' }
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return { status: 'out', error: j.message || 'Сервер недоступен' }
    return { status: 'in', user: j.user, balance: j.balance ?? 0 }
  } catch {
    return { status: 'out', error: 'Нужен вход через Steam. Локально: vercel dev' }
  }
}
