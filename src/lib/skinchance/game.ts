import { CASES, SKINS, SKIN_BY_ID, type GameCase, type Skin } from "@/data/catalog";

export type Outcome = "win" | "clover" | "fail";

export interface Odds {
  valid: boolean;
  winChance: number;
  cloverChance: number;
  failChance: number;
  success: number;
}

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const r2 = (n: number) => Math.round(n * 100) / 100;

export function unit(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

export function calcOdds(source: number, target: number): Odds {
  if (!(source > 0) || !(target > source)) {
    return { valid: false, winChance: 0, cloverChance: 0, failChance: 100, success: 0 };
  }
  const fair = clamp((source / target) * 100 * 0.92, 0.01, 75);
  const clover = fair >= 8 ? r2(Math.min(4, fair * 0.12)) : 0;
  const win = r2(Math.max(0.01, fair - clover));
  const success = r2(win + clover);
  return {
    valid: true,
    winChance: win,
    cloverChance: clover,
    failChance: r2(Math.max(0, 100 - success)),
    success,
  };
}

export function rollOutcome(odds: Odds): { roll: number; outcome: Outcome } {
  const roll = unit() * 100;
  if (roll < odds.winChance) return { roll, outcome: "win" };
  if (roll < odds.winChance + odds.cloverChance) return { roll, outcome: "clover" };
  return { roll, outcome: "fail" };
}

export function targetForChance(source: number, chancePct: number): number {
  return (source * 0.92) / Math.max(chancePct, 0.01) * 100;
}

export function closestSkin(ideal: number, minExclusive: number, exclude: string[] = []): Skin | null {
  const pool = SKINS.filter((s) => s.price > minExclusive && !exclude.includes(s.id));
  if (!pool.length) return null;
  pool.sort((a, b) => Math.abs(a.price - ideal) - Math.abs(b.price - ideal) || a.price - b.price);
  return pool[0] ?? null;
}

export function cloverReward(target: Skin): Skin {
  const ideal = target.price * 1.55;
  return closestSkin(ideal, target.price, [target.id]) ?? target;
}

export function rollCase(gameCase: GameCase): Skin {
  const ticket = unit() * 100;
  let acc = 0;
  for (const drop of gameCase.drops) {
    acc += drop.chance;
    if (ticket <= acc) return SKIN_BY_ID[drop.itemId] ?? SKINS[0];
  }
  const last = gameCase.drops[gameCase.drops.length - 1];
  return SKIN_BY_ID[last.itemId] ?? SKINS[0];
}

export function caseStrip(gameCase: GameCase, winner: Skin, length = 46, winIndex = 36): Skin[] {
  const drops = gameCase.drops.map((d) => SKIN_BY_ID[d.itemId]).filter(Boolean);
  const strip: Skin[] = [];
  for (let i = 0; i < length; i++) {
    if (i === winIndex) {
      strip.push(winner);
      continue;
    }
    strip.push(drops[Math.floor(unit() * drops.length)] ?? winner);
  }
  return strip;
}

export interface ContractResult {
  up: boolean;
  item: Skin;
  sum: number;
  factor: number;
}

export function resolveContract(inputs: Skin[]): ContractResult {
  const sum = inputs.reduce((s, i) => s + i.price, 0);
  const exclude = new Set(inputs.map((i) => i.id));
  const up = unit() < 0.46;
  const factor = up ? 1.2 + unit() * 2.2 : 0.22 + unit() * 0.62;
  const ideal = sum * factor;
  const pool = SKINS.filter((s) => {
    if (exclude.has(s.id)) return false;
    if (up) return s.price > sum * 1.05 && s.price < sum * 8;
    return s.price >= Math.max(1, Math.floor(sum * 0.08)) && s.price < sum * 0.94;
  });
  let item: Skin | null = null;
  if (pool.length) {
    const ranked = [...pool].sort((a, b) => Math.abs(a.price - ideal) - Math.abs(b.price - ideal));
    const band = ranked.slice(0, Math.min(4, ranked.length));
    item = band[Math.floor(unit() * band.length)] ?? ranked[0];
  } else {
    const rest = SKINS.filter((s) => !exclude.has(s.id)).sort((a, b) => a.price - b.price);
    if (up) item = [...rest].reverse().find((s) => s.price > sum) ?? rest[rest.length - 1] ?? inputs[0];
    else item = [...rest].reverse().find((s) => s.price < sum) ?? rest[0] ?? inputs[0];
  }
  const won = item ?? inputs[0];
  const actuallyUp = won.price > sum;
  return { up: actuallyUp, item: won, sum, factor: sum > 0 ? won.price / sum : 1 };
}

export function wearCode(wear: string): string {
  if (wear === "Factory New") return "FN";
  if (wear === "Minimal Wear") return "MW";
  if (wear === "Field-Tested") return "FT";
  if (wear === "Well-Worn") return "WW";
  return "BS";
}

export function rarityKey(rarity: string): string {
  return rarity.toLowerCase().replace(/[^a-z]+/g, "-");
}

export const RARITY_RU: Record<string, string> = {
  "Consumer Grade": "Ширпотреб",
  "Industrial Grade": "Промышленное",
  "Mil-Spec Grade": "Армейское",
  Restricted: "Запрещённое",
  Classified: "Засекреченное",
  Covert: "Тайное",
  Contraband: "Контрабанда",
  Extraordinary: "Экстраординарное",
};

export function floatFor(wear: string): number {
  const ranges: Record<string, [number, number]> = {
    "Factory New": [0.001, 0.07],
    "Minimal Wear": [0.07, 0.15],
    "Field-Tested": [0.15, 0.38],
    "Well-Worn": [0.38, 0.45],
    "Battle-Scarred": [0.45, 0.99],
  };
  const [a, b] = ranges[wear] ?? [0.15, 0.38];
  return a + unit() * (b - a);
}

export function caseById(id: string): GameCase | undefined {
  return CASES.find((c) => c.id === id);
}
