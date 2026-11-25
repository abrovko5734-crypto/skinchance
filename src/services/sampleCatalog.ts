import type { CatalogProvider } from './itemCatalog'
import type { Category, Item, Wear } from './types'
const W: Record<string, Wear> = { FN: 'Factory New', MW: 'Minimal Wear', FT: 'Field-Tested', WW: 'Well-Worn', BS: 'Battle-Scarred' }
export const makeName = (weapon: string, skin: string, wear: Wear, st = false, knife = false) =>
  `${knife ? '★ ' : ''}${st ? 'StatTrak™ ' : ''}${weapon} | ${skin}${wear ? ` (${wear})` : ''}`
export const makeId = (weapon: string, skin: string, wear: string, st = false) =>
  `${weapon}-${skin}-${wear}${st ? '-st' : ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
// [оружие, скин, износ, редкость, категория, коллекция, ДЕМО-цена $, stattrak]
// Только тестовая выборка. Полный каталог подключается через VITE_CATALOG_URL (см. README).
type Row = [string, string, string, string, Category, string, number, boolean?]
const ROWS: Row[] = [
  ['P250', 'Sand Dune', 'FT', 'Consumer Grade', 'weapon', '', 0.06],
  ['Glock-18', 'Water Elemental', 'FT', 'Restricted', 'weapon', '', 3.2],
  ['P2000', 'Fire Elemental', 'FT', 'Classified', 'weapon', '', 6.5],
  ['Tec-9', 'Fuel Injector', 'FT', 'Classified', 'weapon', '', 2.4],
  ['P90', 'Asiimov', 'FT', 'Classified', 'weapon', '', 5.1],
  ['Desert Eagle', 'Blaze', 'FN', 'Restricted', 'weapon', '', 420],
  ['AK-47', 'Redline', 'FT', 'Classified', 'weapon', 'The Phoenix Collection', 18],
  ['AK-47', 'Redline', 'MW', 'Classified', 'weapon', 'The Phoenix Collection', 32],
  ['AK-47', 'Redline', 'FT', 'Classified', 'weapon', 'The Phoenix Collection', 58, true],
  ['AK-47', 'Fire Serpent', 'FT', 'Covert', 'weapon', '', 720],
  ['M4A1-S', 'Hyper Beast', 'FT', 'Covert', 'weapon', '', 32],
  ['M4A4', 'Asiimov', 'FT', 'Covert', 'weapon', '', 44],
  ['M4A4', 'Howl', 'FT', 'Contraband', 'weapon', 'The Huntsman Collection', 3600],
  ['AWP', 'Asiimov', 'FT', 'Covert', 'weapon', 'The Phoenix Collection', 62],
  ['AWP', 'Hyper Beast', 'FT', 'Covert', 'weapon', '', 48],
  ['AWP', 'Dragon Lore', 'FT', 'Covert', 'weapon', 'The Cobblestone Collection', 9200],
  ['Flip Knife', 'Doppler', 'FN', 'Extraordinary', 'knife', '', 210],
  ['Bayonet', 'Doppler', 'FN', 'Extraordinary', 'knife', '', 330],
  ['M9 Bayonet', 'Doppler', 'FN', 'Extraordinary', 'knife', '', 610],
  ['Karambit', 'Doppler', 'FN', 'Extraordinary', 'knife', '', 760],
  ['Karambit', 'Fade', 'FN', 'Extraordinary', 'knife', '', 1550],
  ['Butterfly Knife', 'Fade', 'FN', 'Extraordinary', 'knife', '', 1900],
  ['Driver Gloves', 'King Snake', 'FT', 'Extraordinary', 'gloves', '', 720],
  ['Sport Gloves', "Pandora's Box", 'FT', 'Extraordinary', 'gloves', '', 1450],
  ['Specialist Gloves', 'Fade', 'FT', 'Extraordinary', 'gloves', '', 1380],
]
export const sampleProvider: CatalogProvider = {
  async load() {
    return ROWS.map(([weapon, skin, w, rarity, category, collection, price, st = false]): Item => ({
      id: makeId(weapon, skin, w, st), weapon, skin, category, rarity, wear: W[w], stattrak: st, souvenir: false, collection,
      name: makeName(weapon, skin, W[w], st, category === 'knife'), image: null, price, priceSource: 'demo',
    }))
  },
}
