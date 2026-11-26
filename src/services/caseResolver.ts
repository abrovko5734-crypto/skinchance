import { catalog } from './itemCatalog'
import { dropToItem, type GameCase } from './cases'
import type { Item } from './types'

export interface WeightedItem {
  item: Item
  chance: number
}

/**
 * Резолвит дропы кейса в настоящие предметы каталога (имя, изображение)
 * и подтягивает реальные цены Steam Market через /api/prices.
 * Если цена недоступна — item.price = null («Цена недоступна»), без выдуманных значений.
 */
export async function resolveCase(c: GameCase): Promise<WeightedItem[]> {
  const items: Item[] = []
  for (const d of c.drops) {
    const found = await catalog.byId(d.itemId)
    items.push(found ? { ...found } : dropToItem(d))
  }
  await catalog.refreshPrices(items).catch(() => {})
  return c.drops.map((d, i) => {
    const it = items[i]
    // Оставляем цену только из реального источника; конфиг-цена кейса — не рынок
    if (it.priceSource !== 'market') it.price = null
    return { item: it, chance: d.chance }
  })
}

/** Криптостойкий выбор WeightedItem по шансам. */
export function pickWeighted(list: WeightedItem[]): WeightedItem {
  const a = new Uint32Array(1)
  crypto.getRandomValues(a)
  const roll = (a[0] / 2 ** 32) * 100
  let acc = 0
  for (const w of list) {
    acc += w.chance
    if (roll < acc) return w
  }
  return list[list.length - 1]
}
