// Единая serverless-функция Vercel: /api/auth?a=login|callback|logout|me
// Вход через Steam OpenID. Баланс хранится в Redis (Upstash / Vercel KV) и привязан к SteamID. Новый игрок = 0.
import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE = 'sc_session'
const MAX_AGE = 60 * 60 * 24 * 30
const SECRET = () => process.env.SESSION_SECRET || ''
const REDIS_URL = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || ''
const REDIS_TOKEN = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''

type Session = { id: string; name: string; avatar: string; exp: number }
const ADMIN_IDS = () => (process.env.ADMIN_STEAM_IDS || process.env.VITE_ADMIN_STEAM_IDS || '').split(',').map(x => x.trim()).filter(Boolean)
const isAdmin = (id: string) => ADMIN_IDS().includes(id)
const requireSession = (req: Request) => readSession(req)
async function scanKeys(pattern: string) { let cursor = '0'; const keys: string[] = []; for (let n=0;n<100;n++) { const res:any = await redis('SCAN', cursor, 'MATCH', pattern, 'COUNT', 100); cursor = String(res?.[0] ?? '0'); keys.push(...(res?.[1] ?? [])); if(cursor === '0') break } return keys }
async function audit(action: string, actor: string, target = '', detail = '') { await redis('LPUSH','admin:logs',JSON.stringify({at:new Date().toISOString(),action,actor,target,detail})); await redis('LTRIM','admin:logs',0,199) }

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
      await redis('SET', `profile:${id}`, JSON.stringify({id, ...await steamProfile(id), lastLogin: new Date().toISOString()}))
      if (await redis('GET', `ban:${id}`)) return fail('banned')
    } catch { return fail('db') }
    const prof = await steamProfile(id)
    await redis('SET', `profile:${id}`, JSON.stringify({id, ...prof, lastLogin: new Date().toISOString()}))
    return new Response(null, { status: 302, headers: { location: '/', 'set-cookie': makeCookie({ id, ...prof, exp: Math.floor(Date.now() / 1000) + MAX_AGE }) } })
  }

  if (a === 'logout') return new Response(null, { status: 302, headers: { location: '/', 'set-cookie': clearCookie } })
  if (a === 'inventory') {
    const s = readSession(req); if (!s) return json({error:'unauthorized'},401)
    try {
      const r = await fetch(`https://steamcommunity.com/inventory/${s.id}/730/2?l=en&count=5000`, {headers:{'user-agent':'SkinChance inventory reader'}})
      if (!r.ok) return json({error:'steam_inventory',message:'Steam не отдал инвентарь. Убедитесь, что он публичный.'},502)
      const j:any=await r.json(); if(!j.success) return json({error:'private',message:'Инвентарь Steam закрыт или недоступен'},403)
      const desc=new Map((j.descriptions||[]).map((d:any)=>[`${d.classid}_${d.instanceid||'0'}`,d]))
      const items=(j.assets||[]).map((a:any)=>{const d:any=desc.get(`${a.classid}_${a.instanceid||'0'}`);return d?{marketHashName:d.market_hash_name||d.name,quantity:Number(a.amount)||1,icon:d.icon_url||'',tradable:!!d.tradable}:null}).filter((x:any)=>x&&x.marketHashName)
      return json({items, total:items.length})
    } catch { return json({error:'steam_inventory',message:'Не удалось загрузить инвентарь Steam'},502) }
  }

  if (a === 'me') {
    const s = readSession(req)
    if (!s) return json({ user: null }, 401)
    if (!REDIS_URL() || !REDIS_TOKEN()) return json({ error: 'config', message: 'Не подключена база Redis' }, 500)
    try {
      if (await redis('GET', `ban:${s.id}`)) return json({user:null, error:'banned'}, 403)
      await redis('SETNX', `bal:${s.id}`, '0')
      const bal = Number(await redis('GET', `bal:${s.id}`)) || 0
      return json({ user: { id: s.id, name: s.name, avatar: s.avatar }, balance: bal })
    } catch { return json({ error: 'db', message: 'База недоступна' }, 502) }
  }
  if (a === 'admin-stats' || a === 'admin-users' || a === 'admin-logs' || a === 'admin-settings') {
    const s = requireSession(req); if (!s) return json({error:'unauthorized'},401); if (!isAdmin(s.id)) return json({error:'forbidden'},403)
    try {
      if (a === 'admin-stats') {
        const keys = await scanKeys('bal:*'); const total = keys.length; let sum = 0
        for (const k of keys) { const b = Number(await redis('GET', k)) || 0; sum += b }
        const upg = Number(await redis('GET','stats:upgrades')) || 0
        return json({users:total, balanceTotal:sum, upgrades:upg, upgradeTracking:upg>0, online:'Redis connected'})
      }
      if (a === 'admin-users') {
        const query = url.searchParams.get('q') || ''; if (!/^\d{17}$/.test(query)) return json({error:'Введите SteamID64'},400)
        const bal = Number(await redis('GET',`bal:${query}`)) || 0; const raw = await redis('GET',`profile:${query}`); const profile = raw ? JSON.parse(String(raw)) : {id:query,name:'Не найден в базе',avatar:''}
        return json({user:{...profile,balance:bal,banned:!!(await redis('GET',`ban:${query}`))}})
      }
      if (a === 'admin-logs') { const rows:any = await redis('LRANGE','admin:logs',0,99); return json({logs:(rows||[]).map((x:any)=>{try{return JSON.parse(x)}catch{return {detail:String(x)}}})}) }
      const raw = await redis('GET','settings:clover'); return json({clover:raw===null?5:Number(raw)})
    } catch(e) { return json({error:'db',message:'Не удалось прочитать Redis'},502) }
  }
  if (a === 'admin-action' && req.method === 'POST') {
    const s = requireSession(req); if (!s) return json({error:'unauthorized'},401); if (!isAdmin(s.id)) return json({error:'forbidden'},403)
    try { const body:any = await req.json(); const target=String(body.target||''); const action=String(body.action||'');
      if(action==='set-balance'||action==='add-balance') { if(!/^\d{17}$/.test(target)) return json({error:'Неверный SteamID64'},400); const amount=Number(body.amount); if(!Number.isFinite(amount)||amount<0||amount>10000000) return json({error:'Некорректная сумма'},400); if(action==='set-balance') await redis('SET',`bal:${target}`,amount.toFixed(2)); else await redis('INCRBYFLOAT',`bal:${target}`,amount); await audit(action,s.id,target,String(amount)); return json({ok:true,balance:Number(await redis('GET',`bal:${target}`))}) }
      if(action==='ban'||action==='unban') { if(!/^\d{17}$/.test(target)) return json({error:'Неверный SteamID64'},400); if(action==='ban') await redis('SET',`ban:${target}`,JSON.stringify({by:s.id,at:new Date().toISOString(),reason:String(body.reason||'Администратор')})); else await redis('DEL',`ban:${target}`); await audit(action,s.id,target,String(body.reason||'')); return json({ok:true}) }
      if(action==='set-clover') { const pct=Number(body.percent); if(!Number.isFinite(pct)||pct<0||pct>100) return json({error:'Шанс должен быть 0–100'},400); await redis('SET','settings:clover',pct); await audit(action,s.id,'',String(pct)); return json({ok:true,clover:pct}) }
      return json({error:'unknown_action'},400)
    } catch(e) { return json({error:'db',message:'Действие не выполнено'},502) }
  }
  return json({ error: 'bad_request' }, 400)
}

// Vercel routes POST requests to this export; share the same action dispatcher.
export async function POST(req: Request) { return GET(req) }
