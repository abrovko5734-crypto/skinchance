import { calcOdds, resolveRoll, secureRoll, type Odds, type Outcome } from '../lib/odds'
import { catalog } from './itemCatalog'
import type { Item } from './types'

export interface UpgradeResult { outcome: Outcome; roll: number; odds: Odds; source: Item; target: Item; first?: Item; final?: Item }

/**
 * ЛОКАЛЬНАЯ ДЕМО-РЕАЛИЗАЦИЯ. В продакшене perform() = POST /api/upgrade: roll/outcome/final определяет сервер,
 * клиент только отображает. UI зависит лишь от интерфейса UpgradeApi.
 */
export interface UpgradeApi { perform(source: Item, target: Item): Promise<UpgradeResult> }
export const upgradeApi: UpgradeApi = {
  async perform(source, target) {
    const odds = calcOdds(source.price ?? 0, target.price ?? 0)
    if (!odds.valid) throw new Error('Цена цели должна быть выше цены предмета')
    const roll = secureRoll(), outcome = resolveRoll(roll, odds)
    const res: UpgradeResult = { outcome, roll, odds, source, target }
    if (outcome === 'win') res.final = target
    if (outcome === 'clover') {
      res.first = target
      res.final = await catalog.closest(odds.cloverCeiling, target.price!, target)
    }
    await new Promise(r => setTimeout(r, 150))
    return res
  },
}
