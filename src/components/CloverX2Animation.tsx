import { useEffect, useState } from 'react'
import { money } from '../lib/storage'
import type { Item } from '../services/types'
import { ItemImage } from './ui'

export function CloverX2Animation({ source, first, final, onDone }: { source: Item; first: Item; final: Item; onDone: () => void }) {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const t = [setTimeout(() => setStage(1), 1900), setTimeout(() => setStage(2), 3900), setTimeout(onDone, 6600)]
    return () => t.forEach(clearTimeout)
  }, [onDone])
  return (
    <div className="overlay clover-fx" role="dialog" aria-label="Clover x2">
      <button className="btn ghost skip" onClick={onDone}>SKIP</button>
      <div className={`fx-stage s${stage}`}>
        <div className="fx-burst">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ ['--a' as string]: `${i * (360 / 14)}deg`, ['--d' as string]: `${(i % 3) * 0.08}s` }} />)}</div>
        <img src="/clover.png" alt="" className="fx-clover" />
        {stage === 0 && <div className="fx-text"><small>LUCKY HIT</small><h2>CLOVER <span>x2</span></h2><p>DOUBLE UPGRADE</p></div>}
        {stage === 1 && <div className="fx-pair"><FxItem item={source} label="Исходный" /><span className="fx-arrow">→</span><FxItem item={first} label="Первое улучшение" /></div>}
        {stage === 2 && <div className="fx-final"><small>Второе улучшение</small><ItemImage item={final} size="lg" /><h3>{final.name}</h3><strong>{money(final.price ?? 0)}</strong></div>}
      </div>
    </div>
  )
}
const FxItem = ({ item, label }: { item: Item; label: string }) => (
  <div className="fx-item"><small>{label}</small><ItemImage item={item} size="md" /><b>{item.skin}</b><span>{money(item.price ?? 0)}</span></div>
)
