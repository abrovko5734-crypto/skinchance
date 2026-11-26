import { useState } from 'react'
import { CASES, openCase, RARITY_LABEL, type GameCase, type CaseDrop } from '../services/cases'
import { money, moneyUsd } from '../lib/storage'
import { sound } from '../lib/sound'
import { catalog } from '../services/itemCatalog'
import type { Item } from '../services/types'
import { ItemImage, Icon } from './ui'

interface Props {
  balance: number
  onSpend: (amount: number) => Promise<boolean>
  onAddItem: (itemId: string, price?: number, item?: Item) => void
  onToast: (m: string) => void
}

export function CasesPage({ balance, onSpend, onAddItem, onToast }: Props) {
  const [selected, setSelected] = useState<GameCase | null>(null)
  const [opening, setOpening] = useState(false)
  const [result, setResult] = useState<{ drop: CaseDrop; item: Item | null } | null>(null)
  const [filter, setFilter] = useState<'all' | GameCase['rarity']>('all')

  const list = filter === 'all' ? CASES : CASES.filter((c) => c.rarity === filter)

  const doOpen = async (c: GameCase) => {
    if (opening) return
    if (c.price > balance) {
      onToast('Недостаточно DP. Пополнение: @Keldisqq')
      return
    }
    setOpening(true)
    sound.play('tick')
    const tickTimers = Array.from({ length: 6 }, (_, i) => window.setTimeout(() => sound.play('tick'), 550 + i * 560))
    const ok = await onSpend(-c.price)
    if (!ok) {
      tickTimers.forEach((timer) => window.clearTimeout(timer))
      setOpening(false)
      return
    }
    await new Promise((r) => setTimeout(r, 4200))
    const drop = openCase(c)
    const found = await catalog.byId(drop.itemId)
    if (found) await catalog.refreshPrices([found])
    const item: Item | null = found
      ? { ...found, price: found.price, priceSource: found.priceSource }
      : {
          id: drop.itemId,
          name: drop.itemId.replace(/\|/g, ' | ').replace(/-/g, ' '),
          weapon: drop.itemId.split('|')[0] ?? '',
          skin: drop.itemId.split('|')[1] ?? '',
          category: 'weapon',
          rarity: 'Covert',
          wear: 'Factory New',
          stattrak: false,
          souvenir: false,
          collection: '',
          image: null,
          price: null,
          priceSource: null,
        }
    tickTimers.forEach((timer) => window.clearTimeout(timer))
    setResult({ drop, item })
    onAddItem(item.id, item.price ?? undefined, item)
    sound.play((item.price ?? 0) > c.price * 2.5 ? 'win' : 'select')
    setOpening(false)
  }

  return (
    <div className="cases-page">
      <div className="cases-header">
        <h2>Кейсы</h2>
        <div className="cases-filters">
          {(['all', 'common', 'rare', 'epic', 'legendary', 'mythic'] as const).map((f) => (
            <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
              {f === 'all' ? 'Все' : RARITY_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="cases-grid">
        {list.map((c) => (
          <button
            key={c.id}
            className={`case-card rarity-${c.rarity}`}
            onClick={() => {
              setSelected(c)
              setResult(null)
              sound.play('select')
            }}
          >
            <div
              className="case-visual"
              style={{
                background: `linear-gradient(145deg, hsl(${c.hue} 48% 96%) 0%, hsl(${c.hue} 38% 88%) 50%, #e8f0e8 100%)`,
              }}
            >
              <div className="case-box">
                <div className="case-lid" style={{ borderColor: `hsl(${c.hue} 60% 45%)` }} />
                <div className="case-body" style={{ boxShadow: `inset 0 0 30px hsl(${c.hue} 40% 20% / 0.5)` }} />
              </div>
              {c.tag && <span className="case-tag">{c.tag}</span>}
            </div>
            <div className="case-info">
              <strong>{c.name}</strong>
              <span className="case-price">{money(c.price)}</span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal wide case-modal">
            <header>
              <h3>{selected.name}</h3>
              <button className="icon-btn" onClick={() => setSelected(null)} aria-label="Закрыть">
                <Icon n="x" />
              </button>
            </header>
            <div className="case-open-body">
              <div
                className={`case-preview ${opening ? 'opening' : ''}`}
                style={{
                  background: `linear-gradient(160deg, hsl(${selected.hue} 48% 96%), hsl(${selected.hue} 38% 86%))`,
                }}
              >
                <div className="case-box big">
                  <div className="case-lid" style={{ borderColor: `hsl(${selected.hue} 55% 50%)` }} />
                  <div className="case-body" />
                </div>
                <div className="case-price-big">{money(selected.price)}</div>
              </div>
              <div className="case-drops">
                <h4>Возможные дропы</h4>
                <div className="drops-list">
                  {selected.drops
                    .slice()
                    .sort((a, b) => b.price - a.price)
                    .map((d) => (
                      <div key={d.itemId} className="drop-row">
                        <span className="drop-id">{d.itemId.replace(/\|/g, ' | ').replace(/-/g, ' ')}</span>
                        <span className="drop-price">Шанс {d.chance}%</span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="case-actions">
                <button
                  className="btn go"
                  disabled={opening || selected.price > balance}
                  onClick={() => doOpen(selected)}
                >
                  {opening ? 'Открытие…' : `Открыть за ${money(selected.price)}`}
                </button>
              </div>
              {result && (
                <div className={`case-result ${(result.item?.price ?? 0) > selected.price * 2 ? 'big' : ''}`}>
                  <div className="result-label">Выпало</div>
                  {result.item ? (
                    <>
                      <ItemImage item={result.item} size="lg" />
                      <strong>{result.item.name}</strong>
                      <span className="result-price">{result.item?.price != null ? moneyUsd(result.item.price) : 'Нет данных рынка'}</span>
                    </>
                  ) : (
                    <strong>{result.drop.itemId}</strong>
                  )}
                  <button
                    className="btn"
                    onClick={() => {
                      setResult(null)
                      setSelected(null)
                    }}
                  >
                    В инвентарь
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
