import { calcOdds, resolveRoll, secureRoll, type Odds, type Outcome } from '../lib/odds'
import { catalog } from './itemCatalog'
import type { Item } from './types'

/** Одно колесо цепочки: ставка → цель, шанс считается по ценам. */
export interface Step { stake: number; target: number; odds: Odds; roll: number; outcome: Outcome; targetItem: Item }
export interface UpgradeResult { outcome: Outcome; roll: number; odds: Odds; source: Item; target: Item; first?: Item; final?: Item; steps: Step[] }

/** Сколько колёс цепочки Clover возможно после первого (600→1200 … 4800→9600). */
export const MAX_CHAIN = 4

/**
 * ЛОКАЛЬНАЯ ДЕМО-РЕАЛИЗАЦИЯ. В продакшене perform() = POST /api/upgrade: все roll и цепочка определяются сервером,
 * клиент только анимирует steps.
 * Правила: колесо 1 — предмет → цель. Clover = приз x2 и новое колесо (ставка = удвоенный приз, цель = ставка x2).
 * На любом колесе: win — забираете цель этого колеса, fail — теряете всё, Clover — следующее колесо.
 * Clover на последнем колесе цепочки засчитывается как win (потолок).
 */
export interface UpgradeApi { perform(source: Item, target: Item): Promise<UpgradeResult> }
export const upgradeApi: UpgradeApi = {
  async perform(source, target) {
    let odds = calcOdds(source.price ?? 0, target.price ?? 0)
    if (!odds.valid) throw new Error('Цена цели должна быть выше цены предмета')
    const steps: Step[] = []
    let stake = source.price!, tPrice = target.price!, tItem = target, final: Item | undefined
    for (let i = 0; i <= MAX_CHAIN; i++) {
      const roll = secureRoll()
      let outcome = resolveRoll(roll, odds)
      if (i === MAX_CHAIN && outcome === 'clover') outcome = 'win'
      steps.push({ stake, target: tPrice, odds, roll, outcome, targetItem: tItem })
      if (outcome === 'win') { final = tItem; break }
      if (outcome === 'fail') break
      stake = i === 0 ? tPrice * 2 : stake * 2
      tPrice = stake * 2
      tItem = await catalog.closest(tPrice, 0, tItem)
      odds = calcOdds(stake, tPrice)
    }
    await new Promise(r => setTimeout(r, 150))
    const chained = steps.length > 1
    return { outcome: chained ? (final ? 'clover' : 'fail') : steps[0].outcome, roll: steps[0].roll, odds: steps[0].odds, source, target,
      first: chained ? steps[0].targetItem : undefined, final, steps }
  },
}
