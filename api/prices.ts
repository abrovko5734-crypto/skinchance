// Steam Community Market priceoverview proxy for CS2 (appid 730).
// The public Steam endpoint is undocumented and rate-limited; responses are cached briefly.
const cache = new Map<string, { at: number; value: number | null }>()

function parsePrice(raw: unknown): number | null {
  if (typeof raw !== 'string') return null
  const normalized = raw.replace(/[^0-9,.-]/g, '').trim()
  if (!normalized) return null
  // Steam's country=US response uses a dot decimal separator.
  const n = Number(normalized.replace(/,/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

async function getPrice(name: string): Promise<number | null> {
  const hit = cache.get(name)
  if (hit && Date.now() - hit.at < 120_000) return hit.value
  const url = new URL('https://steamcommunity.com/market/priceoverview/')
  url.search = new URLSearchParams({ country: 'US', currency: '1', appid: '730', market_hash_name: name }).toString()
  try {
    const response = await fetch(url, { headers: { 'user-agent': 'SkinChance/1.0' } })
    if (!response.ok) return null
    const data = await response.json() as { success?: boolean; lowest_price?: string }
    const value = data.success ? parsePrice(data.lowest_price) : null
    cache.set(name, { at: Date.now(), value })
    return value
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  let body: { names?: unknown }
  try { body = await req.json() as { names?: unknown } } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'content-type': 'application/json' } }) }
  const names = Array.isArray(body.names) ? [...new Set(body.names.filter((x): x is string => typeof x === 'string').map(x => x.trim()).filter(Boolean))].slice(0, 20) : []
  if (!names.length) return new Response(JSON.stringify({ prices: {}, currency: 'USD', source: 'Steam Community Market' }), { headers: { 'content-type': 'application/json' } })
  const prices: Record<string, number | null> = {}
  // Keep concurrency deliberately low to respect Steam's public endpoint limits.
  for (let i = 0; i < names.length; i += 2) {
    const batch = names.slice(i, i + 2)
    const values = await Promise.all(batch.map(getPrice))
    batch.forEach((name, index) => { prices[name] = values[index] })
  }
  return new Response(JSON.stringify({ prices, currency: 'USD', source: 'Steam Community Market', fetchedAt: new Date().toISOString() }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
}
