export type Category = 'weapon' | 'knife' | 'gloves'
export type Wear = 'Factory New' | 'Minimal Wear' | 'Field-Tested' | 'Well-Worn' | 'Battle-Scarred' | null
export const RARITIES = ['Consumer Grade', 'Industrial Grade', 'Mil-Spec', 'Restricted', 'Classified', 'Covert', 'Contraband', 'Extraordinary'] as const
/** Единые цвета редкостей CS2 по всему проекту */
export const RARITY_COLOR: Record<string, string> = {
  'Consumer Grade': '#b0c3d9',
  'Industrial Grade': '#5e98d9',
  'Mil-Spec': '#4b69ff',
  Restricted: '#8847ff',
  Classified: '#d32ce6',
  Covert: '#eb4b4b',
  Contraband: '#e4ae39',
  Extraordinary: '#ffd24a',
}
/** Русские названия редкостей для интерфейса */
export const RARITY_RU: Record<string, string> = {
  'Consumer Grade': 'Обычный',
  'Industrial Grade': 'Промышленный',
  'Mil-Spec': 'Армейский',
  Restricted: 'Запрещённый',
  Classified: 'Засекреченный',
  Covert: 'Тайный',
  Contraband: 'Контрабанда',
  Extraordinary: 'Особый',
}
export const rarityRu = (r: string) => RARITY_RU[r] ?? r
export const rarityColor = (r: string) => RARITY_COLOR[r] ?? '#8d9b91'
export interface Item {
  id: string; name: string; weapon: string; skin: string; category: Category; rarity: string
  wear: Wear; stattrak: boolean; souvenir: boolean; collection: string
  image: string | null; price: number | null; priceSource: 'market' | null; float?: number
}
export interface Entry { item: Item; uid?: string; disabledReason?: string }
export interface Query {
  text: string; category: 'all' | Category; weapon: string; rarity: string; wear: string; special: 'all' | 'stattrak' | 'souvenir'
  min: number | null; max: number | null; sort: 'price-desc' | 'price-asc' | 'name' | 'rarity'
}
export const EMPTY_QUERY: Query = { text: '', category: 'all', weapon: '', rarity: '', wear: '', special: 'all', min: null, max: null, sort: 'price-desc' }
