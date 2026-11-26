import { useMemo, useState } from 'react'
import { moneyUsd } from '../lib/storage'
import { sound } from '../lib/sound'
import { rarityColor, rarityRu, type Entry } from '../services/types'
import { ItemImage, Icon } from './ui'

interface Props {
  inventory: Entry[]
  onSell: (uid: string, price: number) => void
  onSellAll: () => void
  onToast: (m: string) => void
}

export function InventoryPage({ inventory, onSell, onSellAll, onToast }: Props) {
  const [q, setQ] = useState('')
  const total = useMemo(() => inventory.reduce((s, e) => s + (e.item.price ?? 0), 0), [inventory])
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return inventory
    return inventory.filter((e) => e.item.name.toLowerCase().includes(t) || e.item.weapon.toLowerCase().includes(t))
  }, [inventory, q])

  return (
    <div className="inventory-page">
      <div className="inv-header">
        <h2>Инвентарь</h2>
        <div className="inv-stats">
          <span>{inventory.length} предметов</span>
          <span className="total">{moneyUsd(total)}</span>
          <button className="btn" disabled={inventory.length === 0} onClick={() => { onSellAll(); sound.play('select'); onToast('Все предметы проданы') }}>
            Продать всё
          </button>
        </div>
      </div>
      <div className="search-bar">
        <Icon n="search" />
        <input placeholder="Поиск по инвентарю…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="inv-grid large">
        {filtered.length === 0 && <p className="empty">Пусто</p>}
        {filtered.map((e) => (
          <div key={e.uid} className="inv-card detail">
            <ItemImage item={e.item} size="md" />
            <div className="inv-meta">
              <strong>{e.item.name}</strong>
              <span className="rarity" style={{ color: rarityColor(e.item.rarity) }}>{rarityRu(e.item.rarity)}</span>
              <em>{moneyUsd(e.item.price)}</em>
              <button
                className="btn sell"
                onClick={() => {
                  if (e.uid) {
                    onSell(e.uid, e.item.price ?? 0)
                    sound.play('select')
                    onToast(`Продано за ${moneyUsd(e.item.price)}`)
                  }
                }}
              >
                Продать
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
