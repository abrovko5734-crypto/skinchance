import { calcOdds, calcChainOdds, resolveRoll, secureRoll, type Odds, type Outcome } from '../lib/odds'
import { catalog } from './itemCatalog'
import type { Item } from './types'

export interface Step {
  stake: number
  target: number
  odds: Odds
  roll: number
  outcome: Outcome
  targetItem: Item
}

export interface UpgradeResult {
  outcome: Outcome
  roll: number
  odds: Odds
  source: Item
  target: Item
  first?: Item
  final?: Item
  steps: Step[]
}

export const MAX_CHAIN = 10

export interface UpgradeApi {
  perform(source: Item, target: Item): Promise<UpgradeResult>
}

export const upgradeApi: UpgradeApi = {
  async perform(source, target) {
    // Clover appear roll happens once inside calcOdds (random)
    let odds = calcOdds(source.price ?? 0, target.price ?? 0)
    if (!odds.valid) throw new Error('Цена цели должна быть выше цены предмета')

    const steps: Step[] = []
    let stake = source.price!
    let tPrice = target.price!
    let tItem = target
    let final: Item | undefined
    let chainLevel = -1

    for (let i = 0; i <= MAX_CHAIN; i++) {
      const roll = secureRoll()
      let outcome = resolveRoll(roll, odds)
      if (i === MAX_CHAIN && outcome === 'clover') outcome = 'win'

      steps.push({ stake, target: tPrice, odds, roll, outcome, targetItem: tItem })

      if (outcome === 'win') {
        final = tItem
        break
      }
      if (outcome === 'fail') break

      chainLevel = i
      stake = i === 0 ? tPrice * 2 : stake * 2
      tPrice = stake * 2
      tItem = await catalog.closest(tPrice, 0, tItem)
      odds = calcChainOdds(chainLevel, stake, tPrice)
    }

    await new Promise((r) => setTimeout(r, 80))

    const chained = steps.length > 1
    return {
      outcome: chained ? (final ? 'clover' : 'fail') : steps[0].outcome,
      roll: steps[0].roll,
      odds: steps[0].odds,
      source,
      target,
      first: chained ? steps[0].targetItem : undefined,
      final,
      steps,
    }
  },
}
