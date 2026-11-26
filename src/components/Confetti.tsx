import { useMemo } from 'react'

/** Лёгкий конфетти-взрыв без canvas — CSS-трансформы, ~48 частиц. */
export function Confetti({ count = 48 }: { count?: number }) {
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = Math.random() * Math.PI * 2
        const d = 90 + Math.random() * 260
        const colors = ['#39ff80', '#27e66b', '#e4ae39', '#ffffff', '#7dffb0']
        return {
          id: i,
          x: Math.cos(a) * d,
          y: Math.sin(a) * d - 60,
          r: Math.random() * 720 - 360,
          s: 4 + Math.random() * 6,
          c: colors[i % colors.length],
          d: Math.random() * 0.15,
        }
      }),
    [count],
  )
  return (
    <div className="confetti" aria-hidden>
      {parts.map((p) => (
        <i
          key={p.id}
          style={{
            ['--x' as string]: `${p.x}px`,
            ['--y' as string]: `${p.y}px`,
            ['--r' as string]: `${p.r}deg`,
            ['--s' as string]: `${p.s}px`,
            ['--c' as string]: p.c,
            ['--d' as string]: `${p.d}s`,
          }}
        />
      ))}
    </div>
  )
}
