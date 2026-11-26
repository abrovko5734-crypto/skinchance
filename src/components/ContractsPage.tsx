import { useMemo, useState } from 'react'
import { money } from '../lib/storage'
import { sound } from '../lib/sound'
import { catalog } from '../services/itemCatalog'
import type { Entry, Item } from '../services/types'
import { ItemImage, Icon } from './ui'

interface Props {
  inventory: Entry[]
  onRemoveItems: (uids: string[]) => void
  onAddItem: (itemId: string) => void
  onToast: (m: string) => void
}

/** Контракт: 10 предметов одной редкости → 1 предмет следующей редкости (упрощённо как CS trade-up) */
const RARITY_ORDER = ['Consumer Grade', 'Industrial Grade', 'Mil-Spec', 'Restricted', 'Classified', 'Covert', 'Extraordinary']

export function ContractsPage({ inventory, onRemoveItems, onAddItem, onToast }: Props) {
  const [selected, setSelected] = useState<string[]>([]) // uids
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Item | null>(null)

  const selectedEntries = useMemo(
    () => inventory.filter((e) => e.uid && selected.includes(e.uid)),
    [inventory, selected],
  )

  const rarity = selectedEntries[0]?.item.rarity
  const sameRarity = selectedEntries.every((e) => e.item.rarity === rarity)
  const canContract = selected.length === 10 && sameRarity && rarity && RARITY_ORDER.indexOf(rarity) < RARITY_ORDER.length - 1

  const avgPrice = selectedEntries.reduce((s, e) => s + (e.item.price ?? 0), 0) / Math.max(1, selectedEntries.length)

  const toggle = (uid: string) => {
    sound.play('select')
    setSelected((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : prev.length < 10 ? [...prev, uid] : prev))
  }

  const doContract = async () => {
    if (!canContract || busy) return
    setBusy(true)
    sound.play('tick')
    await new Promise((r) => setTimeout(r, 800))

    const nextRarity = RARITY_ORDER[RARITY_ORDER.indexOf(rarity!) + 1]
    // Цель: предмет следующей редкости ближе к avg * 1.1
    const targetPrice = avgPrice * 1.15
    const candidates = (await catalog.search({ text: '', category: 'all', weapon: '', rarity: nextRarity, wear: '', special: 'all', min: null, max: null, sort: 'price-asc' })).filter(
      (e) => (e.item.price ?? 0) > 0,
    )
    let best = candidates[0]?.item
    let bestDiff = Infinity
    for (const e of candidates) {
      const d = Math.abs((e.item.price ?? 0) - targetPrice)
      if (d < bestDiff) {
        bestDiff = d
        best = e.item
      }
    }
    if (!best) {
      onToast('Не удалось найти предмет для контракта')
      setBusy(false)
      return
    }
    // 70% шанс успеха (упрощённо)
    const success = Math.random() < 0.72
    onRemoveItems(selected)
    setSelected([])
    if (success) {
      onAddItem(best.id)
      setResult(best)
      sound.play('win')
      onToast(`Контракт успешен! Получен ${best.name}`)
    } else {
      sound.play('fail')
      onToast('Контракт провален — предметы уничтожены')
      setResult(null)
    }
    setBusy(false)
  }

  return (
    <div className="contracts-page">
      <div className="contracts-header">
        <h2>Контракты</h2>
        <p>Выберите 10 предметов одной редкости. Получите 1 предмет следующей редкости (~72% шанс).</p>
      </div>

      <div className="contract-panel">
        <div className="contract-slots">
          {Array.from({ length: 10 }).map((_, i) => {
            const e = selectedEntries[i]
            return (
              <div key={i} className={`slot ${e ? 'filled' : ''}`}>
                {e ? (
                  <>
                    <ItemImage item={e.item} size="sm" />
                    <button className="slot-x" onClick={() => toggle(e.uid!)}>
                      ×
                    </button>
                  </>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
            )
          })}
        </div>
        <div className="contract-meta">
          <div>
            Выбрано: <b>{selected.length}/10</b>
            {rarity && sameRarity && <span className="rarity-badge">{rarity}</span>}
            {!sameRarity && selected.length > 1 && <span className="warn">Разные редкости</span>}
          </div>
          {selected.length > 0 && <div>Средняя цена: {money(avgPrice)}</div>}
          <button className="btn go" disabled={!canContract || busy} onClick={doContract}>
            {busy ? 'Контракт…' : 'Заключить контракт'}
          </button>
        </div>
      </div>

      {result && (
        <div className="contract-result">
          <h3>Результат</h3>
          <ItemImage item={result} size="lg" />
          <strong>{result.name}</strong>
          <span>{money(result.price ?? 0)}</span>
          <button className="btn" onClick={() => setResult(null)}>
            OK
          </button>
        </div>
      )}

      <h3 className="inv-title">Ваш инвентарь</h3>
      <div className="inv-grid">
        {inventory.length === 0 && <p className="empty">Инвентарь пуст — откройте кейсы или выиграйте апгрейд</p>}
        {inventory.map((e) => (
          <button
            key={e.uid}
            className={`inv-card ${e.uid && selected.includes(e.uid) ? 'selected' : ''}`}
            onClick={() => e.uid && toggle(e.uid)}
          >
            <ItemImage item={e.item} size="sm" />
            <div className="inv-meta">
              <strong>{e.item.weapon}</strong>
              <span>{e.item.skin}</span>
              <em>{money(e.item.price ?? 0)}</em>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
