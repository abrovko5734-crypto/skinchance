import { EMPTY_QUERY, RARITIES, type Item, type Query, type Category, type Wear } from './types'

export interface CatalogProvider { load(): Promise<Item[]> }
export interface PriceProvider { load(): Promise<Record<string, number>> }
const WEAR: Record<string, Wear> = { 'factory new':'Factory New', 'minimal wear':'Minimal Wear', 'field-tested':'Field-Tested', 'well-worn':'Well-Worn', 'battle-scarred':'Battle-Scarred' }
const categoryFor = (raw: any, weaponName = ''): Category => { const c = String(raw?.name ?? raw ?? '').toLowerCase(); const w=weaponName.toLowerCase(); return (c.includes('knife') || c.includes('kniv') || w.includes('knife') || w.includes('bayonet') || w.includes('karambit') || w.includes('dagger')) ? 'knife' : (c.includes('glove') || w.includes('glove')) ? 'gloves' : 'weapon' }
const pickImage = (r: any) => r.image ?? r.images?.find?.((x:any)=>x?.url)?.url ?? r.images?.[0]?.url ?? r.images?.[0] ?? r.weapon?.image_url ?? r.weapon?.thumbnail_url ?? null
const mapRow = (r: any): Item => {
  const weapon = r.weapon?.name ?? r.weapon_name ?? r.weapon ?? r.category?.name ?? 'Item'
  const skin = r.name ?? r.pattern?.name ?? r.skin ?? 'Unknown'
  const wearKey = String(r.exterior ?? r.wear?.name ?? '').toLowerCase().replace(/-/g, ' ').replace(/_/g, ' '); const wear = WEAR[wearKey] ?? null
  const name = r.full_name ?? r.market_hash_name ?? `${weapon} | ${skin}${wear ? ` (${wear})` : ''}`
  const prices = Array.isArray(r.prices) ? r.prices : (r.prices && typeof r.prices === 'object' ? Object.values(r.prices) : [])
  const priceRows = prices.map((p:any) => Number(p.price ?? p.sellPrice ?? p.min_price ?? p.lowest_price ?? p.lowestPrice)).filter((n:number) => Number.isFinite(n) && n > 0)
  const price = priceRows.length ? Math.min(...priceRows) : (Number(r.price) > 0 ? Number(r.price) : null)
  const cat = categoryFor(r.weapon?.category ?? r.category, String(weapon))
  return { id: String(r.id ?? r.market_hash_name ?? name), name, weapon: String(weapon), skin: String(skin), category: cat,
    rarity: r.rarity?.name ?? r.rarity ?? '', wear, stattrak: !!(r.is_stattrak ?? r.stattrak), souvenir: !!(r.is_souvenir ?? r.souvenir),
    collection: r.collections?.[0]?.name ?? r.collection ?? '', image: pickImage(r), price, priceSource: price == null ? null : 'market' }
}

/** Live public CS2 catalogue + prices. API pages are fetched with conservative concurrency and cached in memory. */
export const publicCatalogProvider: CatalogProvider = { async load() {
  const base = 'https://seekskins.com/api/skins?limit=250&lang=en'
  const first = await fetch(`${base}&page=1`, { signal: AbortSignal.timeout(12000) }); if (!first.ok) throw new Error(`CS2 каталог: HTTP ${first.status}`)
  const firstJson: any = await first.json(); if (!firstJson.success || !Array.isArray(firstJson.data)) throw new Error('CS2 каталог вернул неизвестный формат')
  const pages = Math.min(Number(firstJson.pagination?.totalPages) || 1, 8)
  const rows: any[] = [...firstJson.data]
  let next = 2
  const workers = Array.from({length: 4}, async () => { while (next <= pages) { const page = next++; const res = await fetch(`${base}&page=${page}`, { signal: AbortSignal.timeout(12000) }); if (!res.ok) continue; const j:any = await res.json(); if (Array.isArray(j.data)) rows.push(...j.data) } })
  await Promise.all(workers)
  return rows.map(mapRow)
} }

const rank = (r: string) => RARITIES.indexOf(r as never)
class ItemCatalog {
  private cache?: Promise<Item[]>
  constructor(private provider: CatalogProvider) {}
  all(): Promise<Item[]> { return (this.cache ??= this.provider.load().catch(e => { this.cache=undefined; throw e })) }
  async weapons() { return [...new Set((await this.all()).map(i => i.weapon))].sort() }
  async getMany(ids: string[]) { const s = new Set(ids); return (await this.all()).filter(i => s.has(i.id)) }
  async search(q: Query = EMPTY_QUERY): Promise<Item[]> {
    const tokens = q.text.toLowerCase().split(/\s+/).filter(Boolean)
    const out = (await this.all()).filter(i => {
      const n = i.name.toLowerCase()
      if (q.category !== 'all' && i.category !== q.category) return false
      if (q.weapon && i.weapon !== q.weapon) return false
      if (q.rarity && i.rarity !== q.rarity) return false
      if (q.wear && i.wear !== q.wear) return false
      if (q.special === 'stattrak' && !i.stattrak) return false
      if (q.special === 'souvenir' && !i.souvenir) return false
      if (q.min != null && (i.price ?? -1) < q.min) return false
      if (q.max != null && (i.price ?? Infinity) > q.max) return false
      return tokens.every(t => n.includes(t))
    })
    const by: Record<Query['sort'], (a: Item, b: Item) => number> = {
      'price-desc': (a,b) => (b.price ?? -1)-(a.price ?? -1), 'price-asc': (a,b) => (a.price ?? Infinity)-(b.price ?? Infinity),
      name: (a,b) => a.name.localeCompare(b.name), rarity: (a,b) => rank(b.rarity)-rank(a.rarity) }
    return out.sort(by[q.sort])
  }
  async closest(max: number, min: number, fallback: Item): Promise<Item> { const c=(await this.all()).filter(i=>i.price!=null&&i.price<=max&&i.price>=min); return c.sort((a,b)=>b.price!-a.price!)[0] ?? fallback }
}
export const catalog = new ItemCatalog(publicCatalogProvider)
export const isDemoCatalog = false
