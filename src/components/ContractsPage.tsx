import { useMemo, useState } from 'react'
import { moneyDpUsd } from '../lib/storage'
import { sound } from '../lib/sound'
import { catalog } from '../services/itemCatalog'
import type { Entry, Item } from '../services/types'
import { ItemImage, Icon } from './ui'

interface Props {
  inventory: Entry[]
  onRemoveItems: (uids: string[]) => void
  onAddItem: (itemId: string) => void
  onContract?: () => void
  onToast: (m: string) => void
}

/** Контракт: от 3 до 10 любых скинов, редкость не ограничивает выбор. */

export function ContractsPage({ inventory, onRemoveItems, onAddItem, onContract, onToast }: Props) {
  const [selected, setSelected] = useState<string[]>([]) // uids
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Item | null>(null)

  const selectedEntries = useMemo(
    () => inventory.filter((e) => e.uid && selected.includes(e.uid)),
    [inventory, selected],
  )

  const canContract = selected.length >= 3 && selected.length <= 10 && selectedEntries.length === selected.length && selectedEntries.every((e) => (e.item.price ?? 0) > 0)

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

    // Выходной скин выбирается из всего каталога по стоимости внесённых предметов.
    const targetPrice = avgPrice * 1.15
    const candidates = await catalog.search({ text: '', category: 'all', weapon: '', rarity: '', wear: 'Factory New', special: 'all', min: null, max: null, sort: 'name' })
    let best: Item | undefined
    let bestDiff = Infinity
    // Получаем настоящие котировки небольшими пакетами, не подменяя их оценочными значениями.
    for (let i = 0; i < Math.min(candidates.length, 100); i += 20) {
      const batch = candidates.slice(i, i + 20).map((e) => e.item)
      await catalog.refreshPrices(batch)
      for (const item of batch) {
        if (item.price == null) continue
        const diff = Math.abs(item.price - targetPrice)
        if (diff < bestDiff) { bestDiff = diff; best = item }
      }
      if (best && bestDiff <= targetPrice * 0.08) break
    }
    if (!best) {
      onToast('Не удалось найти предмет для контракта')
      setBusy(false)
      return
    }
    // Повышенный шанс успеха
    const success = Math.random() < 0.85
    onRemoveItems(selected)
    setSelected([])
    if (success) {
      onAddItem(best.id)
      onContract?.()
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
        <p>Выберите от 3 до 10 любых скинов. Редкость и тип предметов могут отличаться.</p>
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
            {selected.length > 0 && <span className="rarity-badge">Любые скины</span>}
          </div>
          {selected.length > 0 && <div>Средняя цена рынка: {moneyDpUsd(avgPrice)}</div>}
          <button className="btn go" disabled={!canContract || busy} onClick={doContract}>
            {busy ? 'Контракт…' : `Создать контракт (${selected.length}/10)`}
          </button>
        </div>
      </div>

      {result && (
        <div className="contract-result">
          <h3>Результат</h3>
          <ItemImage item={result} size="lg" />
          <strong>{result.name}</strong>
          <span>{moneyDpUsd(result.price)}</span>
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
              <em>{moneyDpUsd(e.item.price)}</em>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
