import { makeId } from './sampleCatalog'

export interface CaseDrop {
  itemId: string
  chance: number
  price: number
}

export interface GameCase {
  id: string
  name: string
  price: number
  image: string // path or gradient key
  hue: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  tag?: string
  drops: CaseDrop[]
}

function d(weapon: string, skin: string, wear: string, price: number, chance: number, st = false): CaseDrop {
  return { itemId: makeId(weapon, skin, wear, st), chance, price }
}

export const CASES: GameCase[] = [
  {
    id: 'starter', name: 'Starter Case', price: 35, hue: 140, rarity: 'common', image: 'case-starter',
    drops: [
      d('P250', 'Sand Dune', 'FT', 3, 42),
      d('Tec-9', 'Fuel Injector', 'FT', 65, 28),
      d('Glock-18', 'Water Elemental', 'FT', 85, 16),
      d('P90', 'Asiimov', 'FT', 135, 9),
      d('M4A1-S', 'Player Two', 'FT', 390, 4),
      d('AK-47', 'Redline', 'FT', 480, 1),
    ],
  },
  {
    id: 'phoenix', name: 'Phoenix Case', price: 95, hue: 18, rarity: 'rare', tag: 'Popular', image: 'case-phoenix',
    drops: [
      d('P90', 'Asiimov', 'FT', 135, 32),
      d('Glock-18', 'Water Elemental', 'FT', 85, 24),
      d('AK-47', 'Redline', 'FT', 480, 20),
      d('M4A1-S', 'Hyper Beast', 'FT', 820, 14),
      d('AWP', 'Asiimov', 'FT', 1580, 7),
      d('AK-47', 'Vulcan', 'FT', 3200, 2.5),
      d('Karambit', 'Doppler', 'FN', 19500, 0.5),
    ],
  },
  {
    id: 'asiimov', name: 'Asiimov Collection', price: 180, hue: 28, rarity: 'epic', image: 'case-asiimov',
    drops: [
      d('P90', 'Asiimov', 'FT', 135, 34),
      d('M4A4', 'Asiimov', 'FT', 1150, 26),
      d('AWP', 'Asiimov', 'FT', 1580, 20),
      d('AK-47', 'Asiimov', 'FT', 2100, 12),
      d('AWP', 'Hyper Beast', 'FT', 1250, 6),
      d('M9 Bayonet', 'Doppler', 'FN', 15500, 2),
    ],
  },
  {
    id: 'hyper', name: 'Hyper Beast', price: 140, hue: 290, rarity: 'rare', image: 'case-hyper',
    drops: [
      d('Nova', 'Hyper Beast', 'FT', 120, 34),
      d('M4A1-S', 'Hyper Beast', 'FT', 820, 28),
      d('AWP', 'Hyper Beast', 'FT', 1250, 20),
      d('AK-47', 'Bloodsport', 'FT', 1650, 12),
      d('Bayonet', 'Doppler', 'FN', 8200, 4.5),
      d('Butterfly Knife', 'Doppler', 'FN', 42000, 1.5),
    ],
  },
  {
    id: 'printstream', name: 'Printstream Case', price: 240, hue: 200, rarity: 'epic', tag: 'Hot', image: 'case-print',
    drops: [
      d('Desert Eagle', 'Printstream', 'FT', 890, 36),
      d('M4A1-S', 'Printstream', 'FT', 2800, 28),
      d('AK-47', 'Vulcan', 'FT', 3200, 18),
      d('AWP', 'Neo-Noir', 'FT', 1850, 11),
      d('Talon Knife', 'Doppler', 'FN', 12500, 5),
      d('Karambit', 'Fade', 'FN', 38500, 2),
    ],
  },
  {
    id: 'doppler', name: 'Doppler Knives', price: 980, hue: 265, rarity: 'legendary', image: 'case-doppler',
    drops: [
      d('Flip Knife', 'Doppler', 'FN', 5400, 30),
      d('Bayonet', 'Doppler', 'FN', 8200, 25),
      d('Nomad Knife', 'Doppler', 'FN', 9800, 18),
      d('M9 Bayonet', 'Doppler', 'FN', 15500, 14),
      d('Karambit', 'Doppler', 'FN', 19500, 9),
      d('Butterfly Knife', 'Doppler', 'FN', 42000, 4),
    ],
  },
  {
    id: 'fade', name: 'Fade Legends', price: 1450, hue: 320, rarity: 'legendary', tag: 'Premium', image: 'case-fade',
    drops: [
      d('Classic Knife', 'Fade', 'FN', 11200, 32),
      d('Skeleton Knife', 'Fade', 'FN', 28500, 24),
      d('Karambit', 'Fade', 'FN', 38500, 20),
      d('Butterfly Knife', 'Fade', 'FN', 48500, 14),
      d('Sport Gloves', "Pandora's Box", 'FT', 36500, 6),
      d('Moto Gloves', 'Spearmint', 'FT', 42000, 4),
    ],
  },
  {
    id: 'gloves', name: 'Glove Box', price: 720, hue: 40, rarity: 'epic', image: 'case-gloves',
    drops: [
      d('Hand Wraps', 'Cobalt Skulls', 'FT', 9800, 32),
      d('Bloodhound Gloves', 'Charred', 'FT', 12500, 26),
      d('Driver Gloves', 'King Snake', 'FT', 18500, 20),
      d('Specialist Gloves', 'Fade', 'FT', 34500, 14),
      d('Sport Gloves', "Pandora's Box", 'FT', 36500, 6),
      d('Moto Gloves', 'Spearmint', 'FT', 42000, 2),
    ],
  },
  {
    id: 'redline', name: 'Redline Case', price: 110, hue: 0, rarity: 'rare', image: 'case-redline',
    drops: [
      d('AK-47', 'Redline', 'FT', 480, 42),
      d('AK-47', 'Redline', 'MW', 820, 26),
      d('AK-47', 'Redline', 'FT', 1450, 14, true),
      d('AWP', 'Wildfire', 'FT', 3100, 10),
      d('Flip Knife', 'Doppler', 'FN', 5400, 6),
      d('Karambit', 'Doppler', 'FN', 19500, 2),
    ],
  },
  {
    id: 'howl', name: 'Howl Legacy', price: 3200, hue: 8, rarity: 'mythic', tag: 'Legendary', image: 'case-howl',
    drops: [
      d('Desert Eagle', 'Blaze', 'FN', 9800, 32),
      d('AK-47', 'Fire Serpent', 'FT', 18500, 26),
      d('Butterfly Knife', 'Fade', 'FN', 48500, 18),
      d('Karambit', 'Fade', 'FN', 38500, 14),
      d('M4A4', 'Howl', 'FT', 92000, 7),
      d('AWP', 'Dragon Lore', 'FT', 245000, 3),
    ],
  },
  {
    id: 'budget', name: 'Budget Box', price: 18, hue: 95, rarity: 'common', image: 'case-budget',
    drops: [
      d('P250', 'Sand Dune', 'FT', 3, 48),
      d('Tec-9', 'Fuel Injector', 'FT', 65, 28),
      d('Galil AR', 'Cerberus', 'FT', 95, 14),
      d('MAG-7', 'Justice', 'FT', 95, 7),
      d('Glock-18', 'Water Elemental', 'FT', 85, 3),
    ],
  },
  {
    id: 'neon', name: 'Neon Rider', price: 85, hue: 305, rarity: 'rare', image: 'case-neon',
    drops: [
      d('MAC-10', 'Neon Rider', 'FT', 280, 36),
      d('MP9', 'Hydra', 'FT', 190, 26),
      d('FAMAS', 'Mecha Industries', 'FT', 210, 18),
      d('SSG 08', 'Bloodshot', 'FT', 340, 12),
      d('M4A1-S', 'Player Two', 'FT', 390, 6),
      d('AK-47', 'Bloodsport', 'FT', 1650, 2),
    ],
  },
  {
    id: 'containment', name: 'Containment Breach', price: 420, hue: 175, rarity: 'epic', image: 'case-contain',
    drops: [
      d('AWP', 'Containment Breach', 'FT', 4200, 30),
      d('AWP', 'Neo-Noir', 'FT', 1850, 26),
      d('M4A1-S', 'Printstream', 'FT', 2800, 20),
      d('AK-47', 'Vulcan', 'FT', 3200, 14),
      d('M9 Bayonet', 'Doppler', 'FN', 15500, 7),
      d('Karambit', 'Doppler', 'FN', 19500, 3),
    ],
  },
  {
    id: 'skeleton', name: 'Skeleton Case', price: 1100, hue: 48, rarity: 'legendary', tag: 'Limited', image: 'case-skeleton',
    drops: [
      d('Paracord Knife', 'Marble Fade', 'FN', 8900, 32),
      d('Nomad Knife', 'Doppler', 'FN', 9800, 24),
      d('Classic Knife', 'Fade', 'FN', 11200, 18),
      d('Talon Knife', 'Doppler', 'FN', 12500, 12),
      d('Skeleton Knife', 'Fade', 'FN', 28500, 10),
      d('Butterfly Knife', 'Fade', 'FN', 48500, 4),
    ],
  },
  {
    id: 'wildfire', name: 'Wildfire Case', price: 210, hue: 22, rarity: 'epic', image: 'case-wildfire',
    drops: [
      d('AWP', 'Wildfire', 'FT', 3100, 28),
      d('AK-47', 'Asiimov', 'FT', 2100, 24),
      d('M4A4', 'Temukau', 'FT', 980, 20),
      d('Desert Eagle', 'Printstream', 'FT', 890, 16),
      d('Bayonet', 'Doppler', 'FN', 8200, 8),
      d('Karambit', 'Doppler', 'FN', 19500, 4),
    ],
  },
  {
    id: 'cz', name: 'CZ Victoria', price: 65, hue: 345, rarity: 'rare', image: 'case-cz',
    drops: [
      d('CZ75-Auto', 'Victoria', 'FT', 420, 32),
      d('Five-SeveN', 'Fairy Tale', 'FT', 210, 26),
      d('Dual Berettas', 'Melondrama', 'FT', 95, 20),
      d('USP-S', 'Kill Confirmed', 'FT', 420, 14),
      d('Desert Eagle', 'Printstream', 'FT', 890, 6),
      d('Flip Knife', 'Doppler', 'FN', 5400, 2),
    ],
  },
  {
    id: 'shotgun', name: 'Shotgun Party', price: 48, hue: 70, rarity: 'common', image: 'case-shotgun',
    drops: [
      d('Nova', 'Hyper Beast', 'FT', 120, 32),
      d('XM1014', 'Tranquility', 'FT', 280, 28),
      d('MAG-7', 'Justice', 'FT', 95, 20),
      d('Sawed-Off', 'The Kraken', 'FT', 180, 14),
      d('UMP-45', 'Primal Saber', 'FT', 160, 5),
      d('M4A1-S', 'Hyper Beast', 'FT', 820, 1),
    ],
  },
  {
    id: 'vulcan', name: 'Vulcan Strike', price: 340, hue: 145, rarity: 'epic', image: 'case-vulcan',
    drops: [
      d('AK-47', 'Vulcan', 'FT', 3200, 34),
      d('AK-47', 'Bloodsport', 'FT', 1650, 26),
      d('AK-47', 'Asiimov', 'FT', 2100, 18),
      d('AK-47', 'Fire Serpent', 'FT', 18500, 12),
      d('M9 Bayonet', 'Doppler', 'FN', 15500, 7),
      d('Karambit', 'Fade', 'FN', 38500, 3),
    ],
  },
  {
    id: 'lore', name: 'Dragon Lore Vault', price: 6500, hue: 42, rarity: 'mythic', tag: 'Mythic', image: 'case-lore',
    drops: [
      d('AK-47', 'Fire Serpent', 'FT', 18500, 28),
      d('Sport Gloves', "Pandora's Box", 'FT', 36500, 22),
      d('Karambit', 'Fade', 'FN', 38500, 18),
      d('Butterfly Knife', 'Fade', 'FN', 48500, 16),
      d('M4A4', 'Howl', 'FT', 92000, 10),
      d('AWP', 'Dragon Lore', 'FT', 245000, 6),
    ],
  },
  {
    id: 'night', name: 'Night Ops', price: 55, hue: 220, rarity: 'common', image: 'case-night',
    drops: [
      d('USP-S', 'Kill Confirmed', 'FT', 420, 30),
      d('P2000', 'Fire Elemental', 'FT', 160, 28),
      d('Glock-18', 'Water Elemental', 'FT', 85, 22),
      d('P90', 'Asiimov', 'FT', 135, 12),
      d('AK-47', 'Redline', 'FT', 480, 6),
      d('AWP', 'Asiimov', 'FT', 1580, 2),
    ],
  },
]

export function openCase(c: GameCase): CaseDrop {
  const roll = Math.random() * 100
  let acc = 0
  for (const drop of c.drops) {
    acc += drop.chance
    if (roll < acc) return drop
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
