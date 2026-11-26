import { EMPTY_QUERY, RARITIES, type Item, type Query, type Category, type Wear, type Entry } from './types'
import { sampleProvider } from './sampleCatalog'
import { resolveSkinImage } from './skinImages'

export interface CatalogProvider {
  load(): Promise<Item[]>
}
export interface PriceProvider {
  load(): Promise<Record<string, number>>
}

/** ByMykel CSGO-API — скины с реальными image URL */
export const BYMYKEL_SKINS =
  'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins_not_grouped.json'

export const remoteProvider = (url: string): CatalogProvider => ({
  async load() {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Каталог: HTTP ${res.status}`)
    const raw: any[] = await res.json()
    return raw.map((r): Item => {
      const cat: Category =
        r.category?.name === 'Knives' ? 'knife' : r.category?.name === 'Gloves' ? 'gloves' : 'weapon'
      const wear = (r.wear?.name ?? null) as Wear
      const weapon = r.weapon?.name ?? ''
      const skin = r.pattern?.name ?? ''
      const st = !!r.stattrak
      const image =
        r.image ||
        resolveSkinImage({ weapon, skin, wear, stattrak: st, category: cat })
      return {
        id: String(r.id ?? `${st ? 'st-' : ''}${weapon}|${skin}|${wear ?? ''}`),
        name: r.name,
        weapon,
        skin,
        category: cat,
        rarity: r.rarity?.name ?? '',
        wear,
        stattrak: st,
        souvenir: !!r.souvenir,
        collection: r.collections?.[0]?.name ?? '',
        image,
        price: null,
        priceSource: null,
      }
    })
  },
})

export const remotePrices = (url: string): PriceProvider => ({
  async load() {
    const r = await fetch(url)
    if (!r.ok) throw new Error(`Цены: HTTP ${r.status}`)
    return r.json()
  },
})

const rank = (r: string) => RARITIES.indexOf(r as never)

class ItemCatalog {
  private cache?: Promise<Item[]>
  private byIdMap?: Map<string, Item>

  constructor(
    private provider: CatalogProvider,
    private prices?: PriceProvider,
  ) {}

  all(): Promise<Item[]> {
    return (this.cache ??= (async () => {
      let items: Item[]
      try {
        items = await this.provider.load()
      } catch (e) {
        console.warn('Remote catalog failed, using sample', e)
        items = await sampleProvider.load()
      }
      const map = this.prices ? await this.prices.load().catch(() => null) : null
      if (map) {
        for (const i of items) {
          const p = map[i.name]
          if (typeof p === 'number') {
            i.price = p
            i.priceSource = 'market'
          }
        }
      }
      for (const i of items) {
        if (!i.image) {
          i.image = resolveSkinImage({
            weapon: i.weapon,
            skin: i.skin,
            wear: i.wear,
            stattrak: i.stattrak,
            category: i.category,
          })
        }
      }
      this.byIdMap = new Map(items.map((i) => [i.id, i]))
      // также индекс по упрощённому id
      for (const i of items) {
        const simple = `${i.stattrak ? 'st-' : ''}${i.weapon}|${i.skin}|${(i.wear ?? '').split(' ').map(w => w[0]).join('')}`.toLowerCase()
        if (!this.byIdMap.has(simple)) this.byIdMap.set(simple, i)
      }
      return items
    })().catch((e) => {
      this.cache = undefined
      this.byIdMap = undefined
      throw e
    }))
  }

  async refreshPrices(items: Item[]): Promise<Item[]> {
    const { fetchMarketPrices } = await import('./marketPrices')
    const prices = await fetchMarketPrices(items)
    for (const item of items) {
      const price = prices[item.name]
      if (typeof price === 'number') {
        item.price = price
        item.priceSource = 'market'
      }
    }
    return items
  }

  async load() {
    return this.all()
  }

  async byId(id: string): Promise<Item | null> {
    await this.all()
    if (this.byIdMap?.has(id)) return this.byIdMap.get(id)!
    // fuzzy: sample ids like ak-47|redline|ft
    const lower = id.toLowerCase()
    for (const [k, v] of this.byIdMap ?? []) {
      if (k.toLowerCase() === lower || v.name.toLowerCase().includes(lower.replace(/\|/g, ' '))) return v
    }
    return null
  }

  async weapons() {
    return [...new Set((await this.all()).map((i) => i.weapon))].sort()
  }

  async getMany(ids: string[]) {
    const s = new Set(ids)
    return (await this.all()).filter((i) => s.has(i.id))
  }

  async search(q: Query = EMPTY_QUERY): Promise<Entry[]> {
    const tokens = q.text.toLowerCase().split(/\s+/).filter(Boolean)
    const out = (await this.all()).filter((i) => {
      const n = i.name.toLowerCase()
      if (q.category !== 'all' && i.category !== q.category) return false
      if (q.weapon && i.weapon !== q.weapon) return false
      if (q.rarity && i.rarity !== q.rarity) return false
      if (q.wear && i.wear !== q.wear) return false
      if (q.special === 'stattrak' && !i.stattrak) return false
      if (q.special === 'souvenir' && !i.souvenir) return false
      if (q.min != null && (i.price ?? -1) < q.min) return false
      if (q.max != null && (i.price ?? Infinity) > q.max) return false
      return tokens.every((t) => n.includes(t))
    })
    const by: Record<Query['sort'], (a: Item, b: Item) => number> = {
      'price-desc': (a, b) => (b.price ?? -1) - (a.price ?? -1),
      'price-asc': (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
      name: (a, b) => a.name.localeCompare(b.name),
      rarity: (a, b) => rank(b.rarity) - rank(a.rarity),
    }
    return out.sort(by[q.sort]).map((item) => ({ item }))
  }

  async closest(max: number, min: number, fallback: Item): Promise<Item> {
    const c = (await this.all()).filter((i) => i.price != null && i.price <= max && i.price >= min)
    return c.sort((a, b) => b.price! - a.price!)[0] ?? fallback
  }
}

const env = import.meta.env
// По умолчанию тянем ByMykel (реальные фото). Fallback на sample если офлайн.
const catalogUrl = env.VITE_CATALOG_URL || BYMYKEL_SKINS
export const catalog = new ItemCatalog(
  remoteProvider(catalogUrl),
  env.VITE_PRICES_URL ? remotePrices(env.VITE_PRICES_URL) : undefined,
)
export const isDemoCatalog = !env.VITE_CATALOG_URL
