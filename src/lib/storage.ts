export function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem('sc.' + key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

export function save(key: string, v: unknown) {
  try {
    localStorage.setItem('sc.' + key, JSON.stringify(v))
  } catch { /* ignore */ }
}

export const money = (n: number) => {
  if (n == null || isNaN(n)) return '0 DP'
  const abs = Math.abs(n)
  const s =
    abs >= 1000
      ? abs.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
      : abs >= 10
        ? abs.toLocaleString('ru-RU', { maximumFractionDigits: 1 })
        : abs.toFixed(2)
  return (n < 0 ? '−' : '') + s + ' DP'
}

export const moneyShort = (n: number) => {
  if (n == null || isNaN(n)) return '0'
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

/* ===== DP economy =====
   1 DP = 0.50 UAH. При курсе ~41.5 UAH/USD → 1 USD ≈ 83 DP.
   Цены предметов внутри хранятся в USD (рынок Steam), в UI показываем DP. */
export const UAH_PER_DP = 0.5
export const UAH_PER_USD = 41.5
export const USD_TO_DP = Math.round(UAH_PER_USD / UAH_PER_DP) // 83

export const usdToDp = (usd: number) => Math.round(usd * USD_TO_DP)

/** Цена предмета в DP для отображения. null → '—' */
export const moneyDpUsd = (usd: number | null | undefined) =>
  usd == null || !Number.isFinite(usd) ? '—' : money(usdToDp(usd))

/** Гривневая стоимость DP-пакета */
export const uahOf = (dp: number) => dp * UAH_PER_DP
