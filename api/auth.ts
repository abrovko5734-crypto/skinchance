// Единая serverless-функция Vercel: /api/auth?a=login|callback|logout|me
// Вход через Steam OpenID. Баланс хранится в Redis (Upstash / Vercel KV) и привязан к SteamID. Новый игрок = 0.
import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE = 'sc_session'
const MAX_AGE = 60 * 60 * 24 * 30
const SECRET = () => process.env.SESSION_SECRET || ''
const REDIS_URL = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || ''
const REDIS_TOKEN = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''

type Session = { id: string; name: string; avatar: string; exp: number }

const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } })

async function redis(...cmd: (string | number)[]): Promise<unknown> {
  const r = await fetch(REDIS_URL(), { method: 'POST', headers: { authorization: `Bearer ${REDIS_TOKEN()}`, 'content-type': 'application/json' }, body: JSON.stringify(cmd) })
  const j = (await r.json()) as { result?: unknown; error?: string }
  if (!r.ok || j.error) throw new Error(j.error || 'redis error')
  return j.result
}

const sign = (payload: string) => createHmac('sha256', SECRET()).update(payload).digest('base64url')
function makeCookie(s: Session) {
  const p = Buffer.from(JSON.stringify(s)).toString('base64url')
  return `${COOKIE}=${p}.${sign(p)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`
}
const clearCookie = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
function readSession(req: Request): Session | null {
  const raw = (req.headers.get('cookie') || '').split(/;\s*/).find(c => c.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1)
  if (!raw) return null
  const [p, sig] = raw.split('.')
  if (!p || !sig) return null
  const a = Buffer.from(sig), b = Buffer.from(sign(p))
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const s = JSON.parse(Buffer.from(p, 'base64url').toString()) as Session
    return s.exp > Date.now() / 1000 && /^\d{17}$/.test(s.id) ? s : null
  } catch { return null }
}

async function steamProfile(id: string) {
  try {
    const x = await (await fetch(`https://steamcommunity.com/profiles/${id}?xml=1`)).text()
    const pick = (tag: string) => x.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`))?.[1]?.trim() || ''
    return { name: pick('steamID').slice(0, 40) || 'Player', avatar: pick('avatarFull') }
  } catch { return { name: 'Player', avatar: '' } }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const origin = url.origin
  const a = url.searchParams.get('a')

  if (!SECRET()) return json({ error: 'config', message: 'Не задан SESSION_SECRET' }, 500)

  if (a === 'login') {
    const p = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0', 'openid.mode': 'checkid_setup',
      'openid.return_to': `${origin}/api/auth?a=callback`, 'openid.realm': origin,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select', 'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    })
    return Response.redirect(`https://steamcommunity.com/openid/login?${p}`, 302)
  }

  if (a === 'callback') {
    const fail = (c: string) => Response.redirect(`${origin}/?auth_error=${c}`, 302)
    const sp = url.searchParams
    if (sp.get('openid.mode') !== 'id_res' || sp.get('openid.return_to') !== `${origin}/api/auth?a=callback`) return fail('invalid')
    const id = sp.get('openid.claimed_id')?.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/)?.[1]
    if (!id) return fail('invalid')
    const check = new URLSearchParams()
    sp.forEach((v, k) => { if (k.startsWith('openid.')) check.set(k, v) })
    check.set('openid.mode', 'check_authentication')
    const v = await fetch('https://steamcommunity.com/openid/login', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: check })
    if (!/is_valid\s*:\s*true/.test(await v.text())) return fail('invalid')
    try { // защита от повторного использования ответа Steam
      const nonce = sp.get('openid.response_nonce')
      if (nonce && (await redis('SET', 'nonce:' + nonce, '1', 'NX', 'EX', 600)) === null) return fail('replay')
      await redis('SETNX', `bal:${id}`, '0') // новый игрок — баланс 0
    } catch { return fail('db') }
    const prof = await steamProfile(id)
    return new Response(null, { status: 302, headers: { location: '/', 'set-cookie': makeCookie({ id, ...prof, exp: Math.floor(Date.now() / 1000) + MAX_AGE }) } })
  }

  if (a === 'logout') return new Response(null, { status: 302, headers: { location: '/', 'set-cookie': clearCookie } })

  if (a === 'me') {
    const s = readSession(req)
    if (!s) return json({ user: null }, 401)
    if (!REDIS_URL() || !REDIS_TOKEN()) return json({ error: 'config', message: 'Не подключена база Redis' }, 500)
    try {
      await redis('SETNX', `bal:${s.id}`, '0')
      const bal = Number(await redis('GET', `bal:${s.id}`)) || 0
      return json({ user: { id: s.id, name: s.name, avatar: s.avatar }, balance: bal })
    } catch { return json({ error: 'db', message: 'База недоступна' }, 502) }
  }
  return json({ error: 'bad_request' }, 400)
}
