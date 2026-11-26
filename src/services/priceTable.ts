import type { Item } from './types'

/**
 * Курируемые оценки рыночных цен (USD) для предметов, используемых в кейсах.
 * Источник: 'table' — используется когда живой Steam priceoverview недоступен.
 * Значения — близкие к реальному рынку CS2 (FT/MW/FN указаны в ключе).
 */

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

// [weapon, skin, wearKey(fn|mw|ft|ww|bs|'knife'), stattrak?, priceUsd]
type Row = [string, string, string, boolean | undefined, number]

const ROWS: Row[] = [
  // ===== Бюджет / стартовые =====
  ['P250', 'Sand Dune', 'ft', false, 0.15],
  ['Galil AR', 'Cerberus', 'ft', false, 1.5],
  ['MAG-7', 'Justice', 'ft', false, 2],
  ['Glock-18', 'Water Elemental', 'ft', false, 1.2],
  ['Tec-9', 'Fuel Injector', 'ft', false, 0.8],
  ['P2000', 'Fire Elemental', 'ft', false, 2],
  ['P90', 'Asiimov', 'ft', false, 4],
  ['Nova', 'Hyper Beast', 'ft', false, 3],
  ['MP9', 'Hydra', 'ft', false, 3.5],
  ['UMP-45', 'Primal Saber', 'ft', false, 2],
  ['MAC-10', 'Neon Rider', 'ft', false, 8],
  ['FAMAS', 'Mecha Industries', 'ft', false, 3],
  ['Sawed-Off', 'The Kraken', 'ft', false, 2.5],
  ['XM1014', 'Tranquility', 'ft', false, 5],
  ['SSG 08', 'Bloodshot', 'ft', false, 6],
  ['Dual Berettas', 'Melondrama', 'ft', false, 1.2],
  ['Five-SeveN', 'Fairy Tale', 'ft', false, 3],
  // ===== Средний сегмент =====
  ['M4A1-S', 'Player Two', 'ft', false, 6],
  ['USP-S', 'Kill Confirmed', 'ft', false, 8],
  ['CZ75-Auto', 'Victoria', 'ft', false, 9],
  ['M4A4', 'Temukau', 'ft', false, 9],
  ['Desert Eagle', 'Printstream', 'ft', false, 12],
  ['M4A1-S', 'Hyper Beast', 'ft', false, 25],
  ['AWP', 'Neo-Noir', 'ft', false, 30],
  ['AK-47', 'Redline', 'ft', false, 35],
  ['AK-47', 'Redline', 'mw', false, 60],
  ['AK-47', 'Redline', 'ft', true, 90],
  ['M4A4', 'Asiimov', 'ft', false, 50],
  ['AWP', 'Asiimov', 'ft', false, 45],
  ['AWP', 'Hyper Beast', 'ft', false, 40],
  ['AK-47', 'Vulcan', 'ft', false, 55],
  ['AK-47', 'Bloodsport', 'ft', false, 90],
  ['AWP', 'Containment Breach', 'ft', false, 65],
  ['M4A1-S', 'Printstream', 'ft', false, 75],
  // ===== Премиум =====
  ['Desert Eagle', 'Blaze', 'fn', false, 180],
  ['AWP', 'Wildfire', 'ft', false, 110],
  ['AK-47', 'Fire Serpent', 'ft', false, 350],
  ['M4A4', 'Howl', 'ft', false, 420],
  ['AWP', 'Dragon Lore', 'ft', false, 2200],
  // ===== Ножи =====
  ['Flip Knife', 'Doppler', 'fn', false, 180],
  ['Paracord Knife', 'Marble Fade', 'fn', false, 140],
  ['Bayonet', 'Doppler', 'fn', false, 300],
  ['Nomad Knife', 'Doppler', 'fn', false, 260],
  ['Talon Knife', 'Doppler', 'fn', false, 220],
  ['M9 Bayonet', 'Doppler', 'fn', false, 380],
  ['Karambit', 'Doppler', 'fn', false, 900],
  ['Classic Knife', 'Fade', 'fn', false, 420],
  ['Karambit', 'Fade', 'fn', false, 1400],
  ['Skeleton Knife', 'Fade', 'fn', false, 800],
  ['Butterfly Knife', 'Doppler', 'fn', false, 1200],
  ['Butterfly Knife', 'Fade', 'fn', false, 1500],
  // ===== Перчатки =====
  ['Hand Wraps', 'Cobalt Skulls', 'ft', false, 90],
  ['Bloodhound Gloves', 'Charred', 'ft', false, 120],
  ['Driver Gloves', 'King Snake', 'ft', false, 200],
  ['Specialist Gloves', 'Fade', 'ft', false, 500],
  ['Sport Gloves', "Pandora's Box", 'ft', false, 700],
  ['Moto Gloves', 'Spearmint', 'ft', false, 650],
]

const TABLE = new Map<string, number>()
for (const [w, s, wear, st, price] of ROWS) {
  const key = `${st ? 'st|' : ''}${norm(w)}|${norm(s)}|${wear}`
  TABLE.set(key, price)
  // ключ без износа — для предметов с неизвестным wear (ножи в каталоге)
  const keyNoWear = `${st ? 'st|' : ''}${norm(w)}|${norm(s)}`
  if (!TABLE.has(keyNoWear)) TABLE.set(keyNoWear, price)
}

const WEAR_INIT: Record<string, string> = {
  'Factory New': 'fn', 'Minimal Wear': 'mw', 'Field-Tested': 'ft',
  'Well-Worn': 'ww', 'Battle-Scarred': 'bs',
}

/** Оценка цены в USD из таблицы. null — предмета нет в таблице. */
export function tablePriceUsd(item: Item): number | null {
  const st = item.stattrak ? 'st|' : ''
  const w = item.weapon || ''
  const s = item.skin || ''
  const wearInit = item.wear ? WEAR_INIT[item.wear] ?? '' : ''
  const base = `${st}${norm(w)}|${norm(s)}`
  return TABLE.get(`${base}|${wearInit}`) ?? TABLE.get(base) ?? null
}

/**
 * Оценка по редкости (USD) — fallback, когда нет ни Steam-котировки,
 * ни точной строки в таблице. Значения — порядковые, близкие к рынку.
 */
const RARITY_USD: Record<string, number> = {
  'Consumer Grade': 0.05,
  'Industrial Grade': 0.3,
  'Mil-Spec': 1.2,
  'Restricted': 5,
  'Classified': 20,
  'Covert': 80,
  'Extraordinary': 400,
  'Contraband': 2000,
}

export function rarityPriceUsd(item: Item): number | null {
  const base = RARITY_USD[item.rarity] ?? null
  if (base == null) return null
  return item.stattrak ? base * 1.3 : base
}
