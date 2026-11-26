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
