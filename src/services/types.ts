export type Category = 'weapon' | 'knife' | 'gloves'
export type Wear = 'Factory New' | 'Minimal Wear' | 'Field-Tested' | 'Well-Worn' | 'Battle-Scarred' | null
export const RARITIES = ['Consumer Grade', 'Industrial Grade', 'Mil-Spec', 'Restricted', 'Classified', 'Covert', 'Contraband', 'Extraordinary'] as const
export const RARITY_COLOR: Record<string, string> = {
  'Consumer Grade': '#9aa3a0', 'Industrial Grade': '#5e98d9', 'Mil-Spec': '#4b69ff', Restricted: '#8847ff',
  Classified: '#d32ce6', Covert: '#eb4b4b', Contraband: '#e4ae39', Extraordinary: '#ffd24a',
}
export interface Item {
  id: string; name: string; weapon: string; skin: string; category: Category; rarity: string
  wear: Wear; stattrak: boolean; souvenir: boolean; collection: string
  image: string | null; price: number | null; priceSource: 'demo' | 'market' | null; float?: number
}
export interface Entry { item: Item; uid?: string; disabledReason?: string }
export interface Query {
  text: string; category: 'all' | Category; weapon: string; rarity: string; wear: string; special: 'all' | 'stattrak' | 'souvenir'
  min: number | null; max: number | null; sort: 'price-desc' | 'price-asc' | 'name' | 'rarity'
}
export const EMPTY_QUERY: Query = { text: '', category: 'all', weapon: '', rarity: '', wear: '', special: 'all', min: null, max: null, sort: 'price-desc' }
