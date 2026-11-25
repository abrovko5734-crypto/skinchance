import type { Item } from './types'
import { makeId, makeName } from './sampleCatalog'

export interface CaseDrop {
  itemId: string
  chance: number // %
  price: number
}

export interface GameCase {
  id: string
  name: string
  price: number // DP
  imageHue: number
  imageEmoji: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  tag?: string
  drops: CaseDrop[]
}

const W = {
  FN: 'Factory New' as const,
  MW: 'Minimal Wear' as const,
  FT: 'Field-Tested' as const,
}

function drop(weapon: string, skin: string, wearKey: string, price: number, chance: number, st = false, cat: 'weapon' | 'knife' | 'gloves' = 'weapon'): CaseDrop {
  return {
    itemId: makeId(weapon, skin, wearKey, st),
    chance,
    price,
  }
}

export const CASES: GameCase[] = [
  {
    id: 'starter',
    name: 'Starter Case',
    price: 25,
    imageHue: 120,
    imageEmoji: '📦',
    rarity: 'common',
    drops: [
      drop('P250', 'Sand Dune', 'FT', 3, 35),
      drop('Tec-9', 'Fuel Injector', 'FT', 65, 25),
      drop('Glock-18', 'Water Elemental', 'FT', 85, 18),
      drop('P90', 'Asiimov', 'FT', 135, 12),
      drop('M4A1-S', 'Player Two', 'FT', 390, 7),
      drop('AK-47', 'Redline', 'FT', 480, 3),
    ],
  },
  {
    id: 'phoenix',
    name: 'Phoenix Case',
    price: 80,
    imageHue: 15,
    imageEmoji: '🔥',
    rarity: 'rare',
    tag: 'Popular',
    drops: [
      drop('P90', 'Asiimov', 'FT', 135, 28),
      drop('Glock-18', 'Water Elemental', 'FT', 85, 22),
      drop('AK-47', 'Redline', 'FT', 480, 18),
      drop('M4A1-S', 'Hyper Beast', 'FT', 820, 14),
      drop('AWP', 'Asiimov', 'FT', 1580, 10),
      drop('AK-47', 'Vulcan', 'FT', 3200, 5),
      drop('Karambit', 'Doppler', 'FN', 19500, 3),
    ],
  },
  {
    id: 'asiimov',
    name: 'Asiimov Collection',
    price: 150,
    imageHue: 30,
    imageEmoji: '🚀',
    rarity: 'epic',
    drops: [
      drop('P90', 'Asiimov', 'FT', 135, 30),
      drop('M4A4', 'Asiimov', 'FT', 1150, 25),
      drop('AWP', 'Asiimov', 'FT', 1580, 20),
      drop('AK-47', 'Asiimov', 'FT', 2100, 15),
      drop('AWP', 'Hyper Beast', 'FT', 1250, 7),
      drop('M9 Bayonet', 'Doppler', 'FN', 15500, 3),
    ],
  },
  {
    id: 'hyper',
    name: 'Hyper Beast',
    price: 120,
    imageHue: 280,
    imageEmoji: '🐯',
    rarity: 'rare',
    drops: [
      drop('Nova', 'Hyper Beast', 'FT', 120, 30),
      drop('M4A1-S', 'Hyper Beast', 'FT', 820, 28),
      drop('AWP', 'Hyper Beast', 'FT', 1250, 22),
      drop('AK-47', 'Bloodsport', 'FT', 1650, 12),
      drop('Bayonet', 'Doppler', 'FN', 8200, 5),
      drop('Butterfly Knife', 'Doppler', 'FN', 42000, 3),
    ],
  },
  {
    id: 'printstream',
    name: 'Printstream Case',
    price: 200,
    imageHue: 200,
    imageEmoji: '🖨️',
    rarity: 'epic',
    tag: 'Hot',
    drops: [
      drop('Desert Eagle', 'Printstream', 'FT', 890, 35),
      drop('M4A1-S', 'Printstream', 'FT', 2800, 30),
      drop('AK-47', 'Vulcan', 'FT', 3200, 18),
      drop('AWP', 'Neo-Noir', 'FT', 1850, 10),
      drop('Talon Knife', 'Doppler', 'FN', 12500, 5),
      drop('Karambit', 'Fade', 'FN', 38500, 2),
    ],
  },
  {
    id: 'doppler',
    name: 'Doppler Knives',
    price: 850,
    imageHue: 260,
    imageEmoji: '💎',
    rarity: 'legendary',
    drops: [
      drop('Flip Knife', 'Doppler', 'FN', 5400, 28),
      drop('Bayonet', 'Doppler', 'FN', 8200, 24),
      drop('Nomad Knife', 'Doppler', 'FN', 9800, 18),
      drop('M9 Bayonet', 'Doppler', 'FN', 15500, 15),
      drop('Karambit', 'Doppler', 'FN', 19500, 10),
      drop('Butterfly Knife', 'Doppler', 'FN', 42000, 5),
    ],
  },
  {
    id: 'fade',
    name: 'Fade Legends',
    price: 1200,
    imageHue: 320,
    imageEmoji: '🌈',
    rarity: 'legendary',
    tag: 'Premium',
    drops: [
      drop('Classic Knife', 'Fade', 'FN', 11200, 30),
      drop('Skeleton Knife', 'Fade', 'FN', 28500, 25),
      drop('Karambit', 'Fade', 'FN', 38500, 22),
      drop('Butterfly Knife', 'Fade', 'FN', 48500, 15),
      drop('Sport Gloves', "Pandora's Box", 'FT', 36500, 5),
      drop('Moto Gloves', 'Spearmint', 'FT', 42000, 3),
    ],
  },
  {
    id: 'gloves',
    name: 'Glove Box',
    price: 600,
    imageHue: 40,
    imageEmoji: '🧤',
    rarity: 'epic',
    drops: [
      drop('Hand Wraps', 'Cobalt Skulls', 'FT', 9800, 30),
      drop('Bloodhound Gloves', 'Charred', 'FT', 12500, 25),
      drop('Driver Gloves', 'King Snake', 'FT', 18500, 20),
      drop('Specialist Gloves', 'Fade', 'FT', 34500, 15),
      drop('Sport Gloves', "Pandora's Box", 'FT', 36500, 7),
      drop('Moto Gloves', 'Spearmint', 'FT', 42000, 3),
    ],
  },
  {
    id: 'redline',
    name: 'Redline Case',
    price: 90,
    imageHue: 0,
    imageEmoji: '❤️',
    rarity: 'rare',
    drops: [
      drop('AK-47', 'Redline', 'FT', 480, 40),
      drop('AK-47', 'Redline', 'MW', 820, 25),
      drop('AK-47', 'Redline', 'FT', 1450, 15, true),
      drop('AWP', 'Wildfire', 'FT', 3100, 12),
      drop('Flip Knife', 'Doppler', 'FN', 5400, 6),
      drop('Karambit', 'Doppler', 'FN', 19500, 2),
    ],
  },
  {
    id: 'howl',
    name: 'Howl Legacy',
    price: 2500,
    imageHue: 10,
    imageEmoji: '🐺',
    rarity: 'mythic',
    tag: 'Legendary',
    drops: [
      drop('M4A4', 'Howl', 'FT', 92000, 8),
      drop('AWP', 'Dragon Lore', 'FT', 245000, 3),
      drop('AK-47', 'Fire Serpent', 'FT', 18500, 25),
      drop('Desert Eagle', 'Blaze', 'FN', 9800, 30),
      drop('Butterfly Knife', 'Fade', 'FN', 48500, 20),
      drop('Karambit', 'Fade', 'FN', 38500, 14),
    ],
  },
  {
    id: 'budget',
    name: 'Budget Box',
    price: 15,
    imageHue: 90,
    imageEmoji: '💵',
    rarity: 'common',
    drops: [
      drop('P250', 'Sand Dune', 'FT', 3, 45),
      drop('Tec-9', 'Fuel Injector', 'FT', 65, 30),
      drop('Galil AR', 'Cerberus', 'FT', 95, 15),
      drop('MAG-7', 'Justice', 'FT', 95, 7),
      drop('Glock-18', 'Water Elemental', 'FT', 85, 3),
    ],
  },
  {
    id: 'neon',
    name: 'Neon Rider',
    price: 70,
    imageHue: 300,
    imageEmoji: '⚡',
    rarity: 'rare',
    drops: [
      drop('MAC-10', 'Neon Rider', 'FT', 280, 35),
      drop('MP9', 'Hydra', 'FT', 190, 25),
      drop('FAMAS', 'Mecha Industries', 'FT', 210, 18),
      drop('SSG 08', 'Bloodshot', 'FT', 340, 12),
      drop('M4A1-S', 'Player Two', 'FT', 390, 7),
      drop('AK-47', 'Bloodsport', 'FT', 1650, 3),
    ],
  },
  {
    id: 'containment',
    name: 'Containment Breach',
    price: 350,
    imageHue: 180,
    imageEmoji: '☢️',
    rarity: 'epic',
    drops: [
      drop('AWP', 'Containment Breach', 'FT', 4200, 30),
      drop('AWP', 'Neo-Noir', 'FT', 1850, 25),
      drop('M4A1-S', 'Printstream', 'FT', 2800, 20),
      drop('AK-47', 'Vulcan', 'FT', 3200, 15),
      drop('M9 Bayonet', 'Doppler', 'FN', 15500, 7),
      drop('Karambit', 'Doppler', 'FN', 19500, 3),
    ],
  },
  {
    id: 'skeleton',
    name: 'Skeleton Case',
    price: 950,
    imageHue: 50,
    imageEmoji: '💀',
    rarity: 'legendary',
    tag: 'Limited',
    drops: [
      drop('Skeleton Knife', 'Fade', 'FN', 28500, 25),
      drop('Paracord Knife', 'Marble Fade', 'FN', 8900, 30),
      drop('Nomad Knife', 'Doppler', 'FN', 9800, 20),
      drop('Classic Knife', 'Fade', 'FN', 11200, 15),
      drop('Talon Knife', 'Doppler', 'FN', 12500, 7),
      drop('Butterfly Knife', 'Fade', 'FN', 48500, 3),
    ],
  },
  {
    id: 'wildfire',
    name: 'Wildfire Case',
    price: 180,
    imageHue: 25,
    imageEmoji: '🌋',
    rarity: 'epic',
    drops: [
      drop('AWP', 'Wildfire', 'FT', 3100, 28),
      drop('AK-47', 'Asiimov', 'FT', 2100, 25),
      drop('M4A4', 'Temukau', 'FT', 980, 20),
      drop('Desert Eagle', 'Printstream', 'FT', 890, 15),
      drop('Bayonet', 'Doppler', 'FN', 8200, 8),
      drop('Karambit', 'Doppler', 'FN', 19500, 4),
    ],
  },
  {
    id: 'cz',
    name: 'CZ Victoria',
    price: 55,
    imageHue: 340,
    imageEmoji: '👑',
    rarity: 'rare',
    drops: [
      drop('CZ75-Auto', 'Victoria', 'FT', 420, 30),
      drop('Five-SeveN', 'Fairy Tale', 'FT', 210, 25),
      drop('Dual Berettas', 'Melondrama', 'FT', 95, 20),
      drop('USP-S', 'Kill Confirmed', 'FT', 420, 15),
      drop('Desert Eagle', 'Printstream', 'FT', 890, 7),
      drop('Flip Knife', 'Doppler', 'FN', 5400, 3),
    ],
  },
  {
    id: 'xm',
    name: 'Shotgun Party',
    price: 40,
    imageHue: 70,
    imageEmoji: '🔫',
    rarity: 'common',
    drops: [
      drop('Nova', 'Hyper Beast', 'FT', 120, 30),
      drop('XM1014', 'Tranquility', 'FT', 280, 28),
      drop('MAG-7', 'Justice', 'FT', 95, 20),
      drop('Sawed-Off', 'The Kraken', 'FT', 180, 15),
      drop('UMP-45', 'Primal Saber', 'FT', 160, 5),
      drop('M4A1-S', 'Hyper Beast', 'FT', 820, 2),
    ],
  },
  {
    id: 'vulcan',
    name: 'Vulcan Strike',
    price: 280,
    imageHue: 140,
    imageEmoji: '⚔️',
    rarity: 'epic',
    drops: [
      drop('AK-47', 'Vulcan', 'FT', 3200, 32),
      drop('AK-47', 'Bloodsport', 'FT', 1650, 25),
      drop('AK-47', 'Asiimov', 'FT', 2100, 18),
      drop('AK-47', 'Fire Serpent', 'FT', 18500, 12),
      drop('M9 Bayonet', 'Doppler', 'FN', 15500, 8),
      drop('Karambit', 'Fade', 'FN', 38500, 5),
    ],
  },
  {
    id: 'lore',
    name: 'Dragon Lore Vault',
    price: 5000,
    imageHue: 45,
    imageEmoji: '🐉',
    rarity: 'mythic',
    tag: 'Mythic',
    drops: [
      drop('AWP', 'Dragon Lore', 'FT', 245000, 5),
      drop('M4A4', 'Howl', 'FT', 92000, 12),
      drop('AK-47', 'Fire Serpent', 'FT', 18500, 25),
      drop('Sport Gloves', "Pandora's Box", 'FT', 36500, 20),
      drop('Butterfly Knife', 'Fade', 'FN', 48500, 22),
      drop('Karambit', 'Fade', 'FN', 38500, 16),
    ],
  },
  {
    id: 'daily',
    name: 'Daily Free',
    price: 0,
    imageHue: 160,
    imageEmoji: '🎁',
    rarity: 'common',
    tag: 'Free',
    drops: [
      drop('P250', 'Sand Dune', 'FT', 3, 50),
      drop('Tec-9', 'Fuel Injector', 'FT', 65, 25),
      drop('Glock-18', 'Water Elemental', 'FT', 85, 15),
      drop('P90', 'Asiimov', 'FT', 135, 7),
      drop('AK-47', 'Redline', 'FT', 480, 3),
    ],
  },
]

export function openCase(c: GameCase): CaseDrop {
  const roll = Math.random() * 100
  let acc = 0
  for (const d of c.drops) {
    acc += d.chance
    if (roll < acc) return d
  }
  return c.drops[c.drops.length - 1]
}

export const RARITY_LABEL: Record<GameCase['rarity'], string> = {
  common: 'Обычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
  mythic: 'Мифический',
}
