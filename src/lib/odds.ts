// Чистая математика. Не зависит от UI.
export interface OddsConfig {
  cloverChance: number
  cloverMultiplier: number
  minChance: number
  maxChance: number
  edge: number
}

/** Новые правила: Clover сектор = 20% на первом колесе.
 *  После попадания на Clover — следующее колесо со ставкой x2 и шансом ~50%,
 *  дальше шанс постепенно падает, чтобы не было бесконечных x20+. */
export const DEFAULT_ODDS: OddsConfig = {
  cloverChance: 20,
  cloverMultiplier: 2,
  minChance: 1,
  maxChance: 85,
  edge: 0.05,
}

export type Outcome = 'win' | 'clover' | 'fail'

export interface Odds {
  valid: boolean
  winChance: number
  cloverChance: number
  failChance: number
  totalWin: number
  cloverMultiplier: number
  cloverCeiling: number
  expectedReturn: number
  chainLevel?: number
}

const r2 = (n: number) => Math.round(n * 100) / 100
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))

/**
 * Основной расчёт шанса (первое колесо).
 * Clover фиксированно 20%.
 */
export function calcOdds(source: number, target: number, c: OddsConfig = DEFAULT_ODDS): Odds {
  const valid = source > 0 && target > source
  const win = valid
    ? r2(clamp((source / target) * 100 * (1 - c.edge), c.minChance, c.maxChance))
    : 0
  const clover = valid ? c.cloverChance : 0
  // Чтобы сумма не превышала 100
  const adjustedClover = Math.min(clover, r2(100 - win - 1))
  const ceiling = r2(target * c.cloverMultiplier)
  return {
    valid,
    winChance: win,
    cloverChance: adjustedClover,
    failChance: r2(100 - win - adjustedClover),
    totalWin: r2(win + adjustedClover),
    cloverMultiplier: c.cloverMultiplier,
    cloverCeiling: ceiling,
    expectedReturn: valid
      ? r2((win / 100) * target + (adjustedClover / 100) * ceiling)
      : 0,
  }
}

/**
 * Шанс для цепочки Clover.
 * level 0 = первое после clover → ~50%
 * дальше шанс уменьшается: 40 → 30 → 22 → 15 → 10 → 7 → 5
 */
export function calcChainOdds(level: number, stake: number, target: number): Odds {
  const chainWinChances = [50, 40, 30, 22, 15, 10, 7, 5]
  const winChance = chainWinChances[Math.min(level, chainWinChances.length - 1)]
  // На цепочке Clover-шанс маленький и тоже падает
  const cloverChance = Math.max(3, 12 - level * 2)
  const failChance = r2(100 - winChance - cloverChance)
  const ceiling = r2(target * 2)
  return {
    valid: true,
    winChance,
    cloverChance,
    failChance,
    totalWin: r2(winChance + cloverChance),
    cloverMultiplier: 2,
    cloverCeiling: ceiling,
    expectedReturn: r2((winChance / 100) * target + (cloverChance / 100) * ceiling),
    chainLevel: level,
  }
}

/** roll ∈ [0,100). Сектора: win → clover → fail. */
export function resolveRoll(roll: number, o: Odds): Outcome {
  if (roll < o.winChance) return 'win'
  if (roll < o.winChance + o.cloverChance) return 'clover'
  return 'fail'
}

export const sectorRanges = (o: Odds) =>
  ({
    win: [0, o.winChance * 3.6],
    clover: [o.winChance * 3.6, (o.winChance + o.cloverChance) * 3.6],
    fail: [(o.winChance + o.cloverChance) * 3.6, 360],
  }) as Record<Outcome, [number, number]>

export function secureRoll(): number {
  const a = new Uint32Array(1)
  crypto.getRandomValues(a)
  return (a[0] / 2 ** 32) * 100
}
