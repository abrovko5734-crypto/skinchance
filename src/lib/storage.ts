export function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem('sc.' + key); return v ? (JSON.parse(v) as T) : fallback } catch { return fallback }
}
export function save(key: string, v: unknown) { try { localStorage.setItem('sc.' + key, JSON.stringify(v)) } catch { /* ignore */ } }
export const money = (n: number) => Math.round(n * 100).toLocaleString('ru-RU') + ' DP'
