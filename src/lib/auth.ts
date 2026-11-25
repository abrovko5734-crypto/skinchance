export interface User {
  id: string
  name: string
  avatar: string
}

export type AuthState =
  | { status: 'loading' }
  | { status: 'out'; error?: string }
  | { status: 'in'; user: User; balance: number }

const GUEST: User = {
  id: 'guest-local',
  name: 'Игрок',
  avatar: '',
}

/** Локальный гостевой режим — работает без сервера. */
export async function fetchMe(): Promise<AuthState> {
  try {
    const r = await fetch('/api/auth?a=me', { credentials: 'same-origin' })
    if (r.status === 401) {
      // fallback to guest
      return { status: 'in', user: GUEST, balance: 0 }
    }
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return { status: 'in', user: GUEST, balance: 0 }
    return { status: 'in', user: j.user, balance: j.balance ?? 0 }
  } catch {
    // Offline / no backend → guest with local balance
    return { status: 'in', user: GUEST, balance: 0 }
  }
}

export function isGuest(u: User) {
  return u.id === 'guest-local'
}
