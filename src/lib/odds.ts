// Чистая математика шансов апгрейда — повышенные шансы, house edge снижен
export interface OddsConfig {
  cloverSector: number // размер сектора Clover когда он активен
  cloverAppearChance: number // вероятность что Clover появится на колесе
  cloverMultiplier: number
  minChance: number
  maxChance: number
  edge: number
}

export const DEFAULT_ODDS: OddsConfig = {
  cloverSector: 8,
  cloverAppearChance: 100,
  cloverMultiplier: 2,
  minChance: 0.5,
  maxChance: 80,
  edge: 0.02, // 2% house edge — шансы выше
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

const r2 = (n: number) => Math.round(n * 10000) / 10000
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))

/**
 * Основной расчёт.
 * Clover появляется с вероятностью cloverAppearChance.
 * Если winChance < 3% — Clover запрещён.
 */
export function calcOdds(source: number, target: number, c: OddsConfig = DEFAULT_ODDS, forceClover?: boolean): Odds {
  const valid = source > 0 && target > source
  if (!valid) {
    return {
      valid: false,
      winChance: 0,
      cloverChance: 0,
      failChance: 100,
      totalWin: 0,
      cloverMultiplier: c.cloverMultiplier,
      cloverCeiling: 0,
      expectedReturn: 0,
      cloverActive: false,
    }
  }

  let win = r2(clamp((source / target) * 100 * (1 - c.edge), c.minChance, c.maxChance))

  const canHaveClover = win >= 3
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

/** Цепочка после Clover */
export function calcChainOdds(level: number, stake: number, target: number): Odds {
  const chainWin = [55, 42, 32, 24, 18, 12, 8, 5, 3, 2, 1, 0.5]
  const winChance = chainWin[Math.min(level, chainWin.length - 1)]
  const cloverChance = winChance >= 3 ? Math.max(2, 6 - level) : 0
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

export function targetForChance(source: number, chancePct: number, edge = DEFAULT_ODDS.edge): number {
  return r2((source * 100 * (1 - edge)) / Math.max(chancePct, 0.01))
}

export function targetForMult(source: number, mult: number): number {
  return r2(source * mult)
}
