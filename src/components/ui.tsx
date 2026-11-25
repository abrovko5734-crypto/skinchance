import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { RARITY_COLOR, type Item } from '../services/types'
import { skinImageCandidates } from '../services/skinImages'

export function Clover({ size = 24, className = '', style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <img
      src="/clover.png"
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', ...style }}
      alt=""
      aria-hidden
    />
  )
}

const P: Record<string, string> = {
  search: 'M11 4a7 7 0 105 11.9l4.5 4.6 1.4-1.4-4.6-4.5A7 7 0 0011 4z',
  x: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  vol: 'M4 9v6h4l5 4V5L8 9H4zm12 0a4 4 0 010 6',
  mute: 'M4 9v6h4l5 4V5L8 9H4zm13 1l5 5m0-5l-5 5',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0',
  chev: 'M6 9l6 6 6-6',
  swap: 'M7 7h13l-3-3M17 17H4l3 3',
  refresh: 'M20 12a8 8 0 11-2.3-5.7M20 4v5h-5',
  check: 'M5 12l5 5 9-10',
}

export const Icon = ({ n, s = 18 }: { n: keyof typeof P; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={P[n]} />
  </svg>
)

/** Реальное фото скина с fallback по CDN */
export function ItemImage({ item, size = 'md' }: { item: Item; size?: 'sm' | 'md' | 'lg' }) {
  const candidates = skinImageCandidates({
    weapon: item.weapon,
    skin: item.skin,
    wear: item.wear,
    stattrak: item.stattrak,
    category: item.category,
    existing: item.image,
  })
  const [idx, setIdx] = useState(0)
  const [failed, setFailed] = useState(false)
  const c = RARITY_COLOR[item.rarity] ?? '#555'

  useEffect(() => {
    setIdx(0)
    setFailed(false)
  }, [item.id])

  const src = !failed && idx < candidates.length ? candidates[idx] : null

  return (
    <div className={`img img-${size}`} style={{ ['--rc' as string]: c }}>
      {src ? (
        <img
          src={src}
          alt={item.name}
          loading="lazy"
          draggable={false}
          onError={() => {
            if (idx + 1 < candidates.length) setIdx((i) => i + 1)
            else setFailed(true)
          }}
        />
      ) : (
        <div className="img-ph">
          <span>{item.weapon}</span>
          <small>{item.skin}</small>
        </div>
      )}
    </div>
  )
}

export const Tag = ({ children, tone }: { children: ReactNode; tone?: 'green' | 'gold' }) => (
  <span className={`tag ${tone ?? ''}`}>{children}</span>
)

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal aria-label={title}>
      <div className={`modal ${wide ? 'wide' : ''}`}>
        <header>
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <Icon n="x" />
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}
