// Чистая математика шансов апгрейда
export interface OddsConfig {
  cloverSector: number      // размер сектора Clover когда он активен (5%)
  cloverAppearChance: number // вероятность что Clover вообще появится на колесе (30%)
  cloverMultiplier: number
  minChance: number         // 0.01
  maxChance: number
  edge: number
}

export const DEFAULT_ODDS: OddsConfig = {
  cloverSector: 5,
  cloverAppearChance: 30,
  cloverMultiplier: 2,
  minChance: 0.01,
  maxChance: 90,
  edge: 0.08, // 8% house edge — шансы ниже
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
  cloverActive: boolean
  chainLevel?: number
}

const r2 = (n: number) => Math.round(n * 10000) / 10000 // точность до 0.01
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))

/**
 * Основной расчёт.
 * Clover появляется только с вероятностью cloverAppearChance (30%).
 * Если winChance < 5% — Clover запрещён.
 * Когда Clover активен — сектор 5%.
 */
export function calcOdds(source: number, target: number, c: OddsConfig = DEFAULT_ODDS, forceClover?: boolean): Odds {
  const valid = source > 0 && target > source
  if (!valid) {
    return {
      valid: false, winChance: 0, cloverChance: 0, failChance: 100,
      totalWin: 0, cloverMultiplier: c.cloverMultiplier, cloverCeiling: 0,
      expectedReturn: 0, cloverActive: false,
    }
  }

  let win = r2(clamp((source / target) * 100 * (1 - c.edge), c.minChance, c.maxChance))

  // Clover только если win >= 5% и выпал «появиться»
  const canHaveClover = win >= 5
  const cloverActive = canHaveClover && (forceClover ?? Math.random() * 100 < c.cloverAppearChance)
  const clover = cloverActive ? Math.min(c.cloverSector, r2(100 - win - 0.01)) : 0

  const ceiling = r2(target * c.cloverMultiplier)
  return {
    valid: true,
    winChance: win,
    cloverChance: clover,
    failChance: r2(100 - win - clover),
    totalWin: r2(win + clover),
    cloverMultiplier: c.cloverMultiplier,
    cloverCeiling: ceiling,
    expectedReturn: r2((win / 100) * target + (clover / 100) * ceiling),
    cloverActive,
  }
}

/** Цепочка после Clover: шанс падает, Clover редко */
export function calcChainOdds(level: number, stake: number, target: number): Odds {
  const chainWin = [45, 32, 22, 15, 10, 7, 4, 2.5, 1.5, 1, 0.5, 0.2]
  const winChance = chainWin[Math.min(level, chainWin.length - 1)]
  const cloverChance = winChance >= 5 ? Math.max(1, 4 - level) : 0
  const failChance = r2(100 - winChance - cloverChance)
  return {
    valid: true,
    winChance,
    cloverChance,
    failChance,
    totalWin: r2(winChance + cloverChance),
    cloverMultiplier: 2,
    cloverCeiling: r2(target * 2),
    expectedReturn: r2((winChance / 100) * target + (cloverChance / 100) * target * 2),
    cloverActive: cloverChance > 0,
    chainLevel: level,
  }
}

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

/** Быстрый пресет: target = source * mult или chance% */
export function targetForChance(source: number, chancePct: number, edge = DEFAULT_ODDS.edge): number {
  // win = (source/target)*100*(1-edge) => target = source*100*(1-edge)/chance
  return r2((source * 100 * (1 - edge)) / Math.max(chancePct, 0.01))
}

export function targetForMult(source: number, mult: number): number {
  return r2(source * mult)
}
