import type { Item } from './types'

export async function fetchMarketPrices(items: Item[]): Promise<Record<string, number>> {
  const names = [...new Set(items.map((item) => item.name).filter(Boolean))].slice(0, 20)
  if (!names.length) return {}
  try {
    const response = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ names }),
    })
    if (!response.ok) return {}
    const data = await response.json() as { prices?: Record<string, number | null> }
    return Object.fromEntries(Object.entries(data.prices ?? {}).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0))
  } catch {
    return {}
  }
}
