// Чистая математика. Не зависит от UI. Всё, что видит пользователь, берётся отсюда же.
export interface OddsConfig { cloverChance: number; cloverMultiplier: number; minChance: number; maxChance: number; edge: number }
export const DEFAULT_ODDS: OddsConfig = { cloverChance: 20, cloverMultiplier: 2, minChance: 1, maxChance: 80, edge: 0.05 }
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
}
const r2 = (n: number) => Math.round(n * 100) / 100
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))

export function calcOdds(source: number, target: number, c: OddsConfig = DEFAULT_ODDS): Odds {
  const valid = source > 0 && target > source
  const win = valid ? r2(clamp((source / target) * 100 * (1 - c.edge), c.minChance, c.maxChance)) : 0
  const clover = valid ? c.cloverChance : 0
  const ceiling = r2(target * c.cloverMultiplier)
  return {
    valid, winChance: win, cloverChance: clover, failChance: r2(Math.max(0, 100 - win - clover)), totalWin: r2(win + clover),
    cloverMultiplier: c.cloverMultiplier, cloverCeiling: ceiling,
    expectedReturn: valid ? r2((win / 100) * target + (clover / 100) * ceiling) : 0,
  }
}
/** roll ∈ [0,100). Сектора идут по часовой от верхней точки: win → clover → fail. */
export function resolveRoll(roll: number, o: Odds): Outcome {
  if (roll < o.winChance) return 'win'
  if (roll < o.winChance + o.cloverChance) return 'clover'
  return 'fail'
}
export const sectorRanges = (o: Odds) => ({
  win: [0, o.winChance * 3.6], clover: [o.winChance * 3.6, (o.winChance + o.cloverChance) * 3.6], fail: [(o.winChance + o.cloverChance) * 3.6, 360],
}) as Record<Outcome, [number, number]>
export function secureRoll(): number {
  const a = new Uint32Array(1); crypto.getRandomValues(a); return (a[0] / 2 ** 32) * 100
}
