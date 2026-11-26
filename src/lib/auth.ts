export interface User {
  id: string
  name: string
  avatar: string
}

export type AuthState =
  | { status: 'loading' }
  | { status: 'out'; error?: string }
  | { status: 'in'; user: User; balance: number; admin?: boolean }

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
    return { status: 'in', user: j.user, balance: j.balance ?? 0, admin: !!j.admin }
  } catch {
    return { status: 'out', error: 'Нужен вход через Steam. Локально: vercel dev' }
  }
}

/** Изменить баланс текущего пользователя (кейсы / продажа). Возвращает новый баланс. */
export async function deltaBalance(amount: number): Promise<{ ok: true; balance: number } | { ok: false; message: string; balance?: number }> {
  try {
    const r = await fetch('/api/auth?a=delta', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return { ok: false, message: j.message || 'Ошибка баланса', balance: j.balance }
    return { ok: true, balance: Number(j.balance) || 0 }
  } catch {
    return { ok: false, message: 'Сеть недоступна' }
  }
}

/** Админ: выдать DP любому SteamID */
export async function adminCredit(
  steamId: string,
  amount: number,
): Promise<{ ok: true; balance: number; targetId: string } | { ok: false; message: string }> {
  try {
    const r = await fetch('/api/auth?a=credit', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ steamId, amount }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return { ok: false, message: j.message || 'Ошибка выдачи' }
    return { ok: true, balance: Number(j.balance) || 0, targetId: j.targetId }
  } catch {
    return { ok: false, message: 'Сеть недоступна' }
  }
}

/** Админ: узнать баланс любого SteamID */
export async function adminBalance(
  steamId: string,
): Promise<{ ok: true; balance: number; targetId: string } | { ok: false; message: string }> {
  try {
    const r = await fetch('/api/auth?a=balance', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ steamId }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return { ok: false, message: j.message || 'Ошибка запроса' }
    return { ok: true, balance: Number(j.balance) || 0, targetId: j.targetId }
  } catch {
    return { ok: false, message: 'Сеть недоступна' }
  }
}

/** Админ: установить баланс игрока точно */
export async function adminSet(
  steamId: string,
  amount: number,
): Promise<{ ok: true; balance: number; targetId: string } | { ok: false; message: string }> {
  try {
    const r = await fetch('/api/auth?a=set', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ steamId, amount }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return { ok: false, message: j.message || 'Ошибка установки' }
    return { ok: true, balance: Number(j.balance) || 0, targetId: j.targetId }
  } catch {
    return { ok: false, message: 'Сеть недоступна' }
  }
}
