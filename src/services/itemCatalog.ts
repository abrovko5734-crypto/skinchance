import { EMPTY_QUERY, RARITIES, type Item, type Query, type Category, type Wear } from './types'
import { sampleProvider } from './sampleCatalog'

export interface CatalogProvider { load(): Promise<Item[]> }
export interface PriceProvider { load(): Promise<Record<string, number>> }

/** Адаптер формата ByMykel/CSGO-API (skins_not_grouped.json): скины, ножи, перчатки, StatTrak, Souvenir, износы. */
export const remoteProvider = (url: string): CatalogProvider => ({
  async load() {
    const res = await fetch(url); if (!res.ok) throw new Error(`Каталог: HTTP ${res.status}`)
    const raw: any[] = await res.json()
    return raw.map((r): Item => {
      const cat = r.category?.name === 'Knives' ? 'knife' : r.category?.name === 'Gloves' ? 'gloves' : 'weapon'
      return {
        id: String(r.id), name: r.name, weapon: r.weapon?.name ?? '', skin: r.pattern?.name ?? '', category: cat as Category,
        rarity: r.rarity?.name ?? '', wear: (r.wear?.name ?? null) as Wear, stattrak: !!r.stattrak, souvenir: !!r.souvenir,
        collection: r.collections?.[0]?.name ?? '', image: r.image ?? null, price: null, priceSource: null,
      }
    })
  },
})
export const remotePrices = (url: string): PriceProvider => ({
  async load() { const r = await fetch(url); if (!r.ok) throw new Error(`Цены: HTTP ${r.status}`); return r.json() },
})

const rank = (r: string) => RARITIES.indexOf(r as never)

class ItemCatalog {
  private cache?: Promise<Item[]>
  constructor(private provider: CatalogProvider, private prices?: PriceProvider) {}
  all(): Promise<Item[]> {
    return (this.cache ??= (async () => {
      const [items, map] = await Promise.all([this.provider.load(), this.prices ? this.prices.load() : Promise.resolve(null)])
      if (map) for (const i of items) { const p = map[i.name]; if (typeof p === 'number') { i.price = p; i.priceSource = 'market' } }
      return items
    })().catch(e => { this.cache = undefined; throw e }))
  }
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
      'price-desc': (a, b) => (b.price ?? -1) - (a.price ?? -1), 'price-asc': (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
      name: (a, b) => a.name.localeCompare(b.name), rarity: (a, b) => rank(b.rarity) - rank(a.rarity),
    }
    return out.sort(by[q.sort])
  }
  /** Ближайший предмет с ценой в [min, max] — второе улучшение Clover x2. */
  async closest(max: number, min: number, fallback: Item): Promise<Item> {
    const c = (await this.all()).filter(i => i.price != null && i.price <= max && i.price >= min)
    return c.sort((a, b) => b.price! - a.price!)[0] ?? fallback
  }
}
const env = import.meta.env
export const catalog = new ItemCatalog(
  env.VITE_CATALOG_URL ? remoteProvider(env.VITE_CATALOG_URL) : sampleProvider,
  env.VITE_PRICES_URL ? remotePrices(env.VITE_PRICES_URL) : undefined,
)
export const isDemoCatalog = !env.VITE_CATALOG_URL
