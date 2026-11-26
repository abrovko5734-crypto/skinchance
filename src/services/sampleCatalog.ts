import type { Category, Item, Wear } from './types'
import { resolveSkinImage } from './skinImages'

const W: Record<string, Wear> = {
  FN: 'Factory New',
  MW: 'Minimal Wear',
  FT: 'Field-Tested',
  WW: 'Well-Worn',
  BS: 'Battle-Scarred',
}

export function makeId(weapon: string, skin: string, wearKey: string, st = false) {
  return `${st ? 'ST-' : ''}${weapon}|${skin}|${wearKey}`.toLowerCase().replace(/\s+/g, '-')
}

export function makeName(weapon: string, skin: string, wear: Wear, st: boolean, isKnife: boolean) {
  const prefix = st ? 'StatTrak™ ' : ''
  const w = wear ? ` (${wear})` : ''
  return isKnife ? `${prefix}★ ${weapon} | ${skin}${w}` : `${prefix}${weapon} | ${skin}${w}`
}

// [оружие, скин, износ, редкость, категория, коллекция, цена DP, stattrak?]
type Row = [string, string, string, string, Category, string, number, boolean?]

const ROWS: Row[] = [
  // Дешёвые
  ['P250', 'Sand Dune', 'FT', 'Consumer Grade', 'weapon', '', 3],
  ['Glock-18', 'Water Elemental', 'FT', 'Restricted', 'weapon', '', 85],
  ['P2000', 'Fire Elemental', 'FT', 'Classified', 'weapon', '', 160],
  ['Tec-9', 'Fuel Injector', 'FT', 'Classified', 'weapon', '', 65],
  ['P90', 'Asiimov', 'FT', 'Classified', 'weapon', '', 135],
  ['USP-S', 'Kill Confirmed', 'FT', 'Covert', 'weapon', '', 420],
  ['Desert Eagle', 'Blaze', 'FN', 'Restricted', 'weapon', '', 9800],
  ['Desert Eagle', 'Printstream', 'FT', 'Covert', 'weapon', '', 890],
  ['AK-47', 'Redline', 'FT', 'Classified', 'weapon', 'The Phoenix Collection', 480],
  ['AK-47', 'Redline', 'MW', 'Classified', 'weapon', 'The Phoenix Collection', 820],
  ['AK-47', 'Redline', 'FT', 'Classified', 'weapon', 'The Phoenix Collection', 1450, true],
  ['AK-47', 'Fire Serpent', 'FT', 'Covert', 'weapon', '', 18500],
  ['AK-47', 'Vulcan', 'FT', 'Covert', 'weapon', '', 3200],
  ['AK-47', 'Asiimov', 'FT', 'Covert', 'weapon', '', 2100],
  ['AK-47', 'Bloodsport', 'FT', 'Covert', 'weapon', '', 1650],
  ['M4A1-S', 'Hyper Beast', 'FT', 'Covert', 'weapon', '', 820],
  ['M4A1-S', 'Printstream', 'FT', 'Covert', 'weapon', '', 2800],
  ['M4A1-S', 'Player Two', 'FT', 'Classified', 'weapon', '', 390],
  ['M4A4', 'Asiimov', 'FT', 'Covert', 'weapon', '', 1150],
  ['M4A4', 'Howl', 'FT', 'Contraband', 'weapon', 'The Huntsman Collection', 92000],
  ['M4A4', 'Temukau', 'FT', 'Covert', 'weapon', '', 980],
  ['AWP', 'Asiimov', 'FT', 'Covert', 'weapon', 'The Phoenix Collection', 1580],
  ['AWP', 'Hyper Beast', 'FT', 'Covert', 'weapon', '', 1250],
  ['AWP', 'Dragon Lore', 'FT', 'Covert', 'weapon', 'The Cobblestone Collection', 245000],
  ['AWP', 'Containment Breach', 'FT', 'Covert', 'weapon', '', 4200],
  ['AWP', 'Neo-Noir', 'FT', 'Covert', 'weapon', '', 1850],
  ['AWP', 'Wildfire', 'FT', 'Covert', 'weapon', '', 3100],
  ['FAMAS', 'Mecha Industries', 'FT', 'Classified', 'weapon', '', 210],
  ['Galil AR', 'Cerberus', 'FT', 'Restricted', 'weapon', '', 95],
  ['SSG 08', 'Bloodshot', 'FT', 'Classified', 'weapon', '', 340],
  ['MAC-10', 'Neon Rider', 'FT', 'Covert', 'weapon', '', 280],
  ['MP9', 'Hydra', 'FT', 'Classified', 'weapon', '', 190],
  ['UMP-45', 'Primal Saber', 'FT', 'Classified', 'weapon', '', 160],
  ['Nova', 'Hyper Beast', 'FT', 'Classified', 'weapon', '', 120],
  ['XM1014', 'Tranquility', 'FT', 'Classified', 'weapon', '', 280],
  ['MAG-7', 'Justice', 'FT', 'Classified', 'weapon', '', 95],
  ['Sawed-Off', 'The Kraken', 'FT', 'Covert', 'weapon', '', 180],
  ['CZ75-Auto', 'Victoria', 'FT', 'Covert', 'weapon', '', 420],
  ['Five-SeveN', 'Fairy Tale', 'FT', 'Classified', 'weapon', '', 210],
  ['Dual Berettas', 'Melondrama', 'FT', 'Classified', 'weapon', '', 95],
  // Knives
  ['Flip Knife', 'Doppler', 'FN', 'Extraordinary', 'knife', '', 5400],
  ['Bayonet', 'Doppler', 'FN', 'Extraordinary', 'knife', '', 8200],
  ['M9 Bayonet', 'Doppler', 'FN', 'Extraordinary', 'knife', '', 15500],
  ['Karambit', 'Doppler', 'FN', 'Extraordinary', 'knife', '', 19500],
  ['Karambit', 'Fade', 'FN', 'Extraordinary', 'knife', '', 38500],
  ['Butterfly Knife', 'Fade', 'FN', 'Extraordinary', 'knife', '', 48500],
  ['Butterfly Knife', 'Doppler', 'FN', 'Extraordinary', 'knife', '', 42000],
  ['Talon Knife', 'Doppler', 'FN', 'Extraordinary', 'knife', '', 12500],
  ['Skeleton Knife', 'Fade', 'FN', 'Extraordinary', 'knife', '', 28500],
  ['Nomad Knife', 'Doppler', 'FN', 'Extraordinary', 'knife', '', 9800],
  ['Classic Knife', 'Fade', 'FN', 'Extraordinary', 'knife', '', 11200],
  ['Paracord Knife', 'Marble Fade', 'FN', 'Extraordinary', 'knife', '', 8900],
  // Gloves
  ['Driver Gloves', 'King Snake', 'FT', 'Extraordinary', 'gloves', '', 18500],
  ['Sport Gloves', "Pandora's Box", 'FT', 'Extraordinary', 'gloves', '', 36500],
  ['Specialist Gloves', 'Fade', 'FT', 'Extraordinary', 'gloves', '', 34500],
  ['Hand Wraps', 'Cobalt Skulls', 'FT', 'Extraordinary', 'gloves', '', 9800],
  ['Moto Gloves', 'Spearmint', 'FT', 'Extraordinary', 'gloves', '', 42000],
  ['Bloodhound Gloves', 'Charred', 'FT', 'Extraordinary', 'gloves', '', 12500],
]

export const sampleProvider = {
  async load() {
    return ROWS.map(([weapon, skin, w, rarity, category, collection, price, st = false]): Item => ({
      id: makeId(weapon, skin, w, st),
      weapon,
      skin,
      category,
      rarity,
      wear: W[w],
      stattrak: st,
      souvenir: false,
      collection,
      name: makeName(weapon, skin, W[w], st, category === 'knife'),
      image: resolveSkinImage({ weapon, skin, wear: W[w], stattrak: st, category }),
      price: null,
      priceSource: null,
    }))
  },
}
